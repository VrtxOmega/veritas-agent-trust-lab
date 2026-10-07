import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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

function contains(parent, child) {
  const path = relative(parent, child);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

const buildDir = resolve(projectRoot, "dist");
if (contains(outputDir, projectRoot) || contains(outputDir, buildDir) || contains(buildDir, outputDir)) {
  throw new Error("Pages output directory overlaps the project or build inputs");
}

async function prepareArtifact(target) {
  await cp(resolve(projectRoot, "dist/client"), target, { recursive: true });

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
    "/_next/",
    "/og.png",
    "/favicon.svg",
    "/verification-packet.json",
  ]) {
    html = html.replaceAll(path, `${basePath}${path}`);
  }

  for (const localOg of [
    `content="${basePath}/og.png"`,
    `content="http://localhost${basePath}/og.png"`,
    `content="http://localhost:3000${basePath}/og.png"`,
  ]) {
    html = html.replaceAll(localOg, `content="${siteUrl}og.png"`);
  }

  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${siteUrl}"/><meta property="og:url" content="${siteUrl}"/></head>`,
  );

  await Promise.all([
    writeFile(resolve(target, "index.html"), html),
    writeFile(resolve(target, "404.html"), html),
    writeFile(resolve(target, ".nojekyll"), ""),
  ]);

  const packetPath = resolve(target, "verification-packet.json");
  const packet = JSON.parse(await readFile(packetPath, "utf8"));
  packet.public_url = siteUrl;
  packet.visual_asset.path = `${basePath}/og.png`;
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`);
}

// Preserve the last artifact if copying, rendering, or packet preparation fails.
await mkdir(dirname(outputDir), { recursive: true });
const stagingDir = await mkdtemp(join(dirname(outputDir), ".veritas-pages-"));
try {
  await prepareArtifact(stagingDir);
  await rm(outputDir, { recursive: true, force: true });
  await rename(stagingDir, outputDir);
} finally {
  await rm(stagingDir, { recursive: true, force: true });
}

process.stdout.write(
  `${JSON.stringify({
    output_dir: outputDir,
    base_path: basePath,
    public_url: siteUrl,
  })}\n`,
);
