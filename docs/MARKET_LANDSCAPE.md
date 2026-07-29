# Market and GitHub landscape

Snapshot date: 2026-07-28. Counts are live GitHub readbacks and will drift.

## Decision

Do not position this project as another agent gateway, firewall, sandbox, or
generic governance OS. Those categories already include well-funded or
high-visibility projects.

Position the public wedge as:

> A blind, interactive calibration lab for the proof boundary between agent
> evaluation and action: complete recomputation, exact action binding, replay
> rejection, evaluator-dependence accounting, evidence-set integrity, and
> fail-closed monitoring.

## Closest current public projects

| Project | Live snapshot | What it demonstrates | Why this lab stays narrower |
| --- | ---: | --- | --- |
| `microsoft/agent-governance-toolkit` | 5,216 stars / 833 forks | policy, zero-trust identity, sandboxing, reliability, OWASP coverage | VERITAS is not a replacement runtime |
| `luckyPipewrench/pipelock` | 785 / 89 | mediated egress security, signed action receipts, playground and public benchmark | this lab focuses on evaluator/result authenticity and lifecycle reasoning |
| `Brain0-ai/brain0` | 398 / 13 | passive coding-agent intent/provenance graph and risk | this lab does not ingest private transcripts |
| `veritasfuji-japan/veritas_os` | 34 / 1 | decision governance, bind boundary, approvals, evidence chains | naming collision requires the distinctive `VERITAS Omega` identity |
| `opena2a-org/oasb` | 7 / 1 | 222 product-agnostic agent attack scenarios | this lab is a human calibration funnel, not a broad model benchmark |

## Adoption mechanics observed

The strongest adjacent launches minimize time-to-proof:

- a live no-account playground;
- one-command or in-browser demonstration;
- a public, reproducible benchmark;
- downloadable evidence rather than dashboard-only claims;
- an obvious contribution path;
- an explicit free/open surface next to a bounded paid offer.

The blind challenge and public calibration contribution route implement those
mechanics without claiming that deployment equals adoption.

## Primary standards and platform context

- NIST's AI Agent Standards Initiative prioritizes agent identity,
  authorization, security evaluation, and interoperability.
- OpenAI documents sandboxing, approvals, network controls, identity, and
  telemetry as complementary Codex safety layers.
- Microsoft's open trust stack combines policy-driven evaluation with runtime
  controls.
- OPA explicitly separates policy decision-making from enforcement.
- Product Hunt requires a live, useful product rather than a report or
  waitlist.
- Show HN requires something people can run and interact with, without signup.

## Negative evidence

- A PCF serious-scout run against current open `bug` issues in Microsoft's
  Agent Governance Toolkit returned `NO_ACTION`: assigned issues, overlapping
  PRs, maintainer ownership, design/documentation scope, or insufficient
  reproduction evidence blocked all candidates.
- A visible bounty-radar item was stale: its GitHub issue was already closed
  and multiple PRs overlapped it.

Those results reject speculative bounty chasing and attention-seeking upstream
work for this launch.
