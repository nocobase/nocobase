# SQLResource

A Resource for executing queries based on **saved SQL configurations** or **dynamic SQL**, with data sourced from interfaces such as `flowSql:run` / `flowSql:runById`. It is suitable for reports, statistics, custom SQL lists, and other scenarios. Unlike [MultiRecordResource](./multi-record-resource.md), SQLResource does not depend on collections; it executes SQL queries directly and supports pagination, parameter binding, template variables (`{{ctx.xxx}}`), and result type control.

**Inheritance**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Creation**: `ctx.makeResource('SQLResource')` or `ctx.initResource('SQLResource')`. To execute based on a saved configuration, use `setFilterByTk(uid)` (the UID of the SQL template). For debugging, use `setDebug(true)` + `setSQL(sql)` to execute SQL directly. In RunJS, `ctx.api` is injected by the runtime environment.

---

## Use Cases

| Scenario | Description |
|------|------|
| **Reports / Statistics** | Complex aggregations, cross-table queries, and custom statistical metrics. |
| **JSBlock Custom Lists** | Implementing special filtering, sorting, or associations using SQL with custom rendering. |
| **Chart Blocks** | Driving chart data sources with saved SQL templates, supporting pagination. |
| **Choosing between SQLResource and ctx.sql** | Use SQLResource when pagination, events, or reactive data are required; use `ctx.sql.run()` / `ctx.sql.runById()` for simple one-off queries. |

---

## Data Format

- `getData()` returns different formats based on `setSQLType()`:
  - `selectRows` (default): **Array**, multiple row results.
  - `selectRow`: **Single object**.
  - `selectVar`: **Scalar value** (e.g., COUNT, SUM).
- `getMeta()` returns metadata such as pagination: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## SQL Configuration and Execution Modes

| Method | Description |
|------|------|
| `setFilterByTk(uid)` | Sets the UID of the SQL template to execute (corresponds to `runById`; must be saved in the admin interface first). |
| `setSQL(sql)` | Sets the raw SQL (used for `runBySQL` only when debug mode `setDebug(true)` is enabled). |
| `setSQLType(type)` | Result type: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | When set to `true`, `refresh` calls `runBySQL()`; otherwise, it calls `runById()`. |
| `run()` | Calls `runBySQL()` or `runById()` based on the debug state. |
| `runBySQL()` | Executes using the SQL defined in `setSQL` (requires `setDebug(true)`). |
| `runById()` | Executes the saved SQL template using the current UID. |

---

## Parameters and Context

| Method | Description |
|------|------|
| `setBind(bind)` | Binds variables. Use an object for `:name` placeholders or an array for `?` placeholders. |
| `setLiquidContext(ctx)` | Template context (Liquid), used to parse `{{ctx.xxx}}`. |
| `setFilter(filter)` | Additional filter conditions (passed into the request data). |
| `setDataSourceKey(key)` | Data source identifier (used for multi-data source environments). |

---

## Pagination

| Method | Description |
|------|------|
| `setPage(page)` / `getPage()` | Current page (default is 1). |
| `setPageSize(size)` / `getPageSize()` | Items per page (default is 20). |
| `next()` / `previous()` / `goto(page)` | Navigates pages and triggers `refresh`. |

In SQL, you can use `{{ctx.limit}}` and `{{ctx.offset}}` to reference pagination parameters. SQLResource injects `limit` and `offset` into the context automatically.

---

## Data Fetching and Events

| Method | Description |
|------|------|
| `refresh()` | Executes the SQL (`runById` or `runBySQL`), writes the result to `setData(data)`, updates meta, and triggers the `'refresh'` event. |
| `runAction(actionName, options)` | Calls underlying actions (e.g., `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Triggered when refreshing is complete or when loading starts. |

---

## Examples

### Executing via Saved Template (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID of the saved SQL template
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, etc.
```

### Debug Mode: Executing SQL Directly (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Pagination and Navigation

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigation
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Result Types

```js
// Multiple rows (default)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Single row
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Single value (e.g., COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Using Template Variables

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Listening to the refresh Event

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Notes

- **runById requires saving the template first**: The UID used in `setFilterByTk(uid)` must be a SQL template ID already saved in the admin interface. You can save it via `ctx.sql.save({ uid, sql })`.
- **Debug mode requires permissions**: `setDebug(true)` uses `flowSql:run`, which requires the current role to have SQL configuration permissions. `runById` only requires the user to be logged in.
- **Refresh Debouncing**: Multiple calls to `refresh()` within the same event loop will only execute the last one to avoid redundant requests.
- **Parameter Binding for Injection Prevention**: Use `setBind()` with `:name` or `?` placeholders instead of string concatenation to prevent SQL injection.

---

## Related

- [ctx.sql](../context/sql.md) - SQL execution and management; `ctx.sql.runById` is suitable for simple one-off queries.
- [ctx.resource](../context/resource.md) - The resource instance in the current context.
- [ctx.initResource()](../context/init-resource.md) - Initializes and binds to `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Creates a new resource instance without binding.
- [APIResource](./api-resource.md) - General API resource.
- [MultiRecordResource](./multi-record-resource.md) - Designed for collections and lists.