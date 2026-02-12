# ctx.setValue()

在 JSField / JSItem 等场景中，设置当前字段的值。与 `ctx.getValue()` 配合可实现与表单的双向绑定。

## 类型定义（简化）

```ts
setValue<T = any>(value: T): void;
```

- `value`：要写入的字段值。类型由字段的表单项类型决定。

> 说明：`ctx.setValue(v)` 会更新当前字段在表单中的值，并触发相关表单联动与校验逻辑。
