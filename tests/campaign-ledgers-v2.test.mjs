import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loadLedger = async () => JSON.parse(
  await readFile(
    new URL("../evidence/campaign-ledgers-v2.json", import.meta.url),
    "utf8",
  ),
);

test("records the Rask root-cause review once across balanced evidence ledgers", async () => {
  const ledger = await loadLedger();
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.subject_id === "rask-lang/rask#469",
  );
  const negative = ledger.negative_outcome_ledger.filter(
    (entry) => entry.subject_id === "rask-lang/rask#469",
  );
  const closed = ledger.closed_lane_ledger.filter(
    (entry) => entry.subject_id === "rask-lang/rask#469",
  );

  assert.equal(qualifying.length, 1);
  assert.equal(qualifying[0].category, "substantive_external_review");
  assert.equal(qualifying[0].count_weight, 1);
  assert.equal(qualifying[0].verification.immutable_ref, "5133606097");
  assert.equal(
    qualifying[0].dedupe_key,
    "github:dritory|substantive_external_review|rask-lang/rask#469",
  );
  assert.equal(negative.length, 1);
  assert.equal(negative[0].count_weight, 0);
  assert.equal(negative[0].related_qualifying_event_id, qualifying[0].id);
  assert.equal(closed.length, 1);
  assert.equal(closed[0].count_weight, 0);
  assert.equal(closed[0].related_qualifying_event_id, qualifying[0].id);
});

test("records the awesome-ai-security-tools curator merge once", async () => {
  const ledger = await loadLedger();
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.subject_id === "scadastrangelove/awesome-ai-security-tools#29",
  );
  const closed = ledger.closed_lane_ledger.filter(
    (entry) => entry.subject_id === "scadastrangelove/awesome-ai-security-tools#29",
  );

  assert.equal(qualifying.length, 1);
  assert.equal(qualifying[0].category, "catalog_curator_acceptance");
  assert.equal(qualifying[0].count_weight, 1);
  assert.equal(
    qualifying[0].verification.immutable_ref,
    "50751844162f3284e34b0aced3130516be45c53b",
  );
  assert.equal(
    qualifying[0].dedupe_key,
    "github:scadastrangelove|catalog_curator_acceptance|scadastrangelove/awesome-ai-security-tools#29",
  );
  assert.equal(closed.length, 1);
  assert.equal(closed[0].count_weight, 0);
  assert.equal(closed[0].related_qualifying_event_id, qualifying[0].id);
});

test("records the OpenGuardrails reply as zero-weight nonparticipation", async () => {
  const ledger = await loadLedger();
  const outreach = ledger.outreach_denominator_ledger.protocol_v2_records.filter(
    (entry) => entry.organization_id === "openguardrails",
  );
  const nonqualifying = ledger.nonqualifying_signal_ledger.protocol_v2_records.filter(
    (entry) => entry.organization_id === "openguardrails",
  );
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.organization_id === "openguardrails",
  );

  assert.equal(outreach.length, 1);
  assert.equal(outreach[0].status, "human_thanks_only_nonparticipation_reply_received");
  assert.equal(outreach[0].response_message_id, "19fb5fefdeca3706");
  assert.equal(outreach[0].count_weight, 0);
  assert.equal(nonqualifying.length, 1);
  assert.equal(nonqualifying[0].signal_type, "human_thanks_only_nonparticipation_reply");
  assert.equal(nonqualifying[0].verification.incoming_message_id, "19fb5fefdeca3706");
  assert.equal(nonqualifying[0].count_weight, 0);
  assert.equal(qualifying.length, 0);
});

test("recomputes Protocol v2 progress without moving untouched evidence minima", async () => {
  const ledger = await loadLedger();
  const progress = ledger.progress;
  const qualifyingCount =
    ledger.qualifying_event_ledger.historical_event_ids.length
    + ledger.qualifying_event_ledger.protocol_v2_events.reduce(
      (sum, entry) => sum + entry.count_weight,
      0,
    );

  assert.equal(qualifyingCount, 8);
  assert.equal(progress.qualifying_events, qualifyingCount);
  assert.equal(progress.distinct_independent_validators, 8);
  assert.equal(progress.unrelated_organizations_or_communities, 8);
  assert.equal(progress.technical_reproductions_reviews_or_integrations, 5);
  assert.equal(progress.maximum_single_category_share_basis_points, 3750);
  assert.equal(progress.negative_outcomes, ledger.negative_outcome_ledger.length);
  assert.equal(progress.closed_lanes, ledger.closed_lane_ledger.length);
  assert.equal(progress.pre_reveal_blind_label_sets, 0);
  assert.equal(progress.structured_adopter_reports, 0);
  assert.equal(progress.repeat_use_adopter_reports, 0);
  assert.equal(progress.independently_proposed_or_executed_hostile_cases, 0);
  assert.equal(
    progress.independent_verifier_runs_cross_evaluations_or_compatible_implementations,
    0,
  );
  assert.equal(progress.catalog_and_editorial_events, 3);
  assert.equal(progress.outreach_initial_contacts, 39);
  assert.equal(progress.outreach_follow_ups, 0);
  assert.equal(progress.settled_revenue_usd, "0.00");
  assert.deepEqual(progress.remaining, {
    qualifying_events: 42,
    distinct_independent_validators: 17,
    unrelated_organizations_or_communities: 2,
    pre_reveal_blind_label_sets: 15,
    technical_reproductions_reviews_or_integrations: 5,
    structured_adopter_reports: 5,
    repeat_use_adopter_reports: 2,
    independently_proposed_or_executed_hostile_cases: 5,
    independent_verifier_runs_cross_evaluations_or_compatible_implementations: 3,
    commercial_revenue_usd: "750.00",
  });
});
