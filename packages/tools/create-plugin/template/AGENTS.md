# AGENTS.md

This is a NocoBase application plugin: a package published to a registry and installed into an application someone else assembled. That makes it a guest, and most of the rules below follow from it.

## Adding a dependency

Where a package goes depends on who has to resolve the import, and there are three different answers.

| The import is reached from                  | Declare it in                                |
| ------------------------------------------- | -------------------------------------------- |
| `server/` or `database/`, at runtime        | `dependencies`                               |
| `client/`, as a value import                | `peerDependencies`                           |
| `registry/`                                 | nothing — the application compiles it        |
| Tests, build scripts, or `import type` only | `devDependencies`                            |

`pnpm deps:check` at the repository root enforces the server row and runs in CI.

### Why the client row is different

**A deployed server resolves its imports at runtime.** An application's `pnpm build` generates `dist/package.json` from `dependencies` and installs from it. A server import declared only as a devDependency resolves in every development checkout and is absent exactly once — on the deployed server, as a bare `Cannot find package` naming nothing that points back at this manifest.

**An installing application resolves your client imports at build time.** Your `client/` is not bundled by this plugin: `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the application's Vite build resolves them. That application has only what the published manifest declares, and npm does not publish `devDependencies` — so a client import left there fails with `Could not resolve "…"`. It will not fail here, because a workspace install links every devDependency into this plugin's own `node_modules`, which is why this mistake reaches a registry before anyone sees it.

**But that same server never requires a browser package.** Declaring one as a `dependency` would install it into every deployment, where nothing loads it.

`peerDependencies` is what satisfies both: the application installs one shared copy for its Vite build, while a deployment sets `autoInstallPeers: false` and installs none of them. One declaration is enough — pnpm installs and links a peer here, so this plugin's own lint, tests, and build resolve it without a second entry.

Do not mark such a peer `optional`. An optional peer is not auto-installed anywhere, including in the application that needs it, which is the failure this arrangement exists to prevent. `optional` means the consumer may legitimately not need the package at all.

So `hono` in `server/routes/` is a `dependency`, and `lucide-react` in `client/` is a peer. Shared runtime packages follow the peer rule below even in server code. A dynamic `import()` counts as a value import. A type-only import is erased from JavaScript but can survive in published declarations; if consumers must resolve it, declare the dependency or shared peer instead of relying on a devDependency.

`registry/` is the exception: it is source the application copies into itself and compiles there, against that application's own `react` and `@/` alias. This plugin never resolves those imports at all, so declaring them would claim dependencies it does not have.

### Prefer what the application already has

Before adding a client package, check whether `packages/templates/app-template-default` already declares it. Reusing that version means the application bundles one copy instead of resolving two, and it keeps this plugin from pinning a range the application then has to work around. Use `catalog:` for anything the repository catalog already names.

### Runtime packages are peers, never dependencies

`@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/db`, `@nocobase/i18n`, `@nocobase/service-provider`, `@nocobase/queue`, `@nocobase/caching`, `@nocobase/ai-employee`, `@nocobase/authorization`, `@nocobase/repository-input`, and every other `@nocobase/app-plugin-*` carry process-wide state or host-owned contracts — service tokens compared by object identity, React contexts, the application's queue service. A second copy splits that state, and nothing warns: the install succeeds, the build succeeds, and at runtime a demonstrably registered service reports `Service "..." is not registered`.

Declare each as a `peerDependency` — the published compatibility contract requiring a host-provided package. One declaration is enough; pnpm installs a peer and links it into this package's own `node_modules`, so lint, tests, and the build resolve it without a second entry to keep in step. `pnpm peers:check` enforces the packages in its recorded list; review newly identified shared packages explicitly. The generator already emits this shape for the capabilities you selected.

## Where tests go

Tests live in `tests/`, never beside the source they cover, grouped by the source directory they cover: `tests/client/` for pages, components and client services, `tests/server/` for services, routes and permission boundaries, `tests/database/` for migrations and seeds, `tests/cli/` for commands, and `tests/project/` for files at the package root and the build. Shared data and helpers go in `tests/fixtures/` and `tests/helpers/`, which hold no `*.test.ts`. `vitest.config.ts` picks the environment by directory: `tests/client/` runs under jsdom and everything else under Node, so a test needs no `// @vitest-environment` line. A plugin generated without client code has only the Node project; add the `client` project from `@nocobase/dev-config/vitest/react` together with its first client test, along with the jsdom test packages a plugin generated with client code declares.

## Testing with a database

A test takes its fixtures from `@nocobase/app-testing` alone, never from `@nocobase/db-testing` or `@nocobase/app-cli/testing` directly: `./server` carries everything a database test needs, `./cli` carries the command runner, and `./client` renders pages, described under "Testing a page" below. A test that needs a database takes it from there rather than configuring one: `createDatabaseTest()` gives each test migrated databases, and `describeMigration()` is the test every migration needs, applying, rolling back and reapplying it. Both run on SQLite by default and on the dialect `NOCOBASE_TEST_DB_DIALECT` names otherwise, so do not import a `@nocobase/db-<dialect>` package, configure `dialect: 'sqlite'` or `':memory:'`, or assert with SQL only one database understands, such as `PRAGMA` or `sqlite_master`; assert on the schema with `expectCollection()`. `pnpm db-tests:check` at the repository root enforces this, and `pnpm test:db <dialect> --filter <this-package>` runs the tests on another dialect. The `database` capability generates `tests/database/migrations.test.ts` in this shape.


## Testing a page

A page test renders the page with `renderWithApp()` from `@nocobase/app-testing/client` rather than mocking `@nocobase/app-client`. Pass this plugin in `plugins`, as `plugins: [plugin()]` with the factory `client/plugin.ts` exports, so its service providers run and its locales load; a plugin left out registers nothing, and the strict translations fail on the first key it would have supplied. `answerApi()` answers the requests the page sends, and `services` registers a stand-in for another plugin's client service. `useToaster()` is a test toaster whose messages `toasts()` lists. A plugin generated with client code has `@nocobase/app-testing` and the jsdom test packages in `devDependencies`, so put page tests in `tests/client/`, which `vitest.config.ts` runs under jsdom.
## Contributing CLI commands

A plugin can add commands to an application's `pnpm nocobase`, and can ask an application to run a command during its `pnpm build` or `pnpm dev`. Both are declared in `cli/index.ts` through `defineCliPlugin`, and the `cli` capability generates that entry with one example command.

A command extends `AppCommand` from `@nocobase/app-cli`: it returns its result, throws `CommandError` on failure, and gets `--json` for free. By default a command is static tooling that reads and writes files and packages. One that needs the application creates it with `this.withApp(async ({ app }) => …)`, which always shuts it down again, and calls `app.start()` only when it needs every provider running. Work users trigger while the application serves is a server route or a job, not a command. The `nocobase-plugin-development` Skill's CLI reference has the full contract.

Build and dev hooks are for a plugin that has to produce something before the application can run. Declaring the step here rather than in each application's build script is what keeps it correct: it appears only where this plugin is registered, and disappears with it.

```ts
buildHooks: {
  afterServerBuild: [{ label: 'Build artifacts', command: ['pnpm', 'nocobase', '<topic>', 'build'] }],
},
```

A hook command is any executable with its arguments, already split — no shell, so no quoting to get right, and no `&&` or pipes. The stage names say what exists when the hook runs: `beforeBuild` (empty `dist`), `afterClientBuild` (`dist/client`), `afterServerBuild` (`+ dist/server`), `afterBuild` (the installed deployment tree), and `beforeDev` for `pnpm dev`.

## HTTP routes

Every route under `/api` follows the HTTP API design in the `nocobase-app-development` Skill, `references/http-api.md` — in an application at `.agents/skills/nocobase-app-development/references/http-api.md`, in the NocoBase repository at `packages/app/app-skills/skills/nocobase-app-development/references/http-api.md`. Read it before adding a route. The rules a plugin breaks most often:

- Paths start with this plugin's namespace, its package name without `app-plugin-` in camelCase and in its singular or plural form, and every segment is camelCase: `/notificationInApp/messages/{messageId}/markRead`, `/workflows/runs`. Register fixed segments before a `/:id` sibling.
- Data endpoints from `defineRepositoryApiRoutes` are `POST /api/{name}/{action}`; an exposure name is a camelCase segment.
- Standard methods for reading and writing; any other operation is `POST` to `/{collection}/{id}/{verb}`. `GET` never changes data.
- Success is `{ data }`, or `{ data, meta }` for a list.
- Failure is `throw new ApiError({ status, reason, domain, message })` from `@nocobase/app-server/router`, with this plugin's namespace as `domain`. Never write an error body by hand.
- Input is validated with zod through `apiValidator(target, schema)` from `@nocobase/app-server/router`, after the permission middleware; the handler reads only `context.req.valid(...)`.
- Every route declares itself for the application's API document with `describeRoute()` from `@nocobase/app-server/router`, after its authentication and permission middleware and before its validators: `tags` is this plugin's name in PascalCase, `summary` an English verb phrase, `operationId` the namespace, a verb and the resource in camelCase (`hubDeployApp`). Responses use `dataResponse()`, `listResponse()`, `emptyResponse()` and `apiErrorResponse(status)` for each status the route can actually produce. Do not list `400` for input validation: a route that uses `apiValidator` gets the `400` automatically. List `400` yourself only for another reason, such as a failed precondition. `apiErrorResponses` is `401`, `403` and `500`, for an authenticated route with a permission check; otherwise list each status the route can return with `apiErrorResponse(code)`.
- Schemas live in `server/routes/schemas.ts`. A schema several routes share carries `.meta({ ref: '<PluginName><Thing>' })`, public fields carry `.meta({ description })`, and a response schema is annotated with the service's view type, `z.ZodType<OrderView>`, so it cannot drift from what the handler returns.
- A route reached without a credential declares `security: []`. Hide a route with `describeRoute({ hide: true })` and a one-line comment only when it serves the application's shell or build, is a browser-only flow such as an OAuth callback, is a documentation route, is a transport such as a WebSocket upgrade, or is a fallback router registered only while the plugin is unconfigured. Everything else, settings routes included, is documented.
- Data endpoints are documented without a declaration; a field an exposure adds to every returned record goes in its `computedFields`. Routes on the authorization dispatcher are registered as `authz.routes.add(path, createRouteHandler(router))`, with `createRouteHandler` from `@nocobase/app-plugin-authorization/server/extension`; they are documented automatically and checked like any other route. A plugin with its own runtime dispatcher, a catch-all that hands each request to a router chosen at request time, registers each router with `addApiRouter({ owner, prefix, scope?, router })` on the service `apiDocsToken` resolves to, `scope` being the sub-path below `prefix` the dispatcher forwards to that router, and a target that is not a Hono router with `addUndeclaredApiRoute({ owner, method, path, reason })`, which is always reported as undeclared.
- Never declare `hono-openapi`; `pnpm peers:check` fails a plugin that does.
- Tests start the routes and expect `findUndeclaredApiRoutes()` and `findApiDocumentSchemaProblems()` from `@nocobase/app-server/router` to be empty. In the NocoBase repository, `pnpm openapi:check` starts each template on a SQLite test database and fails on an undeclared route, missing `tags`, `summary` or `operationId`, a duplicate `operationId` and schema problems, printing how to fix each one.

To learn what an application and its other plugins already serve, read the API document instead of their route sources. A running application serves Swagger UI at `<origin><APP_BASE_PATH>/api/swagger/docs` and the JSON at `<origin><APP_BASE_PATH>/api/swagger`, to a signed-in session or an API key created at `<APP_BASE_PATH>/settings/api-keys`:

```bash
curl -H "x-api-key: <key>" http://127.0.0.1:13000/main/api/swagger
```

`/main` is the application's `APP_BASE_PATH`. Without a valid credential the routes answer `401`; an application with no access check registered, such as one without the authentication plugin, answers `404`.

## Business permissions

Declare what a role may be granted in `shared/access.ts`, the one typed source the server registers from and the client reads: the pages, the settings items, and the business actions with how each action's records relate to a user. Register them with the authorization plugin from a provider's `boot`: settings items with `authz.settings.add`, and the businesses as a resource type of the plugin's own (`authz.resourceTypes.add({ type, items })`, the type being every business id's prefix, `crm` for `crm.deals`), each item with a title and a one-line description in the plugin's namespace. An action whose records relate to users is registered once per level, each its own action (`edit.related`, `edit.all`), so a grant names the level and the highest one held counts; an action without related records is registered as itself. Place every business and settings item in the permission workspace with `authz.ui.sections.add` and `authz.ui.place`. The application keeps the roles and resolves what a level reaches; the plugin keeps no list of another plugin's actions.

## Before you finish

```bash
pnpm --filter <this-package> lint
pnpm --filter <this-package> typecheck
pnpm --filter <this-package> test
pnpm --filter <this-package> build
```

Every server route owns and tests its own authentication and authorization boundary; mounting under `/api` authenticates nothing. Keep declarations, exports, dependencies, tests, README, and Plugin Skills aligned when capabilities change.

The repository root `AGENTS.md` covers the rest — package publishing, test layout, migrations, and the reasoning behind the rules summarized here.

## Migrations and seeds

A plugin's migrations and seeds live at `database/migrations` and `database/seeds`, declared in `server/plugin.ts`:

```ts
database: {
  migrations: './database/migrations',
  seeds: './database/seeds',
},
```

They are not laid out the way an application's are. An application puts them under `database/<connection>/`, one directory per configured connection. A plugin declares one set with no connection segment, because a plugin's tasks run against the installing application's default connection and only that one: it cannot know which additional connections an application defines, and cannot target one.

Two consequences follow, and both surface in someone else's application rather than here.

**A migration name must be unique across the whole application.** The runner flattens every source — the application's own directory and each registered plugin's — and rejects a duplicate name outright, which fails the run for everyone rather than only for the plugin that introduced it. Derive names from this package instead of using a bare timestamp.

**Ordering is by name across all sources.** Migrations from this plugin and from the application interleave in plain name order; they are not grouped by owner and this plugin's are not applied as a block. A migration here cannot assume anything an application's own migrations created, and the application's cannot assume this plugin's.

Execution history records this package name alongside each migration, so history stays attributable per plugin even though the run is shared.

How to write the files themselves — self-contained, immutable once merged, `builder` for structure and `query` for data — is in the repository root `AGENTS.md`.

A seed is data the installing application needs in order to run. Sample or demonstration data is not: declare it as `defineSeed({ name, sample: true, run })` in the same `database/seeds`, or, when it has to go through other plugins' services, register it from a service provider's `boot()` on `sampleDataToken` from `@nocobase/app-server/sample-data` with a `name` prefixed by this package. Either loads only when the installing application installs its database with `app.sampleData` set, and is recorded as skipped otherwise. A plugin's configuration section maps its environment variables in `env` with a `description` and, where it applies, `secret`, `required`, `generate` or `firstStartOnly`, so `pnpm nocobase config variables` can tell a deployment what to supply.

## Server resource base and database builds

Every Server plugin declaration requires an absolute `baseDir`. In `server/plugin.ts`, calculate it with `path.resolve(import.meta.dirname, '..')` using `node:path`. Migrations, Seeds, and Jobs resolve only relative to this directory; the same declaration under `dist/server` resolves compiled resources. Keep source and published exports aligned.

After compiling database tasks and finishing JavaScript rewriting, run `nocobase-db-manifests` from `@nocobase/dev-config`. Publish the generated `.manifest.json` alongside the marked JavaScript in each migrations and seeds directory. Do not edit historical migration sources or bypass checksums to accommodate compilation differences.

The application must explicitly provide required shared server peers in its production dependencies because deployment disables automatic peer installation. Peer ranges must be compatible; the declaration alone does not guarantee one module across incompatible installed versions.
