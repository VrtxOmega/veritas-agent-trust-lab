import { CASES, sha256 } from "./trust-engine.js";

export const CHALLENGE_ID = "mixed-six-v0.1";
export const BLIND_COMMITMENT_EMAIL = "VrtxOmega@pm.me";

const ISSUE_FIELD_BY_CASE_ID = {
  "forged-verdict": "forged_verdict",
  "parameter-swap": "parameter_swap",
  "nonce-replay": "nonce_replay",
  "correlated-quorum": "correlated_quorum",
  "evidence-deletion": "evidence_deletion",
  "silent-monitor": "silent_monitor",
};

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

function validateBlindCommitment(commitment) {
  if (
    commitment?.challenge_id !== CHALLENGE_ID ||
    !/^vtlc:[a-f0-9]{64}$/.test(commitment?.commitment_id ?? "")
  ) {
    throw new Error("Blind commitment identity is invalid");
  }
  return normalizeLabels(commitment.labels);
}

export async function createBlindCommitment({ labels }) {
  const commitment = {
    challenge_id: CHALLENGE_ID,
    labels: normalizeLabels(labels),
  };
  const digest = await sha256(commitment);

  return {
    schema: "veritas-omega-trust-lab-blind-commitment/v0.1",
    commitment_id: `vtlc:${digest}`,
    ...commitment,
    verification_status: "LOCAL_UNSUBMITTED",
    count_weight: 0,
    personal_data_collected_by_lab: false,
    execution_authorized: false,
    verification_note:
      "This score-free identifier commits to the challenge version and six labels. A submitted public issue can timestamp that label set, but neither the local identifier nor the issue proves independence, expertise, honesty, or that no answer key was inspected.",
  };
}

export function createBlindSubmissionUrl(commitment) {
  const labels = validateBlindCommitment(commitment);
  const params = new URLSearchParams({
    template: "blind-label-set.yml",
    title: `[BLIND COMMITMENT] ${CHALLENGE_ID} ${commitment.commitment_id.slice(5, 17)}`,
    challenge_version: CHALLENGE_ID,
    commitment_id: commitment.commitment_id,
  });
  for (const { case_id, predicted } of labels) {
    params.set(ISSUE_FIELD_BY_CASE_ID[case_id], predicted);
  }

  return `https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?${params.toString()}`;
}

export function createBlindEmailSubmissionUrl(commitment) {
  const labels = validateBlindCommitment(commitment);
  const labelLines = labels.map(
    ({ case_id, predicted }) => `- ${case_id}: ${predicted}`,
  );
  const body = [
    "VERITAS Omega Agent Trust Lab — private blind commitment",
    "",
    `Challenge version: ${CHALLENGE_ID}`,
    `Commitment ID: ${commitment.commitment_id}`,
    "",
    "Six pre-reveal labels:",
    ...labelLines,
    "",
    "Consent and evidence boundary:",
    "I am voluntarily sending this message before using the reveal control.",
    "The recipient may retain this message and its delivery headers to verify receipt time and the submitted label set.",
    "Do not publish my email address or label set without my explicit consent.",
    "This timestamped message does not prove my independence, expertise, honesty, or that I did not inspect the answer key or source.",
  ].join("\n");
  const params = new URLSearchParams({
    subject: `[BLIND COMMITMENT] ${CHALLENGE_ID} ${commitment.commitment_id.slice(5, 17)}`,
    body,
  });

  return `mailto:${BLIND_COMMITMENT_EMAIL}?${params.toString()}`;
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
