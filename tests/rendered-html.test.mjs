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
  assert.match(visibleHtml, /manually send the private email commitment/);
  assert.match(visibleHtml, /Reveal privately \(weight 0\)/);
  assert.match(visibleHtml, /When the evaluation boundary became the attack surface/);
  assert.match(visibleHtml, /No direct Internet access was not no path to the Internet/);
  assert.match(visibleHtml, /Six independently attributable outside actions now qualify/);
  assert.match(visibleHtml, /FOUNDING 50 \/ VERIFIED/);
  assert.match(visibleHtml, /<strong>6<small>\/50<\/small><\/strong>/);
  assert.match(visibleHtml, /44 qualifying outside actions remain/);
  assert.match(visibleHtml, /Verified payment: \$0\.00/);
  assert.match(visibleHtml, /Qualifying external validations:\s+6/s);
  assert.match(visibleHtml, /Independent technical reproduction/);
  assert.match(visibleHtml, /Merged external integration/);
  assert.match(visibleHtml, /Trail of Bits maintainer review/);
  assert.match(visibleHtml, /freedesktop-rs approval/);
  assert.match(visibleHtml, /Agent Action Assurance/);
  assert.match(visibleHtml, /Inspect sample dossier/);
  assert.match(visibleHtml, /Machine-readable sample/);
  assert.match(visibleHtml, /Sample is illustrative, not client work/);
  assert.match(visibleHtml, /execution_authorized/i);
  assert.doesNotMatch(visibleHtml, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("public source preserves commercial and assurance boundaries", async () => {
  const [
    page,
    challengeLibrary,
    issueForm,
    layout,
    packageJson,
    packet,
    incident,
    distribution,
    sampleDossier,
    samplePacketSource,
  ] = await Promise.all([
    readFile(new URL("../app/trust-lab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/challenge-receipt.js", import.meta.url), "utf8"),
    readFile(new URL("../.github/ISSUE_TEMPLATE/blind-label-set.yml", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/verification-packet.json", import.meta.url), "utf8"),
    readFile(new URL("../evidence/EVALUATION_SANDBOX_ESCAPE_CASE_STUDY.md", import.meta.url), "utf8"),
    readFile(new URL("../evidence/DISTRIBUTION_EVIDENCE.md", import.meta.url), "utf8"),
    readFile(new URL("../public/founding-pilot-sample.md", import.meta.url), "utf8"),
    readFile(new URL("../public/founding-pilot-sample.json", import.meta.url), "utf8"),
  ]);
  const samplePacket = JSON.parse(samplePacketSource);
  assert.match(page, /Not an independent audit/);
  assert.match(page, /Commit labels publicly before reveal/);
  assert.match(page, /Reveal privately \(weight 0\)/);
  assert.match(page, /createBlindSubmissionUrl/);
  assert.doesNotMatch(page, /Score after reveal:/);
  assert.match(challengeLibrary, /template: "blind-label-set\.yml"/);
  assert.match(challengeLibrary, /challenge_version: CHALLENGE_ID/);
  assert.match(challengeLibrary, /commitment_id: commitment\.commitment_id/);
  assert.doesNotMatch(challengeLibrary, /params\.set\("score"/);
  assert.doesNotMatch(challengeLibrary, /params\.set\("total"/);
  assert.doesNotMatch(challengeLibrary, /params\.set\("body"/);
  assert.match(page, /UNVERIFIED_SELF_REPORTED/);
  assert.match(page, /does not count as independent validation/i);
  assert.match(
    page,
    /Your labels stay\s+on your device unless you explicitly submit them on GitHub or\s+manually send the private email commitment/i,
  );
  assert.match(page, /Email is private,\s+manually sent/i);
  assert.match(page, /discloses your email address to the\s+recipient/i);
  assert.match(page, /identity, independence evidence, and exact scope are verified/i);
  assert.match(challengeLibrary, /createBlindEmailSubmissionUrl/);
  assert.match(challengeLibrary, /Do not publish my email address or label set without my explicit consent/);
  assert.doesNotMatch(challengeLibrary, /^Score:/m);
  assert.doesNotMatch(challengeLibrary, /^Correct answer:/m);
  assert.match(page, /\$750 fixed/);
  assert.match(page, /founding-pilot-sample\.md/);
  assert.match(page, /founding-pilot-sample\.json/);
  assert.match(page, /not a claim that VERITAS would have prevented/);
  assert.match(page, /not independent\s+validation of VERITAS/);
  assert.match(layout, /VERITAS Omega Agent Trust Lab/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packet, /"execution_authorized": false/);
  assert.match(incident, /VERITAS adoption determination: `INCONCLUSIVE`/);
  assert.match(incident, /do \*\*not\*\* independently validate VERITAS/i);
  assert.match(incident, /Why this is not a seventh blind-calibration case/);
  assert.match(issueForm, /Submit this issue before using the reveal control/);
  assert.match(issueForm, /does not prove\s+independence, expertise, honesty/is);
  assert.match(issueForm, /id: commitment_id/);
  assert.match(distribution, /SIX SCOPED EXTERNAL ACTIONS/);
  assert.match(distribution, /product efficacy.*remain `INCONCLUSIVE`/is);
  assert.match(distribution, /independent pre-reveal label sets: \*\*0\*\*/);
  assert.match(distribution, /Verified payments: \*\*\$0\*\*/);
  assert.match(sampleDossier, /ILLUSTRATIVE_ONLY/);
  assert.match(sampleDossier, /not client work/i);
  assert.match(sampleDossier, /\*\*Execution authorized:\*\*\s+`false`/);
  assert.equal(samplePacket.status, "ILLUSTRATIVE_ONLY");
  assert.equal(samplePacket.not_client_work, true);
  assert.equal(samplePacket.independent_review, false);
  assert.equal(samplePacket.payment_evidence, false);
  assert.equal(samplePacket.execution_authorized, false);
  assert.equal(samplePacket.commercial_boundary.price_usd, 750);
  assert.equal(samplePacket.workflow.operations.length, 5);
  assert.equal(samplePacket.hostile_cases.length, 6);
});
