import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import test from "node:test";
import { assessHeartbeat } from "../lib/monitor-freshness.js";
import { countDeclaredEvaluatorGroups, declaredEvaluatorKey } from "../lib/evaluator-dependence.js";
import { CASES, evaluateCase } from "../lib/trust-engine.js";

const at = "2030-01-01T00:00:30Z";
const input = (lastHeartbeat, extra = {}) => ({ evaluatedAt: at, lastHeartbeat, ...extra });
const evaluator = (model_family, prompt_ancestry = "redteam-v4", retrieval_set = "corpus-alpha") => ({
  model_family, prompt_ancestry, retrieval_set,
});

for (const [name, value, reason] of [
  ["missing", undefined, "HEARTBEAT_MISSING"],
  ["null", null, "HEARTBEAT_MISSING"],
  ["empty", "", "HEARTBEAT_MISSING"],
  ["unparseable", "not-a-timestamp", "HEARTBEAT_INVALID"],
  ["whitespace", " ", "HEARTBEAT_INVALID"],
  ["numeric", 0, "HEARTBEAT_INVALID"],
  ["boolean", true, "HEARTBEAT_INVALID"],
  ["array", [], "HEARTBEAT_INVALID"],
  ["object", {}, "HEARTBEAT_INVALID"],
  ["calendar overflow", "2030-02-30T00:00:25Z", "HEARTBEAT_INVALID"],
  ["timezone absent", "2030-01-01T00:00:25", "HEARTBEAT_INVALID"],
  ["future by 1ms", "2030-01-01T00:00:30.001Z", "HEARTBEAT_FUTURE"],
  ["future by 270s", "2030-01-01T00:05:00Z", "HEARTBEAT_FUTURE"],
  ["future by one day", "2030-01-02T00:00:30Z", "HEARTBEAT_FUTURE"],
]) {
  test(`heartbeat fails closed: ${name}`, () => {
    const result = assessHeartbeat(input(value));
    assert.equal(result.fresh, false);
    assert.deepEqual(result.reasonCodes, [reason, "AUTHORIZATION_REVOKED"]);
    assert.notEqual(JSON.stringify(result).includes("NaN"), true);
    assert.ok(result.ageSeconds === null || Number.isFinite(result.ageSeconds));
  });
}

test("fresh, exactly-at-TTL and zero-TTL controls remain reachable", () => {
  for (const [heartbeat, ttl, age] of [
    ["2030-01-01T00:00:25Z", 10, 5],
    ["2030-01-01T00:00:20Z", 10, 10],
    ["2030-01-01T00:00:30Z", 0, 0],
  ]) {
    assert.deepEqual(assessHeartbeat(input(heartbeat, { ttlSeconds: ttl })), {
      fresh: true, ageSeconds: age, reasonCodes: ["HEARTBEAT_FRESH"],
    });
  }
});

test("equivalent UTC timestamp spellings and sub-millisecond precision remain judgeable", () => {
  const cases = [
    ["2030-01-01T00:00:25.1Z", 4.9],
    ["2030-01-01T00:00:25.123456Z", 4.876544],
    ["2030-01-01T00:00:25+00:00", 5],
    ["2030-01-01T00:00:25.123456+00:00", 4.876544],
  ];
  for (const [heartbeat, expectedAge] of cases) {
    const result = assessHeartbeat(input(heartbeat));
    assert.equal(result.fresh, true, heartbeat);
    assert.ok(Math.abs(result.ageSeconds - expectedAge) < 1e-12, heartbeat);
  }

  for (const heartbeat of [
    "2030-01-01T00:00:30.000001+00:00",
    "2030-01-01T00:00:30.000000001Z",
  ]) {
    const future = assessHeartbeat({
      evaluatedAt: "2030-01-01T00:00:30.000000000Z",
      lastHeartbeat: heartbeat,
    });
    assert.equal(future.fresh, false, heartbeat);
    assert.equal(future.reasonCodes[0], "HEARTBEAT_FUTURE", heartbeat);
  }

  for (const invalid of [
    "2030-01-01T00:00:60Z",
    "2030-02-30T00:00:25.123456Z",
    "2030-01-01T00:00:25-00:00",
    "2030-01-01T00:00:25+01:00",
    "2030-01-01T00:00:25.1234567890Z",
  ]) {
    assert.equal(assessHeartbeat(input(invalid)).reasonCodes[0], "HEARTBEAT_INVALID", invalid);
  }
});

test("TTL+1ms and historical stale cases revoke with the original reason codes", () => {
  for (const heartbeat of ["2030-01-01T00:00:19.999Z", "2030-01-01T00:00:00Z"]) {
    const r = assessHeartbeat(input(heartbeat));
    assert.equal(r.fresh, false);
    assert.deepEqual(r.reasonCodes, ["TELEMETRY_MISSING_FAIL_CLOSED", "AUTHORIZATION_REVOKED"]);
  }
});

test("invalid input, clock and TTL cannot establish freshness", () => {
  for (const value of [null, undefined, [], false, "timestamp"]) {
    assert.equal(assessHeartbeat(value).fresh, false);
  }
  for (const value of [null, "", "not-a-time", NaN, {}, "2030-02-30T00:00:00Z"]) {
    assert.equal(assessHeartbeat(input(at, { evaluatedAt: value })).reasonCodes[0], "EVALUATION_TIME_INVALID");
  }
  for (const ttlSeconds of [-1, Infinity, NaN, "10", null]) {
    assert.equal(assessHeartbeat(input(at, { ttlSeconds })).reasonCodes[0], "HEARTBEAT_TTL_INVALID");
  }
});

test("delimiter-bearing distinct tuples do not collide", () => {
  const a = evaluator("x|y", "z", "r");
  const b = evaluator("x", "y|z", "r");
  assert.notEqual(declaredEvaluatorKey(a), declaredEvaluatorKey(b));
  assert.equal(countDeclaredEvaluatorGroups([a, b]), 2);
});

test("case, edge whitespace and compatibility variants do not inflate groups", () => {
  assert.equal(countDeclaredEvaluatorGroups([
    evaluator("frontier-family-a"),
    evaluator("Frontier-Family-A", "REDTEAM-V4", "CORPUS-ALPHA"),
    evaluator(" frontier-family-a ", " redteam-v4 ", " corpus-alpha "),
    evaluator("ｆｒｏｎｔｉｅｒ-family-a"),
  ]), 1);
});

test("runs of interior spaces collapse without erasing meaningful word boundaries", () => {
  assert.equal(countDeclaredEvaluatorGroups([
    evaluator("clau de"),
    evaluator("clau  de"),
    evaluator("clau\u00a0\u00a0de"),
  ]), 1);
  assert.equal(countDeclaredEvaluatorGroups([
    evaluator("clau de"),
    evaluator("claude"),
  ]), 2);
});

test("non-ASCII case variants cannot inflate declared groups", () => {
  // JS lowercasing is not full Unicode case folding. Unsupported label
  // alphabets fail closed instead of minting extra claimed evaluators.
  for (const [a, b] of [["Σ", "ς"], ["Straße", "STRASSE"], ["İ", "i"], ["модель", "МОДЕЛЬ"]]) {
    assert.throws(() => countDeclaredEvaluatorGroups([evaluator(a), evaluator(b)]), TypeError);
  }
  assert.equal(countDeclaredEvaluatorGroups([evaluator("ALPHA"), evaluator("alpha")]), 1);
});

test("distinct declared triples and duplicate declarations remain distinguishable", () => {
  assert.equal(countDeclaredEvaluatorGroups([
    evaluator("frontier-family-a"), evaluator("deterministic-checker", "none", "fixture-source"),
  ]), 2);
  assert.equal(countDeclaredEvaluatorGroups([evaluator("x"), evaluator("x")]), 1);
  assert.equal(countDeclaredEvaluatorGroups([]), 0);
});

test("missing or invalid dependence declarations cannot mint groups", () => {
  for (const bad of [null, undefined, [], {}, "x", evaluator(""), evaluator("\u200bx"), evaluator(1)]) {
    assert.throws(() => countDeclaredEvaluatorGroups([bad]), TypeError);
  }
  assert.throws(() => countDeclaredEvaluatorGroups(new Array(2)), TypeError);
  assert.throws(() => countDeclaredEvaluatorGroups({}), TypeError);
  assert.throws(() => countDeclaredEvaluatorGroups([Object.create(evaluator("x"))]), TypeError);
});

test("declared metadata grouping explicitly does not authenticate identities", () => {
  // A meaningful relabel still changes the declaration. This is a documented
  // limitation, NOT proof that different real evaluators produced the labels.
  assert.equal(countDeclaredEvaluatorGroups([evaluator("x"), evaluator("different-label")]), 2);
  assert.equal(countDeclaredEvaluatorGroups([
    { ...evaluator("x"), code_path: "a" }, { ...evaluator("x"), code_path: "b" },
  ]), 1);
});

test("all twelve full results remain equal to the immutable v1 specimen", async () => {
  const source = execFileSync("git", ["show", "0f3c71fdb0e9078d8a5d8684411d0318fe600bb1:lib/trust-engine.js"], {
    cwd: new URL("..", import.meta.url), stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(createHash("sha256").update(source).digest("hex"), "60c8d7e26fa0a352401b391015618c56b9be39d59c4b7cc4d5b24ec3f8d726c2");
  const frozen = await import(`data:text/javascript;base64,${source.toString("base64")}`);
  for (const c of CASES) for (const tampered of [false, true]) {
    const actual = await evaluateCase(c.id, tampered);
    assert.deepEqual(actual, await frozen.evaluateCase(c.id, tampered), `${c.id}/${tampered}`);
    assert.equal(actual.execution_authorized, false);
  }
});
