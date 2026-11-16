# List pages

How to build a list page with the template's components. What it looks like and how it behaves is T1 in [`../ui-guidelines.md`](../ui-guidelines.md); phone judgement is [`../mobile.md`](../mobile.md); routes and the page frame are [`page.md`](page.md) and [`child-routes.md`](child-routes.md). The runnable reference is the [executable list and edit example](executable-list-edit.md); more worked code is indexed in [`example.md`](example.md).

Structure: `PageHeader` with the create button → `DataTable` (its toolbar holds search, filters, summary, Clear and Retry) → pagination → `<Outlet />` for the child routes.

## 1. Choosing a table component

Use the shipped `DataTable` and companions from `#components/data-table`: `DataTableSearch`, `DataTableFilter`, `DataTableColumnHeader`, `DataTableViewOptions`, `DataTablePagination`, `DataTableSortMenu`. They are application source on `@tanstack/react-table` v8. Do not write another table; a short list in a card uses `pagination={false}`. An older application copies the template's `client/components/data-table/` with its primitives. If the installed package lacks `useReactTable`/`getCoreRowModel`, repair it to `^8.21.3` (after asking) instead of substituting hooks.

- Up to one endpoint page (≤ 100 records): `DataTable` sorts and paginates in the browser; show the cap notice when `meta.total` exceeds the rows (T1.10).
- More: the endpoint paginates and returns `total`; pass `manualPagination`, `rowCount` and `manualSorting` with the state from [`useTableUrlState`](#restore-list-position). Keep the previous page's rows while the next loads, decide "empty" by `total`, and restart at page 1 on a new sort or filter.

Search and filters always run on the server, as endpoint parameters.

## Delete and recover a list

Use the application hooks; do not reimplement request or page correction per page: `useListLocation()` (`#hooks/use-list-location`) gives `params`, `setParams` and `active`; `useListData` (`#hooks/use-list-data`) reads; `useTableUrlState` (`#hooks/use-table-url-state`) holds page and sort.

- After a confirmed delete, announce it: `announceDataChange({ scopes: [scope], results: { [scope]: null } })` ([`data-changes.md`](data-changes.md)). Do not subtract from a cached total; the list reads again and `useTableUrlState` corrects an out-of-range page (at most two corrective reads, then a "list changed" error until Retry).
- A batch waits for `Promise.allSettled`, keeps each failure with its error, then announces once. A rejected delete keeps the list and URL and shows the error. After an unknown outcome, announce the scopes without results; never resend a delete automatically.
- A delete from a detail announces and returns to the source list with its query ([`data-changes.md`](data-changes.md#returning-and-direct-links)).

## 2. DataTable props

From `client/components/data-table/data-table.tsx`:

- `columns` (`useMemo`), `data`, `getRowId` (`(row) => row.id`).
- `search`: a `DataTableSearch`. `filters`: `DataTableFilter` elements; `filterCount`: how many are applied (phone badge). `summary`: a short note such as "37 projects".
- `filtered` with `onClearFilters`: "Clear filters" shows in the toolbar while anything is applied, with results too.
- `listState`, `loading`, `loadingIdentity`, `onRetry`: request feedback ([section 7](#7-list-feedback-states)).
- `getColumnLabel`: translated column names for `DataTableViewOptions` and the phone "Sort" menu.
- `toolbar`: `(table) => ReactNode` after search and filters, for `DataTableViewOptions`, export or bulk actions; never search, filters or a sort menu.
- `renderCard`, `actionsColumnId` (default `'actions'`), `selectionColumnId` (default `'select'`): [phone cards](#phone-cards).
- Server state: `manualPagination`, `rowCount`, `paginationState`, `onPaginationChange`, `manualSorting`, `sortingState`, `onSortingChange`, `sortableColumns`.
- `pagination` (`false` hides it), `pageSize`, `pageSizeOptions`, `showSelectedCount` (`false` without selection).
- `emptyMessage`, `emptyAction`: business content for a successful unfiltered empty result; never the standard create button.
- `onRowClick`, `className`. Avoid `onRowClick` when rows hold links or menus; it is not keyboard reachable, so the name still links.

## 3. Known DataTable behavior

- The pagination bar shows "N of M row(s) selected": pass `showSelectedCount={false}` without selection.
- `DataTableViewOptions` and a sortable header's "Hide" use raw ids and can hide a column for good: pass `getColumnLabel` and offer `DataTableViewOptions` in `toolbar`, or set `enableHiding: false`.
- There is no initial sort: the endpoint returns the default order (T1.8); a URL-sorted list passes `defaultSorting` to `useTableUrlState`.
- Browser sorting compares code units: sort Chinese with a `sortingFn` using `Intl.Collator(locale)`, or not at all.
- Uncontrolled paging returns to page 1 when data changes: use `useTableUrlState` to keep the page.

### Phone cards

Pass `renderCard` for an ordinary business list (T1.13). Below `md` the rows become cards with the same states, selection and pagination; the first render already knows the width, so a phone never flashes the table.

```tsx
<DataTable
  {...tableProps}
  columns={columns}
  data={rows}
  getRowId={(row) => row.id}
  search={
    <DataTableSearch
      value={q}
      label={t('projects.search')}
      onSearch={(value) => setFilter('q', value)}
    />
  }
  filters={
    <DataTableFilter label={t('projects.fields.status')}>
      <StatusFilter value={status} onChange={(v) => setFilter('status', v)} />
    </DataTableFilter>
  }
  filterCount={status ? 1 : 0}
  filtered={Boolean(q || status)}
  onClearFilters={clearFilters}
  summary={t('projects.count', { count: total })}
  getColumnLabel={(column) => t(`projects.fields.${column.id}`)}
  renderCard={(row, card) => (
    <ProjectCard project={row.original} actions={card.actions} />
  )}
/>
```

- A card is `rounded-lg border p-4`: the name link with its status `Badge`, two or three key fields, then `card.actions`. A card that ignores `card.actions` still gets them in its corner; never add a second, different action control.
- With `getColumnLabel` the phone toolbar gets the "Sort" menu by itself; render `DataTableSortMenu` only for a list outside `DataTable`.
- With selection, the card renders a `Checkbox` from `row.getIsSelected()`/`row.toggleSelected`; the `select` column header renders above the cards as "Select all on this page".
- Omit `renderCard` only for rows compared across columns; the table then scrolls sideways in its own frame.

## 4. Changing shared components

Extend `client/components/` compositions only with optional props that keep the default, and list the change in the final report. Never edit `client/components/ui/` primitives for one page.

## 5. Writing search and filters to the URL

Search, filters, page and sort live in the URL (T1.7); the request is built from the URL, never from input state.

- Search is `DataTableSearch` (`value`, `onSearch`, `label`, optional `placeholder`, `debounceMs`). It owns the typed text, applies it 300 ms after typing pauses or on Enter, never mid-IME composition, and follows the URL when it changes elsewhere. `onSearch` writes `q` with `{ replace: true }` and deletes `page`. Never hand-make a search input or bind an `<Input>` to `searchParams` (it loses IME input, A7). The `placeholder` names the searched fields (T1.1).
- Each filter control has its own `aria-label`, writes its parameter and deletes `page`; `'all'`, `null` and unknown values mean no filter.
- `clearFilters` removes `q`, the filters and `page` in one `setParams`, keeping sort and page size, then focuses the search box (A6).
- A list below another page (a record's tab, a drawer) names its parameters after what it lists (`ordersQ`) and never touches the parent's `q` or `status`.

## 6. Loading the list

```tsx
const { params, active } = useListLocation();
const requestPath = `projects?${remoteQuery(params)}`;
const request = useListData<ProjectList>(requestPath, {
  active,
  keepPreviousData: true,
  scopes: [projectsScope],
});
const { error: tableError, ...tableProps } = useTableUrlState({
  active,
  revision: request.revision,
  sortColumns: ['name', 'updatedAt'],
  rowCount:
    request.path === requestPath && !request.loading && !request.error
      ? request.data?.meta.total
      : undefined,
});
```

- While a child route covers the list, `active` is false: rows and query stay, nothing is sent, and one read follows the return. Pass `loading={active && request.loading}`.
- `request.path` names the query the shown rows answer; derive "rows are filtered" from it, not the URL, so clearing filters never flashes "No data yet".
- `rowCount` only for the current successful query.
- Writes refresh through `scopes` ([`data-changes.md`](data-changes.md)); there is no Refresh button. `request.reload` is for Retry only.

## 7. List feedback states

Resolve the snapshot with `resolveListState` from `@nocobase/app-client` and pass it as `listState`; a card list outside `DataTable` uses `ListFeedback` and `ListFeedbackActions` from `#components/list-feedback`.

```tsx
const current = request.path === requestPath;
const state = resolveListState(
  {
    data: current ? request.data : undefined,
    error: tableError ?? request.error,
    isPending: request.loading && !current,
  },
  current ? (request.data?.meta.total ?? 0) : 0,
  shownRowsFiltered,
);
const rows = listStateShowsData(state) ? (request.data?.data ?? []) : [];
// <DataTable listState={state} loading={active && request.loading} onRetry={request.reload} onClearFilters={clearFilters} … />
```

Each state is one icon and one short translated line (S1–S4, C4): first load → Loading (never empty); covered without data → nothing; successful empty → "No data yet"; empty with filters → "No results" with Clear; 403 → "Access denied", rows and header create hidden; 401 → "Session expired" with the sign-in flow; failure without data → "Unable to load list" with Retry; refresh failure → previous rows plus one stale-data line. Never turn an error into an empty array or probe for existence.

A card list keeps the actions in its own toolbar:

```tsx
<>
  <ListFeedbackActions
    state={state}
    filtered={filtered}
    onClear={clearFilters}
    onRetry={request.reload}
    busy={active && request.loading}
  />
  {active || state !== 'loading' ? (
    <ListFeedback state={state} identity={request.path}>
      <ProjectCards rows={rows} />
    </ListFeedback>
  ) : null}
</>
```

Show the header's create button once the permission check (for example `useCan` from `@nocobase/app-plugin-authorization/client`) resolves to allowed and the state is `ready`, `empty`, `no-results` or `refresh-failed` (L7).

## 8. Column definitions and row actions

- `columns` in `useMemo`, depending on `t`, formatters and `location.search`.
- The first column is the name (T1.3): a `RecordLink` (`#components/record-link`) with a relative path that keeps the query, `to={{ pathname: row.original.id, search: location.search }}` (`${id}/details` for a detail page, [`page.md`](page.md)).
- Sortable columns (T1.8) use `DataTableColumnHeader` and `enableHiding: false`; a server list lists them in `sortColumns`.
- Status is text in a `Badge` (T1.4); empty is "—" in `text-muted-foreground`; dates and numbers use `Intl` formatters from `useLocale()`'s `locale`, in `useMemo` (T1.6). Right-align numbers in a `div` (`text-right tabular-nums`); a sortable one passes `className='justify-end text-right'` to `DataTableColumnHeader`.
- A width-limited cell truncates (`block max-w-60 truncate`) and shows the full value on hover only when cut off (T1.11): a `Tooltip` whose `onOpenChange` calls `details.cancel()` when `trigger.scrollWidth <= trigger.clientWidth`. A truncated `Badge` uses a hover `Popover` instead.

Row actions are `RowActions` from `#components/row-actions` (T1.5): one "⋮" menu at the row's end, nothing when the viewer has no action. Do not compose menus or buttons in the cell, and do not size its trigger.

```tsx
{
  id: 'actions',
  enableHiding: false,
  header: () => <span className='sr-only'>{t('projects.actions.label')}</span>,
  cell: ({ row }) => (
    <RowActions
      label={t('projects.actions.more', { name: row.original.name })}
      actions={[
        canUpdate && {
          key: 'edit',
          label: t('projects.actions.edit'),
          render: <Link to={{ pathname: `${row.original.id}/edit`, search: location.search }} />,
        },
        canDelete && {
          key: 'delete',
          label: t('projects.actions.delete'),
          destructive: true,
          onClick: () => setDeletion({ open: true, project: row.original }),
        },
      ]}
    />
  ),
}
```

- A `RowAction` has `key`, `label` (a verb, C3), `onClick` or `render` (a `<Link>` for a child route), `destructive` (last, after a separator) and `disabled` (temporarily unavailable). Leave out what the viewer may never do; choose state-dependent actions (Start/Stop) in the array.
- `exposed={['start']}` shows up to two primary actions named in the page plan as buttons before the "⋮"; the rest stay in the menu.
- Clicks in `RowActions` do not reach `onRowClick`. The column has no header text, fixed width or pinning.
- An action with consequences confirms first (I2) and ends in a toast or error; delete is in [`overlay.md`](overlay.md#4-delete-confirmation-alertdialog).

### Selection and bulk actions

Add selection only for a bulk action (L5). The first column has id `select`: its header `Checkbox` uses `table.getIsAllPageRowsSelected()`, `indeterminate` for a partial page and `table.toggleAllPageRowsSelected`; each cell uses `row.getIsSelected()` with an `aria-label` naming the record. Read `table.getSelectedRowModel().rows` in `toolbar` and show the bulk action, with the count in its label, only when rows are selected. A destructive one confirms with the count (I2), calls one bulk endpoint, announces, reports partial failures and calls `table.resetRowSelection()`.

## 9. Child routes and refreshing the list

- "New project" is `<Button nativeButton={false} render={<Link to={{ pathname: 'new', search: location.search }} />}>`.
- Place a plain `<Outlet />` at the end of `PageContainer`, with no `reload`, `onSaved` or `afterDelete` context: child routes announce their writes and the list follows its `scopes` ([`data-changes.md`](data-changes.md)).
- When a delete removes the focused row, focus the search box or a focusable page region after the return read (A6).

## 10. Verification

- Chinese IME, editing mid-text and fast typing lose nothing; about 300 ms later `?q=` appears and old rows stay while new ones load. A filter changed right after typing keeps both.
- Refresh, back, forward and the sidebar entry keep input, filters and list consistent. "Clear filters" clears in one step and focuses the search box without flashing "No data yet".
- Every [section 7](#7-list-feedback-states) state appears with its icon and line.
- Name link, "New" and "Edit" open their child routes, also by direct URL; closing keeps the query; saving or deleting updates the list on return.
- Date and number columns sort; a server list keeps the sort in the URL and restarts at page 1.
- At 1440 and 390 px: search, "Filters" and "Sort" share one row above the cards, nothing scrolls sideways, both themes and languages read correctly.

### Restore list position

`useTableUrlState({ sortColumns, defaultSorting, defaultPageSize, pageSizeOptions, sortFormat, rowCount, active, revision })` maps `page`, `pageSize` and `sort`/`order` (or `orderBy` with `sortFormat: 'orderBy'`) to controlled table state and returns `paginationState`, `onPaginationChange`, `sortingState`, `onSortingChange`, `sortableColumns`, `pageSizeOptions` and `error`. Page-size and sort changes reset the page; invalid values fall back to defaults. When the request is built before the hook, call `readTableUrlState(params, options)` with the same options instead of parsing the sort yourself. Tabbed lists and private conditions follow [`child-routes.md`](child-routes.md).
