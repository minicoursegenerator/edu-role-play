#!/usr/bin/env node
// One-shot patcher: injects the "not bundled yet" fallback notice + CSS
// into every archetype so raw composition files are self-explaining when
// opened directly in a browser. Idempotent — safe to re-run.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, "..", "skills", "edu-role-play", "archetypes");

const STYLE_BLOCK = `    <style>
      edu-role-play > :not([data-erp-fallback]) { display: none; }
      [data-erp-fallback].notice {
        display: block;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        max-width: 560px;
        margin: 60px auto;
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #fafafa;
        color: #111;
        line-height: 1.5;
      }
      [data-erp-fallback] h2 { margin: 0 0 8px 0; font-size: 18px; }
      [data-erp-fallback] code, [data-erp-fallback] pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
      }
      [data-erp-fallback] pre {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 10px 12px;
        overflow-x: auto;
      }
      [data-erp-fallback] p { margin: 8px 0; color: #374151; }
    </style>
  </head>`;

const FALLBACK_DIV = `      <div class="notice" data-erp-fallback>
        <h2>This role-play isn't bundled yet</h2>
        <p>You're looking at the source composition. Open a terminal in this folder and run:</p>
        <pre><code>npx edu-role-play start {{id}}.html</code></pre>
        <p>That bundles the role-play and opens the playable version in your browser.</p>
      </div>
`;

const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
let changed = 0;
for (const name of files) {
  const p = resolve(dir, name);
  let html = readFileSync(p, "utf8");
  if (html.includes("data-erp-fallback")) continue; // idempotent
  html = html.replace(/  <\/head>/, STYLE_BLOCK);
  html = html.replace(
    /<edu-role-play id="\{\{id\}\}" runtime-version="\{\{runtimeVersion\}\}">\n/,
    (m) => m + FALLBACK_DIV,
  );
  writeFileSync(p, html, "utf8");
  changed += 1;
  console.log(`patched ${name}`);
}
console.log(`${changed}/${files.length} archetypes patched.`);
