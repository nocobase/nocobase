---
title: "Pass State with Navigation"
description: "Pass state via the state option without showing it in the URL"
---

# Pass State with Navigation

Pass state data via the `state` option. This data will not appear in the URL, and can be accessed via `ctx.location.state` in the target route.

```ts
// Navigate and pass state (not shown in URL)
ctx.router.navigate('/users/123', {
  state: {
    from: 'dashboard',
    timestamp: Date.now()
  }
});

// Access passed state in the target route
const previousState = ctx.location.state;
if (previousState?.from === 'dashboard') {
  // Handle logic for navigation from dashboard
}
```
