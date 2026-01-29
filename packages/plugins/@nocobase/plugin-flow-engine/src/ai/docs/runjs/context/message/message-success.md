---
title: "Show Success Message"
description: "Use ctx.message.success to show a success toast"
---

# Show Success Message

Use `ctx.message.success()` to show a success toast.

## Basic Usage

```javascript
ctx.message.success(ctx.t('Operation succeeded'));
```

## Message with variables

```javascript
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

## Show after an operation completes

```javascript
// Execute an operation
await ctx.runAction('create', { values: { name: 'test' } });

// Show success message
ctx.message.success(ctx.t('Record created successfully'));
```
