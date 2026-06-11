# ctx.location

Current route location information, equivalent to the React Router `location` object. It is typically used in conjunction with `ctx.router` and `ctx.route` to read the current path, query string, hash, and state passed through the route.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField** | Perform conditional rendering or logic branching based on the current path, query parameters, or hash. |
| **Linkage Rules / FlowEngine** | Read URL query parameters for linkage filtering, or determine the source based on `location.state`. |
| **Post-navigation processing** | Receive data passed from the previous page via `ctx.router.navigate` using `ctx.location.state` on the target page. |

> Note: `ctx.location` is only available in RunJS environments with a routing context (e.g., JSBlock within a page, FlowEngine, etc.); it may be null in pure backend or non-routing contexts (e.g., Workflows).

## Type Definition

```ts
location: Location;
```

`Location` comes from `react-router-dom`, consistent with the return value of React Router's `useLocation()`.

## Common Fields

| Field | Type | Description |
|------|------|------|
| `pathname` | `string` | The current path, starting with `/` (e.g., `/admin/users`). |
| `search` | `string` | The query string, starting with `?` (e.g., `?page=1&status=active`). |
| `hash` | `string` | The hash fragment, starting with `#` (e.g., `#section-1`). |
| `state` | `any` | Arbitrary data passed via `ctx.router.navigate(path, { state })`, not reflected in the URL. |
| `key` | `string` | A unique identifier for this location; the initial page is `"default"`. |

## Relationship with ctx.router and ctx.urlSearchParams

| Purpose | Recommended Usage |
|------|----------|
| **Read path, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Read query parameters (as object)** | `ctx.urlSearchParams`, which provides the parsed object directly. |
| **Parse search string** | `new URLSearchParams(ctx.location.search)` or use `ctx.urlSearchParams` directly. |

`ctx.urlSearchParams` is parsed from `ctx.location.search`. If you only need query parameters, using `ctx.urlSearchParams` is more convenient.

## Examples

### Branching Based on Path

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Currently on the user management page');
}
```

### Parsing Query Parameters

```ts
// Method 1: Using ctx.urlSearchParams (Recommended)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Method 2: Using URLSearchParams to parse search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Receiving State Passed via Route Navigation

```ts
// When navigating from the previous page: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigated from the dashboard');
}
```

### Locating Anchors via Hash

```ts
const hash = ctx.location.hash; // e.g., "#edit"
if (hash === '#edit') {
  // Scroll to the edit area or execute corresponding logic
}
```

## Related

- [ctx.router](./router.md): Route navigation; the `state` from `ctx.router.navigate` can be retrieved via `ctx.location.state` on the target page.
- [ctx.route](./route.md): Current route match information (parameters, configuration, etc.), often used in conjunction with `ctx.location`.