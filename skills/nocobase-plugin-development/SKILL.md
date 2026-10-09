---
name: nocobase-plugin-development
description: Develop and maintain NocoBase v3 plugins in a NocoBase 3 source workspace, including scaffolding, shadcn UI, Client/Server/CLI contributions, database resources, Registry items, Plugin Skills, and target App registration. Use when creating or changing packages/plugins/app-plugin-* or example plugins. Not for legacy NocoBase v2 plugins or application-only development.
---

# NocoBase Plugin Development

Use this Skill for plugin source development in the NocoBase 3 repository. Read the applicable `AGENTS.md` and inspect the target plugin and App before editing. Confirm the workspace contains `packages/tools/create-plugin/`, `packages/app/app-client/`, `packages/app/app-server/`, and `pnpm-workspace.yaml`. A `packages/plugins/` directory alone does not identify v3; do not apply the legacy `Plugin` class, `src/client-v2/`, or `nb scaffold plugin` protocol here.

## Choose the relevant references

These English references adapt the plugin development guide into task-specific instructions. Read the rows relevant to the task; do not load the entire reference set by default.

| Task                                                                                                  | Read                                                                 |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Create a plugin, choose capabilities, change declarations, exports, dependencies, or public contracts | [Scaffolding and package contracts](references/plugin-foundation.md) |
| Register, configure, upgrade, disable, unregister, or diagnose plugin integration                     | [Registration and lifecycle](references/registration.md)             |
| Choose Client components, ServiceProviders, React Providers, configuration, or API access             | [Client architecture](references/client.md)                          |
| Build or change any plugin UI                                                                         | [shadcn components and styling](references/client-components.md)     |
| Add pages, Settings, Dev routes, menus, Tabs, route dialogs/drawers, child routes, or page overrides  | [Client routing](references/client-routing.md)                       |
| Design configuration entities, settings permissions, routed editors and safe saves                    | [System settings](references/system-settings.md)                     |
| Define service contracts, Tokens, dependency injection, or lifecycle                                  | [Services and Providers](references/services.md)                     |
| Add HTTP endpoints, authorization, Repository operations, background jobs, or queues                  | [Server development](references/server.md)                           |
| Name an `/api` path, choose its method, shape its response or error, or validate its input            | [HTTP API rules](references/http-api.md)                             |
| Add migrations, seeds, or package resource/checksum handling                                          | [Database resources](references/database.md)                         |
| Add or change text, locale resources, translated errors, or recipient-language messages               | [Internationalization](references/i18n.md)                           |
| Author, publish, install, upgrade, or remove App-owned editable Client source                         | [Registry](references/registry.md)                                   |
| Expose a plugin's capabilities to the App Agent                                                       | [Plugin Skills](references/plugin-skills.md)                         |
| Add commands, CLI exports, or CLI registration                                                        | [CLI plugins](references/cli.md)                                     |
| Select behavior tests and verify package/App integration                                              | [Testing and delivery](references/testing.md)                        |

For worked implementations and tests, read the matching [Server Route examples](references/server-route-examples.md), [ServiceToken and Provider examples](references/service-examples.md), [Client examples](references/client-examples.md), or [Repository examples](references/repository-examples.md). These supplement the topic references with concrete code and point to maintained source fixtures; adapt their explicit example access policies to the requested product.

## Rules that apply before implementation

When creating a page or writing a page component, refer to [Pages, routes, and menus](references/client-pages-and-routes.md) for page component structure and route declarations. For nested pages, page-level navigation Tabs, route dialogs/drawers, or navigation groups, also read [Child routes, Tabs, overlays, navigation groups, and Outlet](references/client-child-routes.md). Before using the page and overlay examples, [copy the required component source into the plugin](references/client-components.md#copy-page-and-route-components-into-the-plugin). The examples import these plugin-owned copies through relative `.js` paths; the host's private breadcrumb component is excluded. For route overlay component availability and hook context boundaries, read [route dialogs and drawers](references/client-routing.md#route-dialogs-and-drawers).

- Use shadcn components for interactive UI primitives such as buttons, inputs, dialogs, selects, and Tabs. Read the component reference before UI work. Keep plugin-owned components in the plugin and align `components.json` with its package-local `#` imports and published `dist` mappings. Use the shared theme tokens for color, typography, spacing, size, radius, and shadow.
- Use child routes for page-level navigation Tabs by default, even when the user does not mention routing. Declare each Tab's content as a child route, render `Outlet` in the parent page component, and derive the active Tab from the URL. When the parent URL is opened without a child route, redirect to the default accessible Tab by replacing the current history entry and preserving query parameters. Opening an explicit Tab URL must retain that Tab's selection. Follow an explicit user request for a different interaction.
- Create plugins with `pnpm plugin:create` and explicit capabilities, including `cli` when needed. Preview with `--dry-run --json`. Keep the generated runtime-aware shared development configuration.
- Keep declarations static and free of startup side effects. Lazy-load page components, locale messages, heavy SDKs, and genuinely optional features at their leaf boundaries. Settings are Routes, components are public/source exports, and neither is a separate runtime loader.
- Reuse the host's API client through `useApiClient()` or `apiClientToken`; do not construct another application API client. Define shared service contracts and owner-created Tokens before implementations; consumers import the original Token.
- Settings pages and their standalone detail routes use system administration capabilities, not ordinary `page/access` grants. Group related resources by management area (for example, Automation contains Workflow and Schedules), and use each resource's `read` action for page entry. See [System settings](references/system-settings.md) for declarations and server operation boundaries.
- Every `/api` route follows the [HTTP API rules](references/http-api.md): camelCase paths under the plugin's namespace, standard methods, `{ data }` responses, `ApiError` for every failure (clients branch on `reason`), zod input validated through `apiValidator()`, and a `describeRoute()` declaration on every route for the application's OpenAPI document at `/api/swagger/docs`. Data endpoints are `POST /api/{name}/{action}` with camelCase exposure names and are documented without a declaration.
- Each Server Route owns and tests its authentication and authorization, or its explicit public protocol boundary. Another contribution's middleware or registration order is not protection. Test the production contribution through `createRouter()`.
- Every Server plugin declares an absolute `baseDir`. Migrations, seeds, and Jobs resolve relative to it so compiled plugins use compiled resources. Migrations are explicit, self-contained, immutable after merge, and tested against a real database.
- Register Client, Server, and CLI exports explicitly in the corresponding target App composition roots. Installation, registration, Skills synchronization, and runtime behavior are separate facts; legacy manifest metadata is not runtime discovery.
- Plugin integration knowledge is authored in `<plugin>/skills/`; the target App's `.agents/skills/` is generated output. Registry source copied into an App belongs to that App. This repository's development Skill is maintained source, distinct from either kind of output.
- Follow the repository's dependency rules: shared runtimes and client value imports are peers, ordinary server runtime imports are dependencies, and development-only imports are devDependencies. A type reference retained in published declarations needs a consumer-resolvable contract.

## Implementation workflow

1. Inspect working-tree changes, plugin manifests, declarations, exports, tests, and the target App. Identify the requested behavior and who owns its data, UI, services, and integration code.
2. Select capabilities and define the smallest public contracts: Client options/exports, Server Tokens/APIs, CLI commands, permission/error boundaries, and observable results. Use only the relevant references above.
3. Implement in the owning plugin. Put domain behavior in Services, HTTP boundaries in Routes, asynchronous orchestration in Jobs, React context in React Providers, and application integration instructions in Plugin Skills.
4. Keep declarations, source/publish exports, dependencies, published files, tests, README, and Plugin Skills consistent. Remove unused scaffold examples and drafts. Write each Markdown prose paragraph on one physical line, without manual line wrapping.
5. When integration is part of the request, preview and apply registration to the chosen App, synchronize applicable Skills, and validate the resulting behavior. Do not run creation, registration, migration, or other stateful commands merely because this Skill applies.
6. Follow [testing and delivery](references/testing.md): run the modified plugin's checks and relevant consumer checks, then verify the requested runtime workflow. `plugin inspect` is an optional read-only registration diagnostic, not a test or completion gate. Report results, skipped checks, and remaining limitations accurately.
