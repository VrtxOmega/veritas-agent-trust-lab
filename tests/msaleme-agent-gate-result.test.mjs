import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("received Agent Gate report supplements rather than rewrites pending history", async () => {
  const followon = await load("../evidence/generalized-quorum-followon-20260905.json");
  const record = followon.record;
  assert.equal(record.prospective_agent_gate_evaluation.continuation.checked_at, "2026-09-05T16:43:36Z");
  assert.equal(record.prospective_agent_gate_evaluation.continuation.status, "pending_no_result_established");
  assert.equal(record.current_evaluation_status, "external_report_received_and_project_reproduced");
  assert.equal(record.received_evaluations.length, 1);
  const received = record.received_evaluations[0];
  assert.equal(received.source_comment_id, "5554102070");
  assert.deepEqual(received.reported_result, { cases: 18, matching_outcomes: 17, mismatched_verdicts: 0, exceptions: 1 });
  assert.equal(received.target_commit, "256daeb85dae7ac004ae9893df858f58c87ec523");
  assert.equal(received.external_deliberate_wrong_result_calibration, "not_demonstrated_in_supplied_probe");
  assert.equal(received.project_reproduction.classification, "project_side_not_independent_external");
  assert.equal(received.project_reproduction.new_project_mutant_calibrations_detected, 2);
  assert.ok(Number.isFinite(Date.parse(received.recorded_at)));
  assert.ok(Date.parse(followon.as_of) >= Date.parse(received.recorded_at));
  assert.ok(Date.parse(received.recorded_at) >= Date.parse(received.source_created_at));
  assert.equal(received.report_sha256, "2561f3b4c6b71766d56d38ceedcc53ba2d84712837c28ce4040b9498a8e92c61");
  assert.equal(received.extracted_probe_sha256, "717d522609e794ad0074b90b4787ca4eaf0243ef362866a4e1753cf94f6e2c12");
});

test("completed capped-actor result does not inflate qualifying or verifier counts", async () => {
  const followon = await load("../evidence/generalized-quorum-followon-20260905.json");
  const addendum = await load("../evidence/campaign-ledger-addendum-20260905.json");
  const received = followon.record.received_evaluations;
  assert.equal(new Set(received.map((entry) => entry.dedupe_key)).size, received.length);
  assert.ok(received.every((entry) => entry.count_weight === 0));
  assert.equal(followon.record.count_weight, 0);
  assert.equal(addendum.current_totals.qualifying_events, 11);
  assert.equal(addendum.current_totals.technical_reproductions_reviews_or_integrations, 8);
  assert.equal(addendum.current_totals.distinct_independent_validators, 10);
  assert.equal(addendum.current_totals.independent_verifier_runs_cross_evaluations_or_compatible_implementations, 0);
  assert.equal(addendum.current_totals.independently_proposed_or_executed_hostile_cases, 0);
  assert.equal(addendum.current_totals.settled_revenue_usd, "0.00");
  assert.ok(addendum.qualifying_event_additions.every((entry) => !JSON.stringify(entry).includes("5554102070")));
});
