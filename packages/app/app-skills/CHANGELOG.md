# @nocobase/app-skills

## 0.1.0-beta.24

### Patch Changes

- 37c8d20: Add `nocobase cli build` and `nocobase cli link` for an application's own command line. An application declares it under `nocobase.cli` in its `package.json` (`bin`, `displayName`, `stateDir`, `homeEnv`, `envPrefix`, `keychainEnv`, `keychainService`, `runCredentialsFile`, `exampleServer`, `auth`, `manifestPath`, `skills`, `version`; templates declare none) and depends on `@nocobase/app-cli-client`. `cli link` makes it a command in `node_modules/.bin` (or `--bin-dir`) that runs from the installed client. `cli build` packs it into standalone tarballs per platform (`darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`; `--targets`) that bundle Node.js (downloaded from nodejs.org and checked, or `--host-node`) and the skills `nocobase.cli.skills` names, and `cli build --runner` packs `nocobase-runner` from `@nocobase/agent-runner`; each product goes in `<out>/<channel>/<product>/` with a `manifest.json` of every file's SHA-256 and size (`--out`, `storage/runners/dist` by default), which `@nocobase/app-plugin-agents` serves. `@nocobase/app-cli-client` adds `runAppCliPackage`, `appCliConfigOf` and `readAppCliPackage`, which run a packaged CLI from the `nocobase.cli` in its own `package.json`.
- 37c8d20: The HTTP API reference describes the command-line hints a route gives with `cliRoute()` and the application's command manifest, `GET /api/cli/manifest`.
- 6e30789: The application Skills place browser tests in `tests/playwright/` instead of `e2e/`, including the Playwright setup a Hub application adds itself, and `nocobase-app-upgrade` describes moving an existing application's `e2e/` files there.
- 37c8d20: Describe `secrets.keys` in place of `auth.secret` and `session.secret`: the deployment Skill's production checklist covers the keys, their backup and rotation with `secrets rotate`, and the sign-out a change of the current key causes; the application Skill describes what `config init` and `config check` now do, and how application code seals a value it reads back with `secretsServiceToken` and registers its table for rotation. The `.gitignore` `create-app` writes when a template has none names the generated secrets key.
- 68d4feb: `nocobase-app-development` ships the NocoBase UI Library catalog, `references/frontend/references/ui-library.md`, generated from `ui-library/registry` by `scripts/gen-ui-library-catalog.mjs`: every item with its kind, install command and location, description, plugin dependencies and its `@nocobase/<item>-demo` example, including the agents items (`agent-chat`, `agent-composer`, `agent-picker`, `agent-queue`, `agent-run-history`), the projects items (`project-detail`, `issue-detail`, `issue-table`, `issue-card`, `plan-card`) and the inbox. Agents look an item up live first and read this list when the registry cannot be reached.
- 37c8d20: A route's command-line hints can default a flag from the caller's environment: `cliRoute({ flags: { repository: { env: ['GITHUB_REPOSITORY', 'CI_PROJECT_PATH'] } } })`, or a field of the JSON file a variable names, such as `{ file: 'GITHUB_EVENT_PATH', path: 'pull_request.head.sha' }`. The manifest carries it as `env` on the parameter; the CLI fills a flag the line leaves out from the first source the environment has, a flag given explicitly always wins, and its help names where the default comes from. An older CLI ignores `env` and still asks for the flag.
- 37c8d20: `cliRoute()` flags take `fromEnv: '<field>'`: the command then accepts `--from-env`, which fills that input from the caller's environment variable named by the value given for `<field>`, so a secret never sits on the command line or in shell history. A JSON input read through `--<name>-file` is now parsed as JSON rather than sent as text.
- 37c8d20: The HTTP API reference describes the `ticketUpload` and `changedFiles` command-line hints and how an application keeps whole areas off its command line with `exclude()` on `cliToken`.
- bc1e83f: Merge class names with the `cn` package, as shadcn's registry primitives now do, instead of a `clsx` and `tailwind-merge` wrapper. Every primitive, component and page imports `cn` from `'cn'`, `client/lib/utils.ts` is the one line `shadcn init` writes, `export { cn } from 'cn'`, and the templates no longer declare `clsx` or `tailwind-merge`. Adding a primitive with `shadcn add` therefore leaves one `cn` implementation in the application rather than two.

  An existing application keeps working without changes: its own `lib/utils.ts` and every `@/lib/utils` import stay valid. To follow the templates, replace `client/lib/utils.ts` with `export { cn } from 'cn';`, change `import { cn } from '@/lib/utils'` to `import { cn } from 'cn'`, and remove `clsx` and `tailwind-merge` from `devDependencies` once nothing imports them. The frontend references now tell agents to import `cn` from `'cn'`.

- bc1e83f: Describe dev pages as rendered inside the application shell at their `/dev/...` paths with no navigation or header entry, opened by URL, now that the templates no longer have a separate Dev tools layout.
- 37c8d20: Describe every environment variable an application reads, and write the description into the build. An environment mapping now carries optional metadata — `description`, `secret`, `required`, `generate` (`secret`, `secretKeys` or `password`) and `firstStartOnly` — given as the second argument of `envString`, `envInteger` and `envBoolean` (the third of `envStrings`), and the helpers record the value's `type`. `@nocobase/config` also exports `isSecretPath`, which tells a secret path by its last word. Metadata changes nothing about how a variable is read.

  `AppConfig.environmentVariableMappings()` in `@nocobase/app-server` returns each variable's full mapping with its absolute path, `{ AUTH_SECRET: { path: 'auth.secret', type: 'string', … } }`; `sectionEnvironmentVariables()` still returns the paths alone. `@nocobase/app-server/config` adds `buildVariablesManifest`, `requiredOf`, `isExamplePlaceholder` and `KNOWN_EXAMPLE_PLACEHOLDERS`: a variable is required unless the code defaults or `config.example.yml` give its path a real value — `admin123` and `replace-with-a-unique-secret` count as none — it can be generated, or `required: false` says so. `@nocobase/app-server/database` adds `connectionEnvironment(connection, prefix = 'DB')`, which maps `<prefix>_DIALECT`, `_HOST`, `_PORT`, `_DATABASE`, `_USERNAME`, `_PASSWORD`, `_SSL` and `_FILENAME` onto a connection, and `defineAppDatabaseConfig` takes a second argument, `{ env, validate }`, to declare them. `AppIdentityConfig` gains `sampleData`. `SECRETS_KEYS`, `API_BODY_LIMIT` and `API_TIMEOUT` carry their metadata, and `AUTH_SECRET` from `@nocobase/app-plugin-authentication` is a secret a deployment may generate.

  `@nocobase/app-plugin-users` exports `defineUsersConfig` and `USERS_ENVIRONMENT` from `@nocobase/app-plugin-users/server/config`, mapping `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` onto `users.initialAdmin`, read only on the first start; `UsersConfig` declares `initialAdmin`.

  `@nocobase/app-cli` adds `pnpm nocobase config variables [--out <file>]`, which prints the manifest — every variable with its path, description, whether it is a secret, required, generated or read only on the first start — and `pnpm build` writes it to `dist/variables.json` before generating the server package; a failure fails the build. `config env` marks each variable as a secret or required, and its `--json` entries gain `secret` and `required`.

  The templates declare `DB_*` for the main connection in `server/config/database.ts`, `INITIAL_ADMIN_*` in `server/config/users.ts` (new in Default and Examples; Hub switches to `defineUsersConfig`), `APP_SAMPLE_DATA` for `app.sampleData`, and a description on every variable they map. `config.example.yml` no longer shows `${NAME}`, which was never expanded. Nothing changes for an application that sets none of the new variables: `users.initialAdmin` keeps its example values and `config init` is unchanged. To adopt this in an existing application, copy `server/config/database.ts`, `server/config/users.ts` (and its entry in `server/config/index.ts`), `app.ts` and the `env` declarations of the other section files from the new template version.

- bc1e83f: The application header shows the current page's breadcrumb after the sidebar toggle, in place of the "AI application workspace" (Hub: "Hub console") tagline, whose `shell.workspace` (Hub: `navigation.console`) locale key is removed. `Breadcrumbs` is now rendered by `AppLayout` and `SettingsLayout` rather than placed by pages: it shows the route trail — routes declaring `breadcrumb`, and menu pages by their `navigation.title` — leaves out pages the viewer may not open, or shows the whole trail a page declares with `usePageBreadcrumb` from `@nocobase/app-client`. On a phone only the last level shows, and a medium screen folds the middle levels into a menu. The templates gain the shadcn `breadcrumb` primitive. The examples' child pages no longer render their own trail. The application development Skill describes the header trail and when a page still needs `BackButton`.

  An existing application adopts this by merging the template's `client/components/breadcrumbs.tsx`, `client/components/ui/breadcrumb.tsx`, `client/layouts/app-layout.tsx` and `client/layouts/settings-layout.tsx`, and removing `<Breadcrumbs />` from its pages.

- bc1e83f: The UI guidelines give every overlay a width and structure by what it holds (I1): AlertDialog for every confirmation, a `sm:max-w-md` dialog for 1–4 fields, a `sm:max-w-2xl` route dialog for 5–8 fields or a list, a route drawer for a record's details and a `sm:max-w-4xl` dialog for large read-only content, with one height cap, `max-h-[calc(100dvh-2rem)]`, a fixed footer and a scrolling body. Menus on icon triggers size to their items with `w-auto min-w-40` (I13). The overlay reference shows the plain dialog structure.
- 37c8d20: Load sample data only when an installation asks for it. A seed declared with `defineSeed({ name, sample: true, run })` runs only when the Seeder is created with `sample: { enabled: true }`; otherwise it is recorded as skipped and never runs on its own. `Seeder` gains `runSamples()`, which runs the sample seeds recorded as skipped, and `record(entry)`, which records an entry no seed file describes. The seed history table gains a nullable `status` column (`executed` or `skipped`), added by the library the next time a run ensures the table; existing rows read as executed. `SeedHistoryRecord` carries `status` and `SeedRunResult` carries `skippedSamples`.

  `@nocobase/app-server` enables sample seeds when a run installs the connection — it held no migration or seed history before the run, or a fresh run rebuilt it — and `app.sampleData` is set (`APP_SAMPLE_DATA=true`); the seeds entry of a run reports `freshInstall` and `skippedSamples`. `@nocobase/app-server/sample-data` adds `sampleDataToken`, on which a plugin registers sample data that has to go through services: the application builds it once every provider is ready, under the same condition, and records it in the default connection's seed history as `sample-data:<name>`. The database task operation `sample` runs the skipped sample seeds.

  `@nocobase/app-cli` adds `pnpm nocobase db sample`, which runs every sample seed recorded as skipped, then starts the application without serving it and builds the registered sample data that is skipped or not recorded. A deployment refuses it.

- bc1e83f: Select popups grow with their options instead of taking the trigger's width, up to `max-w-sm` or the space beside them, and wrap a long option rather than cutting it off. The UI guidelines add this as rule I12, with the class every `SelectContent` takes.
- bc1e83f: The UI guidelines of the `nocobase-app-development` Skill put a list's primary action in exactly one place, the empty state while the list is empty and the page header once it has rows (L7), describe the empty state and the row "…" menu more precisely (S2, T1.5), rule out native date inputs in favor of a `Calendar` in a `Popover` with presets for ranges (I10), and give drawers holding a form or details medium width, noting that a plain `Sheet` is widened with the `data-[side=right]:` prefix (I11). Each template's `AGENTS.md` points to the guidelines.
- bc1e83f: The UI guidelines of the `nocobase-app-development` Skill add R4: a page whose data changes on its own (runs, deployments, runtime states, usage) and is not kept current live ends its header actions with one Refresh icon button that spins while it refetches the page.
- bc1e83f: The NocoBase UI Library no longer offers `date-picker` and `date-time-picker`. The application Skills and the templates' `AGENTS.md` stop pointing at `shadcn add @nocobase/date-picker`: a date field's `DatePicker` is the application's own component, composed from the `calendar` and `popover` primitives following shadcn's Date Picker guide. Existing applications keep their copies unchanged.
- bc1e83f: The NocoBase UI Library no longer offers `data-table`, `confirm-dialog` and `back-button`. The application Skills and the templates' `AGENTS.md` stop pointing at `shadcn add @nocobase/data-table`: a list's `DataTable` is built in the application from the `table` primitive following shadcn's Data Table guide, and `BackButton` in `client/components/back-button.tsx` is the template's own component. Existing applications keep their copies unchanged.
- bc1e83f: The `@nocobase` shadcn registry is read over HTTPS: `components.json` and the frontend references point at `https://ui.nocobase.com`. Existing applications can change the URL in their own `components.json`.
- 3898a89: Add a durable wait instruction with a run and node key resume API, persisted idempotent decisions, queue recovery, and application integration guidance.

## 0.1.0-beta.23

### Minor Changes

- 21d274c: Data endpoints from `defineRepositoryApiRoutes` separate the exposure name and the action with a slash instead of a colon: `POST /api/{name}:{action}` is now `POST /api/{name}/{action}`, such as `POST /api/salesOrders/findMany`. The colon form is no longer routed and answers `404 ROUTE_NOT_FOUND`. `api.repository(name)` in `@nocobase/api-client` sends the new path.

  An exposure name must be a camelCase path segment matching `/^[a-z][a-zA-Z0-9]*$/`, and must not be `auth`, `healthz` or `swagger`. `defineRepositoryApiRoutes` throws at declaration for any other name, so an application exposing a name such as `sales/orders` or `sales-orders` must rename it, and its clients must use the new name. A duplicate name now reports which name was declared twice.

  The HTTP API specification in `@nocobase/app-skills` now covers singular or plural plugin namespaces, plugins mounted through another plugin's dispatcher, fixed segments registered before path parameters, the not-found rule, the `413`/`415` statuses and the removal of `422` and `502`, binary and multipart input, and the routes that keep their own shape. The generated plugin `AGENTS.md` from `@nocobase/create-plugin` states the namespace and data endpoint rules accordingly.

- 3f01f61: Document the HTTP API design every `/api` route follows. The `nocobase-app-development` Skill gains `references/http-api.md`: camelCase paths under a plugin's namespace, standard and custom methods, `{ data }` and `{ data, meta }` responses with `pageSize`/`pageToken` or `page`/`pageSize` paging, `ApiError` and the standard error body, and input validated with zod through `parseApiInput()` after the permission check, with an optional `bodyLimit` on a route whose body needs one. It also fixes when a custom method answers `200`, `202` or `204`, which lists may skip paging, that a `GET` never changes state, that a plugin has one error `domain`, and that streaming routes answer errors detectable before the stream opens with the standard body. Its route, frontend API, testing, i18n and organization references, and the frontend projects example, now throw `ApiError`, branch on `error.reason`, and use `q`, `orderBy`, `page`/`pageSize` and string ids. Generated plugins and applications point to it from `AGENTS.md`.
- e44f49c: `@nocobase/hub-cli` deploys to named remotes and builds for the Hub. `hub remote add <name> <url>`, `hub remote list` and `hub remote remove` keep the Apps an application deploys to in the committed `.nocobase/hub.json`, where a remote URL is `<Hub URL>/apps/<App ID>` and the first remote is the default; every command takes `--remote <name>`. `hub auth login` saves an API key for a remote after the Hub accepts it, asking for it without echoing it or reading it from standard input with `--with-token`, in `$XDG_CONFIG_HOME/nocobase/hub-credentials.json` (`%APPDATA%\nocobase` on Windows), readable by its owner only; `hub auth logout` removes it and `hub auth status` checks every remote's key. `hub deploy` and `hub upload` now read the platform the Hub runs Apps on and run `nocobase build --target … --node-version … --tar` for it before uploading; `--no-build` uploads the existing archive and `--file` another one, each checked against the Hub's platform first (`BUILD_TARGET_MISMATCH`). `hub deploy` uploads, then deploys through the Hub's deploy endpoint, so an archive the Hub already has is deployed as its existing Release instead of failing with `NO_DEPLOYMENT`; its `--idempotency-key` is the deployment's retry identity, and the upload is keyed by the archive checksum.

  `hub remote add` warns when the App root's `.gitignore` ignores `.nocobase/`, as applications generated by an earlier `@nocobase/create-app` do; the line has to go for the remotes to reach another checkout. `hub auth status` reports a key as rejected only when the Hub rejects it (`INVALID_API_KEY`, `API_KEY_FORBIDDEN`); a Hub that cannot be reached or answers something else leaves the key unchecked. `--timeout` bounds each request to the Hub and the wait for a deployment rather than the whole run, and a request that outlasts it fails with `TIMEOUT` (exit 3) instead of `RESULT_UNKNOWN`. Under the default `--idempotency-key`, deploying a Release the App deployed before and has since moved on from, as `hub deploy --release-id` does to roll back, deploys it again instead of answering with the earlier deployment; running the same command again still repeats nothing. A 404 that does not come from the Hub, as at a mistyped remote URL, fails with `HUB_NOT_FOUND` and points to `hub remote list`, and Ctrl-C at the `hub auth login` prompt cancels with `LOGIN_CANCELLED` (exit 130).

  Breaking: `HUB_URL`, `HUB_APP_ID` and `HUB_API_KEY`, from the environment or the App root `.env`, and the `--hub`, `--app-id` and `--api-key` flags are removed. Migrate with `pnpm nocobase hub remote add origin <Hub URL>/apps/<App ID>` and `pnpm nocobase hub auth login` (`echo "$HUB_KEY" | pnpm nocobase hub auth login --with-token` in CI). Under `--json`, `hub upload` no longer reports `operationId`, `hub deploy` reports `reused` for a reused deployment, and a build adds `buildTarget`. The package root exports `publish`, `HubClient` and `parseRemoteUrl` in place of `publishToHub` and `publishRelease`.

  Breaking for `@nocobase/app-plugin-hub`: `POST /api/hub/apps/:appId/releases` only uploads. It no longer accepts the `application/vnd.nocobase.release-upload.v1` configuration-prefixed body or `X-Hub-Config-Length`, ignores `X-Hub-Deployment-Intent` and `X-Hub-Wait`, and returns 200 with the Release, `releaseId` and `reused`; deploy through `POST /api/hub/apps/:appId/deploy`. An older hub-cli uploads but no longer deploys in the same request. An upload whose `nocobase.buildTarget` names another platform, architecture, Node major or Linux C library than the Host's is rejected with `422 BUILD_TARGET_MISMATCH` before anything is stored. `GET /api/hub/apps/:appId` reports the Host's `buildTarget` and, like `GET /apps/:appId/deployments/:deploymentId/status`, accepts a publishing key holding either scope for the App. Which routes a publishing key may call is declared with each route rather than matched by a separate pattern.

  `@nocobase/app-host` reports `runtime` — the Host process's `platform`, `arch`, `libc`, `nodeAbi` and `nodeMajor` — in `HostStatus`. The `nocobase-deployment`, `nocobase-app-development` and `nocobase-app-upgrade` Skills describe the remote, `hub auth login` and the build inside `hub deploy`, and the upgrade edge cases list the migration for an existing application.

### Patch Changes

- 21d274c: An application now fails to start when two API routes answer the same method and path. Hono runs only the first matching route, so a plugin route that repeats another plugin's route, or a hand-written route that repeats a `defineRepositoryApiRoutes` data endpoint, used to be dead code that nothing reported. Parameter names do not distinguish routes (`/orders/:id` and `/orders/:orderId` are the same route), an `ALL` route collides with every method on its path, and middleware is not counted. The error names the method, the path and both owners: a plugin's routes are named by its package name, the application's own routes by the application's package name, and a contribution passed to `Application.addRoutes()` by its position unless the new optional `{ owner }` argument names it.

  The `nocobase-app-development` Skill's HTTP API reference states this rule, uses `/translation/translateText` instead of `/ai/translateText` as the example of a computation on no stored resource, and adds that a route schema never uses `z.any()` and uses `z.unknown()` only for a genuinely free-form value, with a comment saying why.

- 21d274c: An application can set global limits for every `/api` request in a new `api` section of `config.yml`. All three are off by default and nothing is installed for one that is unset, so an application that does not set them behaves as before.

  ```yaml
  api:
    bodyLimit: 10mb
    timeout: 30s
    rateLimit:
      max: 600
      window: 1m
  ```

  - `bodyLimit` refuses a larger body, whether it declares its length or streams it, with `413 INVALID_ARGUMENT`, reason `BODY_TOO_LARGE`. It is a ceiling over every route; a route that needs a smaller limit sets its own.
  - `timeout` answers `503 UNAVAILABLE`, reason `REQUEST_TIMEOUT`, when a handler has not returned its response within the deadline. It covers only the time until the response exists, so a streaming response (SSE, NDJSON) that has started is not cut off. The handler is not cancelled; what it returns or throws after the deadline is discarded.
  - `rateLimit` allows `max` requests per `window` from each client connection address and answers `429 RESOURCE_EXHAUSTED`, reason `RATE_LIMITED`, with a `Retry-After` header in seconds. `GET /api/healthz` is exempt; Better Auth's routes under `/api/auth/` are counted. Counters are fixed windows kept in process memory and bounded, so each instance of a multi-instance deployment counts on its own, and behind a reverse proxy every request shares the proxy's address. A request whose address is unknown, such as one a Hub forwards to an application it hosts in process, is not counted.

  All three answer in the standard error body with domain `app` and the request's `x-request-id`. Sizes are a number of bytes or a string such as `512kb`, `10mb` or `1gb`; durations a number of milliseconds or a string such as `500ms`, `30s`, `1m` or `1h`.

  `@nocobase/app-server/router` exports `defineApiConfig()`, which declares the section with its validation, so `pnpm nocobase config check` and every start report a malformed value, and maps `API_BODY_LIMIT` and `API_TIMEOUT`; `installApiLimits()` and the individual middlewares are exported too. The three templates declare the section in `server/config/api.ts` and document it, commented out, in `config.example.yml`. An existing application adds the same `server/config/api.ts` and registers it in `server/config/index.ts` to get validation and the environment variables; without it, the limits it sets in `config.yml` still apply, but `config check` reports `api` as an unknown section.

  The `nocobase-app-development` Skill's HTTP API reference describes the limits and their reasons, and the `nocobase-deployment` Skill lists them among the production settings to review.

- 463a7a8: The `nocobase-app-development` commands reference tests a command with `bindAppCommand()` and `runAppCommand()` from `@nocobase/app-testing/cli`, the package an application's tests take their fixtures from, instead of `@nocobase/app-cli/testing`.
- 7e5b7d4: Describe the sign-in pages as application code that wires the UI Library's presentational authentication components (`auth-forms`, `auth-methods`, `auth-split-layout`) to the headless actions, in place of the removed `auth-ui` block, in the authentication Skill, its README and the development Skill's i18n and styling references.
- 0b933b3: Applications now generate an OpenAPI 3.1 document for their `/api` routes and serve it at `GET /api/swagger`, with Swagger UI at `GET /api/swagger/docs`, which keeps what "Authorize" was given, such as an API key, across reloads. The Swagger UI files ship in `@nocobase/app-server`'s `dist`; no CDN is involved and templates declare nothing.

  `@nocobase/app-server/router` exports what a route declares itself with: `describeRoute()` re-exported from `hono-openapi`, `resolver(schema, direction?)`, `apiValidator(target, schema)` — which validates a Standard Schema such as a zod schema, answers invalid input exactly as `parseApiInput()` does (`400 INVALID_ARGUMENT`, reason `INVALID_INPUT`, domain `app`, one field violation per issue) and documents the parameters or body — and the response helpers `dataResponse()`, `listResponse()`, `emptyResponse()`, `apiErrorResponse()` and `apiErrorResponses`, which reference the shared standard error body. `apiErrorResponses` is `401`, `403` and `500`, for an authenticated route with a permission check; it does not include `400`. A route with an `apiValidator()` gets the `400` for invalid input in the document automatically, as the shared `InvalidInput` response, and a route without one gets none; a `400` the route declares itself for another reason, such as a failed precondition, is kept and documented after the invalid-input description. `parseApiInput()` keeps working and is superseded. Plugins import these from `@nocobase/app-server/router` and must not declare `hono-openapi` themselves; `pnpm peers:check` now fails one that does.

  Data endpoints from `defineRepositoryApiRoutes` are documented automatically: each action gets an operation whose record, `values` and filter schemas are read from the Collection field by field, with the filter operators each field accepts and a shared `RepositoryFilter` component describing the grammar. Fields a fixed Policy forbids are left out. An exposure entry accepts `computedFields: { name: schema }`, a Standard Schema such as a zod schema or an OpenAPI schema per field, for fields it adds to every returned record that the Collection does not have; they are documented read-only in the exposure's record schema wherever a record is returned and never in `values`, `filter` or `sort`. The declaration changes nothing at runtime, and a name the Collection also has fails when the routes are created. `GET /api/healthz` is declared too, with `security: []` because it needs no credential.

  The documentation is served only to requests an access check allows. Plugins register checks, and fragments for routes a library defines, through the new `apiDocsToken` service (`addAccess()`, `addFragment()`, `invalidate()`); a fragment may also carry `components.securitySchemes` and `security` requirements, which the document lists at its top level as alternatives, so a route that needs no credential declares `security: []`, and a document nothing contributes a scheme to has no `security` at all; until a check is registered the documentation routes answer `404 ROUTE_NOT_FOUND`, so an application without one publishes nothing. `inspectApiRoutes(app)` and `findUndeclaredApiRoutes(app)` report what each route of a started application declares, and `Application.apiRouter` exposes the assembled `/api` router. A plugin that serves routes through a runtime dispatcher, a catch-all on `/api` that hands each request to a router at request time, registers each router with `addApiRouter({ owner, prefix, scope?, router })`: its routes are documented, inspected and checked for duplicates at `prefix` followed by their own paths, exactly like routes mounted on `/api`. `scope` names the sub-path the dispatcher actually forwards to the router, such as `/sharingRules`; a route the router declares outside it is never reached, so it is left out of the document and the duplicate check and reported as undeclared. A forwarded target the framework cannot see into, such as a plain function, is registered with `addUndeclaredApiRoute({ owner, method, path, reason? })`, which `findUndeclaredApiRoutes(app)` always reports and the document never lists; `pnpm openapi:check` prints the `reason` of such a route. Both return a function that removes the registration, and `Application.forwardedApiRoutes` lists what is registered. A plugin route under `/api/swagger` now fails start as a duplicate route.

  Schemas are converted under the document's conventions rather than hono-openapi's defaults. A response object is open unless its zod schema is strict (`z.strictObject()` or `.strict()`), so adding a response field is not a breaking change; a request body validated with `z.strictObject()` stays closed. A recursive schema such as `z.json()` becomes a component named by its `ref`, or `JsonValue`, or `Recursive<hash>` for another anonymous one, instead of a converter-generated `__schema0` that collided across routes or a `$ref` into `#/$defs` that resolved nowhere. A property whose schema is a shared one keeps its own description next to the `$ref`, and the shared component keeps its own. `apiValidator('header', ...)` leaves `Accept`, `Authorization` and `Content-Type` out of the parameters, as OpenAPI ignores them there. `findApiDocumentSchemaProblems(document)` lists unresolved references and converter-generated component names, for a test to expect none.

  `@nocobase/db` exports `filterOperatorsForFieldType()`, `supportsFilterShorthand()` and `isSortableFieldType()`, the tables the Repository validates filters and sorts against, so descriptions of the filter grammar are derived from them rather than copied.

  The `nocobase-app-development` Skill's HTTP API reference describes the API documentation: how people and agents read it (`<APP_BASE_PATH>/api/swagger/docs` and `<APP_BASE_PATH>/api/swagger` with a session or an `x-api-key` header, `401` without one and `404` when no access check is registered), how to declare a route and list only the error statuses it can produce (no `400` for input validation, which `apiValidator()` adds; `apiErrorResponses` only for an authenticated route with a permission check), `security: []` for a route reached without a credential, the five kinds of route that may be hidden, response schemas typed against the service's view type, `computedFields` on a data exposure, routes registered through `authz.routes.add` with `createRouteHandler`, routers forwarded by a plugin's own runtime dispatcher (`addApiRouter()` and `addUndeclaredApiRoute()`), and the test assertions. Its entry `SKILL.md` tells an agent to learn an application's endpoints from the JSON document rather than from route sources, and its server routes, testing and organisation references show routes declared with `describeRoute()` and validated with `apiValidator()`. The `nocobase-deployment` Skill describes the API documentation in production: who may read it, that there is no switch to make it public, and that restricting it further is done at the reverse proxy.

- 7e5b7d4: Describe the shadcn sidebar composition (`app-sidebar.tsx`, `navigation-menu.tsx`), its outside-only customizations and the sidebar tests in the shell, shadcn and theme guidance.
- 463a7a8: The templates' tests take their databases from `@nocobase/app-testing`, now a development dependency of every template and of the applications they generate. The application server tests start the template on test databases written by `createTestAppConfig()` instead of SQLite files, so they run on the dialect `NOCOBASE_TEST_DB_DIALECT` selects. The examples template gains a test that signs in through the application with `@nocobase/app-plugin-authentication/testing` and checks that the sales confidentiality restriction leaves confidential quotes out of a proposal engineer's list and in an administrator's, and that they appear once the restriction is no longer assigned. The `nocobase-app-development` Skill's testing reference describes testing through the whole application, where a test's databases come from, and `describeMigration()` for migrations.

## 0.1.0-beta.22

### Patch Changes

- ec4b764: Recommend testing components against the real i18n runtime from `@nocobase/i18n/testing` instead of mocking `@nocobase/i18n/client`, and add a minimal runnable component test to the frontend testing reference.
- 7534fb6: The frontend handbook states as a rule what it only implied: a child route that is a page of its own returns `RouteChildPage`, and only tab content renders inline. A generated application declared its article editor as a child route of a dashboard and of a list, and returned a bare `PageContainer`, so the editor rendered at the parent's `Outlet` below the dashboard instead of covering it.

  - `child-routes.md` sections 1 and 3 say that a child route's component decides how it is shown and that a bare `PageContainer` renders below the parent's content; section 5 says a page shared by several parents returns `RouteChildPage` under each; the verify list checks that a covering page covers the parent whatever its scroll position.
  - `form.md` covers a form page opened from several pages, declared under each through one function that takes an owner, and `page.md` names the bare `PageContainer` as the case to avoid.
  - `frontend-dev.md` gains the matching "Common mistakes" entry, and `testing.md` a test for a covering child page: the parent's heading is inside an `inert` element, which fails for a page that renders inline.

- 7534fb6: The frontend handbook closes the gap a generated support-centre application hit when saving an edit form:

  - The unsaved-changes example in `overlay.md` section 2.5 now shows the whole flow, not only the overlay shell: the form's body reports through a stable `onDirtyChange`, and its success path clears `dirtyRef` (`onDirtyChange(false)`) before `onSaved` and `close()`, so the close after a save no longer asks to discard the changes that were just saved.
  - `frontend-dev.md` gains the matching "Common mistakes" entry, pointing back to that section.

- 7534fb6: Guideline T1.11 requires a table cell that is too narrow for its content to end in an ellipsis and show the full content on hover, and only then. `table.md` gives the patterns: text, or a link such as the name column, in a `Tooltip` that stays closed when the value fits and leaves the link a link; a `Badge` or other styled content in a `Popover` that opens on hover, since a badge is unreadable on the inverted tooltip; `truncate` on a block element rather than on a flex one such as `Badge`; and no `line-clamp` in a cell, where text cannot wrap.
- 7534fb6: The application development Skill embeds the shadcn/ui skill from shadcn 4.21.0, unchanged, under `references/frontend/shadcn/`. `references/frontend/references/shadcn.md` says which of its files to read and where an application departs from it: run `pnpm exec shadcn`, never `apply` or `--preset`, keep create, edit and detail views as child routes, and put labels above inputs. The topic references link to the skill instead of restating its rules.

  Primitives are added when a page first needs them, with `yes n | pnpm exec shadcn add <names>`: the CLI asks before overwriting an installed primitive, and an unanswered question ends a non-interactive run before the remaining files. The created files are then formatted with Prettier, and the English a few primitives carry is translated, through a prop where the primitive takes one and otherwise by replacing that literal with a key; `shadcn.md` lists each case. Each document of the worked example names the primitives its file needs on an **Add first** line.

  The frontend handbook no longer points at `client/pages/reference/`, which the templates no longer ship.

- 7534fb6: The frontend handbook says the worked example shows the rules, not the feature to build: take the rule an example illustrates, write the code from the current requirement, and decide again every value that belongs to the projects domain. `example.md` no longer tells an agent to copy each file a task depends on; only `session-expired-alert.tsx` and `use-url-search.ts`, which are shared infrastructure, are still copied unchanged. The acceptance review reports what the example left behind as a design mismatch: its projects names and copy keys, fields, columns, filters or actions the design does not declare, and example values that do not fit the feature's data.
- 7534fb6: The frontend handbook fixes what a review of a generated customer-service application found:

  - A record opens over the page the user is on (guideline I9). A dashboard or a board declares the record's drawer and its edit dialog under its own route, through a `projectDetailRoutes(owner)` function in `client/routes.ts`, instead of linking to the list's overlay URL.
  - A row menu's "Edit" opens the dialog alone, at the list's own `edit/:projectId`; the drawer's "Edit" keeps the dialog stacked on the drawer. The edit dialog reads `ProjectEditOutletContext` from either view.
  - A page below another one has `BackButton` above its title (guideline L6); breadcrumbs only when the user asks for them.
  - Date, time and number columns are sortable by default (guideline T1.8), and the server-paginated example sorts through a `sort` URL parameter.
  - A table inside a card lines up with the card's title ("Table in a card" in `styling.md`).
  - A dashboard template (guideline T5) and its worked example, `example/project-dashboard.md`: metric cards, a chart, and the recently updated projects, which open their drawer over the dashboard.

- 7534fb6: An overlay opens over the view the user is on, and on a page with tabs that view is the tab being shown (guidelines T2.1, I1, I6 and I9). A record's page declared its header's edit dialog beside the tabs and linked to it with a bare `edit`, which resolves against the route that renders the link rather than the URL on screen: the dialog replaced the tab, and closing it redirected to the default tab.

  - `child-routes.md` has a section on overlays opened from the header of a page with tabs: they are declared under every tab through a function, `customerHeaderRoutes(tab)` inside `customerDetailRoutes(owner)`, the header links to `` `${tab}/edit` `` with the tab read from the URL, and each tab passes the page's context on to its `Outlet`. The same page declared under another page uses the same function.
  - `page.md` explains what a relative link resolves against, with a table of the cases, and how such a page's routes join the route test.
  - `example/detail-page-tabs.md` is the complete customer page, its tab, the test that opens the header's "Edit" from every tab, and the route test helper; `example/copy.md` adds the `customers` group.
  - The review checklist, `overlay.md`, `testing.md`, `frontend-dev.md` and the run and design templates check an overlay opened from a view other than the first one a page shows.
  - Going back restores the page underneath exactly (guideline L6): links carry its whole query string down, a view below another one names its own parameters apart (`ordersQ`, section 5 of `table.md`), and the way back removes them with `withoutParams`, which `example/url-search.md` adds. `child-routes.md` no longer advises dropping the current page's filters when linking to another page's record, which lost them on the way back.

- 7534fb6: Design and acceptance review records carry a "Review checklist" section with one row per checklist item: pass, fail with the issue it raised, or not applicable with the reason. An item nobody checked now shows in the record, in a non-independent review too.
- 7534fb6: Forms validate on submit. Guideline T3.3 no longer validates a field as it loses focus, and the handbook and its examples leave `useForm`'s `mode` at the default `'onSubmit'` instead of `'onTouched'`: closing a dialog takes the focus off its field, so a blur-based mode flashed a field error while the dialog closed. After a failed submission a field is still revalidated as it changes, so its error clears once it is corrected.
- 3117923: Stop running the `better-sqlite3` install script in generated applications and deployment output. The driver ships prebuilt binaries for Linux (glibc and musl), macOS and Windows on x64 and arm64, so its `node-gyp rebuild` compiled nothing on those platforms, yet it failed the whole install on a machine without `make`, such as a slim Node.js container. `allowBuilds` now records it as `false`. After installing, `create-app` no longer runs `pnpm rebuild` when the driver fails to load, because that rebuild skips a package whose build is skipped; it reports the platform instead, with how to compile the driver there.
- 9291dbb: Correct the i18n documentation and extend the `nocobase-app-plugin-i18n` Skill

  The `@nocobase/i18n` README called `getFixedT` with the locale first; it takes the namespace first, `getFixedT(namespace, locale)`, and the other order silently returns an unusable translator. It also no longer describes `@nocobase/i18n` as shipping built-in common terms: `BASE_NAMESPACE` stays in the fallback chain but carries no resources. The `nocobase-app-plugin-i18n` Skill drops the `refine.addResources` `meta.i18nNs` menu labels, which nothing reads any more, in favour of `navigation.title` and `breadcrumb.title` keys on `defineAppRoutes`; fixes the language switcher path and the name of `createAppI18nRuntime`; and adds how to wire a package's locales for the first time, how to translate on the server inside and outside a request, and how to throw an `AppI18nError`. Its description now says which work belongs to `nocobase-app-development` and `nocobase-plugin-development`. The `nocobase-app-development` Skill states that its examples use `actions.create`, `actions.saving` and `actions.discard`, which the templates do not define, so they must be added before an example is copied.

- e77641b: Rebuild `@nocobase/queue` on BullMQ 6.3.6, with producers, consumers and managers per application

  **Breaking.** `@nocobase/queue` no longer wraps `@boringnode/queue`. `createQueueService(config, { appName, storagePath, logger?, onFallback? })` creates one application's `QueueService`, whose `producer(queue, configKey?)`, `consumer(queue, configKey?)` and `manager(queue, configKey?)` are bound to a named queue:

  - `producer().publish(channel, message, options?)` and `publishMany([{ channel, message }], options?)` write JSON messages with `priority`, `delay`, `attempts`, `backoff` (`fixed` or `exponential`), `removeOnComplete`, `removeOnFail` and a `jobIdProducer`. A batch is prepared entirely before anything is written.
  - `consumer().consume(handler)` registers a handler `(channel, message, signal)` and returns the function that unregisters it once its running calls settle. Every handler of a queue runs for every job; `withChannel(channels, handler)` filters channels.
  - `manager().configure()` changes concurrency, job defaults and the global rate limit at runtime; `drain()` empties waiting jobs; `cancelJob()` and `cancelAllJobs()` cancel jobs this instance runs, without a retry.
  - An `adapter: 'redis'` configuration runs on BullMQ through its public Queue and Worker APIs, each queue under the hash-tagged prefix `nbq:{<digest>}`. `adapter: 'inMemory'` runs in the process and writes unfinished jobs to `storage/queue` when it shuts down; it serves one process. Its optional `queueBackend` names a BullMQ backend factory registered with `registerBackend()`, such as a PostgreSQL one; left out, BullMQ's own Redis backend is used. Redis Cluster is not supported yet.
  - `Job`, `Locator`, `Worker`, `Schedule`, `QueueManager`, `createQueueManager`, `createSyncQueueConfig`, the `sync` and `database` drivers, job discovery, job factories and the OpenTelemetry instrumentation are removed. So is the database driver's migration.

  The `queue` configuration section now has the shape of `jobs`: `default` names a key, and every other key is one complete configuration. Without `queue.default`, queues run on the built-in memory configuration, reported once outside development. A section in the former `connections`/`worker`/`jobs` format is ignored with one warning instead of stopping the application, and its `default` is ignored unless it names a key of the new format.

  `@nocobase/app-server/queue` exports `QueueServiceProvider`, constructed with `{ nodeEnv }`, `queueServiceToken` and `AppQueueConfig`; `QueueProvider`, `queueManagerToken` and `queueJobFactoryRegistryToken` are removed. The provider sets the service up in `start()`, after every provider has booted, and shuts it down last. `planAppRuntimeDatabaseTasks` and `AppRuntimeDatabaseTaskPlanOptions` are removed: planning no longer adds a queue migration source, and `runAppDatabaseTasks` keeps its `runtimeConfig` option. The plugin field `queue: { jobs }` and `createPluginJobLocations()` are deprecated: the field is accepted and ignored, each plugin declaring it is reported once at startup, plugin inspection reports it as the `SERVER_QUEUE_JOBS_DEPRECATED` warning in place of `SERVER_JOB_LOCATION_MISSING`, and `createPluginJobLocations()` returns an empty list.

  The templates compose `QueueServiceProvider`, declare a `memory` and a `redis` key in `server/config/queue.ts`, and drop the `@/jobs` path alias. `create-plugin`'s `server.jobs` capability now generates a `@nocobase/jobs` job and the provider that owns the plugin's `JobExecutor`, instead of a Queue Job; the plugin declares `@nocobase/jobs` as a peer. The Vitest presets no longer inline `@boringnode/queue`. The application development Skill makes `@nocobase/jobs` the default for background work — `JobExecutor` for one-off tasks, `ScheduleExecutor` for recurring ones — and keeps queues for delays, priorities, deduplicating IDs, batches, rate limits and fan-out; the deployment Skill covers the `queue` backend next to the `jobs` one. The queue example plugin now publishes greetings and digest batches and consumes them with two handlers.

  The `queue_jobs` and `queue_schedules` tables of the former database driver, and their migration's history record, are left in place: the migrator only checks packages that still contribute migrations, so startup is unaffected. Drop the tables by hand when nothing reads them. `pnpm nocobase db rollback` refuses to roll back a batch that contains that history record, so it fails while the latest batch is the one that created the tables, as in an application that has applied no migration since.

  Upgrading an application:

  1. In `server/app.ts`, replace `app.addServiceProvider(QueueProvider)` with `app.addServiceProvider(QueueServiceProvider, { nodeEnv: runtime.env.NODE_ENV })`, imported from `@nocobase/app-server/queue`.
  2. Replace `server/config/queue.ts` with configuration keys, such as `memory: { adapter: 'inMemory', persistence: { path: paths.storage('queue') } }` and `redis: { adapter: 'redis', connection: { host, port, db } }`, and set `queue.default` in `config.yml` to the one to run on; an application running more than one instance needs `redis`.
  3. Move each `server/jobs` Job to `@nocobase/jobs`: a `JobExecutor` job registered and set up by the provider that owns it, submitted with `addJob(new Job(payload))`, or a `ScheduleExecutor` rule for recurring work. Use a queue handler registered with `queueServiceToken` in a provider's `boot()`, published with `producer(queue).publish(channel, message)`, only for work that needs a delay, a priority, a deduplicating job ID, a batch, a rate limit or several handlers. Remove `queue: { jobs }` from plugin declarations and `createPluginJobLocations()` from configuration. Jobs still waiting in the former queue storage are not moved.

- 9c5d0c2: `client/extensions/nocobase-auth-ui/` now holds exactly the files the UI Library's `auth-ui` installs, and `tests/scripts/template-ui-library.test.mjs` keeps it that way. Its relative imports carry the `.js` extension, it ships its `locales/`, which `client/locales/en-US.ts` and `zh-CN.ts` spread ahead of the application's own keys in `messages` instead of repeating them, and the out-of-date `README.md` the templates kept beside it is gone. No wording changes, and `PasswordLoginForm` still shows the sign-up link only while `useSignUpAvailable()` allows it. The development Skill's copy reference describes the new layout, and its steps for adding a language now translate the sign-in pages' copy too.

  An application generated earlier keeps working as it is. To follow, merge the new `client/extensions/nocobase-auth-ui/` into its own copy, `locales/` included, keeping its own changes, and in `client/locales/` replace the `auth.*` keys the block provides with a spread of its locale files, as the [block's README](https://github.com/nocobase/nocobase3/blob/develop/ui-library/registry/auth/auth-ui/README.md#translations) shows. Keep the application's own `auth.*` keys, such as `auth.welcome`, which the block does not provide. Its `client/extensions/nocobase-auth-ui/README.md` can be deleted.

- 7534fb6: The NocoBase UI Library's `DataTable` lines up with a card by itself: inside a `CardContent` it drops its own frame, reaches the card's edges and pads its first and last cells with the card's spacing, so its text lines up with the card's title. A `CardContent` still given `px-0` keeps working. The frontend handbook builds a card's short list from `DataTable` too, with plain headers and no pagination, instead of a hand-written `Table`, and guideline T1 now says it applies to list pages while a list in a card follows T5.3.
- 7534fb6: The templates no longer ship `client/components/typography.tsx`. Its `Typography*` components held the class strings from the shadcn Typography guide for hand-written long-form text, and nothing in the templates or the plugins used them. The development Skill no longer lists them.

  An application generated earlier keeps its copy. Delete it, and `tests/components/typography.test.tsx`, only when nothing else in the application imports it.

- 7534fb6: `BackButton` is published by the NocoBase UI Library as the `back-button` component, and the templates preinstall it the way they do `PageHeader` and the route overlays: `client/components/back-button.tsx` is an exact copy of the item, which `tests/scripts/template-ui-library.test.mjs` keeps in step with the library, and `AGENTS.md` lists `BackButton` among the components that come from it. The development Skill's list of composed components now says which of them come from the UI Library.

  An application generated earlier can take it with `yes n | pnpm exec shadcn add @nocobase/back-button` instead of copying the file, then add `navigation.back` (`Back`, `返回`) to its locale files and correct `package.json` as its `AGENTS.md` describes for any UI Library item.

- 7534fb6: The templates no longer ship `DataTable` or `DatePicker`. Both are NocoBase UI Library items, added when a page first needs one: `yes n | pnpm exec shadcn add @nocobase/data-table` installs `DataTable`, `DataTableColumnHeader`, `DataTablePagination` and `DataTableViewOptions` into `client/components/data-table/`, and `@nocobase/date-picker` installs `DatePicker` and `DateRangePicker` into `client/components/date-picker.tsx`. The `calendar` primitive goes with them, and so do `select` and `table` in Default and Hub; Examples keeps those two for its example pages. `@tanstack/react-table`, `date-fns` and `react-day-picker` leave `devDependencies`, except that Hub keeps `react-day-picker`, which `@nocobase/app-plugin-hub` requires as a peer. The `dataTable` and `datePicker` keys stay in the locale files, so an item added later is translated at once. The development Skill names the items on the **Add first** lines of its worked example and says which of the CLI's changes to `package.json` to correct, and the upgrade Skill covers an application that still has the old copies.

  An application generated earlier keeps its copies: they are its own code, and nothing in it has to change. Before removing any of them, search the application for imports of `@/components/data-table`, its companions, `@/components/date-picker` and the three primitives, and drop a package only when nothing imports it. An application that wants the library's `DataTable` deletes its `data-table.tsx` and the three `data-table-*.tsx` files before adding `@nocobase/data-table`, because `@/components/data-table` resolves to `data-table.tsx` while that file exists, and rewrites the companion imports to `@/components/data-table/column-header`, `@/components/data-table/pagination` and `@/components/data-table/view-options`.

## 0.1.0-beta.21

### Patch Changes

- 3d44c4c: Add one-off `JobExecutor` tasks alongside recurring `ScheduleExecutor` rules through the existing application jobs provider and service token. Jobs declare an own stable static `jobName`, accept only payload in their constructors, and reconstruct a fresh instance for every attempt from a strict JSON snapshot. Consumers register classes before setup; producer-only executors use `setup({ consume: false })`.

  Identify ordinary tasks by connection or storage path, namespace and scope, like Schedule, so renaming a configuration key or replacing the built-in default with `jobs.default: memory` keeps pending tasks; they use Redis queues and pending-only memory snapshots separate from Schedule's. Report local attempt events, including `JobProgress` for the 0–100 progress a handler reports through `reportProgress` (stored as BullMQ job progress on Redis), preserve explicitly interrupted work for recovery, and complete successful handlers even when shutdown has aborted their signal. Memory persistence remains setup-read and shutdown-write, so forced exits can lose new tasks or replay work completed since the last snapshot.

  Rename the shared configuration and service types from `Schedule*` to `Jobs*`, because they configure ordinary and recurring executors alike: `ScheduleConfig` is now `JobsConfig`, and `ScheduleAdapterConfig`, `RedisScheduleAdapterConfig`, `MemoryScheduleAdapterConfig`, `ScheduleRedisConnectionOptions`, `ScheduleRetentionPolicy`, `ScheduleLogger` and `ScheduleFallbackEvent` are now `JobsAdapterConfig`, `RedisJobsAdapterConfig`, `MemoryJobsAdapterConfig`, `JobsRedisConnectionOptions`, `JobsRetentionPolicy`, `JobsLogger` and `JobsFallbackEvent`. The old names are removed, so code importing them from `@nocobase/jobs` must switch to the new ones. Shared error messages now say "jobs" instead of "schedule". Types specific to recurring rules, such as `ScheduleExecutor` and `ScheduleJob`, keep their names.

  Document ordinary and recurring executor ownership in app-server and update application-development guidance to distinguish payload-only tasks from the unchanged queue-job and Scheduler APIs.

- dfdd449: ### Typed workflow DSL

  Author workflow definitions with a typed, immutable builder instead of hand-written variable templates.

  `workflow()`, exported from `@nocobase/app-plugin-workflow/dsl`, returns a builder that owns the definition's identity. `addNode()` returns a new builder over its own node list rather than mutating the one it was called on, so chained authoring works as before but code that called `addNode()` for its side effect has to keep the returned builder. `finalize()` rejects a node borrowed from another workflow, a node added to two workflows, and a duplicate node key. Give the `input` or `parameters` surface a TypeBox `Type.*` schema to type it; a raw JSON Schema still describes the surface and leaves it untyped. Workflow and node `options` are typed and validated, and preserved through artifacts and database materialization.

  Handlers are declared with `defineHandler<typeof handler>('./server/handler')` over a type-only import, so evaluating a definition never loads server implementations or their dependencies. A handler reads invocation input, parameters, and upstream results from one shared context rather than from per-node argument mappings, and each node's result type is inferred from its handler's return type and accumulates through the chain, nested branches included. `finalize()` checks that every handler's context requirements are satisfied by the typed surfaces and upstream results.

  The Workflow Skill now explains how to author typed DSL definitions and migrate mapped arguments and JSON Logic conditions to context handlers.

  Conditions now run a handler module that returns a boolean, and the JSON Logic engine is removed along with the `expression` config field and the `evaluateJsonLogic`, `validateJsonLogicExpression`, and `JSON_LOGIC_*` exports. An existing definition that configures `expression` must move that comparison into a handler module. A condition's branches can be declared with the chainable `yes()` and `no()` methods, which reject empty and duplicate branch declarations; generic `branch()` authoring still works.

  `parameters` accepts the same JSON Schema object shape as `inputSchema`, and `compileToFlatIr()` lowers it to the flat declaration map the parameter editor, the value resolver, and the materializer read. The lower-level `defineWorkflow()` API with `RunInstruction.create()` and friends is unchanged and still exported, together with `createReference()` and `lowerBindings()` for its `{{$input.x}}`, `{{$parameters.x}}`, and `{{$nodeResults.key.path}}` templates. A run node that carries no `args` receives the shared handler context, so both authoring styles execute on one engine.

  The examples template's workflows are migrated to the typed builder and read their shared inferred contexts without result casts.

  ### Custom Instruction nodes

  Open the typed workflow builder to application-registered Instructions.

  The builder resolved a node's expression metadata from a table holding `run`, `terminate` and `condition`, so a node of any other type failed with `Unknown workflow instruction`. It now reads the node's own type, configuration and branch structure, which is all the expression needs, and `createNode()` is exported so an extension can supply a node factory beside its Instruction class. The custom Instruction reference documents that factory alongside the existing `defineWorkflow()` form.

  ### Builder validation

  Fail finalization when a workflow builder's `addNode()` result was discarded.

  `addNode()` returns the workflow containing the node, so calling it for its side effect and finalizing the receiver compiled a definition the node was simply missing from — and with it every handler context requirement `finalize()` would otherwise have checked. Types cannot catch this, because the discarded builder is the only value that carries the node. The builder now records what it has claimed and rejects `finalize()` and `compile()` naming each node that was never compiled, including nodes nested in a branch.

  ### Workflow client forms

  Let a workflow revision render its own custom input and parameter forms.

  A workflow package may declare `input.form` and `parameters.form`, resolved inside its own `client/` directory. Those `client` declarations are persisted with the workflow revision and returned by the management API, and the form itself is published under the revision's Artifact hash, so a later build that changes a form cannot change how an already published revision renders. `@nocobase/app-plugin-workflow/vite` exposes those forms to the application build through a virtual module keyed by workflow, revision, and path. In development the module index refreshes when workflow sources change, including added and removed resources, without restarting Vite. Forms get React through bridge exports generated from the installed React modules and the matching host JSX runtimes, so they can use the full React API without bundling a second instance.

  Workflow management addresses unpublished candidates by Artifact hash, so a detail URL identifies one exact version. Hot updates refresh the workflow list and version picker; reopen a changed candidate from there, since an unpublished hash can expire. Materialized revision URLs and mutations stay bound to exact versions. Parameter settings and manual run on a version that has not been materialized yet prompt to enable it first, then navigate to the materialized id. A version that was already materialized stays usable while disabled.

  ### Custom input form schemas

  Hand a custom input form the declarations it is typed for.

  The manual run dialog passed a workflow's raw input schema properties to a custom input form through an `as never` cast, so a form received whatever the schema happened to hold rather than the `string`, `number` and `boolean` declarations `WorkflowParameterFormProps` promises. The properties are now narrowed at that boundary: a property the contract cannot describe is left out instead of being handed over under a type it does not have.

  ### Artifact materialization

  Materialize workflow revisions on demand rather than at startup.

  Startup persists immutable artifact snapshots and publishes client resources, in development as well as production, without creating database revisions. A revision is materialized when a user enables a version, configures its parameters, or runs it manually, and its forms and handlers are resolved from that version's artifact hash. Persisting artifacts, materializing, publishing client resources, and selecting the current version are separate steps: reading parameters and running manually no longer select the current revision, while the first successful parameter save still does. Browser assets are served before the development SPA fallback and restored from persistent storage on startup.

  ### Application workflow layout

  Keep application workflow definitions in a top-level `workflows/` directory and build them to `dist/workflows`.

  Development discovery, `workflow build`, `workflow check`, production artifact loading, and the application Skill all use that location.

  Application server source may now use extensionless relative imports, so a workflow package can import a handler as `./server/calculate-risk`. All three templates set `module: "ESNext"`, `moduleResolution: "Bundler"`, and `tsc-alias.resolveFullPaths: true` in `tsconfig.server.json`: development runs under `tsx`, and the build runs `tsc-alias` after `tsc` to complete the paths for native Node ESM before workflow resources are collected. Workflow source checking and evaluation resolve extensionless handler imports the same way. A workflow package's `client/` form is typechecked and linted as browser code, through the client project rather than the server build.

  `loadAppVitePlugins()` in `@nocobase/dev-config` loads the Vite contribution of every client plugin an application registers, so a template's `vite.config.ts` does not name individual plugins. An application without a `client/plugins.ts` contributes none rather than failing config resolution. A registered package that does not export its `package.json` is read from disk rather than failing config resolution.

  The Workflow Vite contribution refreshes the workflow list and materialized revision picker during development by injecting its module index into the development page. The plugin's published client code no longer imports that index, so an application installing the plugin from a registry no longer fails Vite's dependency pre-bundling with `Could not resolve "virtual:nocobase-workflow-client-entries"`, and an application whose `vite.config.ts` does not call `loadAppVitePlugins()` still builds and runs; it only loses the live candidate refresh. To get it, call `loadAppVitePlugins()` as the templates' `vite.config.ts` does.

  ### Vite source root

  Read a Vite contribution's registration options from the application that registered it.

  `AppVitePluginRegistration.config` was declared but never populated, so the Workflow Vite plugin's configurable `sourceRoot` could not be set by any application and always resolved to the default. `loadAppVitePlugins()` now parses the options literal the application passed to the plugin factory in its `client/plugins.ts`. Only statically writable values are read — an argument that is not a literal object of literal values leaves `config` undefined rather than reporting a partial one, because the declaration is parsed and never executed. `workflow({ sourceRoot })` is the supported way to point the Workflow client build at a directory other than `workflows`; keep it equal to the `sourceRoot` in the application's server workflow configuration.

## 0.1.0-beta.20

### Patch Changes

- 64cf25a: Follow `ai.llmServices` becoming a map keyed by service name, with `${NAME}` no longer expanded

  `config check` now reports a `${NAME}` under `ai.llmServices` and `ai.mcpServers` as literal text, as it already did for every other section, since the AI employee plugin no longer expands one. The application development Skill no longer names the AI sections as an exception.

  The templates default `ai.llmServices` to an empty map and declare `server/config/ai.ts` with the AI employee plugin's `defineAIConfig`, so `config check` validates the section and warns about a service with no key, and with an empty `env` for an application's own mappings. The commented AI example in `config.example.yml` shows the map form without a key, says how to set one with `pnpm nocobase config set --from-env`, and no longer claims that a change applies without a restart: a standalone server reads the file when it starts, and `pnpm dev` restarts on its own.

- 414956d: Add runtime `ai-employee models` and `ai-employee test` commands to discover built-in provider model IDs and verify model access before application startup, without connecting to the database or exposing credentials or completion content. Both commands support the standard CLI JSON envelope.

  Register the commands in the Default and Examples templates and document selecting initial enabled models before the first startup. Existing applications must register `@nocobase/app-plugin-ai-employee/cli` in `cli/plugins.ts` and provide the plugin's `@nocobase/app-cli` and `@oclif/core` peers as production dependencies. Model selection for already initialized services remains in the management UI; these commands do not modify database model lists.

- aeff80a: Compose the jobs service, and replace `@nocobase/cron` with `@nocobase/jobs`

  The templates add `JobExecutorServiceProvider` to `server/app.ts`, a `server/config/jobs.ts` offering a `memory` and a `redis` configuration, and `@nocobase/jobs` as a dependency, and remove the Scheduler's `queues.schedule` queue connection. The default and examples templates also add `server/config/scheduler.ts`, where `scheduler.jobs` or `SCHEDULER_JOBS` selects the `jobs` configuration Scheduler runs on. No configuration is the default: until `jobs.default` names one, scheduled jobs run on the built-in memory adapter — one process, its state written under `storage/jobs` when the application stops — and a warning reports it outside development. Set `jobs.default` to `redis` in `config.yml` to run several instances, each firing executed once; Redis must persist its data and use `maxmemory-policy noeviction`.

  `@nocobase/cron` is no longer part of the templates or of this repository; its published 0.1.0 stays installable. Code that scheduled work with `createCronJobManager()` moves to an executor of its own, which also stops several instances from each firing the job:

  ```ts
  import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';

  this.executor = this.app.container
    .resolve(jobExecutorServiceToken)
    .getScheduleExecutor('<your package name>');
  await this.executor.addJob({
    name: 'overdue-scan',
    options: { cron: '0 8 * * *', tz: 'Asia/Shanghai' },
    payload: {},
    execute: async () => {
      /* ... */
    },
  });
  await this.executor.setup(); // in start(); call this.executor.shutdown() in shutdown()
  ```

  The application development Skill describes this in its services and jobs reference, and the deployment Skill covers choosing the schedule backend.

## 0.1.0-beta.19

### Minor Changes

- 84cc7d2: `release upload` and `release deploy` leave `@nocobase/app-cli` for the new `@nocobase/hub-cli` package as `hub upload` and `hub deploy`, and the `nocobase.cli.publishing` flag that registered them is removed. An application gets the commands by depending on `@nocobase/hub-cli`; the Default template declares it in `devDependencies`. `hub deploy` uploads `storage/exports/dist.tar.gz` and deploys it, as `release upload --deploy` did, and with `--release-id` deploys a Release already on the Hub, as `release deploy` did. `hub upload` only uploads and takes no `--deploy`, `--wait` or `--config`. The other flags, the `HUB_*` variables and the exit codes are unchanged; under `--json`, `command` names the new commands, and an unexpected upload failure is `UPLOAD_FAILED` where it was `PUBLISH_FAILED`. The client that `@nocobase/app-cli/hub-publishing` exported is now the `@nocobase/hub-cli` package root, and the Hub's `NO_DEPLOYMENT` and configuration-conflict messages name `hub deploy --release-id`.

  A direct `@nocobase/` dependency whose `package.json` names a CLI entry in `nocobase.cli.entry` now contributes that entry's `defineCliPlugin` commands without an entry in `cli/plugins.ts`, and a package that is not an application plugin takes its topic from its name without the `-cli` suffix. The runner imports such a package only for a command under its topic, for help on the whole tree and for `commands`; a package the application requires but nobody installed is reported as `PACKAGE_NOT_INSTALLED` with `pnpm install` as the suggestion. `AppLocation` no longer has `publishing`. `@nocobase/hub-cli` ships a `nocobase-hub-cli` Skill, and the `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

### Patch Changes

- a857a08: The application development Skill reads the procedure `pnpm create @nocobase/app --json` returns from `result.nextCommands`, where create-app now prints it.
- db16945: Toasts go through a toaster that `@nocobase/app-client` defines and the application implements, so code that reports a result no longer depends on how toasts are rendered.

  - **App client.** `useToaster()` returns the application's `Toaster`. Its `show({ type, title, description, action, duration, id, onClose })` returns an id that `close(id)` takes, and `resolveToaster(app.services)` returns the same toaster outside React. The application registers the implementation under `toasterToken`; `@nocobase/app-client` registers none. Without one, nothing throws: each toast is logged to the console instead, an error toast as an error, and the first says how to register a toaster. Clicking a toast's action runs its `onClick` and leaves the toast open.
  - **Templates.** `client/lib/toaster.ts` forwards toasts to the Base UI `toast` manager that the mounted `Toaster` renders, and decides their presentation for the whole application: an error written as plain text is announced at once, while one with an action, or with an element for its title or description, keeps the default priority. `client/service-provider.ts` registers it in `register()`. The account menu, the language switcher and the Examples route overlay demo show their toasts through `useToaster()`.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `useToaster()` instead of `Toast.useToastManager()` from `@base-ui/react/toast`, and no longer choose a toast's priority. They need the `@nocobase/app-client` that exports it, and the application has to register a toaster: without one nothing throws, but their toasts only reach the console, and a Hub page whose only content is an error shows nothing. They no longer require a Base UI `Toast.Provider`.
  - **Skills.** The frontend references and each affected plugin's Skill describe `useToaster()`, and the `nocobase-app-upgrade` edge case "Notifications and the application toaster" replaces "Notifications and the Base UI toast".

  Upgrade an existing application with the `nocobase-app-upgrade` Skill, which brings `client/lib/toaster.ts` and its registration together with the new `@nocobase/app-client` and plugin ranges; follow the same steps when upgrading by hand. `pnpm nocobase plugin update` is not enough on its own: the plugins stay inside the application's `^1.0.0-beta` ranges, so it installs them, but it leaves `@nocobase/app-client` where it is, and their pages then fail to load for want of `useToaster`.

## 0.1.0-beta.18

### Minor Changes

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

## 0.1.0-beta.17

### Patch Changes

- 2f97f00: Add an application development reference for building an organisation dimension, such as a department tree with memberships and heads, and wiring it into authorization. `references/organization.md` is the entry page, with the scope, model decisions, steps and pitfalls; `references/organization/` holds the detail: `model-and-service.md` (model, self-contained migration, organisation service and routes), `settings-page.md` (one localized name for the menu entry, settings item and subject type, and seeded titles stored as translation descriptors), `subjects.md` (inherited subject types, attribute sync into business data scopes, session refresh, and seeds that write demonstration accounts with `hashPassword` and assign existing permission sets to departments and job roles to people), `scopes.md` (a department-head subject, the 本部门 and 本部门及下属部门 data scopes, and detecting the optional rule plugins at runtime and in seeds), `permission-design.md` (permission sets per job role with relative department scopes, department baselines versus job roles, heads, owner-based versus record-carried scopes, and sharing specific records with another department), and `testing.md`. The Skill's reference table and the authorization reference link them.
- a4ee8aa: The `nocobase-deployment` Skill now offers `@nocobase/app-installer` for a standalone deployment on a server without a Hub or containers: it installs the application's deployment archive, upgrades to a new one with a backup and an automatic rollback, and is driven by the global `nocobase-app-installer` Skill. An unmodified Hub is installed with the same package's `--template hub`. The `nocobase-app-development` Skill names `APP_STORAGE_DIR` as the standalone storage variable.

## 0.1.0-beta.16

### Minor Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- ae43f41: Tidy the `release upload` and `release deploy` commands and make `--json` output consistent across the CLI.

  - The JSON document's `operation` is now `release:upload` or `release:deploy`, matching the command id, instead of `app.upload` or `app.deploy`. Scripts that match on the old values need updating.
  - `release upload` and `release deploy` are no longer registered in a built `dist/`. They publish the archive `nocobase build --tar` writes beside the sources, so run them in the source checkout or in CI.
  - A path given to `--file` or `--config` now resolves from the current directory rather than from the App root. Without `--file`, upload still reads `storage/exports/dist.tar.gz` in the App root.
  - An argument error names the flag that is missing, invalid or unknown, such as `Missing required flag --release-id.`, and still never repeats a value. A failure with no known cause suggests `NOCOBASE_CLI_DEBUG=1`, which prints that cause to stderr.
  - Both commands have a description and examples in `--help`, and `--hub` is described the same way on both.
  - `plugin register`, `plugin unregister`, `plugin update`, `plugin inspect`, `package remove` and `skills sync` print a `--json` failure on stdout, as a success already was and as every other command already did. A caller reads one stream and checks the exit code.
  - The Hub publishing guidance moves from the `nocobase-app-development` Skill to `nocobase-deployment`, the CLI reference describes the stdout-only `--json` contract and path resolution, and the Hub API key Skill states the new path rule.

- 05af1d4: Refresh the Collection cache when migrations change a schema

  `database/<connection>/collections/` went stale after every migration until someone ran `collections generate`. It is now refreshed where the schema changes:

  - `db apply`, `db redo`, `db rollback` and `db reset` regenerate it for each connection whose migrations they executed, rolled back or rebuilt. `--no-collections` skips it, and a built `dist/` never writes it. A failed refresh is a warning, not a failure: the migrations stay applied and the command still exits 0. With `--json`, the result gains a `collections` field listing each refresh; it is absent when nothing was refreshed.
  - `pnpm dev` does the same after the startup migrations of the application it started. `nocobase dev` names that application's root in `NOCOBASE_COLLECTIONS_REFRESH`, which `DatabaseProvider` compares against its own root, so a Hub's in-process applications and production never write the cache.
  - `refreshAppCollectionsArtifact()` in `@nocobase/app-server/database` is the shared implementation: given a database run's result, it regenerates the cache of every connection whose schema changed.

  Seeds and `db repair` or `db unlock` do not trigger a refresh. After editing an external connection's `metadata/`, or when another system changes its schema, run `collections generate` yourself.

- 4adcf24: Keep hand-written Collection metadata apart from the generated `collections/` cache

  `database/<connection>/collections/` used to hold two opposite things: a generated snapshot for a managed connection, and, for an external connection, `metadata.json` files that were the hand-written metadata source. The two now live in separate directories, so a directory is either written by people or generated, never both.

  - `DirectoryCollectionMetadataStore` reads a directory of `<name>.json` files, each holding one Collection metadata document with no wrapper. It refuses a directory in the generated `<name>/metadata.json` layout and says how to move it.
  - An external connection with no configured `metadataStore` reads `database/<connection>/metadata/<name>.json`. A `metadataStore` string names a directory in that layout, and may not point at a generated `collections/` directory. An application that still keeps metadata at `database/<connection>/collections/<name>/metadata.json` fails at startup with the steps to move it, rather than silently resolving its Collections without metadata. `resolveAppMetadataDirectory()` is exported beside `resolveAppCollectionsDirectory()`.
  - `collections generate` treats `collections/` as a cache for every connection, external ones included: it writes all three files there and never touches `metadata/`. The `orphans` result field is gone; a hand-written document whose Collection the database no longer has is reported as `unusedMetadata` and left in place. `_manifest.json` now records `generated: true`.
  - `nocobase build` copies `database/<connection>/metadata/` into `dist` instead of the `metadata.json` files under `collections/`.
  - The templates and generated applications ignore `/database/*/collections/` with one line instead of naming each managed connection. The Examples template moves its external CRM metadata to `database/externalCrm/metadata/`.

  To upgrade an application with an external connection, write each `"document"` from `database/<connection>/collections/<name>/metadata.json` to `database/<connection>/metadata/<name>.json`, point any `metadataStore` string at the new directory, delete the old `collections/` directory and regenerate it. Replace the per-connection `collections/` lines in `.gitignore` with `/database/*/collections/`. The `nocobase-app-upgrade` Skill lists the steps.

- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

### Patch Changes

- ec92b20: `nocobase commands` lists every command registered where it runs — the built-in ones, the application's `app` commands and each registered plugin's — and `--json` returns them as data for agents and scripts: `{ commands, topics }`, each command with its `id` (`db apply`), `summary`, `description`, `source` (`builtin`, `app` or `plugin`, with the plugin's `package`), `developmentOnly`, whether it takes `--json`, `--dry-run` and `--force`, its `args`, its `flags` (`name`, `char`, `type`, `description`, `required`, `multiple`, a static `default` — with `defaultRelativeTo: "application-root"` when it is an `appPath()` default — and `options`) and its rendered `examples`. In a built `dist/` it lists no development command.

  Invalid usage answers with what was probably meant. A nonexistent flag suggests the closest flags (`Did you mean --connection?`) and the command's `--help`; an unknown command suggests the closest command ids with the command to run each, or the help of the topic a single misspelled word was meant to be, and `pnpm nocobase commands --json`. The message names the command's own flags, arguments and allowed values and never repeats a value that was typed, since a mistyped command line can leave a secret anywhere in oclif's wording; it no longer ends with oclif's "See more help with --help". A value a flag's parser rejects is reported as `INVALID_USAGE` with exit code 2 instead of `UNEXPECTED`, and every usage failure keeps exit code 2. Without `--json` the suggestions print under "Try this:". With `NOCOBASE_CLI_DEBUG` set, a failure's diagnostics print once, and oclif's own raw stack no longer replaces the message and its suggestions.

  The application Skills point agents at `pnpm nocobase commands --json` for the whole command tree.

  Piping a command's output into a reader that stops early, such as `| head`, no longer ends the run with exit code 13 and an "unsettled top-level await" warning: the runner stops waiting for stdout once the reader has closed it.

- dbf5631: The application Skills describe the current command line. An external connection's metadata store defaults to `database/<connection>/metadata/<name>.json`, with `collections/` as the generated cache; `config init --config` resolves against the application root; and the upgrade guide maps `app deploy`, `plugin skills sync`, `plugin cli-hooks`, the `demo` topic and the `migrate`/`seed` aliases to their replacements, lists `@refinedev/cli` and `tsc-alias` among the development tools an application provides, and covers deployment runbooks that called the old `dist/package.json` scripts.
- 757eedf: Describe route `authz` inheritance and defaults in the frontend references

  The page, child route, overlay, frontend development, testing and authorization references no longer say that every page must declare `authz` or that registration rejects a page without it. They describe the current rule: declare `authz` on the first page of every path; a nested page that omits it inherits its nearest ancestor page's value; a first page that omits it still registers, with a development warning, as unrestricted-only (root) on protected App and settings pages and as `'skip'` on guest, optional and dev pages. They recommend always declaring it and document `'unrestricted'` as an explicit root-only value that is never offered as a grant.

- 8c06293: The application templates no longer carry forwarding files in `cli/`: `cli/database-command.ts`, `cli/hub-publishing.ts`, `cli/commands/i18n-check.ts` and `cli/standard-commands.ts` are gone, and `cli/commands/index.ts` now calls `createAppCommands` itself. `@nocobase/app-cli` drops the `./database-command` and `./commands/i18n-check` subpaths that existed only for those files; `./hub-publishing` remains. An existing application generated from an earlier template re-exports those subpaths, so upgrading `@nocobase/app-cli` requires the same change there: delete `cli/database-command.ts` and `cli/commands/i18n-check.ts`, and move the `createAppCommands` call from `cli/standard-commands.ts` into `cli/commands/index.ts`. The helpers behind the two removed subpaths are no longer public.
- 2217eb2: Remove `@nocobase/app-plugin-notification-provider` and show every notification through the Base UI toast the templates already ship. The package is no longer published, and Sonner is no longer a dependency of anything.

  - **Templates.** `client/react-providers.ts` mounts the `Toaster` from `client/components/ui/toast.tsx` once, in the `application` layer, and the account menu and language switcher call `toast.add` from `@/components/ui/toast`. A rule at the end of `client/styles.css` lifts the toast viewport above dialogs and sheets, which share its `z-50`. The plugin and `sonner` leave `client/plugins.ts` and `package.json`, and no Refine notification provider is registered.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `Toast.useToastManager()` from `@base-ui/react/toast` instead of Sonner or Refine's `useNotification()`, so they now require the application to mount a Base UI `Toast.Provider`; without one their pages fail with `Base UI: useToastManager must be used within <Toast.Provider>`. They move to `1.0.0` for that reason, which keeps an existing application's `^0.1.0` ranges, and so `pnpm nocobase plugin update`, from installing them before the toaster is in place. Hub notifications appear where the application's toaster places them rather than top-right. `sonner` and `@refinedev/core` are no longer peers.
  - **Skills.** The frontend references describe `toast.add` from `@/components/ui/toast` in place of Sonner, and each affected plugin's Skill names the toaster requirement and the error that reveals it.

  Upgrade an existing application by moving to this template release with the `nocobase-app-upgrade` Skill, which brings the new plugin ranges together with the toaster. Its "Notifications and the Base UI toast" edge case (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) lists the steps, their order, and how to verify the pages afterwards; follow the same steps when upgrading by hand.

## 0.1.0-beta.15

### Patch Changes

- c2aceaa: Rewrite the AI Employee App Skill as a build order that matches the code

  The `nocobase-app-plugin-ai-employee` Skill synchronizes into every application that depends on the plugin, so an agent writes what it says. It is rewritten as a build order — configure a model, write the tool, register, define the employee, mount the chat, verify — with a table of what to build for what the user asked and completion checks that are observed rather than read back, and every rule in it is checked against the current code:

  - **Setup.** How to install and upgrade the `nocobase-ai` Registry item, and how to keep an LLM key out of the repository and the transcript: the user runs a hidden-input command built for their own environment and verified with fake values, with the exact rules for writing it into a shell profile, `config.yml` or `.env`, and why `.env.local` and the starting environment override `.env`.
  - **Chat.** The readiness gate, `defaultEmployee`, attachments enabled on every chat surface unless the user declines them, `enableWebSearch` on every chat surface unless the user declines web search, controlled dialog and side-panel surfaces wired to the controller that a floating trigger opens, tasks and their tool allowlist, page context and forms, and the plugin's working example pages under `/dev/ai-components`, with what not to copy from them.
  - **Server.** Employees and tools register only through `AIResourceRegistrar`, and Skills only as `SKILL.md` files; the agent contracts — state, context and declared dependencies, the `invoke()` result, interrupts, error codes; running an agent unattended, as a real service account, with the conversation's own `skillSettings`, a bounded interrupt loop and a timezone; and `createAgent()` with its Skills and checkpointer.
  - **Configuration.** LLM services and `enabledModels`, MCP servers — credentials in `headers` or `env`, what is persisted and what a rename discards — attachment storage, and web search only on a provider that searches.
  - **Runtime extensions.** A new reference covers dynamic tools, a custom LLM provider and a direct model call. It replaces the separate `nocobase-ai-employee` Skill that sat unpublished in `@nocobase/ai-employee`, which no application ever received.

  The application development Skill in `@nocobase/app-skills` names the AI Employee plugin in its table of installed plugins, so an agent building an assistant feature learns that the plugin and its Skill exist.

- f6c3cd8: Let a configuration section declare validation and the fields the browser may read, and use it to hide sign-up when the server has disabled it.

  `defineAppConfig` in `@nocobase/app-server/config` now also takes an object, `{ defaults, validate, public }`, where `defaults` is an object or a function of the runtime; the function form keeps working unchanged. `validate` may be async and reports with `ctx.error(path, message, { fix })` and `ctx.warning(path, message)`. It runs when the application starts, where an error stops the start with every problem listed, on `AppConfig.reload()`, which refuses a configuration that breaks a rule and keeps the running one, and in `pnpm config:check`, which reports each problem with code `invalid`. `defineAppDatabaseConfig` now checks that `database.default` names a configured connection and that every connection sets a dialect. `checkConnections` moved from `@nocobase/app-cli` into `@nocobase/app-server/database`.

  `public` lists leaf fields, relative to the section, that are sent to the browser in a separate `public` block of the page's runtime configuration. The browser reads them with `config.public.get('<section>.<field>')` at the same path as on the server; `config.get` never returns them and, in development, throws when asked for one, and `config.public.get` warns with the published paths when asked for one that is not. Anything not listed is never sent, and an object, function or instance cannot be listed. `i18n.defaultLocale` is now always published this way; the client still falls back to `client.i18n.defaultLocale`. `pnpm config:check` lists the published values, and its `--json` result carries them under `public`.

  `@nocobase/app-plugin-authentication` adds `defineAuthConfig` for the `auth` section, which validates the `emailAndPassword` switches and publishes `emailAndPassword.enabled` and `emailAndPassword.disableSignUp`, and `useSignUpAvailable()` on the client. The templates declare `auth` with it, their `PasswordLoginForm` hides the sign-up link and `/register` redirects to `/login` while the server refuses sign-up. An existing application keeps working but must switch `server/config/auth.ts` to `defineAuthConfig({ defaults: { ... } })` for this to take effect; until then the plugin logs a warning at startup. Copy the updated `password-login-form.tsx` and `pages/auth/register.tsx` from the new template version to get the same behavior.

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- d18e964: Declare environment variables on the configuration section they set, list them with `pnpm config:env`, and stop shipping environment variables nothing reads.

  `defineAppConfig` takes `env`, a map from variable to a mapping relative to the section, such as `{ APP_SERVER_PORT: envInteger('port') }`. The runtime loads these above the configuration file once the sections are known, and refuses one variable declared for two different fields. `defineAuthConfig` maps `AUTH_SECRET` itself, and the templates declare the rest in `server/config/session.ts`, `server.ts`, `app.ts`, `i18n.ts`, `snowflake.ts` and `spa.ts`. `server/environment.ts` is gone and `server/config.ts` loads only the configuration file. An existing application that keeps its own `server/environment.ts` still works, since a variable mapped twice to the same field is harmless; to move over, copy the `env` of each section file from the new template version and delete the mapping file.

  `pnpm config:env`, also in a built `dist/`, lists every variable the application reads — those its sections declare, with the configuration path each sets, and those the runtime reads itself, `APP_BASE_PATH`, `APP_CONFIG_FILE` and `NOCOBASE_STRICT_STARTUP` — and whether each is set, never its value. `--json` prints the same list. `RUNTIME_ENVIRONMENT_VARIABLES` in `@nocobase/app-server/config` names the runtime-read ones.

  `APP_NAME` is gone from the Hub's `.env.example` and from the `.env` that `create-app` writes for a Hub, which used to set it to the project directory's name: nothing read it, and an application's name follows from `APP_BASE_PATH`. The commented `API_CLIENT_*` lines are gone for the same reason. The Hub template gains a test that every variable `.env.example` names is one `config:env` lists. `pnpm build` no longer copies `DB_*`, `QUEUE_*`, `REDIS_*`, `SMTP_*`, `API_CLIENT_*` and the notification provider variables into `dist/.env`; nothing reads any of them.

- 91cc403: `PageContainer`, `PageHeader`, `RouteDialog`, `RouteDrawer`, `RouteChildPage` and `useRouteOverlay` now come from the NocoBase UI Library, which publishes them as the `page-container`, `page-header`, `route-dialog`, `route-drawer` and `route-child-page` components, and plugins install those instead of copying template files. They stay in `client/components/` under the same names and import paths. The template copies now match the library: exports carry explicit types, every component merges class names with `cn` from `@/lib/utils`, and the route overlays' close button is translated under `routeOverlay.close` rather than `actions.close`. Existing applications need no change; to adopt the library versions, run `npx shadcn@latest add @nocobase/page-container @nocobase/page-header @nocobase/route-dialog @nocobase/route-drawer @nocobase/route-child-page`, let it overwrite each copy you have not customized, and add `routeOverlay.close` to `client/locales/`.
- 0231d46: Type-check the paths read through `config.public`. `config.public.get` and `has` now accept only paths declared in the new `PublicAppConfig` interface, and `get` returns that field's type, so a mistyped path or a wrong value type fails `typecheck` instead of reading `undefined` at runtime. A section's owner declares its public fields by augmenting the interface from `@nocobase/app-client`; `i18n.defaultLocale` is declared by the client itself, and `@nocobase/app-plugin-authentication` declares `auth.emailAndPassword.enabled` and `auth.emailAndPassword.disableSignUp`. `PublicConfigPath` and `PublicConfigValue` are exported for code that forwards such a path.

## 0.1.0-beta.14

### Minor Changes

- 8240685: Replace the frontend references of the application development Skill with a frontend workflow, UI guidelines and a frontend handbook under `references/frontend/`.

  `references/frontend/ui-workflow.md` is now where every change under `client/` starts: it decides between a full workflow (a design file reviewed once, then an independent acceptance review with screenshots) and a quick change (edit directly, static checks only), and says what to read at each step. `ui-guidelines.md` holds numbered Must/Should rules for page templates, overlays, states, copy and accessibility, used to design pages and to review designs and implementations. `frontend-dev.md` routes each task to a topic document in `references/frontend/references/` — pages and routes, child routes, route-first dialogs and drawers, forms, calling endpoints, tables, styling, theme tokens and presets, copy and translations, frontend tests — with complete examples. The workflow ships fill-in templates for its artifacts and a Playwright screenshot script.

  The references these documents replace are removed: `client-pages-and-routes.md`, `client-child-routes.md`, `components-and-styling.md`, `react-hook-form.md`, `header-actions.md`, `client-api.md`, `theme-tokens.md` and `themes.md`. `i18n.md` now covers server-side text, the languages the application offers, the default language and fallback, and `testing.md` points frontend testing to the new handbook. Each template's `AGENTS.md` and `CLAUDE.md` point at the new documents.

### Patch Changes

- d7543b5: Support users.initialAdmin.email for fresh installations, defaulting to admin@nocobase.com when omitted, and document every initial administrator field in the template configuration examples.
- d5a18ff: Ship a `Dockerfile` and `Dockerfile.dockerignore` with every application template. The image builds the application from its own sources with `pnpm build`, cross-targets native modules for multi-platform builds, and runs `node dist/server/standalone.js` as the `node` user without pnpm, with configuration at `/app/config.yml` and storage at `/app/storage`. Set the mount path with `--build-arg APP_BASE_PATH=...`; `.env` is not copied into the image. `--build-arg DIST=prebuilt` packages a `dist/` built beforehand with `pnpm build --target linux-<arch>` instead, after checking that it matches the image's platform, Node major and mount path, and without its `dist/.env`. Existing applications do not receive these files on upgrade: copy both from the new template version. The official Hub image is now built from the Hub template's Dockerfile, keeps its data in `/app/storage`, and no longer fails to start with `EACCES` when `HUB_STORAGE_DIR` is unset; a deployment that mounted `/app/dist/storage` should mount the same volume at `/app/storage` instead.

## 0.1.0-beta.13

### Minor Changes

- 4e58fe3: Add `nocobase app config check` and `nocobase app config set`, run in an application as `pnpm config:check` and `pnpm config:set`, so a configuration is written by `config:init`, changed by `config:set` and verified by `config:check`.

  `config:check` loads the configuration through the application itself — its files, its environment and its code defaults — without starting it. A file that fails to parse, or a database driver that is not installed, fails here for the same reason it would fail a start. It then reports what loading alone does not show: a secret missing or still the placeholder, a `session.secret` that is regenerated at every start and so ends every session with the process, a top-level section nothing reads with the name that was probably meant, and a `${NAME}` written where it is not expanded and would be used as literal text. Databases other than SQLite are connected to, one connection each taken from the pool and handed back, without running SQL or migrating anything; `--connect` includes SQLite and `--no-connect` stays offline. Each finding carries the key and, where there is one, a command that fixes it, and the command exits non-zero on any error, or on any warning with `--strict`.

  `config:set` sets `key=value` assignments in the file the application reads, keeping its comments, and writes it once. A key under a section the application does not know is refused with the nearest known one, so a typo fails instead of being written where nothing reads it. With `--from-env` each value names an environment variable to read, so a secret stays out of the command line. After writing it loads the configuration again and reports any key an environment variable overrides.

  `config:init` now returns its `nextCommands` and, for a database other than SQLite, the `requiredSettings` still at a placeholder. On a terminal it asks for them, reading the password without echo, and tries the connection before writing. Run on an application that is already configured it leaves the file alone and reports `unchanged`, failing only when `--dialect` asks for a different database than the one configured.

  A built `dist/package.json` carries `config:check` and `config:set` scripts, and its `pnpm-workspace.yaml` sets `verifyDepsBeforeRun: false`, so running one of a deployment's own scripts never makes pnpm install first. `create-app` includes `pnpm config:check` in the `nextCommands` it returns.

  `AppConfig` gains `layers()`, which returns the code defaults and the values the application's own sources supply as separate read-only copies — the distinction a check needs to tell a known section from a misspelled one.

- 4e58fe3: Add `nocobase app config init`, which writes the configuration file an application starts from, and run it in an application with `pnpm config:init`.

  It generates `config.yml` from the application's `config.example.yml` so the example's comments reach the file people edit, fills in `auth.secret` and `session.secret`, and points `database.connections.main` at the selected dialect while leaving every other connection alone. The dialect defaults to the installed driver when there is exactly one, is asked for on a terminal when there are several, and must be given with `--dialect` in a script.

  The command installs nothing. Which dialects an application can run on is decided by the driver it depends on, so a missing one is reported with the `pnpm add` that supplies it — pinned to the range the installed `@nocobase/app-server` declares for that driver, because the newest release is not necessarily one the runtime was built against — rather than installed behind the user's back — in a deployment, where adding a driver to a built `dist` would be undone by the next build, it reports that the application has to be built again instead. Everything is validated before anything is written, so a run that reports a problem leaves the directory untouched and can simply be repeated once the driver is there.

  The three application templates now declare `@nocobase/db-sqlite`, the driver their own `server/config/database.ts` defaults to, so a new application can be configured and started without installing one first.

  `@nocobase/app-server` exports `OFFICIAL_DIALECTS` and `OfficialDialect` from `@nocobase/app-server/database`, so tooling that has to name the dialects reads the same list the runtime loads drivers from.

  The application development and deployment Skills describe the new step: how an application is configured, that the driver decides which dialects it can run on, and that a deployment writes its configuration with `pnpm config:init` inside `dist/`, from the `config.example.yml` the archive carries. The database Skill shipped with `@nocobase/db` now points at `pnpm config:init` rather than at a creation flag that no longer exists.

### Patch Changes

- 571e54e: Document where a Hub publishing key comes from in the application development Skill. `HUB_API_KEY` was named as a required variable without saying that it is created on Hub's API Keys page, bound to selected applications, and scoped to `upload-release`, `deploy`, or both, so agents and users had to find the entry point and permissions elsewhere.
- 1124eeb: Revert the Settings theme page and the converted theme presets.

  Theme selection returns to the header's Appearance popover, which again offers both the color mode and the theme list, and Settings → Theme is removed. The 30 presets converted from tweakcn are removed, the Compact and Spacious presets return in place of the single `default` density, and the `appearance` locale block goes back to `title`, `mode`, `preset`, `light`, `dark` and `system`. The theme references in `@nocobase/app-skills` describe the popover again, while keeping the guidance that surface and outline tokens name a layer rather than a shade.

## 0.1.0-beta.12

### Minor Changes

- 2ae6b2b: Ship the `nocobase-deployment` Skill with `@nocobase/app-skills`, so `nocobase skills sync` delivers it to every generated application instead of leaving it in the source repository where an application's agent never sees it. The Skill now reads the application's own README rather than repository paths, says that `pnpm build` already installs production dependencies into `dist/` and that `pnpm install --prod` there is a repair rather than a deployment step, and names both ways to enable a workflow whose deployed hash changed: **Enable new version** in workflow management, or the enable route called with the new hash. Each template's `AGENTS.md` points at the Skill next to the upgrade Skill, and the README's deployment section explains the same `pnpm install --prod` relationship.

### Patch Changes

- d5bafd4: Include the shadcn/ui React Hook Form guide in the application development Skill and require consulting it when implementing frontend form validation.
- 8f1ead4: Add `nocobase app db doctor`, which compares stored Collection metadata with the schema behind it and deletes the records whose table is gone.

  The physical schema and the Collection metadata are two records of what exists, and they can disagree: a table dropped outside a migration leaves its metadata record behind, and from then on resolving that Collection fails — including inside the migration that would recreate it, which is how the state becomes self-sustaining. Until now nothing reported it and nothing fixed it, so the only way out was deleting rows from `__nocobase_collection_metadata` by hand, which the documentation forbids for good reason.

  `ConnectionCollections.diagnose()` walks every metadata record, reports the ones whose physical table is missing as `COLLECTION_TABLE_MISSING`, and for the rest reports whatever resolving them reports. Only a missing table is marked `orphaned`, because deleting the record is then a complete fix; every other issue means the table is there and something in it no longer matches, which a migration has to reconcile.

  `db doctor` prints what disagrees per connection and exits non-zero while anything remains. `--fix` deletes the orphaned records and leaves the rest alone, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. The three templates gain a `db:doctor` script.

  `runAppCollectionsDoctor` is exported for hosts that run it themselves, and the connection selection the artifact generator already had is now shared rather than duplicated.

  The migrations reference also records why `onChecksumMismatch` defaults to `warn` and when to set `error` for a connection. The default was an implicit choice in the code, leaving a reader no way to judge whether to flip it: a checksum hashes the migration's file contents, so formatting the directory changes it and `error` would then stop the application from starting; startup runs migrations, so refusing to run turns drift into an outage on an upgrade where the compiled representation hashes differently. Nothing about the behaviour changes.

- ffafc2a: Replace notification configuration with named single-Provider Channels and send complete messages through a Channel-keyed map. Validate all messages before enqueueing, deliver native recipients independently, and retain retries bound to the original Channel and Provider. Simplify the test form and remove Provider instance names from delivery records with a new migration.
- a1a8690: Expire a task lock whose holder was killed, and add `nocobase app db unlock` to inspect and release one.

  A run that is hard-killed — SIGKILL, a stopped container, a lost machine — runs no cleanup, so its lock row survived it and every later run waited out the acquire timeout and then failed, until somebody deleted the row by hand. A holder now refreshes a `heartbeat_at` column every five seconds while it works, and a lock that has not been refreshed for thirty seconds is taken over by the next run, which then continues normally. The takeover is reported through `onStaleLock` and logged by the application, because it means a previous run did not shut down cleanly. A working run is never taken over: several missed beats are tolerated, so a slow database does not hand the lock to a second run.

  The lock table gains `heartbeat_at`, added in place when the table predates it. It cannot be a migration: the lock is what every migration runs inside.

  `db unlock` reports who holds each lock — the owner, when it was taken, and its last heartbeat — and releases the ones that have stopped beating. A lock that is still beating is reported rather than released; `--force` releases it anyway, which lets a second run start beside the first. It covers the migration and the seed lock together, takes `--connection` / `--all` / `--json` like the other database commands, and needs no migration or seed directory, since startup and plugins take the same locks. The three templates gain a `db:unlock` script.

  `Migrator` and `Seeder` gain `lock()`, which reads the lock without creating its table, and `unlock(options)`. `AppDatabaseTaskOperation` gains `'unlock'`, and a task result carries `lock`, `released` and `lockReason`. The exhausted-wait message now names the last heartbeat and points at `db unlock` rather than at deleting a row by hand.

- 183751a: Synchronize application Skills after installation and consolidate client and server development guidance into each template's root AGENTS.md.

## 0.1.0-beta.11

### Minor Changes

- 5380642: Hand the database API back to the `nocobase-db` Skill and keep the application side here.

  The application development Skill carried its own account of the database API because the package published none. Now that `@nocobase/db` ships a Skill of its own, two copies would drift, and the copy here had already fallen behind: it documented QueryAdapter but not Repository, and its seed example wrote rows through `query` when a seed context now defaults to `repository`.

  So the three database references keep what the application owns — where `database/<connection>/` sits, what `pnpm db:apply`, `db:reset` and `db:repair` do, how additional connections configure their tasks, legacy directory migration, checksum drift, compiled manifests, the task `config` reader, dialect packages and their fields, driver installation and native binaries — and point to the package's Skill for the API the files are written against. `migrations.md` loses the migration and seed examples, the field builders, the alter operations and the naming rules; `database-and-data.md` keeps resolving the manager, where data access belongs in an application, and generated IDs.

### Patch Changes

- 56613b2: Point the application development Skill at `client/pages/reference/` before it designs UI of its own. Every current template ships worked screens and one page per shadcn/ui primitive there, unrouted and kept to be read, so the Skill names which page to open for a list, a record editor or a settings screen, and says to copy the structure without importing or routing the source. An application generated before that directory existed does not have it, and the guidance says so rather than sending the reader after a missing path.
- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

- fa01814: Report migration and seed checksum drift as a warning instead of failing, and add `nocobase app db repair` to realign the recorded history.

  An executed migration or seed whose source has since changed no longer stops the run. `latest()`, `rollback()` and `run()` return the drift in a new `warnings` field, the CLI prints it, `--json` carries it, and startup logs it through the application logger. Set `onChecksumMismatch: 'error'` on a connection's `migrations` or `seeds` configuration, or at the top level, to keep refusing to run. A history record whose migration is missing from the sources entirely still fails regardless of the policy.

  `pnpm db:repair` rewrites recorded checksums to match the current sources, covering both migrations and seeds in one command. It previews before writing, prompts for confirmation unless `--force` is passed, supports `--dry-run` for inspection in CI, and conditions every write on the checksum it read, so a history changed in between fails rather than being overwritten. It never deletes a history record, so a repair cannot make an executed task run again.

- fa01814: Add `db apply` and `db reset`, and retire `migrate --fresh`.

  `nocobase app db apply` (`pnpm db:apply`) runs migrations and seeds as one plan, in the order startup runs them: each connection is migrated, then seeded. Only pending tasks run, so repeating it is safe. `nocobase app db reset` (`pnpm db:reset`) drops every managed schema object first and reruns both from empty; it asks for confirmation and requires `--force` in CI or a non-interactive terminal.

  `migrate --fresh` is removed and now exits with a pointer to `db reset`. It rebuilt the schema without reseeding, so it left the seed history cleared and no seed executed — the default connection recovered on the next startup, and a connection with `autoRun: false` did not.

  The `migrate` and `seed` commands are removed along with their template scripts; `db apply` replaces both. Running one half on its own is not a separate command, because both halves apply only what is pending: on an already-migrated database `db apply` applies seeds alone, and the one case it does not cover — migrating ahead of a deployment without seeding — can be served by a flag later without breaking anything.

  `runAppDatabaseTasks` accepts several task kinds in one plan through its `kind` option, which is what makes a reset correct across both kinds: one plan means a connection's schema is rebuilt by its migrations task before its seeds run.

- 7bde7bd: Add `nocobase app db rollback` and `nocobase app db redo`, so a migration corrected before its branch is merged can be re-run without resetting the database.

  Editing an executed migration changes nothing on its own: it is recorded as executed, so `db apply` skips it and the database keeps the schema the old source produced. Until now the only way forward was `db reset`, which drops every managed table and every row with it, or editing the history table by hand — which the documentation forbids, and which splits the two records of what exists: dropping a table without its metadata record leaves the Collection unresolvable.

  `db rollback` runs `down()` for the latest migration batch, newest first, and deletes its history records. The batch is the unit the history records, so a batch that mixed application and plugin migrations rolls back as one, and the confirmation lists every migration with the package it belongs to before anything runs. It fails having run nothing when a migration in the batch is irreversible or has no `down()`. `db redo` is that followed by `db apply`. Both are destructive in the same way and confirm the same way: CI and non-interactive terminals require `--force`, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. Seeds are not re-run, so rows a seed inserted into a table the batch recreates are not restored.

  `Migrator.rollback()` accepts `{ dryRun: true }`, which is what the confirmation is built from: it takes the lock, resolves the batch, rejects an irreversible one, and reports what a run would undo without running any `down`. `MigrationRollbackResult` gains `records` — the batch's history records in rollback order, carrying each migration's package — and `dryRun`. `AppDatabaseTaskOperation` gains `'rollback'`, which applies to migrations alone: a plan including seeds is refused, because seeds have no inverse.

  The three templates gain `db:rollback` and `db:redo` scripts. The migrations reference now documents re-running a corrected migration, states what `db:repair` is and is not for — it records that the schema already matches, so using it on a change the database never received leaves the schema wrong and nothing recording that — and lists each internal table with the command that maintains it.

- 56613b2: Index `client/pages/reference/` so an agent can find the right page instead of listing the directory. A new `README.md` there maps the screen being built to the example page and the blocks inside it, and the interaction needed to the component page that demonstrates the primitive, with the Base UI API detail each one is easy to get wrong; every example page now opens with a module comment naming the patterns it holds, the component or block holding each one, and the parts that are demonstration filler.

  The application development Skill points at that README and turns "read a worked page" into ordered steps: pick the page from the table, read its header, open only the blocks the task needs, check the primitives exist, copy the skeleton without the mock data or frame, and move the strings into the application locales. Its components reference gains a section on Base UI composition — `render` in place of `asChild`, `data-icon` on icons beside text, grouped menu items, nullable `onValueChange` values — and a table of the compositions the template ships in `client/components/`, including that `toast.add` needs a `Toaster` the shell does not mount.

- d4783c2: Guide agents to preserve extension components and page source during customization, disable frontend feature availability reversibly, and enforce disabled operations on the server.
- d4783c2: Guide application agents to scope formatting, lint, type checking, tests, builds, and runtime verification to affected files, projects, or packages, expanding checks only when the impact requires it.
- d696700: Give every settings surface the token that matches what it is, so panels stop disagreeing with one another.

  The permission set editor is where this shows: its two tabs sit in one panel, and the permission configuration tab painted itself `bg-background` while the assignment tab inherited the panel's `bg-card`, so switching tabs changed the page colour under the same heading. The same mistake is spread across the settings pages, and none of it is visible under a preset whose page and card are near-identical.

  Each token names a layer rather than a shade, and every site now uses the one that describes it. A panel resting on the page is `bg-card`, which is what the AI tools and skills pages already used while the LLM service, MCP service, conversation, API key, user and notification log panels named the page surface instead — two lists in one plugin, one framed and one flat. A dialog or drawer is `bg-popover`, which is what the shared `Sheet`, `Dialog` and `Popover` primitives use and what six hand-rolled drawers and dialogs did not. An opaque sticky header, footer or table head names the surface it scrolls within rather than the page behind it. A form control names no surface at all and inherits the one it sits on, the way the shared `Input` and `Textarea` do with `bg-transparent`; twenty hand-rolled inputs, selects and text areas were pinned to the page colour and showed through as a differently coloured box inside every card.

  The styling reference now states which token describes which layer, and why picking one because it happens to look right is what puts a page-coloured block inside a panel.

- d696700: Make the compact density the only density and call it Default.

  Settings → Theme no longer offers Compact and Spacious as two cards with one palette. The former Compact preset is now `default`, the fallback every fresh browser starts on, and the former Spacious preset is gone. Every other preset takes the same `--spacing` of `0.2rem` and the same tighter line heights from `sm` to `4xl`, so switching palettes never changes the density; each keeps its own corner radius. A browser that saved `compact` falls back to `default` and sees the same theme; one that saved `default` now sees it at the compact density.

  The `appearance.themes.compact` label is removed and `appearance.themes.default` reads "Default" / "默认". The theme references record `default` as the fallback and the new typography values.

- d696700: Ship 30 more theme presets, converted from the tweakcn collection.

  An application now starts with 32 presets to choose from in Settings → Theme: the two it had, and 30 palettes covering minimal, warm, pastel, brutalist, terminal and night looks. A converted file states the same tokens as the shipped presets — the fonts, text sizes, spacing and shadows Default defines — and takes only the colours and corner radius from upstream, so each one reads as Default with a different palette and none needs a font resource. The upstream opacity, shadow, letter-spacing and spacing values stay out, which is what keeps CJK rendering and density consistent across the grid.

  The palettes are the upstream ones and have not been re-audited for contrast against this application's components. The theme reference now records the conversion rules, and `client/theme/themes/THIRD-PARTY-NOTICES.md` in each template names the source revision, the Apache-2.0 licence and the values the conversion drops.

- d696700: Move theme selection out of the header popover and onto a Settings page.

  The header entry is now a single button that switches between light and dark and says what it does through its tooltip and accessible label, instead of a popover offering both the color mode and the theme list. Choosing a theme is a longer-lived decision and gets a page of its own: Settings → Theme renders every registered preset as a preview card in an auto-filling grid with the selection marked, and filters the grid through a search field, so an application with dozens of themes stays workable. Selection still lives in the browser, under the same storage keys and `config.yml` defaults.

  The page declares `authz` on its route, so it is visible to administrators by default and grantable to another role through the permissions interface like any other page. `system` stays a valid configured default: the header button moves to the opposite explicit mode on its first click.

  The `appearance` locale block now carries `toggle` and `theme.{title,description,search,empty}` in place of `title`, `mode`, `preset`, `light`, `dark` and `system`; the theme labels under `appearance.themes` are unchanged. The themes and header-action references describe the new page and the in-place toggle.

## 0.0.2-beta.10

### Patch Changes

- 43592e9: Support users.initialAdmin credentials for fresh installations, preserving legacy defaults when omitted and assigning root permission to the configured administrator without resetting existing accounts.
- 43592e9: Expose a read-only config.get() reader and service container to migration and seed callbacks. Inject application configuration snapshots for startup and CLI database tasks and document configuration and rollback semantics.

  Restrict application database task service access to the ID generator and reuse the templates’ application factory for CLI migrations and seeds. CLI tasks share the application database manager and dispose application and scope resources without booting providers or triggering autoRun.

  Simplify createAppCommands to one options object with lazy rootDir-based runtime and application discovery and optional factory overrides.

## 0.0.2-beta.9

### Patch Changes

- 5e3c802: Extract shared application development and build tooling into app-tools and runtime CLI commands into app-cli. Keep template entry points and application composition local, preserve supported commands and development restart behavior, and document customization and upgrade boundaries.

  Remove the application client and server inspection commands, their development-only CLI registration, and related guidance.

- 9f52fc6: Correct route authorization guidance to use the existing authz field instead of the removed access field.
- 5e3c802: Isolate client inspection and file-watching test caches from running Vite development servers to prevent missing lazy dependency chunks. Document cache ownership for auxiliary Vite instances.
- 8124b03: Mirror every synchronized skill into `.claude/skills/` as a relative symbolic link, so Claude Code discovers the skills an application's NocoBase packages ship. Claude Code reads only `~/.claude/skills/` and `<project>/.claude/skills/`, so a synchronized `.agents/skills/` was invisible to it while globally installed NocoBase 2 skills stayed available. Removing a package or a skill drops its link, application-owned entries are left alone, and a real directory occupying a `nocobase-` name is reported rather than overwritten. Ignore the generated mirror in the template and generated `.gitignore` files alongside `.agents/`.
- 5e3c802: Restart development processes when .env or .env.local changes, reloading client and server environment configuration while preserving shell overrides and strict startup behavior.
- 5e3c802: Replace template development forwarding files with a single dev entry and a direct proxy helper import. Expose the dev lifecycle through the tools launcher and keep development implementation modules and tests inside app-tools.

  Consolidate standalone server dependency operations into one template entry and keep build utility implementations and exports private to app-tools.

  Organize template scripts by purpose and remove redundant test:all, refine, template pack:check, and plugin:skills:sync shortcuts. Keep the application CLI entry and legacy CLI compatibility command unchanged.

## 0.0.2-beta.8

### Patch Changes

- e819ad3: Make the application tests shipped with templates runnable after scaffolding with a custom project name and installed npm packages, and document how to keep these tests portable.
- 24f142b: Remove centered width constraints from PageContainer examples and related application development guidance.

## 0.0.2-beta.7

### Patch Changes

- 71d159c: Preinstall editable File Registry components and their OOXML client dependency in the Default template so applications can reuse authenticated DOCX, XLSX and PPTX previews. Clarify component reuse, dependency ownership and separate Skill/UI upgrade steps in the file and application development guidance.

  Keep the shared file preview dialog wide on desktop and within the viewport on small screens, and normalize Date metadata in its refresh key for strict application linting.

- 836014a: Synchronize the shared layout containers and AppLayout organization with Examples while preserving template branding and Hub navigation ordering. Update application guidance for the shared layout components and layout-owned permission checks.

## 0.0.2-beta.6

### Patch Changes

- f93f147: Remove the default SQLite driver dependency from application templates. Application creation supplies the database driver selected by --dialect, defaulting to SQLite.

## 0.0.2-beta.5

### Patch Changes

- 64b3fdb: Integrate source-qualified database authorization and native relation policies with AI data services. Preserve explicit route group extensions, translated resource search, Hub ownership checks, API key cleanup, and protected permission-set assignments across user deletion. Update shared application guidance for the split authorization plugins.
- 64b3fdb: Document business authorization development, scope-rule configuration, inherited subjects and server enforcement in the published Skills, with application-level guidance to select the authorization workflow. Make installed Skills self-contained with client integration, code-versus-seed decisions, complete API contracts and the current sales collaboration and delivery examples.
- 64b3fdb: Focus authorization Skills on designing and implementing application business permissions. Consolidate repeated API guidance, add a policy-bound transactional workflow example, require model development and accompanying business permission configuration according to each requested change, and correct seed imports and optional-rule examples.
- 64b3fdb: Add business-action authorization middleware for existing Repository route definitions. Intersect request constraints with endpoint policies, reject incomplete multi-scope shortcuts, and demonstrate project queries and editing in the authorization example. The example's project edit now uses `salesProjects:updateOne` with Repository input/output and 404 for out-of-scope targets.

  Document when to use generated CRUD versus custom business handlers in the authorization development Skill. Remove the separate authorization example Skill and its package publication entry.

  Remove the collection-aggregated `authz.db.repositories` adapter and its public types. Use `authz.db.authorizeRepository` with explicit business-action mappings for generated Repository routes.

- fe564d9: Support database selection with --dialect and non-interactive structured output with --json. Generate local database connection settings, install compatible drivers, and guide agents through configuration before startup.
- fe564d9: Default generated applications to verifyDepsBeforeRun: false so running development, build, or startup scripts does not implicitly install dependencies. Document explicit installation after dependency changes and preserve template-provided settings.
- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- fe564d9: Add opt-in strict startup verification that propagates job import failures and exits development and production processes on startup failure.
- fe564d9: Transform the queue loader in both Vitest presets so dynamically discovered TypeScript jobs load through the test runtime instead of Node's strip-only loader. Document the shared preset requirement for application job-discovery tests.

## 0.0.2-beta.4

### Patch Changes

- e9da3c2: Resolve installed official database drivers asynchronously from application configuration before provider registration or standalone database tasks. Configure only the needed dialects and install their optional peer packages in application dependencies. Preserve explicit driver registrations and synchronous core manager APIs; direct core consumers continue to register drivers explicitly. Standard development and test loaders require no synchronous ESM compatibility configuration.

## 0.0.2-beta.3

### Patch Changes

- a255f91: Use the Compact theme by default across application templates while preserving configured defaults and saved browser preferences. Label the other theme Spacious instead of Default to avoid confusing its name with the default selection. Update theme development guidance.
- e55b17d: Document top-right header interactions: localized tooltips for navigation entries and built-in hover menus or configuration panels with default dismissal behavior.
- e13ed84: Organize Hub storage by ownership, add explicit managed revision and log directories, retain legacy layouts, and provide an offline migration preview and copy workflow. Keep standalone Hub data outside build output and place template build archives under storage/exports with matching publishing defaults.
- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- 64733b6: Clarify that useRouteOverlay must run in a descendant of the intended overlay, with complete usage examples and guidance on avoiding the parent context in nested overlays.
- e13ed84: Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

  Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

  Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

  Route HTTP request logs to separate request files by default in all application templates.

- e13ed84: Unify application directory fields and path helpers in AppPaths, shared by configuration factories, runtime and Application. Replace ConfigPaths and runtime.configPaths with AppPaths and runtime.paths, and construct applications through createAppFromRuntime so Host logging policy and the runtime application reference are wired consistently.

  Standalone applications declare their deployment root separately from their code root. Configuration and default persistent storage use that deployment root in both source and compiled execution. Explicit storage paths take precedence over HUB_STORAGE_DIR, and embedded applications retain Host-provided volumes.

  Standardize Hub storage and expanded releases on the hub, host and apps layout, remove legacy layout detection and offline storage migration commands, and replace appDeploymentsDir with appRevisionsDir. Expanded releases use appRevisionsDir/<appId>/<sha256>; standalone discovery records the selected revision. Consumers must update removed path and storage APIs and configure existing data locations explicitly before adopting this release. Rebuild application artifacts with the updated runtime and templates.

## 0.0.2-beta.2

### Patch Changes

- d4ca00e: Expose useApiClient as a no-argument Hook for resolving the current application's API client and document it as the convenient React entry point. Existing useService(apiClientToken) calls remain supported.
- d4ca00e: Clarify React API client access through useApiClient and retain explicit client resolution for non-React code in application and inbox Skills.
- f13bd0c: Clarify page authoring references, child routes for page Tabs and overlays, and page container ownership in the application development Skill.
- 365a9fe: Document semantic translation key naming, grouping, interpolation, and rename guidance with examples for application and plugin development.
- 60fa139: Preserve Hub publishing guidance in the shared application skill and scope it to Default applications that provide upload and deploy commands.
- d4ca00e: Document frontend API client usage, request and Repository response contracts, uploads, cancellation and error handling in a dedicated application Skill reference.
- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- 60fa139: Wait for the final deployment result by default in app deploy and app upload --deploy. Support --no-wait for asynchronous acceptance, preserve explicit --wait compatibility, and keep upload-only commands independent of deployment polling.

## 0.0.2-beta.1

### Patch Changes

- 6e15911: Register all application plugins as production dependencies so they reach deployments, migrate legacy development declarations, and preserve declared version ranges when registering existing plugins.

  Document plugin dependency placement and migration in the shared application development Skill.

## 0.0.2-beta.0

### Patch Changes

- d86f6aa: Synchronize agent skills from direct NocoBase package dependencies with the new skills:sync command while preserving plugin:skills:sync compatibility, and share application development and upgrade skills through @nocobase/app-skills across all application templates.

  Add package:remove to uninstall a NocoBase dependency and clean up its synchronized skills and ownership records, reusing plugin unregistration for plugin packages. Document the removal workflow in application templates and the shared development and upgrade skills.

## 0.0.1

### Patch Changes

- Add the initial NocoBase application development and upgrade Skills.
