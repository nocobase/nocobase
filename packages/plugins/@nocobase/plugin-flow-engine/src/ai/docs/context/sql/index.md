# ctx.sql

`ctx.sql` provides SQL execution and management capabilities, commonly used in JSBlock to access the database directly.  
It supports temporary SQL execution, parameter binding, result type control, and saving/reusing SQL templates.

## Type Definition

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
};
```

> Notes: The implementation lives in FlowSQLRepository. This section only lists common methods and parameters for direct use in JSBlock.

## Common Methods

- `ctx.sql.run(sql, options?)`: run a temporary SQL statement with parameter binding and result type control
- `ctx.sql.save({ uid, sql, dataSourceKey? })`: save/update a SQL template for reuse by ID
- `ctx.sql.runById(uid, options?)`: execute a saved SQL template by ID; `options` is the same as `run`
- `ctx.sql.destroy(uid)`: delete an unused SQL template
