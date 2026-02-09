# SQLResource

Resource for executing queries based on **saved SQL configurations** or **dynamic SQL**. It calls backend endpoints like `flowSql:run` / `flowSql:runById` and is suitable for reports, statistics, and custom SQL‑driven lists.

Inheritance: `FlowResource → APIResource → BaseRecordResource → SQLResource`. It has all [APIResource](../api-resource/index.md) capabilities, plus helpers for SQL mode, bind variables, pagination, and `run` / `runById`.

Create it via `ctx.makeResource('SQLResource')` or `ctx.initResource('SQLResource')`. For saved configurations, call `setFilterByTk(uid)` (SQL config uid). For ad‑hoc debugging, use `setDebug(true)` + `setSQL(sql)` to execute raw SQL.

## SQL configuration and execution modes

- `setFilterByTk(uid)` – set uid of the saved SQL config to execute (`runById`)
- `setSQL(sql)` – set raw SQL text (only used when `setDebug(true)` and running via `runBySQL`)
- `setSQLType(type)` – result type: `'selectVar'` / `'selectRow'` / `'selectRows'`
- `setDebug(enabled)` – when `true`, `refresh()` uses `runBySQL()`; otherwise uses `runById()`
- `run()` – convenience method that chooses `runBySQL()` or `runById()` based on debug flag
- `runBySQL()` – execute current `SQL` directly (requires `setDebug(true)` first)
- `runById()` – execute the saved SQL config identified by uid

## Parameters and context

- `setBind(bind)` – bind variables (key‑value object or array)
- `setLiquidContext(ctx)` – Liquid template context
- `setFilter(filter)` – filter object, sent in request data
- `setDataSourceKey(key)` – data source identifier

Use these to parameterize SQL and pass runtime context into your queries.

## Pagination

- `setPage(page)` / `getPage()` – current page (default `1`)
- `setPageSize(size)` / `getPageSize()` – page size (default `20`)
- `next()` / `previous()` / `goto(page)` – change page and trigger `refresh`

Backend pagination support depends on how the SQL config is defined.

## Data fetching and events

- `refresh()` – execute SQL (`runById` or `runBySQL`), write the result into `setData(data)` and update meta
- `runAction(actionName, options)` – call low‑level operations (`getBind`, `run`, `runById`, etc.)
- `on('refresh', fn)` – triggered after refresh completes
- `on('loading', fn)` – triggered when a query starts loading

## Example

```ts
const res = ctx.makeResource('SQLResource');

// Debug mode: execute raw SQL
res.setDebug(true);
res.setSQL('SELECT * FROM users LIMIT {{ctx.limit}}');
res.setBind({ limit: 10 });

await res.refresh();

const data = res.getData();
```