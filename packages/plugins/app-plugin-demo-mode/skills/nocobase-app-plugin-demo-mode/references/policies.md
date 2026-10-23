# Write policies, mocks and daily resets

## Public surfaces

- `GET /api/demoMode/status` answers `{ data: { enabled: boolean } }` without a session.
- A refused request answers `400` with `error.status: FAILED_PRECONDITION`, `error.reason: DEMO_READ_ONLY`, `error.domain: demoMode` and a translated `error.localizedMessage`, and carries the `Server-Timing: demo-read-only` metric. A route that swallows the refusal and succeeds keeps its answer without the metric. Branch on `reason`, never on the message.
- `demoModeServiceToken` from `@nocobase/app-plugin-demo-mode/server/tokens` exposes `enabled` and `allowCollections` to other Server plugins, for example to skip an outbound call in a demo.

## Request guard boundaries

The guard observes SQL executed through `@nocobase/db` in an HTTP request context. It does not replace authentication, operation permissions or record scopes, and does not intercept file writes, outbound calls or independent background work. Check those boundaries before an effect occurs, using the server-side Demo Mode flag.

SQL classification is not database-level read-only enforcement. The current implementation treats all `EXPLAIN` and `PRAGMA` statements as reads, including forms with side effects. Do not rely on it to make raw SQL execution safe. Verify the statements and database-side effects the application uses on its actual dialect; prevent unsupported mutations at their authorized business entry point. A passing ordinary INSERT test does not establish protection for every SQL form.

## Configuration and revisions

`GET /api/demoMode/configuration` needs `settings:demoMode.configuration/read`; PUT `/collections`, `/mocks`, `/chat` and `/schedule` under that path need both `read` and `configure`. Bodies contain `expectedRevision` and `value`; a stale revision returns 409 `DEMO_CONFIGURATION_CONFLICT`. Re-fetch and review the new values before retrying; never silently overwrite drafts. Wait for a running data operation to finish before saving.

The enabled environment is checked on the server and data lifecycle, including CLI. Hide disabled environments and unauthorized cards in the application UI. The plugin exports browser-safe view types and `nextDemoReset` from `client/demo-configuration`. Application Server providers resolve the original `demoConfigurationToken` from `server/tokens` for the same policy service; do not recreate its token.

## Decide the reset schedule before generation

When the host already registers Scheduler, enabling Demo Mode also registers `demoMode.dailyReset`. Until a schedule is saved, the policy defaults to `{ enabled: true, hour: 3, minute: 0 }` in the dataset's language and time zone. Automatic resets become eligible after the first generation establishes the importer. Omitting AI or the schedule settings card does not turn them off. Without Scheduler registration, no automatic reset runs, even if the configuration preview shows a next run.

For a new demo that does not need recurring resets, save a disabled schedule after registering the dataset and before generating. Preserve an established deployment's administrator-selected policy unless the requested change includes it. Keep the host's Scheduler registration when other features use it.

1. Read `GET /api/demoMode/configuration`. After dataset registration, `schedule` supplies `enabled`, `hour`, `minute`, `timezone` and `language`.
2. To disable resets, PUT `/api/demoMode/configuration/schedule` with `{ expectedRevision: current.revision, value: { ...current.schedule, enabled: false } }`. Here `current` is the returned `data` object. Supply the complete schedule, not just `{ enabled: false }`. If `schedule` is null, finish dataset registration before configuring its language and time zone.
3. Read back and verify `schedule.enabled === false` and `nextRun === null`. For an enabled schedule, verify its local time, IANA time zone, language, deletion scope and `nextRun` before the first generation. Record that decision in the delivery notes.

Scheduler checks the persisted policy every minute independently of HTTP traffic; `nextRun` is a management preview, not a trigger. Use `nextDemoReset` only for draft previews. Do not add an application timer or deployment cron. View occurrence failures through Scheduler.

The durable day claim runs at most once per local date. Missed minutes and nonexistent DST times are skipped; repeated DST times execute only at their first occurrence. A claimed reset that fails is not automatically retried that day: inspect the failure and follow [cleanup and recovery](adapting-data.md#coordinate-cleanup-and-recovery). Daily reset uses the same destructive business cleanup as a manual reset.

## Collection write exceptions

Use logical names such as `orderItems`, matching migrations. PUT `/api/demoMode/configuration/collections` with `{ expectedRevision, value: ["orderItems"] }`. Adding a collection permits INSERT, UPDATE and DELETE together; there is no public per-operation or per-record exception configuration. Keep those restrictions in the application's normal authorization and service checks. Removal takes effect on subsequent requests.

GET `/api/demoMode/configuration/collections` supplies selectable collections in the default database as `{ name, title? }`. Present a searchable multi-select and preserve saved selections missing from the catalog for removal. Do not invent operation checkboxes or private SQL-rule configuration. Protected collections, duplicate names and malformed names are rejected by the configuration API.

Set deployment defaults with `NOCOBASE_DEMO_WRITABLE_COLLECTIONS=orderItems,userPreferences` and restart. This overrides `demoMode.allowCollections`; the resulting `fixedCollections` combine with saved administrator selections and cannot be removed through that selector. List them separately as deployment-owned. Authentication's `session` and `verification` exceptions remain built in.

The plugin resolves physical tables through collection metadata and limits exemptions to the default connection. SQL diagnostics show physical names; resolve the corresponding logical collection before configuring an exception. When a read-only banner appears on page entry, inspect the refused SQL rather than granting all collections.

## Mock adapters

Register mocks on `demoConfigurationToken` with `registerMock({ id, title, kind, scope, defaultEnabled, invoke })`. Call `invokeMock(id, input)` at the actual application boundary; registration alone intercepts nothing. Unknown or disabled adapters throw `DEMO_MOCK_UNAVAILABLE`. Scope labels are descriptive: each adapter validates trusted persisted scope itself. Never catch this error and call the real provider.

`requireMock(id)` can reject a dispatch before queuing, but invoke again when the work actually runs. Start workers with `withFreshPolicy()` so an inherited request snapshot cannot hide revocation; see [durable Agent dispatch](simulation.md#durable-agent-dispatch). The built-in model adapter is `dataset.model`, backed by dataset answers. Ordinary request policy is snapshotted before business transactions, so configuration changes apply to subsequent requests; online chat admission and tool execution have their own fresh checks.
