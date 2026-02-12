# ctx.getVar()

Read a variable value from the current runtime context. Variable resolution is consistent with SQL and template variables and usually comes from the current user, current record, view params, etc.

## Type definition (simplified)

```ts
getVar<T = any>(path: string, defaultValue?: T): T | undefined;
```

- `path`: variable path, supports dot access (e.g. `user.id`) or full expression (e.g. `ctx.user.id`); in FlowEngine it maps to the corresponding context object
- `defaultValue`: optional default if the variable does not exist or is `undefined`

> Notes:
> - `ctx.getVar()` uses the same resolution rules as `{{ctx.xxx}}` in SQL/template variables
> - Common variables include `ctx.user.*`, `ctx.record.*`, flow input params, view/modal params, etc.
