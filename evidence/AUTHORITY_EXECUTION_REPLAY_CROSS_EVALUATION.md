# Authority-to-Execution Replay Cross-Evaluation

**Result:** PASS_WITH_LIMITS

## Source identity

- Repository: `msaleme/authority-execution-replay`
- Commit: `ad0b7d66878111fa272a2c3fb6a26538e144b904`
- Packet: `source/replay-packets/authority-execution-replay-v1.json`
- Packet SHA-256: `afaf6090332d636e3c36a6110073e601c2348a38222520d29184cc602ea83a08`
- Manifest SHA-256: `9a3e2e44a7602cf35710fd6d82ccee22022ee1044700064ec551ed444ea4bb94`
- Reference verifier inspected before implementation freeze: `false`

## Reproduction result

The separately authored Node verifier reproduced **3/3** declared scenario outcomes and detected **6/6** published tamper classes.

- Exact-action allow preserved: PASS
- Deny controls preserved: PASS
- Reject-everything protected: PASS
- Source files verified: PASS
- Manifest verified: PASS
- Execution authorized: `false`

| Scenario | Policy decision | Expected occurrence | Observed occurrence | Match |
|---|---|---:|---:|---|
| allow-exact-action | ALLOW_EXACT_ACTION | true | true | PASS |
| deny-wrong-target | DENY_WRONG_TARGET | false | false | PASS |
| deny-post-approval-mutation | DENY_POST_APPROVAL_MUTATION | false | false | PASS |

## Published tamper regressions

| Tamper class | Required detection | Detected |
|---|---|---|
| action-retargeting | `EXACT_ACTION_BINDING_MISMATCH` | PASS |
| source-digest-corruption | `PACKET_SOURCE_DIGEST_MISMATCH` | PASS |
| policy-decision-flip | `POLICY_DECISION_MISMATCH` | PASS |
| occurrence-claim-flip | `OCCURRENCE_CLAIM_MISMATCH` | PASS |
| mutation-erasure | `EXPECTED_MUTATION_MISSING` | PASS |
| production-scope-widening | `PACKET_SCOPE_WIDENED` | PASS |

## Material limitation

- **WRONG_TARGET_POLICY_NOT_INDEPENDENTLY_DERIVABLE:** No machine-readable policy artifact defines the permitted target. In the wrong-target control, authorized_action and delegated_authority.action_digest both equal the attempted customer-002 action, so the denial is reproducible only as a declared policy label plus denial observation.
- **SPONSORSHIP_IS_LOCAL_UNSIGNED_METADATA:** The sponsorship record is schema- and scope-checked but is not cryptographically bound to the action or an external identity; the source explicitly disclaims external identity binding.

The three fixture records are internally reproducible, but the wrong-target denial is not independently derivable from a supplied policy artifact. In that control, both `authorized_action` and `delegated_authority.action_digest` equal the attempted customer-002 action. The verifier can reproduce the declared policy label, denial observation, and non-occurrence binding; it cannot independently prove why customer-002 is unauthorized.

## Assurance boundary

- This is a cross-implementation replay of one pinned synthetic, owned-fixture packet.
- It is not a live MCP/API test, production enforcement evidence, external identity binding, security audit, certification, endorsement, adoption signal, or validation of either project.
- Human sponsorship is unsigned local metadata and is checked only for schema and owned-fixture scope.
- The current wall clock is not used to invalidate a historical replay; occurrence is checked against the recorded authorization window.
- The upstream packet is not vendored because the handoff repository publishes no license file; reproduction uses a separately cloned pinned source tree.
- Every result fixes `execution_authorized` to `false`.

## Reproduce without network execution

After cloning both repositories and checking out the source commit above:

```bash
npm ci
npm run verify:authority-replay -- \
  --input ../authority-execution-replay/source/replay-packets/authority-execution-replay-v1.json \
  --manifest ../authority-execution-replay/manifest.json \
  --source-dir ../authority-execution-replay/source
```
