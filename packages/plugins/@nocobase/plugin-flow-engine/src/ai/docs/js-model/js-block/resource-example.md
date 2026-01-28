---
title: "Resource example"
description: "Create a resource via ctx.createResource and render JSON output."
---

# Resource example

Create a resource via ctx.createResource and render JSON output

```ts
// Create a resource and load a single record
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
// Optionally set filterByTk to target a specific record:
// resource.setRequestOptions('params', { filterByTk: 1 });
await resource.refresh();

ctx.element.innerHTML = 
```
