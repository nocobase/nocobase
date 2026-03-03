# ctx.sql

`ctx.sql` provides SQL execution and management capabilities, commonly used in RunJS (such as JSBlock and Workflows) to access the database directly. It supports temporary SQL execution, execution of saved SQL templates by ID, parameter binding, template variables (`{{ctx.xxx}}`), and result type control.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock** | Custom statistical reports, complex filtered lists, and cross-table aggregation queries. |
| **Chart Block** | Saving SQL templates to drive chart data sources. |
| **Workflow / Linkage** | Executing preset SQL to retrieve data for subsequent logic. |
| **SQLResource** | Used in conjunction with `ctx.initResource('SQLResource')` for scenarios like paginated lists. |

> Note: `ctx.sql` accesses the database via the `flowSql` API. Ensure the current user has execution permissions for the corresponding data source.

## Permissions

| Permission | Method | Description |
|------|------|------|
| **Logged-in User** | `runById` | Execute based on a configured SQL template ID. |
| **SQL Configuration Permission** | `run`, `save`, `destroy` | Execute temporary SQL, or save/update/delete SQL templates. |

Frontend logic intended for regular users should use `ctx.sql.runById(uid, options)`. When dynamic SQL or template management is required, ensure the current role possesses SQL configuration permissions.

## Type Definition

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

| Method | Description | Permission Requirement |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Executes temporary SQL; supports parameter binding and template variables. | SQL Configuration Permission |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Saves or updates a SQL template by ID for reuse. | SQL Configuration Permission |
| `ctx.sql.runById(uid, options?)` | Executes a previously saved SQL template by its ID. | Any logged-in user |
| `ctx.sql.destroy(uid)` | Deletes a specified SQL template by ID. | SQL Configuration Permission |

Note:

- `run` is used for debugging SQL and requires configuration permissions.
- `save` and `destroy` are used for managing SQL templates and require configuration permissions.
- `runById` is open to regular users; it can only execute saved templates and cannot debug or modify the SQL.
- When a SQL template is modified, `save` must be called to persist the changes.

## Parameters

### options for run / runById

| Parameter | Type | Description |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Binding variables. Use an object for `:name` placeholders or an array for `?` placeholders. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Result type: multiple rows, single row, or single value. Defaults to `selectRows`. |
| `dataSourceKey` | `string` | Data source identifier. Defaults to the main data source. |
| `filter` | `Record<string, any>` | Additional filter conditions (depending on interface support). |

### options for save

| Parameter | Type | Description |
|------|------|------|
| `uid` | `string` | Unique identifier for the template. Once saved, it can be executed via `runById(uid, ...)`. |
| `sql` | `string` | SQL content. Supports `{{ctx.xxx}}` template variables and `:name` / `?` placeholders. |
| `dataSourceKey` | `string` | Optional. Data source identifier. |

## SQL Template Variables and Parameter Binding

### Template Variables `{{ctx.xxx}}`

You can use `{{ctx.xxx}}` in SQL to reference context variables. These are parsed into actual values before execution:

```js
// Reference ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

The sources for referencable variables are the same as `ctx.getVar()` (e.g., `ctx.user.*`, `ctx.record.*`, custom `ctx.defineProperty`, etc.).

### Parameter Binding

- **Named Parameters**: Use `:name` in SQL and pass an object `{ name: value }` in `bind`.
- **Positional Parameters**: Use `?` in SQL and pass an array `[value1, value2]` in `bind`.

```js
// Named parameters
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = $status AND age > $minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Positional parameters
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['London', 'active'], type: 'selectVar' }
);
```

## Examples

### Executing Temporary SQL (Requires SQL Configuration Permission)

```js
// Multiple rows (default)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Single row
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = $id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Single value (e.g., COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Using Template Variables

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Saving and Reusing Templates

```js
// Save (Requires SQL Configuration Permission)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = $status ORDER BY created_at DESC',
});

// Any logged-in user can execute this
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Delete template (Requires SQL Configuration Permission)
await ctx.sql.destroy('active-users-report');
```

### Paginated List (SQLResource)

```js
// Use SQLResource when pagination or filtering is needed
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID of the saved SQL template
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Includes page, pageSize, etc.
```

## Relationship with ctx.resource and ctx.request

| Purpose | Recommended Usage |
|------|----------|
| **Execute SQL Query** | `ctx.sql.run()` or `ctx.sql.runById()` |
| **SQL Paginated List (Block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **General HTTP Request** | `ctx.request()` |

`ctx.sql` wraps the `flowSql` API and is specialized for SQL scenarios; `ctx.request` can be used to call any API.

## Notes

- Use parameter binding (`:name` / `?`) instead of string concatenation to prevent SQL injection.
- `type: 'selectVar'` returns a scalar value, typically used for `COUNT`, `SUM`, etc.
- Template variables `{{ctx.xxx}}` are resolved before execution; ensure the corresponding variables are defined in the context.

## Related

- [ctx.resource](./resource.md): Data resources; SQLResource calls the `flowSql` API internally.
- [ctx.initResource()](./init-resource.md): Initializes SQLResource for paginated lists, etc.
- [ctx.request()](./request.md): General HTTP requests.
