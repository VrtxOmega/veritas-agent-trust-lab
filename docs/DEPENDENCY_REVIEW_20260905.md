# Dependency review — 2026-09-05

Scope: the Trust Lab lockfile at `e3acef0c7cdf3dada7141e2d3c381b09d107f307`,
following [the maintenance handoff](https://github.com/VrtxOmega/veritas/issues/4#issuecomment-5553362513).
The open repository issues/PRs were checked first; no existing dependency-fix
lane was found. The separate frozen Python Agent Gate and campaign evidence
counts are outside this change.

## Preserved observations

Using npm 10.9.4, `npm audit --package-lock-only --json` reproduced **16 package
entries: 1 low, 4 moderate, 11 high** at 17:04 UTC. These resolve to 29 distinct
advisory URLs, with repeated version ranges and parent-package propagation;
neither number is a count of exploitable application flaws.

- [Original audit JSON](../evidence/dependency-review-20260905/npm-audit-before.json)
- [Audit after the targeted update](../evidence/dependency-review-20260905/npm-audit-after.json), captured at 17:08 UTC: **9 entries, 3 moderate / 6 high**.
- [Before/after bundle module inventory and lockfile hashes](../evidence/dependency-review-20260905/bundle-modules.json)

The audit is a registry observation at those times, not a permanent assertion
about future advisories. `npm audit` exits nonzero while listed findings remain.

## What visitors receive

The [Pages workflow](../.github/workflows/deploy-pages.yml) uploads only
`build/github-pages`. The [export script](../scripts/build-github-pages.mjs)
copies `dist/client` and invokes the built worker locally to produce HTML;
it does not deploy `dist/server` or `node_modules` to Pages. The browser runs
React/Vinext client code and the Trust Lab's own JavaScript. Package manifest
`dependencies` versus `devDependencies` is not the exposure test.

For the baseline and updated build, a temporary Vite `generateBundle` hook
recorded each emitted chunk's `modules` keys in the client, RSC worker, and SSR
environments. There were 60, 131, and 52 module entries respectively, with
unchanged module sets. Of the 16 audit package names, only **vinext** occurs in
these inventories; its propagated audit finding is in **image-size**, which
does not occur. None of the advisory-bearing libraries below appears in these
emitted module graphs. This is evidence about the tested build, not an exploit
test or a blanket safety claim. Build plugins and their inputs still matter.

There is also a separately published Sites surface referenced by
`.openai/hosting.json`; readback showed an active site with custom access.
This review did not verify that deployment's source revision or replace it.
The repository's [worker entry](../worker/index.ts) routes image transforms
through the platform's `IMAGES` binding. Do not extend the static Pages exposure
conclusion to an uninspected Sites version or a differently configured Node server.

## Package paths, conditions, and disposition

All advisory IDs, affected ranges, severity labels, and installed node paths
are preserved in the audit JSON. The representative links below explain the
conditions relevant to this checkout; lack of an observed visitor path does
not invalidate the underlying advisories.

| Audit package(s) and baseline version | Dependency path / relevant input | Assessment and action |
|---|---|---|
| `@babel/core` 7.29.0 — low | `eslint-config-next → eslint-plugin-react-hooks → @babel/core`; repository source/source-map comments | Lint/build-tool exposure, no emitted module. Compatible update to 7.29.7 and its required Babel dependency closure. [File-read advisory](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8). |
| `brace-expansion` 1.1.14 and 5.0.6 — high | ESLint/minimatch and TypeScript-ESLint/minimatch; glob patterns | Build/lint resource-exhaustion risk, no visitor-supplied glob path found. Update within each existing range to 1.1.18 / 5.0.9. [Advisory](https://github.com/advisories/GHSA-rgw5-rvv9-x895). |
| `browserslist` 4.28.2 — high | Babel compilation targets and webpack; target queries/custom stats | Build configuration, no public query/stats endpoint. Update to 4.28.9 plus compatible browser-data dependencies. [Cache growth](https://github.com/advisories/GHSA-c83g-rgw3-j3cx), [custom stats](https://github.com/advisories/GHSA-73wf-gq98-2v4g). |
| `fast-uri` 3.1.2 — high | `webpack → schema-utils → Ajv 8`; schema URI resolution | Tool-side URI parsing, not the site's authorization or URL policy. No emitted module. Update to 3.1.7. [Normalization advisory](https://github.com/advisories/GHSA-f65p-4m7j-42xc). |
| `fflate` 0.7.4 — moderate | `vinext → @vercel/og → satori → @shuding/opentype.js`; font parsing dependency | No emitted module or public ZIP intake found. Malformed ZIP64 input can hang `unzipSync`; update within `^0.7.3` to 0.7.5. This is dependency hygiene, not a reproduced font-path exploit. [Advisory](https://github.com/advisories/GHSA-px8p-9vwx-vf98). |
| `js-yaml` 4.1.1 — high | `eslint → @eslint/eslintrc`; YAML configuration | Lint/config input, no visitor YAML parser. Update to 4.3.2 within `^4.1.1`. [Merge/omap CPU advisory](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj). |
| `nanoid` 3.3.16 — high | PostCSS ID generation | Advisory requires a zero-size custom generator; no such application call or emitted module found. Compatible update to 3.3.18. [Advisory](https://github.com/advisories/GHSA-2v37-7h3g-55p8). |
| `next` 16.2.12, nested `postcss` 8.4.31, `sharp` 0.34.5 — high | Next pins PostCSS and optionally installs Sharp `^0.34.5` | Three propagated entries, not three proven visitor flaws. Actual Vinext/Vite CSS build uses root PostCSS 8.5.24; the affected nested copy and Sharp are absent from emitted graphs. Next's pinned tree needs a coordinated parent update (audit suggests Next 16.3.4), not a silent override. Deferred. [PostCSS file read](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [libvips advisory](https://github.com/advisories/GHSA-f88m-g3jw-g9cj). |
| `@cloudflare/vite-plugin` 1.48.0, `wrangler` 4.115.0, `miniflare` 4.20260722.1 — moderate; `undici` 7.28.0 — high | Plugin/Wrangler pin Miniflare, which pins Undici 7.28.0 | Local development/emulation HTTP behavior; no emitted library. Cache/retry/header vulnerabilities depend on exercised Undici features and attacker-controlled traffic. A blanket unexploitable claim is unwarranted. Audit suggests plugin 1.54.4, but direct Wrangler and pinned Miniflare must be reconciled together; deferred from this lock-only fix. [Cache advisory](https://github.com/advisories/GHSA-4cwx-7wf7-3272). |
| `vinext` 0.0.50, `image-size` 2.0.2 — high | Vinext pins image-size; static image import and metadata dimension extraction read repository image buffers | Crafted image input can hang build-time parsing. Inspected image-size call sites are in `vinext/dist/index.js` and `server/metadata-route-build-data.js`, absent from emitted graphs. No patched image-size release is listed; npm suggests `vinext@1.0.0-beta.9`, a major/prerelease migration. Deferred, not marked fixed. [ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [JXL/HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq). |

Build inputs can be contributed through PRs, so “build-only” does not mean
irrelevant. The existing PR workflow has read-only repository permissions;
Pages deployment is a separate main-branch job. This review does not demonstrate
an exploit or assess every transitive library API/configuration.

## Minimal proposed fix and remaining work

The lockfile refresh targets only seven advisory-bearing package names within
already-declared dependency ranges:

```sh
npm update @babel/core brace-expansion browserslist fast-uri fflate js-yaml nanoid --package-lock-only --ignore-scripts --no-audit --no-fund
```

It updates 28 installed package records including the compatible Babel and
Browserslist dependency closures. No direct version pin, override, script,
application code, hosting configuration, specimen, or ledger is changed.
`npm audit fix --force` was not used. Seven package entries disappear; **nine
remain explicitly unresolved**. Reducing the counter to zero would require
broader parent upgrades or overrides that this assessment does not justify
bundling into the narrow patch.

Reconsider those parent updates with their release/API compatibility checks
before expanding image input, server hosting, or development-server access.
Do not infer that a non-Pages deployment is fixed by merging a GitHub lockfile.

## Verification

Baseline and updated dependency installs used `npm ci`; both instrumented builds
and Pages exports succeeded. The inventory hook was removed after collection
and is not part of this change. The review environment used Node 24.19.0/npm
10.9.4 on Windows, with repository LF bytes retained. The existing PR CI uses
Node 22 and must pass on the final proposed head before merge.

Local checks passed: lint, build, all 77 existing tests (zero failed/skipped),
Pages export, the existing ledger verifier, and `git diff --check`. The diff
confirms that the package manifest and campaign records are unchanged; the
separate Agent Gate repository is untouched. Audit success is not substituted
for those checks, and green tests do not resolve the nine remaining audit entries.
