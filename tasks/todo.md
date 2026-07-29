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
- Every public claim is traceable to local code, tests, or primary-source
  market research and retains explicit nonclaims.
- A source repository, tagged release, production URL, portfolio/profile link,
  and launch-ready social/Show HN copy exist and are read back after writing.
- A paid pilot call-to-action names concrete deliverables, boundaries, price,
  and contact route without implying certification or independent audit.

### Scope

- New `veritas-agent-trust-lab` site and public-safe source repository.
- Browser-side deterministic challenge engine and six fixed attack cases.
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
- [ ] Gate the selected product thesis through VERITAS.
- [ ] Implement the lab, fixed cases, testable decision engine, and paid pilot
  boundary.
- [ ] Build the social preview and public verification packet.
- [ ] Run automated, hostile, accessibility, content, and release checks.
- [ ] Create the public source repository and release through one focused
  publication path.
- [ ] Deploy the production site and verify live behavior and artifacts.
- [ ] Integrate the live proof into the existing portfolio/profile.
- [ ] Activate the strongest available authenticated distribution surface and
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
