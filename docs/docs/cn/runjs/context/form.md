# ctx.form

当前区块内的 Ant Design Form 实例，用于读写表单字段、触发校验与提交。等价于 `ctx.blockModel?.form`，在表单区块（Form、EditForm、子表单等）下可直接使用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSField** | 读写其他表单字段实现联动、根据其他字段值做计算或校验 |
| **JSItem** | 子表格项中读写同行或其他字段，实现表格内联动 |
| **JSColumn** | 表格列中读取该行或关联字段值用于渲染 |
| **表单操作 / 事件流** | 提交前校验、批量更新字段、重置表单等 |

> 注意：`ctx.form` 仅在表单区块（Form、EditForm、子表单等）相关的 RunJS 上下文中可用；非表单场景（如 JSBlock 独立区块、表格区块）可能不存在，使用前建议做空值判断：`ctx.form?.getFieldsValue()`。

## 类型定义

```ts
form: FormInstance<any>;
```

`FormInstance` 为 Ant Design Form 的实例类型，常用方法如下。

## 常用方法

### 读取表单值

```ts
// 读取当前已注册字段的值（默认仅包含已渲染的字段）
const values = ctx.form.getFieldsValue();

// 读取所有字段的值（包含已注册但未渲染的字段，如隐藏、折叠区内的）
const allValues = ctx.form.getFieldsValue(true);

// 读取单个字段
const email = ctx.form.getFieldValue('email');

// 读取嵌套字段（如子表格）
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### 写入表单值

```ts
// 批量更新（常用于联动）
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// 更新单个字段
ctx.form.setFieldValue('remark', '已备注');
```

### 校验与提交

```ts
// 触发表单校验
await ctx.form.validateFields();

// 触发表单提交
ctx.form.submit();
```

### 重置

```ts
// 重置全部字段
ctx.form.resetFields();

// 仅重置指定字段
ctx.form.resetFields(['status', 'remark']);
```

## 与相关 context 的关系

### ctx.getValue / ctx.setValue

| 场景 | 推荐用法 |
|------|----------|
| **读写当前字段** | `ctx.getValue()` / `ctx.setValue(v)` |
| **读写其他字段** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

在当前 JS 字段内，优先用 `getValue`/`setValue` 读写本字段；需要访问其他字段时使用 `ctx.form`。

### ctx.blockModel

| 需求 | 推荐用法 |
|------|----------|
| **读写表单字段** | `ctx.form`（等价于 `ctx.blockModel?.form`，更便捷） |
| **访问父区块** | `ctx.blockModel`（含 `collection`、`resource` 等） |

### ctx.getVar('ctx.formValues')

表单值需通过 `await ctx.getVar('ctx.formValues')` 获取，不直接暴露为 `ctx.formValues`。在表单上下文中，优先用 `ctx.form.getFieldsValue()` 实时读取最新值。

## 注意事项

- `getFieldsValue()` 默认只返回已渲染字段；未渲染字段（如折叠区、条件显隐）需传 `true`：`getFieldsValue(true)`。
- 子表格等嵌套字段的路径为数组，如 `['orders', 0, 'amount']`；可用 `ctx.namePath` 获取当前字段路径，用于构造同行其他列的路径。
- `validateFields()` 会抛出错误对象，包含 `errorFields` 等信息；提交前校验失败时可用 `ctx.exit()` 终止后续步骤。
- 在事件流、联动规则等异步场景中，`ctx.form` 可能尚未就绪，建议使用可选链或空值判断。

## 示例

### 字段联动：根据类型显示不同内容

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### 根据其他字段计算当前字段

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### 子表格内读写同行其他列

```ts
// ctx.namePath 为当前字段在表单中的路径，如 ['orders', 0, 'amount']
// 读取同行 status：['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### 提交前校验

```ts
try {
  await ctx.form.validateFields();
  // 校验通过，继续提交逻辑
} catch (e) {
  ctx.message.error('请检查表单填写');
  ctx.exit();
}
```

### 确认后提交

```ts
const confirmed = await ctx.modal.confirm({
  title: '确认提交',
  content: '提交后将无法修改，确定继续？',
  okText: '确定',
  cancelText: '取消',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // 用户取消时终止
}
```

## 相关

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md)：读写当前字段值
- [ctx.blockModel](./block-model.md)：父区块模型，`ctx.form` 等价于 `ctx.blockModel?.form`
- [ctx.modal](./modal.md)：确认弹窗，常与 `ctx.form.validateFields()`、`ctx.form.submit()` 配合
- [ctx.exit()](./exit.md)：校验失败或用户取消时终止流程
- `ctx.namePath`：当前字段在表单中的路径（数组），嵌套字段时用于构造 `getFieldValue` / `setFieldValue` 的 name
