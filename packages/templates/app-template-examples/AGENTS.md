# Examples Application Development Guidelines

This is a NocoBase 3 application. Do not apply globally installed NocoBase 2 Skills. You are building the application itself — its pages, its API, its database tables. Everything under this directory is application-owned source code that you may edit directly.

Do not create a plugin to add a feature. Plugins are separately published packages for capabilities shared across several applications; building one for this application's own feature adds a package boundary, a version, and a release process to work that belongs in `client/` and `server/`. Create one only when the user explicitly asks for a reusable published package.

## Examples template scope

This application is based on `@nocobase/app-template-default` and provides runnable learning examples. Its homepage catalogs the registered demonstrations; article management is application-owned. Reusable plugin examples stay in `packages/examples/` in the source workspace. Keep framework changes aligned with Default and Hub; keep demonstration content and branding local. Use a separate configuration and database, never copy Default's runtime state.

Examples retains Default’s Users and API Keys integration alongside its demonstrations. Users lists direct Authorization Permission Sets as application roles; authenticated default access remains separate. API Keys is configured in both authentication factories and mounted under Settings. Keep these product integrations aligned with Default.

## Load the development skills

`pnpm install` runs `pnpm nocobase skills sync` through the application's `postinstall` hook. If `.agents/skills/nocobase-app-development/` is missing, install dependencies from the application root; if install scripts were disabled or synchronized Skills are stale, run `pnpm nocobase skills sync` explicitly.

`.agents/skills/nocobase-app-development/` holds the detailed guidance behind this file. Read its `SKILL.md` first — it routes to the reference that matches your task instead of making you read everything:

| Task                                                         | Reference                            |
| ------------------------------------------------------------ | ------------------------------------ |
| Any frontend change: pages, routes, components, styles, copy | `references/frontend/ui-workflow.md` |
| Add an HTTP endpoint                                         | `references/server-routes.md`        |
| Name an endpoint, shape its response or errors, validate it  | `references/http-api.md`             |
| Read or write data                                           | `references/database-and-data.md`    |
| Change the schema                                            | `references/migrations.md`           |
| Switch or add a database connection                          | `references/database-connections.md` |
| Translate server-produced text or add a language             | `references/i18n.md`                 |
| Add a service, background job, or scheduled task             | `references/services-and-jobs.md`    |
| Write tests and verify                                       | `references/testing.md`              |

Read the one page your task needs, not the whole directory.

`.agents/skills/nocobase-app-upgrade/` is a separate Skill for a separate job: merging a newer release of the template this application was generated from. Read it when the task is upgrading the template rather than building a feature, and read it before touching anything — an upgrade done by copying the newest template over this application destroys the work that made it this application.

`.agents/skills/nocobase-deployment/` covers moving this application from source to a production server or a Hub: building for the target platform, what the archive does and does not carry, migrations and business data, production configuration, workflow artifacts after a production build, and what to verify afterwards. Read it before building for deployment, and when an application starts in production but does not work.

## Where things go

Business code goes in these places. This is where you work, and where you should stay unless the task genuinely requires otherwise:

```text
client/routes.ts          Declare a page route
client/pages/             The page component; a folder when a page has children or files of its own
client/components/        Your components
client/components/ui/     shadcn/ui primitives; add with the CLI, never hand-write or edit
client/hooks/             Hooks shared across features
client/locales/           Every user-visible string
client/service-provider.ts Client startup: services that boot with the application
server/routes/            HTTP endpoints
server/providers/         Services and their lifecycle
database/main/migrations/      Schema changes
database/main/seeds/           Required initial data
database/main/collections/     Generated Collection artifacts; regenerate, never edit
database/externalCrm/metadata/   <name>.json per Collection: the external CRM's hand-written metadata
cli/commands/             Commands this application owns
tests/                    Tests; never beside the source
```

A page with children or page-local helpers uses a folder with `index.tsx`; child folders mirror route paths. Keep page-local components and data in that folder, reserving `client/components/` for application-wide components. See [child routes](.agents/skills/nocobase-app-development/references/frontend/references/child-routes.md) for examples.

A feature with a page and an API touches five places: a migration for the table, a route in `server/routes/`, a page in `client/pages/` declared in `client/routes.ts`, navigation on the page route, and strings in `client/locales/`.

`client/runtime.ts` composes the browser application; `client/react-providers.ts` declares React providers in outer-to-inner layers `root`, `application`, and `extension`. Applications use the first two and plugins own the last; `before` and `after` order providers only within their layer.

`server/runtime.ts` composes configuration, plugins, providers and routes; `server/app.ts` assembles the application. `server/standalone.ts` starts the Node listener and `server/embedded.ts` lets a host mount the same runtime. Register endpoints through `server/routes/index.ts`; queue consumers and background jobs are registered from a service provider, not discovered from a directory. Editable module defaults live in `server/config/` and are collected by `defaultAppConfigs` in its `index.ts`; `server/config.ts` loads the configuration file. Each section declares the environment variables that set it in `env` of its `defineAppConfig`; `pnpm nocobase config env` lists them all.

### The rest is framework structure

Layouts own breadcrumb route context; `AppRouter` selects routes and layouts. See [pages and routes](.agents/skills/nocobase-app-development/references/frontend/references/page.md) for each layout's scope.

`client/layouts/components/layout-header.tsx` is a presentation container accepting children. The sidebar is shadcn's Sidebar: `components/app-sidebar.tsx` wraps its provider, desktop icon mode and phone sheet, and `components/navigation-menu.tsx` draws the permission-filtered route tree with `SidebarMenu*` and controlled `Collapsible` sub-menus. Leave `client/components/ui/sidebar.tsx` as the shadcn CLI writes it and customize from outside: widths go through the provider's `style` in spacing units, the phone sheet is rendered in `app-sidebar.tsx` with a translated title, and the provider's Ctrl/Cmd+B shortcut is stopped at `document`. App, Settings and Dev layouts own menus, branding, permissions and redirects. Desktop icon mode shows leaf labels as zero-delay tooltips and opens groups in hover and keyboard-focus popovers, preserving filtered navigation, parent-page links, nested groups and the selected group's highlight. Keep this behavior aligned across layouts. Desktop collapse state is shared through `useSidebarPreference` at `nocobase:sidebar:collapsed` across applications on the same origin; whether the phone sheet is open stays local to each layout.

The Settings header entry appears only when the user has an accessible page in the settings navigation, and stays visible on that page. The header reads the registered settings tree through `useClientApplication().runtime.settingsRouteTree`, reusing the application context. The Dev tools entry stays visible on its destination pages, is development-only, and must remain absent from production builds.

`client/routing/`, `client/layouts/`, `client/theme/`, the server entry points, the `package.json` scripts that call `nocobase`, and the tsconfigs are the scaffolding the template provides. It is still this application's own source — it shipped to the user and they may change it — but it is the part the template evolves, so an edit there is what a future upgrade has to reconcile.

Prefer the mechanism the system already provides. Declare a page in `client/routes.ts` and add `navigation` when it needs a menu entry. Refine resources add no menu entries and, with no data provider registered, load nothing; pages load data through `useApiClient`. A settings page uses `authz` to restrict access; a plugin page is customized through an option or an override. Before editing the shell to add a menu, check the route and its `navigation` declaration.

When the built-in mechanism genuinely cannot express what is being asked, changing this structure is a legitimate answer — not a last resort to apologize for. Do it deliberately, and leave the next agent enough to work with:

- Comment what you changed and why the built-in path did not fit. On upgrade, an agent reconciling the template's version needs to know whether your change is still needed.
- Update this file in the same change, so the guidance describes the application as it actually is. If the framework's shared guidance is wrong for every application, update the source `@nocobase/app-skills` package instead of editing its synchronized copy.

## Building a feature

### Pages and routes

Declare the route in `client/routes.ts` and keep the page component behind a lazy `componentLoader`. The loaded module must default-export the component.

```ts
const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders.js'),
  },
]);
```

Route paths are application-internal. Never write the deployment base path such as `/main` into one — the runtime restores it.

`auth` controls browser navigation only: `required` for signed-in pages, `guest` for sign-in and registration, `optional` for pages that work either way. It is not server security. An endpoint the page calls enforces its own authentication independently.

Use `defineSettingsRoutes()` for administrative pages, which mount under `/settings`, and `defineDevRoutes()` for development-only pages, which mount under `/dev` and are absent from a production build. Do not repeat `/settings` or `/dev` in the path. `defineDevRoutes()` is a build boundary, not a permission boundary: a page that must be restricted in production is a settings route with `authz`, enforced by the server.

**Declare navigation on the route.** App, Settings and Dev menus read `navigation: { title: 'navigation.orders' }`; titles resolve in the owning locale namespace. Add the translation in `client/locales/`. Refine resources do not add menu entries.

Use recursive groups to organize menus; their path is optional. Pages may also have children, but must manually render `Outlet`. For URL-addressable dialogs and drawers, declare the child in `defineAppRoutes()` in `client/routes.ts`, place the owning page's `Outlet`, then render `RouteDialog` or `RouteDrawer`. A child page of its own — a record's page, a form too long for a dialog — returns `RouteChildPage` around its `PageContainer`; only tab content renders inline, and a child route that returns a bare `PageContainer` renders below the parent's content instead of covering it. Call `useRouteOverlay()` only from a descendant rendered inside the overlay, including its footer, never from the page returning the wrapper. A record opens over the page the user is on: a dashboard or a board that shows records declares their drawer under its own route instead of linking to the list's, and a row menu's Edit opens its own dialog rather than the one stacked on the drawer. On a page with tabs the user is on the tab being shown: an overlay the page's header opens is declared under every tab and linked through the current tab (`` `${tab}/edit` ``, never a bare `edit`, which resolves beside the tabs), so it stacks on that tab and closing returns to it. Read `.agents/skills/nocobase-app-development/references/frontend/references/overlay.md` before implementing overlays or close guards.

Declare `authz` on the first page of every path: `{ resource: { type: 'page', id: 'orders' }, action: 'access' }` for a product page, the page's `settings` item for a settings page, `'unrestricted'` for a page only root may open, or `'skip'`. A nested page that omits it inherits its nearest ancestor page's value, and a child's own value overrides it. A first page that omits it still registers, with a development warning: protected App and settings pages become unrestricted-only, which hides them from everyone but root, while guest, optional and dev pages skip the check. Always declare it rather than relying on that default. Parent guards still apply when a child skips. Menus and loaders read the declared rule; endpoints enforce authorization independently. The page id identifies stored page grants, so changing it requires migrating the grants that reference it.

### Components and styling

Use shadcn/ui for UI. The template ships only the primitives its shell, compositions and example pages use: `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `field`, `input`, `label`, `popover`, `select`, `separator`, `skeleton`, `spinner`, `table`, `textarea`, `toast`, `toggle`, `toggle-group` and `tooltip`. Check `client/components/ui/` first; if the primitive is not there, add it from the shadcn registry rather than writing your own. `yes n |` answers "no" when the CLI offers to overwrite a primitive that is already installed; without an answer, a non-interactive run stops at that question. Format the files it created and translate the English a few primitives carry, as `.agents/skills/nocobase-app-development/references/frontend/references/shadcn.md` lists; otherwise keep them as the CLI writes them:

```bash
yes n | pnpm exec shadcn add card
pnpm exec prettier --write client/components/ui/card.tsx
```

Build your own components by composing these primitives, and put them in `client/components/`. A page below another one — a covering child page, a record's own page — leaves by `BackButton` (`client/components/back-button.tsx`) above its heading; `Breadcrumbs` replaces it only when the user asks for breadcrumbs.

`PageContainer`, `PageHeader`, `RouteDialog`, `RouteDrawer`, `RouteChildPage`, `useRouteOverlay` and `BackButton` in `client/components/` come from the NocoBase UI Library, as do the authentication blocks in `client/extensions/nocobase-auth-forms/`, `nocobase-auth-methods/` and `nocobase-auth-split-layout/` that `client/pages/auth/` composes; like the rest of the source, they belong to the application. `yes n | pnpm exec shadcn add @nocobase/<item>` adds another item from the library: a single component lands in `client/components/`, a complete feature in `client/extensions/nocobase-<item>/`. A table and a date field come from it too, added before the first page that needs one rather than written from scratch: `@nocobase/data-table` adds `DataTable` with `DataTableColumnHeader`, `DataTablePagination` and `DataTableViewOptions` in `client/components/data-table/`, and `@nocobase/date-picker` adds `DatePicker` and `DateRangePicker` in `client/components/date-picker.tsx`, or `@nocobase/date-time-picker` for a time as well. The CLI adds the packages an item needs to `dependencies`: move the new ones, such as `@tanstack/react-table`, to `devDependencies`, as "Adding a dependency" below explains for everything client code imports, but leave `@nocobase/i18n` in `dependencies`, where the server needs it, and put back the `^` of its range, which the CLI pins.

**Look components up in the shadcn skill.** The development Skill carries the shadcn/ui skill, unchanged from shadcn 4.21.0, in `.agents/skills/nocobase-app-development/references/frontend/shadcn/`. Read `references/frontend/references/shadcn.md` first: it routes to the skill's rules and states where this application departs from them, among others `pnpm exec shadcn` instead of `npx shadcn@latest`, no `shadcn apply` or `--preset`, and create, edit and detail as `RouteDialog` or `RouteDrawer` child routes rather than a `Sheet`. `pnpm exec shadcn docs <name>` gives one primitive's documentation and examples for the Base UI version. For a whole page, start from the worked example that `references/frontend/references/example.md` indexes.

Style with the semantic Tailwind tokens — `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary` — so pages follow the light and dark themes. Do not hard-code colors like `bg-white` or `text-gray-900`; they break the moment someone switches theme.

**Visual consistency is a whole-application property.** Match the surrounding code's spacing, typography, and component choices. If a change genuinely calls for a different look, change the application's design tokens in `client/theme/themes/*.css` so every page moves together. Never restyle only the part you are working on — a page that looks different from the rest is a defect, not a customization.

### Server routes

`defineApiRoutes()` mounts under `/api`, and `defineRootRoutes()` mounts at the root for callbacks and webhooks. Do not repeat `/api` in the path. Each route factory creates and returns its own Hono router.

```ts
export const apiRoutes: AppApiRouteContribution<Application> = defineApiRoutes(
  (app) => {
    const router = new Hono();
    const auth = app.container.resolve(authenticationToken);

    router.use('/orders', auth.required());
    router.get(
      '/orders',
      describeRoute({
        tags: ['Orders'],
        summary: 'List orders',
        operationId: 'listOrders',
        responses: {
          '200': listResponse(OrderSchema),
          // A session but no permission check; the query validator adds the 400.
          '401': apiErrorResponse(401),
          '500': apiErrorResponse(500),
        },
      }),
      apiValidator('query', ListOrdersQuery),
      async (context) =>
        context.json(await listOrders(context.req.valid('query'))),
    );

    return router;
  },
);
```

**Every `/api` route follows the HTTP API design** in `.agents/skills/nocobase-app-development/references/http-api.md`: camelCase paths, `{ data }` on success, `throw new ApiError(...)` from `@nocobase/app-server/router` on failure, input validated with zod through `apiValidator()`, and a `describeRoute()` declaration for the API document, all from `@nocobase/app-server/router`. Never write an error body by hand.

**Every route owns its own security.** Mounting under `/api` does not authenticate anything. Install `auth.required()` on the paths the route owns, and add `authorization.middleware()` with an explicit `resource`/`action` check when the operation needs permission rather than just identity. Never rely on middleware from another route or on the order routes happen to be registered in.

Scope middleware to the exact paths you own, or to an isolated sub-router mounted at your prefix. A `router.use('*', ...)` leaks into contributions mounted later.

A webhook that a third party calls cannot use a login session, so it is deliberately public — but public still means verifying a signature, timestamp, or one-time state, and testing that anonymous requests without a valid signature are rejected.

Keep HTTP concerns in the route and domain logic in a service under `server/providers/`. Services do not read Hono contexts, return HTTP status codes, or decide retry behavior.

Bind services to their existing tokens in a provider's `register()`; calling `createServiceToken` twice with the same name creates different keys. Do not connect to databases, start workers, or execute route factories at module top level. Acquire long-lived resources in `start()` and release them in `shutdown()`. Providers and routes read typed configuration rather than `process.env`.

### API documentation

The running application serves an OpenAPI 3.1 document of every `/api` route it has — its own, every registered plugin's, the data endpoints and Better Auth's `/api/auth/...` — at `<origin><APP_BASE_PATH>/api/swagger` (JSON), with Swagger UI at `<origin><APP_BASE_PATH>/api/swagger/docs`. Locally that is `http://127.0.0.1:13000/main/api/swagger/docs`, with `/main` replaced by the actual `APP_BASE_PATH`.

Reading either needs a signed-in session or an API key: open the Swagger UI in a browser where you are signed in, or send a key in `x-api-key`. A user creates keys at `<APP_BASE_PATH>/settings/api-keys`; the `nocobase-app-plugin-api-keys` Skill covers the plugin. Without a valid credential the routes answer `401` with reason `API_DOCS_UNAUTHENTICATED`, and an application with no access check registered, such as one without the authentication plugin, answers `404`.

```bash
curl -H "x-api-key: <key>" http://127.0.0.1:13000/main/api/swagger
```

**Learn the available endpoints from this document instead of reading route sources.** Before calling an endpoint or building on one, fetch the JSON with a key the user gives you and find the operations by `tags` or `operationId`; read the source only for what the document does not say. Fetch it again after registering a plugin or changing a Collection.

Every `/api` route the application writes declares itself, as in the example above: `tags`, an English `summary` and a unique camelCase `operationId`; input through `apiValidator()`; responses through `dataResponse()`, `listResponse()`, `emptyResponse()` and `apiErrorResponse(status)` for exactly the statuses the route can produce. Do not list `400` for input validation: a route that uses `apiValidator` gets the `400` automatically. List `400` yourself only for another reason, such as a failed precondition. `apiErrorResponses` is `401`, `403` and `500`, for an authenticated route with a permission check; otherwise list each status the route can return with `apiErrorResponse(code)`. Response schemas live in `server/routes/schemas.ts`, typed against what the service returns. A route reached without a credential adds `security: []`. Hide a route with `describeRoute({ hide: true })` and a comment only for the few reasons `references/http-api.md` lists. Data endpoints are documented without a declaration; a field a data exposure adds to every record goes in its `computedFields`. A test starting the application expects `findUndeclaredApiRoutes()` and `findApiDocumentSchemaProblems()` to be empty; `.agents/skills/nocobase-app-development/references/testing.md` shows it.

### Database

Schema changes are migrations under `database/main/migrations/`. Data the application requires to run is a seed under `database/main/seeds/`. Seeds never create structure.

Declare database defaults with `export default defineAppDatabaseConfig((runtime) => ({ connections }))`. Before provider registration, the runtime asynchronously imports configured official drivers; explicit `drivers` registrations override them. Keep `isolatedDeclarations: false` for application server declarations so configuration and connection fields retain inference. See `.agents/skills/nocobase-app-development/references/database-connections.md`.

`database/<connection>/collections/` holds what the database currently resolves each Collection to — `collection.json`, `metadata.json` and `schema.json` per Collection plus a `_manifest.json` — written by `pnpm nocobase collections generate`, which `db apply`, `db redo`, `db rollback`, `db reset` and `pnpm dev` run for every connection whose migrations they change. Every file there is derived, for every connection: the directory is gitignored, safe to delete, and never read back. Edit a managed connection's metadata through migrations or the Collection Metadata Service. An `external` connection's metadata is written by hand in `database/<connection>/metadata/<name>.json` — one metadata document per Collection, committed and read at startup — and regenerating picks it up. Never import any of these files from a migration. `pnpm nocobase collections generate --check` fails when they are out of date.

```ts
const migration: MigrationDefinition = defineMigration({
  name: '202609020001_create_orders',
  async up({ builder }) {
    await builder.createCollection('orders', (collection) => {
      collection.increments('id');
      collection.string('reference', { length: 64, nullable: false });
      collection.datetime('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('orders');
  },
});
```

**A migration is immutable history and must be self-contained.** Spell out every field, index, and constraint in the migration itself. Never import a collection definition, model, or registry that keeps evolving — doing so silently changes what an already-applied migration means. Write `down` as the explicit reverse in a safe dependency order.

Edit an existing migration only while the branch that introduced it is unmerged. Once merged, every correction is a new migration. Editing one that has already run changes nothing on its own: it is recorded as executed, so `pnpm nocobase db apply` skips it. Run `pnpm nocobase db redo` to roll the latest batch back and apply it again from the corrected source. Editing it also makes its recorded checksum stop matching; a run reports that as a warning and keeps going, `onChecksumMismatch: 'error'` makes it refuse, and `pnpm nocobase db repair` realigns the history for a change that leaves the schema identical — a reformat or a comment — never for one the database has not received. `pnpm nocobase db reset` starts over from an empty schema when the batch cannot be rolled back, and takes every row with it.

The exported `name` must match the filename. Apply with `pnpm nocobase db apply` and verify against a real database.

At runtime, resolve `databaseManagerToken` from the container and use `database.query()` to read and write the default connection. Use `database.query('analytics')` for another connection. Application tasks use `database/<connectionName>/{migrations,seeds}` and bind to that connection explicitly; plugin tasks and default runtime access stay on `database.default`. Only managed connections run migrations or seeds. See the migrations reference for execution and upgrade rules. An `external` connection such as `externalCrm` reads a database another system owns: write its supplemental metadata by hand in `database/<connectionName>/metadata/<name>.json` (`database/<connectionName>/collections/` is the generated cache), never write migrations for it, and expose it read-only unless the owning system has agreed otherwise.

### User-facing text

Every string a user reads goes through a translation key. `client/locales/en-US.ts` states the wording and derives the shape that other locales are checked against, so a missing key in `zh-CN.ts` is a compile error. The sign-in pages' copy lives there too, under `auth.*`: the authentication components take their text as props, which the pages in `client/pages/auth/` translate.

```tsx
const { t } = useTranslation();
t('orders.title');
```

To reword a plugin's string, add an `overrides` block keyed by that plugin's package name in your locale file. Do not edit the plugin.

The languages the application offers are its own locale files, not a configured list, and the two sides are read separately: `client/locales/` decides what the picker shows, while `server/locales/` decides which languages the server can answer in. Prefer adding a language to both when server-produced text needs translating, but a client-only language is valid: the interface switches normally and the server falls back to English with an informational notice. `pnpm nocobase locales check` reports one declared on a single side and exits nonzero until the lists align; that check does not block the runtime switch.

The account menu language control in `client/layouts/components/language-switcher.tsx` uses a shadcn submenu with radio items. Render it inside `DropdownMenuContent` to preserve menu keyboard navigation and selection semantics.

## Development file watching

Changes to `.env` and `.env.local` (including creation, atomic replacement, and deletion) restart the full development run after its previous processes exit. The new run reloads environment files, ports, proxy settings, and startup hooks; explicit shell variables still take precedence. Use the newly printed URL if the port or base path changes. This also applies in proxy mode. `config.yml` changes restart only the local server. `NOCOBASE_STRICT_STARTUP=true` disables both automatic restarts.

Changes to `package.json`, the lockfile, and the package manager's install state restart the local server once they have been quiet for a few seconds. An install writes several of them over as long as fetching and linking take, so restarting on the first write would bring the server back against a half-installed `node_modules` — and the next write would arrive while it was still shutting down, which is where the watcher escalates to SIGKILL. Waiting for quiet turns one install into one restart.

One development server runs per application root; a second is refused with the first one's process id. Nothing else catches it, because the port check advances to the next free port and the duplicate then fails on the migration lock the first server holds, long before it binds anything. `NOCOBASE_DEV_ALLOW_MULTIPLE=true` starts one anyway. A run that only proxies a remote backend does not take the lock, and a lock left behind by a killed run is taken over rather than reported.

`pnpm dev` also shortens the shutdown budget, through `APP_SHUTDOWN_TIMEOUT_MS`, to less than the five seconds the file watcher waits before force-killing the server. The deployment defaults — a 30 second HTTP drain behind a load balancer — would never be reached here, and a force-killed server never releases its migration lock. Set the variable explicitly to override it in either direction.

Tests that start auxiliary Vite servers must use an isolated temporary `cacheDir`, including when their fixture links the application's `node_modules`. Never delete or rewrite a running development server's dependency cache. See the shared application development Skill's `references/testing.md` for cache ownership and recovery.

`pnpm dev` checks native file watching before starting its children. If watcher resources are exhausted or native events are unavailable, it uses polling for client and server hot updates and disables agent annotations for that run, with a warning. An explicit `CHOKIDAR_USEPOLLING=true` selects the same mode. Configuration files use stat polling so atomic saves and newly created files restart the server without native directory watchers.

Vite must exclude the application's entire `dist/` tree from development file watching. Its default exclusion covers only `dist/client`; watching the compiled server and vendored packages can cause `EMFILE` after a build. Keep the exclusion scoped to this application so linked workspace dependencies, including their `dist/` files, still receive hot updates.

## Developing against another backend

Do not hard-code `/main` from the examples below. It is only the fallback for an unset `APP_BASE_PATH`. Local development resolves that variable from the command-line environment, then `.env.local`, then `.env`. The remote mount path is independently supplied in `PROXY_TARGET_URL`: inspect the target application's actual public URL instead of assuming it matches the local path. For example, `APP_BASE_PATH=/local PROXY_TARGET_URL=http://127.0.0.1:13000/crm pnpm dev` forwards local `/local/api` and `/local/ws` to remote `/crm/api` and `/crm/ws`.

Use `PROXY_TARGET_URL=https://backend.example.com/main pnpm dev` to run only the local Vite client against another application's API and WebSocket service. The URL is the remote application base, including its mount path, without `/api`. Open the printed Local URL. The local server and server watchers are skipped; `beforeDev` hooks still run. Requests, including writes, affect the target backend. See README.MD for path mapping and authentication requirements. Leave the variable unset for normal full-stack development.

The development proxy adapts same-origin HTTP and WebSocket Origin headers to the target origin, and maps same-origin Referer paths to the target app base. Other origins remain unchanged and missing Origin headers are not added. Keep backend origin checks enabled; this adaptation belongs only to Vite development, not production deployment. Production uses `APP_PUBLIC_ORIGIN` and a reverse proxy that preserves the public Host and protocol.

`APP_SERVER_PORT` selects the local application entry port: Vite in proxy development mode (default 5173), or the local backend in normal development mode (default 13000). Normal development keeps Vite's preferred port at 5173. An occupied port advances to the next available port; use the printed Local URL. This variable does not change the backend URL supplied through `PROXY_TARGET_URL`.

## The command line

`pnpm nocobase <topic> <command>` runs this application's CLI, the `nocobase` bin of `@nocobase/app-cli`. Only `pnpm dev`, `pnpm build`, `pnpm start` and the quality scripts are scripts; every other command goes through `pnpm nocobase`, with no script alias. `pnpm nocobase --help` lists the tree and `--help` on a command gives its flags.

Before running a command, read `.agents/skills/nocobase-app-development/references/cli.md`: it maps tasks to commands, explains the data-model snapshot under `database/<connection>/collections/`, and states the flags an agent must not add on its own — `db reset`, `db rollback`, `db redo` and `db repair` refuse to run without `--force` outside a terminal, and that refusal is not something to work around.

A command this application owns is a file under `cli/commands/` whose path is its name below the `app` topic: `cli/commands/sync-orders.ts` answers to `pnpm nocobase app sync-orders`. Each extends `AppCommand` from `@nocobase/app-cli`: it returns its result, throws `CommandError` on failure, and gets `--json` for free. A command that needs the application creates it with `this.withApp(async ({ app }) => …)`, which always shuts it down again; work users trigger while the application serves is a server route or a job, not a command. The `nocobase-app-development` Skill's reference on adding an application command covers the file layout, the directory names to avoid, the output contract and testing.

`cli/` is compiled into `dist`, and a deployment runs the same CLI without the development commands as `node dist/cli/index.js <topic> <command>`. Change shared behavior in `@nocobase/app-cli` rather than copying it into the application; use plugin build and dev hooks for local build and development extensions.

## Plugins

Plugins are registered in `client/plugins.ts`, `server/plugins.ts`, and `cli/plugins.ts`. Presence in the array enables a plugin and array order is contribution order. A plugin appears in the roots matching what it ships, so a plugin with only commands is listed in `cli/plugins.ts` alone. Bulk Skills synchronization and plugin updates discover plugins from these composition roots.

Let `pnpm nocobase plugin register` and `pnpm nocobase plugin unregister` add and remove entries. Edit these files by hand only to reorder entries or to pass a plugin its options.

Update one registered plugin with `pnpm nocobase plugin update @nocobase/app-plugin-authentication`, or omit the name to update all registered plugins. Prefer the full package name; `authentication` is also accepted as a short name. The name is a positional argument, not `--plugin`. Use `--dry-run` to preview. With pnpm, updates stay within declared version ranges; after a successful update, all registered plugin Skills are re-synchronized. See [Plugins in the README](README.MD#plugins) for examples and update scope.

To customize a page a plugin owns, pass an option on its registration, add a source extension under `client/extensions/*/extension.ts`, or add an entry to `client/route-overrides.ts`. Do not redeclare the plugin's route — a duplicate `/install` is a conflict, not a customization. An override replaces only `componentLoader`; route identity, path, and auth mode stay with the plugin. One route takes one override across all three mechanisms. Authentication pages are not plugin-owned: `/login`, `/register`, `/forgot-password`, and `/reset-password` are application routes declared in `client/routes.ts`.

Route overrides must stay lazy, declare a `componentEntry`, and load a default-exported component. Authentication pages in `client/pages/auth/` use relative links and the authentication plugin's `client/actions` hooks; do not call authentication endpoints directly or create a second session store.

### Read a plugin's Skill before building what it already does

**You are not starting from scratch.** This application ships with NocoBase packages that already solve whole categories of requirement, and packages may publish a Skill explaining how to use them. `pnpm nocobase skills sync` copies Skills from direct `@nocobase/*` dependencies and registered plugins into `.agents/skills/`. Before implementing a feature, check whether an installed and registered plugin already covers it:

| The requirement sounds like                                                                       | Read the Skill for                    |
| ------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Approvals, multi-step processes, "when X happens then Y", business rules that outlive one request | `@nocobase/app-plugin-workflow`       |
| Email, IM, or in-app messages; notifying someone that something happened                          | `@nocobase/app-plugin-notification`   |
| Roles, permissions, "user A may only see their own records", field-level or row-level access      | `@nocobase/app-plugin-authorization`  |
| Sign-in, registration, sessions, password reset                                                   | `@nocobase/app-plugin-authentication` |
| User administration and application-owned role assignment                                         | `@nocobase/app-plugin-users`          |
| File upload and metadata through Repository                                                       | `@nocobase/app-plugin-file`           |
| Translated text and language switching                                                            | `@nocobase/app-plugin-i18n`           |

Run `pnpm nocobase skills sync` if `.agents/skills/` is missing or looks out of date, then read the Skill for the plugin you need. It documents that plugin's public entries, the ownership boundary, and how to verify the result — which is faster and more correct than inferring an API from its source.

Building a permission system, a notification sender, or a job scheduler by hand when a registered plugin already provides one is the most expensive mistake available here. Prefer the plugin; write your own only when you have read its Skill and confirmed it genuinely does not fit.

`.agents/skills/` is generated output: gitignored, and every synchronized package-owned directory is replaced wholesale on the next sync, so never edit a file there. The same sync mirrors each synchronized directory into `.claude/skills/` as a symbolic link, because Claude Code discovers skills only there; that mirror is generated and gitignored too. Put application-specific guidance in committed `AGENTS.md` files.

## Removing a NocoBase dependency

Before removing a direct `@nocobase/*` dependency, search application imports, Client/Server/CLI plugin registrations, routes, services, configuration, tests, and build scripts for its package name and public contracts. Migrate or delete those references first. The command below changes dependency metadata and generated Skills; it does not edit application source or configuration, so never use it to remove a capability the application still needs.

Use `pnpm nocobase package remove @nocobase/example`. It invokes the application's package manager so `package.json` and the lockfile stay consistent, then deletes only synchronized Skills recorded as belonging to that package. For an `@nocobase/app-plugin-*` package it delegates to the plugin unregister workflow, removing its Client, Server, and CLI registrations together; `pnpm nocobase plugin unregister <name>` remains a supported plugin-specific entry point. Preview with `--dry-run`, and use `--json` when another tool needs structured output.

After an interrupted or manual removal, first confirm the manifest no longer declares the package, then run a full `pnpm nocobase skills sync` to reconcile stale package-owned output. `package remove` may also be passed a package already absent from the manifest to clean recorded historical Skill ownership, and it must not uninstall or clean Skills owned by another package.

## Adding a dependency

Keep `@nocobase/db` in `dependencies` alongside the database driver. It supplies the driver's runtime peer and lets TypeScript resolve the inferred database configuration declaration through the public package name. Moving it to `devDependencies` can cause TS2883 in an installed application even while the source workspace builds successfully.

Put a package your **server** code imports in `dependencies`. Put everything your **client** code imports — along with build tooling, tests, and type-only imports — in `devDependencies`.

That split looks backwards until you see how the two halves are deployed. `pnpm build` bundles the client: Vite resolves every client import and inlines it into `dist/client`, so nothing has to resolve it again later. The server is not bundled. `dist/server` keeps its bare imports, and `pnpm build` generates `dist/package.json` from your `dependencies` and installs a `node_modules` next to it — that tree is what the deployed server resolves against, and `devDependencies` are not in it.

So the two mistakes fail in opposite ways. A server import left in `devDependencies` works all through development and fails only on the server, with a bare `Cannot find package` naming nothing that points back here. A client package put in `dependencies` never breaks anything — it is just installed into every deployment, where the server never requires it. That one is invisible, so it accumulates: `lucide-react` and `@xyflow/react` were 44 MB of it before this rule was written down.

What decides it is where the importing file lives and what the import is, not what the package is for. `import ts from 'typescript'` in `server/` is a runtime dependency even though TypeScript sounds like tooling. `import type { Config } from 'x'` is erased before anything runs, so it stays a devDependency wherever it appears. A dynamic `import()` counts — deferring the load changes when a package is needed, not whether.

### Adding a dependency

Which half of the application imports it decides where it goes.

| The import is reached from              | Declare it in     |
| --------------------------------------- | ----------------- |
| `server/`, `database/`, or `cli/`       | `dependencies`    |
| `client/`, build tooling, tests         | `devDependencies` |
| `import type` only, wherever it appears | `devDependencies` |

`dist/package.json` is generated from `dependencies` and is what a deployment installs from, so a server import declared as a devDependency resolves in every development checkout and is absent exactly once — on the deployed server. A client import needs nothing at runtime: Vite resolves and inlines it into `dist/client` at build time.

A plugin's browser packages arrive by a third route and need nothing from you. Plugins declare those as peer dependencies, so installing a plugin brings one shared copy into this application, while `dist/` sets `autoInstallPeers: false` and installs none of them.

`pnpm build` checks the server half: it reads every value import in `server/`, `database/`, and `cli/` and fails the build if any of those packages is missing from `dist/package.json`. It cannot see an import whose specifier is built at run time:

```ts
await import(`${name}/index.js`); // invisible to the check
```

Declare such a package in `dependencies` when you write the code; nothing will remind you later.

### Packing the build for a deployment

`pnpm build --tar` writes `storage/exports/dist.tar.gz` after the build. The archive holds `dist/` as a directory next to `config.example.yml`, so extracting it produces exactly those two paths rather than scattering `server/` and `node_modules/` into whatever directory you unpacked in.

`config.example.yml` travels with it because a deployment has to write a `config.yml` before it can start — `pnpm nocobase config init`, run inside `dist/`, does that from the example, in place, and `pnpm nocobase config check` there verifies it, database connection included, before the first start — and the example is the only statement of what may go in it. Directories of executable shims are left out: a `.bin` entry points at a path on the machine that installed it, and a dangling one makes `pnpm install` in the extracted tree report a corrupt store rather than repair it.

Without `--tar` no archive is produced, which is what you want when the build is only going to be run locally.

### Building a Docker image

`Dockerfile` and `Dockerfile.dockerignore` build this application from its sources: a build stage runs `pnpm install --frozen-lockfile` and `pnpm build`, and a `node:24-bookworm-slim` runtime stage receives `dist/` and `config.example.yml` only. The runtime has no pnpm, so it runs the two `dist/package.json` scripts directly: `start` is `node ./server/standalone.js`, which the image starts as `node dist/server/standalone.js`, and `nocobase` is `node ./cli/index.js`, run as `node dist/cli/index.js <topic> <command>`. The deployment root is `/app`, so configuration is `/app/config.yml` and storage is `/app/storage`, both mounted at runtime.

The client is not tied to a mount path, so `APP_BASE_PATH` is a runtime variable, `/main` in the image unless the container is started with `-e APP_BASE_PATH=<path>`; the health check probes the same path. The build stage runs on `$BUILDPLATFORM` and passes `--target linux-$TARGETARCH`, so a multi-platform build does not compile under emulation; do not move the build stage to the target platform or switch the runtime to Alpine, which would need the musl target. Keep `Dockerfile.dockerignore` beside the Dockerfile: BuildKit reads it only there, and without it `config.yml`, `.env`, and `storage/` enter the build context.

`--build-arg DIST=prebuilt` skips the build stage and packages the `dist/` in the context instead, selected through `FROM dist-${DIST}` so BuildKit never runs the stage it does not use. That stage refuses a `dist/` whose `nocobase.buildTarget` is not linux, glibc, the target architecture and the image's Node major, and one from an `@nocobase/app-cli` that does not record `nocobase.relocatable`, whose client is tied to the path it was built for. The ignore file re-includes `dist/` last and whole, so dependency directories inside it named like excluded paths (`langchain/storage`) survive, and then excludes `dist/.env`, which can carry `DB_PASSWORD` from local `.env` files. Keep those rules in that order.

### Building for another platform

`pnpm build --help` (or `-h`) lists build options and exits without loading build dependencies, running hooks, or modifying `dist/`. Every successful build records `nocobase.buildTarget` in `dist/package.json`, including builds with no native modules: `platform`, `arch`, `libc`, `nodeMajor`, and `nodeAbi`. Use `libc` only for Linux; its value on other platforms is a compatibility placeholder. Deployment checks should compare these fields with the host runtime and also respect `engines.node`. With `--target current` (the default), the Node version and ABI come from the running process; an explicit platform target defaults to Node 24 unless `--node-version` is supplied.

`pnpm build` targets the machine it runs on, so `pnpm build && pnpm start` works. A deployment build says where it is going: `--target linux-x64`, `--target linux-arm64`, `--target linux-x64-musl`, plus `--node-version` when the server's Node major differs. Every build prints the platform it produced and records it in `dist/package.json` under `nocobase.buildTarget`.

A `.node` binary must match the target platform, architecture, and C library; addons using the Node ABI must also match its version. `better-sqlite3` 13 uses N-API and bundles its platform binaries, so cross-platform builds retain the target's binary, including the separate `linuxmusl` build for Alpine. `pg`, `mysql2`, and `tedious` are plain JavaScript, so an application using only those is portable as built.

### When a build or a deployment fails

| Symptom                                                                                 | Cause                                                                        | Fix                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Cannot find module 'x'` on the server, works locally                                   | `x` is in `devDependencies`, which `dist/package.json` is not generated from | Move it to `dependencies`                                                                                                                                                            |
| A browser package will not resolve while building the application                       | A plugin declares it as a peer and nothing provides it                       | Add it to the application's `devDependencies`                                                                                                                                        |
| `Error loading shared library`, `invalid ELF header`, or a bare `.node` path at startup | The binary does not match the server                                         | Compare `require('./dist/package.json').nocobase.buildTarget` with the server's `process.platform`, `process.arch`, and `process.versions.modules`, then rebuild with matching flags |
| `no prebuilt binary for <target>` during the build                                      | The package publishes no build for that combination                          | Check the package supports the target; musl coverage is thinner than glibc                                                                                                           |

Node ABI to major version: 115 is Node 20, 127 is 22, 137 is 24, 147 is 26.

## Before you finish

For each change, scope all verification to the affected files, projects, or packages and their affected consumers. This applies to formatting, lint, type checking, tests, builds, and runtime verification. Run only the checks relevant to the change: use explicit file paths for formatting, lint, and tests; use the owning project's TypeScript configuration for type checking; build only affected packages or supported build targets. In a workspace, use `pnpm --filter <affected-package> <script>`. In a standalone application, use its supported file or project selectors; do not invent flags or bypass project configuration to force a narrower check.

Do not run full-application or workspace-wide checks, or an aggregate `pnpm check`, as a routine step after each edit. If a necessary check cannot be narrowed further, run the smallest supported project or package scope and explain why. Expand scope only when shared code, dependencies, configuration, or a failure gives a concrete reason, or when the user explicitly requests it. After checks pass, repeat them only for further relevant changes or unresolved failures. Documentation-only changes need formatting and link checks for the changed documents, not type checking, runtime tests, or builds.

Report which checks ran, their scope, and any unverified behavior. See the application development Skill's `references/testing.md` for selection examples.

Add tests for what you changed: a route's authenticated, unauthenticated, and unauthorized responses; a migration's `up` and `down` against a real database; a page's actual behavior. Tests belong in `tests/`, or in `e2e/` when they need a real server. Never place a test beside the source it covers.

For any UI work, start with `.agents/skills/nocobase-app-development/references/frontend/ui-workflow.md` (from the application root), which decides the workflow and routes to the rest. Its styling rules are in `references/styling.md` beside it: which semantic Tailwind utilities to use so components respond to theme changes, and how to keep deliberate fixed-size exceptions explicit. The full color, font, size, spacing, radius and shadow token contract, and creating or editing theme presets, are in `references/theme.md`.

Application startup defaults belong in `config.yml`: `i18n.defaultLocale` for the language, and `client.app.defaultColorScheme` and `client.app.defaultTheme` for appearance. Valid browser-local choices take precedence. Which languages the application offers is not configured — its own `client/locales/` and `server/locales/` are that list. See the i18n and themes references.

## Application-owned workflow examples

`workflows/` contains quotation routing, analytics daily reporting, and failure diagnostics. Follow the installed workflow plugin Skill when editing the DSL. Keep each package self-contained: its run modules and relative helpers ship inside its immutable artifact. Resolve shared runtime services through their original public tokens, never through plugin internals.

The report reads the `analytics` connection and saves `exampleDailyReports` in the default application database by date. Quotation routing creates application-owned `quotationReviewTasks` rows keyed by workflow run id; the Workflow menu exposes their human review page, and its authenticated endpoint resumes the Wait node. Each submitted task stores its resume request id, and list/detail APIs query the Wait API for its processing outcome; an accepted receipt is not an applied decision. The detail page polls until the request is consumed or rejected. The summary reads task and reviewer identifiers, the decision, and the comment from `nodeResults.awaitRoutingConfirmation`. These migrations are application-owned; never seed workflow definitions or execution history. The diagnostic example has no business writes. Use the Automation settings pages for enablement, manual runs, and diagnostics. Sample inputs and expected outcomes are documented in `README.MD`.

## Compiled migration and seed manifests

The application build generates `.manifest.json` in each compiled migrations and seeds directory after server compilation, path rewriting, and `afterServerBuild` hooks. Keep the manifest generator in the build when customizing it. Plugins generate their own manifests when built; an application must not regenerate manifests for installed dependencies.

TypeScript and compiled JavaScript use the same source checksum for migration history, while the loader separately verifies emitted JavaScript. Marked JavaScript requires its manifest. For a database with old raw JavaScript checksums, first run the compiled representation with matching original output; verified legacy hashes are converted under the task lock. Unreproducible old output remains an error. Never edit historical migrations, and never edit the history table by hand, to resolve an upgrade failure; `pnpm nocobase db repair` is the supported way to realign a checksum you can account for, and `pnpm nocobase db redo` the way to re-run a migration whose branch is still unmerged.

The account menu checks Better Auth sign-out results before refreshing the session and shows a localized error toast for API or network failures. Preserve this behavior when upgrading the shell; navigation alone does not revoke a session.

The authorization provider clears the permission snapshot before rendering a new session. Route navigation and page guards subscribe to the authorization revision; preserve these checks when customizing the shell so account changes and permission updates take effect without a reload. Pending checks hide protected content, and failed checks deny access.

Navigation groups retain their expanded or collapsed state while the navigation tree stays mounted. Selecting a new page expands its ancestor groups without collapsing other groups; users can still collapse the active group manually. Keep this behavior aligned across the application, Settings, and Dev tools navigation.

## Development logging

`pnpm dev` owns the ready banner and public URL; `APP_SERVER_START_LOG=false` suppresses the underlying listener announcement through the `env` of `server/config/server.ts`. Keep that mapping when editing deployment environment settings. Request starts, request headers and config diagnostics use DEBUG; the normal INFO output contains completion summaries. See the shared application development Skill for hosted logging and upgrade limits.

## Runtime paths and application creation

`runtime.paths`, configuration context `paths`, and `app.paths` share one resolved `AppPaths` object. Use `paths.storage('...')`, `paths.database('...')`, or the corresponding directory fields. `AppPathOptions` is input only; application path policies run before the final object is created and configuration is loaded. Standalone entries declare the deployment root in `server/runtime.ts` so the server and CLI share persistent storage outside the compiled code directory.

`server/app.ts` calls `createAppFromRuntime(runtime)` to transfer configuration, paths, mode and Host logging policy and bind `runtime.app`. Keep Provider, middleware and route registration explicit and ordered; `startApplicationInScope` owns startup and shutdown binding.

## Examples notification header

Examples adds an application-owned notification bell in `client/layouts/components/header-actions.tsx`, linking to `/notifications` from App, Settings, and Dev headers. `client/components/notification-button.tsx` mounts the public in-app notification Provider for the authenticated user, resets it when the user changes, and displays the unread count. The route menu cannot provide a persistent header badge, so this product-specific shell addition stays in Examples. Keep the inbox page’s local Provider; both refresh from server realtime invalidations and window focus.
