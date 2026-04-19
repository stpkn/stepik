# Feature Modules

Each feature is isolated and owns its internal logic.

Rules:
- Cross-feature imports are forbidden.
- Feature can import only from its own folder and `packages/`.
- Expose feature contracts through `public-api.md`.
