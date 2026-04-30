import { writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { strToU8, zipSync } from "fflate";
import { buildBundledHtml, type BundleOptions } from "./bundle.js";

interface ScormOptions extends BundleOptions {
  title?: string;
}

export function scormCommand(file: string, opts: ScormOptions): number {
  const bundled = buildBundledHtml(file, { ...opts, scorm: true });
  if (!bundled) return 1;

  const stem = basename(file).replace(/\.(erp|html)$/, "");
  const id = safeId(bundled.id || stem);
  const title = opts.title?.trim() || bundled.id || stem;
  const manifest = buildManifest(id, title);
  const zip = zipSync({
    "index.html": strToU8(bundled.output),
    "imsmanifest.xml": strToU8(manifest),
  });

  const defaultOutput = bundled.path.replace(/(?:\.bundled)?\.(erp|html)$/i, ".scorm.zip");
  const outPath = resolve(process.cwd(), opts.output ?? defaultOutput);
  writeFileSync(outPath, Buffer.from(zip));
  console.log(`SCORM package ${bundled.path} → ${outPath}.`);
  return 0;
}

export function buildManifest(id: string, title: string): string {
  const identifier = `edu-role-play-${safeId(id)}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org-${escapeXml(identifier)}">
    <organization identifier="org-${escapeXml(identifier)}">
      <title>${escapeXml(title)}</title>
      <item identifier="item-${escapeXml(identifier)}" identifierref="res-${escapeXml(identifier)}">
        <title>${escapeXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-${escapeXml(identifier)}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html" />
    </resource>
  </resources>
</manifest>
`;
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "roleplay";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
