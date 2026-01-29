# ctx.location

Current route location info, equivalent to React Router's `location` object. Usually used together with `ctx.router`.

## Common Fields

- `pathname: string`: current path
- `search: string`: query string (e.g., `?page=1`)
- `hash: string`: hash fragment
- `state: any`: state passed via `ctx.router.navigate(path, { state })`

> Tip:
> - Use `URLSearchParams` to parse query parameters in `search`
> - If you only need query parameters, you can also use `ctx.urlSearchParams`
