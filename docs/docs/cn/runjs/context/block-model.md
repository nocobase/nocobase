# ctx.blockModel

当前 JS 字段 / JS 区块所在的父区块模型（BlockModel 实例）。在 JSField、JSItem、JSColumn 等场景下，`ctx.blockModel` 指向承载当前 JS 逻辑的表单区块或表格区块；在 JSBlock 独立区块中可能为 `null` 或与 `ctx.model` 相同。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSField** | 表单字段内访问父表单区块的 `form`、`collection`、`resource`，实现联动或校验 |
| **JSItem** | 子表格项中访问父表格/表单区块的资源、数据表信息 |
| **JSColumn** | 表格列中访问父表格区块的 `resource`（如 `getSelectedRows`）、`collection` |
| **表单操作 / 事件流** | 访问 `form` 做提交前校验、`resource` 做刷新等 |

> 注意：`ctx.blockModel` 仅在存在父区块的 RunJS 上下文中可用；独立 JSBlock（无父表单/表格）时可能为 `null`，使用前建议做空值判断。

## 类型定义

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

具体类型取决于父区块类型：表单区块多为 `FormBlockModel`、`EditFormModel`，表格区块多为 `TableBlockModel`。

## 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `uid` | `string` | 区块模型唯一标识 |
| `collection` | `Collection` | 当前区块绑定的数据表 |
| `resource` | `Resource` | 区块使用的资源实例（`SingleRecordResource` / `MultiRecordResource` 等） |
| `form` | `FormInstance` | 表单区块：Ant Design Form 实例，支持 `getFieldsValue`、`validateFields`、`setFieldsValue` 等 |
| `emitter` | `EventEmitter` | 事件发射器，可监听 `formValuesChange`、`onFieldReset` 等 |

## 与 ctx.model、ctx.form 的关系

| 需求 | 推荐用法 |
|------|----------|
| **当前 JS 所在的父区块** | `ctx.blockModel` |
| **读写表单字段** | `ctx.form`（等价于 `ctx.blockModel?.form`，表单区块下更便捷） |
| **当前执行上下文所在模型** | `ctx.model`（JSField 中为字段模型，JSBlock 中为区块模型） |

在 JSField 中，`ctx.model` 为字段模型，`ctx.blockModel` 为承载该字段的表单/表格区块；`ctx.form` 通常即 `ctx.blockModel.form`。

## 示例

### 表格：获取选中行并处理

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('请先选择数据');
  return;
}
```

### 表单场景：校验并刷新

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### 监听表单变化

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // 根据最新表单值做联动或重新渲染
});
```

### 触发区块重新渲染

```ts
ctx.blockModel?.rerender?.();
```

## 注意事项

- `ctx.blockModel` 在**独立 JSBlock**（无父表单/表格区块）时可能为 `null`，访问其属性前建议使用可选链：`ctx.blockModel?.resource?.refresh?.()`。
- 在**JSField / JSItem / JSColumn** 中，`ctx.blockModel` 为承载当前字段的表单或表格区块；在**JSBlock** 中，可能为自身或上层区块，取决于实际层级。
- `resource` 仅在数据区块下存在；`form` 仅在表单区块下存在，表格区块通常无 `form`。

## 相关

- [ctx.model](./model.md)：当前执行上下文所在模型
- [ctx.form](./form.md)：表单实例，表单区块下常用
- [ctx.resource](./resource.md)：资源实例（等价于 `ctx.blockModel?.resource`，有则直接使用）
- [ctx.getModel()](./get-model.md)：按 uid 获取其他区块模型
