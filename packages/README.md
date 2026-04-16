# Shared Packages

This directory contains reusable modules for monorepo usage.

Rules:
- Packages must expose a stable public API from `src/`.
- Feature modules can import only package public APIs.
- No package may import from `features/`.
