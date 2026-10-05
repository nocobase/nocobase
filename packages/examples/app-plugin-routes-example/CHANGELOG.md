# @nocobase/app-plugin-routes-example

## 1.0.0-beta.17

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0

## 1.0.0-beta.16

### Major Changes

- 21d274c: Move the example plugins' routes onto the HTTP API specification. Every example route now lives under a camelCase namespace, answers `{ data }` (lists `{ data, meta }`), validates its input with `zod` (an invalid request is `400 INVALID_INPUT` with `fieldViolations`, and an unknown body field is rejected), and reports failures in the standard error body with the example's namespace as `domain`. Clients branch on `error.reason`.

  - `@nocobase/app-plugin-repository-example`: authentication now guards the data endpoints at their new `POST /api/{name}/{action}` paths. Since data endpoints moved from `{name}:{action}` to `{name}/{action}`, the middleware registered on the colon paths matched nothing and the endpoints answered anonymous requests.
  - `@nocobase/app-plugin-authorization-example`: `/api/authorization-example/...` becomes `/api/authorizationExample/...`. The `salesProjects` data endpoints are `POST /api/authorizationExample/salesProjects/{findMany,findOne,count,updateOne}`, and the `updateOne` input check runs again on that path. `POST /sales/quotes/:id` becomes `PATCH /sales/quotes/:quoteId` and `POST /sales/orders/:id/relations` becomes `PATCH /sales/orders/:orderId/relations`; both, and `submit` and `deliver`, answer `{ data }` with the record instead of `{ data: { saved: true } }`. `FORBIDDEN` is `403 PERMISSION_DENIED`, `STATE_CONFLICT` is `400 FAILED_PRECONDITION` instead of `409`, and `DELIVERY_REFERENCE_REQUIRED` and `INVALID_INPUT` are `400 INVALID_ARGUMENT`. A record outside the caller's scope is still answered `403`, never `404`. Every business route now decides the caller's composite action in middleware before it validates the request or looks up the record, so a caller without the action is answered `403` even for malformed input. `GET /sales/projects`, `/sales/quotes` and `/sales/orders` answer `{ data: [...], meta: { page, pageSize, total, navigation } }` instead of `{ data: { items, navigation } }` and take `page` and `pageSize` (default 20, at most 100). A relations update accepts only `carrier`, `checks` and `collaborators` (at least one), so any other key, a foreign key such as `carrierId` included, is `400 INVALID_INPUT` instead of `403`. Submitting a quote whose stored amount is not positive is `400 FAILED_PRECONDITION` with reason `QUOTE_AMOUNT_REQUIRED` and no field violation, instead of `400 INVALID_INPUT` naming `amount`; a reset before the example accounts are seeded is `400 FAILED_PRECONDITION` with reason `EXAMPLE_ACCOUNTS_MISSING` instead of `500`.
  - `@nocobase/app-plugin-departments-example`: `/api/departments-example/...` becomes `/api/departmentsExample/...`. `PUT /departments/:id/active` becomes `POST /departments/:departmentId/activate` and `/deactivate`; `PUT /departments/:id/members/:userId/primary` becomes `POST /departments/:departmentId/members/:userId/makePrimary`; both answer `{ data }` with the record. `DELETE /departments/:departmentId/members/:userId` answers `204`. `GET /users?search` becomes `GET /memberCandidates?q&page&pageSize` (default 20, at most 100) answering `{ data, meta: { page, pageSize, total } }`. A missing department or member is `404`, `DEPARTMENT_EXISTS` is `409 ALREADY_EXISTS`, and an unknown parent, manager or user named in the body is `400 INVALID_ARGUMENT` with a field violation. The settings check now runs before the path, query and body are validated, so a caller without the Departments settings item is answered `403` whatever it sent.
  - `@nocobase/app-plugin-jobs-example`: `GET /api/jobs-example/schedule` becomes `GET /api/jobsExample/rules` answering `{ data: rules, meta: { total } }`; `POST /api/jobs-example/schedule/:name/start|stop` becomes `POST /api/jobsExample/rules/:ruleName/start|stop`, whose body stays optional; `GET` and `POST /api/jobs-example/job` become `GET` and `POST /api/jobsExample/tasks`, answering `{ data: tasks, meta: { total } }` and `202 { data: task }`. `UNKNOWN_RULE` is `404`, `BUILT_IN_RULE` is `400 FAILED_PRECONDITION`, and `INVALID_INTERVAL` is `400 INVALID_ARGUMENT`. Starting or stopping a rule changes it for the whole application, so it now requires the `update` action of the new settings item `jobsExample.schedules`, checked before the request is validated; a caller without it is answered `403 AUTHORIZATION_DENIED`. The example therefore requires `@nocobase/app-plugin-authorization`.
  - `@nocobase/app-plugin-queue-example`: `GET /api/queue-example?delay=` published a job from a `GET`; it becomes `POST /api/queueExample/greet` with an optional `{ "delay": <ms> }` body. `POST /api/queue-example/digests` becomes `POST /api/queueExample/digests` answering `202 { data: receipts }`, and `GET /api/queue-example/deliveries` becomes `GET /api/queueExample/status` answering `{ data: { queue, configKey, deliveries } }`.
  - `@nocobase/app-plugin-notification-example`: `/api/notification-example/...` becomes `/api/notificationExample/...`, and `GET /users` becomes `GET /assignees`, answering `{ data, meta: { total } }`. A task's `createdAt` and `updatedAt` are answered as RFC 3339 UTC timestamps with the trailing `Z`. `GET /tasks` takes `page` and `pageSize` (default 20, at most 100) and answers `{ data, meta: { page, pageSize, total } }` instead of `{ data, total, page, pageSize }`. A caller who does not take part in a task is answered `403 TASK_ACCESS_DENIED`, whether or not the task exists, instead of `404 TASK_NOT_FOUND`.
  - `@nocobase/app-plugin-template-print-example`: `/api/template-print-example/...` becomes `/api/templatePrintExample/...`. `GET /invoices` is paged with `{ data, meta: { page, pageSize, total } }`, and `GET /invoices/:invoiceId/print?format=docx|pdf` still answers the file. A missing invoice is `404 INVOICE_NOT_FOUND` instead of `NOT_FOUND`, data over the example's output limits is `400 FAILED_PRECONDITION` with reason `OUTPUT_LIMIT_EXCEEDED` instead of `413`, access to Sales Quotes is decided before the path and query are validated, and an unavailable PDF converter stays `503 PDF_CONVERTER_UNAVAILABLE`.
  - `@nocobase/app-plugin-file-example`: every exposure action, `uploadOne` and `uploadMany` included, now requires a signed-in user and answers an anonymous request `401 AUTHENTICATION_REQUIRED` before the body is read; they were open to anonymous requests. The example therefore requires `@nocobase/app-plugin-authentication`. The content routes under each `accessPath` stay public.
  - `@nocobase/app-plugin-routes-example`: `GET /api/routes-example` becomes `GET /api/routesExample` answering `{ data }`. The root route `/routes-example/root` is unchanged.
  - `@nocobase/app-plugin-service-provider-example`: `GET /api/service-provider-example/status` becomes `GET /api/serviceProviderExample/status` answering `{ data }`.
  - `@nocobase/app-plugin-skills-example`: `GET /api/skills-example/notice` becomes `GET /api/skillsExample/notice` answering `{ data }`, and its Skill says so.
  - `@nocobase/app-template-examples`: the application's own routes follow the specification too. `GET /api/example` answers `{ data }`. `GET /api/articles` takes `q` instead of `search`, `page` and `pageSize` (default 20, at most 100) and answers `{ data, meta: { page, pageSize, total } }`; `POST /api/articles` answers `201 { data }` with the article; `PUT /api/articles/:id` becomes `PATCH /api/articles/:articleId` answering `{ data }`; article ids are strings; a missing article is `404 ARTICLE_NOT_FOUND`. `GET /api/numeric-examples` becomes `GET /api/numericExamples`, and its `sortField` and `sortDirection` parameters become one AIP-132 `orderBy`, a comma-separated list of field names each optionally followed by ` desc`, such as `orderBy=decimalValue desc,id`. The application's own routes report errors in the domain `examples` instead of `articles` and `numericExamples`, while the analytics and external CRM data endpoints answer `DATABASE_UNAVAILABLE` in the framework's domain `app` instead of `analytics` and `externalCrm`. The analytics and external CRM data endpoints are `POST /api/{name}/{action}`, and authentication guards them at those paths again: the middleware registered on the colon paths matched nothing, so they answered anonymous requests. Without a database, every database-backed route answers `503 UNAVAILABLE` with reason `DATABASE_UNAVAILABLE`.
  - `@nocobase/app-template-default`: its tests check for the renamed Routes example URL.

### Patch Changes

- 0b933b3: Every hand-written `/api` route of the example plugins and of the examples application now declares itself for the application's OpenAPI document with `describeRoute()`, `apiValidator()` and the response helpers from `@nocobase/app-server/router`, and is listed in Swagger UI at `/api/swagger/docs`. Each example uses its namespace in PascalCase as its tag (such as `QueueExample`) and an `operationId` of its namespace, a verb and the resource (such as `queueExamplePublishGreeting`), with shared response schemas in `server/routes/schemas.ts`. Input validation answers exactly as before. The public `GET /api/serviceProviderExample/status` and `GET /api/example` declare `security: []`, and the examples application hides the stand-in routes that answer `503 DATABASE_UNAVAILABLE` while it runs without a database. The routes, service provider and Skills examples now depend on `zod` for their response schemas. The READMEs describe the pattern, and the repository and file examples note that their data endpoints are documented without a declaration. Each route lists only the error statuses it can produce: the `400` for invalid input comes from the input validators, so a route lists `400` only for another reason such as a failed precondition, and one that checks no permission does not list `403`, so the article, numeric, routes, skills, queue, jobs, notification, practice-context and department-list routes name their statuses one by one instead of spreading `apiErrorResponses`. The examples application's `AGENTS.md` and `README.MD` explain where the Swagger UI and the JSON document are served, that reading them needs a signed-in session or an API key, and that an agent learns the endpoints from the document.
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
- Updated dependencies [7e5b7d4]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [7dbc54b]
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [be0fbbd]
- Updated dependencies [be0fbbd]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/app-plugin-authentication@1.0.0-beta.25
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.15

### Patch Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23

## 0.1.0-beta.14

### Patch Changes

- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.13

### Patch Changes

- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

- Updated dependencies [709f9ed]
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [d4783c2]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.12

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
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.11

### Patch Changes

- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- Updated dependencies [d4ca00e]
- Updated dependencies [60fa139]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.10

### Patch Changes

- 9131230: Use plugin-owned PageContainer and PageHeader components for consistent settings route example spacing and headings.

## 0.1.0-beta.9

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.8

### Patch Changes

- 52d1107: Resolve the shared UI packages through the workspace catalog: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, and `tw-animate-css`.

  Every package already agreed on one version for each of these — the catalog is what keeps them agreeing. A range edited in one manifest and not the others would otherwise put two copies of a UI primitive into an application's bundle, which is the kind of drift nothing reports until a component behaves differently depending on which plugin rendered it.

  Peer dependencies use `catalog:` too. `pnpm pack` resolves it before publishing, so a consumer still reads an ordinary range.

- 52d1107: Declare the packages each plugin's browser code imports as peer dependencies, so an application that installs the plugin can resolve them while a server deployment installs none of them.

  A plugin's `client/` is not bundled by the plugin: `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the consuming application's Vite build resolves them. That application has only what the published manifest declares, and npm does not publish `devDependencies` — so a client import declared only there fails with `Could not resolve "…"`. `sonner` and `@xyflow/react` both shipped that way. Ten of these plugins appeared to work only because `app-template-default` happened to declare the same package for its own use; `@nocobase/app-plugin-hub`'s CodeMirror imports had no such coincidence and were unresolvable wherever it was installed.

  Peer dependencies are what satisfy both sides. An application installs one shared copy, and a deployment — which sets `autoInstallPeers: false` — installs none, so packages a server never requires stay out of it. Each keeps a matching devDependency so the workspace still resolves it and the version used here stays pinned. None is marked `optional`: an optional peer is not auto-installed anywhere, including in the application that needs it.

  `create-plugin` emits the same shape and its generated `AGENTS.md` teaches it, so a plugin created tomorrow declares its browser packages as peers rather than repeating the mistake.

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
  - @nocobase/app-plugin-authentication@0.1.0-beta.9

## 0.1.0-beta.7

### Patch Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [a864497]
- Updated dependencies [a864497]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/app-server@1.0.0-beta.7
  - @nocobase/app-client@1.0.0-beta.10
  - @nocobase/app-plugin-authentication@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- 813da59: Declare browser-only packages as devDependencies rather than dependencies, and make `react-i18next` an optional peer of `@nocobase/i18n` provided by `@nocobase/app-client`. Client code is bundled by the consuming application, so these entries did nothing for the bundle while `dist/package.json` pulled every one of them into the server deployment to be installed and never required.
- Updated dependencies [8d88ff4]
- Updated dependencies [43d5bf0]
- Updated dependencies [813da59]
- Updated dependencies [cee3251]
  - @nocobase/app-server@1.0.0-beta.6
  - @nocobase/app-client@1.0.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.6
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Minor Changes

- 174eab5: Consolidate the browser packages into `@nocobase/app-client`.

  `@nocobase/app-sdk` is gone; its API client now lives in `@nocobase/app-client` and is imported from there. `@nocobase/app-portal-sdk` is deprecated and keeps only what still has consumers: `NocoBaseClient` and the runtime configuration it reads, which exist to reach a v2 NocoBase server, and the route surface containers under `/routing`. Its ACL, auth, data, extension, i18n, and system-settings modules are removed, as is the route tree that `/routing` used to export alongside the surfaces.

  `@nocobase/app-client` gains `resolveAppBase()`, which reports the path the application is mounted at.

  Four plugins built their API client at import time instead of resolving it from the application's service container, so they could not see `api.baseURL` from the application configuration. They now resolve it, which means an application that configures a base URL gets one client rather than two that disagree.

  The injected browser global `NOCOBASE_PORTAL_BASE` is renamed to `APP_BASE_PATH`. Its value has always been the `APP_BASE_PATH` environment variable, and the old name grouped it with the settings that address a v2 NocoBase server. Those keep their names. A client and the server that serves it must be upgraded together.

  `@nocobase/app-plugin-data-provider` is removed. It forwarded the Portal data provider, and applications built on the current client runtime do not use it.

  The Hub template is rebuilt from the default template and now runs the same client and server stack as every other v3 application. Its `/api/apps` endpoint and its v2 API proxy are gone, so a hub's `.env` no longer configures them.

  The Portal SDK's template compatibility check is removed with the rest: it had been disabled behind a constant, and its install script cost every generated project a `pnpm-workspace.yaml` `allowBuilds` entry it did not need. `createPortalViteConfig` no longer takes the plugin that injected it.

- ab7b341: Add `defineDevRoutes()`, for pages that exist only while developing an application.

  It takes the same shape as `defineSettingsRoutes()` — pages, one level of groups, `navigation` and `access` — and mounts under `/dev` instead of `/settings`. The two are separate path spaces, so the same relative path may appear in both and resolve to `/settings/orders` and `/dev/orders`.

  What makes it different is that nothing it declares reaches a production bundle. The guard lives inside `defineDevRoutes()` rather than at each call site, so a plugin author calls it unconditionally the way they call `defineSettingsRoutes()` and cannot forget it. A production build replaces `import.meta.env.PROD` with `true`, which makes the argument unreachable and lets the bundler drop the page components behind it, along with any module only those pages import. The templates guard their `/dev` route and the dev entry in the header the same way, so a production build carries no dev route, no dev layout chunk, and no dev entry point.

  This draws its boundary at the build output, not at runtime permissions. A page that has to exist in production but be restricted by role is still a Settings Route with `access`, enforced by the server.

  Both templates' headers offer a dev entry beside the settings gear, visible only during development. A surface withdraws its own entry: the settings centre shows the dev entry but not the gear, the dev tools show the gear but not the dev entry, and the application shell shows both.

  Both templates gain a `client/layouts/` directory. The settings centre's chrome — the navigation rail, group disclosures, the mobile page select, and the per-page access filtering — is now one `SurfaceLayout` that the settings centre and the dev tools each render with their own copy, rather than a second copy of the same layout. The Hub template's settings navigation picks up the translation the default template already had.

  `client:inspect` reports the resolved dev routes and accepts `--type dev-routes`.

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- Updated dependencies [174eab5]
- Updated dependencies [ab7b341]
- Updated dependencies [1527426]
- Updated dependencies [174eab5]
  - @nocobase/app-client@1.0.0-beta.6
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.4

### Minor Changes

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- 78cf0a2: Complete the four-Route full-stack example and add a stable Agent-facing Client inspection protocol.
- 78cf0a2: Align Route examples, scaffolding guidance, and Agent-facing Client and Server Route documentation with the latest ownership and testing practices.
- 78cf0a2: Generate runtime-aware TypeScript, ESLint, Node engine, and development dependency configuration for Client-only, Server-only, and full-stack plugins, including stable package-scoped Queue Job identities.

  Keep plugins aligned with the Agent development contract by giving Queue, System Information, and Workflow Routes path-scoped authentication, documenting the Queue API path and Database declaration source accurately, and storing example tests under each plugin's root test directory.

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- 78cf0a2: Add declaration-level Server plugin inspection with real Route contribution order, and make the Routes example own a path-scoped authentication boundary.
- Updated dependencies [fb1a752]
- Updated dependencies [948304d]
- Updated dependencies [78cf0a2]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [ac3f033]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-client@1.0.0-beta.5
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/app-plugin-authentication@0.1.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-sdk@0.0.1-beta.0

## 0.1.0-beta.3

### Patch Changes

- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.
- 7cdffbd: Replace separate API and root route arrays with one ordered `routes` contribution array. Route factories now receive the Application, create and return their own Hono router, and are mounted automatically at `/api` or the application root according to their definition.

  Standardize plugin server modules around `providers/index.ts` and `routes/index.ts` collection entries, `services/` domain implementations, and a stable `tokens.ts` public contract.

  Generated plugins now declare conventional database and queue contribution directories by default. Missing optional directories are ignored until executable migrations, seeds, or jobs are added.

  Generated plugins now include an App-facing starter Agent Skill under the package's `skills/` directory. Plugin registration and skill synchronization copy these package-owned Skills into registered applications' `.agents/skills/` directories.

  Unify Client page contributions behind one `routes` loader. Plugins now use `defineAppRoutes()` and `defineSettingsRoutes()` to add child Routes to the application's two built-in Client Routes, mirroring how Server plugins use `defineRootRoutes()` and `defineApiRoutes()` with the built-in Hono routers.

- 7cdffbd: Add explicit `server/plugin.ts` definitions for Providers, API routes, root routes, database sources, and queue jobs. Register routes in a dedicated Application phase after Provider boot, add reusable HTTP and runtime composition helpers to their owning packages, and remove the default template's duplicate runtime layer and legacy plugin discovery contract.
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [ce4eab8]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-client@1.0.0-beta.4
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.0
  - @nocobase/app-sdk@0.0.1-beta.0

## 0.1.0-beta.2

### Minor Changes

- c8f38c8: Register client plugins explicitly in the application's `client/plugins.ts` instead of discovering them from `nocobase.plugins` through a Vite virtual module.

  Each plugin now ships a `client/plugin.ts` descriptor, exported as `./client/plugin`, that declares its bootstrap, routes, providers, and route component overrides. An application composes them with `defineClientPlugins([...])`, where array order is bootstrap order and a plugin is enabled by being present. The entry is real, type-checked application source: it can be read, diffed, and edited, and Vite reloads it like any other module.

  Plugins can also accept options. `defineClientPlugin` takes an options type that reaches the bootstrap context, the routes and providers factories, and the route component overrides, so an application can pass a custom login page or a notification label at registration.

  `@nocobase/app-plugin-registry-example` only drops its now-unread `nocobase.plugin.client` manifest field; it contributes no client extensions.

- 1a9732a: Re-export the client registration factory as the default from `client/index.ts`, so an application registers a plugin by importing `<package>/client` instead of `<package>/client/plugin`. `client/plugin.ts` still defines the factory and its `./client/plugin` subpath still resolves; the barrel simply re-exports it.

  Every plugin now declares `sideEffects: false`. An application imports the barrel, which also carries types, helpers, and components, and without that declaration a bundler must assume each of those matters and keeps them in the application entry chunk. With it, importing `<package>/client` costs exactly what importing `<package>/client/plugin` cost: the entry chunk is byte-identical for all eight plugins, where before it grew by 696 bytes for authentication and 88 for file.

  The declaration was checked rather than assumed: every client module's top-level statements are pure declarations, with no global assignment and no bare `import './x.css'`. The CSS imports under `app-plugin-workflow/registry` are copied as source by `registry materialize` and never bundled through `exports`. A plugin that later introduces a module-level side effect must drop the declaration.

  `@nocobase/app-plugin-workflow` additionally points `./client` at `./client/index.ts` rather than `./dist/client/index.js`, matching every other plugin. Consuming the built output made the barrel resolve to a stale artifact, which failed the build outright.

### Patch Changes

- Updated dependencies [062f5b1]
- Updated dependencies [c8f38c8]
  - @nocobase/app-client@1.0.0-beta.3

## 0.0.1-beta.1

### Patch Changes

- 509d812: Localize the shadcn UI components used by applications, plugins, and registries so they can customize their presentation independently. Remove the `@nocobase/app-client/ui` entry point and migrate its consumers to package-local components.
- Updated dependencies [509d812]
  - @nocobase/app-client@1.0.0-beta.1

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/app-client@0.0.1-beta.0
  - @nocobase/app-sdk@0.0.1-beta.0
  - @nocobase/app-server-kit@0.0.1-beta.0
