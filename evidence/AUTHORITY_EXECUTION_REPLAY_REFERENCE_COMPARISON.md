# Authority-to-Execution Replay Reference Comparison

**Result:** DIVERGENCE_FOUND

## Independence freeze

The separate verifier, tests, and pre-reference report were frozen before the
upstream reference verifier was read or executed.

- Freeze commit: `d232be9e0b0680acf49c2e2e9516e08102df3c52`
- Commit signature: good signature from `Rage Lopez <VrtxOmega@pm.me>`
- Separate verifier SHA-256:
  `2bff98daf6a8417a66b4833b77882cbec9fd6c714042b3be39bc129cd8ee705c`
- Separate tests SHA-256:
  `ecbbf2921e2eb4e03caa4f1b5ca28d48aeac443c80d64c07226bc801c9f01845`
- Pre-reference report SHA-256:
  `40b1adeb5da4d72570628e462baf672335405e1fda126cc7ae9e25bfca0bf075`

The frozen result was `PASS_WITH_LIMITS`: 3/3 declared scenario records
reproduced, 6/6 independently interpreted tamper classes detected, and
`execution_authorized: false`.

## Reference baseline

After the freeze, the pinned reference verifier was inspected and run.

- Reference verifier SHA-256:
  `4f4e30e058436ad2eac9295634f225bbc070b8e7acb738b41c8b67f1160c56e0`
- Reference replay result: `PASS: 3 synthetic scenarios verified`
- Upstream unit suite: 66/66 passed

Both implementations accept the pinned packet's three recorded scenarios. The
separate implementation nevertheless retains a material limitation: the
wrong-target decision is not independently derivable from a supplied policy
artifact. In that scenario, `authorized_action` and
`delegated_authority.action_digest` both equal the attempted customer-002
action. Both implementations therefore recognize the deny by a declared
scenario-to-policy mapping rather than by evaluating a machine-readable target
policy.

## Tamper interpretation difference

The handoff calls one regression `production-scope widening`. Before reveal,
the separate suite interpreted this as widening the packet's top-level
`scope`; the upstream test changes `human_sponsorship.scope` to `production`.
The frozen verifier rejects both forms:

- top-level widening: `PACKET_SCOPE_WIDENED`
- sponsorship widening: `SPONSORSHIP_SCOPE_WIDENED`

This difference did not require a post-reveal verifier change.

## Reference fail-open probes

Each probe below changed one semantic part of the parsed packet and then ran
the pinned `verify_replay_packet.py`. These probes deliberately omitted the
outer packet hash so they test the reference verifier's semantic contract, as
the upstream mutation tests do.

| Probe | Reference result | Frozen verifier result |
|---|---|---|
| Replace all three scenarios with the valid allow control | PASS | FAIL — `DUPLICATE_CONTROL_ID`, `REQUIRED_CONTROLS_MISSING` |
| Replace allow `authorized_action` with 64 zeroes | PASS | FAIL — `AUTHORIZED_ACTION_BINDING_MISMATCH` |
| Flip allow `expected.occurred` to `false` | PASS | FAIL — `EXPECTED_OCCURRENCE_MISMATCH` |
| Widen top-level `scope` to include production | PASS | FAIL — `PACKET_SCOPE_WIDENED` |
| Replace `claim_boundary` with `production evidence` | PASS | FAIL — `CLAIM_BOUNDARY_CHANGED` |
| Substitute allow `delegated_authority.fixture_id` | PASS | FAIL — `FIXTURE_ID_UNDECLARED`, `PROFILE_AUTHORITY_MISMATCH` |

The duplicate-control probe is the clearest contract defect. The reference
checks only that the scenario array has length three; it does not require one
instance of each manifest control. Three copies of the allow control therefore
produce the success message claiming all three controls were verified even
though neither deny control was present. This is the same pass-for-the-wrong-
reason class that positive controls are meant to prevent.

The remaining probes show fields carried as part of the packet contract but
not checked by the reference verifier. `authorized_action`, `expected`, the
top-level scope, and the claim boundary are ignored. The delegated authority is
used for its action digest but is not required to equal the authorization in
the validated profile record.

## Outer-integrity distinction

The published packet SHA-256 and repository commit still provide a valid outer
integrity pin. A caller that independently checks that digest before replay
will reject every byte mutation above. The pinned reference command itself
does not verify the advertised packet SHA-256 or read the manifest, however,
and its own unit tests mutate parsed packets specifically to exercise semantic
controls. These findings are therefore about incomplete semantic verification,
not a collision or failure of SHA-256.

## Boundary

This comparison concerns one synthetic, owned-fixture, networkless packet and
the pinned reference verifier only. It is not evidence about live MCP/API
execution, production enforcement, external identity, or security of a real
system. It is not certification, endorsement, adoption, or validation of
either project, and it authorizes no execution.
