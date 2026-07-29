# PCF preflight

Profile: `kernel-grade`

Result: `NOT READY` (`low-review-value`, score `0/100`)

The exact staged first-product release touched 29 files and 17,252 changed
lines, including a regenerated dependency lockfile and deletion of the Sites
starter. PCF estimated an excessive upstream-maintainer review budget and
correctly rejected the patch as an external kernel-style submission.

## Blocking findings

- reviewable scope;
- human DCO sign-off;
- stable-tree discipline;
- maintainer review budget.

It also requested stronger before/after evidence, CI, dependency rationale,
maintainer targeting, tool provenance, and patch-series structure.

## Applicability decision

This patch creates an owner-controlled public repository from a generated
starter. It is not being sent to an external maintainer, requested for a stable
tree, or represented as a review-ready upstream change. PCF therefore remains
a negative advisory signal rather than independent release validation.

Proceeding with the owner-controlled repository does not convert this result to
`PASS`. Any later contribution to a third-party directory or codebase must be
created as a separate, minimal branch and pass its own repository-aware PCF
preflight before submission.

The full machine-readable output from the local run is intentionally not
treated as a public credential. Its relevant findings are preserved here.
