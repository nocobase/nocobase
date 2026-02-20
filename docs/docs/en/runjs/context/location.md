# ctx.location

Current route location, equivalent to React Router’s `location`. Use with `ctx.router` and `ctx.route` to read pathname, search, hash, and state passed via navigation.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSField** | Conditional render or logic based on path, query, or hash |
| **Linkage / event flow** | Read URL params for filtering or use `location.state` for source |
| **After navigation** | On target page, read `ctx.location.state` from `ctx.router.navigate` |

> Note: `ctx.location` is only available in RunJS when a router context exists (e.g. JSBlock on a page, event flow); in pure backend or non-routed contexts (e.g. workflow) it may be empty.

## Type

```ts
location: Location;
```

`Location` is from `react-router-dom`, same as `useLocation()`.

## Common Fields

| Field | Type | Description |
|-------|------|-------------|
| `pathname` | `string` | Current path, leading `/` (e.g. `/admin/users`) |
| `search` | `string` | Query string, leading `?` (e.g. `?page=1&status=active`) |
| `hash` | `string` | Hash fragment, leading `#` (e.g. `#section-1`) |
| `state` | `any` | Data passed via `ctx.router.navigate(path, { state })`; not in URL |
| `key` | `string` | Unique key for this location; initial page is `"default"` |

## Relation to ctx.router, ctx.urlSearchParams

| Use | Recommended |
|-----|-------------|
| **Path, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Query params as object** | `ctx.urlSearchParams` |
| **Parse search** | `new URLSearchParams(ctx.location.search)` or `ctx.urlSearchParams` |

`ctx.urlSearchParams` is derived from `ctx.location.search`; use it when you only need query params.

## Examples

### Branch by path

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('On user management page');
}
```

### Parse query params

```ts
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Read state from navigation

```ts
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigated from dashboard');
}
```

### Anchor by hash

```ts
const hash = ctx.location.hash;
if (hash === '#edit') {
  // Scroll to edit or run logic
}
```

## Related

- [ctx.router](./router.md): navigation; `state` from `ctx.router.navigate` is available as `ctx.location.state`
- [ctx.route](./route.md): current route match (params, config); use with `ctx.location`
