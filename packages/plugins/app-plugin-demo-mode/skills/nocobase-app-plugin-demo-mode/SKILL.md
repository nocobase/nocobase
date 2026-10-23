---
name: nocobase-app-plugin-demo-mode
description: >-
  Build, enable or operate a dedicated NocoBase 3 demo deployment, such as a
  public demo site, read-only or sandbox demo, or 演示环境: repeatable fictional
  data, visitor accounts, generation/clear/reset, write policies and optional
  model or Agent simulation. For example records in an existing application,
  use the application development Skill's sample-data workflow instead.
---

# Demo Mode

Use `@nocobase/app-plugin-demo-mode` for a dedicated demo with its own database and storage. The plugin supplies data lifecycle, visitor accounts, write protection, management components and optional simulation. The application supplies its business records, cleanup and external adapters.

For example records in an existing application, use the application development Skill's sample-data workflow. For a dedicated demo, reuse the user's established deployment, language and role choices. Clarify only unresolved deployment or cleanup scope: clear/reset removes all business data in the demo instance, including visitor additions.

## Integration workflow

1. **Confirm the target and enable.** Check [the dedicated deployment](#confirm-the-dedicated-deployment), then complete [enable the deployment](#enable-the-deployment) and its verification. Check the required host capabilities below.
2. **Provide the dataset.** Adapt the application's business services using [data adaptation](references/adapting-data.md). For a new application with no business domain, use the [executable non-AI example](references/minimal-example.md). Register one dataset on the original `demoDataToken`; registration does not generate records.
3. **Adapt interactions.** Keep normal business authorization. Enable [collection write exceptions](references/policies.md#collection-write-exceptions) for visitor mutations. The guard covers request-scoped database writes; adapt [external calls and background work](references/integration-checklist.md) where the application has them. Read [simulation](references/simulation.md) only for AI or Runner flows the demo uses.
4. **Provide entry and management.** Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` on an application-owned page protected by `settings:demoMode.data/read`. Grant [management access](#management-access) and see the [route example](references/minimal-example.md#2-wire-existing-composition-roots). Visitor accounts keep their business permissions. The Client plugin provides `/demo-sign-in`; use [presentation options](references/visitor-entry.md) only when customization is needed.
5. **Generate and verify.** Generate through the page or [CLI](references/policies.md#data-operations), enter representative visitor accounts and check the requested business journeys. Verify permissions, reset repeatability and cleanup of visitor additions when writes are enabled. Report the application URL, visitor entry, demonstrated interactions, cleanup scope and checks performed.

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

## Enable the deployment

Complete these steps in order, preserving existing registrations and configuration sections:

1. **Install.** Add `@nocobase/app-plugin-demo-mode` through the application's package workflow and run `pnpm nocobase skills sync`.
2. **Register.** Add the default export of `@nocobase/app-plugin-demo-mode/server` to `server/plugins.ts` and `demoMode()` from `@nocobase/app-plugin-demo-mode/client` to `client/plugins.ts`. When CLI commands are needed, add the default export of `@nocobase/app-plugin-demo-mode/cli` to `cli/plugins.ts`.
3. **Register the configuration section.** Add the factory to the existing `defaultAppConfigs()` map, usually in `server/config/index.ts`. Without it, neither `NOCOBASE_DEMO_MODE` nor a `demoMode` section is read:

   ```ts
   import { defineDemoModeConfig } from '@nocobase/app-plugin-demo-mode/config';

   defaultAppConfigs({ demoMode: defineDemoModeConfig() });
   ```

4. **Switch it on.** Set `NOCOBASE_DEMO_MODE=true` in this deployment's environment, or set the application configuration below, then run migrations and restart:

   ```yaml
   demoMode:
     enabled: true
   ```

5. **Verify.** `GET <base path>/api/demoMode/status` returns `{ "data": { "enabled": true } }`, and the startup log contains `Demo mode is on`. Startup refuses to continue when a database connection cannot be guarded; see [troubleshooting](references/minimal-example.md#troubleshooting).

Use the plugin defaults for quick sign-in and scheduling. Customize only what the requested demo needs. Demo Mode is disabled by default in ordinary deployments.

## Management access

Root is unrestricted and can open the management page without grants. Give other administrators `settings:demoMode.data` `read` and `manage` and `settings:demoMode.configuration` `read` and `configure` through the application's authorization seeds or permission administration. `read` alone shows status without generating, clearing, resetting or saving. Visitor accounts never receive these actions.

## References by task

| Task                                               | Reference                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Run a new non-AI demo with schema, API and pages   | [Minimal application example](references/minimal-example.md) |
| Adapt business records, accounts and cleanup       | [Data adaptation](references/adapting-data.md)               |
| Adapt external calls and background work           | [External integration](references/integration-checklist.md)  |
| Operate data or customize write/reset policies     | [Operations and policies](references/policies.md)            |
| Simulate models, tools, Agents or online chat      | [Simulation](references/simulation.md)                       |
| Customize visitor entry or management presentation | [Presentation](references/visitor-entry.md)                  |
