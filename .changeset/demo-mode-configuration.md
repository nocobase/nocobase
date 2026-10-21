---
'@nocobase/app-plugin-demo-mode': minor
---

Add a reusable Demo Mode plugin for dedicated demo deployments with isolated business data and storage.

Provide request-scoped read-only database protection, permission-gated data import/clear/reset and CLI commands, one application-owned full-business cleanup contract, retryable import recovery, reusable disabled demo accounts, and relative-date fixtures with deterministic daily variation.

Provision a persistent OpenAI-compatible demo model at environment startup. Data clear/reset never removes it or restores another model. Provide environment-wide application-owned Demo Agent proxies; disabled simulations fail closed. Use the current Agents model services by default and allow an explicit host model-services adapter without automatic legacy API detection.

Expose revision-safe write-rule and simulation configuration plus one persisted daily reset schedule. Applications retain responsibility for business authorization, external-call isolation, data adapters and management pages. Publish an application integration Skill covering those boundaries, verification and migration from earlier development snapshots.

Add opt-in online chat policies for existing host model services and explicit per-tool reads or simulations, with fresh execution-time checks and no Agents changes or automatic write exemptions.

Support explicitly scoped persistence for legacy online conversation adapters without global Agent table write rules.

Add administrator-configured physical-table exceptions with a simple table-name list, protected-table validation and request-boundary revocation, without application capability registration.
