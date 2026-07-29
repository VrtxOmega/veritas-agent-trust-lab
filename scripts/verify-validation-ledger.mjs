import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const QUALIFYING_CATEGORIES = [
  "accepted_external_integration",
  "catalog_curator_acceptance",
  "editorial_coverage",
  "external_adopter_report",
  "independent_blind_label_set",
  "independent_technical_reproduction",
  "substantive_external_review",
];

export const NEVER_COUNT = [
  "author_activity",
  "bot_or_ci",
  "duplicate_signal",
  "open_pr",
  "outreach_sent",
  "self_test",
  "thanks_only",
  "traffic",
];

const proofTypes = new Set([
  "git_commit",
  "issue_comment_id",
  "publication_id",
  "sha256",
  "payment_receipt_id",
]);
const authorSide = new Set([
  "github:vrtxomega",
  "local:codex",
  "local:grok",
  "local:hermes",
]);
const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const fail = (condition, message) => {
  if (!condition) throw new Error(message);
};
const text = (value, path, minimum = 1) =>
  fail(
    typeof value === "string" && value.trim().length >= minimum,
    `${path} must contain at least ${minimum} characters`,
  );
const timestamp = (value, path) => {
  text(value, path);
  fail(Number.isFinite(Date.parse(value)), `${path} must be a timestamp`);
};
const exactUsd = (value, path, allowZero = true) => {
  fail(
    typeof value === "string" && /^(0|[1-9][0-9]*)\.[0-9]{2}$/.test(value),
    `${path} must be exact USD`,
  );
  const [dollars, cents] = value.split(".");
  const total = Number(dollars) * 100 + Number(cents);
  fail(Number.isSafeInteger(total), `${path} is outside the exact range`);
  fail(allowZero || total > 0, `${path} must be greater than zero`);
  return total;
};

function verifyProof(value, path) {
  fail(isObject(value), `${path} must be an object`);
  fail(value.status === "verified", `${path}.status must be verified`);
  text(value.method, `${path}.method`, 8);
  timestamp(value.verified_at, `${path}.verified_at`);
  fail(proofTypes.has(value.immutable_ref_type), `${path} proof type is unsupported`);
  text(value.immutable_ref, `${path}.immutable_ref`, 8);
  if (value.immutable_ref_type === "git_commit") {
    fail(/^[0-9a-f]{40}$/.test(value.immutable_ref), `${path} needs a full commit SHA`);
  }
  if (value.immutable_ref_type === "sha256") {
    fail(/^[0-9a-f]{64}$/.test(value.immutable_ref), `${path} needs a SHA-256 digest`);
  }
}

function verifyActor(actor, path) {
  fail(isObject(actor), `${path} must be an object`);
  text(actor.id, `${path}.id`, 3);
  text(actor.platform, `${path}.platform`, 2);
  text(actor.account, `${path}.account`);
  fail(actor.relationship === "independent", `${path} must be independent`);
  fail(actor.is_bot === false && !/\[bot\]$/i.test(actor.account), `${path} is a bot`);
  fail(!authorSide.has(actor.id.toLowerCase()), `${path} is author-side`);
  text(actor.independence_basis, `${path}.independence_basis`, 20);
}

function verifyEvent(event, index, ids, dedupe) {
  const path = `events[${index}]`;
  fail(isObject(event), `${path} must be an object`);
  fail(/^VTL-EXT-\d{8}-\d{3}$/.test(event.id), `${path}.id is malformed`);
  fail(!ids.has(event.id), `${path}.id is duplicated`);
  ids.add(event.id);
  fail(event.status === "qualifying", `${path} is not qualifying`);
  fail(QUALIFYING_CATEGORIES.includes(event.category), `${path}.category is not qualifying`);
  text(event.subject_id, `${path}.subject_id`, 3);
  verifyActor(event.actor, `${path}.actor`);
  text(event.action, `${path}.action`, 8);
  text(event.validation_claim, `${path}.validation_claim`, 30);
  text(event.scope, `${path}.scope`, 30);
  fail(
    Array.isArray(event.does_not_establish) &&
      event.does_not_establish.length >= 3 &&
      new Set(event.does_not_establish).size === event.does_not_establish.length,
    `${path} needs at least three unique nonclaims`,
  );
  fail(event.source_url?.startsWith("https://"), `${path}.source_url must use HTTPS`);
  timestamp(event.occurred_at, `${path}.occurred_at`);
  verifyProof(event.verification, `${path}.verification`);
  const expected = `${event.actor.id}|${event.category}|${event.subject_id}`;
  fail(event.dedupe_key === expected, `${path}.dedupe_key does not recompute`);
  fail(!dedupe.has(expected), `${path}.dedupe_key is duplicated`);
  dedupe.add(expected);
  fail(event.count_weight === 1, `${path}.count_weight must be 1`);
}

export function validateLedger(ledger) {
  fail(isObject(ledger), "ledger must be an object");
  fail(ledger.schema_version === "1.0.0", "unsupported schema_version");
  fail(ledger.campaign?.id === "veritas-trust-lab-50-or-payment", "campaign.id drifted");
  fail(ledger.campaign?.validation_target === 50, "validation target drifted");
  fail(ledger.campaign?.payment_threshold === "greater_than_0_usd", "payment threshold drifted");
  timestamp(ledger.campaign?.started_at, "campaign.started_at");
  fail(
    JSON.stringify([...ledger.counting_policy.qualifying_categories].sort()) ===
      JSON.stringify([...QUALIFYING_CATEGORIES].sort()),
    "qualifying categories drifted",
  );
  fail(
    JSON.stringify([...ledger.counting_policy.never_count].sort()) ===
      JSON.stringify([...NEVER_COUNT].sort()),
    "non-counting categories drifted",
  );

  const ids = new Set();
  const dedupe = new Set();
  fail(Array.isArray(ledger.events), "events must be an array");
  ledger.events.forEach((event, index) => verifyEvent(event, index, ids, dedupe));
  let paymentCents = 0;
  fail(Array.isArray(ledger.payments), "payments must be an array");
  for (const [index, payment] of ledger.payments.entries()) {
    const path = `payments[${index}]`;
    fail(payment.status === "verified", `${path} is not verified`);
    verifyActor(payment.payer, `${path}.payer`);
    paymentCents += exactUsd(payment.amount_usd, `${path}.amount_usd`, false);
    verifyProof(payment.verification, `${path}.verification`);
    const key = `${payment.payer.id}|payment|${payment.verification.immutable_ref}`;
    fail(!dedupe.has(key), `${path} duplicates a payment`);
    dedupe.add(key);
  }
  fail(Array.isArray(ledger.open_lanes), "open_lanes must be an array");
  for (const [index, lane] of ledger.open_lanes.entries()) {
    const path = `open_lanes[${index}]`;
    fail(NEVER_COUNT.includes(lane.signal_type), `${path} must be non-counting`);
    fail(lane.count_weight === 0, `${path}.count_weight must be 0`);
    text(lane.reason_not_counted, `${path}.reason_not_counted`, 20);
  }

  const qualifying = ledger.events.reduce((sum, event) => sum + event.count_weight, 0);
  const validators = new Set(ledger.events.map((event) => event.actor.id)).size;
  const paymentUsd = `${Math.floor(paymentCents / 100)}.${String(paymentCents % 100).padStart(2, "0")}`;
  const remaining = Math.max(0, 50 - qualifying);
  const terminal = qualifying >= 50 || paymentCents > 0 ? "ACHIEVED" : "ACTIVE";
  exactUsd(ledger.summary?.verified_payment_usd, "summary.verified_payment_usd");
  fail(ledger.summary.qualifying_events === qualifying, "qualifying summary does not recompute");
  fail(ledger.summary.distinct_validators === validators, "validator summary does not recompute");
  fail(ledger.summary.verified_payment_usd === paymentUsd, "payment summary does not recompute");
  fail(ledger.summary.remaining_to_validation_target === remaining, "remaining summary does not recompute");
  fail(ledger.summary.terminal_state === terminal, "terminal state does not recompute");
  return {
    campaign_id: ledger.campaign.id,
    qualifying_events: qualifying,
    distinct_validators: validators,
    verified_payment_usd: paymentUsd,
    remaining_to_validation_target: remaining,
    terminal_state: terminal,
    open_lanes: ledger.open_lanes.length,
  };
}

export const loadLedger = async (path) =>
  JSON.parse(
    await readFile(
      path ?? new URL("../evidence/external-validation-ledger.json", import.meta.url),
      "utf8",
    ),
  );

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.stdout.write(
      `${JSON.stringify(validateLedger(await loadLedger(process.argv[2] && resolve(process.argv[2]))), null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(`VALIDATION_LEDGER_INVALID: ${error.message}\n`);
    process.exitCode = 1;
  }
}
