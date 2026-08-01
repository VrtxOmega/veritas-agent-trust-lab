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
Link an immutable implementation commit and attach or link the machine-readable
results. If a finding could expose a live system or secret, report it privately
to `VrtxOmega@pm.me` before opening a public issue.

A submitted report is not automatically counted as independent validation.
Identity, method, artifact provenance, relationship disclosures, scope, and
Protocol v2 caps must be verified first. One review-and-correction lifecycle is
one event, not multiple events.

## What participation does not imply

Participation does not establish endorsement, certification, broad VERITAS
efficacy, production security, factual truth, adoption, payment, or execution
authority. The reference implementation and any report can both be wrong.
