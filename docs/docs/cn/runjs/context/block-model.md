# ctx.blockModel

当前 JS 字段 / JS 区块所在的父区块模型（BlockModel 实例）。

在表单区块、表格区块等场景下，`ctx.blockModel` 指向承载当前 JS 逻辑的区块模型，可用于：

- 访问当前区块绑定的集合（`collection`）
- 访问区块的资源（`resource`），执行刷新、获取选中行等操作
- 访问区块内的表单实例（`form`），读取/校验表单值
- 监听区块事件（如 `formValuesChange`）实现联动或重新渲染

## 类型定义（简化）

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

具体类型取决于当前区块类型，例如表单区块多为 `FormBlockModel`，表格区块多为 `TableBlockModel`。

## 常用属性和方法

```ts
ctx.blockModel.collection; // 当前区块绑定的集合
ctx.blockModel.resource;   // 当前区块使用的资源（SingleRecordResource / MultiRecordResource 等）
ctx.blockModel.form;       // 表单区块：Antd Form 实例，支持 getFieldsValue/validateFields 等

// 监听事件（如根据表单变化渲染汇总）
ctx.blockModel.on?.('formValuesChange', (values) => {
  // 根据最新表单值处理
});

// 重新渲染当前区块（部分区块模型实现 rerender）
ctx.blockModel.rerender?.();
```

> 提示：
> - 表单相关场景可用 `ctx.blockModel.form.getFieldsValue()` 获取所有表单字段值
> - 表格相关场景可用 `ctx.blockModel.resource.getSelectedRows()` 获取当前选中行
> - 不同 BlockModel 子类可能暴露 expand/collapse、refresh 等方法，按区块类型使用
