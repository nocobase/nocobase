# MultiRecordResource

A collection-oriented Resource: requests return an array and support pagination, filtering, sorting, and CRUD operations. It is suitable for "multiple records" scenarios such as tables and lists. Unlike [APIResource](./api-resource.md), MultiRecordResource specifies the resource name via `setResourceName()`, automatically constructs URLs like `users:list` and `users:create`, and includes built-in capabilities for pagination, filtering, and row selection.

**Inheritance**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Creation**: `ctx.makeResource('MultiRecordResource')` or `ctx.initResource('MultiRecordResource')`. Before use, you must call `setResourceName('collectionName')` (e.g., `'users'`). In RunJS, `ctx.api` is injected by the runtime environment.

---

## Use Cases

| Scenario | Description |
|------|------|
| **Table Blocks** | Table and list blocks use MultiRecordResource by default, supporting pagination, filtering, and sorting. |
| **JSBlock Lists** | Load data from collections like users or orders in a JSBlock and perform custom rendering. |
| **Bulk Operations** | Use `getSelectedRows()` to get selected rows and `destroySelectedRows()` for bulk deletion. |
| **Association Resources** | Load associated collections using formats like `users.tags`, which requires `setSourceId(parentRecordId)`. |

---

## Data Format

- `getData()` returns an **array of records**, which is the `data` field from the list API response.
- `getMeta()` returns pagination and other metadata: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Resource Name and Data Source

| Method | Description |
|------|------|
| `setResourceName(name)` / `getResourceName()` | The resource name, e.g., `'users'`, `'users.tags'` (association resource). |
| `setSourceId(id)` / `getSourceId()` | The parent record ID for association resources (e.g., for `users.tags`, pass the primary key of the user). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Data source identifier (used in multi-data source scenarios). |

---

## Request Parameters (Filter / Fields / Sort)

| Method | Description |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filter by primary key (for single record `get`, etc.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Filter conditions, supporting operators like `$eq`, `$ne`, `$in`, etc. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Filter groups (for combining multiple conditions). |
| `setFields(fields)` / `getFields()` | Requested fields (whitelist). |
| `setSort(sort)` / `getSort()` | Sorting, e.g., `['-createdAt']` for descending order by creation time. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Association loading (e.g., `['user', 'tags']`). |

---

## Pagination

| Method | Description |
|------|------|
| `setPage(page)` / `getPage()` | Current page (starting from 1). |
| `setPageSize(size)` / `getPageSize()` | Number of items per page, default is 20. |
| `getTotalPage()` | Total number of pages. |
| `getCount()` | Total number of records (from server-side meta). |
| `next()` / `previous()` / `goto(page)` | Change page and trigger `refresh`. |

---

## Selected Rows (Table Scenarios)

| Method | Description |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Currently selected row data, used for bulk deletion and other operations. |

---

## CRUD and List Operations

| Method | Description |
|------|------|
| `refresh()` | Requests the list with current parameters, updates `getData()` and pagination meta, and triggers the `'refresh'` event. |
| `get(filterByTk)` | Requests a single record and returns it (does not write to `getData`). |
| `create(data, options?)` | Creates a record. Optional `{ refresh: false }` prevents automatic refresh. Triggers `'saved'`. |
| `update(filterByTk, data, options?)` | Updates a record by its primary key. |
| `destroy(target)` | Deletes records. `target` can be a primary key, a row object, or an array of primary keys/row objects (bulk delete). |
| `destroySelectedRows()` | Deletes currently selected rows (throws an error if none are selected). |
| `setItem(index, item)` | Replaces a specific row of data locally (does not initiate a request). |
| `runAction(actionName, options)` | Calls any resource action (e.g., custom actions). |

---

## Configuration and Events

| Method | Description |
|------|------|
| `setRefreshAction(name)` | The action called during refresh, default is `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Request configuration for create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Triggered after refresh completion or after saving. |

---

## Examples

### Basic List

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtering and Sorting

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Association Loading

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Create and Pagination

```js
await ctx.resource.create({ name: 'John Doe', email: 'john.doe@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Bulk Delete Selected Rows

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Please select data first');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted'));
```

### Listening to the refresh Event

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Association Resource (Sub-table)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Notes

- **setResourceName is Required**: You must call `setResourceName('collectionName')` before use, otherwise the request URL cannot be constructed.
- **Association Resources**: When the resource name is in the format `parent.child` (e.g., `users.tags`), you must call `setSourceId(parentPrimaryKey)` first.
- **Refresh Debouncing**: Multiple calls to `refresh()` within the same event loop will only execute the last one to avoid redundant requests.
- **getData returns an Array**: The `data` returned by the list API is an array of records, and `getData()` returns this array directly.

---

## Related

- [ctx.resource](../context/resource.md) - The resource instance in the current context
- [ctx.initResource()](../context/init-resource.md) - Initialize and bind to ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Create a new resource instance without binding
- [APIResource](./api-resource.md) - General API resource requested by URL
- [SingleRecordResource](./single-record-resource.md) - Oriented towards a single record