# @nocobase/app-plugin-database-explorer

## 1.0.0-beta.10

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-plugin-authorization@1.0.0-beta.24

## 1.0.0-beta.9

### Major Changes

- 21d274c: Move the file and Database Explorer routes onto the HTTP API rules.

  `@nocobase/app-plugin-file`:

  - The endpoints `defineFileRepositoryApiRoutes` generates separate the exposure name and the action with a slash: `POST /api/{name}:{action}` is now `POST /api/{name}/{action}`, including `POST /api/{name}/uploadOne` and `POST /api/{name}/uploadMany`, and `ClientFileRepositoryManager` sends the new paths. The exposure name must be a camelCase path segment. Middleware an application registers on `/{name}:{action}` to protect an exposure must move to `/{name}/{action}`; the old path no longer matches anything.
  - A successful upload answers `201` instead of `200`, with the same body.
  - An upload decides its principal and the exposure's `create` Policy before the body limit, the content type or the multipart body: an exposure whose Policy forbids `create` answers `403 PERMISSION_DENIED` with reason `WRITE_FORBIDDEN` (domain `app`) without storing anything, instead of storing the object and removing it again, and a refused caller is answered `403` even for an oversized or non-multipart body.
  - Upload and content-route failures use the standard `/api` error body, `{ error: { code, status, reason, domain, message, requestId } }`, with domain `file`, instead of `{ code, message }`. Reasons are unchanged: `BODY_TOO_LARGE` (413) and `UNSUPPORTED_MEDIA_TYPE` (415) are `INVALID_ARGUMENT`; `INVALID_MULTIPART`, `INVALID_FILE` and `INVALID_FILES` are `400 INVALID_ARGUMENT`; `PRINCIPAL_REQUIRED` is `403 PERMISSION_DENIED`; `STORAGE_URL_UNAVAILABLE` is now `503 UNAVAILABLE` instead of 500; `INVALID_FILE_COLLECTION`, `INVALID_FILE_METADATA`, `FILE_COMMIT_UNCERTAIN` and `FILE_CLEANUP_FAILED` stay `500` with status `INTERNAL`. Branch on `ApiClientError.reason`.
  - The `component-ui` registry item requires `@nocobase/app-plugin-file` `>=1.0.0-beta.0 <2.0.0`.

  `@nocobase/app-plugin-database-explorer`:

  - `GET /api/database-explorer/connections[...]` is now `GET /api/databaseExplorer/connections[...]`, and `GET .../collections/:collection/physical` is now `GET .../collections/:collection/physicalSchema`.
  - `GET /api/databaseExplorer/connections` answers `{ data: ConnectionSummary[], meta: { total } }` instead of `{ data: { default, items } }`; the default connection is the entry with `isDefault: true`.
  - `GET /api/databaseExplorer/connections/:connection/collections` takes `pageSize` (1–100, default 20) and `pageToken` instead of `limit` (1–200, default 100) and `cursor`, and answers `{ data: CollectionEntry[], meta: { nextPageToken? } }` instead of `{ data: { items, nextCursor } }`. A malformed `pageSize` or `pageToken` is `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` in the `app` domain and a field violation, instead of `INVALID_LIST_OPTIONS` or `INVALID_CURSOR`.
  - Failures use the standard `/api` error body with domain `databaseExplorer` instead of `{ code, message }`, keeping their reasons: `DATABASE_EXPLORER_FORBIDDEN` (403), `CONNECTION_NOT_FOUND` and `COLLECTION_NOT_FOUND` (404), `INVALID_CURSOR` and `INVALID_LIST_OPTIONS` when the database refuses a page token or size (400), `DATABASE_UNAVAILABLE` (503), and `CONNECTION_UNAVAILABLE`, `CONNECTION_UNREACHABLE` and `SCHEMA_READ_DENIED`, which are now `503 UNAVAILABLE` instead of 502.
  - The router hands every error it does not translate itself to `apiErrorHandler`, so an authorization denial or a repository error the caller can act on is answered in the standard body even when the router is mounted on its own.
  - `ListCollectionsQuery` is `{ pageSize, pageToken }` and `CollectionListResult` carries `nextPageToken`; `MAX_COLLECTION_PAGE_SIZE` is 100. `DatabaseExplorerError.status` is the canonical status name, such as `NOT_FOUND`, instead of an HTTP number.

### Patch Changes

- 0b933b3: Declare every hand-written `/api` route of the file, notification, in-app notification, scheduler and Database Explorer plugins in the application's API document at `/api/swagger/docs`, with response schemas and the error statuses each route answers. The file plugin documents the `uploadOne` and `uploadMany` endpoints of each exposure as `multipart/form-data` beside that exposure's data endpoints, under its tag and with operationIds such as `attachmentsUploadOne`. Each file exposure declares the `contentUrl` it adds to every record as a computed field, so the record schema of its data endpoints lists it, read-only, beside the Collection's fields. Route input is now validated through `apiValidator()`, which answers invalid input exactly as before. A route lists `403` only where it checks a permission, so the in-app inbox routes list `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason, such as an invalid page token or cursor or an unavailable test target, declares it with its reasons.
- be0fbbd: Tests in these plugins and example plugins take their fixtures from `@nocobase/app-testing` alone: database fixtures such as `createDatabaseTest()`, `describeMigration()` and `expectCollection()` from `@nocobase/app-testing/server`, and the command runner from `@nocobase/app-testing/cli`. Each package replaces its `@nocobase/db-testing` development dependency with `@nocobase/app-testing`. Nothing any of them ships changes.
- be0fbbd: Database tests in these plugins and example plugins take their database from `@nocobase/db-testing` instead of configuring an in-memory SQLite database, so they run on SQLite by default and on the database `NOCOBASE_TEST_DB_DIALECT` selects otherwise. Schema assertions that read `PRAGMA` output or `sqlite_master` are written with `expectCollection()` against Field and Collection names, migration up and down tests use `describeMigration()`, and the SQLite triggers that made a write fail are replaced by spies on the write. Each package replaces its `@nocobase/db-sqlite` development dependency with `@nocobase/db-testing`; nothing any of them ships changes.
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
- Updated dependencies [7e5b7d4]
- Updated dependencies [463a7a8]
- Updated dependencies [21d274c]
- Updated dependencies [be0fbbd]
- Updated dependencies [7f9450e]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [7dbc54b]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [be0fbbd]
- Updated dependencies [be0fbbd]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/app-plugin-authentication@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/app-plugin-authorization@1.0.0-beta.23
  - @nocobase/i18n@1.0.0-beta.5

## 0.1.0-beta.8

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-authorization@0.2.0-beta.22
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.16

## 0.1.0-beta.7

### Patch Changes

- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [db16945]
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.1.0-beta.6

### Patch Changes

- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.5

### Patch Changes

- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [808bf34]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-plugin-authorization@0.2.0-beta.18
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.4

### Patch Changes

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.3

### Patch Changes

- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [365a9fe]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.2

### Patch Changes

- 6acf3bc: Use plugin-owned PageContainer components to unify settings page width, spacing, and responsive padding across database exploration, user management, API keys, workflows, and notification logs.

  Use plugin-owned PageHeader components for consistent titles, descriptions, and page actions while preserving permission checks and workflow detail navigation.

  Preserve spacing below workflow tabs and wrap workflow list filters and actions on narrow screens.

  Restore spacing between workflow detail back links and headings, and keep execution duration cells aligned when table rows grow.

- Updated dependencies [89955c5]
  - @nocobase/app-plugin-authentication@0.1.0-beta.15
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.1

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-plugin-authorization@0.2.0-beta.10
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.0

### Minor Changes

- a153ad8: Add a read-only Database Explorer plugin and enable it in the Default and Examples templates.

  The Settings page browses the application's database connections, the collections on each one, and their fields and physical columns. The two detail panes are child routes and the selection rides in the query string, so any view can be linked to and is restored by browser Back.

  Read-only means the plugin creates, alters or drops no collection and changes no row. One qualifier: reading a collection initializes the collection registry, whose metadata store creates `__nocobase_collection_metadata` on a managed connection when it is missing, so that one bookkeeping table is the only object a read can bring into existence — and only when the first NocoBase activity against a database is an Explorer read. External connections cannot reach that path. A test states this boundary against a real database rather than assuming it.

  Listing connections reads configuration and opens no database, so one unreachable external connection cannot take down the page. A connection reports its dialect, schema management, logical database, schemas, naming options, and internal tables, and never its credentials, host, port, socket path, or SQLite file — enforced as an allow-list, so a field a new dialect introduces stays inside by default. Driver errors are withheld from responses and recorded in logs by classification only, never by message or cause.

  The collections list follows the server's cursor to the end so its client-side search sees every collection, and says so when a connection exceeds the bound.

  Every endpoint requires `page:database-explorer/access`, the grant the page and both of its panes declare, which the seeded System Administrator permission set covers.

### Patch Changes

- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [211538b]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
  - @nocobase/app-server@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.6
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/i18n@1.0.0-beta.3
  - @nocobase/app-plugin-authorization@0.2.0-beta.9

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
