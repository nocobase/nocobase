# ctx.router

Router instance based on React Router; used for programmatic navigation in RunJS. Use with `ctx.route` and `ctx.location`.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSField** | Button navigates to detail, list, or external link |
| **Linkage / event flow** | After submit success, `navigate` to list or detail, or pass state to target |
| **JSAction / event handler** | Navigate on form submit, link click, etc. |
| **View navigation** | Update URL when switching views |

> Note: `ctx.router` is only available in RunJS when a router context exists (e.g. JSBlock on a page, Flow page, event flow); in pure backend or non-routed contexts (e.g. workflow) it may be empty.

## Type

```typescript
router: Router
```

`Router` is from `@remix-run/router`; use `ctx.router.navigate()` for navigation, back, refresh.

## Methods

### ctx.router.navigate()

Navigate to a path, or go back/refresh.

**Signature:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameters:**

- `to`: Target path (string), relative history position (number, e.g. `-1` for back), or `null` (refresh current page)
- `options`:
  - `replace?: boolean`: Replace current history entry (default `false`, i.e. push)
  - `state?: any`: State passed to the target route. Not in URL; target page reads it via `ctx.location.state`. Use for sensitive or temporary data.

## Examples

### Basic navigation

```ts
ctx.router.navigate('/admin/users');

ctx.router.navigate(`/admin/users/${recordId}`);
```

### Replace (no new history entry)

```ts
ctx.router.navigate('/admin', { replace: true });

ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Pass state

```ts
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Back and refresh

```ts
ctx.router.navigate(-1);

ctx.router.navigate(-2);

ctx.router.navigate(null);
```

## Relation to ctx.route, ctx.location

| Use | Recommended |
|-----|-------------|
| **Navigate** | `ctx.router.navigate(path)` |
| **Current path** | `ctx.route.pathname` or `ctx.location.pathname` |
| **State from navigation** | `ctx.location.state` |
| **Route params** | `ctx.route.params` |

`ctx.router` does “navigation”; `ctx.route` and `ctx.location` describe “current route state”.

## Notes

- `navigate(path)` by default pushes a new history entry; user can use browser back.
- `replace: true` replaces the current entry; use after login redirect, submit-success redirect, etc.
- **`state`**: Data in `state` is not in the URL; target page reads it via `ctx.location.state`. State is stored in history (back/forward keep it); it is lost on page refresh.

## Related

- [ctx.route](./route.md): current route match (pathname, params)
- [ctx.location](./location.md): current URL; read `state` here after navigation
