# ctx.getValue()

在 JSField、JSItem 等可编辑字段场景中，获取当前字段的最新值。与 `ctx.setValue(v)` 配合可实现与表单的双向绑定。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSField** | 可编辑自定义字段中读取用户输入或表单当前值 |
| **JSItem** | 表格/子表格的可编辑项中读取当前单元格值 |
| **JSColumn** | 表格列渲染时读取对应行的字段值 |

> 注意：`ctx.getValue()` 仅在带表单绑定的 RunJS 上下文中可用；事件流、联动规则等无字段绑定场景中不存在此方法。

## 类型定义

```ts
getValue<T = any>(): T | undefined;
```

- **返回值**：当前字段值，类型由字段的表单项类型决定；字段未注册或未填写时可能为 `undefined`。

## 取值顺序

`ctx.getValue()` 按以下顺序取值：

1. **表单状态**：优先从 Ant Design Form 的当前状态读取
2. **回退值**：若表单中无该字段，则回退到字段的初始值或 props

> 表单尚未渲染完成或字段未注册时，可能返回 `undefined`。

## 示例

### 根据当前值渲染

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>请先输入内容</span>);
} else {
  ctx.render(<span>当前值：{current}</span>);
}
```

### 与 setValue 配合实现双向绑定

```tsx
const { Input } = ctx.libs.antd;

// 读取当前值作为默认值
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## 相关

- [ctx.setValue()](./set-value.md) - 设置当前字段值，与 `getValue` 配合实现双向绑定
- [ctx.form](./form.md) - Ant Design Form 实例，可读写其它字段
- `js-field:value-change` - 外部值变更时触发的容器事件，用于更新显示
