import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDir = resolve(
  process.argv[2] ?? `${projectRoot}/build/github-pages`,
);
const basePath = process.env.PAGES_BASE_PATH ?? "/veritas-agent-trust-lab";
const siteUrl = `https://vrtxomega.github.io${basePath}/`;

if (!basePath.startsWith("/") || basePath.endsWith("/")) {
  throw new Error("PAGES_BASE_PATH must start with / and must not end with /");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(resolve(projectRoot, "dist/client"), outputDir, { recursive: true });

const workerUrl = pathToFileURL(resolve(projectRoot, "dist/server/index.js"));
workerUrl.searchParams.set("pages-export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("http://localhost/"),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) {
  throw new Error(`Server render failed with status ${response.status}`);
}

let html = await response.text();
for (const path of [
  "/assets/",
  "/og.png",
  "/favicon.svg",
  "/verification-packet.json",
]) {
  html = html.replaceAll(path, `${basePath}${path}`);
}

html = html.replaceAll(
  `content="${basePath}/og.png"`,
  `content="${siteUrl}og.png"`,
);

html = html.replace(
  "</head>",
  `<link rel="canonical" href="${siteUrl}"/><meta property="og:url" content="${siteUrl}"/></head>`,
);

await Promise.all([
  writeFile(resolve(outputDir, "index.html"), html),
  writeFile(resolve(outputDir, "404.html"), html),
  writeFile(resolve(outputDir, ".nojekyll"), ""),
]);

const packetPath = resolve(outputDir, "verification-packet.json");
const packet = JSON.parse(await readFile(packetPath, "utf8"));
packet.public_url = siteUrl;
packet.visual_asset.path = `${basePath}/og.png`;
await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`);

process.stdout.write(
  `${JSON.stringify({
    output_dir: outputDir,
    base_path: basePath,
    public_url: siteUrl,
  })}\n`,
);
