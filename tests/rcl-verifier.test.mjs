import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  sign,
} from "node:crypto";
import test from "node:test";

import { canonicalize } from "../lib/trust-engine.js";
import {
  verifyReceiptClaim,
  verifyRclFixtureSet,
} from "../lib/rcl-verifier.js";

function digest(value) {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function keySet() {
  return Object.fromEntries(
    ["emitter", "checker", "authz", "exec"].map((name) => {
      const pair = generateKeyPairSync("ed25519");
      const spki = pair.publicKey.export({ format: "der", type: "spki" });
      return [
        name,
        {
          privateKey: pair.privateKey,
          publicHex: spki.subarray(spki.length - 32).toString("hex"),
        },
      ];
    }),
  );
}

function signedBlock(privateKey, body) {
  return {
    ...body,
    sig: sign(null, Buffer.from(canonicalize(body)), privateKey).toString(
      "hex",
    ),
  };
}

function reseal(receipt, privateKey) {
  const body = Object.fromEntries(
    Object.entries(receipt).filter(([key]) => key !== "envelope_sig"),
  );
  return {
    ...body,
    envelope_sig: sign(
      null,
      Buffer.from(canonicalize(body)),
      privateKey,
    ).toString("hex"),
  };
}

function validReceipt(keys, now = 1_750_000_000) {
  const action = { tool: "transfer", params: { to: "acct-A", amount: 100 } };
  const actionDigest = digest(action);
  const toolSetDigest = digest([{ name: "transfer" }]);
  return reseal(
    {
      action,
      action_digest: actionDigest,
      tool_set_digest: toolSetDigest,
      claims: {
        authorization: signedBlock(keys.authz.privateKey, {
          action_digest: actionDigest,
          params_digest: digest(action.params),
        }),
        occurrence: signedBlock(keys.exec.privateKey, {
          action_digest: actionDigest,
          outcome_digest: digest({ status: "settled" }),
        }),
        check: signedBlock(keys.checker.privateKey, {
          checker_id: "tool-scan",
          version: "1.0",
          policy_digest: digest({ policy: "no-injection" }),
          input_digest: toolSetDigest,
          output: "pass",
          issued_at: now,
        }),
      },
    },
    keys.emitter.privateKey,
  );
}

function context(keys, now = 1_750_000_000) {
  return {
    evaluationTime: now,
    freshnessWindowSeconds: 300,
    publicKeys: Object.fromEntries(
      Object.entries(keys).map(([name, value]) => [name, value.publicHex]),
    ),
  };
}

test("accepts a fully bound receipt and verifies every authority", () => {
  const keys = keySet();
  const result = verifyReceiptClaim(validReceipt(keys), context(keys));
  assert.equal(result.verdict, "accept");
  assert.equal(result.envelope_valid, true);
  assert.equal(result.claim_family, null);
});

test("rejects a missing occurrence claim after a valid reseal", () => {
  const keys = keySet();
  const receipt = validReceipt(keys);
  delete receipt.claims.occurrence;
  const result = verifyReceiptClaim(
    reseal(receipt, keys.emitter.privateKey),
    context(keys),
  );
  assert.equal(result.reason, "occurrence: missing evidence");
  assert.equal(result.claim_family, "occurrence");
});

test("rejects authorization bound to different parameters", () => {
  const keys = keySet();
  const receipt = validReceipt(keys);
  receipt.claims.authorization = signedBlock(keys.authz.privateKey, {
    action_digest: receipt.action_digest,
    params_digest: digest({ to: "acct-EVIL", amount: 100 }),
  });
  const result = verifyReceiptClaim(
    reseal(receipt, keys.emitter.privateKey),
    context(keys),
  );
  assert.equal(
    result.reason,
    "authorization: params do not match the action",
  );
});

test("rejects an emitter self-attested checker claim", () => {
  const keys = keySet();
  const receipt = validReceipt(keys);
  const checkBody = Object.fromEntries(
    Object.entries(receipt.claims.check).filter(([key]) => key !== "sig"),
  );
  receipt.claims.check = signedBlock(keys.emitter.privateKey, checkBody);
  const result = verifyReceiptClaim(
    reseal(receipt, keys.emitter.privateKey),
    context(keys),
  );
  assert.equal(
    result.reason,
    "check: attested by the emitter, not the checker authority",
  );
});

test("rejects stale, future, wrong-tool-set, and non-passing checks", () => {
  const keys = keySet();
  for (const [mutation, expected] of [
    [
      (body) => ({ ...body, issued_at: 1_749_999_699 }),
      "check: stale transcript (outside freshness window)",
    ],
    [
      (body) => ({ ...body, issued_at: 1_750_000_001 }),
      "check: transcript timestamp is in the future",
    ],
    [
      (body) => ({ ...body, input_digest: digest([{ name: "other" }]) }),
      "check: result bound to the wrong tool-set digest",
    ],
    [
      (body) => ({ ...body, output: "fail" }),
      "check: recorded output is not a pass",
    ],
  ]) {
    const receipt = validReceipt(keys);
    const body = Object.fromEntries(
      Object.entries(receipt.claims.check).filter(([key]) => key !== "sig"),
    );
    receipt.claims.check = signedBlock(keys.checker.privateKey, mutation(body));
    const result = verifyReceiptClaim(
      reseal(receipt, keys.emitter.privateKey),
      context(keys),
    );
    assert.equal(result.reason, expected);
  }
});

test("rejects a changed action and a tampered envelope", () => {
  const keys = keySet();
  const changedAction = validReceipt(keys);
  changedAction.action.params.amount = 1000;
  assert.equal(
    verifyReceiptClaim(changedAction, context(keys)).reason,
    "integrity: action_digest != hash(action)",
  );

  const changedEnvelope = validReceipt(keys);
  changedEnvelope.claims.check.checker_id = "substituted";
  assert.equal(
    verifyReceiptClaim(changedEnvelope, context(keys)).reason,
    "integrity: envelope signature invalid",
  );
});

test("fixture-set scoring requires both reject vectors and accept controls", () => {
  const keys = keySet();
  const clean = validReceipt(keys);
  const missing = validReceipt(keys);
  delete missing.claims.occurrence;
  const rejected = reseal(missing, keys.emitter.privateKey);
  const fixtures = [
    {
      id: "TEST-ACCEPT",
      name: "positive control",
      envelope_valid: true,
      receipt: clean,
      expected: {
        verdict: "accept",
        claim_family: null,
        reason: "all four properties independently supported",
      },
    },
    {
      id: "TEST-REJECT",
      name: "negative vector",
      envelope_valid: true,
      receipt: rejected,
      expected: {
        verdict: "reject",
        claim_family: "occurrence",
        reason: "occurrence: missing evidence",
      },
    },
  ];
  const report = verifyRclFixtureSet({
    schema_version: "test",
    generated_by: "test",
    source_module: "test",
    evaluation_time: 1_750_000_000,
    freshness_window_seconds: 300,
    public_keys: context(keys).publicKeys,
    counts: { total: 2, accept: 1, reject: 1 },
    coverage_gaps: { families_with_no_negative_vector: [] },
    fixtures,
  });
  assert.equal(report.result, "PASS");
  assert.equal(report.summary.matches, 2);
  assert.equal(report.summary.all_accept_controls_survive, true);
  assert.equal(report.summary.all_reject_vectors_detected, true);
  assert.equal(report.execution_authorized, false);
});

test("fixture-set scoring rejects a reject-everything corpus", () => {
  const keys = keySet();
  const missing = validReceipt(keys);
  delete missing.claims.occurrence;
  const rejected = reseal(missing, keys.emitter.privateKey);
  const report = verifyRclFixtureSet({
    schema_version: "test",
    generated_by: "test",
    source_module: "test",
    evaluation_time: 1_750_000_000,
    freshness_window_seconds: 300,
    public_keys: context(keys).publicKeys,
    counts: { total: 1, accept: 0, reject: 1 },
    coverage_gaps: { families_with_no_negative_vector: [] },
    fixtures: [
      {
        id: "TEST-REJECT-ONLY",
        name: "negative vector only",
        envelope_valid: true,
        receipt: rejected,
        expected: {
          verdict: "reject",
          claim_family: "occurrence",
          reason: "occurrence: missing evidence",
        },
      },
    ],
  });
  assert.equal(report.result, "FAIL");
  assert.equal(report.summary.all_accept_controls_survive, false);
});

test("fixture-set validation rejects duplicate ids and invalid envelopes", () => {
  const keys = keySet();
  const clean = validReceipt(keys);
  const base = {
    schema_version: "test",
    generated_by: "test",
    source_module: "test",
    evaluation_time: 1_750_000_000,
    freshness_window_seconds: 300,
    public_keys: context(keys).publicKeys,
    counts: { total: 2, accept: 2, reject: 0 },
    coverage_gaps: { families_with_no_negative_vector: [] },
  };
  const fixture = {
    id: "DUPLICATE",
    name: "positive control",
    envelope_valid: true,
    receipt: clean,
    expected: {
      verdict: "accept",
      claim_family: null,
      reason: "all four properties independently supported",
    },
  };
  assert.throws(
    () => verifyRclFixtureSet({ ...base, fixtures: [fixture, fixture] }),
    /Duplicate fixture id/,
  );
  assert.throws(
    () =>
      verifyRclFixtureSet({
        ...base,
        counts: { total: 1, accept: 1, reject: 0 },
        fixtures: [{ ...fixture, envelope_valid: false }],
      }),
    /envelope-valid semantic test/,
  );
});
