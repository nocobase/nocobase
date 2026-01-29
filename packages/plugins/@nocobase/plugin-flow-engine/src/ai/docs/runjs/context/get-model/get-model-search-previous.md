---
title: "Find Across Views/Dialogs"
description: "Use ctx.getModel(uid, true) to find model instances in upstream engines."
---

# Find Across Views/Dialogs

In view scope or dialog scenarios, the current engine may only hold child models and needs to search parent models from upstream engines. In this case, you can use `ctx.getModel(uid, true)`:

```ts
const model = ctx.getModel(otherViewModelUid, true);
```

> `searchInPreviousEngines: true` will keep searching upstream engines when the model is not found in the current engine,
> commonly used to reuse an already loaded model tree across nested views/dialogs.
