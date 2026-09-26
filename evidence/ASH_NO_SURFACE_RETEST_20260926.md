# External retest: Agent Security Harness v4.26.0 nine-pole no-surface guard

**Date:** 2026-09-26  
**Upstream issue:** https://github.com/msaleme/red-team-blue-team-agent-fabric/issues/622  
**Evidence class:** external execution of the published harness against independently implemented local targets and an independently implemented result parser. This remains I0 for the upstream harness; it is not an independent implementation or certification.

## Artifact identity

- Release: `agent-security-harness==4.26.0`
- Tag/release commit: `v4.26.0` / `1944cbc580775498086f44e1bcc8bc4e69f7e488`
- Wheel SHA-256: `7a2d1346d1c895a98a89ec1f3ada887dfbdbf05937ff3a5ad7168be6142dac2d`
- Publish-workflow dist artifact SHA-256: `9b350075d3473b6f493bdfd9eb3f7d126031668a78a4cc25db3fd9fd0a9954ed`
- Local aggregate summary SHA-256: `4621683840302283ce386a3c4c71c02a8f256b179fd58a6a972f6b0048dffbee`
- Runtime: Python 3.13.5 on Linux x86_64

The wheel digest matched the upstream v4.26.0 release asset before installation.

## Method

The same independent target shapes and report-classification rules used for the v4.25.0 reproduction were rerun against the exact v4.26.0 wheel.

Nine target poles were exercised across 65 concrete CLI invocations per pole:

1. closed port
2. 404-everywhere
3. bare 403
4. bare 401
5. TLS failure against a plaintext listener
6. same-location 302 redirect loop
7. bare empty 500
8. empty 200
9. empty 204

Informational rows were kept separate from verdict-bearing rows. The three documented local self-tests (CREW-002, CVE-007, CVE-008) were retained but not treated as target verdicts.

## Result

| Pole | PASS | FAIL | INCONCLUSIVE | Informational | Target PASS/FAIL beyond declared contract |
| --- | ---: | ---: | ---: | ---: | ---: |
| closed | 3 | 0 | 605 | 6 | 0 |
| 404 | 3 | 1 | 604 | 6 | 0 |
| bare 403 | 3 | 0 | 605 | 6 | 0 |
| bare 401 | 3 | 0 | 605 | 6 | 0 |
| TLS failure | 3 | 0 | 605 | 6 | 0 |
| redirect loop | 3 | 0 | 605 | 6 | 0 |
| empty 500 | 3 | 0 | 605 | 6 | 0 |
| empty 200 | 3 | 2 | 603 | 6 | 0 |
| empty 204 | 3 | 2 | 603 | 6 | 0 |

The non-INCONCLUSIVE rows are exactly the upstream-declared exceptions:

- A2A-001 FAIL on the 404 pole.
- X4-001 and L4-001 FAIL on empty 200/204 because the unpaid resource was served without the required 402 payment challenge.
- CREW-002, CVE-007 and CVE-008 are local self-tests and PASS independently of the target.

There were **no unexpected target-dependent PASS or FAIL verdicts** and no timed-out harness invocations.

## Conclusion

The v4.26.0 release independently reproduces the claimed repair for all four contentless shapes found in #622 while preserving the earlier three poles and the clean 401/TLS controls.

The practical change from v4.25.0 is substantial:

- redirect loop: 45 non-self target verdicts -> 0 unexpected verdicts
- empty 500: 35 -> 0
- empty 200: 134 -> only the two pinned payment-challenge failures
- empty 204: 144 -> only the two pinned payment-challenge failures

This retest does not establish effectiveness against real deployments or correctness outside these nine target shapes. It establishes only the observed verdict semantics of the published v4.26.0 package under this reproduction.
