# SQLResource

Resource that runs queries via **saved SQL config** or **dynamic SQL**; data comes from `flowSql:run` / `flowSql:runById`, etc. Use for reports, stats, custom SQL lists. Unlike [MultiRecordResource](./multi-record-resource.md), SQLResource does not depend on data tables and runs SQL directly; supports pagination, parameter binding, template variables (`{{ctx.xxx}}`), and result type control.

**Inheritance**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Create with**: `ctx.makeResource('SQLResource')` or `ctx.initResource('SQLResource')`. For saved-config execution call `setFilterByTk(uid)` (SQL template uid); for debugging use `setDebug(true)` + `setSQL(sql)` to run SQL directly; RunJS injects `ctx.api`.

---

## Use cases

| Scenario | Description |
|----------|-------------|
| **Reports / stats** | Complex aggregations, cross-table queries, custom metrics |
| **JSBlock custom list** | Use SQL for special filter, sort, or join; render custom UI |
| **Chart block** | Save SQL template to drive chart data source; supports pagination |
| **vs ctx.sql** | Use SQLResource when you need pagination, events, or reactive data; use `ctx.sql.run()` / `ctx.sql.runById()` for simple one-off queries |

---

## Data format

- `getData()` returns different formats based on `setSQLType()`:
  - `selectRows` (default): **array**, multiple rows
  - `selectRow`: **single object**
  - `selectVar`: **scalar value** (e.g. COUNT, SUM)
- `getMeta()` returns pagination meta: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## SQL config and execution mode

| Method | Description |
|--------|-------------|
| `setFilterByTk(uid)` | SQL template uid to run (for runById; must be saved first) |
| `setSQL(sql)` | Raw SQL (only in debug mode `setDebug(true)` for runBySQL) |
| `setSQLType(type)` | Result type: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | When true, refresh uses `runBySQL()`; otherwise `runById()` |
| `run()` | Calls `runBySQL()` or `runById()` depending on debug |
| `runBySQL()` | Run current `setSQL` SQL (requires setDebug(true)) |
| `runById()` | Run saved SQL template by current uid |

---

## Params and context

| Method | Description |
|--------|-------------|
| `setBind(bind)` | Bound variables; object with `:name`, array with `?` |
| `setLiquidContext(ctx)` | Template context (Liquid) for `{{ctx.xxx}}` |
| `setFilter(filter)` | Extra filter (passed in request data) |
| `setDataSourceKey(key)` | Data source key (for multiple data sources) |

---

## Pagination

| Method | Description |
|--------|-------------|
| `setPage(page)` / `getPage()` | Current page (default 1) |
| `setPageSize(size)` / `getPageSize()` | Page size (default 20) |
| `next()` / `previous()` / `goto(page)` | Change page and trigger refresh |

Use `{{ctx.limit}}` and `{{ctx.offset}}` in SQL for pagination; SQLResource injects `limit` and `offset` into context.

---

## Data fetch and events

| Method | Description |
|--------|-------------|
| `refresh()` | Run SQL (runById or runBySQL); write result to `setData(data)` and update meta; emit `'refresh'` |
| `runAction(actionName, options)` | Call underlying APIs (e.g. `getBind`, `run`, `runById`) |
| `on('refresh', fn)` / `on('loading', fn)` | Fired when refresh completes or loading starts |

---

## Examples

### Run by saved template (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // Saved SQL template uid
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, etc.
```

### Debug mode: run SQL directly (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Pagination and navigation

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigate pages
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Result types

```js
// Multiple rows (default)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Single row
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Single value (e.g. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Use template variables

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Listen to refresh event

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Notes

- **runById requires saved template**: `setFilterByTk(uid)` uid must be a saved SQL template ID; save via `ctx.sql.save({ uid, sql })`.
- **Debug mode needs permission**: `setDebug(true)` uses `flowSql:run`; requires SQL config permission. `runById` only needs login.
- **refresh debounce**: Multiple `refresh()` calls in the same event loop only run the last one to avoid duplicate requests.
- **Parameter binding prevents injection**: Use `setBind()` with `:name` / `?` placeholders; avoid string concatenation to prevent SQL injection.

---

## Related

- [ctx.sql](../context/sql.md) - SQL execution and management; `ctx.sql.runById` for simple one-off queries
- [ctx.resource](../context/resource.md) - Resource instance in current context
- [ctx.initResource()](../context/init-resource.md) - Initialize and bind to ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Create resource instance without binding
- [APIResource](./api-resource.md) - Generic API resource
- [MultiRecordResource](./multi-record-resource.md) - For data tables/lists
