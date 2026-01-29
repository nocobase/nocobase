# ctx.blockModel

当前 JS 字段 / JS 区块所在的父块模型（BlockModel 实例）。

在表单块、表格块等场景中，`ctx.blockModel` 指向承载当前 JS 逻辑的块模型，可用于：

- 访问当前块绑定的数据表（`collection`）
- 访问当前块的数据资源（`resource`），执行刷新、获取选中行等操作
- 访问块内部的表单实例（`form`），读取或校验表单值
- 监听块事件（如 `formValuesChange`），实现联动或重渲染

## 类型定义（简化）

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

具体类型取决于当前块的类型，例如表单块通常是 `FormBlockModel`，表格块通常是 `TableBlockModel`。

## 常用属性与方法

```ts
ctx.blockModel.collection; // 当前块绑定的数据表（Collection）
ctx.blockModel.resource;   // 当前块使用的数据资源（SingleRecordResource / MultiRecordResource 等）
ctx.blockModel.form;       // 对于表单块：Antd Form 实例，支持 getFieldsValue/validateFields 等

// 事件监听（例如联动渲染摘要信息）
ctx.blockModel.on?.('formValuesChange', (values) => {
  // 根据最新表单值做联动
});

// 重新渲染当前块（部分块模型实现了 rerender）
ctx.blockModel.rerender?.();
```

> 提示：
> - 在表单相关场景中，可通过 `ctx.blockModel.form.getFieldsValue()` 获取当前表单全部字段值
> - 在表格相关场景中，可通过 `ctx.blockModel.resource.getSelectedRows()` 获取当前选中行
> - 不同 BlockModel 子类可能扩展了各自特有的方法，如展开/折叠、刷新等，可结合具体块类型使用

