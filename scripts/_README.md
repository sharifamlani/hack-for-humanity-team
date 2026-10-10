# scripts/

Any command that gets run more than once lives here as a script, not as a line retyped into
a terminal. Multi-step or multi-file operations (data pulls, verification passes, builds,
deploys) are always scripts.

Conventions:
- Idempotent where possible.
- Real arguments, not hardcoded local paths.
- Print what was done; exit non-zero on failure.
- Any script that produces artifacts is paired with a verification script that asserts those
  artifacts exist and are well-formed. "It printed success" is not proof.

Empty until the build day — the first scripts will likely be a data-source fetch and its
verification counterpart.
