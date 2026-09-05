# Break VERITAS: External Verification Challenge v1

**Status:** Open

**Scope:** The public, MIT-licensed VERITAS Omega Agent Trust Lab contract

**Execution authorized:** `false`

VERITAS should not be trusted merely because its own tests pass. This challenge
asks an outside engineer or researcher to independently reproduce or break one
bounded verification path and publish enough evidence for someone else to
repeat the result.

Praise is optional. A compatible implementation is useful. A documented
disagreement is better. A reproducible bypass is the most valuable result.

## Frozen public baseline

The challenge is pinned to commit
[`0f3c71fdb0e9078d8a5d8684411d0318fe600bb1`](https://github.com/VrtxOmega/veritas-agent-trust-lab/tree/0f3c71fdb0e9078d8a5d8684411d0318fe600bb1).

| Artifact | SHA-256 |
|---|---|
| `lib/trust-engine.js` | `60c8d7e26fa0a352401b391015618c56b9be39d59c4b7cc4d5b24ec3f8d726c2` |
| `public/verification-packet.json` | `87ff8f3784f7509e05ae19bc8f72236f061bff32ce79777c65343ac56609b54f` |
| `lib/challenge-receipt.js` | `21b8f565ee6155b7eec93e3fa490506f66453cfed7fb2b3c19eea8d4f0f4229e` |

The machine-readable protocol is
[`protocol/external-verification-challenge-v1.json`](../protocol/external-verification-challenge-v1.json).

## Important V4 boundary

This challenge covers the public browser demonstrator, not the complete
VERITAS Omega V4 Shielded kernel. The V4 archive currently grants no public
distribution or modification license and cannot be silently published as part
of this challenge. A full-kernel V4 track requires a separate explicit license
and release decision by the copyright holder.

The public contract demonstrates deterministic synthetic cases for result
recomputation, exact action binding, replay, evaluator dependence, evidence-set
identity, and heartbeat expiry. It does not issue cryptographic signatures,
provide a production nonce store, establish factual truth, authorize an agent,
or certify a system.

## Independence rules

1. Pin the exact baseline commit and verify the artifact hashes before testing.
2. Do not import, call, wrap, transpile, or vendor `lib/trust-engine.js` as the
   implementation under test.
3. You may inspect the public source and protocol. This is implementation
   separation, not source blindness.
4. Implement the selected contract independently and publish the source,
   dependency lock, exact commands, and result artifact at an immutable commit.
5. Exercise clean acceptance controls as well as hostile cases. A verifier that
   rejects everything has not reproduced the contract.
6. Report every mismatch and untested boundary. Partial and negative results
   are welcome.
7. Disclose prior relationships, compensation, reused code, model assistance,
   and shared dependencies that could reduce independence.
8. Use synthetic or safely redacted data only. Do not include credentials,
   customer data, private logs, or live destructive instructions.

## Track 1 — Independent result recomputation

Reimplement the six case families without importing the reference evaluator.
Run both `CLEAN` and `TAMPERED` modes for all six families, producing twelve
results.

At minimum, compare:

- `verified_result`;
- `disposition`;
- ordered `reason_codes`;
- case-specific packet digests and counts;
- the invariant `execution_authorized: false`.

All six clean modes are positive controls. Report exact matches, mismatches,
and fields you deliberately did not implement.

## Track 2 — Break the action boundary

Attempt to make a broadened, substituted, replayed, or dependence-inflated
operation appear eligible. Exercise at least these mutation families:

- operation or command substitution after approval;
- target or filesystem-root broadening;
- consumed nonce reuse;
- correlated evaluators presented as an independent quorum;
- deletion of refuting evidence while retaining the old evidence identity.

For every hostile mutation, include the corresponding unchanged clean packet
as a positive control. A strong finding identifies the exact invariant crossed,
expected and observed decisions, minimal reproducer, and impact.

## Track 3 — Break monitoring and revocation

Attempt to make an expired or unverifiable monitor appear active. Exercise:

- a heartbeat inside its declared TTL as the positive control;
- a heartbeat outside the TTL;
- a missing heartbeat;
- a future-dated heartbeat;
- an out-of-order or replayed sequence, if implemented;
- a broken predecessor chain, if implemented.

The public reference directly demonstrates TTL expiry only. Additional sequence,
signature, and chain checks are extension findings unless and until the public
contract specifies them.

## Result classes

- **Independent reproduction:** the separate implementation obtains the same
  scoped results under the pinned cases.
- **Substantive technical review:** the method mostly matches, but a claim,
  assumption, or coverage statement needs correction.
- **Externally discovered defect:** a reproducible bypass, inconsistency, false
  acceptance, or false rejection is demonstrated.
- **Compatible implementation:** a separately maintained implementation
  exposes the same bounded contract in another language or runtime.

Every valid finding will be preserved with its original scope. Corrections will
retain the failing case and add a regression when appropriate.

## Submit a report

Use the
[`External verification` issue form](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?template=external-verification.yml).
An issue comment or short counterexample in your own format is also welcome;
the form and JSON schema are optional reporting aids, not intake requirements.
Link an implementation revision and original artifacts when available; missing
metadata can be clarified during assessment. If a finding could expose a live system or secret, report it privately
to `VrtxOmega@pm.me` before opening a public issue.

A submitted report is not automatically counted as independent validation.
Identity, method, artifact provenance, relationship disclosures, scope, and
Protocol v2 caps must be verified first. One review-and-correction lifecycle is
one event, not multiple events.

## Incoming findings: preserve before assessing

Use the existing Protocol v2 ledgers/addenda and any existing prospective record.
Link the original outreach or result record and source identifier to prevent
duplicate entries; preserve the August baseline. An invitation, volunteered run,
project-side review, self-test, or CI success is not an external evaluation.
A structurally valid report is not proof that an experiment happened and must
not automatically change evidence class or campaign totals.

1. **Preserve the source first.** Retain the received report in its own format,
   source URL/message reference, receipt time, and original artifacts or an
   access-controlled copy with SHA-256 hashes. A mutable link alone is not a
   preserved artifact. Keep any normalized JSON, redacted copy, or summary
   separately linked to the original; do not overwrite it. Keep private replies,
   email addresses, and private logs out of the public repository without consent.
2. **Identify the experiment.** Record the exact target repository and commit,
   the contract/document revision used for expected behavior, harness repository
   and commit/version, dependencies/environment, inputs, commands, and raw logs.
   Record expected versus observed behavior and any missing metadata as unknown.
   Retain positive acceptance and deliberate-negative calibration observations
   and their artifacts. Missing calibration limits a clean-run claim; it is not
   grounds to reject a concrete counterexample at intake.
3. **Reproduce before remediation.** Preserve the failing fixture and reproduce
   against the reported frozen revision before changing code. Record our attempt,
   environment, expected/observed output, and differences from the reporter's
   result separately. If reproduction is blocked or disagrees, retain the finding
   as unresolved/inconclusive with the reason; do not mark it fixed or erase it.
   Keep a later fix and retest at a new revision linked to the original failure.
4. **Assess without changing the historical claim.** Keep implementation defects,
   known limits, evaluator/instrument defects, and unresolved disagreements
   distinct, with reasons and links to supporting evidence. A known-limit
   classification must cite a limit already present in the tested contract.
   A real violation of a frozen documented guarantee cannot be dismissed by
   adding a broader disclaimer afterward. Preserve the reporter's interpretation
   alongside any differing project assessment. Protocol v2 identity, provenance,
   independence, deduplication, and cap review governs any later count decision;
   technical value can remain even when count weight is zero.

For the **separate Agent Gate v0.1 lane**, the target is
[`VrtxOmega/veritas@256daeb85dae7ac004ae9893df858f58c87ec523`](https://github.com/VrtxOmega/veritas/tree/256daeb85dae7ac004ae9893df858f58c87ec523).
Use its [frozen contract](https://github.com/VrtxOmega/veritas/blob/256daeb85dae7ac004ae9893df858f58c87ec523/AGENT_GATE_DEMONSTRATOR.md)
and record the [evaluator guide revision](https://github.com/VrtxOmega/veritas/blob/0a3f789771c868649c7dc2730d94f1956822d141/evaluation/EVALUATE_AGENT_GATE.md)
separately. This lane evaluates the actual Python specimen through
`evaluate_and_issue` and ticket recheck; the browser challenge's independent
reimplementation rule above does not forbid importing this specimen. A clean
Agent Gate run needs legitimate acceptance and an observable deliberately broken
semantic calibration control. Minimal duplicate-control or cross-action
counterexamples through `evaluate_and_issue` are welcome without schema conversion.
Do not conflate the browser baseline, later packaging commits, or project tests
with an outside run of the frozen Agent Gate target.

## What participation does not imply

Participation does not establish endorsement, certification, broad VERITAS
efficacy, production security, factual truth, adoption, payment, or execution
authority. The reference implementation and any report can both be wrong.
