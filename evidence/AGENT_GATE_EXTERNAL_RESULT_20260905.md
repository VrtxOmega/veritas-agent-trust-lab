# Agent Gate external result received — 2026-09-05

## Current state, separate from the earlier pending snapshot

Michael Saleme (`msaleme`) published an 18-case probe and report at [comment 5554102070](https://github.com/msaleme/red-team-blue-team-agent-fabric/issues/304#issuecomment-5554102070), created and last updated at capture at `2026-09-05T19:03:21Z`. The earlier prospective record is preserved as history; the machine-readable follow-on now appends `received_evaluations` and identifies the current state as received and project-reproduced. It is no longer merely a promise.

[Original report and unchanged Python block, frozen in Git](https://github.com/VrtxOmega/veritas/blob/a153bff98e7b59761fff3eff840762542394af95/evaluation/external/msaleme-20260905/report.md).
Report SHA-256: `2561f3b4c6b71766d56d38ceedcc53ba2d84712837c28ce4040b9498a8e92c61`.
Extracted probe SHA-256: `717d522609e794ad0074b90b4787ca4eaf0243ef362866a4e1753cf94f6e2c12`.
The comment ID locates the source; it does not make the mutable comment body immutable. Attribution remains Michael's; preservation is author-side, not his offered PR and not a new license grant.

## What he reports

Target `VrtxOmega/veritas@256daeb85dae7ac004ae9893df858f58c87ec523`, Python 3.12, clean tracked files and local specimen import before/after. His 17/17 author-suite result is setup only. His separately authored, contract-derived probe includes one positive case, eight pinned denials and nine extensions. **17 match their recorded expectations; one float case raises rather than returning a verdict.** He calls the tested contract clean and the exception an integration observation. Do not substitute 18/18 or a whole-project security claim for that result.

He highlights whole-envelope digest binding with a mutation of the uncontracted `urgency` field. He also reports correcting an instrument error: calling a single-use recheck twice had turned the first attempted observation into a replay. These details stay with the favorable observations rather than disappearing from a summary.

## What the project reproduced separately

[Python 3.12.14 CI run 33987139311](https://github.com/VrtxOmega/veritas/actions/runs/33987139311), job `101362709000`, checked out the exact frozen target. The unmodified probe again produced 17 MATCH / zero MISMATCH / one EXCEPTION. The runner checks snapshot/probe hashes, specimen commit/import identity and unchanged tracked state before/after. Original author tests passed 17/17 as setup only.

Two NEW project-side mutant calibrations sent deliberately wrong allow/deny behavior through the original comparison path and were detected. Separate supplements asserted legitimate issuance/recheck, replay denial, and non-execution. They are not externally performed calibration. The original probe's float case stops during `approvals_for -> digest_action` before the gate API is entered; its script lacks explicit first-recheck/non-execution assertions and a failing process exit. Its author's manual reason inspection is not an automated assertion.

The project also followed the float observation into a different lifecycle: **valid issuance -> float only at recheck -> ValueError -> retry original action -> SHADOW_ALLOW**. Python 3.12.14 reproduced that in memory and filesystem-backed SQLite stores. This violates the frozen document's unqualified failed-recheck-burn statement for this path. It is not one of Michael's 18 cases, not approval of the mutated action, and not an execution bypass. Preserve this failing sequence before a new-revision repair; a later disclaimer cannot erase it. The reproduction workflow intentionally expects the historical behavior, so green here means successful reproduction of a known gap, not remediation.

The CI JSON artifact is `9975500296`, ZIP SHA-256 `1605cbaf905a52e8453c42adaf0fdcaccc676377ca9e8d6400180b8d45dfb5f0`. CI artifact retention is finite. This document and the JSON ledger summarize fetched logs; the original source and replay commands stay pinned in Git. Local Python 3.13.5 reproduction additionally used blob-verified reconstructed files because direct GitHub DNS resolution was unavailable, not a full clone.

## Disposition

[The reply](https://github.com/msaleme/red-team-blue-team-agent-fabric/issues/304#issuecomment-5554207604) welcomes his offered evaluator-kit PR without making it a condition of acknowledging this report, preserves the original observation, and shares the separate project-side reproducer. No reply or PR acceptance beyond that is implied.

**Zero additional qualifying weight:** Michael has already reached Protocol v2's two-event individual cap. Keep this completed technical result visible without increasing 11 qualifying events, 8 technical events, 10 validators, 10 organization/community families, or the zero hostile/verifier campaign counts. A completed external report and a count-eligible event are different things. This is not certification, adoption, payment, authenticated-principal assurance or execution authority. No other outreach is authorized or recorded by this intake.

## Later same-day remediation — separate revision and evidence

The demonstrated intact-ticket/canonicalization-error path was subsequently repaired in [VERITAS PR #7](https://github.com/VrtxOmega/veritas/pull/7), merged as `92f7d9310d102a42941e55131ee869a04651590a`. The [remediation note at that revision](https://github.com/VrtxOmega/veritas/blob/92f7d9310d102a42941e55131ee869a04651590a/evaluation/RECHECK_ERROR_REMEDIATION_20260905.md) retains the failing frozen behavior, the narrow change, and storage/identity limits. Unsupported floats still raise; an intact ticket is now consumed before that exception propagates, so the original-action retry denies when the configured replay store successfully commits.

[Project-side differential CI](https://github.com/VrtxOmega/veritas/actions/runs/33987507127) checked the same new 25-case regression file against the frozen source and candidate on Python 3.12.14 and 3.13.15. Both runtimes reproduced exactly 21 specified failures and four passing positive/integrity controls before repair, and passed all 42 original-plus-new cases afterward. The unchanged external probe retained its original 17-matches/one-exception pattern. Its result is not rewritten by this new experiment. See [the log-readback verification](https://github.com/VrtxOmega/veritas/pull/7#issuecomment-5554301152) for job and artifact identifiers. No external re-evaluation of the repaired revision is established by these project-side checks, and no campaign counter changes.
