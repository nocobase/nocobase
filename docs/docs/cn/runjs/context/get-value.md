# ctx.getValue()

在 JSField / JSItem 等场景中，获取当前字段的最新值。与 `ctx.setValue(v)` 配合可实现与表单的双向绑定。

## 类型定义（简化）

```ts
getValue<T = any>(): T | undefined;
```

- 返回值：当前字段值。类型由字段的表单项类型决定，在字段未注册或未填写时可能为 `undefined`。

> 说明：`ctx.getValue()` 一般优先从表单状态读取；若不存在则回退到字段的初始值 / props。
