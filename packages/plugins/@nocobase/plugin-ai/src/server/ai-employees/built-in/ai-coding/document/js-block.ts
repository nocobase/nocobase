/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'js-block-model',
  content: String.raw`# JSBlockModel

## 示例

### 支持筛选的自定义区块

自定义区块

\`\`\`typescript
// 使用 Resource，支持 MultiRecordResource、SingleRecordResource、SQLResource
ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('users');

await ctx.resource.refresh();

ctx.model.getFilterFields = async () => {
  return ctx.dataSourceManager.getCollection('main', 'users').getFields();
}

ctx.element.innerHTML = \`<pre>\${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>\`;
\`\`\`

JS 按钮

\`\`\`typescript
ctx.form.submit();
const model = ctx.engine.getModel('11df49d3343');
model.rerender();
\`\`\`

### SQL 数据的区块

\`\`\`typescript
if (ctx.flowSettingsEnabled) {
  await ctx.sql.save({
    uid: ctx.model.uid,
    sql: 'select * from users where id = {{ctx.user.id}}',
    dataSourceKey: 'main',
  });
}

ctx.useResource('SQLResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setFilterByTk(ctx.model.uid);
await ctx.resource.refresh();

ctx.model.getFilterFields = async () => {
  return ctx.dataSourceManager.getCollection('main', 'users').getFields();
}

ctx.element.innerHTML = \`<pre>\${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>\`;
\`\`\`

### 图表区块

\`\`\`typescript
ctx.element.innerHTML = '';
const chartContainer = document.createElement('div');
chartContainer.style.height = '400px';
ctx.element.appendChild(chartContainer);

const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) {
  return;
}
const chart = echarts.init(chartContainer);
// Generate random data
const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
const randomData = categories.map(() => Math.floor(Math.random() * 50) + 1);
const option = {
  title: { text: 'ECharts Example (Random Data)' },
  tooltip: {},
  xAxis: { data: categories },
  yAxis: {},
  series: [{ name: 'Sales', type: 'bar', data: randomData }],
};
chart.setOption(option);
chart.resize();
window.addEventListener('resize', () => chart.resize());
\`\`\`

### 点击弹窗

\`\`\`typescript
ctx.element.innerHTML = \`<button class="myButton">点击我</button>\`;
// 绑定点击事件
const button = ctx.element.querySelector('.myButton');
button.addEventListener('click', () => {
  ctx.runAction('openView', {
    navigation: false, // 必填
    mode: 'dialog',
    collectionName: 'users',
    dataSourceKey: 'main',
    filterByTk: 1,
  });
});
\`\`\`

弹窗的 openView 参数

\`\`\`typescript
interface OpenViewParams {
  navigation: boolean;
  mode?: 'drawer' | 'dialog'; // 默认是 drawer
  collectionName?: string; // 数据表
  dataSourceKey?: string; // 数据源
  filterByTk?: any; // 数据表记录ID
  tabUid?: string; // 激活的标签页
}
\`\`\`

## 示例：JSBlock 打开预配置的编辑弹窗

以下 Demo 展示了更贴近实际的做法：弹窗（含表单与提交流程）提前在插件中配置好，JS 代码区块只负责渲染列表并在点击时调用 \`openView\`。保存成功后，提交按钮内预置的 \`afterSaved\` 步骤会回调代码区块刷新数据。

\`\`\`javascript
const submitActionUid = 'jsblock-external-submit';

ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('lead');
ctx.resource.setDataSourceKey('main');
ctx.resource.setPageSize(100);
ctx.resource.setFields(['id','name','company','email','phone','status','rating']);

ctx.resource.on('refresh', render);

const handleLeadSaved = async () => {
  await ctx.resource.refresh();
  ctx.message.success('保存成功，已刷新列表');
  render();
};

// 确保在外部已创建的提交按钮上追加 afterSaved 回调步骤
async function ensureAfterSavedStep() {
  try {
    var submitAction = ctx.engine.getModel(submitActionUid);
    if (!submitAction) return;
    var flow = submitAction.flowRegistry && submitAction.flowRegistry.getFlow ? submitAction.flowRegistry.getFlow('submitSettings') : null;
    if (!flow) {
      var base = submitAction.getFlow && submitAction.getFlow('submitSettings');
      if (base && submitAction.flowRegistry && submitAction.flowRegistry.addFlow) {
        var opts = base.serialize ? base.serialize() : {};
        delete opts.key;
        flow = submitAction.flowRegistry.addFlow('submitSettings', opts);
      }
    }
    if (!flow) return;
    if (flow.hasStep && flow.hasStep('jsBlockAfterSaved')) {
      try { flow.removeStep('jsBlockAfterSaved'); } catch (e) {}
    }
    flow.addStep && flow.addStep('jsBlockAfterSaved', {
      sort: 9999,
      async handler() { await handleLeadSaved(); },
    });
    if (flow.save) { try { await flow.save(); } catch(e) {} }
  } catch (e) {}
}

await ensureAfterSavedStep();
await ctx.resource.refresh();

function render() {
  const list = ctx.resource.getData() || [];
  const rows = list
    .map(function (record) {
      return (
        '<tr>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.id || '') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.name || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.company || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.status || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.rating || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">' +
        '<button class="btn-edit" data-id="' + (record.id || '') + '" style="padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;">编辑</button>' +
        '<button class="btn-del" data-id="' + (record.id || '') + '" style="margin-left:8px;padding:4px 8px;border:1px solid #ffccc7;border-radius:4px;background:#fff;color:#ff4d4f;cursor:pointer;">删除</button>' +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  ctx.element.innerHTML =
    '<div style="padding:12px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<h3 style="margin:0;font-size:16px;">线索管理（示例）</h3>' +
    '<button id="btnAdd" style="padding:6px 10px;border:1px solid #91d5ff;border-radius:4px;background:#e6f7ff;color:#1677ff;cursor:pointer;">新增线索</button>' +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
    '<thead>' +
    '<tr style="background:#fafafa;">' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">ID</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">姓名</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">公司</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">状态</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">评级</th>' +
    '<th style="text-align:right;padding:6px 8px;border-bottom:1px solid #f0f0f0;">操作</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>' +
    '</div>';

  const btnAdd = ctx.element.querySelector('#btnAdd');
  btnAdd.addEventListener('click', async () => {
    const now = new Date().toLocaleString('zh-CN');
    await ctx.resource.create({ name: '新线索 ' + now, company: '示例公司', status: 'Initial Contact', rating: 'Warm' });
    render();
  });

  const tbody = ctx.element.querySelector('tbody');
  tbody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = Number(button.getAttribute('data-id'));

    if (button.classList.contains('btn-edit')) {
      await ctx.runAction('openView', {
        navigation: false,
        mode: 'drawer',
        collectionName: 'lead',
        dataSourceKey: 'main',
        filterByTk: id,
      });
    }

    if (button.classList.contains('btn-del')) {
      await ctx.resource.destroy(id);
      render();
    }
  });
}

render();
\`\`\`

要点说明：
- 插件加载时就使用 \`flowEngine.loadOrCreateModel\` 预置了 ChildPage + EditForm，表单的 \`resourceSettings\` 写成 \`{{ ctx.view.inputArgs.filterByTk }}\`，因此每次弹窗都会根据当前点击的记录自动拉取数据。
- 弹窗通过 \`ctx.runAction('openView', {...})\` 打开，JSBlock 只传入主键；保存动作的 \`submitSettings\` 追加 \`afterSaved\` 步骤，调用父区块的 \`ctx.onLeadSaved\` 完成刷新。
- JSBlock 中仅保留列表渲染、按钮绑定和本地增删逻辑，便于普通开发者聚焦在数据展示与交互。

### Tabulator

\`\`\`typescript
ctx.element.innerHTML = '';
const tableContainer = document.createElement('div');
// tableContainer.style.height = '400px';
ctx.element.appendChild(tableContainer);

// 动态加载 Tabulator 的 CSS
await ctx.loadCSS('https://cdn.jsdelivr.net/npm/tabulator-tables@5.5.0/dist/css/tabulator.min.css');

// 动态加载 Tabulator 的 JS
const Tabulator = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/tabulator-tables@5.5.0/dist/js/tabulator.min.js');
if (!Tabulator) {
  return;
}

// 示例数据
const tableData = [
  { id: 1, name: 'Alice', age: 25, gender: 'Female' },
  { id: 2, name: 'Bob', age: 30, gender: 'Male' },
  { id: 3, name: 'Charlie', age: 35, gender: 'Male' },
  { id: 4, name: 'Diana', age: 28, gender: 'Female' },
];

// 初始化 Tabulator 表格
const table = new Tabulator(tableContainer, {
  data: tableData, // 数据源
  layout: 'fitColumns', // 列宽自适应
  columns: [
    { title: 'ID', field: 'id', width: 50 },
    { title: 'Name', field: 'name', width: 150 },
    { title: 'Age', field: 'age', width: 100 },
    { title: 'Gender', field: 'gender', width: 100 },
  ],
});

// 监听窗口大小变化，调整表格大小
window.addEventListener('resize', () => table.redraw());
\`\`\``,
};
