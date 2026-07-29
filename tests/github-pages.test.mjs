import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("GitHub Pages export preserves interactive assets under the project path", async () => {
  const target = await mkdtemp(join(tmpdir(), "veritas-pages-test-"));
  try {
    await execFileAsync(
      process.execPath,
      ["scripts/build-github-pages.mjs", target],
      { cwd: new URL("..", import.meta.url) },
    );
    const [html, packet] = await Promise.all([
      readFile(join(target, "index.html"), "utf8"),
      readFile(join(target, "verification-packet.json"), "utf8"),
    ]);
    assert.match(html, /https:\/\/vrtxomega\.github\.io\/veritas-agent-trust-lab\//);
    assert.match(html, /\/veritas-agent-trust-lab\/assets\/index-/);
    assert.match(
      html,
      /content="https:\/\/vrtxomega\.github\.io\/veritas-agent-trust-lab\/og\.png"/,
    );
    assert.doesNotMatch(html, /(?:href|src)="\/assets\//);
    assert.match(packet, /"public_url": "https:\/\/vrtxomega\.github\.io\/veritas-agent-trust-lab\/"/);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
