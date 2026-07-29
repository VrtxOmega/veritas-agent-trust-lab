# VERITAS Omega Agent Trust Lab

> **A verdict is not authority.**

A zero-signup public reference demonstrator for the assurance boundary between
an AI-agent evaluation and a consequential action.

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

## Contribute evidence

- Take the blind challenge without reading the source.
- Download the local label record, or explicitly submit the generated public
  GitHub issue after reading its consent boundary.
- Propose a seventh falsifiable case through the issue form.

GitHub participation is public and attached to the participant's GitHub
identity. The lab itself has no analytics or hidden label collection.

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
