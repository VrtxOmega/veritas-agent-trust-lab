#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  sha256Bytes,
  verifyRclFixtureSet,
} from "../lib/rcl-verifier.js";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_FIXTURE_BYTES = 2 * 1024 * 1024;

const DEFAULT_SOURCE = {
  repository: "msaleme/red-team-blue-team-agent-fabric",
  commit: "5e25bc6465ccced079ca6a6b8f54e065a1677a69",
  path: "fixtures/rcl/rcl-oracle-fixtures.v1.json",
  expected_sha256:
    "0bc47dab20d1c45100f5525a1798fd84df3fd979d1febb2b5fc1c5a69846befb",
  license:
    "https://github.com/msaleme/red-team-blue-team-agent-fabric/blob/5e25bc6465ccced079ca6a6b8f54e065a1677a69/LICENSE",
};

DEFAULT_SOURCE.url =
  `https://raw.githubusercontent.com/${DEFAULT_SOURCE.repository}/` +
  `${DEFAULT_SOURCE.commit}/${DEFAULT_SOURCE.path}`;

function parseArgs(argv) {
  const args = {
    input: null,
    url: DEFAULT_SOURCE.url,
    jsonOut: null,
    markdownOut: null,
    expectedSha256: DEFAULT_SOURCE.expected_sha256,
  };
  let customUrl = false;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    const value = argv[index + 1];
    if (option === "--input" && value) {
      args.input = value;
      index += 1;
    } else if (option === "--url" && value) {
      args.url = value;
      customUrl = value !== DEFAULT_SOURCE.url;
      index += 1;
    } else if (option === "--json-out" && value) {
      args.jsonOut = value;
      index += 1;
    } else if (option === "--markdown-out" && value) {
      args.markdownOut = value;
      index += 1;
    } else if (option === "--expected-sha256" && value) {
      args.expectedSha256 = value;
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete option: ${option}`);
    }
  }
  if (args.input && argv.includes("--url")) {
    throw new Error("Use either --input or --url, not both");
  }
  if ((args.input || customUrl) && !argv.includes("--expected-sha256")) {
    throw new Error(
      "Custom fixture sources require an explicit --expected-sha256 pin",
    );
  }
  return args;
}

async function loadFixtureBytes(args) {
  let bytes;
  if (args.input) {
    bytes = await readFile(resolve(args.input));
  } else {
    const response = await fetch(args.url, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Fixture fetch failed: HTTP ${response.status}`);
    }
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_FIXTURE_BYTES) {
      throw new Error(`Fixture exceeds ${MAX_FIXTURE_BYTES} bytes`);
    }
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (bytes.length > MAX_FIXTURE_BYTES) {
    throw new Error(`Fixture exceeds ${MAX_FIXTURE_BYTES} bytes`);
  }
  return bytes;
}

function markdown(report) {
  const lines = [
    "# External RCL Corpus Cross-Evaluation",
    "",
    `**Result:** ${report.result}`,
    "",
    "## Source identity",
    "",
    `- Repository: \`${report.source.repository}\``,
    `- Commit: \`${report.source.commit}\``,
    `- Fixture: \`${report.source.path}\``,
    `- Fixture SHA-256: \`${report.source.fixture_sha256}\``,
    `- Source URL: ${report.source.url}`,
    `- License: ${report.source.license}`,
    "",
    "## Result",
    "",
    `The separate Node implementation matched **${report.summary.matches}/${report.summary.total}** recorded verdicts, claim families, reasons, and envelope-validity expectations.`,
    "",
    `- Rejection vectors detected: ${report.summary.all_reject_vectors_detected ? "PASS" : "FAIL"}`,
    `- Acceptance controls preserved: ${report.summary.all_accept_controls_survive ? "PASS" : "FAIL"}`,
    `- Declared corpus counts reproduced: ${report.summary.declared_counts_match ? "PASS" : "FAIL"}`,
    `- Execution authorized: \`${report.execution_authorized}\``,
    "",
    "| Case | Expected | Actual | Family | Match |",
    "|---|---|---|---|---|",
    ...report.cases.map(
      (item) =>
        `| ${item.id} — ${item.name} | ${item.expected_verdict} | ${item.actual_verdict} | ${item.actual_claim_family ?? "—"} | ${item.match ? "PASS" : "FAIL"} |`,
    ),
    "",
    "## What the separate implementation recomputed",
    "",
    "- Ed25519 envelope and authority signatures using only the exported public keys.",
    "- SHA-256 action and parameter digests, plus the signed check-to-declared-tool-set binding.",
    "- Authorization and occurrence linkage to the exact action.",
    "- Checker authority, freshness window, tool-set binding, and recorded output.",
    "- Both positive controls, preventing a reject-everything verifier from passing.",
    "",
    "## Assurance boundary",
    "",
    ...report.assurance_boundary.map((item) => `- ${item}`),
    "",
    "## Reproduce",
    "",
    "```bash",
    "npm run verify:rcl",
    "```",
  ];
  return `${lines.join("\n")}\n`;
}

const args = parseArgs(process.argv.slice(2));
const fixtureBytes = await loadFixtureBytes(args);
const fixtureSha256 = sha256Bytes(fixtureBytes);

if (
  args.expectedSha256 &&
  fixtureSha256.toLowerCase() !== args.expectedSha256.toLowerCase()
) {
  throw new Error(
    `Fixture digest mismatch: expected ${args.expectedSha256}, got ${fixtureSha256}`,
  );
}

const fixtureSet = JSON.parse(fixtureBytes.toString("utf8"));
const isDefaultSource = !args.input && args.url === DEFAULT_SOURCE.url;
const source = isDefaultSource
  ? {
      ...DEFAULT_SOURCE,
      fixture_sha256: fixtureSha256,
    }
  : {
      repository: null,
      commit: null,
      path: args.input ? resolve(args.input) : null,
      license: null,
      url: args.input ? `file://${resolve(args.input)}` : args.url,
      fixture_sha256: fixtureSha256,
    };
delete source.expected_sha256;

const report = verifyRclFixtureSet(fixtureSet, source);
const jsonText = `${JSON.stringify(report, null, 2)}\n`;
const markdownText = markdown(report);

if (args.jsonOut) {
  await writeFile(resolve(args.jsonOut), jsonText, "utf8");
}
if (args.markdownOut) {
  await writeFile(resolve(args.markdownOut), markdownText, "utf8");
}
if (!args.jsonOut && !args.markdownOut) {
  process.stdout.write(jsonText);
} else {
  process.stdout.write(
    `RCL cross-evaluation ${report.result}: ` +
      `${report.summary.matches}/${report.summary.total} cases match\n`,
  );
}

if (report.result !== "PASS") process.exitCode = 1;
