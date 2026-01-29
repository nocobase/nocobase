# ctx.getVar()

Read variable values from the current runtime context. Variable sources are consistent with variable resolution in SQL and templates, typically coming from the current user, current record, view parameters, and more.

## Type Definition (Simplified)

```ts
getVar<T = any>(path: string, defaultValue?: T): T | undefined;
```

- `path`: variable path, supports dot access (e.g. `user.id`) or full expressions (e.g. `ctx.user.id`); inside FlowEngine it is mapped to the corresponding context object
- `defaultValue`: optional default value when the variable does not exist or is `undefined`

> Notes:
> - `ctx.getVar()` uses the same context parsing rules as `{{ctx.xxx}}` in SQL and template variables
> - Common variables include `ctx.user.*`, `ctx.record.*`, flow input parameters, and view/dialog parameters
