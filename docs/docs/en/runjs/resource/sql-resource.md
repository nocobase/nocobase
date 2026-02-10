# SQLResource

A resource that executes queries using **saved SQL configs** or **dynamic SQL**. Data comes from `flowSql:run` / `flowSql:runById`. Suitable for reports, statistics, and custom SQL lists.

Inheritance: FlowResource -> APIResource -> BaseRecordResource -> SQLResource. It provides the request capability of [APIResource](/runjs/resource/api-resource) and extends SQL type, bind, pagination, and `run`/`runById`.

Creation: `ctx.makeResource('SQLResource')` or `ctx.initResource('SQLResource')`. For config-based execution use `setFilterByTk(uid)` (SQL config uid). For debugging, use `setDebug(true)` + `setSQL(sql)` to execute raw SQL.

---

## SQL config and execution mode

| Method | Description |
|------|------|
| `setFilterByTk(uid)` | Set SQL config uid to execute (for runById) |
| `setSQL(sql)` | Set raw SQL (only used in debug mode with `setDebug(true)`) |
| `setSQLType(type)` | Result type: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | When true, refresh uses `runBySQL()`, otherwise `runById()` |
| `run()` | Calls `runBySQL()` or `runById()` based on debug |
| `runBySQL()` | Execute current `setSQL` SQL (requires `setDebug(true)`) |
| `runById()` | Execute saved SQL config by uid |

---

## Parameters and context

| Method | Description |
|------|------|
| `setBind(bind)` | Bind variables (object or array) |
| `setLiquidContext(ctx)` | Template context (Liquid) |
| `setFilter(filter)` | Filter (sent in request data) |
| `setDataSourceKey(key)` | Data source key |

---

## Pagination

| Method | Description |
|------|------|
| `setPage(page)` / `getPage()` | Current page (default 1) |
| `setPageSize(size)` / `getPageSize()` | Page size (default 20) |
| `next()` / `previous()` / `goto(page)` | Change page and trigger refresh |

---

## Fetch data and events

| Method | Description |
|------|------|
| `refresh()` | Execute SQL (runById or runBySQL), write result via `setData(data)` and update meta |
| `runAction(actionName, options)` | Call underlying endpoints (e.g. `getBind`, `run`, `runById`) |
| `on('refresh', fn)` / `on('loading', fn)` | Triggered on refresh complete and on loading start |

---

## Example

```js
const res = ctx.makeResource('SQLResource');

// Debug: execute raw SQL
res.setDebug(true);
res.setSQL('SELECT * FROM users LIMIT {{ctx.limit}}');
await res.refresh();

const data = res.getData();
```
