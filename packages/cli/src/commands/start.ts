import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { platform } from "node:os";
import { bundleCommand } from "./bundle.js";

interface StartOptions {
  output?: string;
  provider?: string;
  apiKey?: string;
  accountId?: string;
  model?: string;
  proxyUrl?: string;
  skipLint?: boolean;
}

export function startCommand(file: string, opts: StartOptions): number {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    return 1;
  }

  // If the caller passed a composition, bundle it first. If they already
  // passed a .bundled.html, skip bundling and just open it.
  let bundledPath: string;
  if (path.endsWith(".bundled.html")) {
    bundledPath = path;
  } else {
    const output = opts.output ?? path.replace(/\.html$/, ".bundled.html");
    const code = bundleCommand(file, { ...opts, output });
    if (code !== 0) return code;
    bundledPath = resolve(process.cwd(), output);
  }

  openInBrowser(bundledPath);
  console.log(`Opened ${bundledPath}`);
  return 0;
}

function openInBrowser(filePath: string): void {
  const p = platform();
  const fileUrl = `file://${filePath}`;
  let cmd: string;
  let args: string[];
  if (p === "darwin") {
    cmd = "open";
    args = [fileUrl];
  } else if (p === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", fileUrl];
  } else {
    cmd = "xdg-open";
    args = [fileUrl];
  }
  const child = spawn(cmd, args, { stdio: "ignore", detached: true });
  child.unref();
}
