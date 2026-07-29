# Show HN: I built a blind lab for forged-looking AI agent decisions

I built the VERITAS Omega Agent Trust Lab to make one narrow problem tangible:
a well-formed agent verdict is not the same thing as an authentic, exact-bound,
still-valid decision.

The site gives you six packets—three clean and three tampered—and asks whether
you would allow the agent to continue before revealing the answers. The cases
cover result forgery, parameter swapping, replay, correlated evaluators,
evidence deletion, and missing telemetry.

Everything recomputes locally. There is no model call, signup, production
action, or hidden label collection. You can download your labels or explicitly
contribute them as a public GitHub issue.

The narrow claim: the synthetic fixtures deterministically fail closed. This
is not certification, an independent audit, or an execution engine.

I would especially value adversarial feedback: which case is too artificial,
and what should the seventh case be?

Demo: [LIVE_URL]

Source: https://github.com/VrtxOmega/veritas-agent-trust-lab
