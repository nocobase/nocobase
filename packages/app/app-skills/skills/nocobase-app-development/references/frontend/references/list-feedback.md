# List request feedback

Use `resolveListState` from `@nocobase/app-client` with the existing request snapshot, and `ListFeedback` from `#components/list-feedback` for card lists. `DataTable` accepts the same state through `listState`. Both templates ship the sources and English/Chinese translations. An older application must first follow the upgrade Skill's list feedback source checklist; updating a dependency alone cannot change copied source.

```tsx
const request = useQuery({
  queryKey: ['projects', search.trim(), status, page, pageSize, orderBy],
  queryFn: ({ signal }) =>
    api.request<ProjectList>({
      path: 'projects',
      query: { q: search.trim() || undefined, status, page, pageSize, orderBy },
      signal,
    }),
  retry: false,
});
const state = resolveListState(
  request,
  request.data?.data.length ?? 0,
  Boolean(search.trim() || status),
);
const rows = listStateShowsData(state) ? (request.data?.data ?? []) : [];

// Keep the toolbar mounted. clearFilters cancels the search debounce, clears
// visible and applied filters, and resets page to 1 while preserving sort/size.
<DataTable
  columns={columns}
  data={rows}
  listState={state}
  loading={request.isFetching}
  onRetry={() => {
    void request.refetch();
  }}
  onClearFilters={clearFilters}
  emptyMessage={<BusinessEmptyDescription />}
  emptyAction={canCreate === true ? <CreateButton /> : null}
/>;
```

Pass server pagination/sorting props as described in `table.md`; the snippet omits them for clarity. Only use a successful current-query total for page correction. While correcting an out-of-range page with a positive total, use loading feedback rather than claiming the list is empty. For cards wrap the mapped rows in `<ListFeedback state={state} onRetry={retry} onClear={clearFilters} empty={businessEmpty} emptyAction={authorizedCreate} busy={request.isFetching}>…</ListFeedback>`.

| Snapshot                                                              | Feedback                                                                           |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Initial pending, disabled without data, or previous-query placeholder | Loading; never empty                                                               |
| Successful empty, no effective filters                                | No data, preserving business empty content and explicitly authorized create action |
| Successful empty with effective filters                               | No matching results and clear filters                                              |
| HTTP 403, including after successful cached data                      | No permission; hide rows, no existence probe                                       |
| HTTP 401                                                              | Hide rows and use the existing sign-in route                                       |
| Network, timeout or server failure without current-query data         | Load failed and retry the same query                                               |
| Same-query refresh failure with successful data                       | Retain data and announce refresh failure; successful retry clears the message      |

`resolveListState` neither fetches nor caches. It recognizes structured `ApiClientError.status`; it never parses error messages or infers permission from an empty array. Reuse existing Query Client cancellation, keys and cache. Do not put retry counters in keys, turn errors into empty arrays or expose previous-query placeholder rows as current results. Manual request adapters must provide only data from their current key and ignore obsolete responses. A failed refresh of a successful empty response is still a refresh failure, including when no rows are visible. Keep custom empty content scoped to unfiltered successful emptiness, and gate create actions with the existing permission result rather than the read response.
