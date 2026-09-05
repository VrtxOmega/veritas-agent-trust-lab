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
