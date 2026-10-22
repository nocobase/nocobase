# @nocobase/app-plugin-demo-mode

For dedicated demo deployments with databases and storage isolated from production. Mixed production and demo business data in one instance is not supported. The plugin has two parts:

- **Read-only mode.** A request-scoped database guard refuses writes except configured exceptions, and the client reports refused operations. Registration enables the guard; applications must verify browsing and sign-in flows, adapt read paths that write, and separately isolate external calls.
- **Demo data.** An application registers one demo dataset; administrators generate, clear and reset it from the application's own page, a command, a schedule or the API, and a simulated model answers its agents. See [Demo data generation](#demo-data-generation).

## Sample data or a dedicated demo system

Sample data is optional example content in an existing application: fictional customers, orders, tasks and their relationships. Use `defineSeed({ name, sample: true, run })` or `sampleDataToken` from `@nocobase/app-server/sample-data`, following the installed application development and database Skills. Sample data does not require this plugin and does not change the application's operating mode.

Demo Mode supports an entire dedicated demo system: isolated database/storage, repeatable business-data generation/clear/reset, demo-account lifecycle, visitor write policies and optional simulated external or Agent execution. The plugin supplies those mechanisms; the application implements its dataset, cleanup and adapters, and mounts the plugin's administration page. Choose it for that lifecycle, rather than merely because example records are called "demo data." Fixture-building helpers may be shared, but sample installation and demo reset remain separate entry points.

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

For deployment defaults, set `NOCOBASE_DEMO_ALLOW_TABLES=crm_user_preferences,crm_plans` and restart the application. Names are comma-separated, trimmed, lowercased and deduplicated. The variable replaces `demoMode.allowTables` when set (an empty value clears that deployment list); built-in authentication exceptions remain. These deployment-owned `fixedTables` combine with the administrator's saved `tables`, so removing a UI selection does not revoke a deployment exception. Business authorization still applies.

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

## Demo data generation

The user actions are **Generate demo data**, **Clear demo data** and **Reset demo data**. Generation runs the application's predefined dataset steps; it does not upload a file or ingest an external dataset. Reset clears the demo system's business data and generates it again. The existing API/CLI names (`/import`, `importNow`, `demo-mode data import`) are retained as technical names for generation, not a separate data-import feature.

The plugin owns the generation/clear/reset lifecycle; the application owns what the data says. Register the dataset from a service provider:

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

- **Generate** claims the dataset's row in `demoModeDatasets` before anything is written, so a second import is refused, runs the steps in order with progress, and attempts the full-business cleanup contract when a step fails. The import is not one database transaction; failure recovery does not restore previous business data, and failed cleanup must be retried. An import no process moved on for ten minutes counts as interrupted and is cleared before the next one.
- **Tracking and accounts.** `context.track(collection, ids)` records import membership for counts and application lookups; the application clears its business tables. `createAccount`, `createPermissionSet` and `assignPermissionSet` own the identity lifecycle. Clear revokes assignments, disables demo accounts and removes demo-owned permission sets. The next import re-enables owned accounts and applies `roleScopes` again. Usernames cannot be reused after deletion by the Users plugin, so demo accounts are always retained disabled. An unowned username collision is refused. `setData()` stores import context for steps and cleanup.
- **Dates.** `context.clock` gives `daysAgo`, `dateAgo` and `isoAgo` relative to when the import started, in the dataset's time zone, never in the future unless asked for.
- **Clearing.** The required `clear(context)` deletes all application business data, including visitor additions and files. It runs for manual clear, reset, failed imports and interrupted-import recovery. It must handle empty/partial context and be safe to retry. The plugin then cleans its account/role assignments and tracking. Administrator identities, authorization, demo configuration and the environment model survive. Reset clears and imports again.
- **Environment model.** Unless `demoMode.data.models` is `false`, application startup provisions the OpenAI-compatible `Demo model` and makes it the default chat model through the current Agents `models.services` API. The service and random credential live in `demoModeModel`, independently of imported data. Clear/reset/failure never remove the service or restore a previous model. Startup refreshes its local endpoint and reasserts the demo default. Real models may be explicitly selected for online chat through the administrator-controlled chat policy below; never use them as an automatic simulation fallback. HTTP callers use `/api/demoMode/models/v1`, authenticated by the generated key. Dataset `answers` supply scripts; `models.complete({ system, prompt, tag })` answers in process. Custom Agent model selections and external transports remain the application’s responsibility.

| Environment                         | Configuration                | Meaning                                                          |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `NOCOBASE_DEMO_DATA_MODELS`         | `demoMode.data.models`       | `true` (default): provision the environment model at startup     |
| `NOCOBASE_DEMO_DATA_MODEL_BASE_URL` | `demoMode.data.modelBaseUrl` | Where the gateway reaches the simulated model, when not loopback |

The routes require `settings:demoMode.data` (`read` for status, `manage` for changes): `GET /api/demoMode/data` and `POST /api/demoMode/data/import|clear|reset`. Import/reset accept `{ language }` and return progress through status. Every mutation requires enabled demo mode, including CLI and Scheduler calls. Authorized lifecycle work also runs in read-only mode without exempting concurrent ordinary requests. The plugin's administration page drives them; `useDemoData()` remains for an application that builds its own.

## Quick sign-in

While demo mode is `read-only` or `observe`, visitors enter the imported demo accounts without a password and switch between them. Registration alone enables it: the Client plugin contributes a `/demo-sign-in` page and a corner account switcher on every page, the sign-in page included.

| Environment                   | Configuration          | Meaning                                    |
| ----------------------------- | ---------------------- | ------------------------------------------ |
| `NOCOBASE_DEMO_QUICK_SIGN_IN` | `demoMode.quickSignIn` | `true` (default) or `false` to turn it off |

- `GET /api/demoMode/accounts`, public, lists the accounts `accounts(language)` lists for the imported language, limited to users the dataset created and has not disabled, as `{ username, name, role, current }` without passwords.
- `POST /api/demoMode/accounts/{username}/signIn` ends the request's own session, signs in through Better Auth's email-and-password sign-in with the password the dataset lists, and answers with Better Auth's session cookie. The authentication plugin is unchanged, and the session is an ordinary one. An account the list does not offer is `404 DEMO_ACCOUNT_NOT_FOUND`; a listed password that is wrong is `400 DEMO_ACCOUNT_SIGN_IN_FAILED`.
- `accounts(language)` must therefore list each account's real password, and every listed account, an administrator included, is open to anyone who reaches the demo.
- To embed a demo in another page, open `<base path>/demo-sign-in?as=<username>&redirect=/path` in an iframe; without `as` the page lists the accounts. Session cookies are `SameSite=Lax`, so the demo must be on the same site as the embedding page, such as a subdomain of its domain.

## Administration page

`DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` is the whole demo administration: an application mounts it on a route of its own, inside its own page layout, and protects that route with an ordinary page grant given together with the settings grants below. It has four tabs, the current one kept in `?tab=`:

- **Overview** — the dataset's state, language, time and counts, with Generate, Reset and Clear (each confirmed, with its exact consequence), and the visitor entry: the accounts quick sign-in offers, their credentials, a copyable entry link for each and an iframe snippet.
- **Daily reset** — on or off, the time, a searchable IANA time zone, the dataset language and the next run.
- **Visitor writes** — the registered write capabilities with each operation and scope, and the table exceptions with the deployment's fixed tables.
- **Simulation & AI** — online chat (on or off, simulated or a real model, a policy per tool) and the registered simulations.

Each card saves on its own with the revision it was started from and says when another administrator saved first; leaving with unsaved changes asks first. What the viewer lacks the grant for is shown without its actions.

```tsx
import { DemoModeSettings } from '@nocobase/app-plugin-demo-mode/client/settings';

<DemoModeSettings
  // The application's names for what it registered; undefined falls back to the registered title or id.
  label={(kind, id) =>
    t(`demo.${kind}.${id}`, { defaultValue: '' }) || undefined
  }
  // The chat tools the application serves through runChatTool, and the policies each supports.
  chatTools={[
    { id: 'task_list', policies: ['read'] },
    { id: 'read_page', policies: ['mock'] },
  ]}
/>;
```

`label` receives `count` (a key of the dataset's `counts`), `capability`, `scope`, `adapter` or `chatTool` with its id. `onDataChange` is called when a clear answers or a watched import or reset finishes, for the application to refresh what it caches. The data language defaults to the reader's interface language when the dataset is written in it.

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

While demo mode is `read-only` or `observe`, administrators adjust a demo from the plugin's administration page, through `GET /api/demoMode/configuration` and `PUT /api/demoMode/configuration/writeRules|tables|mocks|schedule` (`settings:demoMode.configuration`: `read` / `configure`). Every save carries `expectedRevision` and is refused with `DEMO_CONFIGURATION_CONFLICT` when another administrator saved first.

- **Read-only write exceptions.** An application registers what may be opened with `demoConfigurationToken.registerWrite({ id, title, table, operations, scopes, checkScope })`; identity, authorization, secret and plugin tables are refused. Rules start empty. The application wraps exactly the authorized business mutation in `runWrite(id, operation, input, run)`, or `runWrites([[id, operation], …], input, run)` when one mutation writes through several capabilities: an entry without a rule allows nothing, and a configured entry whose `checkScope` refuses the input refuses the whole mutation with `DEMO_SCOPE_DENIED`.
- **Simulations.** `registerMock` registers model/tool/Runner adapters. `registerAgent({ id, title, defaultEnabled, execute })` supplies an environment-wide Agent proxy: demo mode always uses the application’s replacement, while mode `off` uses the normal Agent. Disabled adapters fail closed; unmarked or visitor-created business records never fall through to a real Agent in demo mode.
- **Daily reset.** Scheduler triggers resets independently of HTTP traffic. Normal request policy checks do not calculate the next reset time; `nextRun` is only a management-view preview. Configure `{ enabled, hour, minute, timezone, language }` through the management API/UI. This is the only schedule source; there is no deployment-cron override. A durable claim permits one reset per local day, including across processes and repeated DST minutes. Configure it after the first import, whose administrator is used for subsequent resets. Register the Scheduler plugin in the host: Demo Mode owns the `demoMode.dailyReset` target and minute tick; applications supply only the dataset adapter. The default is disabled. Expose `nextRun` from the saved configuration and execution failures in Scheduler. Missed minutes are skipped, including downtime; a failed claimed run is not retried automatically that day.

`pnpm nocobase demo-mode data <status|import|clear|reset>` drives the same lifecycle from a shell (`--actor`, `--language`; changes need `--force`, and `--dry-run` only prints what would happen).

## Verification

```bash
pnpm --filter @nocobase/app-plugin-demo-mode lint
pnpm --filter @nocobase/app-plugin-demo-mode typecheck
pnpm --filter @nocobase/app-plugin-demo-mode test
pnpm --filter @nocobase/app-plugin-demo-mode build
```

## Runtime configuration

The administration page is built on `/api/demoMode/configuration`, with independent `demoMode.configuration` read/configure permissions. Register explicit write capabilities and mock adapters through `demoConfigurationToken`; no business write rules are enabled by default. Configuration uses optimistic revisions, daily reset supports IANA timezones, and disabled mocks fail closed. The published [integration Skill](skills/nocobase-app-plugin-demo-mode/SKILL.md) documents scope validation, scheduling and application-owned adapters.

### Exception tables

The authenticated GET `/api/demoMode/configuration/tables` lists physical tables in the default application database for a searchable multi-select. It excludes views, protected tables and deployment-owned exceptions. Keep saved selections visible even when absent from the catalog, so administrators can remove stale entries.

Administrators can PUT `/api/demoMode/configuration/tables` with `{ expectedRevision, value: ["crm_plans"] }`. Each entry is a lowercase physical table name, not a Collection alias. Adding a table allows its INSERT, UPDATE and DELETE statements; removing it restores read-only protection unless another exception still grants access. There is no operation selector and no application capability registration. The list defaults to empty, persists across restarts and applies to subsequent HTTP requests, including implicit writes from GET routes. Normal application authorization remains in force.

Protected identity, authorization, Agent and Demo configuration tables cannot be added through this API. Deployment-level exceptions (including sign-in sessions) remain visible as `fixedTables` and are managed by deployment configuration. Runtime exception tables are returned as `tables`. These runtime exceptions never permit DDL or unknown statements.

### Demo Agent replacement

`demoConfigurationToken.registerAgent<Input, Output>({ id, title, defaultEnabled, execute })` returns a proxy with `run(input, normalAgent)`. For queued work call `prepare()` before enqueueing, persist the proxy ID, then `execute(input)` under `withFreshPolicy` after normal authorization and work-claim checks. Record-level business authorization remains mandatory; a demo environment does not grant visitors administrator permissions. See the [simulation reference](skills/nocobase-app-plugin-demo-mode/references/simulation.md).

## Upgrading the development snapshot

The isolated-environment contract intentionally removes mixed-data compatibility. Follow the [adapter migration checklist](skills/nocobase-app-plugin-demo-mode/references/upgrading.md) before replacing a vendored snapshot. The current Agents API is required; update an older host instead of adding legacy API fallbacks.

### Host model service registration

The default integration uses `agents.models.services`. A host that exposes the same model registration operations through another public facade can call `demoData.registerModelServices(services)` during its provider's `boot()`. The adapter implements `create`, `update`, `remove` and `setDefaultChat`; the plugin still owns the durable model binding and its key. This is an explicit host adapter, not automatic legacy API detection. Bind application Agents in `ready()` after the plugin has initialized its model; `start()` runs earlier. Missing model services on an installed Agents host fail startup with an actionable error.

### Online demo chat

Administrators configure `chat` through `PUT /api/demoMode/configuration/chat` using the same permissions and optimistic revision as other settings. It defaults to `{ enabled: false, model: null, tools: {} }`. A null model selects the host's simulated model; an explicit `{ modelService, model }` selects an existing real model service and incurs its normal token charges. Credentials remain in model services. The environment's simulated default remains available to scripted dataset operations.

The host calls `chatModel(simulatedModel)` before admission and every model request, and `runChatTool(id, { readOnly, run, mock })` after normal business authorization. Policies are read fresh, including background work and restored sessions. Unknown tools are denied. `read` only invokes a host-declared local read; `mock` only invokes an explicit adapter; missing adapters never fall back to real execution. Mark neither outbound network reads nor business mutations as local reads. A host should stop an active conversation when its selected model changes. Disabled demo mode returns normal host behavior.

For an application retaining the legacy Agents online service (such as `0.1.0-beta.8`), `runLegacyOnlineConversation(callback)` provides a narrow persistence adapter: when chat is enabled, it permits conversation/message/run/input inserts and updates and the agent's enqueue lock update only inside that callback. Verify ownership, online agent type and invocation permission first, then call only the original public conversation operation. Never wrap dispatchers, model/tool execution, uploads, agent configuration or arbitrary database work. Other requests remain guarded and these protected tables are never exposed as global UI write rules. Keep fixture import on the original public creation service, independent of visitor chat enablement. This adapter is deliberately separate from `runChatTool` and is unnecessary for applications with their own conversation persistence.

This policy does not intercept Agents, grant permissions, or open internal tables. Hosts retain conversation ownership and register narrowly scoped conversation persistence capabilities through the existing write-rule API. Never allow all `ag_*` tables. Application adapters must guard every external side effect, including queued work. Model/tool policy and persistence permissions are independent; both must be configured to enable a read-only demo chat.
