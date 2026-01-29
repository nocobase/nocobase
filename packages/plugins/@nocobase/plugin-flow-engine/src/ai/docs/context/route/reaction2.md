---
title: "Reaction2"
description: "Watch pathname."
---

# Reaction2

## Watch Pathname

Use this snippet to watch pathname.

```ts
return reaction(
  () => ctx.route?.pathname,
  (pathname) => {
    if (pathname) {
      effect(pathname);
    }
  },
);
```
