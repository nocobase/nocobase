---
title: "Shuffle"
description: "Shuffle array."
---

# Shuffle

## Shuffle Array

Use this snippet to shuffle array.

```ts
const result = await ctx.runjs(`return _.shuffle(values);`, {
  _: await ctx.requireAsync('lodash-es'),
  values,
});
return result;
```
