---
title: "Translate with Interpolation"
description: "Use ctx.t() with {{count}} or other variables in options"
---

# Translate with Interpolation

Use `ctx.t()` with placeholders in the key and pass variables in `options`.

```ts
ctx.t('Processed {{count}} rows', { count: rows.length });
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```
