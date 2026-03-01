# ctx.sql

`ctx.sql` provides SQL execution and management, often used in RunJS (e.g. JSBlock, event flow) to access the database directly. It supports ad-hoc SQL, running saved SQL templates by ID, parameter binding, template variables (`{{ctx.xxx}}`), and result type control.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock** | Custom reports, complex filtered lists, cross-table aggregation |
| **Chart block** | Saved SQL templates as chart data source |
| **Event flow / linkage** | Run predefined SQL and use results in logic |
| **SQLResource** | With `ctx.initResource('SQLResource')` for paginated lists, etc. |

> Note: `ctx.sql` uses the `flowSql` API to access the database; ensure the current user has execute permission on the target data source.

## Permissions

| Permission | Method | Description |
|------------|--------|-------------|
| **Logged-in user** | `runById` | Run by configured SQL template ID |
| **SQL config permission** | `run`, `save`, `destroy` | Ad-hoc SQL, save/update/delete SQL templates |

Front-end logic for normal users can use `ctx.sql.runById(uid, options)`; for dynamic SQL or template management, the current role must have SQL config permission.

## Type

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Common Methods

| Method | Description | Permission |
|--------|-------------|------------|
| `ctx.sql.run(sql, options?)` | Run ad-hoc SQL; supports parameter binding and template variables | SQL config |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Save/update SQL template by ID for reuse | SQL config |
| `ctx.sql.runById(uid, options?)` | Run saved SQL template by ID | Any logged-in user |
| `ctx.sql.destroy(uid)` | Delete SQL template by ID | SQL config |

- `run`: for debugging SQL; requires config permission.
- `save`, `destroy`: for managing SQL templates; require config permission.
- `runById`: available to normal users; only runs saved templates.
- Call `save` when a SQL template changes.

## Options

### run / runById options

| Option | Type | Description |
|--------|------|-------------|
| `bind` | `Record<string, any>` \| `any[]` | Bound variables. Object with `:name`, array with `?` |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Result type: multiple rows, single row, single value; default `selectRows` |
| `dataSourceKey` | `string` | Data source key; default is main data source |
| `filter` | `Record<string, any>` | Extra filter (if supported) |

### save options

| Option | Type | Description |
|--------|------|-------------|
| `uid` | `string` | Template unique id; use with `runById(uid, ...)` |
| `sql` | `string` | SQL text; supports `{{ctx.xxx}}` and `:name` / `?` placeholders |
| `dataSourceKey` | `string` | Optional data source key |

## Template Variables and Parameter Binding

### Template variables `{{ctx.xxx}}`

In SQL you can use `{{ctx.xxx}}` to reference context variables; they are resolved before execution:

```js
// Reference ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Variable sources are the same as for `ctx.getVar()` (e.g. `ctx.user.*`, `ctx.record.*`, custom `ctx.defineProperty`, etc.).

### Parameter binding

- **Named**: use `:name` in SQL and pass `bind: { name: value }`
- **Positional**: use `?` in SQL and pass `bind: [value1, value2]`

```js
// Named
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Positional
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Beijing', 'active'], type: 'selectVar' }
);
```

## Examples

### Ad-hoc SQL (requires SQL config permission)

```js
// Multiple rows (default)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Single row
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Single value (e.g. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Template variables

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Save template and reuse

```js
// Save (requires SQL config permission)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Any logged-in user can run
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Delete template (requires SQL config permission)
await ctx.sql.destroy('active-users-report');
```

### Paginated list (SQLResource)

```js
// For pagination and filters, use SQLResource
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // Saved SQL template ID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // page, pageSize, etc.
```

## Relation to ctx.resource, ctx.request

| Use | Recommended |
|-----|-------------|
| **Run SQL** | `ctx.sql.run()` or `ctx.sql.runById()` |
| **SQL paginated list (block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Generic HTTP** | `ctx.request()` |

`ctx.sql` wraps the `flowSql` API for SQL; `ctx.request` is for arbitrary API calls.

## Notes

- Use parameter binding (`:name` / `?`) instead of string concatenation to avoid SQL injection.
- With `type: 'selectVar'` the result is a scalar (e.g. for `COUNT`, `SUM`).
- Template variables `{{ctx.xxx}}` are resolved before execution; ensure the context defines them.

## Related

- [ctx.resource](./resource.md): data resource; SQLResource uses flowSql internally
- [ctx.initResource()](./init-resource.md): initialize SQLResource for paginated lists
- [ctx.request()](./request.md): generic HTTP requests
