import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

import { canonicalize } from "./trust-engine.js";

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const HEX_32 = /^[0-9a-f]{64}$/i;
const HEX_64 = /^[0-9a-f]{128}$/i;

function digest(value) {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function publicKeyFromRawHex(value) {
  if (!HEX_32.test(value ?? "")) {
    throw new TypeError("Ed25519 public key must be 32 bytes of hexadecimal");
  }
  const key = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(value, "hex")]);
  return createPublicKey({ key, format: "der", type: "spki" });
}

function signatureIsValid(publicKeyHex, value, signatureHex) {
  if (!HEX_64.test(signatureHex ?? "")) return false;
  try {
    const data = Buffer.from(canonicalize(value), "utf8");
    const signature = Buffer.from(signatureHex, "hex");
    return verifySignature(null, data, publicKeyFromRawHex(publicKeyHex), signature);
  } catch {
    return false;
  }
}

function bodyWithout(value, excludedKey) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([key]) => key !== excludedKey));
}

function attestationIsValid(publicKeyHex, block) {
  return Boolean(block && signatureIsValid(publicKeyHex, bodyWithout(block, "sig"), block.sig));
}

function outcome(verdict, reason, envelopeValid) {
  const prefix = reason.split(":", 1)[0];
  const families = {
    integrity: "integrity_provenance",
    occurrence: "occurrence",
    authorization: "authorization",
    check: "check_execution",
  };
  const claimFamily = verdict === "accept" ? null : families[prefix] ?? null;
  return { verdict, reason, claim_family: claimFamily, envelope_valid: envelopeValid };
}

export function verifyReceiptClaim(receipt, context) {
  const { evaluationTime, freshnessWindowSeconds, publicKeys } = context;

  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return outcome("reject", "integrity: receipt is not an object", false);
  }

  const actionDigestMatches = receipt.action_digest === digest(receipt.action ?? {});
  if (!actionDigestMatches) {
    return outcome("reject", "integrity: action_digest != hash(action)", false);
  }

  const envelopeValid = signatureIsValid(
    publicKeys.emitter,
    bodyWithout(receipt, "envelope_sig"),
    receipt.envelope_sig,
  );
  if (!envelopeValid) {
    return outcome("reject", "integrity: envelope signature invalid", false);
  }

  const claims = receipt.claims ?? {};
  const authorization = claims.authorization;
  if (!authorization) {
    return outcome("reject", "authorization: missing evidence", true);
  }
  if (!attestationIsValid(publicKeys.authz, authorization)) {
    return outcome("reject", "authorization: not attested by authorization authority", true);
  }
  if (authorization.action_digest !== receipt.action_digest) {
    return outcome("reject", "authorization: bound to a different action", true);
  }
  if (authorization.params_digest !== digest(receipt.action?.params ?? {})) {
    return outcome("reject", "authorization: params do not match the action", true);
  }

  const occurrence = claims.occurrence;
  if (!occurrence) {
    return outcome("reject", "occurrence: missing evidence", true);
  }
  if (!attestationIsValid(publicKeys.exec, occurrence)) {
    return outcome("reject", "occurrence: not attested by execution authority", true);
  }
  if (occurrence.action_digest !== receipt.action_digest) {
    return outcome("reject", "occurrence: acknowledgment bound to another action", true);
  }

  const check = claims.check;
  if (!check) {
    return outcome("reject", "check: missing evidence", true);
  }
  if (!attestationIsValid(publicKeys.checker, check)) {
    const emitterSelfAssertion = attestationIsValid(publicKeys.emitter, check);
    return outcome(
      "reject",
      emitterSelfAssertion
        ? "check: attested by the emitter, not the checker authority"
        : "check: checker attestation does not verify (substituted or forged)",
      true,
    );
  }

  const issuedAt = Number(check.issued_at);
  if (!Number.isFinite(issuedAt) || issuedAt > evaluationTime) {
    return outcome("reject", "check: transcript timestamp is in the future", true);
  }
  if (evaluationTime - issuedAt > freshnessWindowSeconds) {
    return outcome("reject", "check: stale transcript (outside freshness window)", true);
  }
  if (check.input_digest !== receipt.tool_set_digest) {
    return outcome("reject", "check: result bound to the wrong tool-set digest", true);
  }
  if (check.output !== "pass") {
    return outcome("reject", "check: recorded output is not a pass", true);
  }

  return outcome("accept", "all four properties independently supported", true);
}

function assertFixtureSetShape(fixtureSet) {
  if (!fixtureSet || typeof fixtureSet !== "object") {
    throw new TypeError("Fixture set must be a JSON object");
  }
  if (!Array.isArray(fixtureSet.fixtures) || fixtureSet.fixtures.length === 0) {
    throw new TypeError("Fixture set must contain at least one fixture");
  }
  for (const key of ["emitter", "checker", "authz", "exec"]) {
    if (!HEX_32.test(fixtureSet.public_keys?.[key] ?? "")) {
      throw new TypeError(`Fixture set is missing a valid ${key} public key`);
    }
  }
  if (!Number.isInteger(fixtureSet.evaluation_time)) {
    throw new TypeError("Fixture set evaluation_time must be an integer");
  }
  if (!Number.isInteger(fixtureSet.freshness_window_seconds) ||
      fixtureSet.freshness_window_seconds < 0) {
    throw new TypeError("Fixture set freshness_window_seconds must be a non-negative integer");
  }
  const seenIds = new Set();
  for (const fixture of fixtureSet.fixtures) {
    if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) {
      throw new TypeError("Every fixture must be a JSON object");
    }
    if (typeof fixture.id !== "string" || fixture.id.length === 0) {
      throw new TypeError("Every fixture must have a non-empty string id");
    }
    if (seenIds.has(fixture.id)) {
      throw new TypeError(`Duplicate fixture id: ${fixture.id}`);
    }
    seenIds.add(fixture.id);
    if (fixture.envelope_valid !== true) {
      throw new TypeError(`Fixture ${fixture.id} must declare an envelope-valid semantic test`);
    }
    if (!["accept", "reject"].includes(fixture.expected?.verdict)) {
      throw new TypeError(`Fixture ${fixture.id} expected verdict must be accept or reject`);
    }
    if (typeof fixture.expected?.reason !== "string") {
      throw new TypeError(`Fixture ${fixture.id} must declare an expected reason`);
    }
  }
}

export function verifyRclFixtureSet(fixtureSet, source = {}) {
  assertFixtureSetShape(fixtureSet);

  const context = {
    evaluationTime: fixtureSet.evaluation_time,
    freshnessWindowSeconds: fixtureSet.freshness_window_seconds,
    publicKeys: fixtureSet.public_keys,
  };

  const cases = fixtureSet.fixtures.map((fixture) => {
    const actual = verifyReceiptClaim(fixture.receipt, context);
    const expected = fixture.expected ?? {};
    const verdictMatch = actual.verdict === expected.verdict;
    const familyMatch = actual.claim_family === (expected.claim_family ?? null);
    const reasonMatch = actual.reason === expected.reason;
    const envelopeExpectationMatch = actual.envelope_valid === Boolean(fixture.envelope_valid);
    return {
      id: fixture.id,
      name: fixture.name,
      expected_verdict: expected.verdict,
      actual_verdict: actual.verdict,
      expected_claim_family: expected.claim_family ?? null,
      actual_claim_family: actual.claim_family,
      expected_reason: expected.reason,
      actual_reason: actual.reason,
      envelope_valid: actual.envelope_valid,
      match: verdictMatch && familyMatch && reasonMatch && envelopeExpectationMatch,
    };
  });

  const acceptControls = cases.filter((item) => item.expected_verdict === "accept");
  const rejectVectors = cases.filter((item) => item.expected_verdict === "reject");
  const matches = cases.filter((item) => item.match).length;
  const allAcceptControlsSurvive =
    acceptControls.length > 0 &&
    acceptControls.every((item) => item.actual_verdict === "accept");
  const allRejectVectorsDetected =
    rejectVectors.length > 0 &&
    rejectVectors.every((item) => item.actual_verdict === "reject");
  const declaredCountsMatch =
    fixtureSet.counts?.total === cases.length &&
    fixtureSet.counts?.accept === acceptControls.length &&
    fixtureSet.counts?.reject === rejectVectors.length;

  return {
    schema: "https://vrtxomega.tech/schemas/veritas-agent-trust-lab/rcl-cross-evaluation/v0.1",
    verifier: {
      name: "VERITAS Omega Agent Trust Lab RCL verifier",
      version: "0.1.0",
      implementation: "lib/rcl-verifier.js",
    },
    source,
    corpus: {
      schema_version: fixtureSet.schema_version,
      generated_by: fixtureSet.generated_by,
      source_module: fixtureSet.source_module,
      evaluation_time: fixtureSet.evaluation_time,
      freshness_window_seconds: fixtureSet.freshness_window_seconds,
      declared_counts: fixtureSet.counts,
      observed_counts: {
        total: cases.length,
        accept: acceptControls.length,
        reject: rejectVectors.length,
      },
      coverage_gaps: fixtureSet.coverage_gaps,
    },
    result:
      matches === cases.length &&
      allAcceptControlsSurvive &&
      allRejectVectorsDetected &&
      declaredCountsMatch
        ? "PASS"
        : "FAIL",
    summary: {
      matches,
      total: cases.length,
      all_accept_controls_survive: allAcceptControlsSurvive,
      all_reject_vectors_detected: allRejectVectorsDetected,
      declared_counts_match: declaredCountsMatch,
    },
    cases,
    execution_authorized: false,
    assurance_boundary: [
      "This is an author-run compatibility result over a third-party corpus, not independent validation of VERITAS.",
      "The result establishes agreement with the pinned corpus for the exercised vectors only.",
      "It does not establish factual truth, operational key custody, production security, certification, endorsement, or execution authority.",
      "The source fixture calls its encoding JCS; this verifier reproduces the source's sorted compact JSON encoding for its ASCII-only fixture values and does not claim full RFC 8785 conformance.",
      "The corpus exposes a declared tool-set digest but not every underlying tool set; the verifier checks the signed check-to-digest binding and does not claim to reconstruct unavailable tool-set evidence.",
      "The source verifier and corpus do not exercise future-dated checker timestamps or a negative integrity_provenance vector; this cross-evaluation preserves those declared coverage limits.",
    ],
  };
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
