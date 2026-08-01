# VERITAS Omega Agent Trust Lab

> **A verdict is not authority.**

A zero-signup public reference demonstrator for the assurance boundary between
an AI-agent evaluation and a consequential action.

[Open the live trust lab](https://vrtxomega.github.io/veritas-agent-trust-lab/)

Visitors first make six blinded allow/block judgments across a fixed
three-clean/three-tampered challenge. Only after all labels are sealed locally
does the site reveal the deterministic result, reason code, and score. Labels
stay in the browser unless the participant explicitly downloads them or submits
a public GitHub issue or manually sends the private pre-reveal email
commitment.

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

Nine independently attributable outside actions currently qualify:

- three external curators merged scoped Trust Lab catalogue entries, including
  the project-owner merge of the explicitly new-project `WATCHLIST.md` entry in
  `awesome-ai-security-tools`;
- the AgentDoctor owner independently reproduced a concrete output-file
  symlink escape, required a focused remediation matrix, then re-reviewed,
  approved, and merged the corrected Action contribution; that lifecycle
  remains one counted technical event;
- the Drift owner merged a campaign-produced staleness-sampling fix;
- a Trail of Bits Dylint collaborator identified inaccurate rustdoc, required
  the generated README to be corrected with it, and merged the corrected fix;
- a freedesktop-rs member approved the campaign-produced nmrs fix while holding
  its merge to consider the intentional source-breaking API change;
- a Rask repository actor closed the campaign-produced reachability patch
  without merge and identified the missed root cause as the mangling collision.
  This unfavorable review is counted once and separately recorded as a negative
  outcome and closed lane.
- the red-team/blue-team repository owner independently verified the pinned RCL
  fixture provenance, confirmed that the separate verifier's method and 11/11
  result reflect the intended contract, and corrected the fixture's JCS label
  and future-timestamp coverage limit. This is one substantive review, not an
  independent verifier run.

The canonical ledger links every actor and immutable source. These events
validate only the action stated for each record. They do not establish
challenge use, VERITAS efficacy, calibration, certification, adoption,
endorsement, or commercial demand. Independent pre-reveal label sets remain
**0** and verified payments remain **$0**.

## Contribute evidence

- Take the blind challenge without reading the source.
- Download the local label record, or explicitly submit the generated public
  GitHub issue after reading its consent boundary.
- Without a GitHub account, use the private pre-reveal email action generated
  by the site. Sending is manual, discloses the sender's email address to the
  recipient, and permits retention of the message and delivery headers.
- Or use the dedicated
  [blind-label issue form](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?template=blind-label-set.yml).
- Propose a seventh falsifiable case through the issue form.
- Independently reproduce or break one bounded contract through the
  [External Verification Challenge](docs/EXTERNAL_VERIFICATION_CHALLENGE.md).

GitHub participation is public and attached to the participant's GitHub
identity. The email route is private; the address or label set will not be
published without explicit participant consent. A timestamped GitHub issue or
email proves only receipt of the submitted six-label commitment—not
independence, expertise, honesty, or lack of source inspection. The lab itself
has no analytics, hosted form, automatic send, or hidden label collection.

### Check the checker

The versioned External Verification Challenge asks outside engineers and
researchers to independently implement one of three tracks: result
recomputation, exact action-boundary mutation, or monitoring and revocation.
Each track requires clean positive controls as well as hostile cases, a pinned
artifact hash, public reproduction commands, mismatch reporting, and
relationship or AI-assistance disclosure.

The challenge covers this MIT-licensed public demonstrator, not the complete
V4 kernel. The V4 archive is not included because its current license notice
does not grant public distribution or modification rights. A report remains
uncounted until its identity, implementation separation, provenance, evidence,
scope, deduplication, and Protocol v2 caps are reviewed.

- [Read the challenge](docs/EXTERNAL_VERIFICATION_CHALLENGE.md)
- [Inspect the machine-readable protocol](protocol/external-verification-challenge-v1.json)
- [Submit an external verification report](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/new?template=external-verification.yml)

## External-evidence campaign

Campaign Protocol v1.0 began July 29, 2026 with the original condition of
**50 qualifying outside validation events or one verified payment**. Its six
events, six validators, original scopes, and $0 payment state are frozen by
per-event SHA-256 digests.

[Campaign Protocol v2.0](protocol/campaign-protocol-v2.json) replaces that
terminal rule prospectively. It requires a balanced portfolio instead of
allowing easy signals or one payment to substitute for missing evidence:

- at least 50 qualifying events from 25 independent validators and 10 unrelated
  organizations or communities;
- at least 15 pre-reveal blind label sets;
- at least 10 technical reproductions, substantive reviews, or accepted
  integrations;
- at least five structured real-workflow adopter reports, including two
  repeat-use reports;
- at least five independently proposed or executed hostile cases;
- at least three independent verifier runs, cross-evaluations, or compatible
  implementations;
- no more than two events per person, five per organization, 40% in one
  category, or five catalogue/editorial events counting toward completion.

The commercial milestone is separate: at least **$750 settled at the published
pilot price** from an unrelated arms-length buyer, followed by delivery and
buyer acknowledgement. Payment does not end the technical campaign.

Current machine-checked Protocol v2 baseline: **9/50 qualifying events, 9
independent validators, 9 unrelated organizations or communities, 0/15 blind
label sets, 6/10 technical events, 0/5 adopter reports, 0/5 hostile cases, 0/3
independent verifier runs, and $0/$750 settled revenue**.

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
open PRs, sent outreach, thanks-only comments, self-tests, CLA or legal
signatures, reciprocal or paid engagement, and duplicate signals never count.

The nine events comprise three scoped curator decisions, one independent
technical reproduction, two accepted external integrations, and two
substantive external reviews plus the RCL fixture-contract owner review. One
review is an unfavorable root-cause rejection; the RCL review is not an
independent verifier run. Each record states its narrower claim and nonclaims.

The machine-readable
[Protocol v2 ledgers](evidence/campaign-ledgers-v2.json) keep qualifying events,
commercial payments, nonqualifying signals, negative outcomes, declines, closed
lanes, and the outreach denominator logically separate. The signed public
Protocol v2 commit is the prospective collection boundary. The legacy verifier
continues to protect the original six-event ledger; a separate follow-up change
will add automated recomputation of the new diversity caps, evidence minima,
outreach spacing, and commercial boundary.

The preregistered collection window closes November 30, 2026. The effort budget
allows at most 100 tailored initial contacts, 100 follow-ups sent no sooner than
seven days, 40 new technical contribution lanes, and 30 tailored commercial
proposals. If the time window closes or all four effort caps are exhausted
without meeting the technical requirements, the recorded outcome must be
`PAUSED_FOR_REDESIGN` or `CLOSED_INCONCLUSIVE`; thresholds may not be relaxed
retroactively.

## Founding pilot

The site offers a bounded **$750 Founding Agent Action Assurance Pilot**:
one workflow, up to five consequential operations, an evidence/risk/action
schema, six tailored hostile cases, a replayable packet, a residual-risk
register, and a 60-minute walkthrough.

It is an author-side technical pilot—not certification, compliance, or an
independent audit. Contact `VrtxOmega@pm.me`.

Before contacting the author, inspect the explicitly illustrative
[sample dossier](public/founding-pilot-sample.md) and its
[machine-readable companion](public/founding-pilot-sample.json). They show the
promised artifact shape, not client work, adoption, payment, or an outside
assessment.

## Primary context

- [NIST AI Agent Standards Initiative](https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative)
- [OpenAI: Running Codex safely](https://openai.com/index/running-codex-safely/)
- [Microsoft open trust stack for AI agents](https://devblogs.microsoft.com/foundry/build-2026-open-trust-stack-ai-agents/)
- [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/)

Those organizations do not endorse VERITAS.
