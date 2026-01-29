---
title: "Full"
description: "Resolve object."
---

# Full

## Resolve Object

Use this snippet to resolve object.

```ts
const template = {
  str: '{{ctx.current.key1}}',
  num: '{{ctx.current.key3}}',
  nested: {
    ref: '{{ctx.current.key4}}',
  },
};
return ctx.resolveJsonTemplate(template);
```
