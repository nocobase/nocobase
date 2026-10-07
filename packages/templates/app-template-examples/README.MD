# NocoBase 3 Examples

A full-stack NocoBase 3 application. The server runs on `@nocobase/app-server` and the browser client is React with Refine, shadcn/ui, and Tailwind CSS.

You own everything in this directory. Add pages, API routes, database tables, and business logic directly here — this is your application's source code, not a framework you extend from the outside.

This is the examples template, based on `@nocobase/app-template-default`. It is a standalone application with its own database and configuration. Default provides a clean starting template with product capabilities and no example plugins.

The homepage links to article management, repository queries, CRM, orders, file management, routes, and AI employee tasks. Additional registered plugins demonstrate services, queues, scheduled jobs, realtime, CLI commands, and Skills. Plugin demonstrations remain in their own packages under `packages/examples/`; the article page demonstrates application-owned development.

Examples retains Default’s Users and API Keys integration alongside its demonstrations. Users lists direct Authorization Permission Sets as application roles; authenticated default access remains separate. API Keys is configured in both authentication factories and mounted under Settings. Keep these product integrations aligned with Default.

## Create an examples application

After this template and the updated scaffolder have been published:

```bash
pnpm create @nocobase/app my-examples --template examples
```

Before publication, from the source repository root:

```bash
pnpm --filter @nocobase/create-app build
node packages/tools/create-app/bin/run.js my-examples --template ./packages/templates/app-template-examples
```

The scaffolder creates an independent configuration and database. Never copy another application's `config.yml`, `.env`, `storage/`, or generated `dist/` into this template.

Article migration and seed sources create six articles on a fresh managed default connection. Every signed-in user can view, create, and edit all articles. Article pages and APIs do not participate in permission-set authorization. Other examples retain their plugins' authorization policies. The article API follows the HTTP API rules: `GET /api/articles` takes `q`, `status`, `page` and `pageSize` and answers `{ data, meta: { page, pageSize, total } }`, `POST /api/articles` answers `201` with the created article, and `PATCH /api/articles/{articleId}` updates the fields it is sent. Article ids are strings.

Every `/api` route the application writes declares itself for the API document that signed-in users and API keys read at `/api/swagger/docs`. `server/routes/articles.ts` shows the pattern: `describeRoute()` from `@nocobase/app-server/router` with the application's `Examples` tag, a summary, an `operationId` such as `examplesCreateArticle`, and the responses through `dataResponse()`, `listResponse()` and `apiErrorResponse()` for each status the route can produce; `apiValidator()` validates the query, path and body and documents them along with the `400` it answers, so a route lists `400` itself only for another reason; the response schemas live in `server/routes/schemas.ts` with `.meta({ ref })`. The public `GET /api/example` declares `security: []`, and the stand-ins that answer `503 DATABASE_UNAVAILABLE` while no database is configured are hidden with `describeRoute({ hide: true })`. Data endpoints such as the analytics and CRM exposures are documented by the framework without a declaration. `tests/logic/openapi.test.ts` starts the whole application and checks that every route is declared, every `operationId` is present and unique, and `findApiDocumentSchemaProblems()` finds nothing.

## Internationalization example

Open **Internationalization** from the homepage or sidebar (`/i18n-examples`, relative to the application's mount path). Like the other protected examples, this page requires sign-in and its page permission; administrators can explore it directly.

Choose a count of 0, 1, 2 or 5, or enter a non-negative safe integer. Switch between English and Chinese from the account menu: English changes between `item` and `items`, Chinese keeps `个项目`, and the selected count survives the switch. The keys belong to the application in `client/locales/` and use `_one` and `_other` with `t('i18nExamples.itemCount', { count })`.

The fallback table runs deliberately incomplete resources in a page-local `I18nRuntime`, following the current language → application default → `en-US` chain. Switch to Chinese to see the English-only message fall back; the source column reports the language actually used. A key absent from all resources displays `defaultValue` when provided and the key itself otherwise. These fixtures live in `client/pages/i18n-examples/demo.ts`; they do not delete application translations, weaken `AppResource`, register another language picker, or change global resources.

The regional comparison formats the same number, USD amount and fixed UTC timestamp for `zh-CN`, `en-US` and `de-DE` using `Intl`. It performs no currency conversion and does not add German to the application's language list. This example covers regional formatting; it does not demonstrate RTL layout.

## AI employee example

Every signed-in page carries the global AI employee entry: a trigger at the lower right opens the shared AI conversation as a side panel that pushes the page narrower on a wide screen and expands into a dialog. `client/components/ai-employee-entry.tsx` composes it around `AppLayout` from the application-owned `nocobase-ai` Registry item in `client/extensions/nocobase-ai`, and shows the trigger only once the current user has an AI employee. Settings and Dev keep their own layouts without it. Configure an LLM service under `ai.llmServices` in `config.yml` first, as the AI Employee plugin's README describes; without one the employees load but cannot answer.

Open **AI employee tasks** from the homepage or sidebar (`/ai-employee-example`). `@nocobase/app-plugin-ai-employee-example` registers the AI employee Iris and the read-only tool `example-ticket-history` on the server, and declares the route; the page itself is the plugin's `tasks-page` Registry item in `client/extensions/nocobase-ai-employee-example-tasks-page`, which replaces the plugin's fallback through `extension.ts`. Select a ticket and hover **Ask Iris** to run **Analyze this ticket**, which is sent at once, or **Draft a reply**, which only fills the composer; **Triage the queue** starts a task from an ordinary button through `useGlobalAIChatController().triggerTask()` with every ticket as work context. Each task carries its user message, instructions for that run and the tools it may call, and Iris reads each ticket's internal history through the tool.

Both directories under `client/extensions/` belong to the application. `pnpm registry materialize` in the source repository installs them, and upgrades are reviewed with a three-way merge rather than copied over. `tests/components/ai-employee-entry.test.tsx` and `tests/components/ai-employee-tasks-page.test.tsx` cover the entry, the tasks and the requests they send, and `tests/logic/ai-employee-example.test.ts` starts the application and reads the registered employee and tool back.

## Maintain this template

Keep framework files aligned with Default and Hub: the `package.json` scripts that call `nocobase`, runtime composition mechanisms, the `cli/plugins.ts` composition root, shell, theme and development guidance. Keep the examples homepage, article module, example plugin choices and sample data here. Existing Default installations retain their historical data; follow the [upgrade migration rules](.agents/skills/nocobase-app-upgrade/references/edge-cases.md#migrations) when removing example registrations.

## Getting started

Configure the application, then start the development server:

```bash
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

`pnpm nocobase config init` writes `config.yml` from `config.example.yml`, keeping its comments and generating the first key of `secrets.keys`, which encrypts what the application stores as a secret and from which the sign-in and session keys are derived. It is only needed once; `pnpm dev` and `pnpm start` refuse to run until it has been. `pnpm nocobase config check` loads the configuration the way a start would, connects to any database other than SQLite, and reports what would stop the application from starting or quietly misbehave.

`pnpm dev` starts the API server and the Vite client together, picks free ports if the defaults are taken, and prints the URL to open. Use the printed URL rather than assuming a port.

### Develop against another backend

Set `PROXY_TARGET_URL` to the backend application's public URL, including its mount path but excluding `/api`:

```bash
# Example only: replace /main with the backend's actual public mount path.
PROXY_TARGET_URL=http://127.0.0.1:13000/main pnpm dev
```

**`/main` is the fallback, not a required or fixed path.** Local development reads `APP_BASE_PATH` from the command-line environment, then `.env.local`, then `.env`, falling back to `/main` when unset. The remote path comes from `PROXY_TARGET_URL`; it is not inferred from the local `APP_BASE_PATH`. Read the target application's actual public URL before constructing this value. If it is mounted at the origin root, use the origin URL without a mount path.

For example, these applications can use different paths:

```bash
APP_BASE_PATH=/local PROXY_TARGET_URL=http://127.0.0.1:13000/crm pnpm dev
# /local/api/users -> http://127.0.0.1:13000/crm/api/users
# /local/ws        -> ws://127.0.0.1:13000/crm/ws
```

This runs Vite with your local client source and proxies API and WebSocket requests to that application. It does not start a local backend, allocate its port, wait for its health endpoint, or watch server configuration/plugins. Existing `beforeDev` hooks still run to prepare client artifacts. Open the printed **Local** URL (the Vite port); **Backend** identifies the target.

The target can be another local project running `pnpm dev`, or an HTTP(S) deployment. Use its printed application URL, not its Vite URL. Local `APP_BASE_PATH` and the remote mount path may differ: local `/main/api/users` can map to remote `/crm/api/users`. Trailing slashes are accepted. Credentials, query strings, and fragments are not accepted in the target URL.

Requests use the remote backend's data and permissions, including writes. Only `<APP_BASE_PATH>/api` and `<APP_BASE_PATH>/ws` are proxied; application root callbacks and absolute URLs returned by the backend keep their original routing. Cookie domain/path scopes are adapted to the local application. HTTP and WebSocket requests whose Origin matches the local request's protocol and Host are forwarded with the target Origin, so browser authentication and realtime connections pass the backend's same-origin checks. Same-origin Referer URLs within the local app base are mapped to the target app base as well; requests without Origin keep it absent. Other origins and referers remain unchanged and subject to backend validation. HTTPS-only cookie requirements remain enforced, and authentication flows using explicit callback URLs still require appropriate callback configuration.

The variable can also be set in `.env` or `.env.local`; the command-line environment takes precedence. Restart `pnpm dev` after changing the target. Without this variable, development still starts both the local backend and Vite. Production builds ignore it.

Use `APP_SERVER_PORT` to choose the local application port in either development mode. With `PROXY_TARGET_URL` set, it selects Vite's preferred port (5173 when unset); without a proxy target, it selects the local backend's preferred port (13000 when unset), while Vite still starts from 5173. If the preferred port is occupied, development selects the next available port and prints the actual URL. The remote backend address is always taken from `PROXY_TARGET_URL`.

```bash
APP_SERVER_PORT=13399 PROXY_TARGET_URL=http://127.0.0.1:13000/main pnpm dev
# Local: http://127.0.0.1:13399/main/ when 13399 is available.
# Replace /main with the remote application's actual mount path.
```

### Review your configuration

`pnpm nocobase config init` wrote `config.yml` from `config.example.yml`, with a generated `secrets.keys` key filled in. It gets you running on SQLite; adjust it for your situation:

- **Database.** SQLite needs no server and works as it is. Another one means installing its driver first — `pnpm add @nocobase/db-postgres`, and `pnpm remove @nocobase/db-sqlite` if nothing else uses SQLite — then `pnpm nocobase config init --dialect postgres --force` to rewrite the connection, and `pnpm nocobase config set` for its settings, with `--from-env` for the password so it stays out of the shell history. Which dialects the application can run on is decided by what it depends on, not by this file: a driver it does not have cannot be introduced from here.
- **Change a value** with `pnpm nocobase config set key=value`, which keeps the comments and refuses a section the application does not know. Values that differ per machine — `APP_SERVER_PORT`, `APP_SERVER_HOST`, `APP_PUBLIC_ORIGIN` — are better set in the environment, which is applied over this file; `config set` says when an environment variable overrides what it wrote.
- **Where the application is served.** `APP_BASE_PATH` is the public mount path, `/main` by default, so the development URL looks like `http://127.0.0.1:13000/main/`. `APP_SERVER_PORT` and `APP_SERVER_HOST` change what the server binds to.
- **Anything a feature you enable requires** — mail delivery, IM webhooks, storage. Every section is already here, commented out where it is optional.

`config.yml` is gitignored because it holds your `secrets.keys`. Deploy it through your secret management rather than committing it.

Keep the key: what was encrypted under it cannot be read without it. To rotate it, put a new key first in `secrets.keys` with a higher version and keep the old one after it, run `pnpm nocobase secrets rotate` (`pnpm nocobase secrets status` shows what is left to reseal), then remove the old key. Changing the current key signs everyone out.

To run against a production build instead:

```bash
pnpm build
pnpm start
```

## Project structure

```text
client/                  Browser application
├── routes.ts            Your page routes
├── pages/               Your page components
├── components/          Your components
│   └── ui/              shadcn/ui primitives
├── layouts/             App and Settings layouts
│   └── components/      Layout containers, navigation, branding and account controls
├── routing/             Route rendering, access checks, loading and error UI
├── locales/             Your translated strings
├── theme/               App-wide theme and light/dark selector
├── extensions/          Application-owned copies of plugin-published UI
├── plugins.ts           Which plugins the browser loads
├── react-providers.ts   Your React context providers
├── service-provider.ts  Your client startup logic
└── runtime.ts           Composition root tying the above together

server/                  API server
├── routes/              Your HTTP endpoints
├── providers/           Your services and their lifecycle
├── config/              Application configuration composition
├── plugins.ts           Which plugins the server loads
├── app.ts               Application assembly
├── runtime.ts           Composition root
├── standalone.ts        Node entry point
└── embedded.ts          Entry point when a host process mounts it

cli/                     Command line
├── plugins.ts           Which plugins contribute commands and build and dev hooks
└── commands/            Your own commands, under the app topic (created when needed)

database/
├── main/
│   ├── migrations/      Schema history for the main connection
│   └── seeds/           Initial example data
├── analytics/
│   ├── migrations/      Independent analytics schema
│   └── seeds/           Channel, campaign and daily metric examples
└── externalCrm/
    └── metadata/        <name>.json per Collection: the external CRM's hand-written metadata

tests/                   Unit and integration tests, run by Vitest
└── playwright/          Browser tests against a running application, run by Playwright
config.yml              Your configuration, written by pnpm nocobase config init; gitignored
config.example.yml       Documented configuration template
```

The three files named `runtime.ts`, `plugins.ts`, and `routes.ts` are composition roots: they list what the application is made of. Reading them tells you what is loaded and in what order.

## Scripts

`pnpm dev`, `pnpm build` and `pnpm start` are the application's scripts. Everything else is `pnpm nocobase <topic> <command>`, which pnpm resolves to the application's CLI without a script; `pnpm nocobase --help` lists them all.

### Everyday development

| Script             | What it does                                                                         |
| ------------------ | ------------------------------------------------------------------------------------ |
| `pnpm dev`         | Start the API server and client with hot reload                                      |
| `pnpm build`       | Build the client and server into `dist/`                                             |
| `pnpm start`       | Run the built server; requires `pnpm build` first                                    |
| `pnpm build --tar` | Build, then pack `dist/` and `config.example.yml` into `storage/exports/dist.tar.gz` |

### Database

| Command                              | What it does                                                                                                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm nocobase db apply`             | Apply pending migrations from your `database/main/migrations/` and from every registered plugin, then pending seeds from `database/main/seeds/` and from those plugins                              |
| `pnpm nocobase db reset`             | Destructive: drop every managed schema object, then rerun all migrations and seeds from empty; asks first, and needs `--force` in CI                                                                |
| `pnpm nocobase db repair`            | Realign recorded migration and seed checksums with the current sources; `--dry-run` reports without writing                                                                                         |
| `pnpm nocobase collections generate` | Write `collection.json`, `metadata.json` and `schema.json` for every Collection under `database/<connection>/collections/`, plus a `_manifest.json`; `--check` fails when the files are out of date |

Migrations and seeds also run automatically on startup while `database.connections.main.migrations.autoRun` is `true` in `config.yml`. Run `pnpm nocobase db apply` explicitly when you want to apply a change without restarting. Both halves run only what is pending, so running it on an already-migrated database applies seeds alone.

Database tasks support `--connection <name>` and `--all`; no argument targets `database.default`. Per-connection source and upgrade rules are documented in [migrations and seeds](.agents/skills/nocobase-app-development/references/migrations.md).

### Analytics database example

The application supplies an independent managed `analytics` SQLite connection,
stored at `storage/analytics.sqlite` when running standalone. Its defaults are
loaded before `config.yml`, so existing and generated main-only configurations
work, and explicit file settings can override the connection. `main` remains the
system database. This demonstration belongs only to Examples.

Migrations and seeds run automatically on startup. To initialize only analytics
from this application directory:

```bash
pnpm nocobase db apply --connection analytics
```

| Collection     | Initial records | Purpose                                                        |
| -------------- | --------------- | -------------------------------------------------------------- |
| `channels`     | 3               | Search, social and email channels; unique channel code         |
| `campaigns`    | 4               | Channel-linked campaigns in draft, active and completed states |
| `dailyMetrics` | 12              | One row per campaign and date for September 6–8, 2026          |

Channels have many campaigns; campaigns have many daily metrics. Each campaign
and date pair is unique. Deleting a campaign cascades to its metrics; deleting a
channel with campaigns is rejected. Budgets, spend and revenue are integer cents.
The draft campaign has zero metrics to demonstrate the distinction between zero
and absent data. Seeds use stable IDs and a transaction; normal reruns preserve
edits and deletions, and explicit replays insert only missing identities.

`server/routes/analytics.ts` exposes the following through
`defineRepositoryApiRoutes`, each explicitly bound to `analytics`:

| Repository API name     | Collection     |
| ----------------------- | -------------- |
| `analyticsChannels`     | `channels`     |
| `analyticsCampaigns`    | `campaigns`    |
| `analyticsDailyMetrics` | `dailyMetrics` |

Each supports `findMany` (maximum 100), `findOne`, `count`, `exists`, `aggregate`,
`groupBy`, `createOne`, `updateOne`, and `deleteOne`. Like the Repository example
plugin, all signed-in users can manage the sample records. Server write policies
allow only declared fields; use `channel.connect` and `campaign.connect` for
relations. IDs are accepted on creation but cannot be changed through updates.

Requests use `POST <app-base>/api/<repository>/<action>`, for example
`POST /main/api/analyticsDailyMetrics/groupBy` with this JSON body:

```json
{
  "by": ["campaignId"],
  "aggregate": {
    "kind": "aggregate",
    "version": 1,
    "items": [
      { "kind": "count", "alias": "days" },
      { "kind": "sum", "field": "spendCents", "alias": "spendCents" },
      { "kind": "sum", "field": "revenueCents", "alias": "revenueCents" }
    ]
  }
}
```

The response is wrapped in `{ "data": ... }`. Use the application's authenticated
API client, for example `api.repository('analyticsChannels').findMany({ limit: 10 })`.

### External database example

Not every database an application reads is one it owns. The `externalCrm`
connection in `server/config/database.ts` shows the shape of one that is not:
`schemaManagement: 'external'` tells NocoBase to read the schema and never
change it, and `naming` strips the CRM's `crm_` table prefix when mapping
tables to logical Collection names. No migrations or seeds run against it, and
the Builder refuses DDL on it.

What the schema cannot say — titles, descriptions, and which column is a relation — comes from `database/externalCrm/metadata/<name>.json`, one metadata document per Collection, written by hand and committed. That is the default metadata source for an external connection, so nothing has to be configured; `metadataStore` can point at another directory in the same layout when metadata is kept elsewhere. Nothing generates or rewrites these files. Run `pnpm nocobase collections generate --connection externalCrm` afterwards to refresh the gitignored cache under `database/externalCrm/collections/`; a document whose table has gone is reported as unused metadata rather than deleted.

The connection points at `storage/external-crm.sqlite` so the example runs
without a real CRM. `server/providers/external-crm.ts` plays the part of the
foreign system: when the connection is the SQLite stand-in and the tables are
missing, it creates `crm_customers` and `crm_orders` with the raw client and
inserts three customers and four orders. Point the connection at an actual
database in `config.yml` and the provider does nothing.

Open **External CRM** from the homepage or navigation (`/external-crm`). The
page in `client/pages/external-crm.tsx` lists the CRM's orders with their
customers, filtered by status, entirely through the read-only routes below; it
addresses everything by logical name and never sees the `crm_` table prefix.

`server/routes/external-crm.ts` exposes the two Collections read-only through
`defineRepositoryApiRoutes`, bound to `externalCrm`:

| Repository API name | Collection  |
| ------------------- | ----------- |
| `crmCustomers`      | `customers` |
| `crmOrders`         | `orders`    |

Each supports `findMany` (maximum 100), `findOne`, `count`, `exists`,
`aggregate` and `groupBy` for signed-in users; write actions are not exposed.
Logical names work as they do for managed tables — filter on `status`, sort by
`id`, select `orderNo` and include the `customer` relation — because the
Repository resolves them through the connection's naming and metadata. For
example, `POST /main/api/crmOrders/findMany` with:

```json
{
  "filter": { "status": "paid" },
  "sort": {
    "kind": "sort",
    "version": 1,
    "items": [{ "kind": "field", "path": ["id"], "direction": "asc" }]
  },
  "select": {
    "kind": "select",
    "version": 1,
    "root": {
      "kind": "selection",
      "fields": ["id", "orderNo", "totalAmount"],
      "includes": [
        {
          "kind": "include",
          "relation": "customer",
          "select": { "kind": "selection", "fields": ["id", "displayName"] }
        }
      ]
    }
  }
}
```

`pnpm nocobase collections generate --connection externalCrm` writes `collection.json`, `metadata.json` and `schema.json` per Collection under `database/externalCrm/collections/`, as it does for a managed connection; the manifest records `schemaManagement: external` and no migration head, since the CRM has no migration history this application knows about. That directory is a gitignored cache; only `database/externalCrm/metadata/` is committed.

### Checks

| Script               | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `pnpm test`          | Run the test suite once                                      |
| `pnpm test:watch`    | Re-run tests as files change                                 |
| `pnpm test:coverage` | Run tests and write a coverage report                        |
| `pnpm typecheck`     | Typecheck the client, tooling, and server                    |
| `pnpm lint`          | Report lint problems                                         |
| `pnpm fix`           | Fix lint problems, then format                               |
| `pnpm check`         | Everything above plus a build; what to run before committing |

`pnpm nocobase locales check` reports a language declared in `client/locales/` but not `server/locales/`, or the reverse, and exits nonzero until the lists align. The browser builds its language picker from the client list, so a client-only language still works in the interface; server messages fall back to English and the language control explains that fallback. Add the matching server locale when server-produced text should use the same language.

### Plugins

Plugins add features to your application. Let these commands edit `package.json`, `client/plugins.ts`, and `server/plugins.ts` for you rather than editing those files by hand.

| Command                                  | What it does                                                |
| ---------------------------------------- | ----------------------------------------------------------- |
| `pnpm nocobase plugin register <name>`   | Install a plugin and wire it into the client and server     |
| `pnpm nocobase plugin unregister <name>` | Remove a plugin and its wiring                              |
| `pnpm nocobase plugin update [name]`     | Upgrade one or all registered plugins and re-sync skills    |
| `pnpm nocobase plugin inspect <name>`    | Report a plugin's registration state; read-only             |
| `pnpm nocobase package remove <name>`    | Remove a direct NocoBase package and its synchronized Skill |
| `pnpm nocobase skills sync`              | Sync direct NocoBase package Skills into `.agents/skills/`  |

`pnpm install` automatically runs `pnpm nocobase skills sync` through the application's `postinstall` hook. Run `pnpm nocobase skills sync` manually when install scripts were disabled or Skills need refreshing.

Use a full package name, as with `plugin register` and `plugin unregister`; short names such as `authentication` also work. The optional name is a positional argument, not `--plugin`.

```bash
pnpm nocobase plugin update @nocobase/app-plugin-authentication  # Update one registered plugin
pnpm nocobase plugin update authentication                      # Equivalent short name
pnpm nocobase plugin update                                     # Update all registered plugins
pnpm nocobase plugin update @nocobase/app-plugin-authentication --dry-run  # Preview only
```

Without a name, the command collects registered plugins from `client/plugins.ts`, `server/plugins.ts`, and `cli/plugins.ts`. It uses the application's package manager; with pnpm, `update` follows the declared version ranges without `--latest`. An unregistered name is rejected, and an application with no registered plugins is left unchanged. After a successful package update, all registered plugins' agent skills are re-synchronized, even when only one package was selected.

Ordering in `client/plugins.ts` and `server/plugins.ts` is contribution order, and a plugin is enabled by appearing in the array. Reorder entries or pass a plugin its options by hand; leave adding and removing entries to the commands.

### Removing a NocoBase package

Before removing a direct `@nocobase/*` dependency, search the application's imports, plugin registrations, routes, services, configuration keys, tests, and build scripts for references to it. Migrate or remove those references first. The removal command updates package metadata and synchronized Skills; it does not rewrite application source or configuration and cannot decide whether the capability is still required.

```bash
pnpm nocobase package remove @nocobase/example
pnpm nocobase package remove @nocobase/example --dry-run
pnpm nocobase package remove @nocobase/example --json
```

For an ordinary package, the command uses the application's package manager to remove the dependency and update both `package.json` and the lockfile, then removes only the Skill directories recorded as owned by that package. For an `@nocobase/app-plugin-*` package, it reuses the `plugin unregister` workflow so Client, Server, and CLI registrations are removed together with the dependency and its Skills. `pnpm nocobase plugin unregister <name>` remains available when the task is specifically expressed as unregistering a plugin.

After an interrupted or manual removal, make sure the manifest no longer declares the package and run a full `pnpm nocobase skills sync` to reconcile stale package-owned output. Passing a package already absent from the manifest to `package remove` can clean its recorded historical Skill ownership without uninstalling any other package.

### Diagnostics

| Command                       | What it does                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm nocobase dist retarget` | Replace native binaries with the target platform's; part of `pnpm build`                    |
| `pnpm nocobase dist check`    | Check that everything your server and CLI import reaches a deployment; part of `pnpm build` |

#### Deploying to a different machine

`pnpm build` produces `dist/`, which is the whole deployment: copy it to a server and run it. The build already ran `pnpm install --prod` inside `dist/`, so the tree ships with its `node_modules` and needs no install step on the server. It also keeps its own `package.json`, so `pnpm install --prod` run inside `dist/` on the server reinstalls exactly the same set: useful when `node_modules` was left out of a copy, never required after a normal build.

Client packages are not among them. Plugins declare what their browser code needs as peer dependencies, so your application installs one shared copy for its Vite build, while `dist/` opts out of peer installation entirely — `lucide-react`, `@base-ui/react` and the rest never reach a server that has no browser in it.

**The build targets the machine you run it on**, so `pnpm build && pnpm start` works. Deploying elsewhere means saying where:

```bash
pnpm build --help                                 # all build options
pnpm build                                        # this machine
pnpm build --target linux-x64                     # most Linux servers
pnpm build --target linux-arm64                   # ARM servers, Graviton
pnpm build --target linux-x64-musl                # Alpine, and most slim container images
pnpm build --target linux-x64 --node-version 24   # explicitly target Node 24
```

A `.node` binary is compiled for one platform, architecture, C library, and Node version at once, so a build made on a Mac installs binaries a Linux server cannot load. `--target` sets platform, architecture, and C library together, because they are chosen together: `linux-x64` and `linux-x64-musl` are different binaries, and Alpine needs the musl one. If you are unsure, `ldd --version` on the server prints `musl` for musl and `GNU libc` otherwise.

`--node-version` takes the major version your server runs, separately, because the same Linux host may run any of several. The binary retargeter knows ABI mappings for 20, 22, 24, and 26; the application itself requires Node >=24.

`pnpm build --help` (or `-h`) lists build options and exits without loading build dependencies, running hooks, or modifying `dist/`. Every successful build records `nocobase.buildTarget` in `dist/package.json`, including builds with no native modules: `platform`, `arch`, `libc`, `nodeMajor`, and `nodeAbi`. Use `libc` only for Linux; its value on other platforms is a compatibility placeholder. Deployment checks should compare these fields with the host runtime and also respect `engines.node`. With `--target current` (the default), the Node version and ABI come from the running process; an explicit platform target defaults to Node 24 unless `--node-version` is supplied.

For example, `pnpm build --target linux-x64 --node-version 24` produces:

```json
{
  "nocobase": {
    "buildTarget": {
      "platform": "linux",
      "arch": "x64",
      "libc": "glibc",
      "nodeMajor": 24,
      "nodeAbi": 137
    }
  }
}
```

`nodeMajor` describes the target runtime, not the Node version used to run the build. No target patch version is implied. These fields provide platform and Node ABI checks for Hub deployment; they do not describe system libraries, CPU instruction requirements, or other runtime prerequisites.

If your application has no native modules — `pg`, `mysql2`, and `tedious` are all plain JavaScript — no platform-specific binaries need retargeting. The build still records the selected target, and the deployment runtime must satisfy `engines.node`.

#### Packing the build

`pnpm build --tar` writes `storage/exports/dist.tar.gz`, the artifact you upload to a Hub to deploy this application.

The archive has two levels: `config.example.yml` and `dist/` sit at the root, and the build is inside `dist/`. What `dist/` holds varies with the application; this is the shape:

```text
dist.tar.gz
├── config.example.yml
└── dist/
    ├── cli/
    ├── client/
    ├── node_modules/
    ├── server/
    ├── package.json
    └── pnpm-workspace.yaml
```

Combine it with `--target` when the archive is for another machine:

```bash
pnpm build --target linux-x64 --tar
```

#### Building a Docker image

`Dockerfile` builds this application from its sources into a production image. From the project root:

```bash
docker build -t my-app .
```

The build runs `pnpm build` inside the container, and the image holds only `dist/` and `config.example.yml`. `Dockerfile.dockerignore` keeps `config.yml`, `.env`, `storage/`, and `node_modules` out of the build context; keep the two files together. Settings in `.env` do not reach the image, so pass them to the container as environment variables.

The client is not tied to a mount path, so choose it when starting the container, `-e APP_BASE_PATH=/crm`; the image defaults to `/main`. The build runs on the builder's own architecture and cross-targets native modules, so `docker buildx build --platform linux/amd64,linux/arm64` compiles nothing under emulation.

To package a `dist/` you have already built instead, build it for the image's platform and pass `DIST=prebuilt`. Nothing is installed or compiled in the image, and it works in any directory that holds the build:

```bash
pnpm build --target linux-x64
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app .
```

`--target` and `--platform` must name the same architecture: Docker otherwise builds for the machine it runs on, which on Apple silicon is `linux/arm64`. The image build fails unless `dist/` was built for `linux` with glibc, the image's architecture, and Node 24, and unless it records `nocobase.relocatable`, which an `@nocobase/app-cli` from before relocatable builds does not. `dist/.env`, which `pnpm build` fills from your local `.env` files, is never copied in. One `dist/` covers one architecture, so a multi-platform image has to be built from source.

Run it with the configuration and data mounted, never copied in:

```bash
docker run -d --init -p 13000:13000 \
  -v ./config.yml:/app/config.yml:ro \
  -v ./storage:/app/storage \
  my-app
```

The image runs as the `node` user without pnpm, so `storage/` must be writable by UID 1000, and application commands run through `node dist/cli/index.js`, as in `docker run --rm -v ./config.yml:/app/config.yml:ro my-app node dist/cli/index.js config check`.

#### Adding a dependency

Where a package goes depends on which half of your application imports it.

| Imported from                     | Declare it in     |
| --------------------------------- | ----------------- |
| `server/`, `database/`, or `cli/` | `dependencies`    |
| `client/`, build tooling, tests   | `devDependencies` |

`dist/package.json` is generated from `dependencies` and is what a server installs, so a package in `devDependencies` is missing there however well it works locally. Client packages need nothing at runtime — Vite resolves and inlines them into `dist/client` while building.

Plugins' browser packages need nothing from you: a plugin declares those as peer dependencies, so installing the plugin brings one shared copy into your application, and `dist/` never installs them.

`pnpm build` verifies the server half and fails the build if something is missing, naming the package. One case it cannot check is an import whose name is assembled while the program runs:

```ts
await import(`${name}/index.js`);
```

Nothing can tell in advance which package that names, so declare it in `dependencies` when you write the code.

#### When the build or the deployment goes wrong

**`Cannot find module` on the server, but it runs locally.** The package is in `devDependencies`, which `dist/package.json` is not generated from. Move it to `dependencies` and rebuild.

**A browser package fails to resolve while building your application.** A plugin declares it as a peer dependency and something has to provide it. Add it to your `devDependencies`.

**`Error loading shared library`, `invalid ELF header`, or a bare reference to a `.node` file at startup.** The binary does not match the server. Compare what the build targeted against the server:

```bash
node -e "console.log(require('./dist/package.json').nocobase.buildTarget)"
node -p "process.platform + '-' + process.arch"   # on the server
node -p "process.versions.modules"                # on the server: the ABI
```

Rebuild with a matching `--target` and `--node-version`. ABI 115 is Node 20, 127 is Node 22, 137 is Node 24, 147 is Node 26.

**`no prebuilt binary for <target>` during the build.** The package publishes no build for that combination. Check whether the version you depend on supports the target, and whether a musl build exists if you asked for one — musl coverage is thinner than glibc.

## Configuration

`server/config/` and `client/config/` contain editable TypeScript defaults. `config.yml` holds environment-specific overrides, written by `pnpm nocobase config init` and yours to edit from there. It is gitignored because it carries your `secrets.keys`; deploy it through your secret management rather than committing it. It is generated from `config.example.yml`, which is kept beside it as the reference for every option.

Two settings decide where the application is reachable:

- `APP_BASE_PATH` is the public path the application is mounted at, `/main` by default. The browser API base URL is derived from it as `<APP_BASE_PATH>/api`.
- `APP_PUBLIC_ORIGIN` is the external origin used to build callback and redirect URLs. Set it in production. It must not repeat the base path — the runtime joins the two.

An environment variable a section declares takes precedence over the file, and the file over the code defaults. `pnpm nocobase config env` lists the variables and whether each is set; `pnpm nocobase config variables` describes each one — what it sets, whether it is a secret, whether a deployment must supply it — and `pnpm build` writes that description to `dist/variables.json`. `DB_*` set the main database connection, `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` the first administrator, and `APP_SAMPLE_DATA=true` loads the sample data when the database is first installed. `${NAME}` in `config.yml` is not expanded.

## Testing

Tests live in `tests/`, never beside the source they cover. Put logic and integration tests under `tests/logic/` and component tests under `tests/components/`. Browser tests belong in `tests/playwright/`, which Vitest skips. Playwright does not start the application: start it first (`pnpm dev`, or `pnpm build` and then the built application), then run `pnpm test:e2e`; each test reads the application URL, including its base path, from `APP_URL`. Tests that only need a real server, real authentication, or a real database run under Vitest with `createAppTest()` from `@nocobase/app-testing/server`.

### Notification testing

After signing in with the `notification:test` `send` permission, use the notification logs settings page to send a real message through the durable Notification Manager. Examples enables the built-in database-backed In-app channel by default. Choose In-app in **Send test notification**, enter a title and message, and leave the recipient user ID blank to send to yourself, or specify another user's ID. Read the message in the **Inbox** (`/inbox`), which the header's inbox button opens. An explicit `notification.channels` setting in `config.yml` overrides the defaults; include the In-app channel there if you configure other channels.

The form is generated from safe Channel test metadata; Email tests require an address and IM tests use the configured logical target. The button remains visible so configuration problems are discoverable. The server enforces the `notification:test` `send` permission only when the message is submitted.

## API documentation

The application documents every `/api` endpoint it serves — its own routes, every registered plugin's, the data endpoints and Better Auth's sign-in endpoints — in an OpenAPI 3.1 document:

- Swagger UI: `<origin><APP_BASE_PATH>/api/swagger/docs`, such as `http://127.0.0.1:13000/main/api/swagger/docs`
- JSON: `<origin><APP_BASE_PATH>/api/swagger`

Only a signed-in user or an API key may read them; anyone else gets `401`. Open the Swagger UI in a browser where you are signed in, or, from a script, send an API key created at `<APP_BASE_PATH>/settings/api-keys` in the `x-api-key` header. Swagger UI's **Authorize** button takes a key too and keeps it across reloads.

```bash
curl -H "x-api-key: <key>" http://127.0.0.1:13000/main/api/swagger
```

Replace `/main` with the application's `APP_BASE_PATH`. An application without the authentication plugin registers no way to tell who is asking, so it does not serve the documentation at all and both URLs answer `404`. There is no setting that makes it public.

## Working with an AI agent

`AGENTS.md` describes how to build features here, and `.agents/skills/` contains package-owned guidance generated by `pnpm nocobase skills sync`. Give an agent an API key when it needs to call the application: it learns the available endpoints from the API document above rather than from route sources. If you use Claude Code, `CLAUDE.md` points at the same guidance. Keep application-specific rules in committed `AGENTS.md` files because synchronization replaces package-owned Skill directories.

## License

MIT

## Workflow examples

Open **Workflow examples** on the homepage, or **Settings → Automation → Workflows**. The three application-owned packages under `workflows/` are built by `pnpm dev` and `pnpm build`. Enable a definition, open its detail page, choose **Run**, and enter the sample values below. Inspect the run diagram and select a node to see its output, errors, and logs.

| Workflow                        | Sample input                                    | Expected result                                                                    |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Example: Quotation routing      | `quotationId: Q-100`, `amountCents: 50000`      | Standard branch, then a review task; the shared summary runs after submission.     |
| Example: Quotation routing      | `quotationId: Q-100`, `amountCents: 150000`     | Manual follow-up classification, then a review task.                               |
| Example: Analytics daily report | `date: 2026-09-08`                              | Read four seeded metric rows, calculate totals, and save one report for that date. |
| Example: Analytics daily report | `date: 2000-01-01`                              | Successful early termination without creating a report.                            |
| Example: Failure diagnostics    | `reference: DIAG-100`, `simulateFailure: true`  | The execute node fails deliberately; the finish node does not run.                 |
| Example: Failure diagnostics    | `reference: DIAG-100`, `simulateFailure: false` | A new run completes all three steps.                                               |

Quotation routing exposes an administrator parameter, `reviewThresholdCents`, whose default is `100000`. Amounts at or above the threshold take the follow-up branch. Each run creates one `quotationReviewTasks` row in the application's default database. The diagnostic example has no business writes.

To test the quotation wait, run either sample input and inspect the pending `awaitRoutingConfirmation` node. Then open **Workflow → Waiting tasks** in the application menu, select the new task, choose Approved or Rejected, optionally add a comment, and submit. The task page sends the signed-in reviewer identity with the result through the application's authenticated API. The task detail polls the persisted resume request until the decision is applied or rejected, and offers Refresh to check again. A recorded decision is not yet applied: rejected requests display their reason. The summary node reads `nodeResults.awaitRoutingConfirmation`, including `taskId`, `reviewerId`, `confirmedBy`, `decision`, and `comment`; refresh the workflow run detail to inspect this downstream result. Applied means the wait consumed the decision, not that the whole workflow succeeded. Historical submissions without a request id show that their outcome is unavailable. A task created before its Wait node becomes ready cannot be submitted until that node is pending; a run that has ended leaves the task visible but unavailable.

The report reads `analytics.dailyMetrics` and upserts `exampleDailyReports` in the application's default database by its unique date. With unchanged seed data, `2026-09-08` produces 96,000 impressions, 3,120 clicks, 168 conversions, 93,000 spend cents, 672,000 revenue cents, and 579,000 profit cents. The `saveReport` node output contains the saved report. Repeating the workflow refreshes that date's report instead of inserting duplicates. Reading analytics and writing the report are separate operations, not a cross-database transaction.

After editing a package, check it and regenerate development artifacts, then enable the new revision in the management UI:

```bash
pnpm nocobase workflow check workflows/example-quotation-routing
pnpm nocobase workflow check workflows/example-analytics-report
pnpm nocobase workflow check workflows/example-failure-diagnostics
pnpm nocobase workflow build
```

When deploying, keep the workflow artifact disk under the application directory, which is the default local storage layout. The report's run modules import `@nocobase/db` and resolve it from the application's `node_modules`, which an artifact directory outside the application tree cannot reach.

These examples run on demonstration data only. How the workflow plugin versions, enables, and triggers packages, including the `workflowServiceToken.trigger()` contract, is documented in its Skill at `.agents/skills/nocobase-app-plugin-workflow/`; read it before invoking a workflow from application code. A business endpoint that triggers a workflow supplies its own authentication, authorization, and input validation.

## 数字类型示例

首页的“数字类型”卡片和侧栏入口打开 `/numeric-examples`。页面调用当前默认数据库的
`GET /api/numericExamples`，可切换 Query / Repository 和全部样本、空值样本、空结果。
接口仅供已登录用户读取共享示例数据，不开放写入或任意 SQL。

`database/main/migrations/202609100002_create_numeric_examples.ts` 创建
`numericExamples`，声明 `increments` ID、唯一的样本名称以及 INTEGER、BIGINT、
DECIMAL(30,6)、FLOAT、DOUBLE 字段。
`database/main/seeds/202609100002_seed_numeric_examples.ts` 使用 Query insertInto
插入七组固定样本：小整数、负数、零、相邻的大整数、小数和空值。
BIGINT 使用字符串 `9007199254740992` / `9007199254740993`，不会先转成 JavaScript number。
重复执行种子不会覆盖已编辑的同名样本；初始化数据是 Examples 模板的教学内容。

应用启动时按现有配置执行迁移与种子。关闭自动执行时，在模板目录运行：

```sh
pnpm nocobase db apply
```

页面使用带引号的 JSON 值和实际 JavaScript 类型标签展示普通读取，并支持按 increments、INTEGER、BIGINT、DECIMAL、FLOAT 或 DOUBLE 升序 / 降序排序，以及查看各字段的 COUNT、SUM、AVG、MIN、MAX。DECIMAL 保留数据库格式；SQLite 的底层存储精度限制、
浮点舍入和 increments 的数据库差异均保持可见，不在页面中做 Number() 转换或补零。
空值样本的 ID 非空，所以 COUNT(id) 为 1；其他数字字段 COUNT 为 0。

后端实现位于 `server/providers/numeric-examples-service.ts` 和
`server/routes/numeric-examples.ts`，页面位于 `client/pages/numeric-examples.tsx`。
这是 Examples 独有内容，不改变 Default / Hub 模板或数据库运行时。

## Numeric types example

Open **Numeric types** from the homepage or navigation (`/numeric-examples`).
The page reads the current default database through the authenticated, read-only
`GET /api/numericExamples` endpoint. Switch between Query and Repository, or
select all samples, the null sample, and empty input. Tables show actual JSON
values and JavaScript types, plus COUNT(field), SUM, AVG, MIN and MAX.

The application owns `numericExamples`: an `increments` ID, a unique sample key,
and INTEGER, BIGINT, DECIMAL(30,6), FLOAT and DOUBLE fields. The migration is
`database/main/migrations/202609100002_create_numeric_examples.ts`; initial data
lives in `database/main/seeds/202609100002_seed_numeric_examples.ts`. Run
`pnpm nocobase db apply` when automatic startup tasks are disabled. Seeds insert missing
sample keys and preserve existing records on repeat runs.

Seven fixed samples include 42, negatives, zero, the adjacent BIGINT values
9007199254740992 and 9007199254740993, fractions and nulls. Exact inputs use
strings; the page never converts BIGINT or DECIMAL to Number. Decimal formatting
and native floating arithmetic may differ by database. SQLite still has numeric
storage precision limits, and increments uses each database's physical ID type.
Every signed-in user may read these sample records; the endpoint exposes no
writes or arbitrary collection/query parameters. Row previews are capped at 100;
aggregates cover the entire selected sample set.

This is Examples-only teaching content, so it does not change Default or Hub.

## Runtime paths and application creation

`runtime.paths`, configuration context `paths`, and `app.paths` share one resolved `AppPaths` object. Use `paths.storage('...')`, `paths.database('...')`, or the corresponding directory fields. `AppPathOptions` is input only; application path policies run before the final object is created and configuration is loaded. Standalone entries declare the deployment root in `server/runtime.ts` so the server and CLI share persistent storage outside the compiled code directory. That storage is `storage/` under the deployment root unless `APP_STORAGE_DIR` names another directory, absolute or relative to the deployment root; set it when the deployment root itself is replaced on every release, as an installer that keeps one directory per release does.

`server/app.ts` calls `createAppFromRuntime(runtime)` to transfer configuration, paths, mode and Host logging policy and bind `runtime.app`. Keep Provider, middleware and route registration explicit and ordered; `startApplicationInScope` owns startup and shutdown binding.

## Strict startup verification

Set `NOCOBASE_STRICT_STARTUP=true` when running `pnpm dev` or `pnpm start` in automated verification. Startup failures, including job import failures, exit nonzero after resource cleanup. Strict dev runs the server without watch mode so a failed server cannot remain hidden behind a watcher; restart the command after server or configuration changes. Client HMR remains available. Omit the variable or set it to `false` for normal development with server hot reload. Request errors and individual job execution failures do not terminate the application.
