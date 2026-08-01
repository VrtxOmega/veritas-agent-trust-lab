import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url));

test("external verification protocol pins the public contract and positive controls", async () => {
  const protocol = JSON.parse(
    await readFile(
      new URL("../protocol/external-verification-challenge-v1.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(protocol.status, "OPEN");
  assert.equal(protocol.execution_authorized, false);
  assert.match(protocol.reference_contract.commit, /^[0-9a-f]{40}$/);
  assert.equal(protocol.reference_contract.license, "MIT");
  assert.equal(protocol.full_v4_boundary.included, false);
  assert.equal(protocol.tracks.length, 3);

  for (const track of protocol.tracks) {
    assert.ok(track.positive_controls > 0, `${track.id} needs a positive control`);
    assert.ok(track.hostile_cases > 0, `${track.id} needs a hostile case`);
  }

  for (const artifact of protocol.reference_contract.artifacts) {
    const digest = createHash("sha256").update(await read(artifact.path)).digest("hex");
    assert.equal(digest, artifact.sha256, `${artifact.path} hash drifted`);
  }

  assert.equal(protocol.submission.automatic_validation_weight, 0);
  assert.match(protocol.submission.counting_rule, /remains uncounted/i);
  assert.ok(protocol.does_not_establish.includes("execution authority"));
});

test("public challenge requires implementation separation and honest reporting", async () => {
  const [guide, issueForm, readme, page] = await Promise.all([
    readFile(new URL("../docs/EXTERNAL_VERIFICATION_CHALLENGE.md", import.meta.url), "utf8"),
    readFile(new URL("../.github/ISSUE_TEMPLATE/external-verification.yml", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../app/trust-lab.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(guide, /Do not import, call, wrap, transpile, or vendor/i);
  assert.match(guide, /positive controls/i);
  assert.match(guide, /full-kernel V4 track requires/i);
  assert.match(guide, /A reproducible bypass is the most valuable result/i);
  assert.match(issueForm, /id: positive_controls/);
  assert.match(issueForm, /id: mismatches/);
  assert.match(issueForm, /id: disclosures/);
  assert.match(issueForm, /remains uncounted/i);
  assert.match(readme, /External Verification Challenge/);
  assert.match(page, /Check the checker/);
  assert.match(page, /template=external-verification\.yml/);
  assert.match(page, /public\s+demonstrator,\s+not\s+the\s+complete V4 kernel/i);
});
