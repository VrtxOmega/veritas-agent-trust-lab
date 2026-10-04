import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";
import test from "node:test";

import { canonicalize } from "../lib/trust-engine.js";

const run = promisify(execFile);
const runner = fileURLToPath(new URL("../scripts/verify-external-rcl.mjs", import.meta.url));
const limit = 2 * 1024 * 1024;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Local signed controls keep these CLI tests independent of network availability.
function corpus() {
  const keys = Object.fromEntries(
    ["emitter", "checker", "authz", "exec"].map((role) => [role, generateKeyPairSync("ed25519")]),
  );
  const attest = (role, value) => ({
    ...value,
    sig: sign(null, Buffer.from(canonicalize(value)), keys[role].privateKey).toString("hex"),
  });
  const seal = (value) => {
    const { sig, ...body } = attest("emitter", value);
    return { ...body, envelope_sig: sig };
  };
  const action = { tool: "test", params: {} };
  const actionDigest = hash(canonicalize(action));
  const toolSetDigest = hash(canonicalize(["test"]));
  const receipt = {
    action,
    action_digest: actionDigest,
    tool_set_digest: toolSetDigest,
    claims: {
      authorization: attest("authz", { action_digest: actionDigest, params_digest: hash("{}") }),
      occurrence: attest("exec", { action_digest: actionDigest }),
      check: attest("checker", { input_digest: toolSetDigest, output: "pass", issued_at: 1000 }),
    },
  };
  const missingOccurrence = structuredClone(receipt);
  delete missingOccurrence.claims.occurrence;
  return Buffer.from(JSON.stringify({
    schema_version: "test",
    evaluation_time: 1000,
    freshness_window_seconds: 300,
    public_keys: Object.fromEntries(Object.entries(keys).map(([role, pair]) => [
      role, pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex"),
    ])),
    counts: { total: 2, accept: 1, reject: 1 },
    fixtures: [
      { id: "accept", envelope_valid: true, receipt: seal(receipt), expected: {
        verdict: "accept", claim_family: null, reason: "all four properties independently supported",
      } },
      { id: "reject", envelope_valid: true, receipt: seal(missingOccurrence), expected: {
        verdict: "reject", claim_family: "occurrence", reason: "occurrence: missing evidence",
      } },
    ],
  }));
}

async function serve(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  return `http://127.0.0.1:${server.address().port}/fixture.json`;
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), "veritas-rcl-runner-"));
  t.after(() => {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    return rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test("RCL runner accepts exact-limit local and chunked fixtures with unchanged hashes", async (t) => {
  const fixture = corpus();
  const bytes = Buffer.concat([fixture, Buffer.alloc(limit - fixture.length, " ")]);
  const directory = await temporaryDirectory(t);
  const input = join(directory, "fixture.json");
  await writeFile(input, bytes);
  const url = await serve(t, (_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.write(bytes.subarray(0, 100));
    response.end(bytes.subarray(100));
  });
  for (const source of [["--input", input], ["--url", url]]) {
    const { stdout } = await run(process.execPath, [runner, ...source, "--expected-sha256", hash(bytes)]);
    const report = JSON.parse(stdout);
    assert.equal(report.result, "PASS");
    assert.equal(report.summary.matches, 2);
    assert.equal(report.source.fixture_sha256, hash(bytes));
    assert.equal(report.execution_authorized, false);
  }
});

test("RCL runner rejects an oversized chunked stream before the server ends it", async (t) => {
  const directory = await temporaryDirectory(t);
  const output = join(directory, "report.json");
  await writeFile(output, "existing report\n");
  const url = await serve(t, (_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.write(Buffer.alloc(limit + 1, " "));
    // Deliberately leave the body open: the client must cancel at its byte limit.
  });
  await assert.rejects(
    run(process.execPath, [runner, "--url", url, "--expected-sha256", "0".repeat(64), "--json-out", output], { timeout: 5000 }),
    (error) => {
      assert.equal(error.killed, false, "runner waited for the oversized body to end");
      assert.match(error.stderr, /Fixture exceeds 2097152 bytes/);
      return true;
    },
  );
  assert.equal(await readFile(output, "utf8"), "existing report\n");
});

test("RCL runner enforces the decoded limit for compressed HTTP responses", async (t) => {
  const compressed = gzipSync(Buffer.alloc(limit + 1, " "));
  assert.ok(compressed.length < limit);
  const url = await serve(t, (_request, response) => {
    response.writeHead(200, { "content-encoding": "gzip", "content-length": compressed.length });
    response.end(compressed);
  });
  await assert.rejects(
    run(process.execPath, [runner, "--url", url, "--expected-sha256", "0".repeat(64)]),
    (error) => /Fixture exceeds 2097152 bytes/.test(error.stderr),
  );
});

for (const [name, status, headers, expectedError] of [
  ["unsuccessful status", 503, {}, /Fixture fetch failed: HTTP 503/],
  ["oversized declared length", 200, { "content-length": limit + 1 }, /Fixture exceeds 2097152 bytes/],
]) {
  test(`RCL runner promptly rejects ${name} without waiting for a response body`, async (t) => {
    const url = await serve(t, (_request, response) => {
      response.writeHead(status, headers);
      response.flushHeaders();
      // Headers alone establish rejection; the body deliberately never finishes.
    });
    await assert.rejects(
      run(process.execPath, [runner, "--url", url, "--expected-sha256", "0".repeat(64)], { timeout: 5000 }),
      (error) => {
        assert.equal(error.killed, false, "runner waited for the rejected response body");
        assert.match(error.stderr, expectedError);
        return true;
      },
    );
  });
}

test("RCL runner rejects oversized local input and still rejects a wrong digest", async (t) => {
  const input = join(await temporaryDirectory(t), "fixture.json");
  for (const [bytes, expectedError] of [
    [Buffer.alloc(limit + 1, " "), /Fixture exceeds 2097152 bytes/],
    [corpus(), /Fixture digest mismatch/],
  ]) {
    await writeFile(input, bytes);
    await assert.rejects(
      run(process.execPath, [runner, "--input", input, "--expected-sha256", "0".repeat(64)]),
      (error) => expectedError.test(error.stderr),
    );
  }
});
