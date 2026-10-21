---
'@nocobase/app-plugin-demo-mode': minor
---

Add a reusable Demo Mode plugin for dedicated demo deployments with isolated business data and storage.

Provide request-scoped read-only database protection, permission-gated data import/clear/reset and CLI commands, one application-owned full-business cleanup contract, retryable import recovery, reusable disabled demo accounts, and relative-date fixtures with deterministic daily variation.

Provision a persistent OpenAI-compatible demo model at environment startup. Data clear/reset never removes it or restores another model. Provide environment-wide application-owned Demo Agent proxies; disabled simulations fail closed. Require the current Agents API instead of supporting legacy service interfaces.

Expose revision-safe write-rule and simulation configuration plus one persisted daily reset schedule. Applications retain responsibility for business authorization, external-call isolation, data adapters and management pages. Publish an application integration Skill covering those boundaries, verification and migration from earlier development snapshots.
