import { createHash } from "node:crypto";

export const AUTHORITY_REPLAY_SOURCE = Object.freeze({
  repository: "msaleme/authority-execution-replay",
  commit: "ad0b7d66878111fa272a2c3fb6a26538e144b904",
  packetPath: "source/replay-packets/authority-execution-replay-v1.json",
  packetSha256:
    "afaf6090332d636e3c36a6110073e601c2348a38222520d29184cc602ea83a08",
  manifestSha256:
    "9a3e2e44a7602cf35710fd6d82ccee22022ee1044700064ec551ed444ea4bb94",
});

export const SOURCE_FILES = Object.freeze([
  "event_bundle.py",
  "executor.py",
  "profile.py",
]);

const PACKET_KEYS = new Set([
  "claim_boundary",
  "scenarios",
  "schema_version",
  "scope",
  "source",
]);
const SCENARIO_KEYS = new Set([
  "attempted_action",
  "attempted_action_sha256",
  "authorized_action",
  "delegated_authority",
  "expected",
  "human_sponsorship",
  "id",
  "policy_decision",
  "profile_record",
]);
const ACTION_KEYS = new Set([
  "mode",
  "operation",
  "payload_class",
  "target",
]);
const AUTHORIZATION_KEYS = new Set([
  "action_digest",
  "decision_id",
  "expires_at",
  "fixture_id",
]);
const RECORD_KEYS = new Set([
  "authorization",
  "claim",
  "execution",
  "schema_version",
  "subject",
]);
const EXECUTION_KEYS = new Set(["bundle", "observation", "receipt", "state"]);
const EVENT_KEYS = new Set([
  "action_digest",
  "decision_id",
  "executor_id",
  "fixture_id",
  "marker_id",
  "observed_at",
  "observed_state",
]);
const OBSERVATION_KEYS = new Set([
  ...EVENT_KEYS,
  "bundle_sha256",
  "evidence_sha256",
]);
const RECEIPT_KEYS = new Set([
  "action_digest",
  "bundle_sha256",
  "decision_id",
  "evidence_sha256",
  "executor_id",
  "occurred_at",
]);
const EXPECTED_EXECUTOR_ID = "synthetic-fixture-executor";
const EXPECTED_FIXTURE_ID = "authority-profile-fixture-v1";
const EXPECTED_SCOPE = "synthetic, owned-fixture, networkless replay only";
const EXPECTED_CLAIM_BOUNDARY =
  "This packet demonstrates a local data-contract verifier over owned fixtures. " +
  "It does not establish a real MCP/API action, production enforcement, external identity, " +
  "or independent validation.";
const EXPECTED_SOURCE_DIGESTS = Object.freeze({
  "event_bundle.py":
    "24cd0fdf183dbabff7a9f8ab7dd5b9209e79ce769dcf6a8a8516c93be9fd7a0a",
  "executor.py":
    "c008d2dd69956dcec334ed3840942dce4580de20f78dfcbb0fe1982f30fe2231",
  "profile.py":
    "20bd7d11c981bd66694fafdad9dc7b70dc5c19bfe6c7e45e9fef53d864d7acbb",
});
const CONTROL_CONTRACTS = Object.freeze({
  "allow-exact-action": {
    policyDecision: "ALLOW_EXACT_ACTION",
    occurred: true,
    state: "EXECUTED",
    actionRelationship: "same",
  },
  "deny-wrong-target": {
    policyDecision: "DENY_WRONG_TARGET",
    occurred: false,
    state: "DENIED_BEFORE_EXECUTION",
    actionRelationship: "same",
  },
  "deny-post-approval-mutation": {
    policyDecision: "DENY_POST_APPROVAL_MUTATION",
    occurred: false,
    state: "DENIED_BEFORE_EXECUTION",
    actionRelationship: "different",
  },
});

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortJson(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortJson(value));
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Canonical(value) {
  return sha256Bytes(Buffer.from(canonicalJson(value), "utf8"));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isCanonicalId(value) {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

function utcInstant(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
  ) {
    return null;
  }
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function issue(errors, code, path, detail) {
  errors.push({ code, path, detail });
}

function requireExactKeys(value, expected, path, errors) {
  if (!isObject(value)) {
    issue(errors, "OBJECT_REQUIRED", path, "expected an object");
    return false;
  }
  const actual = new Set(Object.keys(value));
  const missing = [...expected].filter((key) => !actual.has(key));
  const unsupported = [...actual].filter((key) => !expected.has(key));
  if (missing.length) {
    issue(
      errors,
      "MISSING_FIELDS",
      path,
      `missing fields: ${missing.sort().join(", ")}`,
    );
  }
  if (unsupported.length) {
    issue(
      errors,
      "UNSUPPORTED_FIELDS",
      path,
      `unsupported fields: ${unsupported.sort().join(", ")}`,
    );
  }
  return missing.length === 0 && unsupported.length === 0;
}

function requireAllowedKeys(value, required, allowed, path, errors) {
  if (!isObject(value)) {
    issue(errors, "OBJECT_REQUIRED", path, "expected an object");
    return false;
  }
  const actual = new Set(Object.keys(value));
  const missing = [...required].filter((key) => !actual.has(key));
  const unsupported = [...actual].filter((key) => !allowed.has(key));
  if (missing.length) {
    issue(
      errors,
      "MISSING_FIELDS",
      path,
      `missing fields: ${missing.sort().join(", ")}`,
    );
  }
  if (unsupported.length) {
    issue(
      errors,
      "UNSUPPORTED_FIELDS",
      path,
      `unsupported fields: ${unsupported.sort().join(", ")}`,
    );
  }
  return missing.length === 0 && unsupported.length === 0;
}

function validateAction(action, path, errors) {
  if (!requireExactKeys(action, ACTION_KEYS, path, errors)) return;
  for (const key of ACTION_KEYS) {
    if (typeof action[key] !== "string" || action[key].length === 0) {
      issue(errors, "ACTION_FIELD_INVALID", `${path}.${key}`, "expected a non-empty string");
    }
  }
  if (action.operation !== "read_synthetic_sensitive_record") {
    issue(errors, "ACTION_OPERATION_OUT_OF_SCOPE", `${path}.operation`, "unexpected operation");
  }
  if (!/^fixture:\/\/sensitive\/customer-\d{3}$/.test(action.target)) {
    issue(errors, "ACTION_TARGET_OUT_OF_SCOPE", `${path}.target`, "target is outside the owned fixture namespace");
  }
  if (!new Set(["read", "export"]).has(action.mode)) {
    issue(errors, "ACTION_MODE_OUT_OF_SCOPE", `${path}.mode`, "unexpected action mode");
  }
  if (action.payload_class !== "synthetic-restricted") {
    issue(errors, "ACTION_PAYLOAD_OUT_OF_SCOPE", `${path}.payload_class`, "unexpected payload class");
  }
}

function validateAuthorization(authorization, path, errors) {
  if (!requireExactKeys(authorization, AUTHORIZATION_KEYS, path, errors)) return;
  if (!isCanonicalId(authorization.decision_id)) {
    issue(errors, "DECISION_ID_INVALID", `${path}.decision_id`, "expected a canonical identifier");
  }
  if (!isSha256(authorization.action_digest)) {
    issue(errors, "ACTION_DIGEST_INVALID", `${path}.action_digest`, "expected a lowercase SHA-256 digest");
  }
  if (authorization.fixture_id !== EXPECTED_FIXTURE_ID) {
    issue(errors, "FIXTURE_ID_UNDECLARED", `${path}.fixture_id`, "unexpected owned fixture identifier");
  }
  if (utcInstant(authorization.expires_at) === null) {
    issue(errors, "AUTHORIZATION_EXPIRY_INVALID", `${path}.expires_at`, "expected a UTC ISO-8601 instant");
  }
}

function validateBundle(bundle, path, errors) {
  const keys = new Set(["bundle_sha256", "bundle_version", "event_sha256", "events"]);
  if (!requireExactKeys(bundle, keys, path, errors)) return null;
  if (bundle.bundle_version !== "0.1-internal") {
    issue(errors, "BUNDLE_VERSION_UNSUPPORTED", `${path}.bundle_version`, "unexpected bundle version");
  }
  if (!Array.isArray(bundle.events) || bundle.events.length !== 1) {
    issue(errors, "BUNDLE_EVENT_CARDINALITY", `${path}.events`, "expected exactly one event");
    return null;
  }
  const event = bundle.events[0];
  if (!requireExactKeys(event, EVENT_KEYS, `${path}.events[0]`, errors)) return null;
  for (const key of EVENT_KEYS) {
    if (typeof event[key] !== "string" || event[key].length === 0) {
      issue(errors, "EVENT_FIELD_INVALID", `${path}.events[0].${key}`, "expected a non-empty string");
    }
  }
  const eventDigest = sha256Canonical(event);
  if (bundle.event_sha256 !== eventDigest) {
    issue(errors, "EVENT_DIGEST_MISMATCH", `${path}.event_sha256`, "event digest does not match canonical event bytes");
  }
  const unsignedBundle = {
    bundle_version: bundle.bundle_version,
    events: bundle.events,
    event_sha256: bundle.event_sha256,
  };
  const bundleDigest = sha256Canonical(unsignedBundle);
  if (bundle.bundle_sha256 !== bundleDigest) {
    issue(errors, "BUNDLE_DIGEST_MISMATCH", `${path}.bundle_sha256`, "bundle digest does not match canonical bundle bytes");
  }
  return event;
}

function validateObservation(observation, event, authorization, state, path, errors) {
  if (!requireExactKeys(observation, OBSERVATION_KEYS, path, errors)) return;
  const expectedEvent = Object.fromEntries(
    [...EVENT_KEYS].map((key) => [key, observation[key]]),
  );
  if (event && !sameJson(event, expectedEvent)) {
    issue(errors, "OBSERVATION_EVENT_MISMATCH", path, "observation does not reproduce the bundled event");
  }
  if (observation.executor_id !== EXPECTED_EXECUTOR_ID) {
    issue(errors, "OBSERVATION_EXECUTOR_UNEXPECTED", `${path}.executor_id`, "unexpected synthetic executor");
  }
  if (observation.fixture_id !== authorization.fixture_id) {
    issue(errors, "OBSERVATION_FIXTURE_MISMATCH", `${path}.fixture_id`, "observation is not bound to delegated fixture");
  }
  if (observation.decision_id !== authorization.decision_id) {
    issue(errors, "OBSERVATION_DECISION_MISMATCH", `${path}.decision_id`, "observation is not bound to delegated decision");
  }
  if (observation.action_digest !== authorization.action_digest) {
    issue(errors, "OBSERVATION_ACTION_MISMATCH", `${path}.action_digest`, "observation is not bound to delegated action");
  }
  if (observation.observed_state !== state) {
    issue(errors, "OBSERVATION_STATE_MISMATCH", `${path}.observed_state`, "observation conflicts with execution state");
  }
  const expectedMarker = state === "EXECUTED" ? "FIXTURE_EXECUTED" : "FIXTURE_DENIED";
  if (observation.marker_id !== expectedMarker) {
    issue(errors, "OBSERVATION_MARKER_MISMATCH", `${path}.marker_id`, "marker conflicts with execution state");
  }
  const observedAt = utcInstant(observation.observed_at);
  const expiresAt = utcInstant(authorization.expires_at);
  if (observedAt === null) {
    issue(errors, "OBSERVATION_TIME_INVALID", `${path}.observed_at`, "expected a UTC ISO-8601 instant");
  } else if (expiresAt !== null && observedAt >= expiresAt) {
    issue(errors, "OBSERVATION_OUTSIDE_AUTHORIZATION_WINDOW", `${path}.observed_at`, "observation is not before authorization expiry");
  }
}

function validateReceipt(receipt, observation, authorization, path, errors) {
  if (!requireExactKeys(receipt, RECEIPT_KEYS, path, errors)) return;
  const bindings = {
    action_digest: authorization.action_digest,
    bundle_sha256: observation.bundle_sha256,
    decision_id: authorization.decision_id,
    evidence_sha256: observation.evidence_sha256,
    executor_id: observation.executor_id,
    occurred_at: observation.observed_at,
  };
  for (const [key, expected] of Object.entries(bindings)) {
    if (receipt[key] !== expected) {
      issue(errors, "RECEIPT_BINDING_MISMATCH", `${path}.${key}`, `receipt field is not bound to ${key}`);
    }
  }
  if (utcInstant(receipt.occurred_at) === null) {
    issue(errors, "RECEIPT_TIME_INVALID", `${path}.occurred_at`, "expected a UTC ISO-8601 instant");
  }
}

function validateProfileRecord(record, scenario, contract, path, errors) {
  if (!requireExactKeys(record, RECORD_KEYS, path, errors)) return;
  if (record.schema_version !== "0.1-internal") {
    issue(errors, "RECORD_VERSION_UNSUPPORTED", `${path}.schema_version`, "unexpected profile record version");
  }
  if (
    !requireExactKeys(record.subject, new Set(["artifact_sha256"]), `${path}.subject`, errors) ||
    !isSha256(record.subject.artifact_sha256)
  ) {
    issue(errors, "SUBJECT_DIGEST_INVALID", `${path}.subject.artifact_sha256`, "expected a lowercase SHA-256 digest");
  }
  validateAuthorization(record.authorization, `${path}.authorization`, errors);
  if (!sameJson(record.authorization, scenario.delegated_authority)) {
    issue(errors, "PROFILE_AUTHORITY_MISMATCH", `${path}.authorization`, "profile authorization differs from delegated authority");
  }
  if (
    !requireAllowedKeys(
      record.execution,
      new Set(["bundle", "observation", "state"]),
      EXECUTION_KEYS,
      `${path}.execution`,
      errors,
    )
  ) {
    return;
  }
  const execution = record.execution;
  if (execution.state !== contract.state) {
    issue(errors, "EXECUTION_STATE_MISMATCH", `${path}.execution.state`, `expected ${contract.state}`);
  }
  const event = validateBundle(execution.bundle, `${path}.execution.bundle`, errors);
  if (!isObject(execution.observation)) {
    issue(errors, "OBSERVATION_REQUIRED", `${path}.execution.observation`, "observable state requires an observation");
  } else {
    validateObservation(
      execution.observation,
      event,
      record.authorization,
      execution.state,
      `${path}.execution.observation`,
      errors,
    );
    if (execution.observation.evidence_sha256 !== execution.bundle?.event_sha256) {
      issue(errors, "OBSERVATION_EVIDENCE_DIGEST_MISMATCH", `${path}.execution.observation.evidence_sha256`, "observation is not bound to event digest");
    }
    if (execution.observation.bundle_sha256 !== execution.bundle?.bundle_sha256) {
      issue(errors, "OBSERVATION_BUNDLE_DIGEST_MISMATCH", `${path}.execution.observation.bundle_sha256`, "observation is not bound to bundle digest");
    }
  }
  if (execution.state === "EXECUTED") {
    if (!isObject(execution.receipt)) {
      issue(errors, "EXECUTION_RECEIPT_REQUIRED", `${path}.execution.receipt`, "executed state requires a receipt");
    } else if (isObject(execution.observation)) {
      validateReceipt(
        execution.receipt,
        execution.observation,
        record.authorization,
        `${path}.execution.receipt`,
        errors,
      );
    }
  } else if (execution.receipt !== undefined) {
    issue(errors, "DENIAL_RECEIPT_FORBIDDEN", `${path}.execution.receipt`, "denial evidence cannot carry an occurrence receipt");
  }
  if (!requireExactKeys(record.claim, new Set(["occurred"]), `${path}.claim`, errors)) return;
  if (typeof record.claim.occurred !== "boolean") {
    issue(errors, "OCCURRENCE_CLAIM_INVALID", `${path}.claim.occurred`, "expected a boolean");
  }
  const observedOccurrence = execution.state === "EXECUTED";
  if (record.claim.occurred !== observedOccurrence) {
    issue(errors, "OCCURRENCE_CLAIM_MISMATCH", `${path}.claim.occurred`, "claim conflicts with execution state");
  }
}

function validateScenario(scenario, index) {
  const errors = [];
  const path = `scenarios[${index}]`;
  if (!requireExactKeys(scenario, SCENARIO_KEYS, path, errors)) {
    return { id: scenario?.id ?? null, errors };
  }
  const contract = CONTROL_CONTRACTS[scenario.id];
  if (!contract) {
    issue(errors, "CONTROL_ID_UNDECLARED", `${path}.id`, "scenario is not a required control");
    return { id: scenario.id, errors };
  }
  validateAction(scenario.attempted_action, `${path}.attempted_action`, errors);
  const attemptedDigest = sha256Canonical(scenario.attempted_action);
  if (scenario.attempted_action_sha256 !== attemptedDigest) {
    issue(errors, "ATTEMPTED_ACTION_DIGEST_MISMATCH", `${path}.attempted_action_sha256`, "attempted action digest was not recomputed correctly");
  }
  if (!isSha256(scenario.authorized_action)) {
    issue(errors, "AUTHORIZED_ACTION_DIGEST_INVALID", `${path}.authorized_action`, "expected a lowercase SHA-256 digest");
  }
  validateAuthorization(scenario.delegated_authority, `${path}.delegated_authority`, errors);
  if (scenario.delegated_authority?.decision_id !== scenario.id) {
    issue(errors, "DELEGATED_DECISION_ID_MISMATCH", `${path}.delegated_authority.decision_id`, "decision id is not bound to scenario id");
  }
  if (scenario.authorized_action !== scenario.delegated_authority?.action_digest) {
    issue(errors, "AUTHORIZED_ACTION_BINDING_MISMATCH", `${path}.authorized_action`, "authorized action differs from delegated authority digest");
  }
  const sameAction = attemptedDigest === scenario.authorized_action;
  if (contract.actionRelationship === "same" && !sameAction) {
    issue(errors, "EXACT_ACTION_BINDING_MISMATCH", `${path}.attempted_action`, "control requires attempted action to match the delegated digest");
  }
  if (contract.actionRelationship === "different" && sameAction) {
    issue(errors, "EXPECTED_MUTATION_MISSING", `${path}.attempted_action`, "mutation control no longer differs from the delegated digest");
  }
  if (scenario.policy_decision !== contract.policyDecision) {
    issue(errors, "POLICY_DECISION_MISMATCH", `${path}.policy_decision`, `expected ${contract.policyDecision}`);
  }
  if (
    !requireExactKeys(
      scenario.human_sponsorship,
      new Set(["scope", "sponsor_id", "sponsorship_ref"]),
      `${path}.human_sponsorship`,
      errors,
    )
  ) {
    return { id: scenario.id, errors };
  }
  if (scenario.human_sponsorship.scope !== "owned-fixture-only") {
    issue(errors, "SPONSORSHIP_SCOPE_WIDENED", `${path}.human_sponsorship.scope`, "sponsorship is not limited to owned fixtures");
  }
  for (const key of ["sponsor_id", "sponsorship_ref"]) {
    if (!isCanonicalId(scenario.human_sponsorship[key])) {
      issue(errors, "SPONSORSHIP_ID_INVALID", `${path}.human_sponsorship.${key}`, "expected a canonical identifier");
    }
  }
  validateProfileRecord(scenario.profile_record, scenario, contract, `${path}.profile_record`, errors);
  if (!requireExactKeys(scenario.expected, new Set(["occurred"]), `${path}.expected`, errors)) {
    return { id: scenario.id, errors };
  }
  if (scenario.expected.occurred !== contract.occurred) {
    issue(errors, "EXPECTED_OCCURRENCE_MISMATCH", `${path}.expected.occurred`, `expected ${contract.occurred}`);
  }
  if (scenario.profile_record?.claim?.occurred !== scenario.expected.occurred) {
    issue(errors, "RECORDED_EXPECTATION_MISMATCH", `${path}.expected.occurred`, "expected outcome conflicts with the profile claim");
  }
  return {
    id: scenario.id,
    policy_decision: scenario.policy_decision,
    expected_occurred: scenario.expected.occurred,
    observed_occurred: scenario.profile_record?.execution?.state === "EXECUTED",
    attempted_action_sha256: attemptedDigest,
    authorized_action_sha256: scenario.authorized_action,
    match: errors.length === 0,
    errors,
  };
}

function compareControlActions(scenarios, errors) {
  const byId = Object.fromEntries(
    scenarios
      .filter(isObject)
      .map((scenario) => [scenario.id, scenario]),
  );
  const allow = byId["allow-exact-action"]?.attempted_action;
  const wrongTarget = byId["deny-wrong-target"]?.attempted_action;
  const mutation = byId["deny-post-approval-mutation"]?.attempted_action;
  if (!isObject(allow) || !isObject(wrongTarget) || !isObject(mutation)) return;
  const allowWithoutTarget = { ...allow };
  const wrongWithoutTarget = { ...wrongTarget };
  delete allowWithoutTarget.target;
  delete wrongWithoutTarget.target;
  if (allow.target === wrongTarget.target || !sameJson(allowWithoutTarget, wrongWithoutTarget)) {
    issue(errors, "WRONG_TARGET_CONTROL_SHAPE_MISMATCH", "scenarios", "wrong-target control must differ from the allow control only by target");
  }
  const allowWithoutMode = { ...allow };
  const mutationWithoutMode = { ...mutation };
  delete allowWithoutMode.mode;
  delete mutationWithoutMode.mode;
  if (allow.mode === mutation.mode || !sameJson(allowWithoutMode, mutationWithoutMode)) {
    issue(errors, "MUTATION_CONTROL_SHAPE_MISMATCH", "scenarios", "post-approval control must differ from the allow control only by mode");
  }
  if (
    byId["deny-post-approval-mutation"]?.authorized_action !==
    byId["allow-exact-action"]?.attempted_action_sha256
  ) {
    issue(errors, "MUTATION_BASELINE_BINDING_MISMATCH", "scenarios", "mutation control is not bound to the allow-control baseline");
  }
}

export function verifyHandoffManifest(manifest) {
  const errors = [];
  if (!isObject(manifest)) {
    return { valid: false, errors: [{ code: "MANIFEST_OBJECT_REQUIRED", path: "manifest", detail: "expected an object" }] };
  }
  if (manifest.packet_sha256 !== AUTHORITY_REPLAY_SOURCE.packetSha256) {
    issue(errors, "MANIFEST_PACKET_DIGEST_MISMATCH", "manifest.packet_sha256", "manifest does not pin the expected packet");
  }
  const requiredControls = Object.keys(CONTROL_CONTRACTS).sort();
  if (
    !Array.isArray(manifest.required_controls) ||
    !sameJson([...manifest.required_controls].sort(), requiredControls)
  ) {
    issue(errors, "MANIFEST_CONTROLS_MISMATCH", "manifest.required_controls", "manifest controls differ from the replay contract");
  }
  for (const name of SOURCE_FILES) {
    if (manifest.files?.[name] !== EXPECTED_SOURCE_DIGESTS[name]) {
      issue(errors, "MANIFEST_SOURCE_DIGEST_MISMATCH", `manifest.files.${name}`, "manifest source digest differs from the pinned source inventory");
    }
  }
  if (
    manifest.files?.["replay-packets/authority-execution-replay-v1.json"] !==
    AUTHORITY_REPLAY_SOURCE.packetSha256
  ) {
    issue(errors, "MANIFEST_PACKET_INVENTORY_MISMATCH", "manifest.files.replay-packets/authority-execution-replay-v1.json", "manifest file inventory does not bind the packet");
  }
  if (
    typeof manifest.independence_rule !== "string" ||
    !manifest.independence_rule.includes("verify_replay_packet.py")
  ) {
    issue(errors, "MANIFEST_INDEPENDENCE_RULE_MISSING", "manifest.independence_rule", "reference-verifier separation rule is missing");
  }
  return { valid: errors.length === 0, errors };
}

export function verifyAuthorityExecutionReplayPacket(
  packet,
  { packetBytes = null, expectedPacketSha256 = null, sourceFileDigests = null } = {},
) {
  const errors = [];
  const actualPacketSha256 = packetBytes ? sha256Bytes(packetBytes) : null;
  if (expectedPacketSha256 && actualPacketSha256 !== expectedPacketSha256) {
    issue(errors, "PACKET_DIGEST_MISMATCH", "packet", `expected ${expectedPacketSha256}, got ${actualPacketSha256}`);
  }
  if (!requireExactKeys(packet, PACKET_KEYS, "packet", errors)) {
    return { result: "FAIL", packet_sha256: actualPacketSha256, errors, scenarios: [] };
  }
  if (packet.schema_version !== "0.1-internal-replay") {
    issue(errors, "PACKET_VERSION_UNSUPPORTED", "packet.schema_version", "unexpected replay schema version");
  }
  if (packet.scope !== EXPECTED_SCOPE) {
    issue(errors, "PACKET_SCOPE_WIDENED", "packet.scope", "packet is not limited to the declared synthetic networkless scope");
  }
  if (packet.claim_boundary !== EXPECTED_CLAIM_BOUNDARY) {
    issue(errors, "CLAIM_BOUNDARY_CHANGED", "packet.claim_boundary", "packet claim boundary differs from the pinned contract");
  }
  if (!requireExactKeys(packet.source, new Set(["files", "replay_command"]), "packet.source", errors)) {
    return { result: "FAIL", packet_sha256: actualPacketSha256, errors, scenarios: [] };
  }
  requireExactKeys(packet.source.files, new Set(SOURCE_FILES), "packet.source.files", errors);
  for (const name of SOURCE_FILES) {
    if (packet.source.files?.[name] !== EXPECTED_SOURCE_DIGESTS[name]) {
      issue(errors, "PACKET_SOURCE_DIGEST_MISMATCH", `packet.source.files.${name}`, "packet source digest differs from the pinned inventory");
    }
    if (!sourceFileDigests || sourceFileDigests[name] !== packet.source.files?.[name]) {
      issue(errors, "SOURCE_DIGEST_MISMATCH", `source.${name}`, "supplied source bytes do not match the packet inventory");
    }
  }
  if (!Array.isArray(packet.scenarios) || packet.scenarios.length !== 3) {
    issue(errors, "CONTROL_CARDINALITY_MISMATCH", "packet.scenarios", "expected exactly three controls");
  }
  const scenarioResults = Array.isArray(packet.scenarios)
    ? packet.scenarios.map(validateScenario)
    : [];
  for (const result of scenarioResults) errors.push(...result.errors);
  const ids = packet.scenarios?.map((scenario) => scenario?.id) ?? [];
  if (new Set(ids).size !== ids.length) {
    issue(errors, "DUPLICATE_CONTROL_ID", "packet.scenarios", "control identifiers must be unique");
  }
  if (!sameJson([...ids].sort(), Object.keys(CONTROL_CONTRACTS).sort())) {
    issue(errors, "REQUIRED_CONTROLS_MISSING", "packet.scenarios", "scenario identifiers differ from the required control set");
  }
  if (Array.isArray(packet.scenarios)) compareControlActions(packet.scenarios, errors);

  const limitations = [
    {
      code: "WRONG_TARGET_POLICY_NOT_INDEPENDENTLY_DERIVABLE",
      detail:
        "No machine-readable policy artifact defines the permitted target. In the wrong-target control, authorized_action and delegated_authority.action_digest both equal the attempted customer-002 action, so the denial is reproducible only as a declared policy label plus denial observation.",
    },
    {
      code: "SPONSORSHIP_IS_LOCAL_UNSIGNED_METADATA",
      detail:
        "The sponsorship record is schema- and scope-checked but is not cryptographically bound to the action or an external identity; the source explicitly disclaims external identity binding.",
    },
  ];
  const baseValid = errors.length === 0;
  return {
    schema: "https://vrtxomega.tech/schemas/veritas-agent-trust-lab/authority-execution-replay/v0.1",
    result: baseValid ? "PASS_WITH_LIMITS" : "FAIL",
    packet_sha256: actualPacketSha256,
    summary: {
      controls_matched: scenarioResults.filter((item) => item.match).length,
      controls_total: scenarioResults.length,
      exact_action_allow_survives:
        scenarioResults.find((item) => item.id === "allow-exact-action")?.match === true,
      deny_controls_survive: scenarioResults
        .filter((item) => item.id?.startsWith("deny-"))
        .every((item) => item.match),
      reject_everything_protected:
        scenarioResults.find((item) => item.id === "allow-exact-action")?.observed_occurred === true,
      source_files_verified: SOURCE_FILES.every(
        (name) => sourceFileDigests?.[name] === packet.source.files?.[name],
      ),
    },
    scenarios: scenarioResults.map(({ errors: scenarioErrors, ...item }) => ({
      ...item,
      errors: scenarioErrors,
    })),
    limitations,
    errors,
    execution_authorized: false,
  };
}

function clone(value) {
  return structuredClone(value);
}

export function runPublishedTamperRegressions(packet, options) {
  const requiredIds = Object.keys(CONTROL_CONTRACTS);
  if (
    !isObject(packet) ||
    !Array.isArray(packet.scenarios) ||
    !requiredIds.every((id) =>
      packet.scenarios.some((item) => isObject(item) && item.id === id),
    )
  ) {
    return [
      "action-retargeting",
      "source-digest-corruption",
      "policy-decision-flip",
      "occurrence-claim-flip",
      "mutation-erasure",
      "production-scope-widening",
    ].map((id) => ({
      id,
      detected: false,
      expected_code: "BASE_PACKET_VALID",
      observed_codes: ["BASE_PACKET_INVALID"],
    }));
  }
  const allowIndex = packet.scenarios.findIndex((item) => item.id === "allow-exact-action");
  const mutationIndex = packet.scenarios.findIndex(
    (item) => item.id === "deny-post-approval-mutation",
  );
  const cases = [
    {
      id: "action-retargeting",
      expectedCode: "EXACT_ACTION_BINDING_MISMATCH",
      mutate(value) {
        const scenario = value.scenarios[allowIndex];
        scenario.attempted_action.target = "fixture://sensitive/customer-999";
        scenario.attempted_action_sha256 = sha256Canonical(scenario.attempted_action);
      },
    },
    {
      id: "source-digest-corruption",
      expectedCode: "PACKET_SOURCE_DIGEST_MISMATCH",
      mutate(value) {
        value.source.files["profile.py"] = "0".repeat(64);
      },
    },
    {
      id: "policy-decision-flip",
      expectedCode: "POLICY_DECISION_MISMATCH",
      mutate(value) {
        value.scenarios[allowIndex].policy_decision = "DENY_WRONG_TARGET";
      },
    },
    {
      id: "occurrence-claim-flip",
      expectedCode: "OCCURRENCE_CLAIM_MISMATCH",
      mutate(value) {
        value.scenarios[allowIndex].profile_record.claim.occurred = false;
      },
    },
    {
      id: "mutation-erasure",
      expectedCode: "EXPECTED_MUTATION_MISSING",
      mutate(value) {
        const scenario = value.scenarios[mutationIndex];
        scenario.attempted_action = clone(value.scenarios[allowIndex].attempted_action);
        scenario.attempted_action_sha256 = sha256Canonical(scenario.attempted_action);
      },
    },
    {
      id: "production-scope-widening",
      expectedCode: "PACKET_SCOPE_WIDENED",
      mutate(value) {
        value.scope = "synthetic fixtures plus production replay";
      },
    },
  ];
  return cases.map((testCase) => {
    const value = clone(packet);
    testCase.mutate(value);
    const result = verifyAuthorityExecutionReplayPacket(value, {
      ...options,
      packetBytes: null,
      expectedPacketSha256: null,
    });
    const codes = [...new Set(result.errors.map((error) => error.code))].sort();
    return {
      id: testCase.id,
      detected: result.result === "FAIL" && codes.includes(testCase.expectedCode),
      expected_code: testCase.expectedCode,
      observed_codes: codes,
    };
  });
}
