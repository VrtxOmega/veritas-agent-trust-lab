# Track 1 report #81: project-side replay and bounded repairs

Recorded 2026-09-27. Source: [tolegm / AstraNL report #81](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/81), following the [pins agreed in #60](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/60#issuecomment-5755188584).

## What was actually reproduced

The unchanged submission at gist revision `f65d3f3ec1c32023c5e504f1187b6a4644d6c7db` was replayed on Linux x86_64, Python 3.13.5 and Node v22.16.0. All five regenerated result files were **byte-identical** to that revision. The separate Python implementation and frozen JavaScript reference agree on all **12 complete result objects**: six CLEAN/ALLOW and six TAMPERED/BLOCK dispositions, every packet field/digest/count, ordered reasons and boolean `execution_authorized: false`.

This is a **project-side replay** of an external, separately written implementation. It is not a new external evaluator, an independent model-family verification, a completed Track 2/3 run, or a certification. The reporter disclosed Claude-produced implementation/probes/report, a same-family review, and no human review before posting. The correlation with the Claude-assisted #71 submission remains explicit. No campaign totals are changed.

The original report and implementation remain at the [immutable external gist](https://gist.github.com/tolegm/a5ed5b3e7f2c6c0c09d6c4642705ad51/f65d3f3ec1c32023c5e504f1187b6a4644d6c7db). They are not rewritten or attributed to this project. The local replay and repairs were assistant-assisted project work; no additional independent human review is claimed.

## Pins and evidence

- Evaluated source: `0f3c71fdb0e9078d8a5d8684411d0318fe600bb1`.
- Original challenge documents: `3903ec2323f7c8060ade54f1dcd01f2299556a66`.
- Pre-repair main: `93e7dc2fff160d70fae5be4edaee4692cc1d276f`; its engine bytes still matched the frozen engine.
- All three source hashes and both document hashes were checked before replay.
- [Machine-readable replay receipt](tolegm-track1-20260927/project-replay-summary.json).
- [Reproduced original rule probes](tolegm-track1-20260927/reference_probes.json).
- [Project-side replay runner](../scripts/replay-tolegm-track1.py).
- [Public source-capture run](https://github.com/VrtxOmega/veritas-agent-trust-lab/actions/runs/36323793814) fetched pinned public bytes without executing them. The attached artifact is an auxiliary, expiring capture, not the canonical source pin.

The runner checks the pinned submission manifest before executing the reviewed commands. It writes only to a new output directory, compares the five outputs byte-for-byte with the submission and checks input hashes again afterward. A separate strict comparison also rejects missing, duplicate and additional cases, altered digests/counts, all-allow/all-block outputs and a numeric `0` masquerading as boolean false. All eight deliberately wrong controls were detected. These controls are **new project-side checks**, not retroactive additions to tolegm's method.

## Reproduce the original report

Use a full-history checkout of this repository for the runner and two detached worktrees for the immutable source and original documents. Review external code before running it; the hashes identify the reviewed version rather than proving code safe.

```sh
git clone https://github.com/VrtxOmega/veritas-agent-trust-lab.git lab
git -C lab worktree add --detach ../frozen-source 0f3c71fdb0e9078d8a5d8684411d0318fe600bb1
git -C lab worktree add --detach ../frozen-documents 3903ec2323f7c8060ade54f1dcd01f2299556a66
git clone https://gist.github.com/a5ed5b3e7f2c6c0c09d6c4642705ad51.git track1
git -C track1 checkout --detach f65d3f3ec1c32023c5e504f1187b6a4644d6c7db
python3 lab/scripts/replay-tolegm-track1.py \
  --reference frozen-source --documents frozen-documents \
  --submission track1 --output fresh-replay
```

The runner uses only Python standard library and Node built-ins and performs no automatic download. Run it from the repair branch/commit while this change is under review; record that runner revision separately from the two frozen targets.

## #82: heartbeat rule

The reporter's original probes regenerated unchanged. Missing/empty/unparseable values produce NaN in the frozen rule; future values produce a negative age. Neither is greater than ten, so the rule incorrectly reports fresh. Exactly ten seconds is fresh under the original inclusive boundary. These are **rule-level observations outside the fixed public fixtures**, not a bypass of the twelve cases or of a hosted authorization service.

This patch makes the maintained demonstrator call `assessHeartbeat` from `lib/monitor-freshness.js`. Its explicit input contract is UTC ISO timestamps with seconds and optional three-digit milliseconds. Missing, malformed, calendar-overflow, non-string and future timestamps cannot establish freshness. An invalid evaluation clock or invalid TTL also fails closed. The freshness interval is `0 <= age <= TTL`, including exactly ten seconds for the default TTL; there is no future-clock allowance. Zero TTL accepts only age zero. New failures have distinct reason codes; the historical expired-fixture reason codes are preserved.

This does **not** verify a signature, authenticate a monitor or issue authority. Those are not implemented by the public demonstrator.

## #83: declaration grouping, and what remains unresolved

The delimiter collision and case/trailing-space inflation reproduced on the unchanged original function. A new `countDeclaredEvaluatorGroups` helper uses a JSON tuple of NFKC-normalized, edge-trimmed, lowercased identifier labels. Invalid or missing declarations throw rather than creating a group. Delimiter-containing distinct tuples stay distinct; cosmetic aliases collapse.

The three fields remain `model_family`, `prompt_ancestry` and `retrieval_set`. The case summary no longer claims code-path independence is checked when it is not. Historical output names such as `independent_group_count` remain for fixture compatibility; they describe a **simulated declared grouping**, not authenticated independence.

**Important residual:** normalization does not make self-declared labels authoritative. Meaningfully different false labels can still change the declared grouping. Real identity/provenance, evidence of shared code paths and rules for verified correlation need a separately designed authoritative source. This patch does not claim to solve them, so #83 should not be closed as full independence verification.

## Preserving the original challenge

No frozen commit, expected hash, protocol acceptance rule, external implementation or original result is changed. Main is allowed to improve; the v1 challenge still points at its original commit. Source-pin tests now read the named immutable Git object rather than incorrectly requiring moving main to stay byte-identical forever. The existing verification/deployment checkouts fetch history for those tests and do not persist credentials.

A regression compares every field of all twelve maintained results with the hash-verified frozen engine. They remain identical, including the six positive controls, all packet digests and `execution_authorized: false`.

The forged-verdict CLEAN result remains ALLOW while `claimed_result` is CONFLICTED: ALLOW here means **the recomputation agrees**, not that the dependency is safe, the claim is true, or execution is authorized. This distinction is preserved rather than changing the frozen result to hide the observation.

## Verification and limits

Local focused run: **45/45 Node tests**, including 23 new regression tests plus existing engine, frozen-protocol and receipt tests. The wider source-only run passed **105/105**; it excluded the two suites requiring generated build assets. The public PR workflow additionally performs the normal install, lint, production build, complete Node suite and Pages export. A local focused pass is not represented as a full-build pass; read the actual CI result before merge.

The nonce store/atomicity, full Track 2/3 mutation population, browser interaction, universal canonicalization equivalence and the non-public V4 kernel remain outside this result. Attribution: external findings by **@tolegm / AstraNL**; replay, comparator calibrations and remediation are project-side work.
