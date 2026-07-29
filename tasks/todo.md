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
