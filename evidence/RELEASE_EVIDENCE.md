# VERITAS Omega Agent Trust Lab — local release evidence

Evidence date: 2026-07-28

## Verified

- `npm run lint`: passed with no warnings.
- `npm test`: 14 tests passed, 0 failed.
- The test command includes a production build before Node tests.
- Six hostile fixtures block or revoke.
- Six clean fixtures pass their declared local boundary.
- The blind challenge contains exactly three clean and three tampered fixtures.
- Every result fixes `execution_authorized` to `false`.
- `git diff --check`: passed.
- `public/og.png` is a 1200x630 PNG with SHA-256
  `d01fdcd48f585fca3c912d7a0cc2bcd4c38376b76f467c882b5c769c8b31b4da`.

## VERITAS gate

The pre-build product-thesis gate returned `INCONCLUSIVE`, not `PASS`.

- All five declared mathematical boundaries passed.
- Evidence independence remained insufficient because the release evidence was
  produced and evaluated author-side.
- The adversary result was `MODEL_BOUND`.
- Removing either the primary research or the non-execution evidence created
  high fragility.
- Seal:
  `8f50df0eb1509a423f85d42112405d253beaaf6f35719a3d507902b2a999be6a`.

This is the exact reason the product includes blinded third-party labels and an
explicit public contribution route. Deployment alone will not upgrade the
gate.

## Dependency audit residual

After removing unused packages and updating the framework/toolchain, `npm audit`
still reports seven transitive findings across the full development tree:
one low and six high. `npm audit --omit=dev` reports three high findings.

The remaining reports are in framework or build-tool dependency chains. A
forced audit rewrite proposed incompatible dependency changes and was not
applied. This release does not describe those advisories as fixed, irrelevant,
or externally reviewed.

## PCF preflight

PCF's `kernel-grade` profile returned `NOT READY` for the exact staged initial
release. It treated the 29-file product launch as an external patch series and
rejected its review scope, DCO state, stable-tree metadata, and estimated
maintainer review budget. The complete applicability decision is recorded in
`evidence/PCF_PREFLIGHT.md`.

The source repository is owner-controlled, so this does not route work into an
external maintainer queue. The negative PCF result is preserved and will not be
presented as a release pass. Any third-party listing contribution will be a
separate, minimal, repository-aware patch.

## Manual-browser limitation

The exact GitHub Pages artifact passed local HTTP readbacks for its HTML and
interactive JavaScript assets. The in-app browser transport returned
`Transport closed` during setup, so no manual browser-interaction claim is made
for the pre-publication artifact. The public deployment requires live asset,
metadata, and interaction readbacks before it can be called launched.

## Public deployment readback

GitHub Actions run `30416123606` completed successfully after rerunning lint,
the production build, 14 tests, the Pages export, artifact upload, and public
deployment.

Live HTTPS readbacks confirmed:

- `https://vrtxomega.github.io/veritas-agent-trust-lab/` returned `200`;
- the page contains the finished title and blind-challenge entry point;
- the client-side trust-lab JavaScript asset returned `200`;
- the public verification packet reports `PASSED`, 14 tests,
  `execution_authorized: false`, and VERITAS `INCONCLUSIVE`;
- `og.png` returned as a 1200x630 PNG with the locally recorded SHA-256;
- the page exposes the absolute canonical URL and social image URL.

This verifies public availability, not independent adoption.

## Public-claim boundary

This evidence supports a deterministic public reference demonstrator. It does
not establish production enforcement, independent calibration, certification,
regulatory compliance, factual truth from signatures, adoption, or revenue.
