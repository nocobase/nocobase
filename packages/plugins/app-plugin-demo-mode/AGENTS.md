# Demo Mode maintenance

Follow the repository `AGENTS.md` and `packages/app/app-skills/skills/nocobase-app-plugin-development/SKILL.md`; its references own shared plugin, dependency, API, i18n and testing rules. Application integration belongs in this package's `skills/nocobase-app-plugin-demo-mode/`, not in an application's generated Skill copies.

## Module boundaries

- `server/data/service.ts` coordinates generation, clear and reset. `identities.ts` owns demo-account and Permission Set bookkeeping; `lease.ts` owns persisted fencing and heartbeat renewal. Application callbacks own business cleanup, active work and external cancellation.
- `server/configuration/contract.ts` defines the public policy interface. Bind its original `demoConfigurationToken`; keep provider-only lifecycle and request hooks on the private runtime token. Never expose implementation classes as the public contract.
- `shared/` contains browser-safe types and pure calculations. Client modules must not import server implementation modules.
- Agents is an optional peer. Load its official token only at the integration boundary; a missing package is supported, but a broken installed package or unsupported registered service must fail visibly. Non-AI consumers must not need Agents declarations or runtime imports.
- The conversation persistence exemption is an explicitly authorized callback, not a global Agent-table rule. Keep its official Agents collection dependency localized and verify it when upgrading Agents. The host retains conversation ownership, tool policy and business authorization.

## Lifecycle invariants

Imports and cleanup renew their persisted lease every 30 seconds. Status updates, renewal and deletion are conditional on the operation ID. Check ownership again after application callbacks: a stale owner must not finalize or compensate its replacement. Keep fixture factories, clocks and policy initialization inside failure handling.

Clear disables owned demo accounts for later reuse except the operation's trusted actor, whose credentials, enabled state, assignments, required Permission Sets and tracking remain. Persist the actor when claiming cleanup so scheduled retries use the same identity even after cleanup fails. Reset carries tracked identities across cleanup and atomically hands `clearing` to `importing`; reused accounts retain sessions, obsolete tracked assignments are reconciled after successful generation, and failed generation preserves the actor while compensating other identities. Accounts outside tracking are never disabled or adopted.

## Security posture

Demo Mode serves public demonstrations: anyone may enter any listed account, and reset restores the fictional data. Protect what lies outside the demo — dedicated databases, real credentials and real external effects — and keep everything else simple. Do not add hardening that only protects the demo's own data, such as extra ownership checks, rate limits or confirmations.

## Verification

Run this package's lint, formatting, typecheck, tests and build after code changes. Add regression coverage at the affected boundary, using `@nocobase/app-testing`; prefer final state over mock call order. Test optional integration from a consumer without Agents, and keep the published minimal example executable. Validate Skill links and changesets. Report runtime journeys not exercised.
