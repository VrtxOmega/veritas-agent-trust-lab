#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  AUTHORITY_REPLAY_SOURCE,
  SOURCE_FILES,
  runPublishedTamperRegressions,
  sha256Bytes,
  verifyAuthorityExecutionReplayPacket,
  verifyHandoffManifest,
} from "../lib/authority-execution-replay-verifier.js";

function parseArgs(argv) {
  const args = {
    expectedSha256: AUTHORITY_REPLAY_SOURCE.packetSha256,
    input: null,
    jsonOut: null,
    manifest: null,
    markdownOut: null,
    sourceDir: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    const value = argv[index + 1];
    if (!value) throw new Error(`Missing value for ${option}`);
    if (option === "--input") args.input = value;
    else if (option === "--manifest") args.manifest = value;
    else if (option === "--source-dir") args.sourceDir = value;
    else if (option === "--expected-sha256") args.expectedSha256 = value;
    else if (option === "--json-out") args.jsonOut = value;
    else if (option === "--markdown-out") args.markdownOut = value;
    else throw new Error(`Unknown option: ${option}`);
    index += 1;
  }
  for (const required of ["input", "manifest", "sourceDir"]) {
    if (!args[required]) throw new Error(`--${required.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)} is required`);
  }
  return args;
}

async function sourceDigests(sourceDir) {
  return Object.fromEntries(
    await Promise.all(
      SOURCE_FILES.map(async (name) => [
        name,
        sha256Bytes(await readFile(resolve(sourceDir, name))),
      ]),
    ),
  );
}

function markdown(report) {
  return `${[
    "# Authority-to-Execution Replay Cross-Evaluation",
    "",
    `**Result:** ${report.result}`,
    "",
    "## Source identity",
    "",
    `- Repository: \`${report.source.repository}\``,
    `- Commit: \`${report.source.commit}\``,
    `- Packet: \`${report.source.packet_path}\``,
    `- Packet SHA-256: \`${report.source.packet_sha256}\``,
    `- Manifest SHA-256: \`${report.source.manifest_sha256}\``,
    "- Reference verifier inspected before implementation freeze: `false`",
    "",
    "## Reproduction result",
    "",
    `The separately authored Node verifier reproduced **${report.summary.controls_matched}/${report.summary.controls_total}** declared scenario outcomes and detected **${report.summary.tamper_regressions_detected}/${report.summary.tamper_regressions_total}** published tamper classes.`,
    "",
    `- Exact-action allow preserved: ${report.summary.exact_action_allow_survives ? "PASS" : "FAIL"}`,
    `- Deny controls preserved: ${report.summary.deny_controls_survive ? "PASS" : "FAIL"}`,
    `- Reject-everything protected: ${report.summary.reject_everything_protected ? "PASS" : "FAIL"}`,
    `- Source files verified: ${report.summary.source_files_verified ? "PASS" : "FAIL"}`,
    `- Manifest verified: ${report.summary.manifest_verified ? "PASS" : "FAIL"}`,
    `- Execution authorized: \`${report.execution_authorized}\``,
    "",
    "| Scenario | Policy decision | Expected occurrence | Observed occurrence | Match |",
    "|---|---|---:|---:|---|",
    ...report.scenarios.map(
      (item) =>
        `| ${item.id} | ${item.policy_decision} | ${item.expected_occurred} | ${item.observed_occurred} | ${item.match ? "PASS" : "FAIL"} |`,
    ),
    "",
    "## Published tamper regressions",
    "",
    "| Tamper class | Required detection | Detected |",
    "|---|---|---|",
    ...report.tamper_regressions.map(
      (item) =>
        `| ${item.id} | \`${item.expected_code}\` | ${item.detected ? "PASS" : "FAIL"} |`,
    ),
    "",
    "## Material limitation",
    "",
    ...report.limitations.map((item) => `- **${item.code}:** ${item.detail}`),
    "",
    "The three fixture records are internally reproducible, but the wrong-target denial is not independently derivable from a supplied policy artifact. In that control, both `authorized_action` and `delegated_authority.action_digest` equal the attempted customer-002 action. The verifier can reproduce the declared policy label, denial observation, and non-occurrence binding; it cannot independently prove why customer-002 is unauthorized.",
    "",
    "## Assurance boundary",
    "",
    "- This is a cross-implementation replay of one pinned synthetic, owned-fixture packet.",
    "- It is not a live MCP/API test, production enforcement evidence, external identity binding, security audit, certification, endorsement, adoption signal, or validation of either project.",
    "- Human sponsorship is unsigned local metadata and is checked only for schema and owned-fixture scope.",
    "- The current wall clock is not used to invalidate a historical replay; occurrence is checked against the recorded authorization window.",
    "- The upstream packet is not vendored because the handoff repository publishes no license file; reproduction uses a separately cloned pinned source tree.",
    "- Every result fixes `execution_authorized` to `false`.",
    "",
    "## Reproduce without network execution",
    "",
    "After cloning both repositories and checking out the source commit above:",
    "",
    "```bash",
    "npm ci",
    "npm run verify:authority-replay -- \\",
    "  --input ../authority-execution-replay/source/replay-packets/authority-execution-replay-v1.json \\",
    "  --manifest ../authority-execution-replay/manifest.json \\",
    "  --source-dir ../authority-execution-replay/source",
    "```",
  ].join("\n")}\n`;
}

const args = parseArgs(process.argv.slice(2));
const packetBytes = await readFile(resolve(args.input));
const manifestBytes = await readFile(resolve(args.manifest));
const manifestSha256 = sha256Bytes(manifestBytes);
if (manifestSha256 !== AUTHORITY_REPLAY_SOURCE.manifestSha256) {
  throw new Error(
    `Manifest digest mismatch: expected ${AUTHORITY_REPLAY_SOURCE.manifestSha256}, got ${manifestSha256}`,
  );
}
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const manifestResult = verifyHandoffManifest(manifest);
if (args.expectedSha256 !== manifest.packet_sha256) {
  throw new Error(
    `Expected packet digest must match the pinned manifest: ${manifest.packet_sha256}`,
  );
}
const digests = await sourceDigests(args.sourceDir);
const packet = JSON.parse(packetBytes.toString("utf8"));
const base = verifyAuthorityExecutionReplayPacket(packet, {
  packetBytes,
  expectedPacketSha256: args.expectedSha256,
  sourceFileDigests: digests,
});
const tamperRegressions = runPublishedTamperRegressions(packet, {
  sourceFileDigests: digests,
});
const allTamperRegressionsDetected = tamperRegressions.every(
  (item) => item.detected,
);
const result =
  base.result === "FAIL" || !manifestResult.valid || !allTamperRegressionsDetected
    ? "FAIL"
    : base.result;
const report = {
  ...base,
  result,
  source: {
    repository: AUTHORITY_REPLAY_SOURCE.repository,
    commit: AUTHORITY_REPLAY_SOURCE.commit,
    packet_path: AUTHORITY_REPLAY_SOURCE.packetPath,
    packet_sha256: base.packet_sha256,
    manifest_sha256: manifestSha256,
  },
  summary: {
    ...base.summary,
    manifest_verified: manifestResult.valid,
    tamper_regressions_detected: tamperRegressions.filter(
      (item) => item.detected,
    ).length,
    tamper_regressions_total: tamperRegressions.length,
  },
  tamper_regressions: tamperRegressions,
  manifest_errors: manifestResult.errors,
};
const jsonText = `${JSON.stringify(report, null, 2)}\n`;
const markdownText = markdown(report);
if (args.jsonOut) await writeFile(resolve(args.jsonOut), jsonText, "utf8");
if (args.markdownOut) await writeFile(resolve(args.markdownOut), markdownText, "utf8");
if (!args.jsonOut && !args.markdownOut) process.stdout.write(jsonText);
else {
  process.stdout.write(
    `Authority replay ${report.result}: ${report.summary.controls_matched}/${report.summary.controls_total} controls, ${report.summary.tamper_regressions_detected}/${report.summary.tamper_regressions_total} tamper classes\n`,
  );
}
if (report.result === "FAIL") process.exitCode = 1;
