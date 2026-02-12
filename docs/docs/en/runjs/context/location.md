# ctx.location

Current route location info, equivalent to React Router's `location` object. Typically used with `ctx.router`.

## Common fields

- `pathname: string` - current path
- `search: string` - query string (e.g. `?page=1`)
- `hash: string` - hash fragment
- `state: any` - state passed via `ctx.router.navigate(path, { state })`

> Tips:
> - Use `URLSearchParams` to parse query params from `search`
> - If you only need query params, `ctx.urlSearchParams` is also available
