# MultiRecordResource

Resource for **collections / lists** of records. Responses are arrays and support pagination, filtering, sorting and full CRUD. Commonly used in table / list blocks and other “multiple records” scenarios.

Inheritance: `FlowResource → APIResource → BaseRecordResource → MultiRecordResource`. It has all [APIResource](../api-resource/index.md) capabilities, plus helpers for resource name, list filters, pagination and list‑level operations.

Create it via `ctx.makeResource('MultiRecordResource')` or `ctx.initResource('MultiRecordResource')`. Before use, call `setResourceName('collection')` (e.g. `'users'`), and ensure it uses `ctx.api`.

## Resource name and data source

- `setResourceName(name)` / `getResourceName()` – resource name, e.g. `'users'`, `'users.tags'`
- `setSourceId(id)` / `getSourceId()` – parent record id when working with associated resources
- `setDataSourceKey(key)` / `getDataSourceKey()` – data source identifier

## Request parameters (filter / fields / sort)

- `setFilterByTk(tk)` / `getFilterByTk()` – primary key filter (for single `get` calls)
- `setFilter(filter)` / `getFilter()` / `resetFilter()` – filter object for list queries
- `addFilterGroup(key, filter)` / `removeFilterGroup(key)` – named filter groups
- `setFields(fields)` / `getFields()` – requested fields
- `setSort(sort)` / `getSort()` – sort configuration
- `setAppends(appends)` / `getAppends()` / `addAppends()` / `removeAppends()` – relation expansion

These parameters control which records and which fields are loaded in the list.

## Pagination

- `setPage(page)` / `getPage()` – current page
- `setPageSize(size)` / `getPageSize()` – page size
- `getTotalPage()` – total number of pages
- `getCount()` – total record count (from server meta)
- `next()` / `previous()` / `goto(page)` – change page and trigger `refresh`

## Selected rows (table scenarios)

- `setSelectedRows(rows)` / `getSelectedRows()` – manage current selection

Useful for batch operations in table blocks (delete selected, export selected, etc.).

## CRUD and list operations

- `refresh()` – list query with current parameters, updates `getData()` and pagination meta
- `get(filterByTk)` – fetch a single record by primary key
- `create(data, options?)` – create a record; `{ refresh?: boolean }` controls auto‑refresh
- `update(filterByTk, data, options?)` – update a record by primary key
- `destroy(filterByTk | row | row[])` – delete by id or by row object(s)
- `destroySelectedRows()` – delete the currently selected rows
- `setItem(index, item)` – locally replace one row in the list
- `runAction(actionName, options)` – call any underlying resource action (including custom actions)

## Configuration and events

- `setRefreshAction(name)` – action name used for `refresh`, defaults to `'list'`
- `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` – request options for create / update
- `on('refresh', fn)` / `on('saved', fn)` – respond to list refresh and save events

## Example

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);

await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();

// Create
await ctx.resource.create({ name: 'Zhang San' });

// Pagination
await ctx.resource.next();
```