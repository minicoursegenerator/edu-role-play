import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { proxyWorkerTemplateDir } from "../paths.js";
import { writeUserConfig } from "../config.js";
import { askSecret, confirm, select } from "../prompts.js";

type Provider = "workers-ai" | "anthropic" | "openai";

export interface DeployProxyOptions {
  provider?: string;
  nonInteractive?: boolean;
}

export async function deployProxyCommand(opts: DeployProxyOptions): Promise<number> {
  console.log("");
  console.log("◆ Deploy your edu-role-play proxy");
  console.log("  A Cloudflare Worker your learners' bundles will call.");
  console.log("");

  const provider = await resolveProvider(opts);
  if (!provider) return 1;

  let apiKey = "";
  if (provider !== "workers-ai") {
    apiKey = await resolveApiKey(provider, opts);
    if (!apiKey) return 1;
  }

  // Stage proxy-worker template into ~/.edu-role-play/proxy-worker so wrangler
  // has a stable working directory across runs (state, .wrangler cache, etc.).
  const workDir = join(homedir(), ".edu-role-play", "proxy-worker");
  const templateDir = proxyWorkerTemplateDir();
  if (!existsSync(templateDir)) {
    console.error(`Proxy-worker template missing at ${templateDir}.`);
    console.error("Run `npm run build -w edu-role-play` from the repo to populate templates.");
    return 1;
  }
  mkdirSync(workDir, { recursive: true });
  cpSync(templateDir, workDir, { recursive: true });
  console.log(`Staged proxy-worker → ${workDir}`);

  // Probe wrangler. Don't auto-login; tell the user to run it themselves so
  // the OAuth browser flow isn't fighting our stdin.
  const who = spawnSync("npx", ["--yes", "wrangler", "whoami"], {
    cwd: workDir,
    stdio: "pipe",
    encoding: "utf8",
  });
  if (who.status !== 0) {
    console.log("");
    console.log("Cloudflare login required.");
    if (opts.nonInteractive) {
      console.error("Re-run without --non-interactive, or run `npx wrangler login` first.");
      return 1;
    }
    const ok = await confirm("Run `npx wrangler login` now?", true);
    if (!ok) {
      console.error("Aborted. Run `npx wrangler login` and try again.");
      return 1;
    }
    const login = spawnSync("npx", ["--yes", "wrangler", "login"], {
      cwd: workDir,
      stdio: "inherit",
    });
    if (login.status !== 0) {
      console.error("wrangler login failed.");
      return 1;
    }
  }

  // Deploy.
  console.log("");
  console.log("Deploying Worker…");
  const deployOut = await runCapturingStdout("npx", ["--yes", "wrangler", "deploy"], workDir);
  if (deployOut.status !== 0) {
    console.error("wrangler deploy failed.");
    return 1;
  }
  const proxyUrl = extractWorkerUrl(deployOut.stdout) ?? extractWorkerUrl(deployOut.stderr);
  if (!proxyUrl) {
    console.error("Deploy succeeded but could not parse Worker URL from output.");
    console.error("Check the deploy log above; pass --proxy-url manually if needed.");
    return 1;
  }
  console.log(`Worker URL: ${proxyUrl}`);

  // Set BYO secret if applicable.
  if (provider === "anthropic" || provider === "openai") {
    const secretName = provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    console.log(`Setting ${secretName} as a Worker secret…`);
    const ok = await pipeSecret(secretName, apiKey, workDir);
    if (!ok) {
      console.error(`Failed to set ${secretName}. The Worker is deployed but will fall back to Workers AI until the secret is set.`);
      return 1;
    }
  }

  writeUserConfig({ proxyUrl, provider, deployedAt: new Date().toISOString() });
  console.log("");
  console.log("✔ Done.");
  console.log(`  Saved to ~/.edu-role-play/config.json`);
  console.log(`  Start and test with your key:`);
  console.log(`    npx edu-role-play start <your-roleplay>.html`);
  console.log(`  Or package as SCORM for your LMS:`);
  console.log(`    npx edu-role-play scorm <your-roleplay>.html`);
  console.log("");
  return 0;
}

async function resolveProvider(opts: DeployProxyOptions): Promise<Provider | null> {
  const fromFlag = normalizeProvider(opts.provider);
  if (fromFlag) return fromFlag;
  if (opts.nonInteractive) {
    console.error("--non-interactive requires --provider <workers-ai|anthropic|openai>");
    return null;
  }
  return select<Provider>(
    "Which provider should the Worker use?",
    [
      { value: "workers-ai", label: "Cloudflare Workers AI", hint: "free, no key, basic models" },
      { value: "anthropic", label: "Anthropic (BYO key)", hint: "Claude — recommended for role-play quality" },
      { value: "openai", label: "OpenAI (BYO key)", hint: "GPT models" },
    ],
    0,
  );
}

function normalizeProvider(value: string | undefined): Provider | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "workers-ai" || v === "anthropic" || v === "openai") return v;
  return null;
}

async function resolveApiKey(provider: Provider, opts: DeployProxyOptions): Promise<string> {
  const envName = provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) {
    console.log(`Using ${envName} from environment.`);
    return fromEnv;
  }
  if (opts.nonInteractive) {
    console.error(`--non-interactive requires ${envName} in env.`);
    return "";
  }
  const prefix = provider === "anthropic" ? "sk-ant-" : "sk-";
  const key = await askSecret(`Paste your ${provider} API key (${prefix}…):`);
  if (!key) {
    console.error("No key provided.");
    return "";
  }
  if (!key.startsWith(prefix)) {
    const ok = await confirm(`Key doesn't start with "${prefix}". Use it anyway?`, false);
    if (!ok) return "";
  }
  return key;
}

interface CapturedRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCapturingStdout(cmd: string, args: string[], cwd: string): Promise<CapturedRun> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      const s = chunk.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const s = chunk.toString();
      stderr += s;
      process.stderr.write(s);
    });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function extractWorkerUrl(text: string): string | null {
  const match = text.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/i);
  return match ? match[0] : null;
}

function pipeSecret(name: string, value: string, cwd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["--yes", "wrangler", "secret", "put", name], {
      cwd,
      stdio: ["pipe", "inherit", "inherit"],
    });
    child.stdin.write(value + "\n");
    child.stdin.end();
    child.on("close", (status) => resolve(status === 0));
  });
}

