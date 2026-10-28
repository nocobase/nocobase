# List request feedback

Use `resolveListState` from `@nocobase/app-client` with the existing request snapshot, and `ListFeedback` from `#components/list-feedback` for card lists. `DataTable` accepts the same state through `listState`. Both templates ship the sources and English/Chinese translations. An older application must first follow the upgrade Skill's list feedback source checklist; updating a dependency alone cannot change copied source.

The built-in state area always shows one matching icon and one short translated line: `Loading`, `No data yet`, `No results`, `Access denied`, `Session expired`, `Unable to load list`, or `Refresh failed; showing previous data`. It has no title, long helper copy or inline recovery button. `DataTable` keeps its authorized column headers and host toolbar mounted, and renders feedback as a full-width row inside the table body; states that deny or lack current data hide rows, while a refresh failure places its message before the retained same-query rows. `ListFeedbackActions` belongs in the host's existing toolbar or action area and supplies the state-appropriate clear, retry and sign-in controls. `DataTable` places these controls in its toolbar when the relevant callback is supplied. A deliberately supplied business `empty` or `emptyAction` remains available only for successful unfiltered emptiness.

```tsx
const createPermission = useCan({
  resource: { type: 'project', id: '*' },
  action: 'create',
});
const remote = new URLSearchParams({
  q: search.trim(),
  ...(status ? { status } : {}),
  page: String(page),
  pageSize: String(pageSize),
  orderBy,
});
const requestPath = `projects?${remote}`;
const request = useListData<ProjectList>(requestPath, {
  active,
  keepPreviousData: true,
});
const hasCurrentResponse = request.path === requestPath;
const displayedQuery = new URLSearchParams(request.path.split('?')[1]);
const rowsFiltered = Boolean(
  displayedQuery.get('q') || displayedQuery.get('status'),
);
const state = resolveListState(
  {
    data: hasCurrentResponse ? request.data : undefined,
    error: request.error,
    isPending: request.loading && !hasCurrentResponse,
  },
  hasCurrentResponse ? (request.data?.data.length ?? 0) : 0,
  rowsFiltered,
);
const rows = listStateShowsData(state) ? (request.data?.data ?? []) : [];
const canShowCreate =
  createPermission.can &&
  !createPermission.isPending &&
  (state === 'empty' ||
    state === 'ready' ||
    state === 'no-results' ||
    state === 'refresh-failed');

// Keep the toolbar mounted. clearFilters cancels the search debounce, clears
// visible and applied filters, and resets page to 1 while preserving sort/size.
<PageHeader actions={canShowCreate ? <CreateButton /> : undefined} />
<DataTable
  columns={columns}
  data={rows}
  listState={state}
  loading={request.loading}
  onRetry={request.reload}
  onClearFilters={clearFilters}
  emptyMessage={<BusinessEmptyContent />}
/>;
```

`createPermission` comes from the application's existing authorization hook for the same resource and create action as the endpoint. `useCan` keeps `can` false while `isPending` is true, so the header action stays hidden until permission resolves; an explicit denial or permission error also leaves it hidden. The shared `emptyAction` prop remains available for an intentional business-specific empty-state action, but do not pass the standard create button there.

Pass server pagination/sorting props as described in `table.md`; the snippet omits them for clarity. Only use a successful current-query total for page correction. While correcting an out-of-range page with a positive total, use loading feedback rather than claiming the list is empty. For cards, render `ListFeedbackActions` in their existing controls and `ListFeedback` around the mapped rows:

```tsx
<div className='flex flex-wrap items-center gap-2'>
  <SearchAndFilters />
  <ListFeedbackActions
    state={state}
    onClear={clearFilters}
    onRetry={retry}
    busy={request.isFetching}
  />
</div>
<ListFeedback state={state} empty={businessEmpty}>
  <ProjectCards rows={rows} />
</ListFeedback>
```

| Snapshot                                                              | Feedback                                                                         |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Initial pending, disabled without data, or previous-query placeholder | Loading icon and short label; never empty                                        |
| Successful empty, no effective filters                                | No data yet; authorized create remains in the page header                        |
| Successful empty with effective filters                               | No results; clear filters stays in the existing toolbar                          |
| HTTP 403, including after successful cached data                      | Access denied; hide cached rows, make no existence probe, and hide header create |
| HTTP 401                                                              | Session expired; hide cached rows and use the existing sign-in flow              |
| Network, timeout or server failure without current-query data         | Unable to load list; retry the same query from the existing toolbar              |
| Same-query refresh failure with successful data                       | Keep prior data and show one stale-data line; retry from the existing toolbar    |

`resolveListState` neither fetches nor caches. It recognizes structured `ApiClientError.status`; it never parses error messages or infers permission from an empty array. Keep one request owner per list and use the app-owned `useListData` hook for list queries. Its response path distinguishes current results from the previous query, and `reload` cancels obsolete work before the next request. Do not put retry counters in keys or turn errors into empty arrays. A failed refresh of a successful empty response is still a refresh failure; do not stack the previous empty message beneath the stale-data line. Keep custom empty content scoped to unfiltered successful emptiness.

| Create permission result                        | Header action                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Allowed (`can === true`, `isPending === false`) | Show in ready, empty, no-results and refresh-failed states, including a successful empty collection |
| Denied (`can === false`, `isPending === false`) | Hide                                                                                                |
| Pending (`isPending === true`)                  | Hide until permission resolves                                                                      |

Gate the standard create action in the page header from the current list state and existing permission result, never from the read response itself.
