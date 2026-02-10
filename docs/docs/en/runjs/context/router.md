# ctx.router

A React Router instance for navigation in flows.

## Type definition

```typescript
router: Router
```

`Router` comes from `@remix-run/router`.

## Notes

`ctx.router` provides navigation capabilities in RunJS. Use `ctx.router.navigate()` to navigate to a path, replace history, or pass state.

## Methods

### ctx.router.navigate()

Navigate to a target path.

**Signature:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameters:**

- `to`: target path (string), relative history position (number, e.g. `-1` for back), or `null` (refresh current page)
- `options`: optional config
  - `replace?: boolean`: replace current history entry (default `false`, i.e. push)
  - `state?: any`: state passed to target route, not shown in URL; accessible via `ctx.location.state`

**Examples:**

```ts
// Basic navigation (push history)
ctx.router.navigate('/users');

// Navigate and replace history
ctx.router.navigate('/users', { replace: true });

// Navigate with state
ctx.router.navigate('/users/123', {
  state: { from: 'dashboard' }
});

// Replace with state
ctx.router.navigate('/home', {
  replace: true,
  state: { userId: 123 }
});
```

## Notes

- `navigate()` pushes a new history entry by default
- `replace: true` replaces the current entry without adding a new one (useful for redirects)
- **About `state`:**
  - Data passed via `state` is not in the URL and suits sensitive or temporary info
  - Access it via `ctx.location.state`
  - It is stored in browser history and is available on back/forward
  - It is lost on page refresh
