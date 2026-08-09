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

test("records the RCL fixture-contract owner review once without calling it a verifier run", async () => {
  const ledger = await loadLedger();
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.subject_id === "msaleme/red-team-blue-team-agent-fabric#304",
  );
  const nonqualifying = ledger.nonqualifying_signal_ledger.protocol_v2_records.filter(
    (entry) => entry.subject_id === "msaleme/red-team-blue-team-agent-fabric#304",
  );

  assert.equal(qualifying.length, 1);
  assert.equal(qualifying[0].category, "substantive_external_review");
  assert.equal(qualifying[0].category_group, "technical");
  assert.equal(qualifying[0].count_weight, 1);
  assert.equal(qualifying[0].verification.immutable_ref, "5153257172");
  assert.equal(
    qualifying[0].dedupe_key,
    "github:msaleme|substantive_external_review|msaleme/red-team-blue-team-agent-fabric#304",
  );
  assert.match(
    qualifying[0].does_not_establish.join(" "),
    /independent verifier run/,
  );
  assert.equal(
    qualifying[0].verification.upstream_resolution.correction_merge_commit,
    "70a38a86dcfa65b66f04c5655c3c8244fec838fe",
  );
  const followOn = qualifying[0].verification.upstream_resolution.follow_on_impact;
  assert.equal(followOn.source_comment_id, "5159003936");
  assert.deepEqual(
    followOn.merged_pull_requests.map((entry) => entry.pull_request),
    [
      "msaleme/red-team-blue-team-agent-fabric#310",
      "msaleme/red-team-blue-team-agent-fabric#311",
      "msaleme/red-team-blue-team-agent-fabric#312",
    ],
  );
  assert.equal(followOn.discovery_response.source_comment_id, "5159349132");
  const discoveryImpact = followOn.discovery_and_oracle_impact;
  assert.equal(discoveryImpact.source_comment_id, "5159760228");
  assert.equal(discoveryImpact.no_reply_requested, true);
  assert.equal(
    discoveryImpact.repository_discovery_metadata.recovered_query,
    "agent security benchmark in:name,description stars:>20 pushed:>2026-06-01",
  );
  assert.match(
    discoveryImpact.repository_discovery_metadata.current_description,
    /603 security tests/,
  );
  assert.equal(
    discoveryImpact.dgb_portable_bundle.initial_packaging_commit,
    "b79e3f3eee9a664a963135a89fe873d9dcf9899c",
  );
  assert.deepEqual(discoveryImpact.dgb_portable_bundle.declared_counts, {
    cases: 52,
    tool_entries: 85,
  });
  assert.equal(discoveryImpact.acknowledgement.reaction_id, "391704787");
  assert.equal(discoveryImpact.acknowledgement.written_reply, false);
  assert.equal(discoveryImpact.acknowledgement.count_weight, 0);
  assert.equal(nonqualifying.length, 1);
  assert.equal(
    nonqualifying[0].signal_type,
    "same_actor_same_subject_upstream_resolution",
  );
  assert.equal(nonqualifying[0].count_weight, 0);
  assert.equal(nonqualifying[0].related_qualifying_event_id, qualifying[0].id);
  assert.deepEqual(nonqualifying[0].verification.follow_on_pull_requests, [
    "msaleme/red-team-blue-team-agent-fabric#310",
    "msaleme/red-team-blue-team-agent-fabric#311",
    "msaleme/red-team-blue-team-agent-fabric#312",
  ]);
  assert.equal(nonqualifying[0].verification.final_source_comment_id, "5159760228");
  assert.equal(nonqualifying[0].verification.repository_description_verified, true);
  assert.deepEqual(nonqualifying[0].verification.dgb_bundle_paths, [
    "fixtures/dgb/README.md",
    "fixtures/dgb/dgb-corpus-bundle.v1.json",
  ]);
  assert.equal(nonqualifying[0].verification.author_acknowledgement_reaction_id, "391704787");
  assert.equal(
    discoveryImpact.repository_accuracy_sweep.merge_commit,
    "19dbfb871d1379a42bbfa22fa06bb2edda58a2c0",
  );
  assert.equal(
    discoveryImpact.repository_accuracy_sweep.permanent_credit.path,
    "README.md",
  );
  assert.equal(
    nonqualifying[0].verification.repository_accuracy_sweep_pr,
    "msaleme/red-team-blue-team-agent-fabric#323",
  );
  assert.equal(
    nonqualifying[0].verification.permanent_credit_path,
    "README.md#independent-reproduction",
  );
});

test("counts the merged GitHub Copilot skill as one accepted integration", async () => {
  const ledger = await loadLedger();
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.subject_id === "github/awesome-copilot#2476",
  );

  assert.equal(qualifying.length, 1);
  assert.equal(qualifying[0].category, "accepted_external_integration");
  assert.equal(qualifying[0].category_group, "technical");
  assert.equal(qualifying[0].actor.id, "github:aaronpowell");
  assert.equal(qualifying[0].verification.approved_by, "aaronpowell");
  assert.equal(qualifying[0].verification.merged_by, "aaronpowell");
  assert.equal(
    qualifying[0].verification.immutable_ref,
    "f83a8a942cfeaec67a6159d10e92bcfcc2d7f683",
  );
  assert.deepEqual(qualifying[0].verification.changed_files, [
    "skills/verify-agent-action/SKILL.md",
    "docs/README.skills.md",
  ]);
  assert.equal(
    qualifying[0].verification.install_command,
    "gh skills install github/awesome-copilot verify-agent-action",
  );
  assert.match(
    qualifying[0].does_not_establish.join(" "),
    /certification or endorsement/i,
  );
  assert.equal(
    qualifying[0].dedupe_key,
    "github:aaronpowell|accepted_external_integration|github/awesome-copilot#2476",
  );
  assert.equal(qualifying[0].count_weight, 1);
});

test("records the nmrs merge as closure of the frozen historical review", async () => {
  const ledger = await loadLedger();
  const nonqualifying = ledger.nonqualifying_signal_ledger.protocol_v2_records.filter(
    (entry) => entry.subject_id === "freedesktop-rs/nmrs#521",
  );
  const closed = ledger.closed_lane_ledger.filter(
    (entry) => entry.subject_id === "freedesktop-rs/nmrs#521",
  );

  assert.equal(nonqualifying.length, 1);
  assert.equal(nonqualifying[0].count_weight, 0);
  assert.equal(nonqualifying[0].related_qualifying_event_id, "VTL-EXT-20260730-006");
  assert.equal(
    nonqualifying[0].verification.merge_commit,
    "f459910b8d906dc8d13095adc07ab7a2a098b8e2",
  );
  assert.equal(
    nonqualifying[0].verification.maintainer_final_commit,
    "c9b052c1efb70f49712d729ebb3384f678ebbdf7",
  );
  assert.equal(closed.length, 1);
  assert.equal(closed[0].count_weight, 0);
  assert.equal(closed[0].related_qualifying_event_id, "VTL-EXT-20260730-006");
});

test("records the AgentTrust rejection as negative, declined, closed, and zero weight", async () => {
  const ledger = await loadLedger();
  const subject = "agentrust-io/awesome-ai-governance#48";
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.subject_id === subject,
  );
  const nonqualifying = ledger.nonqualifying_signal_ledger.protocol_v2_records.filter(
    (entry) => entry.subject_id === subject,
  );
  const negative = ledger.negative_outcome_ledger.filter(
    (entry) => entry.subject_id === subject,
  );
  const declines = ledger.decline_ledger.filter(
    (entry) => entry.subject_id === subject,
  );
  const closed = ledger.closed_lane_ledger.filter(
    (entry) => entry.subject_id === subject,
  );

  assert.equal(qualifying.length, 0);
  assert.equal(nonqualifying.length, 1);
  assert.equal(nonqualifying[0].verification.comment_id, "5161877198");
  assert.equal(nonqualifying[0].count_weight, 0);
  assert.equal(negative.length, 1);
  assert.equal(negative[0].count_weight, 0);
  assert.equal(declines.length, 1);
  assert.equal(declines[0].count_weight, 0);
  assert.match(declines[0].next_condition, /independently attributable users/i);
  assert.equal(closed.length, 1);
  assert.equal(closed[0].count_weight, 0);
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

test("records the in-toto Witness verifier invitation once at weight zero", async () => {
  const ledger = await loadLedger();
  const outreach = ledger.outreach_denominator_ledger.protocol_v2_records.filter(
    (entry) => entry.organization_id === "in-toto-witness",
  );
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.organization_id === "in-toto-witness",
  );

  assert.equal(outreach.length, 1);
  assert.equal(outreach[0].purpose, "independent_verifier_run_or_bounded_hostile_review");
  assert.equal(outreach[0].private_evidence.message_id, "19fc02d76c0277a5");
  assert.equal(outreach[0].follow_up_eligible_at, "2026-08-09T01:53:52Z");
  assert.equal(outreach[0].count_weight, 0);
  assert.equal(qualifying.length, 0);
});

test("records the OpenHands founding-pilot invitation without inventing revenue", async () => {
  const ledger = await loadLedger();
  const outreach = ledger.outreach_denominator_ledger.protocol_v2_records.filter(
    (entry) => entry.organization_id === "all-hands-ai-openhands",
  );
  const proposals = ledger.protocol_v2_effort_ledger.tailored_commercial_proposals.filter(
    (entry) => entry.organization_id === "all-hands-ai-openhands",
  );
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.organization_id === "all-hands-ai-openhands",
  );

  assert.equal(outreach.length, 1);
  assert.equal(outreach[0].purpose, "founding_paid_pilot_offer");
  assert.equal(outreach[0].private_evidence.message_id, "19fc03dde8d58377");
  assert.equal(outreach[0].follow_up_eligible_at, "2026-08-09T02:11:47Z");
  assert.equal(outreach[0].count_weight, 0);
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].amount_usd, "750.00");
  assert.equal(proposals[0].settled_payment_usd, "0.00");
  assert.equal(proposals[0].delivery_acknowledged, false);
  assert.equal(proposals[0].count_weight, 0);
  assert.equal(qualifying.length, 0);
});

test("records the Snyk Agent Scan hostile-case invitation once at weight zero", async () => {
  const ledger = await loadLedger();
  const outreach = ledger.outreach_denominator_ledger.protocol_v2_records.filter(
    (entry) => entry.organization_id === "snyk-agent-scan",
  );
  const qualifying = ledger.qualifying_event_ledger.protocol_v2_events.filter(
    (entry) => entry.organization_id === "snyk-agent-scan",
  );

  assert.equal(outreach.length, 1);
  assert.equal(outreach[0].purpose, "blind_participation_or_external_hostile_case");
  assert.equal(outreach[0].private_evidence.message_id, "19fc05bf22622bd6");
  assert.equal(outreach[0].follow_up_eligible_at, "2026-08-09T02:44:39Z");
  assert.equal(outreach[0].count_weight, 0);
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

  assert.equal(qualifyingCount, 10);
  assert.equal(progress.qualifying_events, qualifyingCount);
  assert.equal(progress.distinct_independent_validators, 10);
  assert.equal(progress.unrelated_organizations_or_communities, 10);
  assert.equal(progress.technical_reproductions_reviews_or_integrations, 7);
  assert.equal(progress.maximum_single_category_share_basis_points, 3000);
  assert.equal(progress.negative_outcomes, ledger.negative_outcome_ledger.length);
  assert.equal(progress.declines, ledger.decline_ledger.length);
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
  assert.equal(progress.outreach_initial_contacts, 52);
  assert.equal(progress.outreach_follow_ups, 0);
  assert.equal(progress.settled_revenue_usd, "0.00");
  assert.deepEqual(progress.remaining, {
    qualifying_events: 40,
    distinct_independent_validators: 15,
    unrelated_organizations_or_communities: 0,
    pre_reveal_blind_label_sets: 15,
    technical_reproductions_reviews_or_integrations: 3,
    structured_adopter_reports: 5,
    repeat_use_adopter_reports: 2,
    independently_proposed_or_executed_hostile_cases: 5,
    independent_verifier_runs_cross_evaluations_or_compatible_implementations: 3,
    commercial_revenue_usd: "750.00",
  });
});
