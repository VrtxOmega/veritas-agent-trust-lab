# tolegm / AstraNL helper follow-up — 2026-09-27

Source: [issue #81 comment](https://github.com/VrtxOmega/veritas-agent-trust-lab/issues/81#issuecomment-5857086686)

This note preserves a small external, out-of-band probe of the helpers that were
introduced in Trust Lab PR #84. The reporter disclosed Claude (Anthropic)
execution for AstraNL, no human review before posting, and the same Claude-family
correlation already disclosed for #71.

This is **not** a rerun of Track 1, not a run of the repository test suite, not
a review of the whole PR, and not a new campaign event.

## What their probe confirmed

Against #84 head `1bc3218fe5165cec719c52c1bc0e25a0a62be4c0` on Node
v20.11.1, the reported freshness helper behavior matched the documented
`0 <= age <= TTL` boundary:

- age 10 s: fresh;
- age 10.001 s: rejected;
- age 0: fresh;
- 1 ms future timestamp: `HEARTBEAT_FUTURE`;
- invalid clock/TTL shapes failed closed;
- TTL 0 with age 0 remained fresh.

The declared-group helper also retained the intended fail-closed behavior for
zero-width input and sparse arrays, and normalized edge NBSP/fullwidth forms.

## Two useful follow-ups

### 1. Timestamp spelling compatibility

The first helper accepted only UTC timestamps written with `Z` and either no
fraction or exactly three fractional digits. That was fail-closed, but it could
reject a perfectly ordinary UTC monitor that serializes `+00:00`, tenths, or
microseconds.

The maintained helper now accepts a deliberately bounded UTC spelling set:

- `Z` or `+00:00`;
- seconds are required;
- optional fractional seconds may contain 1-9 digits;
- calendar overflow and leap-second-like `:60` values remain invalid;
- nonzero offsets and `-00:00` remain outside this UTC contract;
- sub-millisecond precision participates in age comparison instead of being
  silently truncated.

The security boundary is unchanged: a future timestamp still revokes, and no
future-clock tolerance is introduced.

### 2. Interior-space inflation in declared groups

The reporter found that `clau de` and `clau  de` were counted separately
after the first normalization repair.

The declared-label policy now collapses **runs** of interior ASCII spaces to one
space after NFKC normalization and trimming. It does **not** erase meaningful
single spaces: `clau de` and `claude` remain different declarations.

This closes the demonstrated cosmetic double-counting case while preserving the
larger #83 boundary: normalized labels are still self-declared labels. They do
not authenticate evaluator identity or prove independence.

## Empty group list

The external note also called out that an empty evaluator list returns zero
groups. The repository already pins that result explicitly, and the demonstrator
quorum decision requires at least two groups, so zero cannot satisfy the
fixture quorum. No behavior change was needed for that observation.

## Regression coverage

New regressions cover:

- one-digit, six-digit, and `+00:00` UTC timestamps;
- microsecond future detection;
- invalid leap-second/calendar/offset/overprecision forms;
- one-space vs two-space/NBSP-run declared labels;
- preservation of a meaningful single-space distinction.

The immutable v1 challenge source, Track 1 result, campaign count, and
`execution_authorized: false` boundary are unchanged.
