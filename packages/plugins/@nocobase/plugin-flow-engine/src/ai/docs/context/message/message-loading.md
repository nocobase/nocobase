---
title: "Show Loading Message"
description: "Use ctx.message.loading to show a loading toast"
---

# Show Loading Message

Use `ctx.message.loading()` to show a loading toast.

## Basic Usage

```javascript
const hide = ctx.message.loading(ctx.t('Loading...'));

// Execute async operation
await ctx.api.request({ url: '/api/data' });

// Manually close the loading message
hide();
```

## Use in async operations

```javascript
const hide = ctx.message.loading(ctx.t('Processing data...'));

try {
  await ctx.runAction('process', { data: someData });
  hide();
  ctx.message.success(ctx.t('Processing completed'));
} catch (error) {
  hide();
  ctx.message.error(ctx.t('Processing failed'));
}
```
