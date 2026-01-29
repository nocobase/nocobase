---
title: "Show Error Message"
description: "Use ctx.message.error to show an error toast"
---

# Show Error Message

Use `ctx.message.error()` to show an error toast.

## Basic Usage

```javascript
ctx.message.error(ctx.t('Operation failed'));
```

## Use in error handling

```javascript
try {
  await ctx.runAction('create', { values: { name: 'test' } });
  ctx.message.success(ctx.t('Record created successfully'));
} catch (error) {
  ctx.message.error(ctx.t('Failed to create record: {{message}}', { message: error.message }));
}
```

## Show API request errors

```javascript
try {
  const response = await ctx.api.request({
    url: '/api/users',
    method: 'post',
    data: { name: 'test' }
  });
  ctx.message.success(ctx.t('Request succeeded'));
} catch (error) {
  ctx.message.error(ctx.t('Request failed'));
}
```
