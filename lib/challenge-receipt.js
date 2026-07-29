import { CASES, sha256 } from "./trust-engine.js";

export const CHALLENGE_ID = "mixed-six-v0.1";

function normalizeLabels(labels) {
  if (!Array.isArray(labels) || labels.length !== CASES.length) {
    throw new Error(`Expected exactly ${CASES.length} challenge labels`);
  }

  const expectedIds = new Set(CASES.map((item) => item.id));
  const normalized = labels
    .map(({ case_id, predicted }) => {
      if (!expectedIds.has(case_id)) {
        throw new Error(`Unknown challenge case: ${case_id}`);
      }
      if (predicted !== "ALLOW" && predicted !== "BLOCK") {
        throw new Error(`Invalid prediction for ${case_id}`);
      }
      return { case_id, predicted };
    })
    .sort((left, right) => left.case_id.localeCompare(right.case_id));

  if (new Set(normalized.map((item) => item.case_id)).size !== CASES.length) {
    throw new Error("Challenge labels must include every case exactly once");
  }
  return normalized;
}

export async function createChallengeReceipt({ labels, score, total }) {
  const normalizedLabels = normalizeLabels(labels);
  if (
    !Number.isInteger(score) ||
    !Number.isInteger(total) ||
    total !== CASES.length ||
    score < 0 ||
    score > total
  ) {
    throw new Error("Challenge score is outside the declared challenge bounds");
  }

  const commitment = {
    challenge_id: CHALLENGE_ID,
    labels: normalizedLabels,
    score,
    total,
  };
  const digest = await sha256(commitment);

  return {
    schema: "veritas-omega-trust-lab-challenge-receipt/v0.2",
    receipt_id: `vtl:${digest}`,
    ...commitment,
    self_reported: true,
    independence_status: "UNVERIFIED_SELF_REPORTED",
    count_weight: 0,
    personal_data_collected_by_lab: false,
    execution_authorized: false,
    verification_note:
      "Anyone can recompute this identifier from the disclosed challenge version, labels, and score. It is not a signature, identity proof, or independent validation.",
  };
}
