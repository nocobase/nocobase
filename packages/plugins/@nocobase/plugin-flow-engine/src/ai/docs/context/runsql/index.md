# ctx.runsql()

`ctx.runsql(options)` executes a SQL snippet managed by the flow runtime. In debug mode, the provided `sql` is upserted under the given `uid`; in normal mode, the server loads the SQL body by `uid` and only runs the query.

```ts
type RunSQLOptions = {
  uid: string;
  sql?: string;
  bind?: Record<string, any>;
  filter?: Record<string, any>;
  type?: 'selectRows' | 'selectRow' | 'selectVar';
  debug?: boolean;
};
```

## Usage Patterns

Bind variables with `$param` placeholders in your SQL, and keep `uid` stable across deployments so production can reference the stored query without debug mode.
