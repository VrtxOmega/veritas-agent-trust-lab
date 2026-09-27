# Dependency repair — 2026-09-27

Issue: [#85](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/85)

The lockfile audit captured on 2026-09-27 reported **9 vulnerability
entries: 8 high and 1 critical**. This was an npm advisory/lockfile
observation, not nine demonstrated visitor exploits.

## Repair

The repair intentionally does not use `npm audit fix --force`.

Direct/tooling pins moved as follows:

- `next`: 16.2.12 -> **16.3.6**
- `vinext`: 0.0.50 -> **0.2.1**
- `@vitejs/plugin-rsc`: 0.5.26 -> **0.5.35**
- `@cloudflare/vite-plugin`: 1.48.0 -> **1.61.0**
- `wrangler`: 4.115.0 -> **4.142.0**

`vinext@0.2.1` still pins `image-size@2.0.2`, which is inside the
published vulnerable range. The root therefore overrides only that
transitive package to **image-size 2.0.3**. This override is justified
by the registry advisory boundary and the project gates below; it is
not a general statement that arbitrary transitive overrides are safe.

A trial of `vinext@1.0.0-beta.13` was rejected: it introduced four
moderate audit entries and changed the server/runtime shape in a way
that broke the existing static Pages export. The selected 0.2.1 path
preserves the current deployment model after a small Pages asset-path
compatibility repair.

## Result

Against the repaired lockfile, `npm audit --package-lock-only --json`
reports **0 vulnerabilities** at the captured registry state.

Verification on Node 22:

- `npm ci`: PASS
- `npm run audit:security`: PASS
- lint: PASS
- full test suite: **110/110 PASS**
- GitHub Pages export: PASS
- selected dependency tree check: PASS

Raw before/after audit JSON and the installed dependency tree are stored
in [evidence/dependency-review-20260927](../evidence/dependency-review-20260927/).

Triage and verification run: https://github.com/VrtxOmega/veritas-agent-trust-lab/actions/runs/36327439522

## Persistent guard

Pull-request verification and the main-branch Pages deployment now run
`npm run audit:security` after `npm ci`. The script uses
`npm audit --package-lock-only --audit-level=high`: future high or
critical registry findings fail those workflows instead of remaining
an install-log warning.

This guard is registry-dependent and can become red without a source
change when a new advisory is published. That is intentional. A green
audit still does not prove that dependencies are bug-free or that every
advisory is exploitable in this application.

## Exposure boundary

The public GitHub Pages site remains a static export. Build/dev
dependencies still matter because untrusted repository changes can
exercise the build pipeline, but this repair does not convert registry
severity labels into claims of remote exploitability.

No campaign count, external-verification result, Trust Lab fixture,
assurance claim, or frozen protocol pin changed.
