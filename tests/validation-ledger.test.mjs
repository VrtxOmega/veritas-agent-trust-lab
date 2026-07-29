import assert from "node:assert/strict";
import test from "node:test";
import {
  NEVER_COUNT,
  QUALIFYING_CATEGORIES,
  loadLedger,
  validateLedger,
} from "../scripts/verify-validation-ledger.mjs";

const event = (suffix, account) => ({
  id: `VTL-EXT-20260729-00${suffix}`,
  status: "qualifying",
  category: "catalog_curator_acceptance",
  subject_id: `outside/repo#${suffix}`,
  actor: {
    id: `github:${account}`,
    platform: "github",
    account,
    relationship: "independent",
    is_bot: false,
    independence_basis: "External repository merge authority.",
  },
  action: "merged_listing",
  validation_claim: "An outside curator accepted the scoped project listing.",
  scope: "This establishes catalogue fit in one outside repository.",
  does_not_establish: ["adoption", "correctness", "endorsement"],
  source_url: `https://github.com/outside/repo/pull/${suffix}`,
  occurred_at: "2026-07-29T09:33:26Z",
  verification: {
    status: "verified",
    method: "GitHub API readback",
    verified_at: "2026-07-29T12:48:00Z",
    immutable_ref_type: "git_commit",
    immutable_ref: String(suffix).repeat(40),
  },
  dedupe_key:
    `github:${account}|catalog_curator_acceptance|outside/repo#${suffix}`,
  count_weight: 1,
});

const fixture = () => ({
  schema_version: "1.0.0",
  campaign: {
    id: "veritas-trust-lab-50-or-payment",
    validation_target: 50,
    payment_threshold: "greater_than_0_usd",
    started_at: "2026-07-29T09:33:26Z",
  },
  counting_policy: {
    qualifying_categories: QUALIFYING_CATEGORIES,
    never_count: NEVER_COUNT,
  },
  events: [event(1, "curator-a"), event(2, "curator-b")],
  payments: [],
  open_lanes: [{ signal_type: "open_pr", count_weight: 0,
    reason_not_counted: "No outside human decision exists yet." }],
  summary: {
    qualifying_events: 2,
    distinct_validators: 2,
    verified_payment_usd: "0.00",
    remaining_to_validation_target: 48,
    terminal_state: "ACTIVE",
  },
});
const clone = (value) => structuredClone(value);

test("recomputes the strict 2/50 baseline", () => {
  assert.equal(validateLedger(fixture()).qualifying_events, 2);
});

test("recomputes the canonical public campaign ledger", async () => {
  assert.deepEqual(validateLedger(await loadLedger()), {
    campaign_id: "veritas-trust-lab-50-or-payment",
    qualifying_events: 3,
    distinct_validators: 3,
    verified_payment_usd: "0.00",
    remaining_to_validation_target: 47,
    terminal_state: "ACTIVE",
    open_lanes: 9,
  });
});

for (const [name, mutate, pattern] of [
  ["author", (x) => {
    x.events[0].actor.id = "github:VrtxOmega";
  }, /author-side/],
  ["bot", (x) => {
    x.events[0].actor.account = "curator[bot]";
  }, /bot/],
  ["thanks", (x) => {
    x.events[0].category = "thanks_only";
  }, /not qualifying/],
  ["duplicate", (x) => {
    x.events.push({ ...clone(x.events[0]), id: "VTL-EXT-20260729-099" });
  }, /duplicated/],
  ["stale summary", (x) => {
    x.summary.qualifying_events = 3;
  }, /does not recompute/],
  ["missing proof", (x) => {
    x.events[0].verification.immutable_ref = "";
  }, /at least 8/],
  ["counted open lane", (x) => {
    x.open_lanes[0].count_weight = 1;
  }, /must be 0/],
]) {
  test(`rejects ${name}`, () => {
    const input = clone(fixture());
    mutate(input);
    assert.throws(() => validateLedger(input), pattern);
  });
}
