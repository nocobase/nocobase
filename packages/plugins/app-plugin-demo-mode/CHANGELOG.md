# @nocobase/app-plugin-demo-mode

## 0.0.1

### Patch Changes

- Add the Demo Mode plugin: a read-only demo by registration alone.

- Add application-owned demo datasets with import, progress, clear, reset, scheduled resets, relative dates, bilingual account summaries, and an OpenAI-compatible simulated model.
- Track account ownership and reject existing-account collisions. Preserve later administrator model choices, recover interrupted imports, and coordinate competing lifecycle operations.
- Add `demo-mode data` CLI commands, refresh model bindings across processes, and keep client status polling ordered.
- Permit authorized demo lifecycle actions in read-only mode with an async-local exemption; retain normal request write guards.
- Add an optional demo-only `clearAll` hook for explicit full-application cleanup, including before the first import, while keeping failure rollback and interrupted-import recovery scoped.

## Unreleased configuration

- Add persisted revisioned configuration, scoped write capabilities, adapter switches and daily reset scheduling with DST handling.
- Expose deterministic daily fixture seeds and integration guidance; enforce enabled demo mode for lifecycle operations.
- Let demo account specs carry the users plugin's `roleScopes`, for applications with a role scope required on create, and apply them again when an import reuses an account.
- Add the dataset option `keepAccounts`, which disables demo accounts on clear instead of deleting them, since a deleted account's username stays reserved.

## Unreleased

- Ship the demo administration page, `DemoModeSettings` (`client/settings`): overview with data lifecycle and visitor entry links, daily reset, visitor writes (capabilities and tables) and simulation & online chat, each saved on its own with conflict detection. Applications pass their names (`label`) and chat tools (`chatTools`) instead of building their own page. The account switcher moves to the bottom right, clear of application sidebars.

- Add quick sign-in for demo visitors: a public list of the imported demo accounts, password-free sign-in through Better Auth's own email sign-in, a `/demo-sign-in` page for embedding (`?as=`, `?redirect=`) and a corner account switcher. On by default in demo mode; `demoMode.quickSignIn` or `NOCOBASE_DEMO_QUICK_SIGN_IN` turns it off.

- Renew long-running cleanup leases, fence lifecycle status changes by operation ID, and preserve existing datasets through an additive lease migration.
- Settle fixture and policy initialization failures immediately so imports can be retried; disable and revoke sessions for tracked demo accounts that initiate cleanup.

- Keep request and chat policy checks separate from management schedule previews; Scheduler remains the independent reset trigger. Describe dataset execution as generation and update localized management labels while retaining existing API/CLI names.

- Distinguish optional sample data from dedicated demo systems in application and plugin guidance. Clarify compensating full-business cleanup, model persistence and explicit host model adapters in the public contracts.

- Simplify the plugin for isolated demo deployments: one business cleanup contract, reusable disabled accounts, an environment-owned model, environment-wide Agent routing and one persisted reset schedule.
- Remove mixed-data rollback, prior-model restoration, legacy Agents compatibility and deployment-cron overrides. See the published Skill's adapter migration checklist before upgrading a vendored snapshot.
