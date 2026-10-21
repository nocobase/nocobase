# @nocobase/app-plugin-demo-mode

For dedicated demo deployments with databases and storage isolated from production. Mixed production and demo business data in one instance is not supported. The plugin has two parts:

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
    /* clear ALL business tables, files and caches; preserve system identities and configuration */
  },
  answers: [/* what the simulated model says */],
});
```

- **Import** claims the dataset's row in `demoModeDatasets` before anything is written, so a second import is refused, runs the steps in order with progress, and takes everything back when a step fails. An import no process moved on for ten minutes counts as interrupted and is cleared before the next one.
- **Tracking and accounts.** `context.track(collection, ids)` records import membership for counts and application lookups; the application clears its business tables. `createAccount`, `createPermissionSet` and `assignPermissionSet` own the identity lifecycle. Clear revokes assignments, disables demo accounts and removes demo-owned permission sets. The next import re-enables owned accounts and applies `roleScopes` again. Usernames cannot be reused after deletion by the Users plugin, so demo accounts are always retained disabled. An unowned username collision is refused. `setData()` stores import context for steps and cleanup.
- **Dates.** `context.clock` gives `daysAgo`, `dateAgo` and `isoAgo` relative to when the import started, in the dataset's time zone, never in the future unless asked for.
- **Clearing.** The required `clear(context)` deletes all application business data, including visitor additions and files. It runs for manual clear, reset, failed imports and interrupted-import recovery. It must handle empty/partial context and be safe to retry. The plugin then cleans its account/role assignments and tracking. Administrator identities, authorization, demo configuration and the environment model survive. Reset clears and imports again.
- **Environment model.** Unless `demoMode.data.models` is `false`, application startup provisions the OpenAI-compatible `Demo model` and makes it the default chat model through the current Agents `models.services` API. The service and random credential live in `demoModeModel`, independently of imported data. Clear/reset/failure never remove the service or restore a previous model. Startup refreshes its local endpoint and reasserts the demo default; no real model should be configured in a demo deployment. HTTP callers use `/api/demoMode/models/v1`, authenticated by the generated key. Dataset `answers` supply scripts; `models.complete({ system, prompt, tag })` answers in process. Custom Agent model selections and external transports remain the application’s responsibility.

| Environment                         | Configuration                | Meaning                                                          |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `NOCOBASE_DEMO_DATA_MODELS`         | `demoMode.data.models`       | `true` (default): provision the environment model at startup     |
| `NOCOBASE_DEMO_DATA_MODEL_BASE_URL` | `demoMode.data.modelBaseUrl` | Where the gateway reaches the simulated model, when not loopback |

The routes require `settings:demoMode.data` (`read` for status, `manage` for changes): `GET /api/demoMode/data` and `POST /api/demoMode/data/import|clear|reset`. Import/reset accept `{ language }` and return progress through status. Every mutation requires enabled demo mode, including CLI and Scheduler calls. Authorized lifecycle work also runs in read-only mode without exempting concurrent ordinary requests. `useDemoData()` drives the application’s own management page.

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
- **Simulations.** `registerMock` registers model/tool/Runner adapters. `registerAgent({ id, title, defaultEnabled, execute })` supplies an environment-wide Agent proxy: demo mode always uses the application’s replacement, while mode `off` uses the normal Agent. Disabled adapters fail closed; unmarked or visitor-created business records never fall through to a real Agent in demo mode.
- **Daily reset.** Configure `{ enabled, hour, minute, timezone, language }` through the management API/UI. This is the only schedule source; there is no deployment-cron override. A durable claim permits one reset per local day, including across processes and repeated DST minutes. Configure it after the first import, whose administrator is used for subsequent resets.

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

`demoConfigurationToken.registerAgent<Input, Output>({ id, title, defaultEnabled, execute })` returns a proxy with `run(input, normalAgent)`. For queued work call `prepare()` before enqueueing, persist the proxy ID, then `execute(input)` under `withFreshPolicy` after normal authorization and work-claim checks. Record-level business authorization remains mandatory; a demo environment does not grant visitors administrator permissions. See the [simulation reference](skills/nocobase-app-plugin-demo-mode/references/simulation.md).

## Upgrading the development snapshot

The isolated-environment contract intentionally removes mixed-data compatibility. Follow the [adapter migration checklist](skills/nocobase-app-plugin-demo-mode/references/upgrading.md) before replacing a vendored snapshot. The current Agents API is required; update an older host instead of adding legacy API fallbacks.
