# Agent Gate: second external evaluation — 2026-09-06

## Current status

Michael Saleme (`msaleme`) has published a separately dated second evaluation, including the repaired target. The optional evaluator-kit PR offer is **withdrawn because the proposed functionality already exists**. This is not a rejection of the project or a missing contribution to chase. No evaluator-authored kit commit is claimed.

Source: [comment 5559674991](https://github.com/msaleme/red-team-blue-team-agent-fabric/issues/304#issuecomment-5559674991), created and updated at capture at `2026-09-06T13:52:57Z`.

[Preserved source text](external/msaleme-agent-gate-20260906/report.md), SHA-256:
`0e6f4f34e35fc9bbdac8f22af3734eea23502ec7b97080ed9a254c94bf8898ad`.
The snapshot retains the decoded UTF-8/LF comment body, including the quoted commands. It is not a raw HTTP response, a raw execution log, a new software license grant or a new experiment. The comment is a mutable source locator; the retained snapshot and hash identify this capture.

The existing `VTL-V2-NQ-20260905-002` lifecycle now appends this result in `received_evaluations`. Earlier pending observations and the complete first evaluation entry remain unchanged. The new current-status pointer does not amend their historical scopes. The preceding [repair review](https://github.com/msaleme/red-team-blue-team-agent-fabric/issues/304#issuecomment-5555581661) remains a code review; this new source is the separately reported execution.

## Three identities, two different evidentiary roles

| Role | Repository revision |
|---|---|
| Frozen target | `VrtxOmega/veritas@256daeb85dae7ac004ae9893df858f58c87ec523` |
| Repaired target | `VrtxOmega/veritas@92f7d9310d102a42941e55131ee869a04651590a` |
| Evaluator kit | `VrtxOmega/veritas@92f7d9310d102a42941e55131ee869a04651590a` |

The kit SHA and repaired-target SHA happen to be equal. Record both roles rather than implying that equal revisions erase the distinction or establish independent implementations. The evaluator reports Python 3.12, separate clean target checkouts, identity checks before and after, and a fresh-clone kit run. His exact classification is **“external, author-run; not independent validation of VERITAS.”** Preserve that classification without assigning a stronger evidence level.

## Reported execution results

The unchanged original 18-case probe returns **17 matching outcomes, zero mismatched verdicts and one float-related ValueError on each target**. This is not 18/18, and the two replays do not revise the September 5 result. That probe does not exercise the malformed-action recheck lifecycle.

The separate lifecycle experiment uses one fresh ticket for a legitimate issuance-and-recheck acceptance control, then a second valid ticket for the malformed recheck and original-action retry:

| Target | Legitimate acceptance | Float at recheck | Retry original action |
|---|---|---|---|
| Frozen `256daeb8` | Allowed | ValueError | SHADOW_ALLOW |
| Repaired `92f7d931` | Allowed | ValueError | DENY: approval ticket replay detected |

The standalone probe is reported to exercise only the default replay store. Both acceptance controls matter: denial of the last retry alone would not distinguish the repair from rejecting every valid operation. This is a reported external reproduction of the specific old behavior and of its repaired counterpart, not proof of every ticket-lifecycle property.

## External execution is not transferred code authorship

The evaluator also reports using our existing kit. Package validation reports valid; `pytest evaluation/` reports **11 tests passed and 18 subtests passed**, not 29 tests and not the 42 Agent Gate regression cases. The existing replay runner produces the same lifecycle differential on **memory and file stores**.

The two deliberately incorrect results are detected in those kit runs: the duplicate-control allow mutant and the positive-control denial mutant each produce MISMATCH. The kit's non-execution assertions and calibration code remain **project-authored**; their execution in this second report is attributed to **Michael**. They are not newly independently authored controls and are not retroactively inserted into his original September 5 evaluation. A printed project-side classification in the kit output identifies its origin; this separate external report supplies the outside-run attribution.

Michael says the optional PR would duplicate functionality already built and risk crediting him for our work. Its disposition is `offer_withdrawn_existing_functionality`, not an external contribution, adoption, a refused evaluation or an adverse product verdict. His testing and feedback are credited through the report instead.

## Limits and command-record clarification

The comment supplies a narrative, a results table, and abbreviated command examples, not raw external stdout/environment logs or the new standalone probe source. Those are limits of this received artifact, not a claim that no such material exists. The current intake checked the live source and pinned runner; it did not perform another target execution or invent a transcript.

Concurrency, exhaustive canonicalization-error coverage, and mid-commit storage failure were **not exercised** in the reported evaluation. The storage-failure passage distinguishes reading the code from injecting a failing commit. The evaluator explicitly did not reproduce the 42 project-side regression tests. Floats remain rejected by exception on both revisions; no exception-to-DENY adapter or production execution is established.

One concrete reproducibility detail: the [pinned runner](https://github.com/VrtxOmega/veritas/blob/92f7d9310d102a42941e55131ee869a04651590a/evaluation/reproduce_msaleme_20260905.py) requires `--output`. Both source command excerpts omit it and contain specimen-path placeholders. They remain verbatim in the archive; do not claim those exact excerpts are complete executed commands. The following are **project-supplied completed examples**, not recovered command history. Run from a separate clean kit checkout at the recorded kit SHA, with sibling target checkouts at the corresponding target SHAs and the documented Python dependencies installed:

```sh
python evaluation/reproduce_msaleme_20260905.py --specimen ../veritas-frozen \
  --expected-commit 256daeb85dae7ac004ae9893df858f58c87ec523 \
  --expected-float-retry SHADOW_ALLOW --output ../results/frozen.json
python evaluation/reproduce_msaleme_20260905.py --specimen ../veritas-repaired \
  --expected-commit 92f7d9310d102a42941e55131ee869a04651590a \
  --expected-float-retry DENY --output ../results/repaired.json
```

No behavior change is required by this intake. Original snapshots, both targets, kit implementation, repair and project-side test results are left alone.

## Campaign disposition

This is **valuable completed external work at zero additional qualifying weight**. The actor already reached Protocol v2's two-event individual cap. Append to the existing lifecycle without adding a validator, organization, hostile/verifier counter, accepted integration, adoption or payment. Campaign totals remain 11 qualifying events, 8 technical events, 10 validators, 10 organization/community families, zero qualifying hostile/verifier events and $0 settled revenue. The zero capped score must not be paraphrased as “no external retest occurred.” No new outreach or follow-up allowance is consumed by this invited technical reply.
