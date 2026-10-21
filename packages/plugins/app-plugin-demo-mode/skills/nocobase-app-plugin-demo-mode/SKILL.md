---
name: nocobase-app-plugin-demo-mode
description: Use when an application adopts demo mode or demo data (integrating the plugin into an app, writing its dataset, demo accounts, simulated model and Agent answers, keeping external calls in process), when running import/clear/reset, or when configuring and diagnosing read-only demo deployments. Combine with the authorization Skills for roles and record scopes; this plugin does not replace business permissions.
---

# Demo Mode

`@nocobase/app-plugin-demo-mode` refuses every database write an HTTP request causes, while browsing, signing in and background work keep working. It needs no change to application code beyond registration.

## Prerequisites

The Server definition is registered in `server/plugins.ts` and the Client factory, `demoMode()`, in `client/plugins.ts`. The mode comes from `NOCOBASE_DEMO_MODE` (`off`, `read-only`, `observe`) or the optional `demoMode.mode` configuration section; extra writable physical tables come from `NOCOBASE_DEMO_ALLOW_TABLES` (comma-separated) or `demoMode.allowTables`. `session` and `verification` are always writable so visitors can sign in.

## Public surfaces

- `GET /api/demoMode/status` answers `{ data: { mode } }` without a session.
- A refused request answers `400` with `error.status: FAILED_PRECONDITION`, `error.reason: DEMO_READ_ONLY`, `error.domain: demoMode` and a translated `error.localizedMessage`, and carries the `Server-Timing: demo-read-only` metric. A route that swallows the refusal and succeeds keeps its answer without the metric. Branch on `reason`, never on the message.
- `demoModeServiceToken` from `@nocobase/app-plugin-demo-mode/server/tokens` exposes `mode` and `allowTables` to other Server plugins, for example to skip an outbound call in a demo.

## Workflow for a new demo deployment

1. Register both plugins and start with `NOCOBASE_DEMO_MODE=observe`.
2. Browse every page, then read the `demo-mode` logger's warnings: each names the request and the tables it would have written.
3. Prefer explicit registered capabilities and UI write rules for business exceptions. Reserve `NOCOBASE_DEMO_ALLOW_TABLES` for reviewed deployment-level cache exceptions. Never allow a business table to make a read route pass; fix routes that write while reading, and await or catch every write so a refusal cannot become an unhandled rejection.
4. Switch to `read-only`. Startup fails with "Demo mode could not guard database connection" if a connection cannot be guarded; do not work around it.

## Demo data

When an application adopts demo data, work through [Integrate demo mode into an application](references/integration-checklist.md) in order: external boundaries and background jobs come before the dataset, and a running application verifies the result. When the task is “make demo data for this application,” follow [Adapt demo data to an application](references/adapting-data.md). Inspect the application's business model and services, then implement its own dataset adapter; do not copy another application's tables or story. For Agent simulation, first distinguish the model answer from actual tool and Runner execution using [Model and execution simulation](references/simulation.md).

An application registers one dataset on `demoDataToken` (`@nocobase/app-plugin-demo-mode/server/tokens`) from a service provider: `id`, `languages`, `accounts(language)` for the page, `steps(language)` that write the data, an optional `clear(context)` for what tracking cannot cover, and optional model `answers`. Steps write through the application's own services and record what they create with `context.track(collection, ids, { key })`; accounts, roles and assignments go through `context.createAccount`, `createPermissionSet` and `assignPermissionSet`, so clearing undoes them. Date everything with `context.clock` (relative to the import, in the dataset's time zone). Never make a step call a real outside service: give the demo's records an in-process answer instead, and let a failing step throw, which rolls the whole import back.

- `GET /api/demoMode/data` and `POST /api/demoMode/data/import|clear|reset` need `settings:demoMode.data` (`read` / `manage`); grant it to the application's administrators. Authorized import, clear and reset operations also work in read-only mode, without opening writes for other requests. `demoMode.data.reset.cron` defines a Scheduler reset.
- Imports add the `Demo model` service (OpenAI-compatible, on this application's own `/api/demoMode/models/v1`) as the default chat model unless `demoMode.data.models` is `false`. Online agents reach it through the Agents gateway; application code that generates text can call `models.complete({ system, prompt, tag })` in process after `await service.load()` refreshes the binding and `models.isDemoModel(ref)` says the default is the demo model.
- Register `@nocobase/app-plugin-demo-mode/cli` in `cli/plugins.ts` to expose `demo-mode data status|import|clear|reset`. Changes need `--force`; `--dry-run` previews arguments without starting the application. Import and clear require `--actor`; reset may reuse the last importer and language. The command uses the lifecycle service directly, including in read-only mode.
- `createAccount` only reuses accounts whose dataset ownership was recorded by this plugin. An existing username aborts the import; never weaken that check or grant demo accounts access to non-demo business records.
- Build the page on `useDemoData()` from `@nocobase/app-plugin-demo-mode/client/demo-data`; the plugin ships no page of its own.

## Constraints

Only `@nocobase/db` connections are guarded: outbound requests, drive files and queue messages a route sends before its refused write still happen. Writes from jobs, schedules, migrations and seeds are not refused; a job a request enqueues is refused only while it still runs inside that request. Do not use demo mode as an authorization boundary; it does not distinguish users.

For full-application cleanup, register an optional `clearAll(context)` hook. Explicit clear/reset then require enabled demo mode (`read-only` or `observe`) in the lifecycle service, including CLI and scheduled calls. It must be retry-safe, support an empty import context, preserve configuration/identities, and clean up owned file blobs. Clearly disclose this scope in the application confirmation. Keep `clear(context)` scoped to the imported records: failure rollback and interrupted-import recovery never invoke `clearAll`.

## Configurable adapters and policies

Resolve `demoConfigurationToken` from `@nocobase/app-plugin-demo-mode/server/tokens` in your application provider. Register table candidates with `registerWrite({ id, title, table, operations, scopes, checkScope })` and mocks with `registerMock({ id, title, kind, scope, defaultEnabled, invoke })`. Read the exact exported types before implementing. Rules default to an empty list. Sensitive identity/authorization tables are rejected. For record scopes, `checkScope` must verify persisted ownership, and the application calls `runWrite(capabilityId, operation, input, callback)` — or `runWrites([[capabilityId, operation], …], input, callback)` for one mutation that writes through several capabilities — only around the corresponding business mutation, after its normal authentication and authorization. Each entry without a configured rule allows nothing; one configured entry out of scope refuses the whole mutation. A scope named `all` opens only that table and SQL operation to otherwise authorized requests; avoid it for shared tables containing unrelated records.

`GET /api/demoMode/configuration` needs `settings:demoMode.configuration/read`; PUT `/writeRules`, `/mocks` and `/schedule` under that path need both `read` and `configure`. Bodies contain `expectedRevision` and `value`; a stale revision returns 409 `DEMO_CONFIGURATION_CONFLICT`. Re-fetch before resolving conflicts; never silently overwrite drafts. The enabled environment is checked on the server and data lifecycle, including CLI. Hide disabled environments and unauthorized cards in the application UI. The plugin exports browser-safe view types and `nextDemoReset` from `client/demo-configuration`.

The daily schedule is `{ enabled, hour, minute, timezone, language }`. Saving over a deployment cron requires `replaceLegacy: true` with an explicit UI confirmation. The durable day claim runs at most once per local date; missed minutes and nonexistent DST times are skipped, and repeated DST times execute only at their first occurrence. Daily reset remains destructive and uses the dataset cleanup contract. `context.clock.seed` and `sample(key)` let an application vary fixtures reproducibly by dataset, language, date and timezone; use relative clock helpers for dates.

Call `invokeMock(id, input)` at each application boundary; unknown or disabled mocks throw `DEMO_MOCK_UNAVAILABLE`. Scope labels are descriptive: each adapter must validate trusted persisted scope itself. Never catch this error and call the real provider. `requireMock(id)` can reject a dispatch before queuing, but invoke again when the queued work actually runs so revocation takes effect. The built-in model adapter is `dataset.model`, backed by dataset answers. Request policy is snapshotted before business transactions; configuration changes take effect for subsequent requests.
