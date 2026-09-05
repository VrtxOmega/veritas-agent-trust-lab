import assert from "node:assert/strict";
import test from "node:test";

import {
  SOURCE_FILES,
  canonicalJson,
  runPublishedTamperRegressions,
  sha256Bytes,
  sha256Canonical,
  verifyAuthorityExecutionReplayPacket,
  verifyHandoffManifest,
} from "../lib/authority-execution-replay-verifier.js";

const SOURCE_DIGESTS = Object.freeze({
  "event_bundle.py":
    "24cd0fdf183dbabff7a9f8ab7dd5b9209e79ce769dcf6a8a8516c93be9fd7a0a",
  "executor.py":
    "c008d2dd69956dcec334ed3840942dce4580de20f78dfcbb0fe1982f30fe2231",
  "profile.py":
    "20bd7d11c981bd66694fafdad9dc7b70dc5c19bfe6c7e45e9fef53d864d7acbb",
});

function action(target, mode = "read") {
  return {
    operation: "read_synthetic_sensitive_record",
    target,
    mode,
    payload_class: "synthetic-restricted",
  };
}

function authorization(decisionId, actionDigest) {
  return {
    decision_id: decisionId,
    action_digest: actionDigest,
    expires_at: "2026-09-03T00:00:00Z",
    fixture_id: "authority-profile-fixture-v1",
  };
}

function execution(auth, occurred) {
  const observedState = occurred ? "EXECUTED" : "DENIED_BEFORE_EXECUTION";
  const markerId = occurred ? "FIXTURE_EXECUTED" : "FIXTURE_DENIED";
  const event = {
    marker_id: markerId,
    fixture_id: auth.fixture_id,
    executor_id: "synthetic-fixture-executor",
    decision_id: auth.decision_id,
    action_digest: auth.action_digest,
    observed_state: observedState,
    observed_at: "2026-08-07T02:00:00Z",
  };
  const eventDigest = sha256Canonical(event);
  const unsignedBundle = {
    bundle_version: "0.1-internal",
    events: [event],
    event_sha256: eventDigest,
  };
  const bundle = {
    ...unsignedBundle,
    bundle_sha256: sha256Canonical(unsignedBundle),
  };
  const observation = {
    ...event,
    evidence_sha256: eventDigest,
    bundle_sha256: bundle.bundle_sha256,
  };
  const value = { state: observedState, observation, bundle };
  if (occurred) {
    value.receipt = {
      executor_id: observation.executor_id,
      decision_id: observation.decision_id,
      action_digest: observation.action_digest,
      occurred_at: observation.observed_at,
      evidence_sha256: observation.evidence_sha256,
      bundle_sha256: observation.bundle_sha256,
    };
  }
  return value;
}

function scenario(id, attemptedAction, authorizedDigest, policyDecision, occurred) {
  const auth = authorization(id, authorizedDigest);
  return {
    id,
    human_sponsorship: {
      sponsor_id: "synthetic-human-sponsor-v1",
      sponsorship_ref: "fixture-sponsorship-v1",
      scope: "owned-fixture-only",
    },
    delegated_authority: auth,
    policy_decision: policyDecision,
    authorized_action: authorizedDigest,
    attempted_action: attemptedAction,
    attempted_action_sha256: sha256Canonical(attemptedAction),
    profile_record: {
      schema_version: "0.1-internal",
      subject: {
        artifact_sha256: sha256Canonical({
          fixture: "authority-execution-replay-v1",
        }),
      },
      authorization: auth,
      execution: execution(auth, occurred),
      claim: { occurred },
    },
    expected: { occurred },
  };
}

function packet() {
  const allowed = action("fixture://sensitive/customer-001");
  const wrongTarget = action("fixture://sensitive/customer-002");
  const mutated = action("fixture://sensitive/customer-001", "export");
  const allowedDigest = sha256Canonical(allowed);
  const wrongDigest = sha256Canonical(wrongTarget);
  return {
    schema_version: "0.1-internal-replay",
    scope: "synthetic, owned-fixture, networkless replay only",
    claim_boundary:
      "This packet demonstrates a local data-contract verifier over owned fixtures. " +
      "It does not establish a real MCP/API action, production enforcement, external identity, " +
      "or independent validation.",
    source: {
      files: { ...SOURCE_DIGESTS },
      replay_command:
        "PYTHONDONTWRITEBYTECODE=1 python3 verify_replay_packet.py <packet.json>",
    },
    scenarios: [
      scenario(
        "allow-exact-action",
        allowed,
        allowedDigest,
        "ALLOW_EXACT_ACTION",
        true,
      ),
      scenario(
        "deny-wrong-target",
        wrongTarget,
        wrongDigest,
        "DENY_WRONG_TARGET",
        false,
      ),
      scenario(
        "deny-post-approval-mutation",
        mutated,
        allowedDigest,
        "DENY_POST_APPROVAL_MUTATION",
        false,
      ),
    ],
  };
}

function verify(value) {
  const bytes = Buffer.from(`${canonicalJson(value)}\n`, "utf8");
  return verifyAuthorityExecutionReplayPacket(value, {
    packetBytes: bytes,
    expectedPacketSha256: sha256Bytes(bytes),
    sourceFileDigests: SOURCE_DIGESTS,
  });
}

test("reproduces the three controls without authorizing execution", () => {
  const result = verify(packet());
  assert.equal(result.result, "PASS_WITH_LIMITS");
  assert.equal(result.summary.controls_matched, 3);
  assert.equal(result.summary.exact_action_allow_survives, true);
  assert.equal(result.summary.deny_controls_survive, true);
  assert.equal(result.summary.reject_everything_protected, true);
  assert.equal(result.execution_authorized, false);
});

test("reports that wrong-target policy is asserted rather than derived", () => {
  const result = verify(packet());
  assert.ok(
    result.limitations.some(
      (item) =>
        item.code === "WRONG_TARGET_POLICY_NOT_INDEPENDENTLY_DERIVABLE",
    ),
  );
  const wrong = packet().scenarios.find(
    (item) => item.id === "deny-wrong-target",
  );
  assert.equal(wrong.authorized_action, wrong.attempted_action_sha256);
  assert.equal(
    wrong.delegated_authority.action_digest,
    wrong.attempted_action_sha256,
  );
});

test("detects all six published tamper classes without relying on the outer packet hash", () => {
  const results = runPublishedTamperRegressions(packet(), {
    sourceFileDigests: SOURCE_DIGESTS,
  });
  assert.deepEqual(
    results.map((item) => item.id),
    [
      "action-retargeting",
      "source-digest-corruption",
      "policy-decision-flip",
      "occurrence-claim-flip",
      "mutation-erasure",
      "production-scope-widening",
    ],
  );
  assert.ok(results.every((item) => item.detected));
});

test("fails closed for a corrupt packet digest and corrupt source bytes", () => {
  const value = packet();
  const bytes = Buffer.from(`${canonicalJson(value)}\n`, "utf8");
  const packetFailure = verifyAuthorityExecutionReplayPacket(value, {
    packetBytes: bytes,
    expectedPacketSha256: "0".repeat(64),
    sourceFileDigests: SOURCE_DIGESTS,
  });
  assert.equal(packetFailure.result, "FAIL");
  assert.ok(
    packetFailure.errors.some((item) => item.code === "PACKET_DIGEST_MISMATCH"),
  );

  const sourceFailure = verifyAuthorityExecutionReplayPacket(value, {
    sourceFileDigests: { ...SOURCE_DIGESTS, "profile.py": "0".repeat(64) },
  });
  assert.equal(sourceFailure.result, "FAIL");
  assert.ok(
    sourceFailure.errors.some((item) => item.code === "SOURCE_DIGEST_MISMATCH"),
  );
});

test("fails when reject-everything erases the positive control", () => {
  const value = packet();
  const allow = value.scenarios.find((item) => item.id === "allow-exact-action");
  allow.profile_record.execution = execution(allow.delegated_authority, false);
  allow.profile_record.claim.occurred = false;
  allow.expected.occurred = false;
  const result = verify(value);
  assert.equal(result.result, "FAIL");
  assert.equal(result.summary.exact_action_allow_survives, false);
  assert.equal(result.summary.reject_everything_protected, false);
});

test("requires an exact three-control set and intact cross-control shapes", () => {
  const duplicate = packet();
  duplicate.scenarios[1].id = "allow-exact-action";
  const duplicateResult = verify(duplicate);
  assert.equal(duplicateResult.result, "FAIL");
  assert.ok(
    duplicateResult.errors.some((item) => item.code === "DUPLICATE_CONTROL_ID"),
  );

  const shape = packet();
  shape.scenarios[1].attempted_action.mode = "export";
  shape.scenarios[1].attempted_action_sha256 = sha256Canonical(
    shape.scenarios[1].attempted_action,
  );
  shape.scenarios[1].authorized_action = shape.scenarios[1].attempted_action_sha256;
  shape.scenarios[1].delegated_authority.action_digest =
    shape.scenarios[1].attempted_action_sha256;
  shape.scenarios[1].profile_record.authorization.action_digest =
    shape.scenarios[1].attempted_action_sha256;
  const shapeResult = verify(shape);
  assert.equal(shapeResult.result, "FAIL");
  assert.ok(
    shapeResult.errors.some(
      (item) => item.code === "WRONG_TARGET_CONTROL_SHAPE_MISMATCH",
    ),
  );
});

test("validates the handoff manifest without reading the reference verifier", () => {
  const manifest = {
    packet_sha256:
      "afaf6090332d636e3c36a6110073e601c2348a38222520d29184cc602ea83a08",
    required_controls: [
      "allow-exact-action",
      "deny-wrong-target",
      "deny-post-approval-mutation",
    ],
    independence_rule:
      "Do not import, copy, or inspect verify_replay_packet.py before independently implementing a verifier.",
    files: {
      ...SOURCE_DIGESTS,
      "replay-packets/authority-execution-replay-v1.json":
        "afaf6090332d636e3c36a6110073e601c2348a38222520d29184cc602ea83a08",
    },
  };
  const result = verifyHandoffManifest(manifest);
  assert.equal(result.valid, true);
  assert.deepEqual(SOURCE_FILES, ["event_bundle.py", "executor.py", "profile.py"]);
});

test("fails closed on malformed controls and manifest lists", () => {
  const malformedPacket = packet();
  malformedPacket.scenarios[0] = null;
  assert.doesNotThrow(() => verify(malformedPacket));
  assert.equal(verify(malformedPacket).result, "FAIL");
  assert.ok(
    runPublishedTamperRegressions(malformedPacket, {
      sourceFileDigests: SOURCE_DIGESTS,
    }).every((item) => item.detected === false),
  );

  const malformedManifest = {
    packet_sha256:
      "afaf6090332d636e3c36a6110073e601c2348a38222520d29184cc602ea83a08",
    required_controls: {},
    independence_rule: "verify_replay_packet.py remains unread",
    files: {},
  };
  assert.doesNotThrow(() => verifyHandoffManifest(malformedManifest));
  assert.equal(verifyHandoffManifest(malformedManifest).valid, false);
});
