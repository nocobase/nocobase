# JSItemModel

用于表单网格中的“自定义项”（非字段绑定）。你可以用 JS 渲染任意内容（提示、统计、预览、按钮等），并与表单、记录上下文交互。

典型场景：CreateForm（新建）、EditForm（编辑）中展示与表单字段联动的实时预览或说明；或在表单中嵌入轻交互组件。

## 可用上下文（常用）
- `ctx.element`：ElementProxy（安全封装的容器）。用于写入 DOM、绑定事件。
- `ctx.form`：AntD Form 实例，可 `getFieldValue/setFieldValue/validateFields` 等。
- `ctx.formValues`：当前表单值快照（简便读取方式）。
- `ctx.blockModel`：所在表单块模型（CreateFormModel/EditFormModel），可监听 `formValuesChange` 事件实现联动。
- `ctx.collection`：当前集合对象。
- `ctx.viewer`：视图控制器（drawer/dialog/popover/embed）。
- `ctx.api`：API 客户端（发起请求）。
- `ctx.t`：国际化函数。

说明：
- JSItemModel 不绑定具体字段值；如需读取表单字段，请使用 `ctx.form.getFieldValue('fieldName')` 或 `ctx.form.getFieldsValue()`。

## 示例：新增表单中的“合计金额实时预览”
<code src="./demos/create-form.tsx"></code>
在 CreateForm 中添加“其他 → JS 项（JSItemModel）”，在“JavaScript settings”里粘贴：

```js
// 根据 price、quantity 联动计算应付总额并实时展示
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  const fmt = (n) => `¥${(Number(n) || 0).toFixed(2)}`;
  ctx.element.innerHTML = `
    <div style="padding:8px 12px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;">
      <div style="font-weight:600;color:#389e0d;">预计实付：${fmt(final)}</div>
      <div style="color:#999">商品小计 ${fmt(total)}，折扣 ${(Number(discount)*100||0).toFixed(0)}%</div>
    </div>
  `;
};

// 首次渲染
render();
// 监听表单值变化（由 FormModel 派发）
ctx.blockModel?.on?.('formValuesChange', () => render());
```

## 示例：表单中打开自定义抽屉（扩展性示例）
<code src="./demos/edit-form.tsx"></code>
在 JSItemModel 的脚本中绑定点击事件，打开抽屉展示更多说明或预览：

```js
ctx.element.innerHTML = `
  <button type="button" style="padding:6px 10px;border:1px solid #1890ff;background:#fff;color:#1890ff;border-radius:4px;cursor:pointer;">
    打开预览
  </button>
`;

ctx.element.querySelector('button')?.addEventListener('click', async () => {
  const values = ctx.form.getFieldsValue();
  await ctx.viewer.drawer({
    width: '48%',
    content: `
      <div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <h3 style="margin:0 0 12px;">提交前预览</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;">${JSON.stringify(values, null, 2)}</pre>
      </div>
    `,
  });
});
```

## 进阶提示
- 可用 `ctx.api` 预取数据做联动提示（例如唯一性校验前置提示等）；
- 如需可编辑的 JS 字段，请使用可编辑字段模型（例如 `JSEditableFieldModel`）。
- 可用 `ctx.openView` 做跨区块跨页面联动，可参考 JSFieldModel 文档示例。
