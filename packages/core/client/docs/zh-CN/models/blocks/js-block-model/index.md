# JSBlockModel

## 示例

### 支持筛选的自定义区块

自定义区块

```ts
// 使用 Resource，支持 MultiRecordResource、SingleRecordResource、SQLResource
ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('users');

await ctx.resource.refresh();

ctx.model.getFilterFields = async () => {
  return ctx.dataSourceManager.getCollection('main', 'users').getFields();
}

ctx.element.innerHTML = `<pre>${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>`;
```

JS 按钮

```ts
ctx.form.submit();
const model = ctx.engine.getModel('11df49d3343');
model.rerender();
```

### SQL 数据的区块

```ts
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

ctx.element.innerHTML = `<pre>${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>`;
```

### 图表区块

```ts
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
```

### 点击弹窗

```ts
ctx.element.innerHTML = `<button class="myButton">点击我</button>`;
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
```

弹窗的 openView 参数

```ts
interface OpenViewParams {
  navigation: boolean;
  mode?: 'drawer' | 'dialog'; // 默认是 drawer
  collectionName?: string; // 数据表
  dataSourceKey?: string; // 数据源
  filterByTk?: any; // 数据表记录ID
  tabUid?: string; // 激活的标签页
}
```

## 示例：JSBlock 打开预配置的编辑弹窗

以下 Demo 展示了更贴近实际的做法：弹窗（含表单与提交流程）提前在插件中配置好，JS 代码区块只负责渲染列表并在点击时调用 `openView`。保存成功后，提交按钮内预置的 `afterSaved` 步骤会回调代码区块刷新数据。

<code src="./demos/jsblock-open-edit-after-submit-external.tsx"></code>

要点说明：
- 插件加载时就使用 `flowEngine.loadOrCreateModel` 预置了 ChildPage + EditForm，表单的 `resourceSettings` 写成 `{{ ctx.view.inputArgs.filterByTk }}`，因此每次弹窗都会根据当前点击的记录自动拉取数据。
- 弹窗通过 `ctx.runAction('openView', {...})` 打开，JSBlock 只传入主键；保存动作的 `submitSettings` 追加 `afterSaved` 步骤，调用父区块的 `ctx.onLeadSaved` 完成刷新。
- JSBlock 中仅保留列表渲染、按钮绑定和本地增删逻辑，便于普通开发者聚焦在数据展示与交互。

### Tabulator

```ts
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
```
