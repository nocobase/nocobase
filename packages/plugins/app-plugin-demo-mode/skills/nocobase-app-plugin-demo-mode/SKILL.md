---
name: nocobase-app-plugin-demo-mode
description: Use when building or operating a dedicated demo system: integrating demo mode into an isolated deployment, writing its repeatable dataset and demo accounts, adapting simulated model/Agent execution, running demo import/clear/reset, or configuring read-only demo policies. For ordinary example records in an existing application, use the application development Skill and sample-data mechanisms instead. Combine with the authorization Skills for roles and record scopes; this plugin does not replace business permissions.
---

# Demo Mode

Use `@nocobase/app-plugin-demo-mode` to build a dedicated demo deployment with fictional data. The plugin supplies generation/clear/reset, reusable accounts, visitor entry, write policies, a reset schedule and optional simulation. The application supplies the business story, records, cleanup and external adapters.

## Choose the scope from the request

- For example customers, orders or tasks in an existing application, use the application development Skill's sample-data workflow (`sample: true` seeds or `sampleDataToken`). This needs no demo-mode plugin.
- For a dedicated demo system, use this Skill. Its database and storage are separate from production; clear/reset may remove all business data, including visitor additions.
- Reuse decisions already in the user's request or application documentation. Ask only when the unresolved choice changes the deployment or cleanup scope. Do not turn a request for example records into an environment-wide cleanup feature.

## Shortest useful workflow

1. **Inspect the installed application.** Read its development, database and authorization Skills. Confirm the installed plugin's public exports and the Server, Client and CLI composition roots. Inspect the main pages, business services, relationships and roles; choose a small fictional story that makes those pages useful.
2. **Register and configure.** Register the Server export, the Client factory `demoMode()` and, if CLI operations are needed, `@nocobase/app-plugin-demo-mode/cli`. Set `demoMode.mode` to `observe` while adapting the application, then `read-only` if visitors should have restricted writes. No AI features are required: set `demoMode.data.models: false` when the demo does not need a simulated model. Configuration details are below.
3. **Implement one dataset.** Follow [data adaptation](references/adapting-data.md) and the [typed dataset example](references/dataset-example.md). Register on `demoDataToken` from an application provider. Share one account definition between the visitor list and account creation. Use the application's services, `context.clock` for dates, and `clock.sample(key)` for reproducible variation. Implement full business cleanup alongside generation.
4. **Adapt the interactions being demonstrated.** Inventory external calls and background jobs before running generation. Supply local fixtures or skip irrelevant jobs. For visitor writes, use [write policies](references/policies.md); for model, tool or Runner execution, use [simulation](references/simulation.md). Add only capabilities the requested demo uses. The SQL guard does not intercept external calls.
5. **Mount the supplied management flow.** Mount `DemoModeSettings` from `client/settings` on an application-owned route. Supply `label(kind, id)` for application names, and `chatTools` only when online chat is used. Administrators need `settings:demoMode.data` read/manage and, for policy editing, `settings:demoMode.configuration` read/configure. Preserve the application's page authorization. Use [visitor entry and presentation](references/visitor-entry.md) for the account menu, embedding or host component overrides.
6. **Generate and inspect.** Generate through the page or CLI, sign in as each representative account, and inspect the actual principal pages. Add a visitor record, clear and reset, and check that the story returns without duplicate records. Report the working entry URL, account roles, enabled interactions and checks actually performed. The [integration checklist](references/integration-checklist.md) covers applications with background services or Agents.

## Runtime configuration

The optional `demoMode` section supplies `mode` (`off`, `observe`, `read-only`), `allowTables`, `quickSignIn` and `data.models` / `data.modelBaseUrl`. Process environment variables `NOCOBASE_DEMO_MODE`, `NOCOBASE_DEMO_ALLOW_TABLES`, `NOCOBASE_DEMO_QUICK_SIGN_IN`, `NOCOBASE_DEMO_DATA_MODELS` and `NOCOBASE_DEMO_DATA_MODEL_BASE_URL` override the matching values. `NOCOBASE_DEMO_ALLOW_TABLES` is comma-separated. The current plugin reads process environment directly; do not assume application-scoped environment mappings exist. For apps sharing a process, use separate configuration sections and avoid conflicting process-wide overrides.

`session` and `verification` writes are allowed for sign-in. Browse the intended demo flows in `observe` mode and inspect the `demo-mode` logger before selecting write exceptions. Choose whole-table exceptions for disposable business tables when normal application authorization is sufficient; use registered capabilities when a narrower operation or record scope is needed. Switch to `read-only` and verify the same flows. Neither mode replaces business authorization.

## Lifecycle and ownership

Use “Generate demo data,” “Clear demo data” and “Reset demo data” in user explanations. `/import`, `importNow` and CLI `import` mean generation from application code, not file upload. Supply exactly one of `generate(context)` or `steps(language)`, plus `id`, `languages`, `accounts(language)` and `clear(context)`. Generation does not run on ordinary startup.

The application owns business records, blobs, caches and active work. Its retry-safe `clear(context)` removes them even with empty or partial context. The same cleanup is used after failed or interrupted generation; it is compensating cleanup, not restoration of previous business data. Tracking supplies import membership and counts, not automatic business deletion. The plugin manages its demo accounts and Permission Sets through their owning services. Clear disables accounts for reuse; reset preserves the sessions of accounts it creates again. Do not reuse an account the dataset does not own.

Keep one application-owned generator when ordinary sample installation and demo reset need the same story. Adapt each entry's actor, language and identity helpers; never call demo reset from `sampleDataToken` or modify seed execution history to regenerate demo content.

Authorized lifecycle operations can write in read-only mode. `GET /api/demoMode/data` requires data read permission; `POST /api/demoMode/data/import|clear|reset` requires read and manage. CLI commands are `pnpm nocobase demo-mode data status|import|clear|reset`: review arguments with `--dry-run`; mutations need `--force`; import and clear need the actual administrator's `--actor` ID. Reset may reuse the last importer and language. CLI uses the lifecycle service directly. Read the application's CLI guidance before running commands.

Only `@nocobase/db` writes within requests are guarded. Background jobs, schedules, files and outbound requests need application adaptation. When models are enabled and Agents is available, startup provisions the persistent demo model; clear/reset leave it in place. Model simulation does not simulate tools or Runners. Daily resets use the plugin's Scheduler integration, never a second application timer.

## References by task

| Task                                                         | Reference                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| Design fictional records, shared generation and cleanup      | [Data adaptation](references/adapting-data.md)                |
| Implement a typed adapter with shared account definitions    | [Dataset example](references/dataset-example.md)              |
| Integrate external boundaries and background services        | [Integration checklist](references/integration-checklist.md)  |
| Configure writes, mocks, revisions and scheduled reset       | [Policies](references/policies.md)                            |
| Simulate models, tools, Agents or online conversations       | [Simulation](references/simulation.md)                        |
| Configure quick sign-in, embedding and management components | [Visitor entry and presentation](references/visitor-entry.md) |
| Update an older plugin adapter                               | [Upgrade checklist](references/upgrading.md)                  |

Finish with runtime evidence appropriate to the requested demo. Do not require Agent, multilingual or daily-schedule work for a demo that does not use those features. Skill synchronization and compilation alone do not prove that the pages contain useful demo data.
