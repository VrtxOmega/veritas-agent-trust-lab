## Plan

### Goal

Launch a public, zero-signup VERITAS Agent Trust Lab that lets a visitor
interactively test forged-looking agent decisions against recomputation,
action binding, replay protection, evaluator-dependence, and heartbeat
revocation. Give the launch one honest revenue path through a scoped paid
pilot, and activate at least one verifiable distribution surface.

### Success definition

- A visitor can use the live lab without an account or local installation.
- At least six adversarial cases produce deterministic, explainable outcomes.
- A visitor makes a blinded allow/block judgment before seeing each VERITAS
  answer, receives a scored calibration result, and can export or voluntarily
  contribute the label set through a transparent public GitHub route.
- Every public claim is traceable to local code, tests, or primary-source
  market research and retains explicit nonclaims.
- A source repository, tagged release, production URL, portfolio/profile link,
  and launch-ready social/Show HN copy exist and are read back after writing.
- A paid pilot call-to-action names concrete deliverables, boundaries, price,
  and contact route without implying certification or independent audit.

### Scope

- New `veritas-agent-trust-lab` site and public-safe source repository.
- Browser-side deterministic challenge engine and six fixed attack cases.
- Browser-side blind-review challenge, scorecard, share packet, and opt-in
  public calibration-contribution route.
- Primary-source standards/context references and a transparent comparison.
- Downloadable verification packet and release evidence.
- GitHub Pages or Sites production deployment and existing portfolio/profile
  integration.

### Non-Goals

- Do not publish private Codex event data, prompts, commands, paths, secrets,
  review keys, or unredacted traces.
- Do not claim independent calibration, certification, production enforcement,
  regulatory compliance, or factual truth from signatures.
- Do not weaken VERITAS V4's `execution_authorized: false` boundary.
- Do not imply Nous Research, OpenAI, Microsoft, NIST, or any other referenced
  organization endorses VERITAS.
- Do not spam maintainers, manufacture engagement, buy votes, or submit
  overlapped/owner-held PRs.

### Steps

- [x] Research current agent-governance products, standards direction, launch
  channels, open-source growth cases, and bounty alternatives.
- [x] Run PCF against a current high-visibility contribution target and stop
  when it returns `NO_ACTION`.
- [x] Gate the selected product thesis through VERITAS.
- [x] Implement the lab, fixed cases, testable decision engine, and paid pilot
  boundary.
- [x] Implement the blind calibration loop and public contribution templates so
  third-party use can create new evidence rather than another author-side claim.
- [x] Build the social preview and public verification packet.
- [x] Run automated, hostile, accessibility, content, and release checks.
- [x] Create the public source repository and release through one focused
  publication path.
- [x] Deploy the production site and verify live behavior and artifacts.
- [x] Integrate the live proof into the existing portfolio/profile.
- [x] Activate the strongest available authenticated distribution surface and
  read it back; otherwise preserve exact ready-to-post launch packets.
- [ ] Seal the final outcome, record residual risks, and define the next
  evidence-driven growth experiment.

### Verification

- Unit tests for every attack case, invariant, and state transition.
- Mutation tests proving forged verdicts, changed parameters, replayed nonces,
  correlated evaluators, removed evidence, and missing heartbeats cannot appear
  healthy.
- Production build and clean static/runtime smoke tests.
- Secret/privacy scan and explicit public-file allowlist.
- PCF review of the public diff and launch packet.
- VERITAS BuildClaim and evidence/adversary gate with non-independent evidence
  reported as such.
- Production URL, asset, metadata, and interaction readbacks.

### Research decision

- Bounty hunting is rejected for this run: the current PCF scout returned
  `NO_ACTION`, and a live bounty-radar example resolved to a closed issue with
  multiple competing PRs.
- A generic agent gateway is rejected as undifferentiated against Microsoft
  Agent Governance Toolkit/ASSERT and Linux Foundation agentgateway.
- The selected wedge is the evidence boundary those systems do not make
  visually obvious: plausible output versus recomputable, exact-bound,
  replay-resistant, revocable assurance.

## Pull-request verification repair

### Goal

Give every pull request a GitHub-hosted verification result without entering
the production Pages deployment environment.

### Scope

- Add one read-only pull-request workflow.
- Run the repository's existing install, lint, test, and Pages-build commands.

### Non-Goals

- Do not deploy from pull requests.
- Do not change runtime code, dependencies, or the production deploy workflow.
- Do not treat owner-side CI as independent validation.

### Steps

- [x] Confirm the production workflow is restricted to `main`.
- [x] Add a separate least-privilege pull-request verification workflow.
- [x] Verify the workflow syntax and local command sequence.
- [x] Confirm the workflow passes on its own pull request.

### Verification

```bash
npm ci
npm run lint
npm test
npm run build:pages
```

The GitHub-hosted check must report success before merge.

### Distribution evidence

- Portfolio PR [VrtxOmega/veritas-portfolio#12](https://github.com/VrtxOmega/veritas-portfolio/pull/12)
  merged as `8d48be2cb9993d74776ae83e75a781c553fdf53e`; the live
  portfolio readback contains the Trust Lab, seven shipped proof surfaces, the
  tagged release link, and the retained `INCONCLUSIVE` adoption boundary.
- Profile PR [VrtxOmega/VrtxOmega#5](https://github.com/VrtxOmega/VrtxOmega/pull/5)
  merged as `cad4cf738342e452b4ba3903414d24a99056d517`; the public
  profile readback contains the Trust Lab live/source links and the verified
  15-contribution count.
- Independent directory PR
  [agentrust-io/awesome-ai-governance#48](https://github.com/agentrust-io/awesome-ai-governance/pull/48)
  is open, mergeable, and awaiting named-maintainer review. Automated
  contributor checks are workflow evidence, not independent validation.
- Independent directory PR
  [systempromptio/awesome-ai-agent-governance#27](https://github.com/systempromptio/awesome-ai-agent-governance/pull/27)
  is open and mergeable with GitGuardian passing and no human review yet.
- Public blind-calibration cohort
  [VrtxOmega/veritas-agent-trust-lab#1](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/1)
  is open for the first ten eligible pre-reveal label sets; opening the cohort
  is not evidence that an independent person has used the lab.
- A 15-minute task heartbeat monitors the three directory PRs. No independent human
  acceptance, eligible external label set, or payment has been observed.
  Therefore external adoption and calibration remain `INCONCLUSIVE`.

## AI security watchlist submission

### Goal

Submit the Trust Lab to one additional, demonstrably active and materially
larger AI-security catalog whose published criteria explicitly route zero-star
projects to a watchlist.

### Scope

- `scadastrangelove/awesome-ai-security-tools`
- One factual line in `WATCHLIST.md`
- One clean fork branch and one upstream pull request

### Non-Goals

- Do not request main-list placement before adoption evidence exists.
- Do not edit generated `README.md` or structured catalog data.
- Do not hide author affiliation or imply independent validation.
- Do not submit to more catalogs in this lane.

### Steps

- [x] Start from current upstream `main` and confirm no existing entry.
- [x] Add one neutral watchlist line stating why the zero-star project is being
  watched.
- [x] Inspect the exact one-file diff and run the repository's relevant checks.
- [x] Run PCF contributor preflight against the final patch.
- [x] Push one branch to the VrtxOmega fork and open one upstream PR.
- [x] Read back the PR, checks, and maintainer-facing evidence.

### Verification

- `git diff --check`
- exact one-file patch inspection
- upstream generator check if the watchlist change does not require regeneration
- PCF `ready-for-maintainer`
- public PR readback from the independent repository

Acceptance by the curator would validate catalog relevance and category fit,
not product efficacy, calibration, certification, or paid adoption.

Result: [scadastrangelove/awesome-ai-security-tools#29](https://github.com/scadastrangelove/awesome-ai-security-tools/pull/29)
is open, mergeable, and awaiting curator review. The public patch is exactly
one line in `WATCHLIST.md`, commit
`c2991b6cff46d01dc835ba7323f064e33e245185`. `git diff --check`,
`python3 gen_readme.py --check`, structured-data JSON validation, and both
public URL checks passed. PCF classified the final maintainer-facing packet
`ready-for-maintainer` at 100/100. This is a verified submission, not an
independent acceptance.

## Maintainer-review evidence update

### Goal

Record the fifth and sixth qualifying campaign events without promoting open
pull requests, author activity, automated checks, or legal-signature status
into external validation.

### Scope

- Canonical external-validation ledger and open-lane register.
- Public README campaign state.
- Trust Lab external-evidence section.

### Non-Goals

- Do not count the Dylint CLA, CI, author repair, or open pull request.
- Do not count the nmrs assignment or open pull request separately.
- Do not claim either reviewed pull request merged or shipped.
- Do not claim VERITAS efficacy, adoption, endorsement, certification, or
  payment.

### Steps

- [x] Verify the Dylint collaborator comment, actor association, immutable
  comment identity, and timestamp.
- [x] Verify the nmrs `APPROVED` review, member association, immutable review
  identity, reviewed commit, and timestamp.
- [x] Add one deduplicated `substantive_external_review` event for each actor.
- [x] Add all current uncounted technical-contribution lanes at weight zero.
- [x] Refresh the public evidence explanation and exact campaign count.
- [x] Validate schema, summary arithmetic, site tests, lint, and production
  builds.
- [x] Run PCF and VERITAS gates against the exact public diff.
- [ ] Publish through a clean pull request and verify live main/site readback.

### Verification

```bash
npm run validate:external
npm test
npm run lint
npm run build
npm run build:pages
git diff --check
```

The result is ready only when the machine ledger reports `6/50`, all public
copy preserves the event-specific nonclaims, and the deployed site reads back
the same count.

Local verification passed with 43/43 Node tests, lint, the Pages build, and
`git diff --check`. PCF classified the exact seven-file update
`ready-for-maintainer` at 100/100 with no blockers. The full typed VERITAS
pipeline satisfied all six numeric boundaries and passed intake, type,
dependency, math, cost, incentive, security, and trace sealing; its aggregate
meta-claim remains `INCONCLUSIVE` because the locally recomputed totals and
test/PCF receipts do not have two independent sources. The adversary gate also
reported `MODEL_BOUND` fragility when required evidence was removed. That
result is retained rather than upgraded into independent assurance.

## Rask compiler acquisition lane

### Goal

Track the new `rask-lang/rask#469` compiler contribution without converting
author activity, local verification, signing, mergeability, or an open pull
request into independent external validation.

### Scope

- Add one zero-weight open lane to the canonical external-validation ledger.
- Update the canonical-ledger count assertion from 14 to 15 open lanes.
- Preserve the campaign total at `6/50`, six distinct validators, and `$0`.

### Non-Goals

- Do not count the fork, branch, commit, local tests, PCF result, VERITAS
  result, open PR, mergeability, or future bot/CI results.
- Do not claim maintainer acceptance, correctness, merge, release inclusion,
  adoption, endorsement, certification, or payment.

### Steps

- [x] Verify the live PR URL, open state, mergeability, commit count, head SHA,
  and exact three-file diff.
- [x] Add the PR as one zero-weight open lane.
- [x] Validate ledger schema and arithmetic.
- [ ] Publish through one clean PR and read back main.

### Verification

```bash
npm run validate:external
npm run lint
npm test
npm run build:pages
git diff --check
```

Expected campaign state remains `6/50`, six validators, `$0`, 44 remaining,
and `ACTIVE`.

The first GitHub-hosted run exposed the stale `open_lanes: 14` assertion after
the ledger correctly recomputed 15. The assertion was updated to 15, then all
43 tests, lint, the application build, the Pages build, ledger validation, and
`git diff --check` passed locally.

## External VERITAS verification challenge and public-proof refresh

### Goal

Make a bounded, independently implementable "check the checker" challenge
available for the public MIT-licensed Trust Lab contract, while synchronizing
the active public portfolio surfaces to the verified Protocol v2 and GitHub
merge state.

### Scope

- Trust Lab challenge protocol, contributor instructions, issue intake, site
  entry point, and focused regression coverage.
- GitHub profile proof counters and contribution table.
- VERITAS portfolio Trust Lab proof point and regression assertions.

### Non-Goals

- Do not publish the all-rights-reserved V4 archive or select its license.
- Do not imply that the browser Trust Lab is the complete V4 kernel.
- Do not double-count the RCL owner review and its upstream correction.
- Do not rewrite historical reports, ledgers, or release evidence that were
  correct at their recorded commit.
- Do not claim certification, broad VERITAS efficacy, adoption, endorsement,
  payment, or execution authority.

### Steps

- [x] Verify current GitHub and canonical-ledger state: Protocol v2 is 9/50
  from nine validators; the frozen Protocol v1 snapshot remains 6/50.
- [x] Verify the external RCL lifecycle and the upstream metadata correction.
- [x] Verify 20 externally merged pull requests authored by VrtxOmega; keep
  Hermes maintainer-reapplied authorship separate from that direct-PR count.
- [x] Publish a versioned, machine-readable three-track external verification
  challenge with positive controls and exact nonclaims.
- [x] Add a low-friction public submission route for reproduction,
  disagreement, bypass, or compatible implementation reports.
- [x] Update the Trust Lab README and rendered site without changing the
  canonical 9/50 evidence count.
- [x] Update the GitHub profile and portfolio from their stale proof state.
- [x] Inspect all diffs and run repository-specific tests, lint, builds, and
  stale-claim scans.
- [x] Run PCF, SSWP, and VERITAS gates, then publish and perform live readback.

### Verification

- Trust Lab: `npm run validate:external`, `npm run lint`, `npm test`,
  `npm run build:pages`, and `git diff --check`.
- Profile: exact current/stale-string assertions and `git diff --check`.
- Portfolio: `python3 tests/verify_portfolio.py` and `git diff --check`.
- Public readback must preserve 9/50, nine validators, zero blind label sets,
  zero independent verifier runs, and $0 settled revenue until new qualifying
  evidence actually arrives.

### Outcome

- Trust Lab PR #59 merged as `f9a32b16d03528a8a5aa0ac8ac5eb2644a135d3d`;
  GitHub Pages and owner-only Sites version 28 were deployed from that exact
  merge commit.
- GitHub issue #60 is the labeled `help wanted` intake for independent
  reproduction, disagreement, bypass, and compatible implementation reports.
- Profile PR #8 and portfolio PR #15 merged, and their live readbacks preserve
  20 direct external PR merges, separate Hermes maintainer-reapplied
  authorship, Protocol v2 at 9/50, nine validators, 41 remaining, zero
  independent verifier runs, and $0 settled revenue.
- Trust Lab validation passed with 56/56 tests, lint, the Pages build, and the
  focused external-challenge checks. The portfolio regression test and both
  profile/portfolio stale-claim scans passed.
- SSWP passed all five governed gates. VERITAS remained `INCONCLUSIVE` on
  independent assurance, as required by the author-controlled evidence
  boundary. PCF could not produce a governed result because the required
  `CLEAN_PR_CONTRACT.md` was absent, so that gate remains explicitly degraded.
- Residual risks: zero independent verifier runs, zero blind label sets, zero
  settled revenue, seven existing npm audit findings, and no authenticated
  in-app visual QA because the browser transport closed during both attempts.

## RCL upstream-resolution evidence update

### Goal

Record the external repository owner's merged correction prompted by issue
#304 without double-counting the same actor, subject, or technical review.

### Scope

- Protocol v2 event `VTL-V2-20260801-003` resolution metadata.
- One explicit zero-weight same-subject follow-up record.
- Focused regression coverage for the deduplicated resolution.
- No public count, category, or campaign-state change.

### Non-Goals

- Do not count PR #307 or its follow-up comment as a tenth event.
- Do not classify the correction as an independent verifier run.
- Do not reply to a comment that explicitly says no reply is needed.
- Do not send new outreach during this heartbeat.

### Steps

- [x] Verify the owner comment, PR #307, merge actor, merge commit, changed
  files, old and new fixture hashes, and unchanged corpus boundary.
- [x] Add exact resolution provenance to the existing qualifying event.
- [x] Record the same-actor, same-subject follow-up at weight zero.
- [x] Prove every Protocol v2 progress value remains unchanged.
- [x] Run schema, arithmetic, regression, lint, and build checks.
- [ ] Publish through one clean pull request and read back live main.

### Verification

- `npm run validate:external`
- `npm run lint`
- `npm test`
- `npm run build:pages`
- `git diff --check`
- Live GitHub readback must remain 9 qualifying events, nine validators, six
  technical events, three catalog events, 49 initial contacts, zero follow-ups,
  one negative outcome, three closed lanes, and $0 settled revenue.

## in-toto Witness verifier invitation

### Goal

Advance the missing independent-verifier category with one tailored initial
invitation to a publicly listed in-toto Witness maintainer, while keeping the
invitation at zero weight unless a qualifying external action later occurs.

### Scope

- One initial email to Cole Kennedy using the public email on his GitHub
  profile and his listed maintainer role in `in-toto/witness`.
- One Protocol v2 outreach-denominator record with exact source relevance,
  message provenance, and a seven-day follow-up boundary.
- Focused regression coverage proving that campaign counts remain unchanged.

### Non-Goals

- Do not ask for endorsement, partnership, promotion, or a favorable result.
- Do not treat delivery, receipt, silence, thanks, or interest as evidence.
- Do not claim that Witness or in-toto validates, adopts, or is affiliated with
  VERITAS, PCF, or SSWP.
- Do not send a follow-up before the ledger-derived eligibility time unless the
  recipient responds or explicitly invites continued contact.
- Do not open another outreach lane during this campaign turn.

### Steps

- [x] Verify the live Protocol v2 ledger, Trust Lab issues, recorded GitHub
  lanes, and Gmail for new external actions.
- [x] Verify candidate relevance and public contact basis from current
  first-party GitHub records.
- [x] Prove exact Gmail and ledger deduplication before contact.
- [x] Send one tailored initial invitation and read it back from Gmail.
- [x] Record it once at weight zero and preserve every progress count.
- [x] Run ledger, regression, lint, build, diff, SSWP, and VERITAS checks.
- [ ] Publish through one clean pull request and read back live main.

### Verification

- Gmail readback must match the exact recipient, subject, body, sent time, and
  message ID.
- `npm run validate:external`
- `npm run lint`
- `npm test`
- `npm run build:pages`
- `git diff --check`
- Live main must remain at 9 qualifying events, 9 validators, 9 organizations,
  0 blind label sets, 6 technical events, 0 adopter reports, 0 hostile cases,
  0 verifier runs, 3 catalog events, and $0 settled revenue.

## OpenHands founding-pilot invitation

### Goal

Open one arms-length commercial lane with a technically matched agent team by
offering the published $750 founding pilot for one bounded OpenHands workflow.

### Scope

- One tailored initial email to the public `contact@all-hands.dev` address.
- One Protocol v2 outreach-denominator record and one commercial-proposal
  effort record, both at zero qualifying weight.
- Focused regression coverage proving that only the outreach denominator
  changes before any settled payment and completed delivery.

### Non-Goals

- Do not claim adoption, endorsement, affiliation, validation, or revenue.
- Do not request production credentials, secrets, or unrestricted access.
- Do not characterize this as certification, a comprehensive security audit,
  legal advice, compliance approval, or a security guarantee.
- Do not count delivery, receipt, interest, a call, or an unpaid agreement.
- Do not follow up before seven days unless the recipient responds or invites
  continued contact.
- Do not open another outreach lane during this campaign turn.

### Steps

- [x] Verify the live Protocol v2 baseline and absence of a new qualifying
  external action.
- [x] Verify OpenHands relevance from its public docs and GitHub organization.
- [x] Prove exact Gmail and ledger deduplication before contact.
- [x] Send one bounded $750 pilot invitation and read it back from Gmail.
- [x] Record the invitation once at zero weight and preserve every evidence
  and commercial outcome count.
- [x] Run ledger, regression, lint, build, diff, and VERITAS checks.
- [x] Run the governed SSWP witness after committing the exact patch.
- [ ] Publish through one clean pull request and read back live main.

### Verification

- Gmail readback must match the recipient, subject, body, sent time, and ID.
- `npm run validate:external`
- `npm run lint`
- `npm test`
- `npm run build:pages`
- `git diff --check`
- Live main must remain at 9 qualifying events, 9 validators, 9 organizations,
  0 blind label sets, 6 technical events, 0 adopter reports, 0 hostile cases,
  0 verifier runs, 3 catalog events, and $0 settled revenue; only initial
  outreach may rise from 50 to 51.

## Snyk Agent Scan hostile-case invitation

### Goal

Advance the missing hostile-case or blind-label categories through one
technically grounded invitation to a current Snyk Agent Scan contributor while
keeping the invitation at zero weight until a qualifying outside submission
is independently verified.

### Scope

- One initial email to Luca Beurer-Kellner using the public Snyk address in
  current `snyk/agent-scan` commit metadata.
- One Protocol v2 outreach-denominator record with current Agent Scan threat
  relevance, immutable contact provenance, and a seven-day follow-up boundary.
- Focused regression coverage proving only the outreach denominator changes.

### Non-Goals

- No endorsement, partnership, promotion, favorable result, vulnerability
  claim, reciprocal action, automatic hostile-case promotion, or campaign
  evidence count.
- Do not treat delivery, receipt, silence, interest, or thanks as evidence.
- Do not send a follow-up before seven days unless the recipient responds or
  explicitly invites continued contact.

### Steps

- [x] Verify current public Agent Scan relevance and contact provenance.
- [x] Prove exact canonical-ledger and Gmail deduplication.
- [x] Send one tailored invitation and read back the exact Gmail thread.
- [x] Record it once at zero weight and update the outreach snapshot.
- [x] Run validation, regression, lint, build, diff, VERITAS, and SSWP gates.
- [ ] Publish one clean PR and live-read merged canonical state.

### Verification

- Gmail thread `19fc05bf22622bd6` must match the exact recipient, subject,
  body, and `2026-08-02T02:44:39Z` send time.
- `npm run validate:external`
- `npm run lint`
- `npm test`
- `npm run build:pages`
- `git diff --check`
- Live main must remain at 9 qualifying events, 9 validators, 9 organizations,
  0 blind label sets, 6 technical events, 0 adopter reports, 0 hostile cases,
  0 verifier runs, 3 catalog events, and $0 settled revenue; only initial
  outreach may rise from 51 to 52.

### Local gate outcome

- `npm run validate:external`, lint, the production build, the Pages build,
  and all 59 Node tests passed; `git diff --check` was clean.
- Signed commit `aa064d426e46eae18c448d7c6aea128a2ee8cdc9` has a good
  signature from `VrtxOmega@pm.me` and changes only the three planned files.
- VERITAS ran all ten gates on the exact signed commit. All seven numeric
  boundaries passed, while the aggregate result correctly remained
  `INCONCLUSIVE` because the evidence is author-controlled; removing required
  receipts also produced `MODEL_BOUND` fragility rather than a false upgrade.
- The governed SSWP witness passed Git integrity, lockfile, deterministic
  build, tests, and lint for commit `aa064d42`, with Cortex `APPROVED` and
  attestation seal prefix `0380acebc239a764`.

## RCL follow-on impact and discovery response

### Goal

Answer the external repository owner's discovery-path question from the exact
preserved Codex session record, and strengthen the existing RCL technical event
with its verified downstream corpus impact without creating a duplicate event.

### Scope

- One public response on `msaleme/red-team-blue-team-agent-fabric#304` using
  the recovered GitHub repository-search query and inspection sequence.
- Same-actor follow-on metadata for merged PRs #310, #311, and #312.
- Focused regression coverage proving the lifecycle remains one qualifying
  event plus one zero-weight same-subject record.

### Non-Goals

- No new validation, verifier-run, adopter, endorsement, certification,
  partnership, payment, or execution-authority claim.
- Do not infer that portable fixture packaging caused the initial GitHub search
  result; distinguish search-driven discovery from design-driven selection.
- Do not count the author response or three same-owner follow-on PRs separately.

### Steps

- [x] Recover the exact repository-search query and original candidate output.
- [x] Verify the owner's new comment and merged PRs #310, #311, and #312.
- [x] Post and read back the exact discovery response.
- [x] Enrich the existing qualifying and zero-weight lifecycle records.
- [ ] Run JSON, regression, lint, build, diff, VERITAS, and SSWP gates.
- [ ] Publish one clean PR and live-read unchanged campaign counts.

### Verification

- Public response:
  `https://github.com/msaleme/red-team-blue-team-agent-fabric/issues/304#issuecomment-5159349132`.
- `npm run validate:external`
- `npm run lint`
- `npm test`
- `npm run build:pages`
- `git diff --check`
- Live main must remain at 9 qualifying events, 9 validators, 9 organizations,
  0 blind label sets, 6 technical events, 0 adopter reports, 0 hostile cases,
  0 verifier runs, 3 catalog events, 52 initial contacts, and $0 settled
  revenue.
