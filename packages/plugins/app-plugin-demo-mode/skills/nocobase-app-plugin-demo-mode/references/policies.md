# Data operations and write policies

Use the built-in management page for normal operation. The API details below are for custom integration; add the application's base path to each URL.

## Data operations

`GET /api/demoMode/data` requires `settings:demoMode.data/read`. POST `/import`, `/clear` and `/reset` under that path require both `read` and `manage`. Demo Mode must be enabled. Import runs the registered generator, not an uploaded file; import/reset accept `{ language?: string }`. Poll status until generation/reset finishes before reporting success.

Register the CLI export to use `pnpm nocobase demo-mode data <status|import|clear|reset>`. Import and clear require `--actor <existing-admin-id>`; reset can reuse the previous importing actor and language. Use `--language` to choose a supported language. Mutations require `--force`; `--dry-run` prints the requested operation without starting the app, so it does not validate the target or dataset.

Clear/reset run the application's full business cleanup, including visitor additions. See [cleanup and recovery](adapting-data.md#business-cleanup) if an operation fails.

## Write protection

`GET /api/demoMode/status` returns `{ data: { enabled: boolean } }` without a session. Server integrations resolve the original `demoModeServiceToken` from `@nocobase/app-plugin-demo-mode/server/tokens` to read `enabled`.

The guard observes SQL through `@nocobase/db` in an HTTP request context. It does not replace authentication, operation permissions or record scopes, or intercept files, outbound calls and background work. Treat jobs, queue messages and schedule firings as unguarded, including work a visitor's action triggers: Redis workers never see the request, and in-process adapters stop being refused once the request that enqueued them has ended. Writes made after a route handler returns are unguarded as well: a streamed response body, such as server-sent events from Agents chat and the tool calls and message persistence it runs, and messages on an upgraded WebSocket. Adapt those [external boundaries and jobs](integration-checklist.md) in the application.

A refused request returns 400 with `error.reason: DEMO_READ_ONLY`. Branch on the reason, not its translated message. If a page encounters a refusal, identify the required business write before granting an exception.

## Collection write exceptions

Use logical collection names matching migrations, such as `orderItems`. An exception allows INSERT, UPDATE and DELETE together on that collection's own table in the default database connection. A write that also changes related rows, such as a many-to-many through collection, needs each of those collections too; the refusal log `Demo mode refused a write` names the tables. Keep operation and record restrictions in normal application authorization.

The management page provides a collection selector. For a custom UI, GET `/api/demoMode/configuration/collections` returns selectable `{ name, title? }` entries. Preserve saved selections absent from the catalog so administrators can remove them. Unknown, malformed or duplicate names are rejected.

Deployment defaults come from `demoMode.allowCollections`, overridden by `NOCOBASE_DEMO_WRITABLE_COLLECTIONS=orderItems,userPreferences`. Restart after changing deployment configuration. These `fixedCollections` combine with runtime selections and cannot be removed through the selector.

## Custom configuration clients

Resolve the original `demoConfigurationToken` from `@nocobase/app-plugin-demo-mode/server/tokens` for application Server integration. Built-in UI components handle permissions and revisions; custom clients must do the same.

GET `/api/demoMode/configuration` requires `settings:demoMode.configuration/read`. PUT `/collections`, `/mocks`, `/chat` and `/schedule` under that path require both `read` and `configure`, with `{ expectedRevision, value }`. For collections, `value` is the logical-name array. Read the current revision from the returned `data` object and wait for active data operations before saving. On 409 `DEMO_CONFIGURATION_CONFLICT`, re-fetch and review changes before retrying.

## Daily reset

Daily reset runs on the application's jobs service (`JobExecutorServiceProvider`, composed by generated applications) and is enabled automatically after the first generation. Use the defaults and preserve saved administrator choices. Without the jobs service, no automatic reset runs.

Only adjust or disable it when requested, using the management page. A custom API client reads the current configuration and saves the complete schedule as `{ expectedRevision: current.revision, value: { ...current.schedule, ...changes } }`. Register the dataset first if `schedule` is null.

Use this integration instead of adding a second timer or cron. Automatic reset uses the same business cleanup as manual reset. A failed reset appears in the management page's data status and the `demo-mode` log; resolve it before retrying.
