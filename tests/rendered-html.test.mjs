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
  const visibleHtml = html.replaceAll("<!-- -->", "");
  assert.match(visibleHtml, /VERITAS Omega Agent Trust Lab/);
  assert.match(visibleHtml, /A verdict is/);
  assert.match(visibleHtml, /Take the blind challenge/);
  assert.match(visibleHtml, /When the evaluation boundary became the attack surface/);
  assert.match(visibleHtml, /No direct Internet access was not no path to the Internet/);
  assert.match(visibleHtml, /Two independent curators accepted the project/);
  assert.match(visibleHtml, /FOUNDING 50 \/ VERIFIED/);
  assert.match(visibleHtml, /<strong>2<small>\/50<\/small><\/strong>/);
  assert.match(visibleHtml, /48 qualifying outside actions remain/);
  assert.match(visibleHtml, /Qualifying external acceptances:\s+2/s);
  assert.match(visibleHtml, /Agent Action Assurance/);
  assert.match(visibleHtml, /execution_authorized/i);
  assert.doesNotMatch(visibleHtml, /codex-preview|react-loading-skeleton|Starter Project/);
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
  assert.match(page, /UNVERIFIED_SELF_REPORTED/);
  assert.match(page, /does not count as independent validation/i);
  assert.match(page, /nothing leaves this page/i);
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
