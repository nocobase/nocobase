# @nocobase/app-plugin-demo-mode

For dedicated demo deployments with databases and storage isolated from production. Mixed production and demo business data in one instance is not supported. The plugin has two parts:

- **Request write protection.** A request-scoped database guard refuses writes except configured exceptions, and the client reports refused operations. Enabling Demo Mode activates the guard; applications must verify browsing and sign-in flows, adapt read paths that write, and separately isolate external calls.
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

Register the configuration factory in the application's existing `defaultAppConfigs()` map as well as registering the Server plugin:

```ts
import { defineDemoModeConfig } from '@nocobase/app-plugin-demo-mode/config';

// Add to the existing map; retain every other application section.
defaultAppConfigs({ demoMode: defineDemoModeConfig() });
```

The factory declares defaults, validation and two environment mappings. The runtime resolves them from the owning application's environment: environment values override configuration-file values, which override defaults. There is no process-global fallback in the plugin. Registration of the Server plugin alone does not register the configuration factory. Restart after changing deployment configuration.

The plugin is off until the deployment switches it on:

| Environment                          | Configuration               | Meaning                                                           |
| ------------------------------------ | --------------------------- | ----------------------------------------------------------------- |
| `NOCOBASE_DEMO_MODE`                 | `demoMode.enabled`          | `false` (default) or `true`                                       |
| `NOCOBASE_DEMO_WRITABLE_COLLECTIONS` | `demoMode.allowCollections` | Comma-separated logical collection names requests may still write |

`session` and `verification`, the Better Auth tables signing in and out writes, are always allowed, except to routes that end or change other sessions — any path ending in `revoke-sessions`, `revoke-other-sessions`, `revoke-session`, `update-session` or their camelCase forms, such as the users plugin's `users/:userId/revokeSessions` — so a visitor of a shared demo account cannot sign everyone else out.

For deployment defaults, set `NOCOBASE_DEMO_WRITABLE_COLLECTIONS=userPreferences,orderItems` and restart the application. Names are comma-separated, trimmed and deduplicated; case is preserved. The variable replaces `demoMode.allowCollections` when set (an empty value clears that deployment list); built-in authentication exceptions remain. These deployment-owned `fixedCollections` combine with the administrator's saved `collections`, so removing a UI selection does not revoke a deployment exception. Business authorization still applies.

## What it does

A root-router middleware runs every HTTP request, including the WebSocket upgrade, inside an async-local context. The plugin listens to the `query` event of every connection's knex client, which knex emits synchronously before sending a statement, from transactions too. A statement that writes — `INSERT`, `UPDATE`, `DELETE`, DDL, or anything it does not recognize as a read — made inside a request is refused unless it targets an allowed table. Work outside requests, such as migrations, seeds, jobs, schedules and startup tasks, is never refused.

A refused request is answered with the standard error body, `400 FAILED_PRECONDITION`, reason `DEMO_READ_ONLY`, domain `demoMode`, and a `localizedMessage` in the request's language, whatever the route made of the failure. The response carries `Server-Timing: demo-read-only`, which the Client plugin reads through `PerformanceObserver` to show a toast, whichever client sent the request. A route that catches the failure and still succeeds keeps its answer, unmarked: pages often make best-effort writes while reading, and the visitor changed nothing. The Client plugin reads the enabled flag from the public `GET /api/demoMode/status` and shows nothing until a change is refused.

At startup the plugin sends a probe write through every connection and refuses to start if one is not refused, so an upgrade that breaks the hook cannot silently leave a demo writable.

## Finding what to allow

Use `NOCOBASE_DEMO_MODE=true` only in the isolated demo deployment. Browse the intended visitor journeys and inspect refused requests in the `demo-mode` log, which records their method, path and writes. Some pages write while being read, for example to refresh a cache. Add only the collection exceptions those journeys need, then verify them again. Ordinary application development leaves the flag unset or sets it to `false`.

## Limits

- Only databases opened through `@nocobase/db` are guarded. Outbound calls (mail, model APIs, webhooks), files written to drive storage and queue messages made before the refused write still happen.
- A refusal is found when the write is attempted, so the work a route does before it, such as calling a model, is still spent.
- How a page shows the failure is up to the application; some show their own generic message next to the plugin's toast.
- A read route that writes on the way, such as one expiring stale rows with an `UPDATE` that may change nothing, is refused like any write; allow its table only when it holds nothing a visitor could change, otherwise fix the route.
- Code that starts a write without awaiting it turns the refusal into an unhandled rejection, which can stop the process; await writes and handle their failures in the application.
- The application's request log records the status the route produced before the plugin replaced it, such as a 500 from Better Auth.
- Register `defineDemoModeConfig()` in each application so its environment is resolved independently, including under an app host.

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
- **Clearing.** The required `clear(context)` deletes all application business data, including visitor additions and files. It runs for manual clear, reset, failed imports and interrupted-import recovery. It must handle empty/partial context and be safe to retry, and may report how far it got with `context.progress(fraction)`. The plugin then cleans its account/role assignments and tracking. Administrator identities, authorization, demo configuration and the environment model survive. Reset clears and imports again in the background, answering once it is claimed: the accounts, Permission Sets and assignments the import creates again are carried through it, so a demo account that starts the reset, or browses during it, stays signed in and permitted; a carried password is set again only when the dataset changed it. What the new import does not create again is released afterwards as a clear would.
- **Environment model.** When demo mode is on and Agents is available, application startup provisions the OpenAI-compatible `Demo model` through the current Agents `models.services` API, preserving any existing global default. The service and random credential live in `demoModeModel`, independently of imported data. Clear/reset/failure never remove the service. Startup refreshes its local endpoint; startup disables the owned service when Demo Mode is disabled, and enabling Demo Mode reuses it. Applications explicitly select the demo model for their demo AI flows. HTTP callers use `/api/demoMode/models/v1`, authenticated by the generated key. Dataset `answers` supply scripts; `models.complete({ system, prompt, tag })` answers in process. Custom Agent model selections and external transports remain the application's responsibility.

The local simulated model endpoint is derived automatically from the application address. Use the demo settings UI to enable or disable the dataset model adapter and online chat. Disabling the simulated adapter rejects calls; it never falls back to a real model.

The routes require `settings:demoMode.data` (`read` for status, `manage` for changes): `GET /api/demoMode/data` and `POST /api/demoMode/data/import|clear|reset`. Import/reset accept `{ language }` and return progress through status: `operation` names what is under way (`import`, `clear` or `reset`) and `importing.percent` runs once across both phases of a reset. Every mutation requires enabled demo mode, including CLI and Scheduler calls. Authorized lifecycle work bypasses the write guard without exempting concurrent ordinary requests. The plugin's administration page drives them; `useDemoData()` remains for an application that builds its own.

## Share a sample-data generator

Keep business generation in an application function and call it from both entry points. A dataset accepts `generate(context)` instead of `steps(language)`; supply exactly one. Existing step-based adapters remain supported. The generator receives the usual clock, account helpers, tracking and progress context. It must not clear data or call the core sample registry itself.

```ts
// Application-owned generator: no seed history or demo lifecycle dependency.
async function generateBusinessSamples() {
  await business.createExampleRecords();
}

// Ordinary installation: the core decides whether this registration runs.
app.container.resolve(sampleDataToken).register({
  name: 'my-app/business',
  packageName: 'my-app',
  run: generateBusinessSamples,
});

// Dedicated demo: the same generator runs on every reset.
app.container.resolve(demoDataToken).register({
  id: 'my-app',
  languages: ['en-US'],
  accounts: () => [],
  generate: generateBusinessSamples,
  clear: () => business.clearAllDemoBusinessData(),
});
```

For generators requiring an actor, language, accounts or a clock, use an application-owned options object and adapt each caller's context. Never call demo import/reset from `sampleDataToken`: ordinary sample installation must not enable demo mode or clear existing business data. Applications without a sample-data registration can expose their generator first without adding automatic installation behavior.

Demo reset always clears business data before calling the generator again. A failed cleanup stops generation; retry reset after correcting the failure. It neither consults nor changes sample seed history, normal initialization seeds or migrations. An already executed sample registration therefore does not prevent demo regeneration, and a later normal startup does not repeat sample installation.

## Quick sign-in

When `NOCOBASE_DEMO_MODE=true`, visitors enter the imported demo accounts without a password and switch between them. The Client plugin contributes a `/demo-sign-in` page and a corner account switcher on every page, the sign-in page included. Registering the plugin alone does not enable Demo Mode.

Set `demoMode.quickSignIn: false` in application configuration to disable quick sign-in. It defaults to `true` and has no environment variable.

Signed-in visitors switch accounts from a corner button by default. An application with an account menu puts the switch there instead, before signing out, and keeps the corner button for visitors who have not signed in:

```tsx
// client/plugins.ts
demoMode({ accountSwitcher: 'menu' });

// the account menu, inside its Base UI DropdownMenuContent, before the sign-out item
import { DemoAccountMenu } from '@nocobase/app-plugin-demo-mode/client/account-menu';
<DemoAccountMenu />;
```

Set `showFloatingAccountSwitcher: false` in the client registration to hide the floating entry for both guests and signed-in visitors. This does not disable `DemoAccountMenu` or the direct `/demo-sign-in` route. The default remains `true`.

`DemoAccountMenu` is a submenu of the demo accounts with the current one checked, followed by a separator; it renders nothing outside a demo.

- `GET /api/demoMode/accounts`, public, lists the accounts `accounts(language)` lists for the imported language, limited to users the dataset created and has not disabled, as `{ username, name, role, current }` without passwords.
- `POST /api/demoMode/accounts/{username}/signIn` ends the request's own session, signs in through Better Auth's email-and-password sign-in with the password the dataset lists, and answers with Better Auth's session cookie. The authentication plugin is unchanged, and the session is an ordinary one. An account the list does not offer is `404 DEMO_ACCOUNT_NOT_FOUND`; a listed password that is wrong is `400 DEMO_ACCOUNT_SIGN_IN_FAILED`.
- `accounts(language)` must therefore list each account's real password, and every listed account, an administrator included, is open to anyone who reaches the demo.

## Administration page

`DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` is the whole demo administration: an application mounts it on a route of its own, inside its own page layout, and protects that route with `authz: { resource: { type: 'settings', id: 'demoMode.data' }, action: 'read' }`. Management uses the settings grants below, without an additional page grant. It has four tabs, the current one kept in `?tab=`:

- **Overview** — the dataset's state, language, time and counts, with Generate, Reset and Clear (each confirmed, with its exact consequence), and demo accounts, their credentials and a copyable sign-in link for each.
- **Daily reset** — on or off, the time, a searchable IANA time zone, the dataset language and the next run.
- **Visitor writes** — collection exceptions with the deployment's fixed collections.
- **Simulation & AI** — simulated online chat (on or off, a policy per tool) and the registered simulations.

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

`label` receives `count` (a key of the dataset's `counts`), `adapter` or `chatTool` with its id. `onDataChange` is called when a clear answers or a watched import or reset finishes, for the application to refresh what it caches. The data language defaults to the reader's interface language when the dataset is written in it.

### Host presentation components

Pass a stable, module-level `components` map to reuse the host's page header, cards, buttons and tabs. `DemoSettingsComponents` and `DemoSettingsHeaderProps` are public types on the same `client/settings` export. Omitted slots retain the plugin defaults, so existing callers keep their presentation. Keep one `PageContainer` in the owning application.

The slots are `Header`, `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`, `TabsList` and `TabsTrigger`. Header receives localized `title`, `refreshLabel`, `activeTabLabel`, `refreshDisabled`, `refreshing` and `onRefresh`; preserve the refresh guard, and use `refreshing` for pending feedback. A host with a parent settings heading should use its frame-aware header. `activeTabLabel` supports a host breadcrumb without coupling the plugin to private routing contexts.

Define component functions outside the page render to preserve drafts and focus. Primitive replacements must forward children, refs, disabled states, events and accessibility props. Use compatible Base UI components from the same shared `@base-ui/react` peer instance; the plugin retains the Tabs root and panels, URL state, permissions, confirmation dialogs and revision-safe saves. For example, a host `TabsList` adapter can set `variant="line"` and wrap at narrow widths while forwarding all other props. Replace card parts together when the host uses a different spacing model, and allow action rows and unsaved-state footers to wrap on mobile. Do not change theme tokens or use global CSS overrides to adapt this one page.

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

The command waits for completion. `--dry-run` previews only the operation and arguments without loading the application; changes require `--force`. Import and clear require `--actor`. Reset may reuse the last importer and language. The same service runs outside HTTP, including when Demo Mode is enabled. Output omits account passwords and model keys.

## Demo configuration

When Demo Mode is enabled, administrators adjust it from the plugin's administration page, through `GET /api/demoMode/configuration` and `PUT /api/demoMode/configuration/collections|mocks|schedule|chat` (`settings:demoMode.configuration`: `read` / `configure`). Every save carries `expectedRevision` and is refused with `DEMO_CONFIGURATION_CONFLICT` when another administrator saved first.

- **Simulations.** `registerMock` registers model/tool/Runner adapters. `registerAgent({ id, title, defaultEnabled, execute })` supplies an environment-wide Agent proxy: demo mode always uses the application’s replacement, while `NOCOBASE_DEMO_MODE=false` uses the normal Agent. Disabled adapters fail closed; unmarked or visitor-created business records never fall through to a real Agent in demo mode.
- **Daily reset.** Scheduler triggers resets independently of HTTP traffic. Normal request policy checks do not calculate the next reset time; `nextRun` is only a management-view preview. Configure `{ enabled, hour, minute, timezone, language }` through the management API/UI. This is the only schedule source; there is no deployment-cron override. A durable claim permits one reset per local day, including across processes and repeated DST minutes. Resets run as the administrator who generated the data last, so nothing resets before the first generation. Register the Scheduler plugin in the host: Demo Mode owns the `demoMode.dailyReset` target and minute tick; applications supply only the dataset adapter. Until an administrator saves a schedule, the default resets every night at 03:00 in the dataset's last generated language and its time zone; saving `enabled: false` turns it off. Expose `nextRun` from the saved configuration and execution failures in Scheduler. Missed minutes are skipped, including downtime; a failed claimed run is not retried automatically that day.

`pnpm nocobase demo-mode data <status|import|clear|reset>` drives the same lifecycle from a shell (`--actor`, `--language`; changes need `--force`, and `--dry-run` only prints what would happen).

## Verification

```bash
pnpm --filter @nocobase/app-plugin-demo-mode lint
pnpm --filter @nocobase/app-plugin-demo-mode typecheck
pnpm --filter @nocobase/app-plugin-demo-mode test
pnpm --filter @nocobase/app-plugin-demo-mode build
```

## Runtime configuration

The administration page is built on `/api/demoMode/configuration`, with independent `demoMode.configuration` read/configure permissions. Configure writable collections through the administration page and register mock adapters through `demoConfigurationToken`; the writable collection list starts empty. Configuration uses optimistic revisions, daily reset supports IANA timezones, and disabled mocks fail closed. The published [integration Skill](skills/nocobase-app-plugin-demo-mode/SKILL.md) documents collection exceptions, scheduling and application-owned adapters.

### Collection exceptions

The authenticated GET `/api/demoMode/configuration/collections` lists collections in the default application database (objects with `name` and optional `title`) for a searchable multi-select. It excludes views, protected tables and deployment-owned exceptions. Keep saved selections visible even when absent from the catalog, so administrators can remove stale entries.

Administrators can PUT `/api/demoMode/configuration/collections` with `{ expectedRevision, value: ["orderItems"] }`. Each entry is a logical collection name, such as `orderItems`, exactly as used in migrations. The plugin resolves physical names from collection metadata, including naming strategies and table prefixes. Exceptions apply only to the default database connection; an identically named table on another connection stays guarded. Adding a collection allows its INSERT, UPDATE and DELETE statements; removing it restores read-only protection unless another exception still grants access. The list defaults to empty, persists across restarts and applies to subsequent HTTP requests, including implicit writes from GET routes. Normal application authorization remains in force.

Protected identity, authorization, Agent and Demo configuration tables cannot be added through this API. Deployment-level exceptions (including sign-in sessions) remain visible as `fixedCollections` and are managed by deployment configuration. Runtime exception collections are returned as `collections`. These runtime exceptions never permit DDL or unknown statements.

### Demo Agent replacement

`demoConfigurationToken.registerAgent<Input, Output>({ id, title, defaultEnabled, execute })` returns a proxy with `run(input, normalAgent)`. For queued work call `prepare()` before enqueueing, persist the proxy ID, then `execute(input)` under `withFreshPolicy` after normal authorization and work-claim checks. Record-level business authorization remains mandatory; a demo environment does not grant visitors administrator permissions. See the [simulation reference](skills/nocobase-app-plugin-demo-mode/references/simulation.md).

## Agents integration

### Model services

The plugin supports Agents 1.0 only and provisions the model through `agents.models.services`; it owns the durable model binding and its key. Select `{ modelService: demoData.models.serviceName, model: 'demo-chat' }` for application-owned demo flows after checking the service name in `ready()`; `start()` runs earlier. Keep normal persisted model selections intact. When no default exists, Agents may choose its first enabled model through its own policy. An installed Agents host without model services fails startup with an actionable error.

### Online demo chat

Administrators configure `chat` through `PUT /api/demoMode/configuration/chat` using the same permissions and optimistic revision as other settings. It defaults to `{ enabled: false, tools: {} }`. Online chat uses the host's simulated model. The environment's simulated model remains available to scripted dataset operations.

The host calls `chatModel(simulatedModel)` before admission and every model request, and `runChatTool(id, { readOnly, run, mock })` after normal business authorization. Policies are read fresh, including background work and restored sessions. Unknown tools are denied. `read` only invokes a host-declared local read; `mock` only invokes an explicit adapter; missing adapters never fall back to real execution. Mark neither outbound network reads nor business mutations as local reads. Disabled demo mode returns normal host behavior.

For an application chatting through the Agents OnlineAgent service, `runOnlineConversation(callback)` provides a narrow persistence boundary: when chat is enabled, it permits conversation and message inserts and updates only inside that callback and the session continuation it starts. Verify ownership and the agent scope first, then call only the public session operation (create, send, abort, finalize, configure, rename, mark read). Refuse other agents, runner conversations, attachments, approvals and configuration overrides. Never wrap dispatchers, model/tool execution, uploads, agent configuration or arbitrary database work. Other requests remain guarded and these protected tables are never exposed as global collection exceptions. Keep fixture import outside the HTTP boundary, independent of visitor chat enablement. This boundary is deliberately separate from `runChatTool` and is unnecessary for applications with their own conversation persistence.

This policy does not intercept Agents, grant permissions, or open internal tables. Hosts retain conversation ownership and use `runOnlineConversation` for the authorized session operation; protected Agent tables cannot be enabled through collection exceptions. Application adapters must guard every external side effect, including queued work. Model/tool policy and persistence permissions are independent; both must be configured to enable a read-only demo chat.

## Integration contracts

`demoConfigurationToken` exposes the structural `DemoConfigurationService` interface. Provider initialization, policy snapshots and daily claims stay on the plugin's private runtime contract. Applications import the original public token and may implement a typed substitute without inheriting the implementation class.

Agents is an optional peer, resolved when demo mode is enabled or an existing demo model needs disabling. Non-AI applications can omit it; installing the package alone does not register its service. When the official Agents service is registered, the existing persistent-model lifecycle applies. Broken installed integrations and unsupported registered services fail visibly. Demo Mode does not provide an alternative Agents backend.

Start with the Skill's [prerequisites](skills/nocobase-app-plugin-demo-mode/SKILL.md#required-host-capabilities) and [executable non-AI example](skills/nocobase-app-plugin-demo-mode/references/minimal-example.md). It supplies application-owned schema, business services, dataset, provider, permissions, protected API and page composition. Daily reset uses plugin defaults when Scheduler is registered; add AI only when requested.
