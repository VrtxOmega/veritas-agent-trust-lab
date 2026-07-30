# Lessons

## External evidence must be a product mechanic

**Mistake pattern:** A polished public demonstrator can still preserve the same
author-only assurance loop if visitors only watch the author's fixtures and
verdicts.

**Prevention rule:** Every public VERITAS experiment must include a low-friction
way for outside users to make a blinded judgment before reveal, export their
labels, and voluntarily contribute inspectable evidence with explicit consent.
Never upgrade deployment or traffic into independent calibration.

## Canonical ledger snapshots must move with zero-weight lanes

**Mistake pattern:** The standalone ledger validator passed after adding a
zero-weight open lane, but the full test suite still expected the previous
hard-coded open-lane count.

**Prevention rule:** Every open-lane addition or removal must update and run
the canonical public-ledger snapshot test in the same change. `validate:external`
alone proves arithmetic and schema, not that all checked-in campaign
expectations were updated.
