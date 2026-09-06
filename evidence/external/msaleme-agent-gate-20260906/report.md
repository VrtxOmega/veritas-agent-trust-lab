Second evaluation, recorded as its own result. It does not amend the first: that report
stands against `256daeb85dae7ac004ae9893df858f58c87ec523` and is unchanged.

**Date:** 2026-09-06 · **Targets:** frozen `256daeb85dae7ac004ae9893df858f58c87ec523` and
repaired `92f7d9310d102a42941e55131ee869a04651590a` · **Evaluator kit:** `92f7d9310d102a42941e55131ee869a04651590a` — the same repository revision as
the repaired target, recorded separately here because it serves a separate evidentiary role ·
**Method:** two separate clean checkouts, Python 3.12, identity verified before and after on
each · **Class:** external, author-run; not independent validation of VERITAS.

**Your prediction about the original probe held.** The unchanged 18-case probe reports the
same 17 matches and the same float-related `ValueError` on both revisions. It remains a valid
test of the documented contract; it simply does not test the ticket-lifecycle defect examined
here, which is why the narrow sequence below is separate rather than folded into it.

**The narrow lifecycle differential you specified.**

| | acceptance control | malformed recheck | original-action retry |
|---|---|---|---|
| frozen `256daeb8` | allowed | raises `ValueError` | **ALLOWED** |
| repaired `92f7d931` | allowed | raises `ValueError` | **DENIED** — *approval ticket replay detected* |

For each revision, using its own gate instance and replay store, I first ran a valid
issue-and-recheck acceptance control with a freshly issued ticket. For the lifecycle
differential I issued a second valid ticket, rechecked a malformed action carrying a float so
canonicalization raised, then retried the **original, unmodified** action with that second
ticket.
On the repaired commit the malformed attempt raises as before, but the ticket is treated as
consumed and the retry is refused. Having read the diff rather than inferring it: the digest
call is wrapped, an intact ticket is consumed through the configured replay store, and the
error is re-raised — including on store failure, so an exception is never an allow. That last
clause covers the third condition you named, which I flagged as untested in my review; I have
now read it, but I still have not exercised a mid-commit store failure.

**The acceptance control passes on both**, and it is doing real work. A gate that refused
every recheck would also deny the final retry, so that denial on its own would establish
nothing. I ran the control first for that reason, and a failure of it would have been an
instrument problem to fix on my side rather than a result to attribute to you.

**I also ran your evaluator kit as an outside party, from a fresh clone.**
`validate_evaluation_package.py` reports the package valid; `pytest evaluation/` gives 11
passed and 18 subtests passed; and `reproduce_msaleme_20260905.py` produces the expected
differential on both specimens — `SHADOW_ALLOW` on the frozen commit, `DENY` on the repair,
across **both** the in-memory and file-backed replay stores. My own probe only exercised the
default store, so the evaluator-kit reproduction covers more than my standalone probe did. The runs against both specimens also report
*"both deliberate wrong verdicts detected."*

```
python evaluation/reproduce_msaleme_20260905.py --specimen <frozen> \
  --expected-commit 256daeb85dae7ac004ae9893df858f58c87ec523 --expected-float-retry SHADOW_ALLOW
python evaluation/reproduce_msaleme_20260905.py --specimen <repaired> \
  --expected-commit 92f7d9310d102a42941e55131ee869a04651590a --expected-float-retry DENY
```

**On the kit PR — I am withdrawing the offer, because you have already built it.** The two
things I proposed to add are present and are better than what I would have sent. The
non-execution boundary is asserted at issuance, recheck, replay and retry rather than once.
The calibration covers both poles: a mutant that accepts everything and a mutant that refuses
everything, each required to produce a MISMATCH. And the separation is enforced rather than
described — my report is hash-pinned, the probe is extracted and verified before execution,
and the calibration is labelled as project-side and absent from the original. Adding a commit
now would put my name on work you did. I would rather record that an outsider cloned the kit
and it ran clean, which is a fact you can cite; another commit from me is not.

**What this establishes, stated narrowly.** The defect reproduces in this external run on the
frozen specimen, and the repaired revision produces the intended result against the specific
sequence that exercised it. It does not establish that the ticket lifecycle is correct under
concurrency, that every canonicalization error takes this path, or that a storage backend
failing mid-commit behaves as the code intends. I did not reproduce the 42 project-side tests
and am not representing this as covering them. Floats still raise on both revisions; nothing
here says that should change.
