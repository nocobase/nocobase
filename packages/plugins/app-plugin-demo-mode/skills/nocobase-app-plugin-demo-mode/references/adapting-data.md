# Adapt demo data to an application

Use this workflow when a user asks for demo data without specifying a fixture format. The application owns the story, records, relationships and service calls. This plugin owns the lifecycle, tracking, demo-account ownership, progress and simulated model gateway. Read the application's development, database and authorization Skills before implementing its adapter.

## Inspect before generating

1. Confirm registration in the application's Server, Client and CLI composition roots and read the installed public declarations from `@nocobase/app-plugin-demo-mode/server/tokens`. Do not assume the latest source repository API is installed.
2. Inspect application collections, relationships, required fields, lifecycle transitions, services, pages and permissions. Build a short coverage matrix: user journey, collections, service entry point, required identity, external side effects, cleanup mechanism and visible verification. Use schema and aggregate business structure; do not copy real customer records, private conversation content, credentials or personal data into public fixtures.
3. Choose a coherent fictional story with several related records and realistic states, including empty/pending/completed examples. Keep foreign keys, totals, units and chronological constraints consistent. Use reserved example addresses and domains. Create representative accounts for the application's actual roles and assign only the demo records they need.
4. Identify external calls, file writes, background jobs and Runner dispatch that those services can trigger. Provide in-process fixtures or refuse the operation before side effects occur. The SQL read-only guard does not stop an HTTP request, a queued job or a drive upload.

## Implement the dataset

Import `DemoDataset` and the original `demoDataToken` from `@nocobase/app-plugin-demo-mode/server/tokens`. Register one dataset from an application provider after its required services exist. Keep registration deterministic; it must not import or clear data during ordinary startup.

Implement `id`, `languages`, `accounts(language)` and `steps(language)`. Add `timeZone(language)`, `counts(context)`, `clear(context)` and `answers` as required by the application. Each step has a stable key, optional progress weight and `run(context)`. Write through application services so real validation and derived data run. Split steps by meaningful user-visible progress, not one step per row.

- Use `context.actorId` as the administrator initiating the import, not a hard-coded user id.
- Use `createAccount`, `createPermissionSet` and `assignPermissionSet`; never insert authentication rows directly or reuse a username the plugin does not own.
- Track created records promptly with `context.track(collection, ids, { key })`; use the real collection name and primary key. Where service transactions support it, keep creation and ownership recording consistent. Record identifiers needed by cleanup with `setData` before later steps depend on them.
- Keep role grants limited to the demo's projects/tenants. A demo role must not gain access to pre-existing records merely because it has a convenient broad permission set.
- Do not call the application's own HTTP endpoints during an import that already holds its database transaction. Use application services and respect the installed database's transaction model.

## Keep the story recent and reproducible

Use `context.clock` throughout a step: `now`, `timeZone`, `daysAgo`, `dateAgo` and `isoAgo`. Avoid hard-coded calendar dates and uncoordinated calls to `new Date()`, especially near local midnight. Date ranges, summaries, activity feeds and task deadlines must share the same import clock.

An application that needs daily variation can derive a deterministic seed from `datasetId`, `language` and `clock.dateAgo(0)`. Derive each record's variation from that seed plus a stable record key, rather than consuming global randomness whose results change with step order. Keep the seed algorithm application-owned unless the installed plugin exposes a documented helper. Store the seed in `context.setData` when later cleanup or diagnostics needs it. Variation should remain bounded and preserve totals, references and domain invariants.

Relative dates become current when the dataset is imported or reset. They do not advance in persisted records merely because the page is opened the next day. Configure `demoMode.data.reset` through the documented Scheduler integration if daily regeneration is needed, with an explicit timezone and language. Explain the deletion scope before enabling automatic reset. Do not replace an administrator's existing schedule or clear live data just to make a preview look recent.

## Separate rollback from full reset

`clear(context)` cleans the imported scope and must tolerate partially completed steps. The plugin removes tracked records afterwards. Use persisted ownership markers to remove visitor-created child records and owned blobs not covered by tracking. Cleanup must be retry-safe, preserve unrelated data, and handle missing rows without losing evidence needed to retry a failed file deletion.

`clearAll(context)` is optional and deliberately broader. Explicit clear/reset invokes it only in enabled demo mode, including CLI and scheduled operations. Implement it only for a user-approved whole-application reset; inventory business tables, orphan rows, history, files, caches and active work. Preserve administrator access and system configuration. It must handle an empty import context. Never invoke full cleanup from failure rollback or interrupted-import recovery; those use `clear` alone.

## Deliver the management flow

Build the application page on `useDemoData()` from `@nocobase/app-plugin-demo-mode/client/demo-data`. The plugin ships APIs and a hook, not an administration page. Grant `settings:demoMode.data` read/manage through the installed authorization plugin; reflect actual actions in the UI and preserve each endpoint's server checks. Show language, progress, current state, accounts and the exact clear/reset consequence. Do not grant every visitor the administrator action merely to let them try a demo.

The installed version's documented deployment table allowlist is separate from business authorization. Never allow all tables to bypass errors. A physical-table allowlist cannot express “only records in this demo project”; use explicit application scope checks and the authorization system, and do not claim that the SQL guard supplies row-level policy.

## Verify the adapter, not just its compilation

- Import into an isolated database and inspect the actual principal pages: coherent relations, useful charts, role-appropriate accounts and recent dates in each supported language.
- Test the same seed/date twice and a different date/timezone; assert invariants and visible variation rather than random snapshots.
- Inject a middle-step failure, then retry; no unrelated data, credentials or administrator assignments may be removed. Test username collisions and restart recovery.
- Add visitor content within demo scope, clear it, then reset; verify blobs and cached views as well as rows. Test optional full cleanup separately from scoped rollback.
- Exercise anonymous, read-only administrator and managing administrator access, including direct API calls and concurrent ordinary requests during lifecycle exemption.
- Trace every external/model/tool/Runner boundary. A fixture miss must not silently invoke a real provider. Follow the [simulation checklist](simulation.md).
- Verify the published Skill reaches the application through Skills synchronization; that check proves delivery only. Report actual runtime tests and any unverified external boundaries separately.
