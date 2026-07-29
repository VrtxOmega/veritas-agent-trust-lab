import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const form = await readFile(
  new URL("../.github/ISSUE_TEMPLATE/blind-label-set.yml", import.meta.url),
  "utf8",
);
const challengeIds = [
  "forged_verdict",
  "parameter_swap",
  "nonce_replay",
  "correlated_quorum",
  "evidence_deletion",
  "silent_monitor",
];

test("blind-label form captures exactly six required allow/block choices", () => {
  const sections = form.split("\n  - type: ");
  const challengeSections = sections.filter((section) =>
    challengeIds.some((id) => section.includes(`\n    id: ${id}\n`)),
  );

  assert.equal(challengeSections.length, 6);
  for (const [index, id] of challengeIds.entries()) {
    assert.match(challengeSections[index], new RegExp(`\\n    id: ${id}\\n`));
    assert.match(challengeSections[index], /options: \["ALLOW", "BLOCK"\]/);
    assert.match(challengeSections[index], /validations:\n      required: true/);
  }
});

test("blind-label form preserves public consent and non-endorsement boundaries", () => {
  assert.match(form, /labels: \["calibration"\]/);
  assert.match(form, /before reading the source code or answer key/);
  assert.match(form, /public and attached to my GitHub identity/);
  assert.match(form, /participation, not endorsement or certification/);
  assert.match(form, /Correct and incorrect label sets are both useful/);
});
