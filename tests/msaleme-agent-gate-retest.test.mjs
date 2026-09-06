import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const FROZEN = "256daeb85dae7ac004ae9893df858f58c87ec523";
const REPAIRED = "92f7d9310d102a42941e55131ee869a04651590a";
const SOURCE = "5559674991";
const REPORT_HASH = "0e6f4f34e35fc9bbdac8f22af3734eea23502ec7b97080ed9a254c94bf8898ad";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const objectDigest = (value) => digest(JSON.stringify(value));
const load = async () => JSON.parse(await readFile(new URL("evidence/generalized-quorum-followon-20260905.json", ROOT), "utf8"));

// Evidence-record checks only. They do not establish that external execution occurred.
function validate(followon, source) {
  const record = followon.record;
  const entries = record.received_evaluations;
  assert.equal(record.id, "VTL-V2-NQ-20260905-002");
  assert.equal(record.current_evaluation_status, "second_external_evaluation_report_received");
  assert.equal(record.latest_evaluation_source_comment_id, SOURCE);
  assert.deepEqual(entries.map((e) => e.source_comment_id), ["5554102070", SOURCE]);
  assert.equal(objectDigest(entries[0]), "79ed60fca8a320786c24ab75187f9bbd79f767047f722a08e024ff86fdca73b3");
  assert.equal(objectDigest(record.prospective_agent_gate_evaluation), "62df571d6c6f74105209095a23650e8c4d14e70156f25b78d0897082d171c021");
  assert.equal(new Set(entries.map((e) => e.dedupe_key)).size, entries.length);
  assert.equal(record.count_weight, 0);
  assert.ok(entries.every((e) => e.count_weight === 0));
  const received = entries[1];
  assert.equal(received.report_sha256, REPORT_HASH);
  assert.equal(digest(source), REPORT_HASH);
  assert.equal(received.actor_id, "github:msaleme");
  assert.equal(received.reported_classification, "external, author-run; not independent validation of VERITAS");
  assert.equal(received.does_not_amend_previous_evaluation, true);
  assert.deepEqual(received.target_commits, { frozen: FROZEN, repaired: REPAIRED });
  assert.equal(received.evaluator_kit.commit, REPAIRED);
  assert.equal(received.evaluator_kit.role, "evaluation_tooling_separate_from_target_even_when_commit_equal");
  assert.equal(received.evaluator_kit.implementation_origin, "project_authored");
  assert.equal(received.evaluator_kit.reported_executor, "github:msaleme");
  assert.deepEqual(received.reported_original_probe_runs.map((r) => [r.target_commit, r.cases, r.matching_outcomes, r.mismatched_verdicts, r.exceptions]),
    [[FROZEN, 18, 17, 0, 1], [REPAIRED, 18, 17, 0, 1]]);
  assert.equal(received.reported_standalone_lifecycle.store_scope, "default store only");
  assert.deepEqual(received.reported_standalone_lifecycle.results.map((r) => [r.target_commit, r.acceptance_control, r.malformed_recheck, r.original_action_retry]),
    [[FROZEN, "SHADOW_ALLOW", "ValueError", "SHADOW_ALLOW"], [REPAIRED, "SHADOW_ALLOW", "ValueError", "DENY"]]);
  const kit = received.reported_external_kit_execution;
  assert.deepEqual(kit.stores, ["memory", "file"]);
  assert.deepEqual(kit.retry_results, { frozen: "SHADOW_ALLOW", repaired: "DENY" });
  assert.equal(kit.pytest_evaluation_tests_passed, 11);
  assert.equal(kit.pytest_subtests_passed, 18);
  assert.equal(kit.calibration.implementation_origin, "project_authored");
  assert.equal(kit.calibration.execution_actor, "github:msaleme");
  assert.equal(kit.calibration.execution_evidence, "reported_in_second_evaluation_not_retroactive_to_first");
  assert.equal(kit.calibration.detected_controls_per_target, 2);
  assert.equal(kit.calibration.observed_comparison, "MISMATCH");
  assert.equal(received.kit_pr_disposition.status, "offer_withdrawn_existing_functionality");
  for (const key of ["pending", "contribution_submitted", "project_rejection"]) {
    assert.equal(received.kit_pr_disposition[key], false);
  }
  for (const key of ["concurrency_tested", "all_canonicalization_errors_tested", "mid_commit_storage_failure_tested", "project_42_test_suite_reproduced", "raw_external_execution_logs_supplied", "standalone_lifecycle_probe_source_supplied", "current_intake_reran_specimens"]) {
    assert.equal(received.limitations[key], false, key);
  }
  assert.equal(received.limitations.floats_still_raise, true);
  assert.equal(received.limitations.command_excerpt_omits_required_output, true);
  assert.deepEqual(record.current_totals_unchanged, { qualifying_events: 11, technical_events: 8, distinct_validators: 10, unrelated_organizations_or_communities: 10, hostile_cases: 0, independent_verifier_runs: 0, settled_revenue_usd: "0.00" });
  const cutoff = Date.parse(followon.as_of);
  assert.ok(Number.isFinite(cutoff));
  for (const e of entries) {
    const times = [e.source_created_at, e.source_updated_at_at_capture, e.recorded_at].map(Date.parse);
    assert.ok(times.every(Number.isFinite));
    assert.ok(times[0] <= times[1] && times[1] <= times[2] && times[2] <= cutoff);
  }
}

const report = () => readFile(new URL("evidence/external/msaleme-agent-gate-20260906/report.md", ROOT));

test("second evaluation snapshot and separate target/kit roles validate", async () => {
  validate(await load(), await report());
});

test("source preservation guard rejects changed report bytes", async () => {
  const followon = await load();
  const source = await report();
  assert.throws(() => validate(followon, Buffer.concat([source, Buffer.from("\n")])), assert.AssertionError);
});

test("historical evaluation and pending snapshot cannot be relabelled", async () => {
  const original = await load();
  const source = await report();
  for (const mutate of [
    (r) => { r.received_evaluations[0].reported_result.matching_outcomes = 18; },
    (r) => { r.received_evaluations[0].external_deliberate_wrong_result_calibration = "passed"; },
    (r) => { r.prospective_agent_gate_evaluation.continuation.status = "completed"; },
  ]) {
    const changed = structuredClone(original);
    mutate(changed.record);
    assert.throws(() => validate(changed, source), assert.AssertionError);
  }
});

test("retest guard detects inflated counts, scope, attribution and revived PR offer", async () => {
  const original = await load();
  const source = await report();
  for (const mutate of [
    (e) => { e.count_weight = 1; },
    (e) => { e.evaluator_kit.commit = FROZEN; },
    (e) => { e.reported_original_probe_runs[1].matching_outcomes = 18; },
    (e) => { e.reported_standalone_lifecycle.results[1].original_action_retry = "SHADOW_ALLOW"; },
    (e) => { e.reported_external_kit_execution.pytest_evaluation_tests_passed = 29; },
    (e) => { e.reported_external_kit_execution.calibration.implementation_origin = "evaluator_authored"; },
    (e) => { e.kit_pr_disposition.pending = true; },
    (e) => { e.kit_pr_disposition.project_rejection = true; },
    (e) => { e.limitations.mid_commit_storage_failure_tested = true; },
    (e) => { e.limitations.project_42_test_suite_reproduced = true; },
  ]) {
    const changed = structuredClone(original);
    mutate(changed.record.received_evaluations[1]);
    assert.throws(() => validate(changed, source), assert.AssertionError);
  }
});

test("retest snapshot cutoff and deduplication guards can fail", async () => {
  const original = await load();
  const source = await report();
  for (const cutoff of ["invalid", "2026-09-05T19:29:24Z"]) {
    const changed = structuredClone(original);
    changed.as_of = cutoff;
    assert.throws(() => validate(changed, source), assert.AssertionError);
  }
  const duplicate = structuredClone(original);
  duplicate.record.received_evaluations.push(structuredClone(duplicate.record.received_evaluations[1]));
  assert.throws(() => validate(duplicate, source), assert.AssertionError);
});

test("original command omissions remain visible beside project-completed examples", async () => {
  const source = (await report()).toString("utf8");
  const note = await readFile(new URL("evidence/AGENT_GATE_EXTERNAL_RETEST_20260906.md", ROOT), "utf8");
  assert.ok(!source.includes("--output"));
  assert.ok(note.includes("--expected-float-retry SHADOW_ALLOW --output ../results/frozen.json"));
  assert.ok(note.includes("--expected-float-retry DENY --output ../results/repaired.json"));
  assert.match(note, /project-supplied completed examples/);
  assert.match(note, /not recovered command history/);
});
