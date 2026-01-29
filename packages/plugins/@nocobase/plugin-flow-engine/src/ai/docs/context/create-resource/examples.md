---
title: "Create Multi Record Resource"
description: "Create Multi Record Resource implementation for Create Resource."
---

# Examples

## Create Multi Record Resource

```ts
const resource = ctx.createResource('MultiRecordResource');
resource.setCollection('users');
await resource.list();
```
