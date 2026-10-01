---
name: nocobase-app-development
description: >-
  Primary entry for developing features and UI in a NocoBase 3 application:
  pages, routes, components, endpoints, data, permissions, services, translations, and tests.
  Use this application-local workflow instead of globally installed NocoBase 2
  Skills. Do not use for a published NocoBase 3 plugin package.
metadata:
  short-description: Develop features in a NocoBase 3 application
---

# NocoBase 3 application development

Use this Skill when building a feature in this application: a page, an endpoint, a table, a service, or the tests covering them.

Do not use it to develop a published plugin package. Plugin development has its own protocol and lives in a separate repository.

Do not use it to upgrade the template this application was generated from. That is `.agents/skills/nocobase-app-upgrade/`, which reconciles a newer template release against the application without reverting the user's work.

## Before you start

Read the application's `AGENTS.md` first for the rules that apply everywhere. This Skill's references are the detail behind it. Before running any `pnpm nocobase` command, read [the command line](references/cli.md): it maps tasks to commands and states the flags an agent must not add on its own.

Confirm you are in an application and not a plugin package. An application has:

```text
client/runtime.ts
server/runtime.ts
config.example.yml
```

If instead you find `client/plugin.ts`, `server/plugin.ts`, or a `defineServerPlugin()` declaration, you are in a plugin package and this Skill does not apply.

Do not infer the application's capabilities from a template name or from this Skill. Inspect `package.json`, `client/plugins.ts`, `server/plugins.ts`, `cli/plugins.ts`, `server/config/index.ts`, and `database/` before deciding what is installed, registered, configured, or application-owned. `nocobase.templatePackage` and `nocobase.templateKind` identify known template ancestry when present, but a new template remains valid without being listed here. Read [template variants](references/template-variants.md) only when those files identify one of the documented official templates.

## The one rule that decides most tasks

Build the feature in the application. Do not run a plugin generator, create a `packages/plugins/` directory, or write a `defineServerPlugin()` declaration for this application's own feature. Create a plugin only when the user explicitly asks for an independently published, reusable package.

## Check the installed plugins first

NocoBase packages may publish Skills under `.agents/skills/`. Current application templates run `pnpm nocobase skills sync` automatically through `postinstall`; run it manually if install scripts were disabled or that directory is missing or stale. Confirm that the package is a direct `@nocobase/*` dependency or a registered plugin before relying on its Skill. The common capability mappings are:

| The requirement sounds like                                                                   | Read the Skill for                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------- |
| Approvals, multi-step processes, "when X happens then Y"                                      | `@nocobase/app-plugin-workflow`       |
| An assistant in the app: chat, reading files dropped into it, acting through tools you define | `@nocobase/app-plugin-ai-employee`    |
| Email, IM, or in-app messages                                                                 | `@nocobase/app-plugin-notification`   |
| Roles, permissions, per-user or per-record access                                             | `@nocobase/app-plugin-authorization`  |
| Sign-in, registration, sessions                                                               | `@nocobase/app-plugin-authentication` |
| File upload and metadata through Repository                                                   | `@nocobase/app-plugin-file`           |
| Translated text and language switching                                                        | `@nocobase/app-plugin-i18n`           |
| User administration and application-owned role assignment                                     | `@nocobase/app-plugin-users`          |
| Reading or writing data, schema changes, migrations                                           | `@nocobase/db`                        |

Read the relevant Skill before writing the feature, but treat this table as a map rather than an installed-package list. Implementing a permission system, a notification sender, or a scheduler by hand when a registered plugin provides one is the most expensive mistake available here.

For notification configuration or sending, follow the notification plugin Skill: `notification.channels` maps each name to one flat Provider configuration, and `send({ idempotencyKey, messages })` supplies a complete message per Channel. Use native addresses; email and in-app arrays create independent deliveries, while Webhooks forbid `to`.

Skills synchronization reads direct `@nocobase/*` dependencies from the application manifest and retains compatibility with explicitly registered plugins. It does not make an unregistered runtime plugin active; the composition roots remain the authority for registration and contribution order.

Install plugins with `pnpm nocobase plugin register <name>`. All application plugins belong in `dependencies`, including client-only and disabled plugins, because deployment dependencies come from that field. Plugin frontend libraries remain peers and are not automatically installed in the deployment. Re-registering migrates legacy `devDependencies` entries while preserving the declared range; verify the manifest and lockfile afterward. With an older CLI, use `pnpm add --save-prod <package>@<declared-range>` to correct the declaration; `--no-install` leaves lockfile synchronization to the caller.

To update a registered plugin, use `pnpm nocobase plugin update @nocobase/app-plugin-authentication` (or the short name `authentication`). Omit the name to update all registered plugins; add `--dry-run` to preview. `plugin update` takes a positional name, not `--plugin`, and re-synchronizes Skills after a successful package update. See the Plugins section of the application's `README.MD` for version-range behavior and examples.

## Removing a direct NocoBase package

Before removing an `@nocobase/*` dependency, search the application's imports, Client/Server/CLI plugin registrations, routes, services, configuration, tests, and build scripts for the package name and the contracts it provides. Migrate or remove those references first. `package remove` updates dependency metadata and generated Skills; it does not rewrite application code or configuration and cannot decide whether the capability is still needed.

Run `pnpm nocobase package remove @nocobase/example`. The command uses the application's package manager to update `package.json` and the lockfile, then removes only synchronized Skills recorded as owned by that package. An `@nocobase/app-plugin-*` target delegates to the plugin unregister workflow so its Client, Server, and CLI registrations are removed together; `pnpm nocobase plugin unregister <name>` remains available. Use `--dry-run` before a consequential removal and `--json` when structured output is needed.

After an interrupted or manual removal, verify that the manifest no longer declares the package and run a full `pnpm nocobase skills sync` to reconcile stale package-owned output. Passing an already-absent package to `package remove` cleans recorded historical Skill ownership without uninstalling or cleaning another package.

## Frontend work

Before writing or changing anything under `client/` — pages, components, styles, copy — read [the frontend workflow](references/frontend/ui-workflow.md). It decides whether the change takes the full workflow (a design file reviewed once, then an independent acceptance review), a theme change (tokens and presets, verified with the theme tests and a browser check) or a quick change (edit directly, then the static checks, the related tests and one look at the changed element in the browser), and which parts of [the UI guidelines](references/frontend/ui-guidelines.md) and [the frontend handbook](references/frontend/frontend-dev.md) to read at each step.

The handbook's "Look up by task" table routes each frontend task to the sections that cover it, and [the worked example](references/frontend/references/example.md) holds the complete files of the projects feature its rules are illustrated with. Components are shadcn/ui primitives, added with the CLI when a page first needs one: the shadcn/ui skill in `references/frontend/shadcn/` covers their API and composition rules, and [its guide in this handbook](references/frontend/references/shadcn.md) says what to read there and where this application departs from it.

## Choose your reference

Read the page for the task in front of you. Do not read all of them.

| Task                                                                                                 | Read                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anything under `client/`: pages, routes, components, styling, forms, API calls, copy, frontend tests | [frontend workflow](references/frontend/ui-workflow.md), which routes to the [frontend handbook](references/frontend/frontend-dev.md), the theme reference or the worked example |
| Add an API endpoint, a webhook, or a callback; authenticate and authorize it                         | [server routes](references/server-routes.md)                                                                                                                                     |
| Query or write data, resolve the database, work with transactions                                    | [database and data access](references/database-and-data.md)                                                                                                                      |
| Create a table, alter a column, add an index, write required initial data                            | [migrations and seeds](references/migrations.md)                                                                                                                                 |
| Switch the database, register a dialect, add a second connection                                     | [database connections](references/database-connections.md)                                                                                                                       |
| Translate server-produced text, add a language, set the default language                             | [internationalization](references/i18n.md)                                                                                                                                       |
| Departments, positions or another organisation dimension that permission sets are assigned to        | [organisation dimension](references/organization.md)                                                                                                                             |
| Design who gets what across departments, heads and cross-department work                             | [organisation permission design](references/organization/permission-design.md)                                                                                                   |
| Add a reusable service, share it across routes, run background or scheduled work                     | [services and jobs](references/services-and-jobs.md)                                                                                                                             |
| Write server and migration tests, choose a test layer, verify before finishing                       | [testing and verification](references/testing.md)                                                                                                                                |
| Run a CLI command: configure, migrate, manage plugins, read the data model                           | [the command line](references/cli.md)                                                                                                                                            |
| Add or change an application command under `cli/commands/`                                           | [adding an application command](references/commands.md)                                                                                                                          |
| Understand behavior inherited from an official application template                                  | [template variants](references/template-variants.md)                                                                                                                             |

A feature with a page and an API usually needs migrations, server routes, and a frontend change that follows the frontend workflow.

The three database pages above are the application side — where the files live, which commands run them, how connections are configured. The database API they are written against belongs to `@nocobase/db` and is documented by the `nocobase-db` Skill synchronized alongside this one. Read that Skill before writing a migration, a seed, or a query.

Frontend validation complements server-side validation and does not replace it.

## Business permissions

When users describe different jobs, team responsibilities, confidential data, collaboration, field editing or restricted operations, read [application permission development](references/authorization.md) and the installed `nocobase-app-plugin-authorization` Skill before implementing the feature. Design pages, business actions and record scopes separately; apply database policies on the server and use client checks for visibility. The dedicated Skill covers declarations, custom scopes, relations, inherited subjects, optional rules, assignments and verification. Keep application-owned implementation in this App rather than scaffolding a plugin.

## Database configuration factories

When a database driver requires `@nocobase/db` as a runtime peer, keep both in `dependencies`. TypeScript also uses that declaration to resolve inferred database configuration through the public package name; putting it only in `devDependencies` can cause TS2883 in an installed application even while a source workspace builds successfully.

Declare database defaults with `defineAppDatabaseConfig` from `@nocobase/app-server/database`. When switching or adding connections, read [database connections](references/database-connections.md) for complete examples, YAML overrides, schema ownership and verification.

## Where to work

Business code belongs in a small, stable set of places:

```text
client/routes.ts, client/pages/, client/components/, client/hooks/,
client/locales/, client/service-provider.ts, server/routes/,
server/providers/, database/main/migrations/, database/main/seeds/, tests/
```

Everything else — `client/routing/`, `client/layouts/`, `client/theme/`, the server entry points, the build scripts, the tsconfigs — is the framework structure the template provides and evolves. Prefer the mechanism the system already offers: most work that looks like it needs a change there does not.

When the built-in mechanism genuinely cannot express the requirement, changing that structure is a legitimate answer. Comment what you changed and why the built-in path did not fit, and update the application's `AGENTS.md` in the same change so it still describes the real application. The synchronized NocoBase Skills are package-owned; propose a change to their source package when the shared framework guidance itself is wrong.

When you do change the shell (`client/layouts/`, `client/routing/`), keep the behaviors listed in [customizing the shell](references/frontend/references/shell.md#1-behaviors-to-keep): the Settings and Dev tools header entries, the language submenu, navigation group state, permission refresh and sign-out handling.

## Ownership

```text
You own       pages, components, endpoints, tables, migrations, services,
              translations, tests, navigation, theme, business logic

Packages own  their routes, components, tokens, services, internal tables,
              and any skills/ they publish

Generated     .agents/skills/ — synchronized copies, gitignored, replaced
              wholesale on the next sync; never edit
              .claude/skills/ — symbolic links to the above so Claude Code
              discovers them; gitignored, rewritten by the same sync

Config        config.yml — written by pnpm nocobase config init, gitignored, holds
              secrets; document options in config.example.yml instead
```

Reach a plugin's capability only through its documented package exports. Never import a plugin's internal source path or write to its tables directly.

## Reversible customization

When customizing template or registry UI, prefer existing props and composition, then new application components outside `client/extensions/`. Keep the original extension implementation as the reusable baseline; edit it only when explicitly requested or when composition cannot reasonably meet the requirement, and explain that choice. See [styling](references/frontend/references/styling.md).

Treat disabling a feature as a reversible availability change by default: preserve its page and component source, conditionally exclude or guard its route, and hide its links and actions. A hidden navigation item alone does not disable direct URL access. Enforce the same feature policy on the server so direct API calls cannot execute the disabled operation. Do not delete feature code merely to remove it from the current UI; explicit permanent removal can justify deletion. See [pages and routes](references/frontend/references/page.md).

## Non-negotiables

These cause real damage and appear in every reference:

- **Every server route owns its own authentication and authorization.** Mounting under `/api` authenticates nothing.
- **A migration is immutable history and self-contained.** Never import an evolving definition into one. Never edit one whose branch is merged.
- **Every user-visible string goes through a translation key**, the English built into shadcn/ui primitives included.
- **Let the owning page supply `PageContainer`.** One per page; inline child pages and tabs use the parent's, covering child pages add their own, overlays use their own container. See [section 2 of pages and routes](references/frontend/references/page.md#2-the-page-component).
- **Visual consistency is application-wide.** Restyling only your part is a defect. Change the design tokens if a change is needed.
- **Route paths never include the deployment base path.** The runtime restores it.
- **Route navigation creates sidebar entries.** Declare `navigation` in `client/routes.ts`. Refine resources create no menu entries and, with no data provider registered, load nothing; pages load data with `useApiClient` (see [calling the API](references/frontend/references/api.md)).
- **Reach for the built-in mechanism first.** Changing framework structure is allowed when nothing else fits — comment it and update the docs.
- **Tests live in `tests/` or `e2e/`,** never beside the source.
- **Remove direct NocoBase packages with `package remove` after reviewing their usage.** Do not hand-delete only the manifest entry or leave synchronized Skills and plugin registrations behind.

## Development file watching

`pnpm dev` checks native file watching before starting its children. If watcher resources are exhausted or native events are unavailable, it uses polling for client and server hot updates and disables agent annotations for that run, with a warning. An explicit `CHOKIDAR_USEPOLLING=true` selects the same mode. Configuration files use stat polling so atomic saves and newly created files restart the server without native directory watchers.

Vite must exclude the application's entire `dist/` tree from development file watching. Its default exclusion covers only `dist/client`; watching the compiled server and vendored packages can cause `EMFILE` after a build. Keep the exclusion scoped to this application so linked workspace dependencies, including their `dist/` files, still receive hot updates.

## Remote backend development

Treat `/main` in examples as a default, never as a fixed route. Local `APP_BASE_PATH` resolves from the command-line environment, then `.env.local`, then `.env`, with `/main` as the fallback. Determine the remote application's actual public mount path separately and include it in `PROXY_TARGET_URL`; local and remote paths may differ. For example, local `APP_BASE_PATH=/local` and a target ending in `/crm` map `/local/api` to `/crm/api` and `/local/ws` to `/crm/ws`.

For local client debugging against another running application, use `PROXY_TARGET_URL=<remote-application-base-url> pnpm dev` (for example, `http://127.0.0.1:13000/main`, without `/api`). This starts Vite, proxies API and WebSocket paths, and skips the local server and its watchers. Existing `beforeDev` hooks still run. Open the printed Local URL. Client edits reload locally; backend edits require running or deploying the target separately. Requests use the target's data and permissions. See README.MD for authentication and path mapping requirements. Unset the variable to develop both sides locally.

The proxy maps same-origin browser HTTP and WebSocket Origin headers to the target origin, with matching Referer paths mapped to the target app base. It preserves foreign origins and does not add missing Origin headers. Test browser handshakes with an explicit Origin; an Origin-less Node WebSocket test does not verify browser compatibility. Production does not use this Vite adaptation: configure `APP_PUBLIC_ORIGIN` and preserve public Host/protocol information through the reverse proxy.

Use `APP_SERVER_PORT` for the local entry port in both development modes. With `PROXY_TARGET_URL` it selects Vite's preferred port, defaulting to 5173; without it, it selects the local backend port, defaulting to 13000, and Vite still starts from 5173. If occupied, the port advances automatically. Open the printed Local URL and keep the remote service address in `PROXY_TARGET_URL`.

## Finishing

`pnpm build --help` (or `-h`) lists build options and exits without loading build dependencies, running hooks, or modifying `dist/`. Every successful build records `nocobase.buildTarget` in `dist/package.json`, including builds with no native modules: `platform`, `arch`, `libc`, `nodeMajor`, and `nodeAbi`. Use `libc` only for Linux; its value on other platforms is a compatibility placeholder. Deployment checks should compare these fields with the host runtime and also respect `engines.node`. With `--target current` (the default), the Node version and ABI come from the running process; an explicit platform target defaults to Node 24 unless `--node-version` is supplied.

When building for another platform, pass `--target` and verify the native binaries retained in `dist/node_modules`. `better-sqlite3` 13 bundles N-API binaries for multiple platforms; Alpine targets need the `linuxmusl` binary, while other Linux targets use the `linux` binary.

For each change, scope all verification to affected files, projects, or packages and their affected consumers, including formatting, lint, type checking, tests, builds, and runtime checks. Use supported file selectors, project configurations, and workspace package filters. Do not default to full-application or workspace-wide commands or `pnpm check`. Run the smallest supported scope when a required check cannot be narrowed further, and explain why. Expand or repeat checks only when further changes, dependency impact, configuration changes, or failures justify it, or the user requests it. Documentation-only changes need formatting and link checks for changed documents, not type checking, runtime tests, or builds. Follow [Testing and verification](references/testing.md) for selection examples.

Verify observable behavior, not just that the commands passed. [Testing and verification](references/testing.md) lists what to check for each kind of change.

After adding or removing a language in `client/locales/` or `server/locales/`, run `pnpm nocobase locales check`. It compares only the two language lists: it reports a language declared on one side alone and exits nonzero until the lists align. A client-only language is still supported at runtime and the server falls back to English; add matching server translations when server-produced text should use that language.

Application startup defaults belong in `config.yml`: `i18n.defaultLocale` for the language, and `client.app.defaultColorScheme` and `client.app.defaultTheme` for appearance. Valid browser-local choices take precedence. Which languages the interface offers is not configured — `client/locales/` is that list, while `server/locales/` independently defines the server's translated languages. See [internationalization](references/i18n.md), [frontend copy](references/frontend/references/i18n.md) and [themes and tokens](references/frontend/references/theme.md).

## Publish application releases

Deploying to a Hub uses the `pnpm nocobase hub` commands, which the application has while it depends on `@nocobase/hub-cli`: `hub remote add` records the target App in `.nocobase/hub.json`, `hub auth login` saves its API key outside the project, and `hub deploy` builds for the Hub, uploads and deploys. Read `.agents/skills/nocobase-hub-cli/SKILL.md`, which that package ships, before running them, and the `nocobase-deployment` Skill for the rest of a production deployment.

## Logging and hosted applications

Use the application logging service for diagnostics so entries carry application identity and follow its level and output policy. Development pretty output uses local time and displays `[appId/logger]`; file and JSON console output retain UTC timestamps and structured context. Request starts and headers, configuration diagnostics and AI resource loading stages are DEBUG; request completions and AI resource totals are INFO. Default optional `ai/skills` directories may be absent; explicitly configured missing directories still warn.

The Hub configures hosted application output under `hub.logging.apps`; its own output uses `logging`. Deployed releases carry their own runtime and logging packages: updating the Hub cannot repair an old application formatter that prints numeric levels or omits context, or make an old runtime understand the structured console policy. Upgrade the application dependencies, rebuild and deploy a new release; never edit a deployed artifact or intercept process-wide stdout to rewrite other applications’ logs. Verify console enablement and pretty mode after upgrading.

Authentication diagnostics use the application `auth` logger unless an explicit authentication logger is configured. A missing Better Auth base URL is a configuration warning, not a logging error: configure `app.publicOrigin` with the externally reachable origin in the application deployment configuration. Do not substitute the internal Host bind address or suppress the warning to make startup appear clean.

## Hub storage maintenance

Hub storage separates Hub-owned state, Host runtime files, release archives, expanded revisions and persistent application volumes. Standalone source and compiled entries share the deployment directory's storage; `APP_STORAGE_DIR` selects another storage directory, and explicit storage paths take precedence over it. Embedded applications use Host-provided paths. Expanded releases live at `appRevisionsDir/<appId>/<sha256>` and restart recovery requires their installed metadata. Build archives use `storage/exports/dist.tar.gz`.
