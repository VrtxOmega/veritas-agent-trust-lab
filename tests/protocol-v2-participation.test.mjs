import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("hostile-case form keeps submissions in the external candidate corpus", async () => {
  const form = await load("../.github/ISSUE_TEMPLATE/new-attack.yml");
  for (const id of [
    "operation_class",
    "unsafe_confusion",
    "clean_fixture",
    "hostile_mutation",
    "expected_safe_outcome",
    "expected_reason",
    "rationale",
    "reproduction",
    "conflict_disclosures",
  ]) {
    assert.match(form, new RegExp(`\\n    id: ${id}\\n`));
  }
  assert.match(form, /external candidate corpus/);
  assert.match(form, /does not automatically\s+become a seventh canonical challenge case/is);
  assert.match(form, /not automatic validation or canonical challenge inclusion/);
});

test("adopter form requires the complete Protocol v2 workflow report", async () => {
  const form = await load("../.github/ISSUE_TEMPLATE/adopter-report.yml");
  for (const id of [
    "workflow",
    "proposed_operation",
    "evidence_available",
    "veritas_decision",
    "human_decision",
    "actual_outcome",
    "error_assessment",
    "useful",
    "failed",
    "would_use_again",
    "repeat_use",
    "conflict_disclosures",
  ]) {
    const section = form.split("\n  - type: ").find((value) =>
      value.includes(`\n    id: ${id}\n`),
    );
    assert.ok(section, `missing ${id}`);
    assert.match(section, /validations:\n      required: true/);
  }
  assert.match(form, /does not itself prove independence, adoption, efficacy/);
  assert.match(form, /not automatic validation, endorsement, certification, or payment/);
});
