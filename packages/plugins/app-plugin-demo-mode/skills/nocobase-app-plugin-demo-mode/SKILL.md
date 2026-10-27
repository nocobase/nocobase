---
name: nocobase-app-plugin-demo-mode
description: >-
  Build, enable or operate a dedicated NocoBase 3 demo deployment with
  @nocobase/app-plugin-demo-mode: a public, shared demo site whose fictional data
  is generated, cleared and reset, with quick visitor sign-in, write protection
  and optional model or Agent simulation (公开演示站、只读演示、定时重置的演示环境、
  Demo Mode). Also use when changing business collections, external integrations
  or background jobs in an application that already depends on this plugin, so
  its demo dataset, cleanup and adapters stay complete. Not for example records
  (use the application development Skill's sample-data workflow), ordinary trial,
  staging or customer deployments, third-party sandbox credentials, or an in-app
  presentation/display mode feature.
---

# Demo Mode

Use `@nocobase/app-plugin-demo-mode` for a dedicated demo with its own database and storage. The plugin supplies data lifecycle, visitor accounts, write protection, management components and optional simulation. The application supplies its business records, cleanup and external adapters. Simulation adapters and demo chat are enabled by default once integrated, without AI switches on the management page; the application chooses which flows to connect.

## Visitor language and appearance

Demo Mode automatically isolates the Users API preferences `locale`, `theme.mode` and `theme.preset` in application-scoped browser-session cookies. Visitors sharing an account do not overwrite one another; switching demo accounts retains the visitor's choices. Do not allow `userPreferences` merely to enable these controls, and do not change Users or application preference synchronization for this isolation. Other preference keys still use account storage and need the usual write exception if visitors may save them. Ordinary deployments are unchanged.

Set the site's initial language through `i18n.defaultLocale` (the application's `APP_DEFAULT_LOCALE` mapping), independently of the demo dataset language. Appearance defaults use `client.app.defaultColorScheme` and `client.app.defaultTheme`; fallbacks are `system` and the template's `compact` preset. A fresh visitor receives these defaults even if the shared account stored another choice. Check two independent browser sessions using the same account, account switching, refresh, and a fresh session; a browser restoring its previous session may retain session cookies. Existing browser caches can briefly paint their previous values before the preference response is reconciled.

## Check that this Skill applies

Demo Mode refuses ordinary writes, resets data daily and deletes all business data on clear/reset. Apply it only when the user asks for a demo deployment with those properties, names this plugin or Demo Mode, or the application already depends on it. Otherwise use the matching workflow:

| Request                                                                                | Use instead                                                        |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Example or sample records, such as “add some demo customers”                           | The application development Skill's sample-data workflow           |
| A trial, staging, test or customer environment where users keep their own data         | The `nocobase-deployment` Skill; an ordinary deployment without it |
| A payment, mail or other provider's sandbox account or test credentials                | That integration's configuration                                   |
| An in-app “demo/presentation mode” feature, such as hiding fields while screen-sharing | Ordinary feature development                                       |

When the request could mean either a Demo Mode deployment or one of these, ask which one the user wants before registering the plugin, enabling it or adding full-business cleanup. For a confirmed dedicated demo, reuse the user's established deployment, language and role choices, and clarify any unresolved deployment or cleanup scope: clear/reset removes all business data in the demo instance, including visitor additions.

## Keep protection proportionate

A demo is a public showcase: anyone may enter any listed account, administrators included, and the fictional data is reset daily. Protect only what lies outside the demo: a dedicated database and storage, no real credentials or customer data, and no real external effects such as mail, payments, publishing or real models. Inside the demo, use the application's existing permissions as they are and the plugin's defaults. Do not add hardening such as ownership rechecks, rate limits, confirmation steps, management restrictions for dataset accounts or security-focused tests unless the user asks; prefer the simplest integration that shows the requested journeys.

## Integration workflow

1. **Confirm the target and enable.** Check [the dedicated deployment](#confirm-the-dedicated-deployment), then complete [enable the deployment](#enable-the-deployment) and its verification. Check the required host capabilities below.
2. **Provide the dataset.** Adapt the application's business services using [data adaptation](references/adapting-data.md). For a new application with no business domain, use the [executable non-AI example](references/minimal-example.md). Register one dataset on the original `demoDataToken` in an application provider's `boot()`; registration does not generate records.
3. **Adapt interactions.** Keep normal business authorization. Enable [collection write exceptions](references/policies.md#collection-write-exceptions) for visitor mutations. The guard covers request-scoped database writes; adapt [external calls and background work](references/integration-checklist.md) where the application has them. Read [simulation](references/simulation.md) only for AI or Runner flows the demo uses.
4. **Provide entry and management.** Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` on an application-owned page inside the application's existing System management (settings) navigation group, protected by `settings:demoMode.data/read`. Wrap its route declarations with `demoModeRoutes([...])` from `@nocobase/app-plugin-demo-mode/client` so both the menu and route are absent outside Demo Mode, including for root. `defineDemoModeConfig()` publishes the enabled flag automatically; existing applications must adopt the helper. Grant [management access](#management-access) and see the [route example](references/minimal-example.md#2-wire-existing-composition-roots). Visitor accounts keep their business permissions. The Client plugin automatically enters Super Admin for anonymous home-page visitors and provides `/demo-sign-in` for all enabled person accounts; mount the standalone `DemoModeMenu` in the top header actions as described in [visitor entry](references/visitor-entry.md#required-header-entry).
5. **Generate and verify.** Generate through the [CLI or API](references/policies.md#data-operations), enter representative visitor accounts and check the requested business journeys. Verify that each role sees its intended pages, that reset is repeatable and, when writes are enabled, that reset removes visitor additions. Report the application URL, visitor entry, demonstrated interactions, cleanup scope and checks performed.

For a CLI-only dataset, omit the page and visitor steps. A non-AI demo needs no model or Agent integration. With the application's jobs service composed, daily reset is always enabled after the first generation and reads its schedule from the deployment environment; see [reset variables and defaults](references/policies.md#daily-reset). Preserve other saved policies.

## Maintain an application that uses Demo Mode

An application that registers a demo dataset keeps it in step with ordinary feature work. When a change adds or alters any of these, update the demo side in the same change:

- **Business collections or relations.** Extend the dataset's `clear(context)` to remove the new rows, dependent records first, and generate records where the demonstrated journeys need them; see [business cleanup](references/adapting-data.md#business-cleanup).
- **Outbound calls, file storage or notifications.** Route them through a demo fixture or refusal at the application boundary; see [external effects](references/integration-checklist.md#external-effects).
- **Background jobs, queues or schedules.** Decide whether each runs against fixtures or is disabled in the demo, and keep it from recreating cleared records; see [background work](references/integration-checklist.md#background-work).
- **Visitor mutations.** Add the collections the mutation writes to the [collection write exceptions](references/policies.md#collection-write-exceptions) only when the demo should allow it.

Then reset the demo and verify that no business rows from before the reset remain. Changes that touch none of these need no demo work.

## Required host capabilities

| Capability                    | Host registrations                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Dataset CLI without accounts  | Database, Demo Mode Server/configuration and CLI                                   |
| Visitor accounts              | Users and Authentication; Authorization for Permission Sets and role scopes        |
| Quick sign-in                 | Authentication and Demo Mode Client; Authorization for automatic Super Admin entry |
| Management APIs/page          | Authentication and Authorization; Demo Mode Client for UI/locales                  |
| Automatic daily reset         | The application's jobs service (`JobExecutorServiceProvider`)                      |
| Simulated model / online chat | Optional Agents 1.0 with `agents.models.services`                                  |

## Confirm the dedicated deployment

Clear and reset delete all business data in the connected database, including visitor additions. Before enabling, confirm that every connection under `database.connections`, the storage directory (`APP_STORAGE_DIR`) and any shared service the configuration names belong only to this demo deployment, through its own environment file or deployment configuration. Never enable Demo Mode against a database holding production or development data. If the target cannot be confirmed from the user's stated deployment, ask before enabling.

Give the demo its own storage and databases:

- **Local trial.** Stop the normal development server and start a separate instance, such as `APP_STORAGE_DIR=storage/demo NOCOBASE_DEMO_MODE=true pnpm dev`. A relative SQLite filename, the template default, resolves under the storage directory, so this one variable separates both the database and the files. When the local environment uses a server database (`DB_DIALECT` other than `sqlite`), also set `DB_DATABASE` to a separate, empty database; `APP_STORAGE_DIR` alone would still reach the development database. The normal database is untouched.
- **Server deployment.** Use the deployment's own environment file or `config.yml` with a distinct `APP_STORAGE_DIR` and distinct connection values: `DB_DATABASE` (with its host and credentials) for a server database, or `DB_FILENAME` for an absolute SQLite path. Give every additional connection its own database too.

`APP_STORAGE_DIR` also separates the template's default memory queue and jobs state and its local `fs` disk, but not external services. Check the configuration of both instances, including a local trial beside the development server:

- **Redis.** When `queue.default`, `jobs.default`, the session store or a caching provider uses Redis, give the demo its own Redis instance or a distinct `db` number in each of those sections. A shared Redis lets one instance consume the other's queue messages and job firings and write them into its own database.
- **File disks.** When `drive.default` or a disk the application uses is `s3` or another remote driver, give the demo its own bucket or prefix. Cleanup of generated and visitor-uploaded files acts on that disk.

A new demo database starts with only the initial administrator, created on first start from `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` (`users.initialAdmin`); without them it is `nocobase` / `admin@nocobase.com` / `admin123`. This administrator holds the unrestricted root Permission Set, so it can open the read-only management page and use the data API without extra grants. In Demo Mode this account is publicly enterable alongside other enabled person accounts. Anonymous home-page visitors enter it automatically; existing sessions are retained. No dataset generation is needed for this entry.

## Enable the deployment

Complete these steps in order, preserving existing registrations and configuration sections:

1. **Install and register.** Run `pnpm nocobase plugin register demo-mode --dry-run`, review the plan, then run it without `--dry-run`. While the package is not installed yet, the dry run only prints the install command and asks to run `register` again; that is expected, so run it without `--dry-run`, which installs and then registers. It adds the dependency, registers the Server, Client and CLI entries and synchronizes this Skill. Do not edit only one of `server/plugins.ts`, `client/plugins.ts` or `cli/plugins.ts` by hand. Keep the Client registration as `demoMode()` and add the [required header entry](references/visitor-entry.md#required-header-entry) in the application's layout.
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
   - When Agents is registered, its chat and Agent runs are not covered by the write guard. Demo Mode then creates an enabled simulated model service, `Demo chat`, but does not redirect Agents to it: Agents uses its saved default chat model, or else the first enabled chat model service. In a new demo database that is `Demo chat`. Check the model services in the demo database: keep no real provider credentials there, leave no real service saved as the default or enabled ahead of `Demo chat`, and either integrate [simulation](references/simulation.md) or confirm that chat is unavailable to visitors.

Use the plugin defaults for quick sign-in and scheduling. Customize only what the requested demo needs. Demo Mode is disabled by default in ordinary deployments.

## Management access

While Demo Mode is enabled, root, including the initial administrator, is unrestricted and can open the management page without grants. Give page viewers `settings:demoMode.data` `read` and `settings:demoMode.configuration` `read`. The page is read-only for every account, including root: it shows status, the reset schedule and account entry links, with no data operations or language selector. Grant `settings:demoMode.data` `manage` or `settings:demoMode.configuration` `configure` only for the corresponding API mutations. A dataset account may hold these actions too when the demo should show administration, through the dataset's `createPermissionSet`; reset restores whatever a visitor changes. Clear and failed reset automatically preserve the executing administrator's existing access; see [administrator lifecycle](references/adapting-data.md#keep-the-executing-administrator-available).

These settings items are registered only while Demo Mode is enabled. In an ordinary deployment of the same application, `authz.settings.grant('demoMode.data', …)` throws `Unknown settings item`, and `demoModeRoutes()` omits the management menu and route. Do not add these grants to seeds or migrations that also run in ordinary deployments: assign them in the demo deployment through permission administration, through the dataset's Permission Sets, or from code that runs only when `demoModeServiceToken` reports `enabled`.

## References by task

| Task                                               | Reference                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Run a new non-AI demo with schema, API and pages   | [Minimal application example](references/minimal-example.md) |
| Adapt business records, accounts and cleanup       | [Data adaptation](references/adapting-data.md)               |
| Adapt external calls and background work           | [External integration](references/integration-checklist.md)  |
| Operate data or customize write/reset policies     | [Operations and policies](references/policies.md)            |
| Simulate models, tools, Agents or online chat      | [Simulation](references/simulation.md)                       |
| Customize visitor entry or management presentation | [Presentation](references/visitor-entry.md)                  |
