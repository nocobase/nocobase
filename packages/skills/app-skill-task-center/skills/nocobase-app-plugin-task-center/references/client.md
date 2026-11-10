# Client UI and data loading

## Register or embed the center

Register the Server plugin, authentication and migrations as described in [Server integration](server.md). In the application's Client plugin list, use `taskCenter()` to register locales without a page. The application declares its address, navigation, breadcrumbs, authentication and page permissions using `defineAppRoutes()` and a lazy page module. Compose `TaskCenter` in that module.

```tsx
import taskCenter, {
  TaskCenter,
  type TaskCenterSource,
} from '@nocobase/app-plugin-task-center/client';

// DeliveryTaskEntry is a host-owned component, not a package export.
const sources: readonly TaskCenterSource[] = [
  {
    sourceType: 'asset.delivery',
    label: 'Equipment collection',
    renderTask: (task, refresh) => (
      <DeliveryTaskEntry task={task} onHandled={refresh} />
    ),
  },
];

// Add to the application's existing Client plugin list:
taskCenter();

// In the application's lazy page module:
export default function WorkPage() {
  return <TaskCenter sources={sources} />;
}
```

The built-in page supplies pending/completed/cancelled selection, counts, source selection, 20-row pagination, loading/error/empty states and refresh. The source selector is shown when adapters are provided. All-source mode still returns sources without an adapter, displaying their source type as a fallback label. Do not assume the `sources` array filters the data.

For an existing application page, register the Client plugin once for its locales and compose the named `TaskCenter` export there: `<TaskCenter sources={sources} refreshKey={revision} />`. Registration adds no route, so the application remains the only page owner. The component uses the host API client by default. An external handling dialog can change `refreshKey` to reload the mounted center; an adapter can call its supplied `refresh()` after successful handling. Neither mechanism polls or subscribes to server changes automatically.

## Migrate previous integrations

`path` and `sources` are no longer accepted by the Client factory; old calls throw a migration error. Move `path` and all page metadata into application routes and `sources` into component props. Preserve existing application page permission IDs. Remove overrides targeting `@nocobase/app-plugin-task-center:taskCenter`, since default registration no longer creates that route. If using Approval Example, compose its exported `PersonalTaskCenter` in the host page and pass `approvalExample({ taskCenter: { path: '/work' } })` only to redirect its legacy inbox.

The deprecated public `@nocobase/app-plugin-task-center/client/routes` factory is retained until the next minor release. Call it explicitly with `name`, `path`, `auth`, `authz`, optional `navigation`/`breadcrumb`, and optional `sources`. It does not default to a menu or `authz: 'skip'`; callers must decide their own page policy. Prefer an application-owned declaration, for example:

```ts
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export default defineAppRoutes([
  {
    name: 'work',
    path: '/work',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'application.work' },
      action: 'access',
    },
    navigation: { title: 'work.title' },
    componentLoader: () => import('./pages/work.js'),
  },
]);
```

Add `work.title` to the application's locales. Keep published old URLs as application-owned redirects without navigation and preserve query parameters and detail context. Verify allowed and denied page access separately from authenticated personal API ownership and source-owned business actions.

## Provide a data-loading entry where work is needed

Use the exported factory for a dashboard, navigation badge, approval panel or task picker that needs data without mounting the full center. Create a stable data source from `useApiClient()` with `useMemo` in React, or pass the existing host `ApiClient` outside React. Invoke loads when the relevant view opens or its filters change; load business content only when the user opens a task.

```ts
import { createTaskCenterDataSource } from '@nocobase/app-plugin-task-center/client';

const tasks = createTaskCenterDataSource(client);
const [page, counts] = await Promise.all([
  tasks.list({
    status: 'pending',
    sourceType: 'approval.task',
    page: 1,
    pageSize: 20,
  }),
  tasks.statistics('approval.task'),
]);
// page.data contains rows; page.meta contains page, pageSize and total.
// counts.pending is suitable for this source's pending-work badge.
```

Omit `sourceType` in both calls for all personal sources; for a badge alone, load statistics alone. This factory uses `client.request` with paths relative to the application's API base, preserving its authentication and configured base path. Never send `userId`, demo persona or another identity override to the generic endpoints.

The convenience `TaskCenterQuery` supports `status` (string or non-empty array), `sourceType`, `subject`, `orderBy`, `direction`, `page`, `pageSize`, `pagination`, `after` and `includeTotal`. Its statistics method is `statistics(sourceType?, status?, subject?)`; existing single-status and single-source calls remain valid. For one-entry loads, call the host API client directly. `TaskCenterTask`, `TaskCenterPage`, `TaskCenterStatistics`, `TaskCenterCategoryQuery`, `TaskCenterCategoryStatistics` and `TaskCenterApiDataSource` are public Client types. For example:

```ts
const page = await client.request<TaskCenterPage>({
  path: 'userTasks',
  query: {
    status: 'pending',
    sourceType: 'approval.task',
    subject: 'expense',
    orderBy: 'updatedAt',
    direction: 'desc',
    page: 1,
    pageSize: 20,
  },
});
const { data: counts } = await client.request<{
  data: TaskCenterStatistics;
}>({
  path: 'userTasks/statistics',
  query: { sourceType: 'approval.task', subject: 'expense' },
});
const { data: entry } = await client.request<{ data: TaskCenterTask }>({
  path: `userTasks/${encodeURIComponent(taskId)}`,
});
```

Import those types from `@nocobase/app-plugin-task-center/client`. See [the HTTP contract](server.md#read-the-index) for all query fields, response envelopes and errors. Keep list and count source/subject scopes aligned. Omit `status` from statistics when displaying all three status counts; supplying it restricts the counted population. Separate requests need not share a database snapshot. For custom React views, discard responses from superseded loads, reset pagination when filters change and handle loading, empty, failure and retry states. Do not keep showing a previous identity's cached rows after sign-out or an identity change.

`TaskCenterDataSource` has `list(query): Promise<TaskCenterPage>` and `statistics(sourceType?, status?, subject?): Promise<TaskCenterStatistics>`. The built-in factory returns `TaskCenterApiDataSource`, which also provides `categoryStatistics(query?): Promise<TaskCenterCategoryStatistics[]>`; custom page transports remain compatible without this method. A host can pass a stable implementation via `<TaskCenter dataSource={dataSource} sources={sources} />`. For example, an expense-only transport can add `subject: 'expense'` to both endpoint calls above while honoring the component's status, source and pagination arguments. Custom transports must preserve authentication and authorization themselves; browser-selected identities are not a substitute for a server boundary.

## Open details and handle work

Dispatch by `sourceType`, then resolve the source-owned `sourceKey` and `subject` through that business's authorized interface. The index has no generic detail URL, approval form, action catalog or completion endpoint. `GET userTasks/:id` loads only index metadata. A source's `renderTask(task, refresh)` can render navigation, a drawer or a detail component; perform data loading and React hooks inside that component rather than inside the render callback.

For Approval, use its installed Skill and public contracts to configure definition-level `userTasks` with the shared `approvalTaskContributorToken`. Do not register or manually write `approval.task` or `approval.cc`. Different approval businesses may share `approval.task`; use `subject` and a business-owned key resolver to select their detail UI. Use Approval's offered actions and reviewed-content checks through the business routes rather than hard-coding approve/reject from index status. Dependency/delegation synchronization and historical backfill remain owned by Approval and the host.

For ordinary work, call the existing authorized business completion route. That route changes business facts and its source writer in the same database transaction. After success, reload detail if still visible, invoke `refresh()` (or change `refreshKey`) and refresh any separate badge/count cache. A stale or revoked task may refuse handling: reload authoritative details and offered actions before presenting the next decision. Retain server-side business permission checks even when the personal index row is readable.

## Verify the visible flow

Exercise the requested sources with a signed-in recipient: open the center or embedded loader, check matching filters/counts, open authorized details, handle work and observe refreshed rows and counts. Check empty/error states, pagination after the last item is handled, blocked work without offered actions, foreign-entry 404 and anonymous 401. For custom filters or transports, verify that counts use the same business scope and cannot read another user's work. Pair these checks with the transactional contribution and backfill checks in the server reference.

### Multiple source types

`sourceType` accepts a string or a non-empty array of up to 100 strings. Sources are combined with OR, while `status`, `subject` and the authenticated owner are combined with AND. Omit `sourceType` for all sources. Empty arrays and blank values are rejected; unknown sources simply match no entries. Comma-separated strings are treated as one literal source type. Both list and statistics use the same source filter, and pagination and totals apply to the combined result in the database.

```http
GET /api/userTasks?sourceType=approval.task&sourceType=approval.cc&status=pending&page=1&pageSize=20
GET /api/userTasks/statistics?sourceType=approval.task&sourceType=approval.cc
```

The host API client serializes array query values as repeated parameters. Existing single-source calls remain supported.

```ts
const sourceType = ['approval.task', 'approval.cc'];
const page = await dataSource.list({
  sourceType,
  status: 'pending',
  page: 1,
  pageSize: 20,
});
const counts = await dataSource.statistics(sourceType);
```

## Closed tabs and category navigation

Use the built-in transport for a custom center; there is no `center()` service or endpoint. A closed tab maps to `status: ['completed', 'cancelled']`; an all tab omits `status`. Multi-status filters use OR before database sorting, paging and totals. Empty status arrays, invalid statuses and arrays larger than 100 receive 400; comma-separated values are not arrays. Send repeated `status` HTTP parameters or let the host client serialize the array.

```ts
const dataSource = createTaskCenterDataSource(client);
const sourceType = ['approval.task', 'approval.cc'];
const subject = 'expense';
const closed = await dataSource.list({
  sourceType,
  subject,
  status: ['completed', 'cancelled'],
  page: 1,
  pageSize: 20,
});
// Keep tab counts scoped to the selected sources/category, with no status filter.
const counts = await dataSource.statistics(sourceType, undefined, subject);
const closedCount = counts.completed + counts.cancelled;
const allCount = counts.pending + closedCount;
// Navigation discovery ignores the selected source, subject and tab.
const categories = await dataSource.categoryStatistics();
// [{ sourceType, subject, count }], including closed-only categories with count: 0.
```

Categories are identified jointly by `(sourceType, subject)`. The default `count` is pending personal entries, with no business-record deduplication. Sum category counts by source for source badges; do not merge identical subjects across sources. `categoryStatistics({ status: ['completed', 'cancelled'] })` changes only the counted statuses, never discovery. Categories absent from the user's entire history are omitted; supplement them with application-owned static display configuration if needed. The endpoint accepts only `status`, so do not pass the current list filters. Refresh category counts after handling work. Verify cross-status ordering and pagination, closed-only zero-count categories, source-separated subjects and owner isolation. Confirm the installed published package contains these methods before removing an application's old `center()` patch; source-checkout success alone does not establish release availability.
