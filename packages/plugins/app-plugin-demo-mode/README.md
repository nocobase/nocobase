# @nocobase/app-plugin-demo-mode

Turns a NocoBase application into a demo, in two independent parts:

- **Read-only mode.** Visitors can sign in and browse every page; every change they try is refused before it reaches the database, and the browser tells them why with a toast. Nothing in the application changes beyond registering the plugin.
- **Demo data.** An application registers one demo dataset; administrators import, clear and reset it from the application's own page, a command, a schedule or the API, and a simulated model answers its agents. See [Demo data](#demo-data).

## Register and switch on

Register the Server definition in `server/plugins.ts` and the Client factory in `client/plugins.ts`:

```ts
import demoMode from '@nocobase/app-plugin-demo-mode/server';
// defineServerPlugins([..., demoMode])

import demoMode from '@nocobase/app-plugin-demo-mode/client';
// defineClientPlugins([..., demoMode()])
```

The plugin is off until the deployment switches it on, through the environment or an optional `demoMode` configuration section; the environment wins:

| Environment                  | Configuration          | Meaning                                                       |
| ---------------------------- | ---------------------- | ------------------------------------------------------------- |
| `NOCOBASE_DEMO_MODE`         | `demoMode.mode`        | `off` (default), `read-only` or `observe`                     |
| `NOCOBASE_DEMO_ALLOW_TABLES` | `demoMode.allowTables` | Comma-separated physical table names requests may still write |

`session` and `verification`, the Better Auth tables signing in and out writes, are always allowed, except to routes that end or change other sessions — any path ending in `revoke-sessions`, `revoke-other-sessions`, `revoke-session`, `update-session` or their camelCase forms, such as the users plugin's `users/:userId/revokeSessions` — so a visitor of a shared demo account cannot sign everyone else out.

## What it does

A root-router middleware runs every HTTP request, including the WebSocket upgrade, inside an async-local context. The plugin listens to the `query` event of every connection's knex client, which knex emits synchronously before sending a statement, from transactions too. A statement that writes — `INSERT`, `UPDATE`, `DELETE`, DDL, or anything it does not recognize as a read — made inside a request is refused unless it targets an allowed table. Work outside requests, such as migrations, seeds, jobs, schedules and startup tasks, is never refused.

A refused request is answered with the standard error body, `400 FAILED_PRECONDITION`, reason `DEMO_READ_ONLY`, domain `demoMode`, and a `localizedMessage` in the request's language, whatever the route made of the failure. The response carries `Server-Timing: demo-read-only`, which the Client plugin reads through `PerformanceObserver` to show a toast, whichever client sent the request. A route that catches the failure and still succeeds keeps its answer, unmarked: pages often make best-effort writes while reading, and the visitor changed nothing. The Client plugin reads the mode from the public `GET /api/demoMode/status` and shows nothing until a change is refused.

At startup the plugin sends a probe write through every connection and refuses to start if one is not refused, so an upgrade that breaks the hook cannot silently leave a demo writable.

## Finding what to allow

Some pages write while they are only being read, for example to refresh a cache. Start the application with `NOCOBASE_DEMO_MODE=observe`, browse every page, and read the `demo-mode` logger's warnings: each lists the method, path and tables a request would have been refused. Allow the harmless tables, then switch to `read-only`.

## Limits

- Only databases opened through `@nocobase/db` are guarded. Outbound calls (mail, model APIs, webhooks), files written to drive storage and queue messages made before the refused write still happen.
- A refusal is found when the write is attempted, so the work a route does before it, such as calling a model, is still spent.
- How a page shows the failure is up to the application; some show their own generic message next to the plugin's toast.
- A read route that writes on the way, such as one expiring stale rows with an `UPDATE` that may change nothing, is refused like any write; allow its table only when it holds nothing a visitor could change, otherwise fix the route.
- Code that starts a write without awaiting it turns the refusal into an unhandled rejection, which can stop the process; observe mode lists such routes so the application can handle the failure.
- The application's request log records the status the route produced before the plugin replaced it, such as a 500 from Better Auth.
- `process.env` is shared by every application in one process; use the configuration section to set the mode per application under an app host.

## Demo data

The plugin owns the lifecycle; the application owns what the data says. Register the dataset from a service provider:

```ts
import { demoDataToken } from '@nocobase/app-plugin-demo-mode/server/tokens';

container.resolve(demoDataToken).register({
  id: 'crm',
  languages: ['zh-CN', 'en-US'],
  timeZone: (language) =>
    language === 'zh-CN' ? 'Asia/Shanghai' : 'America/New_York',
  accounts: (language) => [
    {
      username: 'liming',
      name: '李明',
      role: '销售经理',
      password: 'liming123',
    },
  ],
  steps: (language) => [
    {
      key: 'companies',
      weight: 2,
      run: async (context) => {
        /* write, then context.track('crmCompanies', ids) */
      },
    },
  ],
  clear: async (context) => {
    /* remove what tracking does not cover */
  },
  answers: [/* what the simulated model says */],
});
```

- **Import** claims the dataset's row in `demoModeDatasets` before anything is written, so a second import is refused, runs the steps in order with progress, and takes everything back when a step fails. An import no process moved on for ten minutes counts as interrupted and is cleared before the next one.
- **Tracking.** `context.track(collection, ids, { key })` records rows in `demoModeRecords`; clearing deletes them in reverse order of first tracking. `context.createAccount(spec)` creates a sign-in through the users plugin (password: the username followed by `123` unless given) with its Permission Set assignments, `createPermissionSet` a role the demo owns, `assignPermissionSet` an assignment on an existing account; all go with the demo. An application that does not allow deleting accounts, or sets `keepAccounts` on its dataset (the users plugin keeps a deleted account's username and email reserved, so a deleted demo account could not be created again), gets them disabled instead, and the next import enables them again. `roleScopes` on an account spec gives the users plugin's role scopes, such as an application scope that is required on create, and is applied again when an import reuses the account. `demoModeAccounts` retains ownership of disabled accounts across clears; a username collision with any unowned account aborts the import without changing that account. `context.setData()` persists what later steps and `clear` need to know.
- **Dates.** `context.clock` gives `daysAgo`, `dateAgo` and `isoAgo` relative to when the import started, in the dataset's time zone, never in the future unless asked for.
- **Clearing** runs the dataset's `clear` first, for what tracking cannot cover (such as everything visitors added inside a demo project), then deletes tracked rows, assignments, accounts, roles and the simulated model service. Reset clears and imports again.
- **Simulated model.** Unless `demoMode.data.models` is `false`, an import adds an OpenAI-compatible model service, `Demo model`, through the Agents plugin and makes it the default chat model, remembering the one it replaced; clearing restores it only if the default still points at the demo service, preserving later administrator changes. The service points at this application's own `POST /api/demoMode/models/v1/chat/completions` (streamed or not) and `GET …/models`, with a random key as its only credential, over the loopback address of the server (`http://127.0.0.1:<port><publicApiUrl>/demoMode/models/v1`, or `demoMode.data.modelBaseUrl`). Answers come from the dataset's `answers` — tried in order, each matching on the prompt, system text and offered tools, and able to call those tools first — then from a plainly labelled fallback in the prompt's language. `models.complete({ system, prompt, tag })` answers in process for an application's own text generation; `tag` names the operation, which a gateway call cannot carry. The HTTP routes reload the stored service/key before authenticating each call, including after a reset in another process. Applications calling the in-process model should first await `service.load()` to refresh that binding. Nothing reaches a real model.

| Environment                         | Configuration                  | Meaning                                                          |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `NOCOBASE_DEMO_DATA_MODELS`         | `demoMode.data.models`         | `true` (default) or `false`: add the simulated model on import   |
| `NOCOBASE_DEMO_DATA_MODEL_BASE_URL` | `demoMode.data.modelBaseUrl`   | Where the gateway reaches the simulated model, when not loopback |
| `NOCOBASE_DEMO_DATA_RESET_CRON`     | `demoMode.data.reset.cron`     | A Scheduler schedule, `demoMode.resetData`, that resets the demo |
| `NOCOBASE_DEMO_DATA_RESET_TIMEZONE` | `demoMode.data.reset.timezone` | The schedule's time zone                                         |
| `NOCOBASE_DEMO_DATA_RESET_LANGUAGE` | `demoMode.data.reset.language` | The language each reset imports; the present one when absent     |

The routes, for the `settings:demoMode.data` grant (`read` for the status, `manage` otherwise): `GET /api/demoMode/data`, `POST /api/demoMode/data/import|clear|reset` with an optional `{ language }`. Import and reset answer at once; the status reports `importing.percent` and, after a failure, `failure`. Authorized imports, clears and resets also work in read-only mode: only the authorized lifecycle handler and its asynchronous work leave the request write guard, so concurrent requests remain protected. A dataset with `clearAll` requires enabled demo mode (`read-only` or `observe`) for explicit clear/reset, including scheduled and CLI operations; mode `off` returns `DEMO_MODE_REQUIRED`. In the browser, `useDemoData()` from `@nocobase/app-plugin-demo-mode/client/demo-data` reads the status, polls it every second while an import runs, and sends the actions; the application builds its own page and banner on it.

An optional `clearAll(context)` hook lets an application clear all of its business data for explicit clear/reset. Its lifecycle requires enabled demo mode and persists an operation lease even before the first import. It replaces `clear` only for explicit clear/reset; failed-import rollback and interrupted-import recovery always use the scoped `clear` hook. The application must make `clearAll` retry-safe, support empty import context, preserve system configuration and identities, clean up owned blobs, and clearly explain the destructive scope on its page.

## Command line

Register the CLI plugin alongside the server and client registrations:

```ts
import demoMode from '@nocobase/app-plugin-demo-mode/cli';
// defineCliPlugins([..., demoMode])
```

```bash
pnpm nocobase demo-mode data status
pnpm nocobase demo-mode data import --actor <administrator-id> --language en-US --dry-run
pnpm nocobase demo-mode data import --actor <administrator-id> --language en-US --force
pnpm nocobase demo-mode data reset --force
pnpm nocobase demo-mode data clear --actor <administrator-id> --force
```

The command waits for completion. `--dry-run` previews only the operation and arguments without loading the application; changes require `--force`. Import and clear require `--actor`. Reset may reuse the last importer and language. The same service runs outside HTTP, including in read-only deployments. Output omits account passwords and model keys.

## Demo configuration

While demo mode is `read-only` or `observe`, administrators adjust a demo from the application's demo page, through `GET /api/demoMode/configuration` and `PUT /api/demoMode/configuration/writeRules|mocks|schedule` (`settings:demoMode.configuration`: `read` / `configure`). Every save carries `expectedRevision` and is refused with `DEMO_CONFIGURATION_CONFLICT` when another administrator saved first.

- **Read-only write exceptions.** An application registers what may be opened with `demoConfigurationToken.registerWrite({ id, title, table, operations, scopes, checkScope })`; identity, authorization, secret and plugin tables are refused. Rules start empty. The application wraps exactly the authorized business mutation in `runWrite(id, operation, input, run)`, or `runWrites([[id, operation], …], input, run)` when one mutation writes through several capabilities: an entry without a rule allows nothing, and a configured entry whose `checkScope` refuses the input refuses the whole mutation with `DEMO_SCOPE_DENIED`.
- **Simulations.** `registerMock({ id, title, kind, scope, defaultEnabled, invoke })` registers a model, tool or Runner replacement, and `registerAgent({ id, title, scope, matches, execute })` a typed Agent proxy whose `run(input, realAgent)` uses the replacement for matching input. A disabled or missing adapter refuses the call with `DEMO_MOCK_UNAVAILABLE`; it never falls back to a real service.
- **Daily reset.** A schedule of hour, minute, time zone and language resets the demo once a local day, claimed durably so several processes or a repeated daylight-saving minute run it once. It replaces the deployment's `demoMode.data.reset` schedule only when saved with `replaceLegacy`.

`pnpm nocobase demo-mode data <status|import|clear|reset>` drives the same lifecycle from a shell (`--actor`, `--language`; changes need `--force`, and `--dry-run` only prints what would happen).

## Verification

```bash
pnpm --filter @nocobase/app-plugin-demo-mode lint
pnpm --filter @nocobase/app-plugin-demo-mode typecheck
pnpm --filter @nocobase/app-plugin-demo-mode test
pnpm --filter @nocobase/app-plugin-demo-mode build
```

## Runtime configuration

Applications can build a management UI on `/api/demoMode/configuration`, with independent `demoMode.configuration` read/configure permissions. Register explicit write capabilities and mock adapters through `demoConfigurationToken`; no business write rules are enabled by default. Configuration uses optimistic revisions, daily reset supports IANA timezones, and disabled mocks fail closed. The published [integration Skill](skills/nocobase-app-plugin-demo-mode/SKILL.md) documents scope validation, scheduling and application-owned adapters.

### Demo Agent replacement

`demoConfigurationToken` exposes `registerAgent<Input, Output>({ id, title, scope, defaultEnabled, matches, execute })`. Applications supply persisted scope detection and a simulated result implementation. The returned proxy's `run(input, normalAgent)` replaces matching calls and preserves non-demo execution; disabled matching calls fail closed. For durable tasks use `prepare`, persist the proxy ID, then call `execute` under `withFreshPolicy` after normal authorization and claim checks. This reuses the existing Runner mock configuration UI and does not grant database writes. See the [simulation Skill reference](skills/nocobase-app-plugin-demo-mode/references/simulation.md).
