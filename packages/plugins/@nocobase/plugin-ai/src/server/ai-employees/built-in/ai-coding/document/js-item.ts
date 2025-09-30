/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js-item-model',
  content: String.raw`# JSItemModel

用于表单网格中的“自定义项”（非字段绑定）。你可以用 JS 渲染任意内容（提示、统计、预览、按钮等），并与表单、记录上下文交互。

典型场景：CreateForm（新建）、EditForm（编辑）中展示与表单字段联动的实时预览或说明；或在表单中嵌入轻交互组件。

## 可用上下文（常用）
- \`ctx.element\`：ElementProxy（安全封装的容器）。用于写入 DOM、绑定事件。
- \`ctx.form\`：AntD Form 实例，可 \`getFieldValue/setFieldValue/validateFields\` 等。
- \`ctx.formValues\`：当前表单值快照（简便读取方式）。
- \`ctx.blockModel\`：所在表单块模型（CreateFormModel/EditFormModel），可监听 \`formValuesChange\` 事件实现联动。
- \`ctx.collection\`：当前集合对象。
- \`ctx.viewer\`：视图控制器（drawer/dialog/popover/embed）。
- \`ctx.api\`：API 客户端（发起请求）。
- \`ctx.t\`：国际化函数。

说明：
- JSItemModel 不绑定具体字段值；如需读取表单字段，请使用 \`ctx.form.getFieldValue('fieldName')\` 或 \`ctx.form.getFieldsValue()\`。

## 示例：新增表单中的“合计金额实时预览”
在 CreateForm 中添加“其他 → JS 项（JSItemModel）”，在“JavaScript settings”里粘贴：

\`\`\`javascript
// 根据 price、quantity 联动计算应付总额并实时展示
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  const fmt = (n) => \`¥\${(Number(n) || 0).toFixed(2)}\`;
  ctx.element.innerHTML = \`
    <div style="padding:8px 12px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;">
      <div style="font-weight:600;color:#389e0d;">预计实付：\${fmt(final)}</div>
      <div style="color:#999">商品小计 \${fmt(total)}，折扣 \${(Number(discount)*100||0).toFixed(0)}%</div>
    </div>
  \`;
};

// 首次渲染
render();
// 监听表单值变化（由 FormModel 派发）
ctx.blockModel?.on?.('formValuesChange', () => render());
\`\`\`

## 示例：表单中打开自定义抽屉（扩展性示例）
在 JSItemModel 的脚本中绑定点击事件，打开抽屉展示更多说明或预览：

\`\`\`javascript
ctx.element.innerHTML = \`
  <button type="button" style="padding:6px 10px;border:1px solid #1890ff;background:#fff;color:#1890ff;border-radius:4px;cursor:pointer;">
    打开预览
  </button>
\`;

ctx.element.querySelector('button')?.addEventListener('click', async () => {
  const values = ctx.form.getFieldsValue();
  await ctx.viewer.drawer({
    width: '48%',
    content: \`
      <div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <h3 style="margin:0 0 12px;">提交前预览</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;">\${JSON.stringify(values, null, 2)}</pre>
      </div>
    \`,
  });
});
\`\`\`

## 进阶提示
- 可用 \`ctx.api\` 预取数据做联动提示（例如唯一性校验前置提示等）；
- 如需可编辑的 JS 字段，请使用可编辑字段模型（例如 \`JSEditableFieldModel\`）。
- 可用 \`ctx.openView\` 做跨区块跨页面联动，可参考 JSFieldModel 文档示例。

</nocobase-api-reference>

<nocobase-api-reference name='JSColumnModel'>
# JSColumnModel

用于表格中的“自定义列”，以 JavaScript 渲染单元格内容。适合表格汇总或者计算，或者请求远端关联数据展示等场景。
与普通字段列不同，JSColumnModel 不绑定具体字段值，你需要通过 \`ctx.record\` 自行读取当前行数据并渲染。

## 可用上下文（常用）
- \`ctx.element\`：ElementProxy（当前单元格容器）。
- \`ctx.record\`：当前行记录对象。
- \`ctx.collection\`：当前集合对象（可获取主键、字段信息）。
- \`ctx.viewer\`：视图控制器，支持 \`drawer\`、\`dialog\`、\`popover\`、\`embed\`。
- \`ctx.api\`：API 客户端，可在点击时发起请求。
- \`ctx.t\`：国际化函数。

说明：
- 表格逐行渲染时会为每行创建 fork 上下文，\`ctx.record\` 均指向当前行。

## 示例：状态徽标列

\`\`\`javascript
const status = String(ctx.record?.status ?? '').toLowerCase();
const color = status === 'done' ? '#52c41a' : status === 'pending' ? '#faad14' : '#ff4d4f';
const text = status || 'unknown';

ctx.element.innerHTML = \`
  <span style="display:inline-flex;align-items:center;gap:6px;">
    <i style="width:8px;height:8px;border-radius:50%;background:\${color};display:inline-block;"></i>
    <span style="color:\${color};text-transform:capitalize;">\${text}</span>
  </span>
\`;
\`\`\`

## 示例：点击打开抽屉查看详情（扩展性示例）
见上方 Demo 中 \`ctx.viewer.drawer\` 的用法。

\`\`\`javascript
// 简单 JSON 预览按钮
ctx.element.innerHTML = \`
  <a href="javascript:;" style="color:#1677ff;">查看</a>
\`;

ctx.element.querySelector('a')?.addEventListener('click', async () => {
  const pk = ctx.collection?.getFilterByTK?.(ctx.record); // 当前行主键（若集合可推断）
  await ctx.viewer.drawer({
    width: '56%',
    content: \`
      <div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <h3 style="margin:0 0 12px;">行数据预览（#\${pk ?? ctx.recordIndex}）</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;">\${JSON.stringify(ctx.record, null, 2)}</pre>
      </div>
    \`,
  });
});
\`\`\`

## 示例：组合多字段为一列的展示
将多个字段合并为单列显示（如 “姓名（部门） - 职级”）：

\`\`\`javascript
const name = ctx.record?.name ?? '';
const dept = ctx.record?.department?.name ?? '';
const level = ctx.record?.level ?? '';

ctx.element.innerHTML = \`
  <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
    <strong>\${name}</strong>
    <span style="color:#999">（\${dept}）</span>
    <span style="color:#999"> - \${level}</span>
  </div>
\`;
\`\`\`

## 进阶提示
- 可通过 \`ctx.api\` 请求后端，动态刷新 \`ctx.element\` 内容；
- 对于“绑定字段值”的场景，请使用JS字段列，JSColumn 适合完全自定义展示与行为, 例如跨字段的汇总等场景。
- 可用 \`ctx.openView\` 做跨区块跨页面联动，可参考 JSFieldModel 文档示例。`,
};
