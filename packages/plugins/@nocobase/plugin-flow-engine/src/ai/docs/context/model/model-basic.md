---
title: "读取和更新模型属性"
description: "通过 ctx.model 访问当前 FlowModel 的属性、状态和事件。"
---

# 读取和更新模型属性

```ts
// 读取当前模型的基本信息
const uid = ctx.model.uid;
const collection = ctx.model.collection;

// 更新模型属性（如资源的查询参数、显示配置等）
ctx.model.setProps({
  pageSize: 20,
  showHeader: true,
});

// 分发自定义事件，触发模型内部逻辑
ctx.model.dispatchEvent({
  type: 'refresh',
  payload: {
    from: 'js-block',
  },
});
```

> 提示：
> - `ctx.model` 始终指向当前正在执行的 FlowModel 实例
> - 不同类型的模型（BlockModel / ActionModel / PageModel 等）在 `setProps`、`dispatchEvent` 等方法上的可用字段会有所不同
> - 若需要按 uid 访问其他模型，请使用 `ctx.getModel(uid)`
