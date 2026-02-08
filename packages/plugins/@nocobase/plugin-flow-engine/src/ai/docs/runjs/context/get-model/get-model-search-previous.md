---
title: "Get Model in View Stack"
description: "Use ctx.getModel(uid, true) to find a model in upstream engines (e.g. from inside a dialog)."
---

# Get Model in View Stack

In dialog or nested view scenarios, use `ctx.getModel(uid, true)` to search the view stack from top to root and get a model from an upstream engine (e.g. a block on the page that opened the dialog).

```ts
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

> With `searchInPreviousEngines: true`, lookup runs in the current engine and upstream engines, so you can get a model from a parent page or the dialog opener.
