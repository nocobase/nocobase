# List pages

A list page is for browsing, finding and managing one kind of record. Its structure, top to bottom (guideline T1): `PageHeader` (primary button "New X") → toolbar (search, filters, clear filters) → table → pagination. Create, detail and edit are child-route overlays, rendered in the `<Outlet />` at the end of the list page (see [`overlay.md`](overlay.md)).

This document uses `client/pages/projects/index.tsx` as its example; the complete code is in [section 10](#10-complete-code). For the route declaration see [`page.md`](page.md); for the file layout of child routes see [`child-routes.md`](child-routes.md).

## 1. Choosing a table component

Build every list with `DataTable` (`@/components/data-table`, built on TanStack Table) and its companions in `client/components/data-table/`: `DataTableColumnHeader` (a sortable column header), `DataTablePagination` (the pagination bar) and `DataTableViewOptions` (the "Toggle columns" menu). They are the application's own: before the first list, build them in that directory from the `button`, `dropdown-menu`, `select` and `table` primitives and `@tanstack/react-table` (in `devDependencies`), following shadcn's [Data Table guide](https://ui.shadcn.com/docs/components/data-table) and giving `DataTable` the props of [section 2](#2-datatable-props). Do not write a list from scratch with `Table`. The one exception is server-side pagination below. A short list of records inside a card, such as a dashboard's, is a `DataTable` too, with plain headers and `pagination={false}` (guideline T5.3); in an ordinary `CardContent` it lines up with the card's title by itself ("Table in a card" in ["Common layouts" of `styling.md`](styling.md#common-layouts); [`example/project-dashboard.md`](example/project-dashboard.md)).

| Scenario                                                                                                | What to use                                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A list that fits in one page of the endpoint (at most 100 records), sorted and paginated in the browser | `DataTable`, with the cap notice when `meta.total` exceeds the rows returned (guideline T1.10, [section 6](#6-loading-the-list)) |
| Larger data sets that the endpoint paginates, returning the total                                       | `ProjectsServerTable` ([`example/server-table.md`](example/server-table.md)), described below                                    |

- Leave search and filtering to the backend: pass the filters as endpoint parameters; `DataTable` only displays, sorts and paginates.
- The complete list page, [`example/list-page.md`](example/list-page.md), shows column definitions, the toolbar outside `DataTable`, a row actions menu and the four states working together.

Server-side pagination, when the endpoint takes `page` and `pageSize` and returns the total. `DataTable` paginates in the browser only, so the page renders `ProjectsServerTable` instead: the same markup as `DataTable`, a TanStack table with `manualPagination` and `rowCount`, and `DataTablePagination` below it. [`example/server-table.md`](example/server-table.md) has both the component and the complete list page that uses it:

- Keep `page` and `pageSize` in the URL beside `q` and `status`, written through the same `updateParams` ([section 5](#5-writing-search-and-filters-to-the-url)), and reset `page` when a filter changes. Include both in the request key and in `query`.
- Pass the component the current page's rows, the returned total, `{ pageIndex: page - 1, pageSize }` read from the URL, and an `onPaginationChange` that writes the new values back to the URL; the request follows the URL.
- Sort on the server, never one page in the browser: the sort lives in the URL as `orderBy` (`updatedAt desc`, the default, or `name`), goes to the endpoint with the page, and `ProjectsServerTable` hands it to the table with `manualSorting`, so the header shows its direction ([`example/server-table.md`](example/server-table.md)). A new sort starts on the first page.
- The four states in [section 7](#7-the-four-list-states) and the loading rules in [section 6](#6-loading-the-list) stay the same; while a page loads, keep the previous page's rows on screen. Decide "empty" by the endpoint's `total`, not by an empty page: a page past the end is empty while records exist.

## 2. DataTable props

| Prop                          | Description                                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`                     | `ColumnDef<T>[]`, created with `useMemo`                                                                                                                                                            |
| `data`                        | Row data, `T[]`                                                                                                                                                                                     |
| `getRowId`                    | Returns a stable row id, for example `(row) => row.id`                                                                                                                                              |
| `emptyMessage`                | What the table shows when there are no rows (default: "No results."); use it for the no-results message and "Clear filters"                                                                         |
| `pageSize`, `pageSizeOptions` | Rows per page, default 10; the selectable rows-per-page values default to `[10, 20, 30, 40, 50]`                                                                                                    |
| `pagination`                  | When set to `false`, all rows are shown and there is no pagination bar                                                                                                                              |
| `toolbar`                     | `(table) => ReactNode`, rendered above the table inside `DataTable`, with access to the table instance. For browser-side filtering and `DataTableViewOptions`                                       |
| `onRowClick`                  | Makes the whole row clickable. Do not use it when the row contains links, buttons or menus, because the clicks conflict. It does not work from the keyboard, so the first column still needs a link |
| `className`                   | Class name of the outer container                                                                                                                                                                   |
| `showSelectedCount`           | Defaults to `true`; pass `false` on a table without row selection so the pagination bar does not show "0 of N row(s) selected"                                                                      |

## 3. Known DataTable behavior

The following holds for `client/components/data-table/` built from shadcn's [Data Table guide](https://ui.shadcn.com/docs/components/data-table) with the props of section 2. Know these points before you use it, and handle them as needed in the design and the implementation:

| Behavior                                                             | Impact                                                                                                                                                                         | What to do                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The pagination bar shows "N of M row(s) selected" by default         | A table without row selection would show "0 of N row(s) selected."                                                                                                             | Pass `showSelectedCount={false}` on a table without selection. An application generated before `DataTable` had this prop adds it: `readonly showSelectedCount?: boolean` in `DataTableProps`, defaulted to `true` and passed to `<DataTablePagination>`                                    |
| `DataTableViewOptions` shows raw column ids and is hidden below `lg` | Without `getColumnLabel` the menu lists `column.id` (untranslated, guideline C1); its trigger is `hidden lg:flex`, so on phones and tablets a hidden column cannot be restored | Render it as `toolbar={(table) => <DataTableViewOptions table={table} getColumnLabel={(column) => t(…)} />}` with translated labels. When the page does not need column toggling, set `enableHiding: false` on the columns instead of offering the menu                                    |
| The header menu of a sortable column includes "Hide"                 | If the page has no "Toggle columns" entry, a hidden column cannot be brought back                                                                                              | Write `enableHiding: false` in the column definition, or put `DataTableViewOptions` in `toolbar`                                                                                                                                                                                           |
| No initial sorting state                                             | The default order can only be the order the endpoint returns, and no header shows a sort direction until the user sorts                                                        | Have the endpoint return the default order (guideline T1.8: most recently updated first). The server-paginated table keeps the sort in the URL, so its header shows the default direction; if a browser-sorted list must show it too, add an optional `initialSorting` prop to `DataTable` |
| Returns to page 1 when the data changes                              | Search, filtering, refreshing and deleting all return to page 1                                                                                                                | Usually what you want. To stay on the current page, change `DataTable` (for example, add an `autoResetPageIndex` prop passed through to `useReactTable`) and handle the current page exceeding the page count after a delete                                                               |
| Browser-side sorting compares character codes                        | Chinese is not sorted by pinyin                                                                                                                                                | Offer no sorting on Chinese columns, or write a `sortingFn` in the column definition that compares with `Intl.Collator(locale)` (the example's name column does this)                                                                                                                      |
| The built-in `toolbar` container does not wrap                       | With several controls in it, it overflows on narrow screens                                                                                                                    | Put the page's own search and filters outside `DataTable`, using `flex flex-wrap` (as the example does)                                                                                                                                                                                    |

## 4. Changing shared components

- You may change the composed components under `client/components/` (`DataTable` and others): only add optional props and keep the default behavior unchanged, so other pages are unaffected; list these changes in the final report.
- Do not modify the primitives under `client/components/ui/` for a single page.
- When all tables need to change together (for example, the page-number width), change the shared component instead of building a separate version in one page.

## 5. Writing search and filters to the URL

The search term and filter values live in URL query parameters (`?q=…&status=…`), so a refresh, going back or a shared link restores them (guideline T1.7). Request parameters follow the URL, not the input.

- The search box's `placeholder` says which fields can be searched (guideline T1.1), for example "Search by name or owner". Both the search box and the filter controls need an `aria-label`.

### Parameter names below another page

A list rendered below another page — a tab of a record's page, a list in a drawer — shares the query string with the pages it sits on. Those pages keep their own search and filters there, and links carry them down so that going back restores them (guideline L6), so a list below them owns only the names it adds:

- Name its parameters after what it lists (`ordersQ`, `ordersStatus`; `useUrlSearch({ param: 'ordersQ' })`), never the `q` or `status` of a page above it.
- Read and change only those. A customers list's `?status=vip` must not filter the customer's orders, and clearing the orders' filters leaves it in place.
- Add them to the list of parameters the page that owns the list removes when the user leaves ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)).

### Do not bind the search box directly to the URL

Do not write `value={searchParams.get('q')}` together with a `setSearchParams` call in `onChange`. React Router changes the URL inside a transition, and between two keystrokes React resets the input to the old URL value: a Chinese input method leaves a string of raw pinyin in the box, the cursor jumps to the end when you edit in the middle, and fast typing drops characters (violating guideline A7). `tsc`, ESLint and tests that fill in a value in one step (such as Playwright's `fill()`) cannot catch this; verify with real character-by-character typing and an input method.

### What the list page does

Each behavior below is in `useUrlSearch` (`client/hooks/use-url-search.ts`, [`example/url-search.md`](example/url-search.md)), with the reason in a comment next to it; the names are its variables and functions. A list page calls the hook and spreads its `inputProps` onto the search box, as [`example/list-page.md`](example/list-page.md) does; do not reimplement it.

1. The input's text lives in state (`text`); typing starts a 300ms timer (`schedule`, guideline I5), and nothing is scheduled while an input method is composing (`isComposing`, then `onCompositionEnd`).
2. The timer writes `q` to the URL with `{ replace: true }` through `updateParams`, which starts from `paramsRef`, the latest parameters, instead of `setSearchParams((prev) => …)`, whose `prev` can be stale when two writes race. The request uses the trimmed value.
3. Back, forward and links update the input during render by comparing with `seenSearch`, never in an effect; a value this page wrote itself (`ownSearch`) does not overwrite what the user typed since; a timer whose `q` changed underneath it (router or address bar) drops its write.
4. The status filter passes `items` to `Select`; `'all'`, `null` and an unknown URL value all mean no filter (`isProjectStatus`).
5. "Clear filters" shows as soon as the input has text (the page's `hasFilters` reads `text`) and calls `clear`, which cancels the timer and empties the box and `q`, passing the page's own filters to remove (`status`); the page then focuses the search box (`searchRef`, guideline A6).

## 6. Loading the list

The pattern of ["Loading data in a component" in `api.md`](api.md#loading-data-in-a-component), with four list-specific points (all in [`example/list-page.md`](example/list-page.md)):

- The request key holds the filters and the reload count (`JSON.stringify([search, status ?? null, reloadCount])`); `loading` is derived from whether the stored result carries the current key. The search term goes to the endpoint as `q`.
- A reload keeps the previous rows on screen with a small `Spinner` in the toolbar (guideline I4), also after a failure, so "Retry" shows old data plus the spinner rather than the skeleton.
- The stored result records whether it was fetched with filters (`filtered`); "empty" and "no results" are decided by that flag, not by the current filters, so clearing filters never flashes "No projects yet".
- `reload` comes from `useReducer((count: number) => count + 1, 0)`: its identity is stable, so it goes into the child routes' context as is.

A list endpoint pages its result and caps `pageSize` at 100. A list sorted and paginated in the browser asks for one page of 100; when `meta.total` is larger than the rows returned, show "Only the first N records are shown. Use search or filters to narrow the results." above the table (guideline T1.10, `projects.capNotice` in [`example/list-page.md`](example/list-page.md)). It is information, not an error (guideline A8): `<Alert role='status'>` (props spread after the built-in `role='alert'`, so this overrides it) or a `text-sm text-muted-foreground` paragraph.

## 7. The four list states

Check them in the order "failed → first load → empty → data or no results" (guidelines S1–S4) and put the result in `content`:

| State              | Condition                                            | Shows                                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failed             | The current request failed                           | A destructive `Alert` chosen by status as ["Handling each kind of error" in `api.md`](api.md#handling-each-kind-of-error) says (401, 403, other); after "Retry", focus moves to the search box (guideline A6) |
| First load         | No data yet (`rows === undefined`)                   | The `TableSkeleton` skeleton: shaped like table rows, `role='status'`, accessible name "Loading"                                                                                                              |
| Empty              | No data, and this batch was not fetched with filters | `Empty`: icon, title, description and the "New project" button, which the page header leaves out while the list is empty (guidelines L7 and S2)                                                               |
| Data or no results | Anything else                                        | `DataTable`. When a filtered query finds nothing, `emptyMessage` shows "No projects match your filters" (`projects.empty.noResults`) and "Clear filters" (guideline S3)                                       |

- The toolbar shows in all four states and sits outside `DataTable`, so focus can always move to the search box.
- Error copy goes in the feature's own copy group: `projects.error.title`, `projects.error.forbidden`, `projects.error.requestFailed`.
- The application shell handles having no access to the whole page (guideline S6); the 403 here is the case where the page opens but the list endpoint refuses the request.

## 8. Column definitions and row actions

- Create `columns` with `useMemo`, and put everything it uses (`t`, the formatters, `location.search`) in the dependency array.
- **The first column is the name** (guideline T1.3), a `Link` to the detail child route: `to={{ pathname: row.original.id, search: location.search }}`. The path is relative and keeps the query parameters, so closing the detail view returns to the same filtered result.
- **Sortable columns** (guideline T1.8): make every date and time column (created, updated, due) and every number column sortable without being asked, and the name column when it sorts in the current language's order. Leave statuses, types, tags, people, long text and yes/no values as plain titles unless the business asks for them and the order means something.
- A sortable column uses `DataTableColumnHeader` as its `header` and sets `enableHiding: false` (see [section 3](#3-known-datatable-behavior)); a plain column uses the translated text directly. In a server-paginated list, the endpoint must accept the column in `orderBy`.
- Sorting Chinese names in the browser: `sortingFn` compares with `Intl.Collator(locale)`.
- **Show status as text in a Badge** (guideline T1.4): `ProjectStatusBadge` (`status-badge.tsx`; for the code see [`i18n.md`](i18n.md)) is shared by the list and the detail view, so a given status looks the same everywhere.
- **Show an empty value as "—"**, with `text-muted-foreground`.
- **Format times in the current language** (guideline T1.6): get `locale` from `useLocale()` and create the `Intl.DateTimeFormat` with `useMemo`, so it updates when the language switches.
- **Right-align numbers** (guideline T1.6): `DataTable` has no per-column alignment option, so align inside the header and the cell, in a `div` (`text-right` does nothing on an inline `span`): `header: () => <div className='text-right'>{t('projects.fields.budget')}</div>` and `cell: ({ row }) => <div className='text-right tabular-nums'>{amountFormat.format(row.original.budget)}</div>`, with `amountFormat` an `Intl.NumberFormat` created in `useMemo` from `locale`. For a sortable number column, pass the alignment to the header itself, with no wrapper: `<DataTableColumnHeader column={column} title={…} className='justify-end text-right' />` (its root is a flex row when the column sorts and a plain `div` when it does not, so both classes are needed). The sort button keeps its padding, so the title sits slightly left of the numbers.
- **Show a cut-off cell's full content on hover** (guideline T1.11): a cell does not wrap and the table widens to fit it, so content is cut off only where a column limits its width. There it ends in an ellipsis, and hovering shows the full value, but only when it is cut off:
  - Text, or a link such as the name column, uses a `Tooltip` whose trigger is the truncated element; `TooltipTrigger` leaves a `Link` a link. `onOpenChange` cancels the tooltip when the value fits:

    ```tsx
    <Tooltip
      onOpenChange={(open, details) => {
        // A value that fits needs no tooltip.
        const trigger = details.trigger;
        if (open && trigger && trigger.scrollWidth <= trigger.clientWidth) {
          details.cancel();
        }
      }}
    >
      <TooltipTrigger
        render={
          <Link
            to={{ pathname: row.original.id, search: location.search }}
            className='block max-w-60 truncate'
          />
        }
      >
        {value}
      </TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
    ```

    For plain text, render `<span className='block max-w-60 truncate' />` in place of the `Link`.

  - A `Badge` or other styled content goes in a `Popover` that opens on hover (`openOnHover delay={0}` on the trigger) instead: the tooltip surface is inverted, so a badge on it is unreadable.
  - `truncate` shows the ellipsis only on a block element. On a flex element such as `Badge` it clips without one, and the centered text loses both ends, so put the text in a `<span className='truncate'>` inside the badge and give the badge `min-w-0 shrink`. Do not use `line-clamp` in a cell: it needs text that wraps, which the cell prevents, so it only clips.
- **Put row actions in a "More" menu** (guideline T1.5):
  - The trigger is a ghost button with `size='icon-sm'` whose `aria-label` names the record; a button that opens a menu needs no tooltip (guideline A1).
  - "Edit" is a child route, so the menu item renders as a link: pass ``<Link to={{ pathname: `edit/${id}`, search: location.search }} />`` to `render` on `DropdownMenuItem`. `edit/:projectId` is the list's own edit route, so the dialog opens alone over the list and closing returns to it; the drawer's "Edit" uses the route stacked on the drawer instead ([section 2.1 of `overlay.md`](overlay.md#21-declare-the-child-routes)).
  - "Delete" uses `variant='destructive'`, comes last, is separated by a `DropdownMenuSeparator`, and opens the delete confirmation dialog when clicked.
  - Menu items are verbs only ("Edit", "Delete"); the row they are in determines the object (guideline C3).
- The delete confirmation dialog is `ProjectDeleteDialog`, driven by `deletion` state as [section 4 of `overlay.md`](overlay.md#4-delete-confirmation-alertdialog) describes; after a successful delete, refresh the list and move focus to the search box (`deletedFocusRef`).

### Selection and bulk actions

Add row selection only when the page has a bulk action (guideline L5: bulk actions appear only after rows are selected).

- `DataTable` already keeps the selection state; put a selection column first in `columns`. Its header checkbox selects the current page, it shows the indeterminate state for a partial selection, and each row's `aria-label` names the record (the `checkbox` primitive is added with `yes n | pnpm exec shadcn add checkbox`):

```tsx
// client/pages/projects/use-select-column.tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { Checkbox } from '@/components/ui/checkbox';

import type { Project } from './types.js';

/** The row selection column; the list page puts it first in its `columns`. */
export function useSelectColumn(): ColumnDef<Project> {
  const { t } = useTranslation();
  return useMemo<ColumnDef<Project>>(
    () => ({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked)
          }
          aria-label={t('projects.selection.all')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
          aria-label={t('projects.selection.row', { name: row.original.name })}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [t],
  );
}
```

- Pass `getRowId={(row) => row.id}` so the selection follows records, not row positions, across reloads.
- Read the selection in `toolbar={(table) => …}`, the only place the table instance is available: `table.getSelectedRowModel().rows` holds the selected rows on the current data. Render the bulk action there only when that list is not empty, with the count in its label ("Delete 3 projects"), and keep the page's own search and filters outside `DataTable` as [section 3](#3-known-datatable-behavior) says.
- A destructive bulk action opens an `AlertDialog` naming the count and the consequence (guideline I2), calls one bulk endpoint rather than one request per row, then refreshes the list and clears the selection with `table.resetRowSelection()`. When the endpoint reports that some records failed, say how many in the result toast.
- A table with selection keeps the default `showSelectedCount`, so the pagination bar shows "N of M row(s) selected".

## 9. Child routes and refreshing the list

- "New project" in the page header is a `Button` rendered as a `Link` to `new` that keeps the query string ([section 2 of `styling.md`](styling.md#2-components-are-built-on-base-ui-not-radix)).
- `<Outlet context={outletContext} />` goes at the end of `PageContainer`; the context is memoized, as [section 2.2 of `overlay.md`](overlay.md#22-place-the-outlet-in-the-parent-page) explains. It carries `reload` and `afterDelete` for the create dialog and the drawer (`ProjectsOutletContext`), and `onSaved` and `onNotFound` for the edit dialog a row's menu opens (`ProjectEditOutletContext`), both of which refresh the list.
- After a save, the child route calls `reload()`; the list refreshes in the background and keeps its rows.
- A delete from the detail drawer calls `afterDelete()` before closing: it refreshes the list and, once `loading` is false again, focuses the search box (`focusSearchAfterReloadRef`), because the row whose link had focus is gone (guideline A6). The list's own delete dialog focuses the search box directly (`deletedFocusRef`).

## 10. Complete code

The complete list page, `client/pages/projects/index.tsx`, is [`example/list-page.md`](example/list-page.md). Every variable and function named in sections [5](#5-writing-search-and-filters-to-the-url), [6](#6-loading-the-list), [7](#7-the-four-list-states), [8](#8-column-definitions-and-row-actions) and [9](#9-child-routes-and-refreshing-the-list) appears there.

## 11. Verification

Try it by hand in a browser; static checks cannot find input method and focus problems:

- Type with a Chinese input method, edit in the middle, and type quickly: the input drops no characters and the cursor does not jump; about 300ms after typing stops, `?q=` appears in the address bar and the list refreshes, keeping the old data and showing a Spinner while it refreshes.
- Change the status filter within 300ms of typing: the address bar keeps both `q` and `status`.
- Refresh the page, use the browser's back and forward, and click the sidebar menu: the input, the filters and the list stay consistent.
- "Clear filters": appears as soon as the first character is typed; after a click, the button disappears, focus is on the search box, and "No projects yet" does not flash.
- All four states have appeared: the first-load skeleton, empty, no results, and failed (403 has no "Retry"; for other errors, focus is on the search box after "Retry").
- The name link, "New project" and the "Edit" menu item open their child routes, "Edit" as the dialog alone; opening a child route's URL directly also works; after closing, the query parameters are still there.
- The date and number columns sort, and a server-paginated list keeps the sort in the URL and starts it on the first page.
- Delete a record in the detail drawer: after the list refreshes, focus is on the search box.
- At a width of 375px, the toolbar wraps and the table scrolls horizontally; everything is legible in both the light and dark themes (guidelines A4 and F6).
