# VERITAS Omega Agent Trust Lab

> **A verdict is not authority.**

A zero-signup public reference demonstrator for the assurance boundary between
an AI-agent evaluation and a consequential action.

[Open the live trust lab](https://vrtxomega.github.io/veritas-agent-trust-lab/)

Visitors first make six blinded allow/block judgments across a fixed
three-clean/three-tampered challenge. Only after all labels are sealed locally
does the site reveal the deterministic result, reason code, and score. Labels
stay in the browser unless the participant explicitly downloads them or submits
a public GitHub issue.

The explorable lab covers:

1. forged derived verdict;
2. exact-action parameter swap;
3. one-use nonce replay;
4. correlated evaluator quorum;
5. deletion of refuting evidence;
6. silent monitoring after heartbeat expiry.

The site also includes a separate
[primary-source incident map](evidence/EVALUATION_SANDBOX_ESCAPE_CASE_STUDY.md)
of the July 2026 OpenAI and Hugging Face agent-evaluation security incident. It
separates disclosed facts from VERITAS interpretation, counterfactual controls,
and unresolved evidence. The incident is not added to the fixed six-case blind
score, and the mapping does not claim that VERITAS would have prevented it.

## Run and verify

```bash
npm ci
npm test
```

The Node test suite and the browser use the same engine in
`lib/trust-engine.js`.

`npm run build:pages` converts the already-built Vinext output into the public
GitHub Pages artifact and rewrites asset references for the repository path.
The deployment workflow reruns lint and all tests before publishing.

## Exact claim boundary

The tests demonstrate, on synthetic author-designed fixtures, that:

- every clean fixture passes its declared local boundary;
- every tampered fixture blocks or revokes;
- changed action parameters break exact binding;
- replayed nonces fail;
- correlated evaluators do not satisfy a two-independent-source quorum;
- removed evidence changes sealed evidence identity;
- stale monitoring revokes the lifecycle;
- every result fixes `execution_authorized` to `false`.

This browser lab is not the complete VERITAS Omega V4 kernel. It does not issue
cryptographic signatures, establish factual truth, enforce an external policy,
authorize an agent, certify a system, or constitute an independent security
audit. Its labels are not independent until an outside participant makes and
contributes them without answer-key exposure.

The separate V4 implementation and VERITAS Codex Gate are not included. This
repository's MIT license applies only to this public demonstrator.

## External evidence

On July 29, 2026, independent curator
[Edward Burton (`Ejb503`)](https://github.com/Ejb503) merged
[systempromptio/awesome-ai-agent-governance#27](https://github.com/systempromptio/awesome-ai-agent-governance/pull/27).
The merge placed the Trust Lab in the catalog's
**Security, Red-Teaming, and Threat Models** section.

That is one attributable external acceptance of the project's relevance to a
curated AI-agent-governance resource. It does not establish challenge use,
technical efficacy, calibration, certification, adoption, endorsement, or
commercial demand. Independent pre-reveal label sets remain **0** and verified
payments remain **$0**.

## Contribute evidence

- Take the blind challenge without reading the source.
- Download the local label record, or explicitly submit the generated public
  GitHub issue after reading its consent boundary.
- Or use the dedicated
  [blind-label issue form](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?template=blind-label-set.yml).
- Propose a seventh falsifiable case through the issue form.

GitHub participation is public and attached to the participant's GitHub
identity. The lab itself has no analytics or hidden label collection.

## External-validation campaign

The campaign terminal condition is deliberately harder than a launch metric:
**50 qualifying outside validation events or one verified payment**.

Current machine-checked state: **2/50 qualifying events, 2 distinct validators,
$0 verified payments**.

The canonical
[external-validation ledger](evidence/external-validation-ledger.json) records
the source, actor, scope, immutable evidence, nonclaims, and deduplication key
for every counted event. It also keeps open lanes at weight zero. Recompute it:

```bash
npm run validate:external
```

Counted categories include a verified blind-label set, technical reproduction,
accepted external integration, substantive review, adopter report, editorial
coverage, or scoped curator acceptance. Bots, CI, traffic, author activity,
open PRs, sent outreach, thanks-only comments, self-tests, and duplicate signals
never count.

The first two events are external curator decisions to merge Trust Lab listings.
Each validates only catalogue fit and discoverability in that repository. They
do not establish adoption, technical correctness, security assurance,
endorsement, certification, or payment.

## Founding pilot

The site offers a bounded **$750 Founding Agent Action Assurance Pilot**:
one workflow, up to five consequential operations, an evidence/risk/action
schema, six tailored hostile cases, a replayable packet, a residual-risk
register, and a 60-minute walkthrough.

It is an author-side technical pilot—not certification, compliance, or an
independent audit. Contact `VrtxOmega@pm.me`.

## Primary context

- [NIST AI Agent Standards Initiative](https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative)
- [OpenAI: Running Codex safely](https://openai.com/index/running-codex-safely/)
- [Microsoft open trust stack for AI agents](https://devblogs.microsoft.com/foundry/build-2026-open-trust-stack-ai-agents/)
- [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/)

Those organizations do not endorse VERITAS.
