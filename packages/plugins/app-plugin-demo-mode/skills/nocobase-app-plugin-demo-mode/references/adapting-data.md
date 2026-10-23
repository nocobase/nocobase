# Adapt demo data to an application

Use this workflow to populate a dedicated demo system after choosing that scope. For ordinary example records in an existing application, follow the application development Skill's sample-data workflow instead. The application owns the story, records, relationships and service calls. This plugin owns the lifecycle, tracking, demo-account ownership, progress and simulated model gateway. Read the application's development, database and authorization Skills before implementing its adapter.

## Inspect before generating

1. Confirm registration in the application's Server, Client and CLI composition roots and read the installed public declarations from `@nocobase/app-plugin-demo-mode/server/tokens`. Do not assume the latest source repository API is installed.
2. Inspect application collections, relationships, required fields, lifecycle transitions, services, pages and permissions. Build a short coverage matrix: user journey, collections, service entry point, required identity, external side effects, cleanup mechanism and visible verification. Use schema and aggregate business structure; do not copy real customer records, private conversation content, credentials or personal data into public fixtures.
3. Choose a coherent fictional story with several related records and realistic states, including empty/pending/completed examples. Keep foreign keys, totals, units and chronological constraints consistent. Use reserved example addresses and domains. Create representative accounts for the application's actual roles and assign only the demo records they need.
4. Identify external calls, file writes, background jobs and Runner dispatch that those services can trigger. Provide in-process fixtures or refuse the operation before side effects occur. The SQL read-only guard does not stop an HTTP request, a queued job or a drive upload.

## Map a business journey to fixtures

For a request such as “demo the existing CRM as a sales rep and a manager,” inspect the actual pages and services first, then write a small acceptance map:

| Visible journey                | Required fictional data                                                                                              | Verification under the representative account                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A rep opens “My opportunities” | Customers and related opportunities owned by that rep, with valid pipeline stages                                    | The list contains the intended records; another rep's private records remain hidden |
| The manager opens the pipeline | Opportunities spread across the stages and date range used by the existing chart, with consistent amounts and owners | Stage counts and totals match the list; the chart is useful rather than empty       |
| A rep opens an opportunity     | Related contacts and recent activities created in the order required by the business services                        | The existing detail page renders its relationships and timeline                     |

These are story requirements, not new collection names or service APIs. Map each row to the application's real schema, service methods, grants and URLs. Choose a small number of records that makes every requested page useful; increase volume only for a stated pagination or performance demonstration. Use the user's language for names and narratives. Avoid unrelated example schemas or new management infrastructure.

Keep the implementation in application source: shared account definitions and a dataset under the existing demo/sample module, a provider that registers it, and a business cleanup adapter. Reuse the existing pages and authorized services. [The dataset example](dataset-example.md) shows the public contract; the minimal example's project/task business adapter is only for applications that have no business domain yet.

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

Relative dates become current when the dataset is imported or reset. They do not advance in persisted records merely because the page is opened the next day. [Decide the reset schedule before generation](policies.md#decide-the-reset-schedule-before-generation): an existing Scheduler registration enables the default 03:00 reset unless a disabled policy is saved. Use an explicit time zone and language when recurring regeneration is wanted. Preserve an administrator's existing schedule unless changing it is part of the request.

## One business cleanup contract

Implement `clear(context)` to delete ALL business data and visitor additions in the dedicated demo instance, including files, queues, active work and caches. Preserve system identities, authorization, secrets, demo configuration and the environment model. Inventory tables and deletion order explicitly; never delete every database table indiscriminately. Tracking supplies counts and import membership, not a promise to preserve older business records.

The same cleanup runs for clear, reset and failed/interrupted imports. It must be retry-safe and accept partial or empty import context. It does not restore an earlier business state. An interrupted cleanup must retain enough evidence to retry failed file deletion. Demo accounts are disabled for reuse; do not delete their reserved usernames or introduce an application-specific account policy.

## Coordinate cleanup and recovery

Stop and drain application-owned jobs and active writes before deleting their business data. The persisted operation lease protects plugin status updates, but it cannot cancel an application callback already executing. A timed-out callback may resume and delete rows created by its replacement; a lease-lost error after the callback returns cannot undo that deletion. Before manually recovering a stalled operation, establish that its old executor has stopped. Deployments that allow concurrent takeover need a shared exclusion mechanism covering business writes; the public clear context supplies progress reporting, not a cancellation signal or an atomic write fence.

After an ordinary generation failure, inspect the reported failure and verify cleanup completed before retrying. Account creation and demo ownership recording are separate writes: interruption between them can leave an enabled account outside tracked compensation and make a retry fail with `DEMO_DATA_ACCOUNT_CONFLICT`. An identity conflict is not permission to adopt or overwrite the existing account. Verify its provenance, disable an unintended account through Users administration when appropriate, and resolve ownership recovery in the owning plugin before retrying. Do not patch private tracking tables, delete reserved usernames or repeatedly reset the database to hide the conflict.

Verify actual rows, files, active work and effective access after recovery. A `ready` status and tracked counts alone cannot prove that a resumed old callback left the new business data intact.

## Update demo accounts

Keep `accounts(language)` and `createAccount()` on one shared definition. Reset applies changed passwords and revokes their old sessions; unchanged credentials preserve sessions. Check ordinary and quick sign-in after resetting changed definitions.

Reused accounts apply only the `roleScopes` keys present in the new specification. Omitting a key keeps its previous value. To remove an optional multi-value scope, explicitly supply an empty array, for example `roleScopes: { app: [] }`, and retain that explicit value in the account definition. For required or single-value scopes, use the host's supported replacement value. Do not infer a universal removal value or bypass the scope's validation. Verify effective permissions after reset with the visitor's existing session, including an operation the old role allowed and the new role must refuse.

## Deliver the management flow

Mount the plugin's `DemoModeSettings` page from `@nocobase/app-plugin-demo-mode/client/settings`; give it the names of the dataset's `counts` through `label('count', key)`. Protect its application route with `authz: { resource: { type: 'settings', id: 'demoMode.data' }, action: 'read' }`, not page access. Grant the manager data read/manage, and configuration read/configure when policy editing is needed; preserve each endpoint's server checks. The page labels the actions Generate, Clear and Reset and shows language, progress, state, accounts and the exact clear/reset consequence. Visitors keep only their business-page and record permissions.

The installed version's documented deployment collection allowlist is separate from business authorization. Never allow all tables to bypass errors. A collection allowlist cannot express “only records in this demo project”; use explicit application scope checks and the authorization system, and do not claim that the SQL guard supplies row-level policy.

## Verify the adapter, not just its compilation

- Import into an isolated database and inspect the actual principal pages: coherent relations, useful charts, role-appropriate accounts and recent dates in each language the demo supports.
- If the dataset uses daily variation, verify stable results for the same date and meaningful bounded changes on another date; test business invariants rather than snapshots of every generated value.
- Inject a middle-step failure and verify full business cleanup and preservation of system identities. Exercise identity-creation failures and username collisions separately; do not claim automatic recovery from conflicts. Retry only after the failed boundary has been resolved.
- Test role removal as well as role assignment. For takeover-capable deployments, resume a stalled old cleanup after a new import and verify the new rows survive; include an actual delayed write in the test.
- Add visitor content within demo scope, clear it, then reset; verify blobs and cached views as well as rows. Verify failure recovery uses the same full cleanup contract.
- Exercise anonymous, read-only administrator and managing administrator access, including direct API calls and concurrent ordinary requests during lifecycle exemption.
- Trace external boundaries the application actually uses. A fixture miss must not silently invoke a real provider. Follow the [simulation checklist](simulation.md) only when the demo includes models, tools or Runners.
- Verify the published Skill reaches the application through Skills synchronization; that check proves delivery only. Report actual runtime tests and any unverified external boundaries separately.
