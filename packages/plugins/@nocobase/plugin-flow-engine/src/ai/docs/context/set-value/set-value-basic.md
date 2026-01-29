---
title: "设置当前字段值 (ctx.setValue)"
description: "在 JSField/JSItem 中更新当前字段的值，并与表单状态保持同步。"
---

# 设置当前字段值

```ts
// 将当前字段值设置为固定默认值
ctx.setValue('DEFAULT');

// 在输入内容为空时，恢复为占位默认值
if (!ctx.getValue()) {
  ctx.setValue('N/A');
}

// 根据其他变量动态更新当前字段值
const next = String(externalValue ?? '');
ctx.setValue(next);
```

> 提示：
> - `ctx.setValue(v)` 会更新当前字段的表单值，并触发表单的变更逻辑（如校验、联动等）
> - 通常与 `ctx.getValue()` 搭配使用，先读当前值再按业务规则写回新值

