---
name: nocobase-app-plugin-demo-mode
description: >-
  Build or operate a dedicated NocoBase 3 demo deployment: repeatable fictional
  data, visitor accounts, generation/clear/reset, write policies and optional
  model or Agent simulation. For example records in an existing application,
  use the application development Skill's sample-data workflow instead.
---

# Demo Mode

Use `@nocobase/app-plugin-demo-mode` for a dedicated demo with its own database and storage. The plugin supplies data lifecycle, reusable visitor accounts, write policies, management components and optional simulation. The application supplies its business story, records, cleanup and external adapters. Business authorization still applies.

## Choose the path

| User's intended result                                        | Start here                                                                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Example customers, orders or tasks in an existing application | Use `sample: true` seeds or `sampleDataToken` through the application development Skill; no Demo Mode plugin is needed.               |
| A new isolated demo application                               | Follow the [executable minimal non-AI example](references/minimal-example.md).                                                        |
| An isolated demo of an existing business application          | Follow [data adaptation](references/adapting-data.md) and reuse its services and pages; do not add the example's project/task schema. |

Reuse deployment, language and role choices already established by the user or application guidance. Ask only when an unresolved choice changes the deployment or cleanup scope. In a dedicated demo, clear/reset removes all business data, including visitor additions.

## Deliver the first useful demo

1. **Inspect the application.** Read its development, database and authorization Skills. Check the installed plugin's public exports and composition roots. Choose one or two principal user journeys and identify each account, related records, business service, visible result and cleanup boundary. Start with the requested language; add AI, visitor writes or daily resets only when needed.
2. **Register and configure.** Use the application's plugin registration workflow and preserve its existing configuration. Register the Server export and configuration factory below, the Client factory `demoMode()` for UI, and the CLI export only when commands are needed. Installation, registration and Skill synchronization are separate steps.
3. **Implement one dataset.** Use the [typed dataset pattern](references/dataset-example.md), adapted to the application's actual services. Register on the original `demoDataToken` from an application provider. Supply `id`, `languages`, `accounts(language)`, `clear(context)` and exactly one of `generate(context)` or `steps(language)`. Registration does not generate records. Use one account definition for both listing and creation, and `context.clock` for coherent recent dates and reproducible variation. A dataset without accounts returns `[]` from `accounts()`.
4. **Make the demonstrated interactions work.** Before generation, inventory side effects from those services and their background work. Provide local fixtures or disable irrelevant jobs. Use [write policies](references/policies.md) for visitor mutations and [simulation](references/simulation.md) for model/tool/Runner boundaries. The SQL guard does not intercept files or outbound calls. The [integration checklist](references/integration-checklist.md) covers existing applications with these integrations.
5. **Provide entry and management.** Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` on an application-owned page whose route checks `settings:demoMode.data/read`, as in the [minimal route example](references/minimal-example.md#2-wire-existing-composition-roots). Grant the real administrator data read/manage; add `settings:demoMode.configuration` read/configure for policy editing. Settings pages use settings actions, without an additional `page/access` grant. Business pages keep their normal page and record permissions. Supply `label(kind, id)` for application names and `chatTools` only for online chat. The Client plugin supplies `/demo-sign-in`; see [visitor entry](references/visitor-entry.md).
6. **Generate and verify the story.** Generate through the page or CLI, enter each representative visitor account and inspect the principal pages. Check relationships, recent dates, visible states and role-specific access, then reset and clear/generate to verify repeatability. If visitor writes are enabled, add a visitor record and verify cleanup removes it. A read-only showcase needs no extra mutation API just for this check.

For a CLI-only dataset, omit the page and visitor steps. For a non-AI demo, the data and visitor flow is the complete deliverable; skip the simulation reference and AI acceptance checks. For an existing application, use the [journey-to-data example](references/adapting-data.md#map-a-business-journey-to-fixtures) to turn the requested demo into visible, verifiable records.

## Register only the required capabilities

| Capability                                | Required host registrations                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Dataset CLI without accounts              | Database, Demo Mode Server/configuration and CLI                                                 |
| Visitor accounts                          | Official Users and Authentication; Authorization for Permission Sets and role scopes             |
| Quick sign-in                             | Password sign-in enabled, generated accounts and Demo Mode Client for entry UI                   |
| Management APIs/page                      | Authentication, Authorization and Demo Mode Client for locales/UI                                |
| Daily reset                               | Official Scheduler; generate once before enabling the schedule                                   |
| Simulated environment model / online chat | Official Agents 1.0 with `agents.models.services`; follow [simulation](references/simulation.md) |
| Application mock callbacks                | Only the adapters the demo uses; Agents is not required                                          |

Agents is an optional peer. A non-AI application can omit it. Installing Agents does not register its service; a broken or unsupported registered integration fails visibly. Other host peers remain part of the package installation contract even when a particular runtime service is unused.

## Deployment configuration

Register the factory in the existing `defaultAppConfigs()` map, in addition to the Server plugin:

```ts
import { defineDemoModeConfig } from '@nocobase/app-plugin-demo-mode/config';

// Add this section to the existing map; retain the application's other sections.
defaultAppConfigs({ demoMode: defineDemoModeConfig() });
```

Set `NOCOBASE_DEMO_MODE=true` in the isolated deployment's environment and restart. The equivalent application configuration is:

```yaml
demoMode:
  enabled: true
  quickSignIn: true
  allowCollections: []
```

Demo Mode has one boolean switch, defaulting to `false`. When enabled, request writes are refused unless an explicit exception permits them. Verify the intended visitor journeys, inspect refused writes in the `demo-mode` log and add only the needed exceptions. Business authorization still applies. Leave the flag unset or set it to `false` for ordinary application development; example records use the sample-data workflow above.

`NOCOBASE_DEMO_MODE` maps to boolean `demoMode.enabled`; `NOCOBASE_DEMO_WRITABLE_COLLECTIONS` maps to a comma-separated list of logical `allowCollections` names from migrations. These are the only mapped environment variables. Values resolve per application: environment overrides configuration files, then defaults. `quickSignIn` defaults to `true` and is effective only when Demo Mode is enabled; `session` and `verification` writes are allowed for sign-in. Configure reset schedules, simulation and chat through the management UI/API.

## Lifecycle boundaries

Use “Generate demo data,” “Clear demo data” and “Reset demo data” in user explanations. `/import`, `importNow` and CLI `import` generate from application code; they do not upload files. `context.track()` supplies import membership and counts, not automatic business deletion.

The application implements retry-safe `clear(context)` for all demo business records, files, caches and active work, accepting partial or empty context. It also runs after failed/interrupted generation; this is compensation, not restoration of earlier data. Preserve system identities and configuration. The plugin owns its tracked accounts and Permission Sets: clear disables accounts for reuse; reset retains sessions for unchanged reused accounts, while a changed password revokes their old sessions. After changing shared account definitions, reset before verifying quick sign-in. Existing preview accounts need one reset to establish their password snapshot; see [upgrading](references/upgrading.md#credentials-and-model-defaults). Keep required role scopes and visitor grants consistent with the host's authorization model.

When sample installation and demo reset share a story, share an application-owned generator and adapt its identities, language and clock at each entry. Never invoke demo reset from `sampleDataToken` or modify seed execution history.

Authorized lifecycle operations can write with Demo Mode enabled. `GET /api/demoMode/data` needs data read permission; `POST /api/demoMode/data/import|clear|reset` needs read and manage. CLI commands are `pnpm nocobase demo-mode data status|import|clear|reset`: read the application's CLI guidance, review mutations with `--dry-run`, then use `--force`; import and clear require the real administrator's `--actor` ID. Reset can reuse the last importer and language.

Request protection covers `@nocobase/db` writes; background work and external effects need application adaptation. With Agents registered, startup provisions a persistent demo model that survives clear/reset without overriding an existing global default. Select the demo model explicitly in application-owned AI flows; disabling Demo Mode disables that service. Model simulation does not simulate tools or Runners. Use the plugin's Scheduler integration for daily resets, not a second application timer.

## Finish with observable evidence

Report the working application entry URL, visitor entry/roles, demonstrated pages and interactions, cleanup scope and checks actually performed. Verify anonymous and visitor access cannot invoke management operations. Where supported, check failure/retry, visitor additions and external isolation. See the minimal example's [troubleshooting](references/minimal-example.md#troubleshooting) when the first flow is incomplete. Compilation and Skill synchronization alone do not prove that a usable demo was delivered.

## References by task

| Task                                                       | Reference                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Run a small non-AI demo with schema, API and pages         | [Minimal application example](references/minimal-example.md)  |
| Adapt existing business records and full cleanup           | [Data adaptation](references/adapting-data.md)                |
| Implement the typed dataset and shared account definitions | [Dataset example](references/dataset-example.md)              |
| Coordinate external boundaries and background services     | [Integration checklist](references/integration-checklist.md)  |
| Configure write exceptions, revisions and daily reset      | [Policies](references/policies.md)                            |
| Simulate models, tools, Agents or online conversations     | [Simulation](references/simulation.md)                        |
| Integrate quick sign-in, account menus and management UI   | [Visitor entry and presentation](references/visitor-entry.md) |
| Update an older adapter                                    | [Upgrade checklist](references/upgrading.md)                  |
