# External RCL Corpus Cross-Evaluation

**Result:** PASS

## Source identity

- Repository: `msaleme/red-team-blue-team-agent-fabric`
- Commit: `5e25bc6465ccced079ca6a6b8f54e065a1677a69`
- Fixture: `fixtures/rcl/rcl-oracle-fixtures.v1.json`
- Fixture SHA-256: `0bc47dab20d1c45100f5525a1798fd84df3fd979d1febb2b5fc1c5a69846befb`
- Source URL: https://raw.githubusercontent.com/msaleme/red-team-blue-team-agent-fabric/5e25bc6465ccced079ca6a6b8f54e065a1677a69/fixtures/rcl/rcl-oracle-fixtures.v1.json
- License: https://github.com/msaleme/red-team-blue-team-agent-fabric/blob/5e25bc6465ccced079ca6a6b8f54e065a1677a69/LICENSE

## Result

The separate Node implementation matched **11/11** recorded verdicts, claim families, reasons, and envelope-validity expectations.

- Rejection vectors detected: PASS
- Acceptance controls preserved: PASS
- Declared corpus counts reproduced: PASS
- Execution authorized: `false`

| Case | Expected | Actual | Family | Match |
|---|---|---|---|---|
| RCL-001 — Omitted mandatory evidence | reject | reject | occurrence | PASS |
| RCL-002 — Substituted evidence, re-signed envelope | reject | reject | check_execution | PASS |
| RCL-003 — Stale checker transcript | reject | reject | check_execution | PASS |
| RCL-004 — Check bound to the wrong tool-set digest | reject | reject | check_execution | PASS |
| RCL-005 — Authorization bound to different parameters | reject | reject | authorization | PASS |
| RCL-006 — Execution ack bound to another action | reject | reject | occurrence | PASS |
| RCL-007 — Emitter self-assertion, no independent attestation | reject | reject | check_execution | PASS |
| RCL-008 — Fully-supported receipt accepted (control) | accept | accept | — | PASS |
| RCL-009 — Wired MCP-019 check (clean) accepted | accept | accept | — | PASS |
| RCL-010 — Wired MCP-019 check (composite found) rejected | reject | reject | check_execution | PASS |
| RCL-011 — Wired MCP-019 check bound to wrong tool set rejected | reject | reject | check_execution | PASS |

## What the separate implementation recomputed

- Ed25519 envelope and authority signatures using only the exported public keys.
- SHA-256 action and parameter digests, plus the signed check-to-declared-tool-set binding.
- Authorization and occurrence linkage to the exact action.
- Checker authority, freshness window, tool-set binding, and recorded output.
- Both positive controls, preventing a reject-everything verifier from passing.

## Assurance boundary

- This is an author-run compatibility result over a third-party corpus, not independent validation of VERITAS.
- The result establishes agreement with the pinned corpus for the exercised vectors only.
- It does not establish factual truth, operational key custody, production security, certification, endorsement, or execution authority.
- The source fixture calls its encoding JCS; this verifier reproduces the source's sorted compact JSON encoding for its ASCII-only fixture values and does not claim full RFC 8785 conformance.
- The corpus exposes a declared tool-set digest but not every underlying tool set; the verifier checks the signed check-to-digest binding and does not claim to reconstruct unavailable tool-set evidence.
- The source verifier and corpus do not exercise future-dated checker timestamps or a negative integrity_provenance vector; this cross-evaluation preserves those declared coverage limits.

## Reproduce

```bash
npm run verify:rcl
```
