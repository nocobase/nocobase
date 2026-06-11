# ctx.router

A router instance based on React Router, used for programmatic navigation within RunJS. It is typically used in conjunction with `ctx.route` and `ctx.location`.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField** | Navigate to detail pages, list pages, or external links after a button click. |
| **Linkage Rules / Event Flow** | Execute `navigate` to a list or detail page after successful submission, or pass `state` to the target page. |
| **JSAction / Event Handling** | Execute route navigation within logic such as form submissions or link clicks. |
| **View Navigation** | Update the URL via `navigate` during internal view stack switching. |

> Note: `ctx.router` is only available in RunJS environments with a routing context (e.g., JSBlock within a page, Flow pages, event flows, etc.); it may be null in pure backend or non-routing contexts (e.g., Workflows).

## Type Definition

```typescript
router: Router
```

`Router` is derived from `@remix-run/router`. In RunJS, navigation operations such as jumping, going back, and refreshing are implemented via `ctx.router.navigate()`.

## Methods

### ctx.router.navigate()

Navigates to a target path, or executes a back/refresh action.

**Signature:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameters:**

- `to`: Target path (string), relative history position (number, e.g., `-1` to go back), or `null` (to refresh the current page).
- `options`: Optional configuration.
  - `replace?: boolean`: Whether to replace the current history entry (default is `false`, which pushes a new entry).
  - `state?: any`: State to pass to the target route. This data does not appear in the URL and can be accessed via `ctx.location.state` on the target page. It is suitable for sensitive information, temporary data, or information that should not be placed in the URL.

## Examples

### Basic Navigation

```ts
// Navigate to the user list (pushes a new history entry, allows going back)
ctx.router.navigate('/admin/users');

// Navigate to a detail page
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Replacing History (No new entry)

```ts
// Redirect to the home page after login; the user won't return to the login page when going back
ctx.router.navigate('/admin', { replace: true });

// Replace the current page with the detail page after successful form submission
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Passing State

```ts
// Carry data during navigation; the target page retrieves it via ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Back and Refresh

```ts
// Go back one page
ctx.router.navigate(-1);

// Go back two pages
ctx.router.navigate(-2);

// Refresh the current page
ctx.router.navigate(null);
```

## Relationship with ctx.route and ctx.location

| Purpose | Recommended Usage |
|------|----------|
| **Navigation/Jumping** | `ctx.router.navigate(path)` |
| **Read current path** | `ctx.route.pathname` or `ctx.location.pathname` |
| **Read state passed during navigation** | `ctx.location.state` |
| **Read route parameters** | `ctx.route.params` |

`ctx.router` is responsible for "navigation actions," while `ctx.route` and `ctx.location` are responsible for the "current route state."

## Notes

- `navigate(path)` pushes a new history entry by default, allowing users to return via the browser's back button.
- `replace: true` replaces the current history entry without adding a new one, which is suitable for scenarios like post-login redirection or navigation after successful submission.
- **Regarding the `state` parameter**:
  - Data passed via `state` does not appear in the URL, making it suitable for sensitive or temporary data.
  - It can be accessed via `ctx.location.state` on the target page.
  - `state` is saved in the browser history and remains accessible during forward/backward navigation.
  - `state` will be lost after a hard page refresh.

## Related

- [ctx.route](./route.md): Current route match information (pathname, params, etc.).
- [ctx.location](./location.md): Current URL location (pathname, search, hash, state); `state` is read here after navigation.