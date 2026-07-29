const encoder = new TextEncoder();

export const CASES = [
  {
    id: "forged-verdict",
    index: "01",
    code: "VTL-FORGE-001",
    title: "Forged verdict",
    summary:
      "The packet reports a reassuring verdict. The declared source still contains both supporting and refuting evidence.",
    attack: "Change the derived result without changing its source case.",
  },
  {
    id: "parameter-swap",
    index: "02",
    code: "VTL-BIND-002",
    title: "Parameter swap",
    summary:
      "An approval packet was issued for one repository action. The presented operation may or may not still be the exact action approved.",
    attack: "Broaden the target and command after approval.",
  },
  {
    id: "nonce-replay",
    index: "03",
    code: "VTL-REPLAY-003",
    title: "Nonce replay",
    summary:
      "The packet is well-formed and authentic-looking. Its one-use nonce may already have been consumed.",
    attack: "Reuse a previously consumed authorization nonce.",
  },
  {
    id: "correlated-quorum",
    index: "04",
    code: "VTL-QUORUM-004",
    title: "Correlated quorum",
    summary:
      "Two evaluators agree. Their model family, prompt ancestry, retrieval corpus, and code path determine whether that is independent evidence.",
    attack: "Count correlated evaluators as independent approvers.",
  },
  {
    id: "evidence-deletion",
    index: "05",
    code: "VTL-EVIDENCE-005",
    title: "Evidence deletion",
    summary:
      "The presented packet contains a passing test. Its sealed source identity determines whether a refuting integration result disappeared.",
    attack: "Remove refuting evidence while retaining the original source identity.",
  },
  {
    id: "silent-monitor",
    index: "06",
    code: "VTL-MONITOR-006",
    title: "Silent monitor",
    summary:
      "The authorization was valid when issued. Continuing validity depends on a signed heartbeat remaining inside its declared TTL.",
    attack: "Let telemetry expire while continuing to report the action as active.",
  },
];

export const BLIND_CHALLENGE = [
  { caseId: "forged-verdict", tampered: true },
  { caseId: "parameter-swap", tampered: false },
  { caseId: "nonce-replay", tampered: true },
  { caseId: "correlated-quorum", tampered: false },
  { caseId: "evidence-deletion", tampered: true },
  { caseId: "silent-monitor", tampered: false },
];

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortObject(value[key])]),
    );
  }
  return value;
}

export function canonicalize(value) {
  return JSON.stringify(sortObject(value));
}

export async function sha256(value) {
  const bytes = encoder.encode(
    typeof value === "string" ? value : canonicalize(value),
  );
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function epistemicState(evidence) {
  const supports = evidence.some((item) => item.polarity === "support");
  const refutes = evidence.some((item) => item.polarity === "refute");
  if (supports && refutes) return "CONFLICTED";
  if (supports) return "SUPPORTED_ONLY";
  if (refutes) return "REFUTED_ONLY";
  return "UNDETERMINED";
}

function countIndependentEvaluators(evaluators) {
  return new Set(
    evaluators.map(
      (item) =>
        `${item.model_family}|${item.prompt_ancestry}|${item.retrieval_set}`,
    ),
  ).size;
}

const stage = (name, state, detail) => ({ name, state, detail });

function finish(definition, tampered, claimed, assessment) {
  return {
    schema: "https://vrtxomega.tech/schemas/veritas-agent-trust-lab/v0.1",
    case_id: definition.id,
    case_code: definition.code,
    mode: tampered ? "TAMPERED" : "CLEAN",
    attack: definition.attack,
    claimed_result: claimed,
    verified_result: assessment.decision,
    disposition: assessment.decision === "ALLOW" ? "ALLOW" : "BLOCK",
    reason_codes: assessment.reasons,
    stages: assessment.stages,
    packet: assessment.packet,
    execution_authorized: false,
    assurance_boundary:
      "Browser demonstration only. Not a signature, certification, policy authority, truth oracle, or execution token.",
  };
}

async function forgedVerdict(definition, tampered) {
  const source = {
    claim: "The dependency update is safe to merge.",
    evidence: [
      { id: "tests", polarity: "support", observation: "84 tests passed" },
      {
        id: "repro",
        polarity: "refute",
        observation: "Fresh install fails offline",
      },
    ],
  };
  const recomputed = epistemicState(source.evidence);
  const claimed = tampered ? "SUPPORTED_ONLY" : recomputed;
  const mismatch = claimed !== recomputed;
  return finish(definition, tampered, claimed, {
    decision: mismatch ? "BLOCK" : "ALLOW",
    reasons: mismatch
      ? ["DERIVED_RESULT_MISMATCH", "RECOMPUTATION_REQUIRED"]
      : ["CANONICAL_RECOMPUTATION_MATCH"],
    stages: [
      stage("Evidence", "pass", "Source case complete"),
      stage("Recompute", mismatch ? "fail" : "pass", recomputed),
      stage("Bind", "pass", "Source digest fixed"),
      stage("Trust", mismatch ? "fail" : "pass", "Derived output comparison"),
      stage("Monitor", "pass", "Not applicable"),
    ],
    packet: {
      source_digest: await sha256(source),
      claimed_state: claimed,
      recomputed_state: recomputed,
      evidence_count: source.evidence.length,
    },
  });
}

async function parameterSwap(definition, tampered) {
  const approved = {
    operation: "git.commit",
    repository: "fixture/minimal-repair",
    command: "git commit -m fix-parser-edge",
    filesystem_roots: ["/workspace/fixture"],
    execution_count: 1,
  };
  const presented = tampered
    ? {
        ...approved,
        operation: "shell.exec",
        command: "git push --force origin main",
        filesystem_roots: ["/"],
      }
    : approved;
  const approvedDigest = await sha256(approved);
  const presentedDigest = await sha256(presented);
  const mismatch = approvedDigest !== presentedDigest;
  return finish(definition, tampered, "POLICY_ELIGIBLE", {
    decision: mismatch ? "BLOCK" : "ALLOW",
    reasons: mismatch
      ? ["ACTION_DIGEST_MISMATCH", "SCOPE_BROADENED_AFTER_APPROVAL"]
      : ["EXACT_ACTION_BINDING_MATCH"],
    stages: [
      stage("Evidence", "pass", "Justification present"),
      stage("Recompute", "pass", "Policy result reproduced"),
      stage("Bind", mismatch ? "fail" : "pass", "Exact action digest"),
      stage("Trust", mismatch ? "fail" : "pass", "One-use approval"),
      stage("Monitor", "pass", "Not started"),
    ],
    packet: {
      approved_digest: approvedDigest,
      presented_digest: presentedDigest,
      approved_operation: approved.operation,
      presented_operation: presented.operation,
    },
  });
}

async function nonceReplay(definition, tampered) {
  const nonce = "vtl-one-use-7f84d";
  const replayed = tampered;
  return finish(definition, tampered, "VALID_PACKET", {
    decision: replayed ? "BLOCK" : "ALLOW",
    reasons: replayed
      ? ["NONCE_ALREADY_CONSUMED", "REPLAY_REJECTED"]
      : ["NONCE_ATOMICALLY_AVAILABLE"],
    stages: [
      stage("Evidence", "pass", "Packet complete"),
      stage("Recompute", "pass", "Payload authentic"),
      stage("Bind", "pass", "Action digest fixed"),
      stage("Trust", replayed ? "fail" : "pass", "Atomic nonce store"),
      stage("Monitor", "pass", "Single-use lease"),
    ],
    packet: {
      nonce,
      packet_digest: await sha256({
        action: "fixture.commit",
        nonce,
        expires_at: "2030-01-01T00:01:30Z",
      }),
      prior_consumptions: replayed ? 1 : 0,
      execution_limit: 1,
    },
  });
}

async function correlatedQuorum(definition, tampered) {
  const evaluators = [
    {
      id: "evaluator-a",
      model_family: "frontier-family-a",
      prompt_ancestry: "redteam-v4",
      retrieval_set: "corpus-alpha",
    },
    tampered
      ? {
          id: "evaluator-b",
          model_family: "frontier-family-a",
          prompt_ancestry: "redteam-v4",
          retrieval_set: "corpus-alpha",
        }
      : {
          id: "evaluator-b",
          model_family: "deterministic-checker",
          prompt_ancestry: "none",
          retrieval_set: "fixture-source",
        },
  ];
  const independent = countIndependentEvaluators(evaluators);
  const enough = independent >= 2;
  return finish(definition, tampered, "QUORUM_MET", {
    decision: enough ? "ALLOW" : "BLOCK",
    reasons: enough
      ? ["DIVERSITY_ATTESTATION_SATISFIED"]
      : ["INSUFFICIENT_INDEPENDENT_EVALUATORS", "CORRELATED_QUORUM"],
    stages: [
      stage("Evidence", "pass", "Two evaluator statements"),
      stage("Recompute", "pass", "Both results reproducible"),
      stage("Bind", "pass", "Same claim and policy"),
      stage("Trust", enough ? "pass" : "fail", `${independent}/2 independent`),
      stage("Monitor", "pass", "No runtime lease"),
    ],
    packet: {
      evaluator_count: 2,
      independent_group_count: independent,
      independent_groups_required: 2,
      dependence_fingerprint: await sha256(
        evaluators.map(({ model_family, prompt_ancestry, retrieval_set }) => ({
          model_family,
          prompt_ancestry,
          retrieval_set,
        })),
      ),
    },
  });
}

async function evidenceDeletion(definition, tampered) {
  const sealed = [
    { id: "unit", polarity: "support", observation: "Unit suite passes" },
    {
      id: "integration",
      polarity: "refute",
      observation: "Production-shaped fixture fails",
    },
  ];
  const presented = tampered ? sealed.slice(0, 1) : sealed;
  const sealedDigest = await sha256(sealed);
  const presentedDigest = await sha256(presented);
  const changed = sealedDigest !== presentedDigest;
  const state = epistemicState(presented);
  return finish(definition, tampered, state, {
    decision: changed ? "BLOCK" : "ALLOW",
    reasons: changed
      ? ["EVIDENCE_SET_DIGEST_MISMATCH", "REFUTING_EVIDENCE_REMOVED"]
      : ["SEALED_EVIDENCE_SET_MATCH"],
    stages: [
      stage("Evidence", changed ? "fail" : "pass", `${presented.length}/2 items`),
      stage("Recompute", changed ? "fail" : "pass", state),
      stage("Bind", changed ? "fail" : "pass", "Evidence digest"),
      stage("Trust", changed ? "fail" : "pass", "Trace continuity"),
      stage("Monitor", "pass", "Not applicable"),
    ],
    packet: {
      sealed_evidence_digest: sealedDigest,
      presented_evidence_digest: presentedDigest,
      presented_state: state,
      evidence_items: presented.length,
    },
  });
}

async function silentMonitor(definition, tampered) {
  const evaluatedAt = Date.parse("2030-01-01T00:00:30Z");
  const lastHeartbeat = Date.parse(
    tampered ? "2030-01-01T00:00:00Z" : "2030-01-01T00:00:25Z",
  );
  const ageSeconds = (evaluatedAt - lastHeartbeat) / 1000;
  const stale = ageSeconds > 10;
  return finish(definition, tampered, "ACTIVE", {
    decision: stale ? "REVOKED" : "ALLOW",
    reasons: stale
      ? ["TELEMETRY_MISSING_FAIL_CLOSED", "AUTHORIZATION_REVOKED"]
      : ["HEARTBEAT_FRESH"],
    stages: [
      stage("Evidence", "pass", "Initial packet valid"),
      stage("Recompute", "pass", "Assessment matches"),
      stage("Bind", "pass", "Lease digest valid"),
      stage("Trust", "pass", "Monitor identity valid"),
      stage("Monitor", stale ? "fail" : "pass", `${ageSeconds}s age / 10s TTL`),
    ],
    packet: {
      monitor_id: "fixture-monitor-01",
      heartbeat_age_seconds: ageSeconds,
      heartbeat_ttl_seconds: 10,
      lifecycle_state: stale ? "INVALIDATED" : "ACTIVE",
    },
  });
}

const evaluators = {
  "forged-verdict": forgedVerdict,
  "parameter-swap": parameterSwap,
  "nonce-replay": nonceReplay,
  "correlated-quorum": correlatedQuorum,
  "evidence-deletion": evidenceDeletion,
  "silent-monitor": silentMonitor,
};

export async function evaluateCase(caseId, tampered = true) {
  const definition = CASES.find((item) => item.id === caseId);
  if (!definition || !evaluators[caseId]) {
    throw new Error(`Unknown trust-lab case: ${caseId}`);
  }
  return evaluators[caseId](definition, tampered);
}

export async function evaluateAll(tampered = true) {
  return Promise.all(CASES.map((item) => evaluateCase(item.id, tampered)));
}

export async function evaluateBlindChallenge() {
  return Promise.all(
    BLIND_CHALLENGE.map(({ caseId, tampered }) =>
      evaluateCase(caseId, tampered),
    ),
  );
}

export function scorePredictions(predictions, results) {
  const rows = results.map((result) => {
    const predicted = predictions[result.case_id] ?? null;
    const expected = result.disposition;
    return {
      case_id: result.case_id,
      predicted,
      expected,
      correct: predicted === expected,
    };
  });
  return {
    score: rows.filter((row) => row.correct).length,
    total: rows.length,
    rows,
  };
}
