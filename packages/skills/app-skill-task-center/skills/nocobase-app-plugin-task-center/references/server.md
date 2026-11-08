# Task Center server integration

## Register the plugin and a source

Install and register the Task Center Server plugin and the host authentication plugin, then apply plugin migrations, including `202610190001_user_tasks`. The migration creates an empty `userTasks`; historical tasks need explicit backfill. When replacing an application prototype, remove its local `/api/userTasks*` route registrations to avoid duplicate routes, but retain released migrations and historical tables until migration and retirement are complete.

All APIs below are exported from `@nocobase/app-plugin-task-center/server`. Resolve the service through the host container during composition; register each source once and retain its writer. Duplicate registration fails. `approval.task` and `approval.cc` belong to the shared approval contributor; never register them yourself. `approval.application` is available for host-owned applicant tracking.

```ts
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import type { DatabaseConnection } from '@nocobase/db';

const userTasks = container.resolve(userTaskServiceToken);
const deliveries = userTasks.registerSource('asset.delivery');

// Inside the transaction that writes the delivery's business facts:
await deliveries.put(
  {
    userId: recipientId,
    sourceKey: deliveryId,
    subject: 'laptop',
    title: 'Collect your laptop',
    status: 'pending',
  },
  tx.handle as DatabaseConnection,
);
await deliveries.setStatus(
  { userId: recipientId, sourceKey: deliveryId },
  'completed',
  tx.handle as DatabaseConnection,
);
```

Here `tx` is the host's database-backed `LifecycleTransaction`. Its handle must actually be the same-database `DatabaseConnection`; a type assertion alone cannot adapt a different store. With an ordinary database transaction, pass that connection directly. Omitting the connection opens an independent connection and loses atomicity with business changes. Register writers outside transactions and reuse them inside hooks.

Identity is `(userId, sourceType, sourceKey)`. Keep `sourceKey` stable and opaque; `subject` is a source-defined category, not a database table name. `put` upserts while preserving ID and creation time; an unchanged replay also preserves update time. Optional `createdAt` supplies the initial fact time. `setStatus` returns `undefined` for a missing item. `remove({ userId, sourceKey }, connection)` is idempotent; a later `put` creates a new ID. Source code owns state transitions and event ordering: an old business event must not overwrite newer facts merely because it can call `put`.

## Read the index

In-process reads require an explicit trusted user identity:

```ts
const page = await userTasks.list(currentUserId, {
  status: 'pending',
  sourceType: 'asset.delivery',
  subject: 'laptop',
  orderBy: 'createdAt',
  direction: 'desc',
  page: 1,
  pageSize: 20,
});
const counts = await userTasks.statistics(currentUserId, {
  sourceType: 'asset.delivery',
});
const item = await userTasks.get(currentUserId, itemId);
```

Lists return `{ data, meta: { page, pageSize, total } }`. Filters combine `status` (one status or a non-empty array of up to 100 statuses, OR), `sourceType` and `subject`; ordering is `createdAt` or `updatedAt` with ID as a tie-breaker, default descending. Pages start at 1; page size defaults to 20 and is capped at 100. Statistics return `{ pending, completed, cancelled }`, including zeros, and accept the same three filters. A status filter limits the counted population. `get` returns `undefined` for a missing or foreign item. Returned timestamps are `Date` objects. Separate list/count statements or requests do not guarantee one shared snapshot during concurrent updates.

The plugin exposes these authenticated GET routes below the application's base path (for example `/main/api/userTasks`):

| Route                       | Query                                                                         | Response                                      |
| --------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| `/api/userTasks`            | `status`, `sourceType`, `subject`, `orderBy`, `direction`, `page`, `pageSize` | `{ data, meta: { page, pageSize, total } }`   |
| `/api/userTasks/statistics` | `status`, `sourceType`, `subject`                                             | `{ data: { pending, completed, cancelled } }` |
| `/api/userTasks/:id`        | None                                                                          | `{ data: item }`                              |

For example, the browser can request `/main/api/userTasks?status=pending&sourceType=approval.task&page=1&pageSize=20` and `/main/api/userTasks/statistics?sourceType=approval.task` through its normal authenticated API client. HTTP dates are RFC 3339 strings. Routes derive the owner from authentication; client `userId` and other unknown query parameters receive 400. Missing authentication receives 401, including when no authentication service is installed; a foreign or missing item receives 404. There are no HTTP index-write routes. Reading a personal entry does not grant business-detail access or permission to perform its approval action.

## Source-scoped recipient lookup

`writer.listBySourceKey(sourceKey, connection?)` returns all personal entries for that writer's registered source and key. This trusted server-only operation supports reconciling a changed set of recipients without exposing internal persistence. Pass the business transaction and determine eligibility from current authoritative business facts. The writer cannot enumerate another registered source through this method. Keep history according to the source's policy; changing recipients does not mean every previous recipient completed the work.

## Upgrade from the Approval branch

The migration `202610190001_user_tasks` is transferred unchanged from Approval. Existing installations keep the same `userTasks` collection, IDs, statuses and timestamps. Register the new Task Center Server plugin and upgrade Approval in the same deployment. Migration discovery rejects duplicate names, so do not pair Task Center with an old Approval version that still ships the migration. Existing history is recognized by globally unique name and unchanged content checksum; its original owner attribution is retained. Do not rename or rerun it, and do not roll it back to move ownership.

The new service token belongs to Task Center. Import the exported token rather than recreating one by its name. Old deep imports and generic exports from Approval must be updated. The `/api/userTasks*` paths and data shapes remain unchanged; OpenAPI identifiers and error domains now identify Task Center.

## Acceptance

Verify a non-approval business with only Task Center registered: write a pending task inside the business transaction, sign in as its recipient, load the list and counts, perform the business's authorized completion action and refresh both. Verify rollback leaves neither fact nor index changes, replay preserves identity, foreign-user reads return 404 and unauthenticated requests return 401. Approval actions and dependency synchronization are tested by the Approval contributor, not by this plugin.

## Bounded interactive reads

Prefer `list(userId, { pagination: 'cursor', pageSize: 20, status: 'pending' })` for interactive lists. Continue with `after: result.meta.nextCursor` until it is null; cursor pagination uses `(createdAt, id)` and does not compute a total unless `includeTotal: true` is requested. Keep filters and direction unchanged between pages. Offset pagination remains compatible, and either mode accepts `includeTotal: false`. `meta.total` is optional. Request `statistics(userId, { status: 'pending' })` for live badges; unfiltered statistics intentionally counts historical rows and should be reserved for reports. Filtered statistics returns zero for statuses outside the requested filter.

### Multiple source types

`sourceType` accepts a string or a non-empty array of up to 100 strings. Sources are combined with OR, while `status`, `subject` and the authenticated owner are combined with AND. Omit `sourceType` for all sources. Empty arrays and blank values are rejected; unknown sources simply match no entries. Comma-separated strings are treated as one literal source type. Both list and statistics use the same source filter, and pagination and totals apply to the combined result in the database.

```http
GET /api/userTasks?sourceType=approval.task&sourceType=approval.cc&status=pending&page=1&pageSize=20
GET /api/userTasks/statistics?sourceType=approval.task&sourceType=approval.cc
```

The host API client serializes array query values as repeated parameters. Existing single-source calls remain supported.

## Discover categories and count work

`UserTaskService.categoryStatistics(userId, query?)` returns `UserTaskCategoryStatistics[]`: `{ sourceType: string, subject: string, count: number }`, ordered by source type and then subject. `UserTaskCategoryQuery` accepts only optional `status` (one status or a non-empty array of up to 100 statuses), defaulting to `pending`. All types are exported from `@nocobase/app-plugin-task-center/server`. Resolve the original service token and derive `userId` from trusted server identity; never forward an arbitrary browser identity.

```ts
const categories = await userTasks.categoryStatistics(currentUserId);
const closedCategories = await userTasks.categoryStatistics(currentUserId, {
  status: ['completed', 'cancelled'],
});
const closed = await userTasks.list(currentUserId, {
  status: ['completed', 'cancelled'],
  sourceType: ['approval.task', 'approval.cc'],
  subject: 'expense',
  pageSize: 20,
});
```

Discovery groups the owner's entire index by `(sourceType, subject)`, across all statuses and sources. Counting uses personal entries, never distinct business records. The status filter changes counts only; closed-only categories remain with a zero pending count. Never-used categories and categories only belonging to another user are omitted. Add any desired never-used categories through application-owned static display configuration. The service aggregates in the database without loading individual history entries or issuing a query per category.

`GET /api/userTasks/categoryStatistics` returns `{ data: [{ sourceType, subject, count }] }`. Optional repeated `status` parameters select counted statuses; omitted means pending. No source or subject filter is accepted, so navigation remains independent of the current list selection. Like other personal endpoints it authenticates the caller and rejects `userId` and unknown fields with 400; missing authentication returns 401. This is a grouped summary, without task pagination. It does not grant business access.

```http
GET /api/userTasks?status=completed&status=cancelled&sourceType=approval.task&subject=expense&page=1&pageSize=20
GET /api/userTasks/statistics?sourceType=approval.task&subject=expense
GET /api/userTasks/categoryStatistics
GET /api/userTasks/categoryStatistics?status=completed&status=cancelled
```

Multi-status list and status statistics filters use OR before pagination and totals, including cursor mode; duplicate statuses never multiply counts. Omit list `status` for all statuses. Invalid or empty status arrays and arrays over 100 values are rejected by both service and HTTP validation; comma-separated values are literal invalid statuses. Single-status calls retain their behavior. For tab counts, omit status from `statistics` and use `completed + cancelled` for closed and all three counts for all. Preserve the same source/subject scope as the list. Separate requests may observe concurrent updates.
