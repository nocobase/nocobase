---
title: "Show Info Message"
description: "Use ctx.message.info to show an info toast"
---

# Show Info Message

Use `ctx.message.info()` to show an info toast.

## Basic Usage

```javascript
ctx.message.info(ctx.t('Processing...'));
```

## Show a progress tip

```javascript
ctx.message.info(ctx.t('Please wait while we process your request'));
```
