# ctx.route

The current route matching information, corresponding to the `route` concept in React Router. It is used to retrieve the current matching route configuration, parameters, and more. It is typically used in conjunction with `ctx.router` and `ctx.location`.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField** | Perform conditional rendering or display the current page identifier based on `route.pathname` or `route.params`. |
| **Linkage Rules / FlowEngine** | Read route parameters (e.g., `params.name`) for logic branching or to pass them to child components. |
| **View Navigation** | Internally compare `ctx.route.pathname` with a target path to determine whether to trigger `ctx.router.navigate`. |

> Note: `ctx.route` is only available in RunJS environments that contain a routing context (such as JSBlocks within a page, Flow pages, etc.). It may be null in pure backend or non-routing contexts (such as background workflows).

## Type Definition

```ts
type RouteOptions = {
  name?: string;   // Unique route identifier
  path?: string;   // Route template (e.g., /admin/:name)
  params?: Record<string, any>;  // Route parameters (e.g., { name: 'users' })
  pathname?: string;  // Full path of the current route (e.g., /admin/users)
};
```

## Common Fields

| Field | Type | Description |
|------|------|------|
| `pathname` | `string` | The full path of the current route, consistent with `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Dynamic parameters parsed from the route template, such as `{ name: 'users' }`. |
| `path` | `string` | The route template, such as `/admin/:name`. |
| `name` | `string` | Unique route identifier, commonly used in multi-tab or multi-view scenarios. |

## Relationship with ctx.router and ctx.location

| Purpose | Recommended Usage |
|------|----------|
| **Read current path** | `ctx.route.pathname` or `ctx.location.pathname`; both are consistent during matching. |
| **Read route parameters** | `ctx.route.params`, e.g., `params.name` representing the current page UID. |
| **Navigation** | `ctx.router.navigate(path)` |
| **Read query parameters, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` focuses on the "matched route configuration," while `ctx.location` focuses on the "current URL location." Together, they provide a complete description of the current routing state.

## Examples

### Reading pathname

```ts
// Display the current path
ctx.message.info('Current Page: ' + ctx.route.pathname);
```

### Branching based on params

```ts
// params.name is typically the current page UID (e.g., a Flow page identifier)
if (ctx.route.params?.name === 'users') {
  // Execute specific logic on the user management page
}
```

### Displaying in a Flow page

```tsx
<div>
  <h1>Current Page - {ctx.route.pathname}</h1>
  <p>Route Identifier: {ctx.route.params?.name}</p>
</div>
```

## Related

- [ctx.router](./router.md): Route navigation. When `ctx.router.navigate()` changes the path, `ctx.route` will update accordingly.
- [ctx.location](./location.md): Current URL location (pathname, search, hash, state), used in conjunction with `ctx.route`.