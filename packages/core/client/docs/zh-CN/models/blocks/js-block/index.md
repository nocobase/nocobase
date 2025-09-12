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
ctx.element.innerHTML = `<button id="myButton">点击我</button>`;
// 绑定点击事件
const button = ctx.element.querySelector('#myButton');
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
}
```
