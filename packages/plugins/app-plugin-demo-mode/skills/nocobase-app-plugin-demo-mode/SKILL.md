---
name: nocobase-app-plugin-demo-mode
description: >-
  Build, enable or operate Demo Mode for a dedicated NocoBase 3 demo deployment,
  such as a public demo site, read-only or sandbox demo, trial environment, or
  演示环境、演示模式、Demo 模式、只读演示、体验环境: repeatable fictional data,
  visitor accounts, generation/clear/reset, write policies and optional model or
  Agent simulation. For example records in an existing application, use the
  application development Skill's sample-data workflow instead.
---

# Demo Mode

Use `@nocobase/app-plugin-demo-mode` for a dedicated demo with its own database and storage. The plugin supplies data lifecycle, visitor accounts, write protection, management components and optional simulation. The application supplies its business records, cleanup and external adapters.

For example records in an existing application, use the application development Skill's sample-data workflow. For a dedicated demo, reuse the user's established deployment, language and role choices. Clarify only unresolved deployment or cleanup scope: clear/reset removes all business data in the demo instance, including visitor additions.

## Keep protection proportionate

A demo is a public showcase: anyone may enter any listed account, administrators included, and the fictional data is reset daily. Protect only what lies outside the demo: a dedicated database and storage, no real credentials or customer data, and no real external effects such as mail, payments, publishing or real models. Inside the demo, use the application's existing permissions as they are and the plugin's defaults. Do not add hardening such as ownership rechecks, rate limits, confirmation steps, management restrictions for dataset accounts or security-focused tests unless the user asks; prefer the simplest integration that shows the requested journeys.

## Integration workflow

1. **Confirm the target and enable.** Check [the dedicated deployment](#confirm-the-dedicated-deployment), then complete [enable the deployment](#enable-the-deployment) and its verification. Check the required host capabilities below.
2. **Provide the dataset.** Adapt the application's business services using [data adaptation](references/adapting-data.md). For a new application with no business domain, use the [executable non-AI example](references/minimal-example.md). Register one dataset on the original `demoDataToken` in an application provider's `boot()`; registration does not generate records.
3. **Adapt interactions.** Keep normal business authorization. Enable [collection write exceptions](references/policies.md#collection-write-exceptions) for visitor mutations. The guard covers request-scoped database writes; adapt [external calls and background work](references/integration-checklist.md) where the application has them. Read [simulation](references/simulation.md) only for AI or Runner flows the demo uses.
4. **Provide entry and management.** Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` on an application-owned page protected by `settings:demoMode.data/read`. Grant [management access](#management-access) and see the [route example](references/minimal-example.md#2-wire-existing-composition-roots). Visitor accounts keep their business permissions. The Client plugin provides `/demo-sign-in`; use [presentation options](references/visitor-entry.md) only when customization is needed.
5. **Generate and verify.** Generate through the page or [CLI](references/policies.md#data-operations), enter representative visitor accounts and check the requested business journeys. Verify that each role sees its intended pages, that reset is repeatable and, when writes are enabled, that reset removes visitor additions. Report the application URL, visitor entry, demonstrated interactions, cleanup scope and checks performed.

For a CLI-only dataset, omit the page and visitor steps. A non-AI demo needs no model or Agent integration. With the application's jobs service composed, daily reset is enabled by default after the first generation; preserve existing saved policy and make no extra schedule changes unless requested.

## Required host capabilities

| Capability                    | Host registrations                                                          |
| ----------------------------- | --------------------------------------------------------------------------- |
| Dataset CLI without accounts  | Database, Demo Mode Server/configuration and CLI                            |
| Visitor accounts              | Users and Authentication; Authorization for Permission Sets and role scopes |
| Quick sign-in                 | Password sign-in enabled and Demo Mode Client                               |
| Management APIs/page          | Authentication and Authorization; Demo Mode Client for UI/locales           |
| Automatic daily reset         | The application's jobs service (`JobExecutorServiceProvider`)               |
| Simulated model / online chat | Optional Agents 1.0 with `agents.models.services`                           |

## Confirm the dedicated deployment

Clear and reset delete all business data in the connected database, including visitor additions. Before enabling, confirm that every connection under `database.connections` and the storage directory (`APP_STORAGE_DIR`) belong only to this demo deployment, through its own environment file or deployment configuration. Never enable Demo Mode against a database holding production or development data. If the target cannot be confirmed from the user's stated deployment, ask before enabling.

Give the demo its own storage and databases:

- **Local trial.** Stop the normal development server and start a separate instance, such as `APP_STORAGE_DIR=storage/demo NOCOBASE_DEMO_MODE=true pnpm dev`. A relative SQLite filename, the template default, resolves under the storage directory, so this one variable separates both the database and the files. It starts from an empty database; the normal one under `storage/` is untouched.
- **Server deployment.** Use the deployment's own environment file or `config.yml` with a distinct `APP_STORAGE_DIR` and distinct connection values: `DB_DATABASE` (with its host and credentials) for a server database, or `DB_FILENAME` for an absolute SQLite path. Give every additional connection its own database too.

## Enable the deployment

Complete these steps in order, preserving existing registrations and configuration sections:

1. **Install and register.** Run `pnpm nocobase plugin register demo-mode --dry-run`, review the plan, then run it without `--dry-run`. It adds the dependency, registers the Server, Client and CLI entries and synchronizes this Skill. Do not edit only one of `server/plugins.ts`, `client/plugins.ts` or `cli/plugins.ts` by hand; edit `client/plugins.ts` afterwards only to pass [presentation options](references/visitor-entry.md) such as `demoMode({ accountSwitcher: 'menu' })`.
2. **Register the configuration section.** Without it, neither `NOCOBASE_DEMO_MODE` nor a `demoMode` section is read. Follow the application's one-file-per-section layout: create `server/config/demo-mode.ts`,

   ```ts
   import type { AppConfigFactory } from '@nocobase/app-server/config';
   import {
     defineDemoModeConfig,
     type DemoModeConfig,
   } from '@nocobase/app-plugin-demo-mode/config';

   const demoMode: AppConfigFactory<DemoModeConfig> = defineDemoModeConfig();

   export default demoMode;
   ```

   then add it to `server/config/index.ts` in both places the other sections appear, keeping the existing entries:

   ```ts
   import demoMode from './demo-mode.js';

   const defaultConfigs: AppConfigFactory<{
     // ...existing sections
     demoMode: ReturnType<typeof demoMode>;
   }> = defaultAppConfigs({
     // ...existing sections
     demoMode,
   });
   ```

3. **Switch it on.** Set `NOCOBASE_DEMO_MODE=true` in this deployment's environment (its process environment or environment file), or set it in this deployment's `config.yml`:

   ```yaml
   demoMode:
     enabled: true
   ```

   Run `pnpm nocobase config check`, then start or restart. Startup applies the plugin's migrations while `migrations.autoRun` is `true`, the template default; otherwise run `pnpm nocobase db apply` first.

4. **Verify.**
   - `GET <base path>/api/demoMode/status` returns `{ "data": { "enabled": true } }`, and the startup log contains `Demo mode is on`. `false` with the variable set means the configuration section is not registered.
   - Signed in as an administrator, an ordinary change outside the [write exceptions](references/policies.md#collection-write-exceptions), such as editing a business record or a user profile, fails with 400 and `error.reason: DEMO_READ_ONLY`.
   - Startup refuses to continue when a database connection cannot be guarded; see [troubleshooting](references/minimal-example.md#troubleshooting).

Use the plugin defaults for quick sign-in and scheduling. Customize only what the requested demo needs. Demo Mode is disabled by default in ordinary deployments.

## Management access

Root is unrestricted and can open the management page without grants. Give other administrators `settings:demoMode.data` `read` and `manage` and `settings:demoMode.configuration` `read` and `configure` through the application's authorization seeds or permission administration. `read` alone shows status without generating, clearing, resetting or saving. A dataset account may hold these actions too when the demo should show administration; reset restores whatever a visitor changes.

## References by task

| Task                                               | Reference                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Run a new non-AI demo with schema, API and pages   | [Minimal application example](references/minimal-example.md) |
| Adapt business records, accounts and cleanup       | [Data adaptation](references/adapting-data.md)               |
| Adapt external calls and background work           | [External integration](references/integration-checklist.md)  |
| Operate data or customize write/reset policies     | [Operations and policies](references/policies.md)            |
| Simulate models, tools, Agents or online chat      | [Simulation](references/simulation.md)                       |
| Customize visitor entry or management presentation | [Presentation](references/visitor-entry.md)                  |
