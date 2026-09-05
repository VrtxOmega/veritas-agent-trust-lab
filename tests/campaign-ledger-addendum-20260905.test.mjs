import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = async (path) => JSON.parse(
  await readFile(new URL(path, import.meta.url), "utf8"),
);

test("September addendum counts authority replay external reproduction once", async () => {
  const baseline = await load("../evidence/campaign-ledgers-v2.json");
  const addendum = await load("../evidence/campaign-ledger-addendum-20260905.json");

  const event = addendum.qualifying_event_additions.find(
    (entry) => entry.subject_id === "msaleme/authority-execution-replay#1",
  );

  assert.ok(event);
  assert.equal(event.category, "substantive_external_review");
  assert.equal(event.category_group, "technical");
  assert.equal(event.actor.id, "github:msaleme");
  assert.equal(event.count_weight, 1);
  assert.equal(
    event.verification.immutable_ref,
    "a659492a8bb6fd335f0056176d252ebda875d62b",
  );
  assert.equal(
    event.verification.source_commit_evaluated,
    "ad0b7d66878111fa272a2c3fb6a26538e144b904",
  );
  assert.equal(
    event.verification.cross_evaluation_freeze_commit,
    "d232be9e0b0680acf49c2e2e9516e08102df3c52",
  );

  const priorMsaleme = baseline.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.actor.id === "github:msaleme" && entry.count_weight === 1,
  );
  assert.equal(priorMsaleme.length, 1);
  assert.equal(priorMsaleme.length + 1, 2, "individual cap must not be exceeded");

  assert.equal(addendum.current_totals.qualifying_events, 11);
  assert.equal(addendum.current_totals.distinct_independent_validators, 10);
  assert.equal(addendum.current_totals.unrelated_organizations_or_communities, 10);
  assert.equal(addendum.current_totals.technical_reproductions_reviews_or_integrations, 8);
});

test("author-side replay work cannot become independent verifier or hostile evidence", async () => {
  const addendum = await load("../evidence/campaign-ledger-addendum-20260905.json");
  const event = addendum.qualifying_event_additions[0];
  const authorSignal = addendum.nonqualifying_signal_additions.find(
    (entry) => entry.actor_id === "github:VrtxOmega",
  );

  assert.ok(authorSignal);
  assert.equal(authorSignal.count_weight, 0);
  assert.equal(
    addendum.current_totals.independent_verifier_runs_cross_evaluations_or_compatible_implementations,
    0,
  );
  assert.equal(addendum.current_totals.independently_proposed_or_executed_hostile_cases, 0);
  assert.match(event.does_not_establish.join(" "), /independent verifier run/i);
  assert.match(event.does_not_establish.join(" "), /hostile case/i);
});

test("external remediation preserves the unresolved wrong-target policy limit", async () => {
  const addendum = await load("../evidence/campaign-ledger-addendum-20260905.json");
  const event = addendum.qualifying_event_additions[0];

  assert.match(event.verification.open_residual, /wrong-target/i);
  assert.match(event.verification.open_residual, /machine-readable target policy/i);
  assert.equal(event.verification.external_owner_reported_regression_state.reported_total_passed, 72);
  assert.match(
    event.verification.external_owner_reported_regression_state.boundary,
    /maintainer-reported/i,
  );
});

test("Snyk follow-up continues the original lane once with no qualifying weight", async () => {
  const baseline = await load("../evidence/campaign-ledgers-v2.json");
  const addendum = await load("../evidence/campaign-ledger-addendum-20260905.json");
  const original = baseline.outreach_denominator_ledger.protocol_v2_records.filter(
    (entry) => entry.organization_id === "snyk-agent-scan",
  );
  const continuations = addendum.nonqualifying_signal_additions.filter(
    (entry) => entry.organization_id === "snyk-agent-scan",
  );
  assert.equal(original.length, 1);
  assert.equal(original[0].follow_up_at, null, "August baseline stays historical");
  assert.equal(continuations.length, 1);
  const continuation = continuations[0];
  assert.equal(continuation.private_evidence.original_message_and_thread_id, original[0].private_evidence.message_id);
  assert.equal(continuation.private_evidence.follow_up_message_id, "1a0726f9082d0eca");
  assert.equal(continuation.follow_up_allowance_consumed, true);
  assert.equal(continuation.follow_ups_used, 1);
  assert.equal(continuation.follow_ups_remaining, 0);
  assert.equal(continuation.status, "follow_up_sent_no_response_or_evaluation_established");
  assert.equal(continuation.count_weight, 0);
  assert.equal(new Set(addendum.nonqualifying_signal_additions.map((entry) => entry.id)).size,
    addendum.nonqualifying_signal_additions.length);
  assert.equal(addendum.qualifying_event_additions.some((entry) => entry.organization_id === "snyk-agent-scan"), false);
});

test("Agent Gate promise stays pinned and pending without changing campaign totals", async () => {
  const addendum = await load("../evidence/campaign-ledger-addendum-20260905.json");
  const followon = await load("../evidence/generalized-quorum-followon-20260905.json");
  const pending = followon.record.prospective_agent_gate_evaluation;
  assert.equal(followon.record.id, "VTL-V2-NQ-20260905-002");
  assert.equal(followon.record.count_weight, 0);
  assert.equal(pending.status, "promised_not_executed");
  assert.equal(pending.qualifies_now, false);
  assert.equal(pending.continuation.status, "pending_no_result_established");
  assert.equal(pending.continuation.count_weight, 0);
  assert.equal(pending.continuation.target_repository, "VrtxOmega/veritas");
  assert.equal(pending.continuation.target_commit, "256daeb85dae7ac004ae9893df858f58c87ec523");
  assert.equal(pending.continuation.evaluator_guide_commit, "0a3f789771c868649c7dc2730d94f1956822d141");
  assert.deepEqual(addendum.current_totals, {
    qualifying_events: 11,
    distinct_independent_validators: 10,
    unrelated_organizations_or_communities: 10,
    pre_reveal_blind_label_sets: 0,
    technical_reproductions_reviews_or_integrations: 8,
    structured_adopter_reports: 0,
    repeat_use_adopter_reports: 0,
    independently_proposed_or_executed_hostile_cases: 0,
    independent_verifier_runs_cross_evaluations_or_compatible_implementations: 0,
    settled_revenue_usd: "0.00",
  });
});
