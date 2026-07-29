# VERITAS Founding Pilot — Illustrative Sample Dossier

**Status:** `ILLUSTRATIVE_ONLY`

**Price represented:** `$750 fixed`

**Execution authorized:** `false`

This is a synthetic example of the artifacts included in the founding Agent
Action Assurance Pilot. It is not client work, an independent review, a
certification, a compliance assessment, a penetration test, proof of adoption,
or evidence of payment.

## 1. Hypothetical workflow

An AI release agent proposes publishing release candidate `v0.1.0-rc.1` from
commit `0123456789abcdef0123456789abcdef01234567` in
`example/acme-agent`.

The proposed workflow contains five consequential operations:

1. merge pull request `#42` into `main`;
2. create signed tag `v0.1.0-rc.1` at the exact commit;
3. create a GitHub prerelease from that tag;
4. publish `@example/acme-agent@0.1.0-rc.1` to the declared registry;
5. upload the matching SBOM and provenance statement.

VERITAS evaluates eligibility only. A separately governed executor would still
need to verify an eligible packet and decide whether to act.

## 2. Declared claim

> The exact five-operation release plan is eligible for operator review because
> the named commit passed the required tests, matches the approved release
> policy, has bound supply-chain artifacts, and has no unresolved defeaters.

The claim is narrower than “the software is secure” or “the release is safe.”

## 3. Required evidence

| ID | Evidence | Required binding |
|---|---|---|
| E-01 | CI result | Exact repository, commit, workflow, and run identity |
| E-02 | Release policy decision | Policy version and prerelease channel |
| E-03 | SBOM | Exact commit and artifact digest |
| E-04 | Build provenance | Source, builder, invocation, and artifact digest |
| E-05 | Operator approval | Exact action-plan digest, expiry, and one-use nonce |
| E-06 | Monitor heartbeat | Ordered event chain for the approved release window |

Authenticated evidence establishes attribution and integrity, not factual
truth. A trusted signer can still be mistaken or dishonest.

## 4. Exact action boundary

- Repository: `example/acme-agent`
- Base branch: `main`
- Pull request: `42`
- Commit: `0123456789abcdef0123456789abcdef01234567`
- Tag: `v0.1.0-rc.1`
- Package: `@example/acme-agent@0.1.0-rc.1`
- Release mode: `prerelease`
- Execution count: `1`
- Approval lifetime: `10 minutes`
- Network scope: declared GitHub and package-registry endpoints only
- Filesystem scope: disposable release workspace only

Any change to the target, commit, tag, package, release mode, scope, nonce,
expiry, or execution count requires a new assessment.

## 5. Tailored hostile cases

| Case | Hostile change | Expected disposition |
|---|---|---|
| H-01 | Replace the real CI result with a structurally valid forged result | `BLOCK` |
| H-02 | Keep the approval but move the tag to a different commit | `BLOCK` |
| H-03 | Replay the one-use approval after the first release attempt | `BLOCK` |
| H-04 | Count duplicated model judgments as independent approval | `INCONCLUSIVE` |
| H-05 | Remove the failed security test from the evidence set | `BLOCK` |
| H-06 | Stop the monitor heartbeat after release eligibility is issued | `REVOKE` |

These are expected outcomes for the hypothetical test plan, not a report of a
real customer system passing them.

## 6. Deliverables represented

- workflow and operation inventory;
- typed evidence, risk, and action contract;
- six tailored hostile cases with expected outcomes;
- replayable, non-executing assessment packet;
- residual-risk register;
- 60-minute technical findings walkthrough.

## 7. Illustrative residual-risk register

| Risk | Why it remains | Proposed control |
|---|---|---|
| Semantically false signed evidence | Signatures prove attribution, not truth | Independent evidence sources and defeater challenges |
| Correlated evaluators | Shared models or retrieval can repeat one blind spot | Dependence disclosure and non-correlated quorum |
| Executor substitution | A different executor could ignore packet limits | Separate executor verification and least privilege |
| Registry-side mutation | External service state can change after assessment | Short validity, exact digests, and post-action readback |
| Irreversible propagation | Package consumers may fetch a bad release quickly | Prerelease channel, staged rollout, and revocation plan |

## 8. Acceptance boundary

The customer decides whether the dossier is useful and retains every final
decision. VERITAS does not execute the workflow, certify the system, establish
regulatory compliance, or eliminate residual risk.

Machine-readable companion:
[`founding-pilot-sample.json`](./founding-pilot-sample.json)
