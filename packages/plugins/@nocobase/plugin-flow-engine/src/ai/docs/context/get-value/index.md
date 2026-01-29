# ctx.getValue()

在 JSField / JSItem 等场景下，获取当前字段的最新值。  
与 `ctx.setValue(v)` 搭配使用，可实现与表单的双向绑定。

## 类型定义（简化）

```ts
getValue<T = any>(): T | undefined;
```

- 返回值：当前字段值，类型由该字段对应的表单项类型决定；在字段尚未注册或尚未填写时可能为 `undefined`。

> 说明：`ctx.getValue()` 通常优先读取表单状态中的值，如果表单状态中不存在，则回退到字段的初始值 / props。

## 使用示例

- [获取当前字段值](./get-value-basic.md)

ctx.getValue()/ctx.setValue()
