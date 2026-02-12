# ctx.sql

`ctx.sql` provides SQL execution and management. It is commonly used in RunJS (e.g. JSBlock) to access the database directly. It supports temporary SQL execution, executing saved SQL templates by ID, binding parameters, result type control, and saving/deleting SQL templates.

## Permissions

- **Logged-in users**: can execute `runById` (run saved SQL templates by ID).
- **Roles with SQL config permissions**: can also execute `run`, `save`, `destroy` (execute temporary SQL, save/update/delete templates).

Therefore, frontend logic for logged-in users can use `ctx.sql.runById(uid, options)`. For dynamic SQL or template management, ensure the current role has SQL config permissions.

---

## Type definition

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'select' | 'selectRow' | 'selectVar' | 'raw';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: {
    uid: string;
    sql: string;
    dataSourceKey?: string;
  }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'select' | 'selectRow' | 'selectVar' | 'raw';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

> Note: implementation lives in FlowSQLRepository. Only commonly used methods/params are listed here.

---

## Common methods

| Method | Description | Permission |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Execute temporary SQL with bind and result type | Requires SQL config permission |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Save/update SQL template by ID | Requires SQL config permission |
| `ctx.sql.runById(uid, options?)` | Run saved SQL template by ID (options same as run) | Logged-in users |
| `ctx.sql.destroy(uid)` | Delete SQL template by ID | Requires SQL config permission |

---

## Parameters

- **Options for run / runById**
  - `bind`: bind variables (object or array)
  - `type`: result type (e.g. `select` multiple rows, `selectRow` single row, `selectVar` single value, `raw`)
  - `dataSourceKey`: data source key
  - `filter`: filter (if supported by the API)

- **Options for save**
  - `uid`: template unique ID, used by `runById(uid, ...)`
  - `sql`: SQL content
  - `dataSourceKey`: optional data source key

---

## Example

```js
// Register needed context
ctx.defineProperty('minId', {
  get: () => 1,
});

const sql = 'SELECT * FROM users WHERE id > {{ctx.minId}}';

// Requires SQL config permission: temporary SQL
const rows = await ctx.sql.run(sql, { type: 'select' });

// Requires SQL config permission: save SQL template
await ctx.sql.save({ uid: 'my-report-uid', sql });

// Logged-in users: run saved SQL template
const data = await ctx.sql.runById('my-report-uid', {
  type: 'select',
});

// Requires SQL config permission: delete SQL template
await ctx.sql.destroy('my-report-uid');
```
