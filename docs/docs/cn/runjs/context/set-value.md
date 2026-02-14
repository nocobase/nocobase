# ctx.setValue()

在 JSField、JSItem 等可编辑字段场景中，设置当前字段的值。与 `ctx.getValue()` 配合可实现与表单的双向绑定。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSField** | 可编辑自定义字段中写入用户选择或计算后的值 |
| **JSItem** | 表格/子表格的可编辑项中更新当前单元格值 |
| **JSColumn** | 表格列渲染时根据逻辑更新对应行的字段值 |

> 注意：`ctx.setValue(v)` 仅在带表单绑定的 RunJS 上下文中可用；事件流、联动规则、JSBlock 等无字段绑定场景中不存在此方法，使用前建议用可选链：`ctx.setValue?.(value)`。

## 类型定义

```ts
setValue<T = any>(value: T): void;
```

- **参数**：`value` 为要写入的字段值，类型由字段的表单项类型决定。

## 行为说明

- `ctx.setValue(v)` 会更新当前字段在 Ant Design Form 中的值，并触发相关表单联动与校验逻辑。
- 表单尚未渲染完成或字段未注册时，调用可能无效，建议配合 `ctx.getValue()` 确认写入结果。

## 示例

### 与 getValue 配合实现双向绑定

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### 根据条件设置默认值

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### 联动其他字段时回写当前字段

```ts
// 当某字段变更时，同步更新当前字段
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: '自定义', value: 'custom' });
}
```

## 注意事项

- 在非可编辑字段（如 JSField 详情模式、JSBlock）中，`ctx.setValue` 可能为 `undefined`，建议使用 `ctx.setValue?.(value)` 避免报错。
- 对关联字段（m2o、o2m 等）设置值时，需传入与字段类型匹配的结构（如 `{ id, [titleField]: label }`），具体以字段配置为准。

## 相关

- [ctx.getValue()](./get-value.md) - 获取当前字段值，与 setValue 配合实现双向绑定
- [ctx.form](./form.md) - Ant Design Form 实例，可读写其它字段
- `js-field:value-change` - 外部值变更时触发的容器事件，用于更新显示
