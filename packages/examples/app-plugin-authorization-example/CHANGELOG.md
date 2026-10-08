# @nocobase/app-plugin-authorization-example

## 1.0.0-beta.13

### Patch Changes

- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/app-plugin-authz-default-access@1.0.0-beta.10
  - @nocobase/app-plugin-authz-restriction-rules@1.0.0-beta.9
  - @nocobase/app-plugin-authz-sharing-rules@1.0.0-beta.10
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.12

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-plugin-authorization@1.0.0-beta.24
  - @nocobase/app-plugin-authz-default-access@1.0.0-beta.9
  - @nocobase/app-plugin-authz-restriction-rules@1.0.0-beta.8
  - @nocobase/app-plugin-authz-sharing-rules@1.0.0-beta.9

## 1.0.0-beta.11

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
  - @nocobase/repository-input@0.1.0-beta.2
  - @nocobase/authorization@1.0.0-beta.11
  - @nocobase/app-plugin-authz-default-access@1.0.0-beta.8
  - @nocobase/app-plugin-authz-sharing-rules@1.0.0-beta.8
  - @nocobase/app-plugin-authz-restriction-rules@1.0.0-beta.7
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.10

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-authorization@0.2.0-beta.22
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.7
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.6
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.7
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.9

### Patch Changes

- fac3d58: Add an authorized DOCX and PDF invoice template-printing example to the Examples application, with guidance when LibreOffice is unavailable.
- Updated dependencies [3d44c4c]
  - @nocobase/app-server@1.0.0-beta.31
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@0.2.0-beta.21
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.6
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.5
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.6

## 0.1.0-beta.8

### Patch Changes

- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [41f478f]
- Updated dependencies [db16945]
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.6
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.5
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.6
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.1.0-beta.7

### Patch Changes

- 2f97f00: The example no longer defines its own team subject: the `example.sales.team` subject type, its team and membership tables, the team assignments and the `sales_dispatch` account are removed. `sales_proposal` holds the engineer set and the quote-7 handover directly, and `sales_coordinator` is a direct project manager without the engineer set. Order delivery relations target carriers (`authorizationExampleCarriers`, the `carrier` relation and `authorizationExampleOrderCarriers`) instead of teams. Inherited subjects are now demonstrated by `@nocobase/app-plugin-departments-example`. Default access, sharing rules and restriction rules are optional peers: the seed skips each rule plugin's rows when its Collection does not exist, so the example runs with the authorization plugin alone. The migration and seed were edited in place, so reset an existing example database before upgrading.
- Updated dependencies [a4ee8aa]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
  - @nocobase/app-server@1.0.0-beta.28
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/app-plugin-authorization@0.2.0-beta.21
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.5
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.5
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.4
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
- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [757eedf]
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.4
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.4
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.3
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Patch Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [0b37436]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/authorization@0.1.0-beta.9
  - @nocobase/app-plugin-authorization@0.2.0-beta.19
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.3
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.3
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.2

## 0.1.0-beta.4

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
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.2
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.2
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.1
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- Updated dependencies [709f9ed]
- Updated dependencies [d696700]
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
- Updated dependencies [d4783c2]
- Updated dependencies [d696700]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/app-plugin-authorization@0.2.0-beta.17
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.1
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.1
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.0

## 0.1.0-beta.2

### Patch Changes

- 86c4d2c: Allow unfulfilled example orders to have a null delivery reference, fixing Oracle startup seeds and example data resets. Upgrade existing schemas with a new migration while retaining delivery-time validation. Rolling back requires filling any missing delivery references first.

## 0.1.0-beta.1

### Patch Changes

- cbee7d8: Use consistent PageContainer and PageHeader layouts for the sales permission example pages and add a shield icon to their navigation group.

## 0.1.0-beta.0

### Minor Changes

- 64b3fdb: Separate authorization services from application integration: the library provides decisions, permission-set and access-rule services, store contracts and handlers; the application plugin owns database adapters, migrations, identities and management UI.

  Add configurable root and default permission sets, protected-set metadata, transaction-bound service APIs, and integration with user management and Hub roles. Add database authorization for explicitly registered collections through Repository policies, plus a runnable example plugin.

  Provide a permission-set workspace with routed editing and user assignments, nested resource groups, field and record-scope controls, and a permission inspector. Localize management UI and request-specific resource labels. Application routes may declare signed-in access without a page grant.

  Migration ownership changes inline the existing table definitions in the application plugin. This changes the checksums of previously executed migrations; upgrade compatibility must be resolved before deploying to an existing database.

- 64b3fdb: Add independent Policy-shaped relation permission declarations and immutable fluent builders, resolve target record scopes, and require explicit relation grants when narrowing repository API policies. Extend the sales authorization example with delivery-team associations, nested delivery checks, many-to-many collaborator notes, and an interactive relationship editor.

  Replace the business resource and collection/page declaration factories with callback-based authorization resources and reusable database permissions. Bind configuration keys at the action boundary, retain direct registration, and migrate the sales example without changing persisted grant or rule shapes.

  Move record access registration to the authorization core, add portable defineRecordAccess declarations, and consume repository-input FilterAst values only in the DB adapter. Migrate the sales example and policy selectors to generic resource references.

  Remove obsolete Business-prefixed public contracts and unused page/registry-bound builder entry points. Keep resource grant construction internal to the authorization package.

  Remove directional input/output objects from database grant fields. Use field lists or '*' per action, reject obsolete object-shaped grants, and update examples, documentation and tests. Request field directions remain supported.

### Patch Changes

- 64b3fdb: Separate business resource declarations from underlying handler registration through `resourceTypes`. Remove transitional registration aliases and legacy title decoding. Store rule record IDs directly in each action's JSON, preserving independent named scopes without auxiliary record tables. Initialize the sales example and Hub permission titles directly in their final form, without development-version upgrade scripts.
- 64b3fdb: Document business authorization development, scope-rule configuration, inherited subjects and server enforcement in the published Skills, with application-level guidance to select the authorization workflow. Make installed Skills self-contained with client integration, code-versus-seed decisions, complete API contracts and the current sales collaboration and delivery examples.
- 64b3fdb: Organize authorization example routes by business responsibility with explicit endpoint declarations and shared validation/error handling. Document which operations can suit generated CRUD and which require business handlers.
- 64b3fdb: Filter and paginate authorization example team queries in the database and use the caller transaction for active-team checks. Team pickers retain the existing management endpoint permissions.
- 64b3fdb: Add business-action authorization middleware for existing Repository route definitions. Intersect request constraints with endpoint policies, reject incomplete multi-scope shortcuts, and demonstrate project queries and editing in the authorization example. The example's project edit now uses `salesProjects:updateOne` with Repository input/output and 404 for out-of-scope targets.

  Document when to use generated CRUD versus custom business handlers in the authorization development Skill. Remove the separate authorization example Skill and its package publication entry.

  Remove the collection-aggregated `authz.db.repositories` adapter and its public types. Use `authz.db.authorizeRepository` with explicit business-action mappings for generated Repository routes.

- 64b3fdb: Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

  Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

  Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.

- 64b3fdb: Add composable, typed authorization builders with plugin-owned page and database grants, immutable scopes, and record-access policy registration. Support portable build/reference/register APIs and pure permission-set and rule DSL builders. Convert the sales example and its per-table seed data to shared fluent declarations while preserving authorization behavior.

  Separate page entry permissions from business data operations. Expose registered pages independently in permission sets and the inspector, and restrict business composition to database grants.

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- 64b3fdb: Move default user permission-set integration into the Users plugin and remove duplicated template providers. Add application-owned preset title metadata for client-side localization without overwriting custom names. Preserve Hub's custom role scope and share searchable assignment selection between user creation and editing.
- 64b3fdb: Reuse list-page permissions for repository detail routes and correct the authorization example's stored page grants to use route names.
- 64b3fdb: Align the sales authorization example with quote ownership, explicit team collaboration and independently retained project management duties. Add business-oriented exercises, keep delivery controls in sync after completion, and limit practice resets to seeded orders and their relationships.
- 64b3fdb: Make the sales authorization example repeatable with administrator-only business-record reset, independent cross-region team handover, accepted order-source quotes, job-based account names and staged exercises. Derive row actions from their read/write policies and distinguish invalid input, denied permissions and state conflicts.
- 64b3fdb: Unify grantable resource registration through getResource(type).items and separate recursive display groups. Move authorization settings to module-qualified items under the built-in settings resource, replace the database collections registration entry point, and preserve page navigation groups in the resource picker. Existing authorization settings grant records are not migrated.

  Replace the permission-set list and separate detail view with a collapsible, searchable sidebar and routed permission configuration and user-assignment tabs. Keep edits in the workspace with save/discard controls and protected-set restrictions. Present registered resources in an expandable tree with searchable field configuration in a local floating panel, and toggle simple permissions directly between full access and no grant.

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
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authz-default-access@0.1.0-beta.0
  - @nocobase/app-plugin-authz-sharing-rules@0.1.0-beta.0
  - @nocobase/app-plugin-authz-restriction-rules@0.1.0-beta.0
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Minor Changes

- Add an authorization example plugin: authorized Repository API routes and an owner-stamping custom create route over a per-user task list.
