# Generalized quorum follow-on — 2026-09-05

## Status

**Recorded at zero additional Protocol v2 weight.** This is follow-on impact from the already-counted `github:msaleme` substantive review lifecycle, not a new validator, organization, hostile run, verifier run, adoption event, endorsement, certification, or payment.

## Immutable source

GitHub issue comment `5552124181` on `msaleme/red-team-blue-team-agent-fabric#304`.

## What the external owner reported

The external repository owner applied the previously identified principle — a required-control count must require distinct identities and bindings rather than cardinality alone — back across their own published catalog and found a second instance of the same defect shape in `FB-013`, **Approval Quorum Above Threshold**.

The owner states that the old test asserted above-threshold routing to `require_approval` but did not contain an approver set or an approval artifact bound to the evaluated action. The replacement is reported to make four properties independently falsifiable:

1. above-threshold routing;
2. two distinct approvals bound to the action satisfy quorum;
3. the same approver twice does not satisfy quorum;
4. an approval bound to a different action does not count.

The owner further states that action binding is checked per destination, amount, and nonce, and that the regression injects a counting-only quorum implementation and requires `FB-013` to fail against it. The comment explicitly attributes the positive-control requirement to the VERITAS-side **acceptance-control principle**: proving rejection alone is insufficient if the intended control is also supposed to admit a legitimate case.

The same comment identifies neighboring published controls (`FB-014`, `DSET-007`, `MCP-RC-005`) while explicitly declining to claim packet-to-manifest consistency from them.

## Prospective Agent Gate evaluation

The owner states an intention to point their harness at the VERITAS Agent Gate demonstrator when it is available and return what it finds, including a clean run. This is recorded only as a **prospective external evaluation commitment**. It does not satisfy the campaign's independent hostile-case or independent-verifier minima unless and until an outside run actually occurs and its evidence is preserved under the protocol.

The methodological boundary is useful but non-counting: a clean result from an instrument demonstrably capable of failing is still a result. The Agent Gate demonstrator therefore exposes both positive acceptance controls and deliberately falsifiable negative cases.

## Counting boundary

Current campaign totals remain unchanged at 11/50 qualifying events, 8/10 technical events, 10 distinct validators, 10 unrelated organization/community families, 0/5 independently proposed or executed hostile cases, 0/3 independent verifier runs/cross-evaluations/compatible implementations, and $0 settled revenue.

`msaleme` has already reached the Protocol v2 individual cap of two counted events. This follow-on is linked to the existing counted lifecycle and has `count_weight: 0` regardless of its technical value.
