# Application Development Guidelines

This is a NocoBase 3 application. Do not apply globally installed NocoBase 2 Skills. You are building the application itself — its pages, its API, its database tables. Everything under this directory is application-owned source code that you may edit directly.

Do not create a plugin to add a feature. Plugins are separately published packages for capabilities shared across several applications; building one for this application's own feature adds a package boundary, a version, and a release process to work that belongs in `client/` and `server/`. Create one only when the user explicitly asks for a reusable published package.

## Default template scope

Default is the clean application starting point. It registers product capabilities but no `app-plugin-*-example` plugins, example pages, application sample services, or sample APIs. Keep runnable demonstrations in `app-template-examples`. Application-owned business server routes start empty; Users supplies the standard Permission Set role scope. Application-owned pages include the localized homepage and inbox; prepared user/role administration modules are unregistered in the bare template and enabled as business capabilities are developed.

`database/main/` contains required permission initialization only; application-owned business migrations and seeds start empty. Do not add article history, demo seeds, or compatibility copies from Examples to this template. Existing installations retain their own executed migration sources when upgrading; see the [upgrade migration rules](.agents/skills/nocobase-app-upgrade/references/edge-cases.md#migrations).

## Keeping this file small

This file stays at most 32 KB and must not grow without bound, because every agent loads it on every start. It holds only the rules that apply everywhere and an index of where the detail lives.

- Application-specific guidance — including what a change to this application's structure, shell or conventions needs the next agent to know — goes in `.agents/rules/<topic>.md`. Update the relevant file, or add one, and add or update its entry in the [index](#index) below rather than writing the detail here.
- Framework-wide guidance lives in the synchronized Skills under `.agents/skills/`. Link to it, never copy it here; when it is wrong for every application, correct it upstream in `@nocobase/app-skills`.
- `tests/logic/agents-md.test.ts` enforces the size limit and checks that the links here and in `.agents/rules/` resolve.

## Load the development skills

`pnpm install` runs `pnpm nocobase skills sync` through the application's `postinstall` hook. If `.agents/skills/nocobase-app-development/` is missing, install dependencies from the application root; if install scripts were disabled or synchronized Skills are stale, run `pnpm nocobase skills sync` explicitly.

[`.agents/skills/nocobase-app-development/SKILL.md`](.agents/skills/nocobase-app-development/SKILL.md) holds the detailed guidance behind this file. Read it first — it routes to the reference that matches your task. Read the one page your task needs, not the whole directory.

`.agents/skills/nocobase-app-upgrade/` is a separate Skill for a separate job: merging a newer release of the template this application was generated from. Read it when the task is upgrading the template rather than building a feature — including when the user asks to upgrade NocoBase or its core version, because a newer template release is how this application moves to a newer NocoBase — and read it before touching anything — an upgrade done by copying the newest template over this application destroys the work that made it this application.

`.agents/skills/nocobase-deployment/` covers moving this application from source to a production server: building for the target platform, what the archive does and does not carry, migrations and business data, production configuration, and what to verify afterwards. Read it before building for deployment, and when an application starts in production but does not work.

## Where things go

Business code goes in these places. This is where you work, and where you should stay unless the task genuinely requires otherwise:

```text
client/routes.ts          Declare a page route
client/pages/             The page component; a folder when a page has children or files of its own
client/components/        Your components
client/components/ui/     shadcn/ui primitives; add with the CLI, never hand-write or edit
client/hooks/             Hooks shared across features
client/locales/           Every user-visible string; system/ holds the template's copy
client/service-provider.ts Client startup: services that boot with the application
server/routes/            HTTP endpoints
server/providers/         Services and their lifecycle
database/main/migrations/      Schema changes
database/main/seeds/           Required initial data
database/main/collections/     Generated Collection artifacts; regenerate, never edit
cli/commands/             Commands this application owns
tests/                    Tests; never beside the source
```

A feature with a page and an API touches five places: a migration for the table, a route in `server/routes/`, a page in `client/pages/` declared in `client/routes.ts`, navigation on the page route, and strings in `client/locales/`. A page with children or page-local helpers uses a folder with `index.tsx`; child folders mirror route paths. [Application structure](.agents/skills/nocobase-app-development/references/app-structure.md) explains how the runtime composes these pieces, where configuration and its environment variables are declared, and the runtime paths.

## System settings are part of feature delivery

A bare create-app shows Home to signed-in users and System settings → App foundation only to unrestricted administrators. The Foundation plugin owns this initial settings group; the navigation transform merges its entry into the application settings group when business administration is registered. As the application develops business capabilities, inspect its current state on every iteration and automatically register the prepared Users and Roles and permissions contribution from `client/pages/settings/routes.ts` once in `client/routes.ts`; preserve it and reconcile missing management surfaces on every iteration, without a first-build flag or one-time setup stage. Whenever an application adds lifecycles, workflows, approvals, notifications, files or other configurable capabilities, automatically include their real administration surfaces without requiring a second user request. Follow [system settings delivery](.agents/skills/nocobase-app-development/references/system-settings.md); in particular, every used process includes a definitions directory, standard diagram, supported parameters and authorized execution history. Do not add demo plugins or empty settings for unused capabilities. The template preinstalls `#components/lifecycle-diagram` (React Flow + ELK) and `client/extensions/nocobase-workflow-management/`: use them by default, preserve their visuals unless the user explicitly requests another style, and connect authorized parameter bindings through `LifecycleDiagram.configuration` to the real editor. These are UI Registry sources; an npm package lookup is not a component availability check.

## Rules that apply everywhere

### Pages and routes

Declare every page in `client/routes.ts` with `defineAppRoutes()` and keep its component behind a lazy `componentLoader` whose module default-exports it. Never write the deployment base path such as `/main` into a route — the runtime restores it. `auth` controls browser navigation only and is not server security. Declare `navigation` on the route to put it in a menu, and always declare `authz` on the first page of every path; the page id identifies stored page grants, so changing it requires migrating the grants that reference it. Read [pages and routes](.agents/skills/nocobase-app-development/references/frontend/references/page.md), and [overlays](.agents/skills/nocobase-app-development/references/frontend/references/overlay.md) before implementing dialogs, drawers or close guards.

Every route listed as a page permission needs a localized display name: use its existing navigation/breadcrumb title, or add its application route name to `client/pages/settings/page-permission-titles.ts` for an overlay or other page with no title metadata. Do not add breadcrumbs/menus just to label an overlay. Run `tests/logic/page-permission-titles.test.ts`; it requires non-empty English/Chinese labels and rejects missing or stale mappings. Never rename route/permission ids or change `authz` to fix display text.

### Components and styling

Import with the package-local `#components/...` and `#extensions/...` specifiers; never add a Vite alias or TypeScript `paths` mapping for them. Use shadcn/ui: check `client/components/ui/` first and add a missing primitive with `yes n | pnpm exec shadcn add <name>` rather than writing your own. Style only with the semantic Tailwind tokens, never hard-coded colors, and keep visual consistency application-wide: change the design tokens in `client/theme/themes/*.css` rather than restyling one page. This template's components, primitives and styling details are in [.agents/rules/components.md](.agents/rules/components.md).

### Server routes and the API document

Every `/api` route follows [HTTP API design](.agents/skills/nocobase-app-development/references/http-api.md): camelCase paths, `{ data }` on success, `ApiError` on failure, input validated through `apiValidator()`, and a `describeRoute()` declaration; never write an error body by hand. **Every route owns its own security**: mounting under `/api` authenticates nothing, so install `auth.required()` and an explicit authorization check on the paths the route owns. Scope middleware to those paths, never `router.use('*', ...)`. A public webhook still verifies a signature, timestamp, or one-time state. Keep domain logic in a service under `server/providers/`. See [server routes](.agents/skills/nocobase-app-development/references/server-routes.md).

**Learn the available endpoints from the API document instead of reading route sources.** The running application serves it at `<APP_BASE_PATH>/api/swagger`, readable with a signed-in session or an `x-api-key` the user gives you; ask the user for a key rather than creating one, and fetch it again after registering a plugin or changing a Collection. See [the API document](.agents/skills/nocobase-app-development/references/http-api.md#api-documentation).

### Database

Schema changes are migrations under `database/main/migrations/`; required data is a seed under `database/main/seeds/`. **A migration is immutable history and must be self-contained**: spell out every field, index and constraint, never import an evolving definition, and write `down` as the explicit reverse. Edit an existing migration only while the branch that introduced it is unmerged; once merged, every correction is a new migration. The exported `name` must match the filename. Never edit `database/<connection>/collections/`; it is regenerated. Read [migrations and seeds](.agents/skills/nocobase-app-development/references/migrations.md), [database and data access](.agents/skills/nocobase-app-development/references/database-and-data.md) and [database connections](.agents/skills/nocobase-app-development/references/database-connections.md).

### User-facing text

Every string a user reads goes through a translation key. Write the application's copy in `client/locales/en-US.ts` and `zh-CN.ts`, never in `client/locales/system/`, which a template upgrade replaces; extend a shared group by spreading it first. To reword a plugin's string, add an `overrides` block keyed by that plugin's package name in your locale file; do not edit the plugin. See [frontend copy](.agents/skills/nocobase-app-development/references/frontend/references/i18n.md) and [internationalization](.agents/skills/nocobase-app-development/references/i18n.md).

### The command line

`pnpm nocobase <topic> <command>` runs this application's CLI; only `pnpm dev`, `pnpm build`, `pnpm start` and the quality scripts are scripts. Read [the command line](.agents/skills/nocobase-app-development/references/cli.md) before running a command: `db reset`, `db rollback`, `db redo` and `db repair` refuse to run without `--force` outside a terminal, and that refusal is not something to work around. Commands this application owns live in `cli/commands/`; see [adding an application command](.agents/skills/nocobase-app-development/references/commands.md).

### Dependencies

Put a package your **server** code (`server/`, `database/`, `cli/`) imports in `dependencies`, and everything your **client** code imports — along with build tooling, tests, and type-only imports — in `devDependencies`. Keep `@nocobase/db` in `dependencies` alongside the database driver. Remove a direct `@nocobase/*` dependency only with `pnpm nocobase package remove` after reviewing its usage. See [where to declare a dependency](.agents/skills/nocobase-app-development/references/dependencies.md).

### Plugins

**Read a plugin's Skill before building what it already does.** Building a permission system, a notification sender, or a job scheduler by hand when a registered plugin already provides one is the most expensive mistake available here. Register and update plugins with `pnpm nocobase plugin register` and `pnpm nocobase plugin update`; customize a plugin's page through its options, a source extension or `client/route-overrides.ts`, never by redeclaring its route. `.agents/skills/` is generated output; never edit a file there. See [plugins](.agents/skills/nocobase-app-development/references/plugins.md).

### Running the application

When reporting or opening this application's address, use the `Local:` URL printed by `pnpm dev`, including the application base path, and never infer it from defaults or Vite's port. See [the development server](.agents/skills/nocobase-app-development/references/dev-server.md) for restarts, file watching and developing against another backend.

### Before you finish

Scope all verification — formatting, lint, type checking, tests, builds and runtime checks — to the affected files, projects, or packages and their affected consumers. Do not run full-application or workspace-wide checks, or an aggregate `pnpm check`, as a routine step after each edit. Documentation-only changes need formatting and link checks for the changed documents, not type checking, runtime tests, or builds. Report which checks ran, their scope, and any unverified behavior.

Add tests for what you changed — a route's authenticated, unauthenticated, and unauthorized responses; a migration's `up` and `down` against a real database; a page's actual behavior — in `tests/`, never beside the source; browser tests go in `tests/playwright/`. Start page tests from `tests/components/page-harness.test.tsx`, which keeps application hooks real and supplies external responses through the test fixture. See [testing and verification](.agents/skills/nocobase-app-development/references/testing.md).

For any UI work, start with [the frontend workflow](.agents/skills/nocobase-app-development/references/frontend/ui-workflow.md), which decides the workflow and routes to the styling rules, the theme token contract and the rest.

## Changing the framework structure

`client/routing/`, `client/layouts/`, `client/theme/`, the server entry points, the `package.json` scripts that call `nocobase`, and the tsconfigs are the scaffolding the template provides. It is still this application's own source — it shipped to the user and they may change it — but it is the part the template evolves, so an edit there is what a future upgrade has to reconcile.

Prefer the mechanism the system already provides. Declare a page in `client/routes.ts` and add `navigation` when it needs a menu entry; pages load data through `useApiClient`. A page uses `authz` to restrict access; a plugin page is customized through an option or an override. Before editing the shell to add a menu, check the route and its `navigation` declaration.

When the built-in mechanism genuinely cannot express what is being asked, changing this structure is a legitimate answer — not a last resort to apologize for. Do it deliberately, and leave the next agent enough to work with:

- Comment what you changed and why the built-in path did not fit. On upgrade, an agent reconciling the template's version needs to know whether your change is still needed.
- Record what the next agent needs to know in the matching `.agents/rules/` file, or a new one linked from the index below, so the guidance describes the application as it actually is without growing this file. If the framework's shared guidance is wrong for every application, update the source `@nocobase/app-skills` package instead of editing its synchronized copy.

## Index

| Read                                                                   | When                                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [.agents/rules/components.md](.agents/rules/components.md)             | Adding or changing a component, a shadcn primitive, a UI Library item, or the visual design                  |
| [.agents/rules/shell.md](.agents/rules/shell.md)                       | Changing layouts, the header, sidebar, breadcrumbs, the account menu or loading indicators                   |
| [.agents/rules/build-and-deploy.md](.agents/rules/build-and-deploy.md) | Changing the build, packing a deployment, the Docker image, `CDN_BASE_URL`, or building for another platform |

## Visible and manageable role assignments

Assign application business roles to explicitly identified users through the prepared User management role-assignment UI. Never seed a business permission set onto `authenticated:*`, broaden the inherited platform `member` role, or write startup reconciliation that grants access to everyone merely to make a feature usable. Unchecked actions in one role do not revoke grants inherited from another. If the user explicitly requests a global default role, first deliver a permission-protected administration control that shows its recipients and allows changing or removing the assignment; show inherited roles and their source in user access details. Without that UI, use explicit user assignments and explain the limitation. Keep page access independent from business operations.

Run `pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts` after permission initialization changes and before delivery. It boots the real application on an isolated database and inspects initialized wildcard assignments and the inherited member role. Keep this test in generated applications. An intentional global default requires explicit user authorization, a working administration surface and corresponding acceptance tests before deliberately updating the expected baseline; do not delete, skip or loosen the guard to make tests pass. Test an ordinary user with only the configured role: inspect all effective grant sources and verify both hidden buttons and rejected direct API calls.
