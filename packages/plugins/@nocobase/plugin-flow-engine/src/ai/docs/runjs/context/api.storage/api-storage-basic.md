---
title: "Local Storage: Save State with api.storage"
description: "Use ctx.api.storage to read and write prefixed key-value pairs in local storage."
---

# Local Storage: Save State with api.storage

`ctx.api.storage` is a wrapper around `localStorage`. It automatically adds an app-specific prefix to avoid key collisions.

## Write data

```ts
// Save the currently selected space ID
ctx.api.storage.setItem('CURRENT_SPACE', spaceId);
```

## Read data

```ts
const spaceId = ctx.api.storage.getItem('CURRENT_SPACE');
if (!spaceId) {
  // No space selected yet
}
```

## Remove data

```ts
ctx.api.storage.removeItem('CURRENT_SPACE');
```

> Tip: When saved to the browser, the key will be prefixed, e.g. `NOCOBASE_CURRENT_SPACE`. No manual handling is needed.
