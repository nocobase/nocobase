---
title: "在不同视图/弹窗中查找"
description: "通过 ctx.getModel(uid, true) 在上游引擎中查找模型实例。"
---

# 在不同视图/弹窗中查找

在视图作用域或弹窗场景中，当前引擎可能只持有子模型，需要从上游引擎中查找父模型。这时可以使用 `ctx.getModel(uid, true)`：

```ts
const model = ctx.getModel(otherViewModelUid, true);
```

> `searchInPreviousEngines: true` 会在当前引擎找不到模型时，继续向上游引擎查找，
> 常用于多层视图 / 弹窗嵌套下重用已加载的模型树。
