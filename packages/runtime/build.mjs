import { build } from "esbuild";

await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  globalName: "EduRolePlay",
  target: ["es2020"],
  minify: true,
  outfile: "dist/runtime.iife.js",
  legalComments: "none",
});

console.log("runtime built → dist/runtime.iife.js");
