import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { proxyWorkerTemplateDir } from "../paths.js";
import { writeUserConfig } from "../config.js";
import { askSecret, confirm, select } from "../prompts.js";

// Windows: `npx` and `wrangler` ship as `.cmd` shims. Modern Node
// (≥18.20.2 / 20.12.2 / 21.7.3, CVE-2024-27980 hardening) refuses to spawn
// `.cmd`/`.bat` files via `child_process.spawn` unless `shell: true` — the
// call exits with no useful output, which is exactly the "Could not run
// wrangler" failure mode reported on Windows even after `npm install -g
// wrangler`. Routing through cmd.exe via shell:true fixes that.
const SPAWN_SHELL = process.platform === "win32";

// Prefer a globally installed `wrangler` (faster, no npx round-trip) when
// one is on PATH. Fall back to `npx --yes wrangler` so first-time users
// without a global install still work.
function wranglerInvocation(extra: string[]): { cmd: string; args: string[] } {
  const direct = spawnSync("wrangler", ["--version"], {
    stdio: "ignore",
    shell: SPAWN_SHELL,
  });
  if (direct.status === 0) return { cmd: "wrangler", args: extra };
  return { cmd: "npx", args: ["--yes", "wrangler", ...extra] };
}

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

  // Make sure wrangler is actually fetchable before we try to use it. On a
  // fresh machine `npx --yes wrangler ...` has to download wrangler from npm
  // first; if that fetch fails (no network, corporate proxy, old Node, npx
  // cache permissions) the user sees our generic "wrangler login failed"
  // message even though wrangler never ran. Probing here gives us a focused
  // error and warms the npx cache so subsequent calls are fast.
  console.log("Checking wrangler…");
  const probeInvoke = wranglerInvocation(["--version"]);
  const probe = spawnSync(probeInvoke.cmd, probeInvoke.args, {
    cwd: workDir,
    stdio: "pipe",
    encoding: "utf8",
    shell: SPAWN_SHELL,
  });
  if (probe.status !== 0) {
    const detail = `${probe.stdout ?? ""}${probe.stderr ?? ""}`.trim();
    console.error("");
    console.error("Could not run wrangler. Common causes:");
    console.error("  • Node is too old (wrangler needs Node ≥ 18). Run `node -v` to check.");
    console.error("  • No network / npm registry blocked (corporate proxy, firewall).");
    console.error("  • Permission issue with the npx cache (~/.npm/_npx).");
    console.error("");
    console.error("Try one of:");
    console.error("  npm install -g wrangler          # install once, then re-run deploy-proxy");
    console.error("  npm config get registry          # confirm registry is reachable");
    if (detail) {
      console.error("");
      console.error("wrangler output:");
      console.error(detail);
    }
    return 1;
  }
  console.log(`  ${probe.stdout.trim() || "ok"}`);

  // Probe wrangler auth. Don't auto-login; tell the user to run it themselves
  // so the OAuth browser flow isn't fighting our stdin. wrangler whoami exits
  // 0 even when unauthenticated, so we also scan its output.
  const hasCfToken = !!(process.env.CLOUDFLARE_API_TOKEN?.trim() || process.env.CF_API_TOKEN?.trim());
  const whoInvoke = wranglerInvocation(["whoami"]);
  const who = spawnSync(whoInvoke.cmd, whoInvoke.args, {
    cwd: workDir,
    stdio: "pipe",
    encoding: "utf8",
    shell: SPAWN_SHELL,
  });
  const whoText = `${who.stdout ?? ""}\n${who.stderr ?? ""}`;
  const looksAuthed =
    hasCfToken ||
    /You are logged in/i.test(whoText) ||
    /associated with the email/i.test(whoText) ||
    /Account Name/i.test(whoText);
  if (who.status !== 0 || !looksAuthed) {
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
    const loginInvoke = wranglerInvocation(["login"]);
    const login = spawnSync(loginInvoke.cmd, loginInvoke.args, {
      cwd: workDir,
      stdio: "inherit",
      shell: SPAWN_SHELL,
    });
    if (login.status !== 0) {
      console.error("");
      console.error("wrangler login did not complete. Common causes:");
      console.error("  • Closed the browser tab before clicking Authorize.");
      console.error("  • Took too long to authorize (the local OAuth callback timed out).");
      console.error("  • Port 8976 is already in use (kill any leftover wrangler).");
      console.error("  • Behind a firewall / VPN blocking dash.cloudflare.com.");
      console.error("");
      console.error("Try again, or skip OAuth with an API token:");
      console.error("  export CLOUDFLARE_API_TOKEN=<token from dash.cloudflare.com → My Profile → API Tokens>");
      console.error("  npx edu-role-play deploy-proxy");
      return 1;
    }
  }

  // Deploy. Cloudflare requires the account to have a *.workers.dev subdomain
  // registered before any Worker can publish there. It's a one-time, account-
  // level setup the user must do in the dashboard. Detect that failure mode
  // and walk them through it instead of leaving them with a wrangler stack
  // trace.
  console.log("");
  console.log("Deploying Worker…");
  const deployInvoke = wranglerInvocation(["deploy"]);
  let deployOut = await runCapturingStdout(deployInvoke.cmd, deployInvoke.args, workDir);
  if (deployOut.status !== 0 && needsWorkersDevSubdomain(deployOut)) {
    const handled = await handleMissingSubdomain(deployOut, opts);
    if (!handled) return 1;
    console.log("");
    console.log("Retrying deploy…");
    deployOut = await runCapturingStdout(deployInvoke.cmd, deployInvoke.args, workDir);
  }
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
    const child = spawn(cmd, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: SPAWN_SHELL,
    });
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

function needsWorkersDevSubdomain(run: CapturedRun): boolean {
  const text = `${run.stdout}\n${run.stderr}`;
  return (
    /register a workers\.dev subdomain/i.test(text) ||
    /workers\/onboarding/i.test(text)
  );
}

function extractOnboardingUrl(run: CapturedRun): string | null {
  const text = `${run.stdout}\n${run.stderr}`;
  // wrangler prints `/workers/onboarding`, which currently 404s. The reliable
  // page is `/workers/subdomain` — Cloudflare auto-provisions a subdomain
  // (usually based on the account email's local part) the first time the user
  // visits it, so simply opening the page is often enough to unblock deploy.
  const m = text.match(/https:\/\/dash\.cloudflare\.com\/([a-f0-9]+)\/workers/i);
  if (m) return `https://dash.cloudflare.com/${m[1]}/workers/subdomain`;
  return null;
}

async function handleMissingSubdomain(
  run: CapturedRun,
  opts: DeployProxyOptions,
): Promise<boolean> {
  const onboardingUrl =
    extractOnboardingUrl(run) ?? "https://dash.cloudflare.com/?to=/:account/workers/subdomain";
  console.log("");
  console.log("Cloudflare needs a *.workers.dev subdomain on your account before any Worker can publish.");
  console.log("Cloudflare usually auto-suggests one based on your account email — opening the page below");
  console.log("often confirms / provisions it instantly. It's free and one-time.");
  console.log("");
  console.log(`Open: ${onboardingUrl}`);
  console.log("If the page already shows a subdomain, you're set — just come back here and press Y.");
  if (opts.nonInteractive) {
    console.error("Re-run after registering the subdomain (or without --non-interactive to be guided through it).");
    return false;
  }
  const opened = await tryOpenUrl(onboardingUrl);
  if (opened) {
    console.log("(Opened in your browser.)");
  } else {
    console.log("(Copy the URL above into your browser.)");
  }
  console.log("");
  const ok = await confirm(
    "Press Y once you've picked and saved a subdomain to retry deploy.",
    true,
  );
  if (!ok) {
    console.error("Aborted. Re-run `npx edu-role-play deploy-proxy` after registering the subdomain.");
    return false;
  }
  return true;
}

function tryOpenUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const platform = process.platform;
    let cmd: string;
    let args: string[];
    if (platform === "darwin") {
      cmd = "open";
      args = [url];
    } else if (platform === "win32") {
      cmd = "cmd";
      args = ["/c", "start", "", url];
    } else {
      cmd = "xdg-open";
      args = [url];
    }
    try {
      const child = spawn(cmd, args, { stdio: "ignore", detached: true });
      child.on("error", () => resolve(false));
      child.on("spawn", () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}

function pipeSecret(name: string, value: string, cwd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const invoke = wranglerInvocation(["secret", "put", name]);
    const child = spawn(invoke.cmd, invoke.args, {
      cwd,
      stdio: ["pipe", "inherit", "inherit"],
      shell: SPAWN_SHELL,
    });
    if (!child.stdin) {
      resolve(false);
      return;
    }
    child.stdin.write(value + "\n");
    child.stdin.end();
    child.on("close", (status) => resolve(status === 0));
  });
}

