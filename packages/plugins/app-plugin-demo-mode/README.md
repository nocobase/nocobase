# @nocobase/app-plugin-demo-mode

For dedicated demo deployments with databases and storage isolated from production. Mixed production and demo business data in one instance is not supported. The plugin has two parts:

- **Request write protection.** A request-scoped database guard refuses writes except configured exceptions, and the client reports refused operations. Enabling Demo Mode activates the guard; applications must verify browsing and sign-in flows, adapt read paths that write, and separately isolate external calls.
- **Demo data.** An application registers one demo dataset; administrators generate, clear and reset it through a command, a schedule or the API, and a simulated model answers its agents. See [Demo data generation](#demo-data-generation).

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

The factory declares defaults, validation and environment mappings. The runtime resolves them from the owning application's environment: environment values override configuration-file values, which override defaults. There is no process-global fallback in the plugin. Registration of the Server plugin alone does not register the configuration factory. Restart after changing deployment configuration.

The plugin is off until the deployment switches it on:

| Environment                          | Configuration                  | Meaning                                                           |
| ------------------------------------ | ------------------------------ | ----------------------------------------------------------------- |
| `NOCOBASE_DEMO_MODE`                 | `demoMode.enabled`             | `false` (default) or `true`                                       |
| `NOCOBASE_DEMO_WRITABLE_COLLECTIONS` | `demoMode.allowCollections`    | Comma-separated logical collection names requests may still write |
| `NOCOBASE_DEMO_RESET_HOUR`           | `demoMode.dailyReset.hour`     | Reset hour, 0–23; default `3`                                     |
| `NOCOBASE_DEMO_RESET_MINUTE`         | `demoMode.dailyReset.minute`   | Reset minute, 0–59; default `0`                                   |
| `NOCOBASE_DEMO_RESET_TIMEZONE`       | `demoMode.dailyReset.timezone` | IANA time zone; default `UTC`                                     |
| `NOCOBASE_DEMO_RESET_LANGUAGE`       | `demoMode.dailyReset.language` | Supported dataset language; default `en-US`                       |

`session` and `verification`, the Better Auth tables signing in and out writes, are always allowed, except to routes that end or change other sessions — any path ending in `revoke-sessions`, `revoke-other-sessions`, `revoke-session`, `update-session` or their camelCase forms, such as the users plugin's `users/:userId/revokeSessions` — so a visitor of a shared demo account cannot sign everyone else out.

For deployment defaults, set `NOCOBASE_DEMO_WRITABLE_COLLECTIONS=userPreferences,orderItems` and restart the application. Names are comma-separated, trimmed and deduplicated; case is preserved. The variable replaces `demoMode.allowCollections` when set (an empty value clears that deployment list); built-in authentication exceptions remain. These deployment-owned `fixedCollections` combine with the administrator's saved `collections`, so removing a UI selection does not revoke a deployment exception. Business authorization still applies.

## What it does

A root-router middleware runs every HTTP request, including the WebSocket upgrade, inside an async-local context. The plugin listens to the `query` event of every connection's knex client, which knex emits synchronously before sending a statement, from transactions too. A statement that writes — `INSERT`, `UPDATE`, `DELETE`, DDL, or anything it does not recognize as a read — made inside a request is refused unless it targets an allowed table. Work outside requests, such as migrations, seeds, jobs, schedules and startup tasks, is never refused. In-process job, schedule and queue adapters keep the async context of the request that enqueued their work; once that request has ended, its context refuses nothing, so only work that starts while the request is still running can be refused.

A refused request is answered with the standard error body, `400 FAILED_PRECONDITION`, reason `DEMO_READ_ONLY`, domain `demoMode`, and a `localizedMessage` in the request's language, whatever the route made of the failure. The response carries `Server-Timing: demo-read-only`, which the Client plugin reads through `PerformanceObserver` to show a toast, whichever client sent the request. A route that catches the failure and still succeeds keeps its answer, unmarked: pages often make best-effort writes while reading, and the visitor changed nothing. The Client plugin reads `demoMode.enabled` from the server-published startup configuration and uses it for the shared mode state; it does not request a status endpoint. `GET /api/demoMode/status` remains available for existing clients.

At startup the plugin sends a probe write through every connection and refuses to start if one is not refused, so an upgrade that breaks the hook cannot silently leave a demo writable.

## Shared mode checks

Import `isDemoMode(container)` from `@nocobase/app-plugin-demo-mode/server`. It returns `false` when the service container has no Demo Mode service, so generators and tests can use it without registering the plugin. When the service exists, it reads its `enabled` flag; initialization failures still propagate.

Import `useDemoMode()` from `@nocobase/app-plugin-demo-mode/client`. It returns a boolean shared by the plugin provider, menu and settings page. Without the provider or without enabled public configuration it returns `false`, including outside an application provider. Register `defineDemoModeConfig()` on the server and `demoMode()` on the client as shown above. The provider snapshots the published `demoMode.enabled` at startup: all consumers share it for that client application's lifetime, with zero status requests. Reload the application after changing deployment configuration. It is a presentation helper; enforce restrictions on the server.

## Refuse requests before external effects

The database guard cannot undo a model call, email or upload that occurs before a rejected write. Register `demoEffectsGuard({ paths, allow })` from the server export to refuse selected requests before their route handlers run. It is an application HTTP middleware contribution; register it after the i18n middleware and before any middleware that itself performs the effects you need to protect.

```ts
import { i18nHttpMiddleware } from '@nocobase/app-server/i18n';
import { demoEffectsGuard } from '@nocobase/app-plugin-demo-mode/server';

app.addHttpMiddleware(i18nHttpMiddleware); // Keep the application's existing registration.
app.addHttpMiddleware(
  demoEffectsGuard({
    paths: ['/api/outbound/*', '/api/uploads'],
    allow: [{ method: 'POST', path: '/api/outbound/preview' }],
  }),
);
```

Paths include `/api` where applicable and exclude the deployment base path: `/suite/demo/api/outbound/send` matches `/api/outbound/*`. A literal path matches that endpoint with an optional trailing slash; `:id` matches one segment; a final `/*` matches the subtree including its root. Other wildcard syntax, query strings, fragments and empty segments are rejected. Matching is case-sensitive and segment-based, so `/api/outbound/*` does not match `/api/outboundOther`. Query strings do not affect matching. `allow` requires both a method and a path; method names are case-insensitive.

In Demo Mode, matching requests other than GET, HEAD and OPTIONS receive the same `400 FAILED_PRECONDITION`, `DEMO_READ_ONLY`, localized message, request ID and `Server-Timing: demo-read-only` as database refusals. Outside Demo Mode, or when the plugin is absent, requests pass through. Allowed requests continue through normal authentication, authorization and database protection.

There are no built-in protected paths or blanket exceptions. Select the actual effects endpoints of installed plugins. If protecting `/api/*`, explicitly allow required authentication, visitor entry, read-only POST queries and management operations, for example `{ method: 'POST', path: '/api/demoMode/data/reset' }`. An exception only permits entry into the existing handler; it does not grant its permissions or a database exemption. Avoid broad exceptions for routes that may perform external work.

This guard covers matched non-read HTTP requests. GET endpoints with effects, WebSocket messages, jobs, direct service calls and middleware that runs earlier still need checks at their external boundaries. It does not automatically register protection for Agents, Mail or file plugins; applications must register their chosen paths until those plugins declare their effects.

## Visitor preferences through the Users API

When Demo Mode and Users are enabled, `/api/users/me/preferences` stores `locale`, `theme.mode` and `theme.preset` in application-scoped browser-session cookies. Visitors sharing or switching accounts retain their own choices; absent or deleted choices return `i18n.defaultLocale`, `client.app.defaultColorScheme` and `client.app.defaultTheme`, falling back to `en-US`, `system` and `compact`. Historical account values for these keys are ignored by this API. Other keys retain account storage and the demo write guard; no `userPreferences` write exception is needed for the three presentation keys.

Clients must retain and resend the response cookies. Cookie-bearing writes require a trusted `Origin` or `Referer` under the application's existing authentication rules, including requests authenticated with an API key. This adaptation applies to callers of the Users preference API; it does not connect controls that only use localStorage or `/api/i18n/locale`. Browser session restoration may retain session cookies. Disabling Demo Mode restores ordinary account preferences. The existing Users routes retain authentication, validation, global API limits and request middleware; their Swagger descriptions document the Demo-specific value constraints and cookie behavior.

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

The data operations are **Generate demo data**, **Clear demo data** and **Reset demo data**, available through the CLI and API. Generation runs the application's predefined dataset steps; it does not upload a file or ingest an external dataset. Reset clears the demo system's business data and generates it again. The existing API/CLI names (`/import`, `importNow`, `demo-mode data import`) are retained as technical names for generation, not a separate data-import feature.

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
- **Clearing.** The required `clear(context)` deletes all application business data, including visitor additions and files. It runs for manual clear, reset, failed imports and interrupted-import recovery. It must handle empty/partial context and be safe to retry, and may report how far it got with `context.progress(fraction)`. The plugin then cleans its account/role assignments and tracking, except the operation's executing administrator, whose current credentials, enabled state, assignments, required Permission Sets and tracking survive automatically. Administrators outside the dataset, demo configuration and the environment model remain untouched. Reset clears and imports again in the background, answering once it is claimed: the accounts, Permission Sets and assignments the import creates again are carried through it, so a demo account that starts the reset, or browses during it, stays signed in and permitted; a carried password is set again only when the dataset changed it. What the new import does not create again is released afterwards as a clear would, preserving the executing administrator. Regenerated accounts lose obsolete tracked assignments.
- **Environment model.** When demo mode is on and Agents is available, application startup provisions the OpenAI-compatible `Demo model` through the current Agents `models.services` API, preserving any existing global default. The service and random credential live in `demoModeModel`, independently of imported data. Clear/reset/failure never remove the service. Startup refreshes its local endpoint; startup disables the owned service when Demo Mode is disabled, and enabling Demo Mode reuses it. Applications explicitly select the demo model for their demo AI flows. HTTP callers use `/api/demoMode/models/v1`, authenticated by the generated key. Dataset `answers` supply scripts; `models.complete({ system, prompt, tag })` answers in process. Custom Agent model selections and external transports remain the application's responsibility.

The local simulated model endpoint is derived automatically from the application address. Use the demo settings UI to enable or disable the dataset model adapter and online chat. Disabling the simulated adapter rejects calls; it never falls back to a real model.

The routes require `settings:demoMode.data` (`read` for status, `manage` for changes): `GET /api/demoMode/data` and `POST /api/demoMode/data/import|clear|reset`. Import/reset accept `{ language }` and return progress through status: `operation` names what is under way (`import`, `clear` or `reset`) and `importing.percent` runs once across both phases of a reset. Every mutation requires enabled demo mode, including CLI calls and the daily reset. Authorized lifecycle work bypasses the write guard without exempting concurrent ordinary requests. The plugin's administration page drives them; `useDemoData()` remains for an application that builds its own.

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

When `NOCOBASE_DEMO_MODE=true`, visitors enter any enabled person account without a password and switch between them. Existing accounts and accounts created by the dataset share the same entry list. An anonymous visitor opening the application home page automatically signs in as an existing Super Admin, identified by its unrestricted Permission Set; existing sessions are retained. This works before data generation and does not change passwords or permissions. The Client plugin contributes a `/demo-sign-in` page and exports a header menu. Registering the plugin alone does not enable Demo Mode.

Set `demoMode.quickSignIn: false` in application configuration to disable quick sign-in and automatic home-page sign-in. It defaults to `true` and has no environment variable.

Account subtitles use the dataset's role label when present. Otherwise, they show the names of directly assigned visible Permission Sets, preferring unrestricted administrator sets when assigned. The API preserves title translation descriptors in `roleTitles`; `useDemoAccounts()` translates them using the owning plugins' registered client namespaces and returns the display text in `role`. Authorization already supplies its built-in title translations on the client. Missing translations fall back to Permission Set keys. Accounts without either source have no subtitle.

When Demo Mode is enabled and `app.publicOrigin` is an HTTPS URL, the Server plugin automatically defaults `auth.advanced.defaultCookieAttributes` to `sameSite: none`, `secure: true` and `partitioned: true` before Authentication is created. This lets a demo keep its session inside a cross-site iframe without application-specific authentication code. Set the application's public HTTPS origin even when a reverse proxy terminates TLS; HTTP development, an unspecified public origin and ordinary deployments keep their existing cookie policy. Explicit deployment configuration takes precedence; to retain same-site cookies, set `sameSite: lax` and `partitioned: false` together. Restart after changing the origin or cookie policy. Cookie names, domains, paths and other authentication options are preserved.

Quick sign-in expires matching legacy unpartitioned authentication cookies before issuing their partitioned replacements. Automatic home entry verifies the next request has a usable session before reloading, so browsers that reject cookies fall back to normal entry instead of repeatedly reloading.

Place `DemoModeMenu` in the application's top header actions, before the assistant, appearance and avatar controls. It is a standalone “Demo mode · Switch account” button, with the environment explanation and account list in one dropdown. Hovering or clicking opens it; selecting an account reloads the current location, and a check marks the current account. Use the same component in the guest header when the application has one:

```tsx
// client/plugins.ts
demoMode();

// The application's header actions, alongside its other controls
import { DemoModeMenu } from '@nocobase/app-plugin-demo-mode/client/menu';
<DemoModeMenu />;
```

The application owns header placement and mounts one `DemoModeMenu` in each header. Outside Demo Mode the component renders nothing. When quick sign-in offers no accounts, the environment notice stays available and the dropdown explains that no accounts can be entered.

The plugin preloads a shared account list on page entry so the menu opens immediately on hover. Navigation and dataset changes refresh the list in the background. Changing the interface language translates the cached titles immediately without another account request, including when a pending response arrives after the language switch. During an account switch, account actions are disabled until navigation or an error; errors keep the current account selected and allow retry.

- `GET /api/demoMode/accounts`, public, lists all enabled person accounts as `{ username, name, role, current, roleTitles? }` with `meta.total`, without passwords. `role` remains a string: the dataset label when present, otherwise plain Permission Set titles or keys. The optional `roleTitles` array contains strings or `{ key, ns, defaultValue }` descriptors for client translation when there is no dataset label. Responses are independent of the request language. Labels do not determine eligibility; disabled, deleted and service accounts are excluded.
- `POST /api/demoMode/accounts/{username}/signIn` ends the request's own session and asks Authentication to create an ordinary session for the selected account. No password or dataset ownership is required. An unavailable account is `404 DEMO_ACCOUNT_NOT_FOUND`; session creation failure is `400 DEMO_ACCOUNT_SIGN_IN_FAILED`.
- `POST /api/demoMode/accounts/signInDefault` creates a Super Admin session only for an anonymous visitor and answers `{ data: { signedIn } }`. It leaves normal entry available when no enabled Super Admin exists or quick sign-in is off.
- Every listed account, including the initial administrator, is publicly enterable in Demo Mode. Internal dataset tracking exists only to manage generation, reset and cleanup; it is not a separate user account type.

## Administration page

Wrap the application's demo management route declarations with `demoModeRoutes([...])` from `@nocobase/app-plugin-demo-mode/client` before passing them to `defineAppRoutes()`, including when spreading them into a settings group's `children`. The helper includes them only when the server publishes `demoMode.enabled: true`; disabled or missing configuration omits both the routes and their menu entries, including for root. `defineDemoModeConfig()` publishes this flag automatically. See the [integration example](skills/nocobase-app-plugin-demo-mode/references/minimal-example.md#2-wire-existing-composition-roots). Existing applications must adopt the helper for their application-owned routes.

`DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` is a read-only demo overview: an application mounts it on a route of its own, inside its own page layout, and protects that route with `authz: { resource: { type: 'settings', id: 'demoMode.data' }, action: 'read' }`. Viewing the page uses the settings read grants below, without an additional page grant. It is a single page of three cards:

- **Demo data** — the dataset's state, language, time, counts and operation progress.
- **Daily reset** — a read-only display of the deployment’s reset time, IANA time zone, dataset language and next run. Daily reset is enabled automatically; it has no save controls or on/off switch.
- **Accounts** — system usernames and a copyable sign-in link for each.

Visitor write policies, simulation and AI controls are not displayed. Existing collection exceptions remain effective and can be managed through deployment configuration or the configuration API. Registered simulations and integrated demo chat are enabled by default; the application decides which flows to integrate.

The page is read-only for every account, including administrators: it has no Generate, Reset, Clear or dataset language controls. Use the CLI or API for data operations; API mutations require the manage grant. The daily reset card requires only the configuration read grant. Update the reset environment variables and restart the application to change its schedule.

```tsx
import { DemoModeSettings } from '@nocobase/app-plugin-demo-mode/client/settings';

<DemoModeSettings
  // The application's names for its dataset counts; undefined falls back to the id.
  label={(kind, id) =>
    t(`demo.${kind}.${id}`, { defaultValue: '' }) || undefined
  }
/>;
```

`label` receives `count` (a key of the dataset's `counts`) with its id. `onDataChange` is called when a data operation the page watched finishes, for the application to refresh what it caches. The page displays the dataset's recorded language.

### Host presentation components

Pass a stable, module-level `components` map to reuse the host's page header, cards and buttons. `DemoSettingsComponents` and `DemoSettingsHeaderProps` are public types on the same `client/settings` export. Omitted slots retain the plugin defaults, so existing callers keep their presentation. Keep one `PageContainer` in the owning application.

The slots are `Header`, `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription` and `CardContent`. Header receives localized `title`, `refreshLabel`, `refreshDisabled`, `refreshing` and `onRefresh`; preserve the refresh guard, and use `refreshing` for pending feedback. A host with a parent settings heading should use its frame-aware header.

Define component functions outside the page render to preserve state and focus. Primitive replacements must forward children, refs, disabled states, events and accessibility props. The plugin retains read permissions, status refresh and account entry links. Replace card parts together when the host uses a different spacing model, and allow account action rows to wrap on mobile. Do not change theme tokens or use global CSS overrides to adapt this one page.

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

When Demo Mode is enabled, the administration page displays the deployment-owned schedule. `GET /api/demoMode/configuration` and `PUT /api/demoMode/configuration/collections|mocks|chat` remain available (`settings:demoMode.configuration`: `read` / `configure`); collections, mocks and chat have no settings UI. Every save carries `expectedRevision` and is refused with `DEMO_CONFIGURATION_CONFLICT` when another administrator saved first. Explicit saved overrides, including disabled chat or adapters, remain effective; defaults apply when no override exists.

- **Simulations.** `registerMock` registers model/tool/Runner adapters, enabled by default unless `defaultEnabled: false` or a saved override disables them. `registerAgent({ id, title, defaultEnabled, execute })` supplies an environment-wide Agent proxy with the same default: demo mode always uses the application’s replacement when the proxy is called, while `NOCOBASE_DEMO_MODE=false` uses the normal Agent. Registration alone does not execute or intercept anything. Disabled adapters fail closed; unmarked or visitor-created business records never fall through to a real Agent in demo mode.
- **Daily reset.** The application's jobs service triggers one reset per day independently of HTTP traffic. Register `defineDemoModeConfig()` and configure `NOCOBASE_DEMO_RESET_HOUR`, `NOCOBASE_DEMO_RESET_MINUTE`, `NOCOBASE_DEMO_RESET_TIMEZONE` and `NOCOBASE_DEMO_RESET_LANGUAGE`; their defaults are `3`, `0`, `UTC` and `en-US`. Choose a language supported by the registered dataset. The schedule is always enabled in Demo Mode and never follows the last manually generated language or the dataset's time zone. Restart after changing the environment. Previously saved schedules, including disabled schedules, are ignored; schedule writes through the configuration API/service are no longer supported. The host composes `JobExecutorServiceProvider`, as generated applications do. Demo Mode replaces its `daily-reset` cron rule in the `@nocobase/app-plugin-demo-mode` jobs scope at startup with the resolved deployment values. A durable claim permits one reset per local day, including across processes and repeated DST minutes. Resets run as the administrator who generated the data last, so nothing resets before the first generation. The server supplies `nextRun` for the read-only management view; normal request policy checks do not calculate previews. Failed resets appear in data status and the `demo-mode` log. A firing missed during downtime is skipped; a failed claimed run is not retried automatically that day.

`pnpm nocobase demo-mode data <status|import|clear|reset>` drives the same lifecycle from a shell (`--actor`, `--language`; changes need `--force`, and `--dry-run` only prints what would happen).

## Verification

```bash
pnpm --filter @nocobase/app-plugin-demo-mode lint
pnpm --filter @nocobase/app-plugin-demo-mode typecheck
pnpm --filter @nocobase/app-plugin-demo-mode test
pnpm --filter @nocobase/app-plugin-demo-mode build
```

## Runtime configuration

The administration page is built on `/api/demoMode/configuration`, with independent `demoMode.configuration` read/configure permissions. Configure writable collections through deployment configuration or the configuration API and register mock adapters through `demoConfigurationToken`; the writable collection list starts empty. Configuration uses optimistic revisions, daily reset supports IANA timezones, and disabled mocks fail closed. The published [integration Skill](skills/nocobase-app-plugin-demo-mode/SKILL.md) documents collection exceptions, scheduling and application-owned adapters.

### Collection exceptions

The authenticated GET `/api/demoMode/configuration/collections` lists collections in the default application database (objects with `name` and optional `title`) for application-owned configuration clients. It excludes views and deployment-owned exceptions. The built-in administration page does not display a collection selector. Custom clients should preserve saved selections even when absent from the catalog, so administrators can remove stale entries.

Administrators can PUT `/api/demoMode/configuration/collections` with `{ expectedRevision, value: ["orderItems"] }`. Each entry is a logical collection name, such as `orderItems`, exactly as used in migrations. The plugin resolves physical names from collection metadata, including naming strategies and table prefixes. Exceptions apply only to the default database connection; an identically named table on another connection stays guarded. Adding a collection allows its INSERT, UPDATE and DELETE statements; removing it restores read-only protection unless another exception still grants access. The list defaults to empty, persists across restarts and applies to subsequent HTTP requests, including implicit writes from GET routes. Each process caches the saved policy for a few seconds, so a save made on another instance reaches it shortly after. Normal application authorization remains in force.

Any table collection can be added, including identity and Agent tables. Deployment-level exceptions (including sign-in sessions) remain visible as `fixedCollections` and are managed by deployment configuration. Runtime exception collections are returned as `collections`. These runtime exceptions never permit DDL or unknown statements.

### Demo Agent replacement

`demoConfigurationToken.registerAgent<Input, Output>({ id, title, defaultEnabled, execute })` returns a proxy with `run(input, normalAgent)`. For queued work call `prepare()` before enqueueing, persist the proxy ID, then `execute(input)` under `withFreshPolicy` after normal authorization and work-claim checks. Record-level business authorization remains mandatory; a demo environment does not grant visitors administrator permissions. See the [simulation reference](skills/nocobase-app-plugin-demo-mode/references/simulation.md).

## Agents integration

### Model services

The plugin supports Agents 1.0 only and provisions the model through `agents.models.services`; it owns the durable model binding and its key. Select `{ modelService: demoData.models.serviceName, model: 'demo-chat' }` for application-owned demo flows after checking the service name in `ready()`; `start()` runs earlier. Keep normal persisted model selections intact. When no default exists, Agents may choose its first enabled model through its own policy. An installed Agents host without model services fails startup with an actionable error.

### Online demo chat

Demo chat defaults to `{ enabled: true, tools: {} }`, with no administration-page switch. The application opts in by calling the integration methods below; these defaults do not redirect standard Online Agent chat or change its model selection. Applications that do not integrate demo chat keep their existing behavior. Explicit overrides remain available through `PUT /api/demoMode/configuration/chat` using the same permissions and optimistic revision as other settings, and existing saved values remain effective. The environment's simulated model remains available to scripted dataset operations.

The host calls `chatModel(simulatedModel)` before admission and every model request, and `runChatTool(id, { readOnly, run, mock })` after normal business authorization. Policies are read at each call, from a per-process cache of a few seconds, including background work and restored sessions. Without a saved tool override, a supplied `mock` runs first; otherwise `run` is allowed only when the host explicitly marks it `readOnly: true`. Unadapted operations are denied. Explicit `read`, `mock` or `deny` policies override these defaults: `read` still requires a host-declared local read and `mock` requires an adapter. Missing adapters never fall back to real execution. Mark neither outbound network reads nor business mutations as local reads. Disabled demo mode returns normal host behavior.

For an application chatting through the Agents OnlineAgent service, `runOnlineConversation(callback)` provides a narrow persistence boundary: when chat is enabled, it permits conversation and message inserts and updates only inside that callback and the session continuation it starts. Verify ownership and the agent scope first, then call only the public session operation (create, send, abort, finalize, configure, rename, mark read). Refuse other agents, runner conversations, attachments, approvals and configuration overrides. Never wrap dispatchers, model/tool execution, uploads, agent configuration or arbitrary database work. Other requests remain guarded unless an administrator adds these tables as collection exceptions. Keep fixture import outside the HTTP boundary, independent of visitor chat enablement. This boundary is deliberately separate from `runChatTool` and is unnecessary for applications with their own conversation persistence.

This policy does not intercept Agents, grant permissions, or open internal tables. Hosts use `runOnlineConversation` for the session operation. Application adapters must guard every external side effect, including queued work. Model/tool adaptation and conversation persistence are independent integration points; both must be connected for a working demo chat, without an additional UI setting.

## Integration contracts

`demoConfigurationToken` exposes the structural `DemoConfigurationService` interface. Provider initialization, policy snapshots and daily claims stay on the plugin's private runtime contract. Applications import the original public token and may implement a typed substitute without inheriting the implementation class.

Agents is an optional peer, resolved when demo mode is enabled or an existing demo model needs disabling. Non-AI applications can omit it; installing the package alone does not register its service. When the official Agents service is registered, the existing persistent-model lifecycle applies. Broken installed integrations and unsupported registered services fail visibly. Demo Mode does not provide an alternative Agents backend.

Start with the Skill's [prerequisites](skills/nocobase-app-plugin-demo-mode/SKILL.md#required-host-capabilities) and [executable non-AI example](skills/nocobase-app-plugin-demo-mode/references/minimal-example.md). It supplies application-owned schema, business services, dataset, provider, permissions, protected API and page composition. Daily reset uses plugin defaults on the application's jobs service; add AI only when requested.

Daily reset attempts use bounded retries and require explicit recovery after uncertain interruption. See the [reset policy](skills/nocobase-app-plugin-demo-mode/references/policies.md) for retry and manual recovery behavior.
