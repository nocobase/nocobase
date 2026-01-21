---
title: "Resolve Template"
description: "Resolve Template implementation for Resolve Json Template."
---

# Examples

## Resolve Template

```ts
const payload = ctx.resolveJsonTemplate({ message: 'Hi {{user.name}}!' }, { user: ctx.user });
```
