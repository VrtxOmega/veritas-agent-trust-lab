import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the finished public lab", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /VERITAS Omega Agent Trust Lab/);
  assert.match(html, /A verdict is/);
  assert.match(html, /Take the blind challenge/);
  assert.match(html, /When the evaluation boundary became the attack surface/);
  assert.match(html, /No direct Internet access was not no path to the Internet/);
  assert.match(html, /One independent curator accepted the project/);
  assert.match(html, /Qualifying external acceptance: 1/);
  assert.match(html, /Agent Action Assurance/);
  assert.match(html, /execution_authorized/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("public source preserves commercial and assurance boundaries", async () => {
  const [page, layout, packageJson, packet, incident, distribution] = await Promise.all([
    readFile(new URL("../app/trust-lab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/verification-packet.json", import.meta.url), "utf8"),
    readFile(new URL("../evidence/EVALUATION_SANDBOX_ESCAPE_CASE_STUDY.md", import.meta.url), "utf8"),
    readFile(new URL("../evidence/DISTRIBUTION_EVIDENCE.md", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Not an independent audit/);
  assert.match(page, /Contribute publicly on GitHub/);
  assert.match(page, /\$750 fixed/);
  assert.match(page, /not a claim that VERITAS would have prevented/);
  assert.match(page, /not independent\s+validation of VERITAS/);
  assert.match(layout, /VERITAS Omega Agent Trust Lab/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packet, /"execution_authorized": false/);
  assert.match(incident, /VERITAS adoption determination: `INCONCLUSIVE`/);
  assert.match(incident, /do \*\*not\*\* independently validate VERITAS/i);
  assert.match(incident, /Why this is not a seventh blind-calibration case/);
  assert.match(distribution, /ONE SCOPED EXTERNAL ACCEPTANCE/);
  assert.match(distribution, /product efficacy.*remain `INCONCLUSIVE`/is);
  assert.match(distribution, /independent pre-reveal label sets: \*\*0\*\*/);
  assert.match(distribution, /Verified payments: \*\*\$0\*\*/);
});
