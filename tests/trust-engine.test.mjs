import assert from "node:assert/strict";
import test from "node:test";
import {
  BLIND_CHALLENGE,
  CASES,
  canonicalize,
  evaluateAll,
  evaluateBlindChallenge,
  evaluateCase,
  scorePredictions,
  sha256,
} from "../lib/trust-engine.js";

test("all six hostile fixtures fail closed", async () => {
  const results = await evaluateAll(true);
  assert.equal(results.length, 6);
  for (const result of results) {
    assert.notEqual(result.verified_result, "ALLOW");
    assert.equal(result.disposition, "BLOCK");
    assert.equal(result.execution_authorized, false);
    assert.ok(result.reason_codes.length >= 1);
  }
});

test("all six clean fixtures pass their declared local boundary", async () => {
  const results = await evaluateAll(false);
  for (const result of results) {
    assert.equal(result.verified_result, "ALLOW");
    assert.equal(result.disposition, "ALLOW");
    assert.equal(result.execution_authorized, false);
  }
});

test("blind challenge has a hidden three-clean, three-hostile mix", async () => {
  const results = await evaluateBlindChallenge();
  assert.equal(BLIND_CHALLENGE.length, CASES.length);
  assert.equal(results.filter((result) => result.disposition === "ALLOW").length, 3);
  assert.equal(results.filter((result) => result.disposition === "BLOCK").length, 3);
});

test("scoring uses sealed predictions and deterministic dispositions", async () => {
  const results = await evaluateBlindChallenge();
  const predictions = Object.fromEntries(
    results.map((result) => [result.case_id, result.disposition]),
  );
  assert.equal(scorePredictions(predictions, results).score, 6);
  predictions[results[0].case_id] =
    results[0].disposition === "ALLOW" ? "BLOCK" : "ALLOW";
  assert.equal(scorePredictions(predictions, results).score, 5);
});

test("forged verdict recomputes to conflicted", async () => {
  const result = await evaluateCase("forged-verdict", true);
  assert.equal(result.claimed_result, "SUPPORTED_ONLY");
  assert.equal(result.packet.recomputed_state, "CONFLICTED");
  assert.ok(result.reason_codes.includes("DERIVED_RESULT_MISMATCH"));
});

test("parameter mutation changes the exact action digest", async () => {
  const result = await evaluateCase("parameter-swap", true);
  assert.notEqual(result.packet.approved_digest, result.packet.presented_digest);
  assert.ok(result.reason_codes.includes("ACTION_DIGEST_MISMATCH"));
});

test("nonce reuse is rejected", async () => {
  const result = await evaluateCase("nonce-replay", true);
  assert.equal(result.packet.prior_consumptions, 1);
  assert.ok(result.reason_codes.includes("REPLAY_REJECTED"));
});

test("correlated evaluators count as one independent group", async () => {
  const result = await evaluateCase("correlated-quorum", true);
  assert.equal(result.packet.evaluator_count, 2);
  assert.equal(result.packet.independent_group_count, 1);
  assert.ok(result.reason_codes.includes("CORRELATED_QUORUM"));
});

test("deleted refuting evidence breaks sealed identity", async () => {
  const result = await evaluateCase("evidence-deletion", true);
  assert.equal(result.packet.evidence_items, 1);
  assert.notEqual(
    result.packet.sealed_evidence_digest,
    result.packet.presented_evidence_digest,
  );
});

test("stale heartbeat revokes the lifecycle", async () => {
  const result = await evaluateCase("silent-monitor", true);
  assert.equal(result.verified_result, "REVOKED");
  assert.equal(result.packet.lifecycle_state, "INVALIDATED");
  assert.ok(result.reason_codes.includes("TELEMETRY_MISSING_FAIL_CLOSED"));
});

test("canonicalization and digesting ignore object key order", async () => {
  const left = { z: 3, nested: { b: 2, a: 1 } };
  const right = { nested: { a: 1, b: 2 }, z: 3 };
  assert.equal(canonicalize(left), canonicalize(right));
  assert.equal(await sha256(left), await sha256(right));
});
