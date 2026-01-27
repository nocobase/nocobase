---
title: "Confirm Action"
description: "Use ctx.modal.confirm/info to confirm action."
---

# Examples

## Confirm Action

Use this snippet to confirm action.

```ts
const ok = await ctx.modal.confirm({
  title: 'Confirm action',
  content: 'Are you sure?',
});
return ok;
```

## Info Dialog

Use this snippet to info dialog.

```ts
await ctx.modal.info({
  title: 'Information',
  content: message,
});
```
