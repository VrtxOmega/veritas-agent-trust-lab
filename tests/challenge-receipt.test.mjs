import assert from "node:assert/strict";
import test from "node:test";

import {
  CHALLENGE_ID,
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
