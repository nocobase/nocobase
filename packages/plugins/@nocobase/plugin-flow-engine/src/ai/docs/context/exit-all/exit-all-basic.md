---
title: "终止整个流程 (ctx.exitAll)"
description: "在满足特定条件时中断当前流程及其所有后续步骤和子流程。"
---

# 终止整个流程

当在某个步骤中调用 `ctx.exitAll()` 时，会立刻抛出 `FlowExitAllException`，
FlowEngine 捕获后会终止当前流程实例及其所有后续步骤，包括嵌套调用的子流程。

## 基本用法

```ts
if (!ctx.user) {
  // 如果用户未登录，直接终止整个流程（不再执行后续步骤）
  ctx.exitAll();
}
```

> 与 `ctx.exit()` 的区别：
> - `ctx.exit()` 只终止当前流程实例（当前 FlowRuntimeContext）
> - `ctx.exitAll()` 会终止当前流程以及由当前流程触发的所有子流程（适用于全局中止场景，如权限校验失败）
