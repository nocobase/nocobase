# ctx.router

React Router instance for imperative navigation in flows.

## Type Definition

```typescript
router: Router
```

`Router` comes from `@remix-run/router`.

## Notes

`ctx.router` is a React Router `Router` instance that provides navigation capability in the RunJS environment. With `ctx.router.navigate()`, you can navigate to a path, replace the current route, or pass state data.

## Methods

### ctx.router.navigate()

Navigate to a target path.

**Signature:**
```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameters:**
- `to`: target path (string), relative history position (number, e.g., `-1` to go back), or `null` (refresh current page)
- `options`: optional config
  - `replace?: boolean`: whether to replace the current history entry (default `false`, i.e., push a new entry)
  - `state?: any`: state data passed to the target route. This data does not appear in the URL and can be accessed via `ctx.location.state`. Useful for sensitive info, temporary data, or extra info not suitable for the URL.

**Example:**

```ts
// Basic navigation (push history)
ctx.router.navigate('/users');

// Navigate and replace current history
ctx.router.navigate('/users', { replace: true });

// Navigate and pass state
ctx.router.navigate('/users/123', { 
  state: { from: 'dashboard' } 
});

// Use replace and state together
ctx.router.navigate('/home', { 
  replace: true,
  state: { userId: 123 }
});
```

## Notes

- `navigate()` pushes a new history entry by default; users can go back with the browser back button
- `replace: true` replaces the current history entry and does not add a new one, suitable for post-login redirects
- **`state` parameter notes**:
  - Data passed via `state` is not shown in the URL and is suitable for sensitive or temporary data
  - You can access the state in the target route via `ctx.location.state`
  - `state` is stored in browser history and is still available on back/forward navigation
  - The `state` data is lost after a page refresh
