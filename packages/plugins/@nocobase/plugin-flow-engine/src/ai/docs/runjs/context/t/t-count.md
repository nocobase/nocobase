---
title: "Translate with Plural (count)"
description: "Use ctx.t() with count for singular/plural (key_one / key_other in resources)"
---

# Translate with Plural (count)

Use `ctx.t()` with `count` for pluralization. In resources define `key_one` (singular) and `key_other` (plural); variable name must be `count`.

```ts
ctx.t('Item', { count: 1 });
ctx.t('Item', { count: 5 });
ctx.t('itemWithCount', { count: 1 });   // uses itemWithCount_one / itemWithCount_other
```
