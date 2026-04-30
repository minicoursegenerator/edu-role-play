import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { platform } from "node:os";
import { bundleCommand } from "./bundle.js";

interface StartOptions {
  output?: string;
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

  // - `.erp` source         → bundle to `<name>.html`
  // - `.bundled.html`        → open as-is
  // - `.html`                → if a sibling `.erp` source exists, re-bundle
  //                            from the source; otherwise treat as a legacy
  //                            unbundled composition and bundle to
  //                            `<name>.bundled.html`. A bundled `.html` with
  //                            no sibling source is opened directly.
  let bundledPath: string;
  if (path.endsWith(".bundled.html")) {
    bundledPath = path;
  } else if (path.endsWith(".erp")) {
    const output = opts.output ?? path.replace(/\.erp$/, ".html");
    const code = bundleCommand(file, { ...opts, output });
    if (code !== 0) return code;
    bundledPath = resolve(process.cwd(), output);
  } else {
    const sourceErp = path.replace(/\.html$/, ".erp");
    if (existsSync(sourceErp)) {
      const output = opts.output ?? path;
      const code = bundleCommand(sourceErp, { ...opts, output });
      if (code !== 0) return code;
      bundledPath = resolve(process.cwd(), output);
    } else if (looksBundled(path)) {
      bundledPath = path;
    } else {
      const output = opts.output ?? path.replace(/\.html$/, ".bundled.html");
      const code = bundleCommand(file, { ...opts, output });
      if (code !== 0) return code;
      bundledPath = resolve(process.cwd(), output);
    }
  }

  openInBrowser(bundledPath);
  console.log(`Opened ${bundledPath}`);
  return 0;
}

function looksBundled(filePath: string): boolean {
  try {
    const head = readFileSync(filePath, "utf8").slice(0, 200_000);
    return /id=["']edu-role-play-config["']/.test(head);
  } catch {
    return false;
  }
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
