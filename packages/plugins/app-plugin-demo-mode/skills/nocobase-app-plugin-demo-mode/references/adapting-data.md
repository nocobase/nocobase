# Adapt demo data to an application

Use this workflow to populate a dedicated demo system after choosing that scope. For ordinary example records in an existing application, follow the application development Skill's sample-data workflow instead. The application owns the story, records, relationships and service calls. This plugin owns the lifecycle, tracking, demo-account ownership, progress and simulated model gateway. Read the application's development, database and authorization Skills before implementing its adapter.

## Inspect before generating

1. Confirm registration in the application's Server, Client and CLI composition roots and read the installed public declarations from `@nocobase/app-plugin-demo-mode/server/tokens`. Do not assume the latest source repository API is installed.
2. Inspect application collections, relationships, required fields, lifecycle transitions, services, pages and permissions. Build a short coverage matrix: user journey, collections, service entry point, required identity, external side effects, cleanup mechanism and visible verification. Use schema and aggregate business structure; do not copy real customer records, private conversation content, credentials or personal data into public fixtures.
3. Choose a coherent fictional story with several related records and realistic states, including empty/pending/completed examples. Keep foreign keys, totals, units and chronological constraints consistent. Use reserved example addresses and domains. Create representative accounts for the application's actual roles and assign only the demo records they need.
4. Identify external calls, file writes, background jobs and Runner dispatch that those services can trigger. Provide in-process fixtures or refuse the operation before side effects occur. The SQL read-only guard does not stop an HTTP request, a queued job or a drive upload.

## Implement the dataset

Import `DemoDataset` and the original `demoDataToken` from `@nocobase/app-plugin-demo-mode/server/tokens`. Register one dataset from an application provider after its required services exist. Keep registration deterministic; it must not import or clear data during ordinary startup.

Implement `id`, `languages`, `accounts(language)`, `generate(context)` and `clear(context)`. Call the application's shared sample generator from `generate`; the existing `steps(language)` alternative remains supported, but do not provide both. Keep core sample registration separate and leave its execution history untouched. Add `timeZone(language)`, `counts(context)` and `answers` as required by the application. Each step has a stable key, optional progress weight and `run(context)`. Write through application services so real validation and derived data run. Split steps by meaningful user-visible progress, not one step per row.

- Use `context.actorId` as the administrator initiating the import, not a hard-coded user id.
- Use `createAccount`, `createPermissionSet` and `assignPermissionSet`; never insert authentication rows directly or reuse a username the plugin does not own.
- Track created records promptly with `context.track(collection, ids, { key })`; use the real collection name and primary key. Where service transactions support it, keep creation and ownership recording consistent. Record identifiers needed by cleanup with `setData` before later steps depend on them.
- Keep role grants limited to the demo's projects/tenants. A demo role must not gain access to pre-existing records merely because it has a convenient broad permission set.
- The plugin does not wrap the whole import in a database transaction. Use application services and respect any transactions they open; do not call the application's own HTTP endpoints from inside such a transaction. Failure recovery calls full-business cleanup rather than restoring a transaction snapshot.

## Keep the story recent and reproducible

Use `context.clock` throughout a step: `now`, `timeZone`, `daysAgo`, `dateAgo` and `isoAgo`. Avoid hard-coded calendar dates and uncoordinated calls to `new Date()`, especially near local midnight. Date ranges, summaries, activity feeds and task deadlines must share the same import clock.

Use `context.clock.seed` and `context.clock.sample(stableRecordKey)` for daily variation. The seed includes the dataset, language, time zone and local import day; each key produces a stable value in `[0, 1)` independent of iteration order. Do not add a second random-seed implementation. Keep variation bounded and preserve totals, references and domain invariants. See the [dataset example](dataset-example.md) for dates and account reuse.

Relative dates become current when the dataset is imported or reset. They do not advance in persisted records merely because the page is opened the next day. Configure the daily schedule through the demo configuration API/UI if daily regeneration is needed, with an explicit timezone and language. Explain the deletion scope before enabling automatic reset. Do not replace an administrator's existing schedule or clear live data just to make a preview look recent.

## One business cleanup contract

Implement `clear(context)` to delete ALL business data and visitor additions in the dedicated demo instance, including files, queues, active work and caches. Preserve system identities, authorization, secrets, demo configuration and the environment model. Inventory tables and deletion order explicitly; never delete every database table indiscriminately. Tracking supplies counts and import membership, not a promise to preserve older business records.

The same cleanup runs for clear, reset and failed/interrupted imports. It must be retry-safe and accept partial or empty import context. It does not restore an earlier business state. An interrupted cleanup must retain enough evidence to retry failed file deletion. Demo accounts are disabled for reuse; do not delete their reserved usernames or introduce an application-specific account policy.

## Deliver the management flow

Mount the plugin's `DemoModeSettings` page from `@nocobase/app-plugin-demo-mode/client/settings`; give it the names of the dataset's `counts` through `label('count', key)`. Grant `settings:demoMode.data` read/manage through the installed authorization plugin; reflect actual actions in the UI and preserve each endpoint's server checks. The page labels the actions Generate, Clear and Reset and shows language, progress, state, accounts and the exact clear/reset consequence. Do not grant every visitor the administrator action merely to let them try a demo.

The installed version's documented deployment table allowlist is separate from business authorization. Never allow all tables to bypass errors. A physical-table allowlist cannot express “only records in this demo project”; use explicit application scope checks and the authorization system, and do not claim that the SQL guard supplies row-level policy.

## Verify the adapter, not just its compilation

- Import into an isolated database and inspect the actual principal pages: coherent relations, useful charts, role-appropriate accounts and recent dates in each language the demo supports.
- If the dataset uses daily variation, verify stable results for the same date and meaningful bounded changes on another date; test business invariants rather than snapshots of every generated value.
- Inject a middle-step failure, then retry; business data is cleared while credentials and administrator assignments survive. Test username collisions and restart recovery.
- Add visitor content within demo scope, clear it, then reset; verify blobs and cached views as well as rows. Verify failure recovery uses the same full cleanup contract.
- Exercise anonymous, read-only administrator and managing administrator access, including direct API calls and concurrent ordinary requests during lifecycle exemption.
- Trace every external/model/tool/Runner boundary. A fixture miss must not silently invoke a real provider. Follow the [simulation checklist](simulation.md).
- Verify the published Skill reaches the application through Skills synchronization; that check proves delivery only. Report actual runtime tests and any unverified external boundaries separately.
