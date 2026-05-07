import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { parseComposition, lint, hasErrors } from "@edu-role-play/core";
import { runtimeIifePath } from "../paths.js";

interface PreviewOptions {
  port?: string;
  apiKey?: string;
  accountId?: string;
  model?: string;
  provider?: string;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export function previewCommand(file: string, opts: PreviewOptions): number {
  const path = resolve(process.cwd(), file);
  const html = readFileSync(path, "utf8");
  const comp = parseComposition(html);

  const issues = lint(comp);
  for (const issue of issues) {
    const tag = issue.severity === "error" ? "error" : "warn";
    console.log(`${path}: ${tag} ${issue.rule}: ${issue.message}`);
  }
  if (hasErrors(issues)) {
    console.error("Lint errors — preview aborted.");
    return 1;
  }

  const apiKey = opts.apiKey ?? process.env.EDU_ROLE_PLAY_API_KEY ?? "";
  const accountId = opts.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  if (!apiKey || !accountId) {
    console.error(
      "Preview requires --api-key / EDU_ROLE_PLAY_API_KEY and --account-id / CLOUDFLARE_ACCOUNT_ID.",
    );
    return 1;
  }
  const provider = opts.provider ?? "cloudflare";
  const model = opts.model ?? DEFAULT_MODEL;

  const port = Number(opts.port ?? "4310");
  const runtimeJs = readFileSync(runtimeIifePath(), "utf8");
  // In preview, route provider calls through this server so the browser
  // avoids Cloudflare's CORS block and the API key stays server-side.
  const config = {
    provider,
    apiKey: "",
    accountId,
    model,
    baseUrl: `http://localhost:${port}/__cf`,
  };
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c");
  const injection =
    `<script type="application/json" id="edu-role-play-config">${configJson}</script>\n` +
    `<script>${runtimeJs}</script>\n`;
  const body = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, () => `${injection}</body>`)
    : html + "\n" + injection;

  const server = createServer(async (req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(body);
      return;
    }
    if (req.url && req.url.startsWith("/__cf/")) {
      try {
        const upstream = "https://api.cloudflare.com" + req.url.slice("/__cf".length);
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const upstreamRes = await fetch(upstream, {
          method: req.method ?? "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        });
        const text = await upstreamRes.text();
        res.writeHead(upstreamRes.status, {
          "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        });
        res.end(text);
      } catch (err) {
        res.writeHead(502, { "content-type": "text/plain" });
        res.end(`proxy error: ${(err as Error).message}`);
      }
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });
  server.listen(port, () => {
    console.log(`Preview: http://localhost:${port}/`);
    console.log("Ctrl-C to stop.");
  });
  return 0;
}
