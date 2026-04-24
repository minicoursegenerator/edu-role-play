#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { lintCommand } from "./commands/lint.js";
import { bundleCommand } from "./commands/bundle.js";
import { previewCommand } from "./commands/preview.js";
import { startCommand } from "./commands/start.js";

const program = new Command();
program
  .name("edu-role-play")
  .description("Author, lint, preview, and bundle edu-role-play compositions.")
  .version("0.1.0");

program
  .command("init")
  .description("Scaffold a composition HTML file from an archetype or blank template.")
  .argument("<name>", "name of the composition (file will be <name>.html)")
  .option("--archetype <id>", "archetype id to start from (e.g. skeptical-buyer)")
  .option("--force", "overwrite existing file", false)
  .action((name: string, opts) => {
    initCommand(name, opts);
  });

program
  .command("lint")
  .description("Validate a composition against DNA rules. Exits non-zero on error.")
  .argument("<file>", "path to the composition HTML file")
  .action((file: string) => {
    process.exit(lintCommand(file));
  });

program
  .command("bundle")
  .description("Inline the runtime into the composition, producing a self-contained HTML.")
  .argument("<file>", "path to the composition HTML file")
  .option("-o, --output <path>", "output path (default: <input>.bundled.html)")
  .option("--model <id>", "model id (default @cf/meta/llama-3.1-8b-instruct)")
  .option(
    "--gateway-url <url>",
    "MCG backend gateway URL (or set EDU_ROLE_PLAY_GATEWAY_URL); defaults to gateway.minicoursegenerator.com",
  )
  .option("--skip-lint", "skip lint check (not recommended)", false)
  .action((file: string, opts) => {
    process.exit(bundleCommand(file, opts));
  });

program
  .command("start")
  .description("Bundle a composition (if needed) and open it in the default browser.")
  .argument("<file>", "path to the composition HTML or a pre-bundled .bundled.html file")
  .option("-o, --output <path>", "bundle output path (default: <input>.bundled.html)")
  .option("--model <id>", "model id (default @cf/meta/llama-3.1-8b-instruct)")
  .option(
    "--gateway-url <url>",
    "MCG backend gateway URL (or set EDU_ROLE_PLAY_GATEWAY_URL)",
  )
  .option("--skip-lint", "skip lint check (not recommended)", false)
  .action((file: string, opts) => {
    process.exit(startCommand(file, opts));
  });

program
  .command("preview")
  .description("Serve a composition locally with the runtime inlined. Agent-friendly (no auto-open).")
  .argument("<file>", "path to the composition HTML file")
  .option("--port <n>", "port to listen on", "4310")
  .option("--provider <id>", "inference provider (cloudflare)", "cloudflare")
  .option("--api-key <key>", "API key (or set EDU_ROLE_PLAY_API_KEY)")
  .option("--account-id <id>", "Cloudflare account id (or set CLOUDFLARE_ACCOUNT_ID)")
  .option("--model <id>", "model id (default @cf/meta/llama-3.1-8b-instruct)")
  .action((file: string, opts) => {
    const code = previewCommand(file, opts);
    if (code !== 0) process.exit(code);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
