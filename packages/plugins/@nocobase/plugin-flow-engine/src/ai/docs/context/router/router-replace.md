---
title: "Replace Route"
description: "Use replace to replace the current history entry without adding a new one"
---

# Replace Route

Use the `replace: true` option to replace the current history entry without adding a new one. This is useful for post-login redirects.

```ts
// After login, replace current route to the home page
ctx.router.navigate('/home', { replace: true });
```
