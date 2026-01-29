---
title: "Read and Update Model Properties"
description: "Access properties, state, and events of the current FlowModel via ctx.model."
---

# Read and Update Model Properties

```ts
// Read basic info of the current model
const uid = ctx.model.uid;
const collection = ctx.model.collection;

// Update model properties (e.g., resource query params, display config)
ctx.model.setProps({
  pageSize: 20,
  showHeader: true,
});

// Dispatch a custom event to trigger internal model logic
ctx.model.dispatchEvent({
  type: 'refresh',
  payload: {
    from: 'js-block',
  },
});
```

> Tip:
> - `ctx.model` always points to the FlowModel instance currently being executed
> - Different model types (BlockModel / ActionModel / PageModel, etc.) may expose different fields for `setProps`, `dispatchEvent`, and more
> - To access other models by uid, use `ctx.getModel(uid)`
