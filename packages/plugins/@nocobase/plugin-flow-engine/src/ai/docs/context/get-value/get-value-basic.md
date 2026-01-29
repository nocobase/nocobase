---
title: "获取当前字段值 (ctx.getValue)"
description: "在 JSField/JSItem 中读取当前字段的最新值，与表单双向绑定。"
---

# 获取当前字段值

```ts
// 读取当前字段值（优先取表单状态，其次取字段 props）
const current = ctx.getValue();

// 常见用法：根据当前值决定渲染效果
if (current == null || current === '') {
  ctx.element.innerHTML = '<span style="color:#999">请先输入内容</span>';
} else {
  ctx.element.innerHTML = `<span>当前值：${current}</span>`;
}
```

> 提示：
> - `ctx.getValue()` 与 `ctx.setValue(v)` 搭配使用，可实现与表单的双向绑定
> - 在表单还未渲染或字段未注册时，`ctx.getValue()` 可能返回 `undefined`
