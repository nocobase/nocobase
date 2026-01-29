---
title: "终止当前流 (ctx.exit)"
description: "在业务条件不满足或用户取消操作时，终止当前这条流的后续步骤。"
---

# 终止当前流

```ts
// 在确认对话框中，用户点击取消时，终止当前流
if (!confirmed) {
  ctx.exit();
}

// 在参数校验失败时，终止当前流
if (!isValid(params)) {
  // 可先给出提示
  ctx.message.error('参数不合法');
  // 然后终止当前流，后续步骤不会再执行
  ctx.exit();
}
```

> 提示：
> - `ctx.exit()` 只终止当前这条流，不会影响同一事件中其他流的执行
> - 若希望终止当前事件中所有相关流，请使用 `ctx.exitAll()`
