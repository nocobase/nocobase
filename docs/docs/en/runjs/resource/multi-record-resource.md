# MultiRecordResource

A resource for **collections/lists**. Requests return arrays and support pagination, filtering, sorting, and CRUD. Suitable for tables and list views.

Inheritance: FlowResource -> APIResource -> BaseRecordResource -> MultiRecordResource. It provides the request capability of [APIResource](/runjs/resource/api-resource) and extends resource name, filters, pagination, and CRUD.

Creation: `ctx.makeResource('MultiRecordResource')` or `ctx.initResource('MultiRecordResource')`. Call `setResourceName('collection')` (e.g. `'users'`) before use, and it relies on `ctx.api`.

---

## Resource name and data source

| Method | Description |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Resource name, e.g. `'users'`, `'users.tags'` |
| `setSourceId(id)` / `getSourceId()` | Parent record ID for related resources |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Data source key |

---

## Request parameters (filter / fields / sort)

| Method | Description |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Primary key filter (single get, etc.) |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Filter conditions |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Filter groups |
| `setFields(fields)` / `getFields()` | Requested fields |
| `setSort(sort)` / `getSort()` | Sort |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Association expansion |

---

## Pagination

| Method | Description |
|------|------|
| `setPage(page)` / `getPage()` | Current page |
| `setPageSize(size)` / `getPageSize()` | Page size |
| `getTotalPage()` | Total pages |
| `getCount()` | Total count (from server meta) |
| `next()` / `previous()` / `goto(page)` | Change page and trigger `refresh` |

---

## Selected rows (table scenarios)

| Method | Description |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Current selected row data |

---

## CRUD and list operations

| Method | Description |
|------|------|
| `refresh()` | Request list with current params, update `getData()` and pagination meta |
| `get(filterByTk)` | Request single item and return it |
| `create(data, options?)` | Create; optional `{ refresh: false }` to skip auto refresh |
| `update(filterByTk, data, options?)` | Update by primary key |
| `destroy(filterByTk | row | row[])` | Delete by primary key or row object(s) |
| `destroySelectedRows()` | Delete currently selected rows |
| `setItem(index, item)` | Replace a row locally |
| `runAction(actionName, options)` | Call any resource action (e.g. custom action) |

---

## Configuration and events

| Method | Description |
|------|------|
| `setRefreshAction(name)` | Action used for refresh, default `'list'` |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Request config for create/update |
| `on('refresh', fn)` / `on('saved', fn)` | Triggered on refresh complete, after save |

---

## Example

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();

// Create
await ctx.resource.create({ name: 'Alice' });

// Pagination
await ctx.resource.next();
```
