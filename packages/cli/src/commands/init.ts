import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CURRENT_RUNTIME_VERSION } from "@edu-role-play/core";
import { archetypesDir, blankTemplatePath } from "../paths.js";

interface InitOptions {
  archetype?: string;
  force?: boolean;
}

export function initCommand(name: string, opts: InitOptions) {
  // Source files use the `.erp` extension so editor / Claude Code app previews
  // don't auto-open the unbundled HTML. The bundled artifact users actually
  // open in a browser is `<name>.html` (produced by `bundle` / `start`).
  const hasKnownExt = /\.(erp|html)$/.test(name);
  const outPath = resolve(process.cwd(), hasKnownExt ? name : `${name}.erp`);
  const id = name.replace(/\.(erp|html)$/, "");
  if (existsSync(outPath) && !opts.force) {
    console.error(`Refusing to overwrite ${outPath}. Pass --force to replace.`);
    process.exit(1);
  }

  let source: string;
  if (opts.archetype) {
    const ap = resolve(archetypesDir(), `${opts.archetype}.html`);
    if (!existsSync(ap)) {
      console.error(`Unknown archetype: ${opts.archetype}. Looked in ${archetypesDir()}`);
      process.exit(1);
    }
    source = readFileSync(ap, "utf8");
  } else {
    source = readFileSync(blankTemplatePath(), "utf8");
  }

  const rendered = source
    .replace(/\{\{id\}\}/g, id)
    .replace(/\{\{runtimeVersion\}\}/g, CURRENT_RUNTIME_VERSION);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, rendered, "utf8");
  console.log(`Created ${outPath}`);
  console.log("Next: edit the composition, then run `edu-role-play lint` and `edu-role-play bundle`.");
}
