# @nocobase/app-plugin-jobs-example

## 1.0.0-beta.3

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-plugin-authorization@1.0.0-beta.24

## 1.0.0-beta.2

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
- Updated dependencies [21d274c]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
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
  - @nocobase/app-plugin-authorization@1.0.0-beta.23
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.1

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [a859ba1]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.0

### Minor Changes

- 3d44c4c: Add `@nocobase/app-plugin-jobs-example`, a plugin demonstrating both executors of the application's jobs service; it replaces `@nocobase/app-plugin-schedule-example`

  Its `ScheduleExecutor` runs the `heartbeat` the schedule example ran, now under the `@nocobase/app-plugin-jobs-example` scope, beside three rules a "Schedules" page starts and stops: `interval` every 5, 10 or 30 seconds, `limited` every 3 seconds for five runs, and `cron` every minute. Their handlers are all registered before `setup()`, so a rule started from the page keeps running across restarts. The page shows each rule's state, next firing and recent runs, and reloads them through `GET /api/jobs-example/schedule` whenever the public `jobs-example:schedules` topic announces a change; `POST /api/jobs-example/schedule/:name/start` and `/stop` change a rule. Its `JobExecutor` runs a payload-only `ProgressJob` that works for ten seconds and reports 10% of progress each second. A "One-off jobs" page adds one block per job created with its button and follows each block's progress live: the page subscribes to the user-audience `jobs-example:tasks` realtime topic only while it is open, and the provider publishes every task change there for the user who created it. `POST /api/jobs-example/job` creates a task and answers `202`, and `GET /api/jobs-example/job` lists the signed-in user's recent tasks. A task interrupted by shutdown goes back to waiting and runs again on the next start. Both pages sit under a "Jobs example" menu group. The examples template registers the plugin's server and client in place of the schedule example, whose `/api/schedule-example` route is gone; the heartbeat rule stored under the old scope is no longer read.

### Patch Changes

- Updated dependencies [3d44c4c]
  - @nocobase/jobs@0.1.0-beta.1
  - @nocobase/app-server@1.0.0-beta.31
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Initial release.
