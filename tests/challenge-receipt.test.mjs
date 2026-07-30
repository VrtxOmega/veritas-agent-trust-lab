import assert from "node:assert/strict";
import test from "node:test";

import {
  BLIND_COMMITMENT_EMAIL,
  CHALLENGE_ID,
  createBlindCommitment,
  createBlindEmailSubmissionUrl,
  createBlindSubmissionUrl,
  createChallengeReceipt,
} from "../lib/challenge-receipt.js";

const labels = [
  { case_id: "forged-verdict", predicted: "BLOCK" },
  { case_id: "parameter-swap", predicted: "ALLOW" },
  { case_id: "nonce-replay", predicted: "BLOCK" },
  { case_id: "correlated-quorum", predicted: "ALLOW" },
  { case_id: "evidence-deletion", predicted: "BLOCK" },
  { case_id: "silent-monitor", predicted: "ALLOW" },
];

test("blind commitment is deterministic and excludes score", async () => {
  const first = await createBlindCommitment({ labels });
  const second = await createBlindCommitment({
    labels: [...labels].reverse(),
  });

  assert.equal(first.challenge_id, CHALLENGE_ID);
  assert.equal(first.commitment_id, second.commitment_id);
  assert.match(first.commitment_id, /^vtlc:[a-f0-9]{64}$/);
  assert.equal(first.verification_status, "LOCAL_UNSUBMITTED");
  assert.equal(first.count_weight, 0);
  assert.equal(first.execution_authorized, false);
  assert.equal("score" in first, false);
  assert.equal("total" in first, false);
});

test("blind commitment changes when a label changes", async () => {
  const first = await createBlindCommitment({ labels });
  const changed = structuredClone(labels);
  changed[0].predicted = "ALLOW";
  const second = await createBlindCommitment({ labels: changed });
  assert.notEqual(first.commitment_id, second.commitment_id);
});

test("blind submission URL prefills every label without score data", async () => {
  const commitment = await createBlindCommitment({ labels });
  const submission = new URL(createBlindSubmissionUrl(commitment));

  assert.equal(submission.origin, "https://github.com");
  assert.equal(
    submission.pathname,
    "/VrtxOmega/veritas-agent-trust-lab/issues/new",
  );
  assert.equal(submission.searchParams.get("template"), "blind-label-set.yml");
  assert.equal(submission.searchParams.get("challenge_version"), CHALLENGE_ID);
  assert.equal(
    submission.searchParams.get("commitment_id"),
    commitment.commitment_id,
  );
  assert.equal(submission.searchParams.get("forged_verdict"), "BLOCK");
  assert.equal(submission.searchParams.get("parameter_swap"), "ALLOW");
  assert.equal(submission.searchParams.get("nonce_replay"), "BLOCK");
  assert.equal(submission.searchParams.get("correlated_quorum"), "ALLOW");
  assert.equal(submission.searchParams.get("evidence_deletion"), "BLOCK");
  assert.equal(submission.searchParams.get("silent_monitor"), "ALLOW");
  assert.equal(submission.searchParams.has("score"), false);
  assert.equal(submission.searchParams.has("total"), false);
  assert.equal(submission.searchParams.has("body"), false);
});

test("blind submission URL rejects invalid commitment identities", () => {
  assert.throws(
    () =>
      createBlindSubmissionUrl({
        challenge_id: CHALLENGE_ID,
        commitment_id: "vtlc:forged",
        labels,
      }),
    /identity is invalid/,
  );
});

test("private email URL commits all six labels without score data", async () => {
  const commitment = await createBlindCommitment({ labels });
  const submission = new URL(createBlindEmailSubmissionUrl(commitment));
  const body = submission.searchParams.get("body") ?? "";

  assert.equal(submission.protocol, "mailto:");
  assert.equal(submission.pathname, BLIND_COMMITMENT_EMAIL);
  assert.match(
    submission.searchParams.get("subject") ?? "",
    new RegExp(`^\\[BLIND COMMITMENT\\] ${CHALLENGE_ID} [a-f0-9]{12}$`),
  );
  assert.match(body, new RegExp(`Challenge version: ${CHALLENGE_ID}`));
  assert.match(body, new RegExp(`Commitment ID: ${commitment.commitment_id}`));
  assert.equal(
    body.match(/^- [a-z-]+: (?:ALLOW|BLOCK)$/gm)?.length,
    labels.length,
  );
  for (const { case_id, predicted } of labels) {
    assert.match(body, new RegExp(`^- ${case_id}: ${predicted}$`, "m"));
  }
  assert.match(body, /Do not publish my email address or label set without my explicit consent/);
  assert.match(body, /does not prove my independence, expertise, honesty/);
  assert.doesNotMatch(body, /^Score:/m);
  assert.doesNotMatch(body, /^Correct answer:/m);
});

test("private email URL rejects invalid commitment identities", () => {
  assert.throws(
    () =>
      createBlindEmailSubmissionUrl({
        challenge_id: CHALLENGE_ID,
        commitment_id: "vtlc:forged",
        labels,
      }),
    /identity is invalid/,
  );
});

test("challenge receipt is deterministic across label ordering", async () => {
  const first = await createChallengeReceipt({ labels, score: 6, total: 6 });
  const second = await createChallengeReceipt({
    labels: [...labels].reverse(),
    score: 6,
    total: 6,
  });

  assert.equal(first.challenge_id, CHALLENGE_ID);
  assert.equal(first.receipt_id, second.receipt_id);
  assert.match(first.receipt_id, /^vtl:[a-f0-9]{64}$/);
  assert.equal(first.independence_status, "UNVERIFIED_SELF_REPORTED");
  assert.equal(first.count_weight, 0);
  assert.equal(first.execution_authorized, false);
});

test("challenge receipt changes when a sealed label changes", async () => {
  const first = await createChallengeReceipt({ labels, score: 6, total: 6 });
  const changed = structuredClone(labels);
  changed[0].predicted = "ALLOW";
  const second = await createChallengeReceipt({
    labels: changed,
    score: 5,
    total: 6,
  });
  assert.notEqual(first.receipt_id, second.receipt_id);
});

test("challenge receipt rejects incomplete or duplicate label sets", async () => {
  await assert.rejects(
    createBlindCommitment({ labels: labels.slice(1) }),
    /exactly 6/,
  );
  await assert.rejects(
    createChallengeReceipt({ labels: labels.slice(1), score: 5, total: 6 }),
    /exactly 6/,
  );
  await assert.rejects(
    createChallengeReceipt({
      labels: [...labels.slice(0, 5), labels[0]],
      score: 5,
      total: 6,
    }),
    /exactly once/,
  );
});
