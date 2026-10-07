import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);

async function fixture(t, failure) {
  const root = await mkdtemp(join(tmpdir(), "veritas-pages-failure-"));
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(join(root, "scripts"));
  await copyFile(
    new URL("../scripts/build-github-pages.mjs", import.meta.url),
    join(root, "scripts/build-github-pages.mjs"),
  );
  await writeFile(join(root, "package.json"), '{"type":"module"}\n');
  if (failure !== "missing client") {
    await mkdir(join(root, "dist/client/assets"), { recursive: true });
    await writeFile(join(root, "dist/client/assets/app.js"), "/* asset */\n");
    await writeFile(
      join(root, "dist/client/verification-packet.json"),
      failure === "invalid packet" ? "{" : '{"visual_asset":{"path":"/og.png"}}',
    );
  }
  await mkdir(join(root, "dist/server"), { recursive: true });
  await writeFile(
    join(root, "dist/server/index.js"),
    failure === "worker import"
      ? 'throw new Error("broken worker");'
      : `export default { fetch() { return new Response('<html><head></head><body>export</body></html>', { status: ${failure === "server render" ? 500 : 200} }); } };`,
  );
  const output = join(root, "export");
  await mkdir(output);
  await writeFile(join(output, "index.html"), "previous complete export\n");
  await writeFile(join(output, "stale.js"), "old asset\n");
  return { root, output };
}

for (const failure of ["missing client", "worker import", "server render", "invalid packet"]) {
  test(`Pages export preserves the previous artifact after ${failure} failure`, async (t) => {
    const { root, output } = await fixture(t, failure);
    await assert.rejects(run(process.execPath, ["scripts/build-github-pages.mjs", output], { cwd: root }));
    assert.equal(await readFile(join(output, "index.html"), "utf8"), "previous complete export\n");
    assert.equal(await readFile(join(output, "stale.js"), "utf8"), "old asset\n");
    assert.deepEqual((await readdir(root)).filter(name => name.startsWith(".veritas-pages-")), []);
  });
}

test("Pages export replaces a previous artifact only after preparing the complete new artifact", async (t) => {
  const { root, output } = await fixture(t);
  const previousMode = (await stat(output)).mode;
  await run(process.execPath, ["scripts/build-github-pages.mjs", output], { cwd: root });
  assert.equal((await stat(output)).mode, previousMode, "export directory keeps normal creation permissions");
  assert.match(await readFile(join(output, "index.html"), "utf8"), /<body>export<\/body>/);
  assert.equal(await readFile(join(output, "assets/app.js"), "utf8"), "/* asset */\n");
  assert.equal(await readFile(join(output, ".nojekyll"), "utf8"), "");
  const packet = JSON.parse(await readFile(join(output, "verification-packet.json"), "utf8"));
  assert.equal(packet.visual_asset.path, "/veritas-agent-trust-lab/og.png");
  assert.ok(!(await readdir(output)).includes("stale.js"));
  assert.deepEqual((await readdir(root)).filter(name => name.startsWith(".veritas-pages-")), []);
});

test("Pages export rejects destinations overlapping the project root or build inputs", async (t) => {
  const { root } = await fixture(t);
  for (const output of [root, join(root, "dist"), join(root, "dist/client/nested"), join(root, "dist/server")]) {
    await assert.rejects(
      run(process.execPath, ["scripts/build-github-pages.mjs", output], { cwd: root }),
      error => /overlaps the project or build inputs/.test(error.stderr),
    );
    assert.equal(await readFile(join(root, "package.json"), "utf8"), '{"type":"module"}\n');
    assert.equal(await readFile(join(root, "dist/client/assets/app.js"), "utf8"), "/* asset */\n");
  }
});
