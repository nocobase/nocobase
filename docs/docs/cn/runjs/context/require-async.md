# ctx.requireAsync()

按 URL 异步加载 **UMD/AMD** 或挂载到全局的脚本，也可加载 **CSS**。适用于需使用 ECharts、Chart.js、FullCalendar（UMD 版）、jQuery 插件等 UMD/AMD 库的 RunJS 场景；传入 `.css` 地址会加载并注入样式。若库同时提供 ESM 版本，优先使用 [ctx.importAsync()](./import-async.md)。

## 适用场景

凡 RunJS 中需按需加载 UMD/AMD/global 脚本或 CSS 的场景均可使用，如 JSBlock、JSField、JSItem、JSColumn、事件流、JSAction 等。典型用途：ECharts 图表、Chart.js、FullCalendar（UMD）、dayjs（UMD）、jQuery 插件等。

## 类型定义

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | 脚本或 CSS 地址。支持**简写** `<包名>@<版本>/<文件路径>`（经 ESM CDN 解析时加 `?raw` 取原始 UMD 文件）或**完整 URL**。传入 `.css` 时加载并注入样式。 |

## 返回值

- 加载后的库对象（UMD/AMD 回调的第一个模块值）。许多 UMD 库会挂到 `window`（如 `window.echarts`），返回值可能为 `undefined`，实际使用时按库文档访问全局变量即可。
- 传入 `.css` 时返回 `loadCSS` 的结果。

## URL 格式说明

- **简写路径**：如 `echarts@5/dist/echarts.min.js`，在默认 ESM CDN（esm.sh）下会请求 `https://esm.sh/echarts@5/dist/echarts.min.js?raw`，`?raw` 用于获取原始 UMD 文件而非 ESM 包装。
- **完整 URL**：可直接写任意 CDN 地址，如 `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`。
- **CSS**：传入 `.css` 结尾的 URL 会加载并注入页面。

## 与 ctx.importAsync() 的区别

- **ctx.requireAsync()**：加载 **UMD/AMD/global** 脚本，适合 ECharts、Chart.js、FullCalendar（UMD）、jQuery 插件等；加载后库常挂到 `window`，返回值可能为库对象或 `undefined`。
- **ctx.importAsync()**：加载 **ESM 模块**，返回模块命名空间。若库同时提供 ESM，优先用 `ctx.importAsync()` 以获得更好的模块语义与 Tree-shaking。

## 示例

### 基础用法

```javascript
// 简写路径（经 ESM CDN 解析为 ...?raw）
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// 完整 URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// 加载 CSS 并注入页面
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts 图表

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('销售概览') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js 柱状图

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('数量'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs（UMD）

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## 注意事项

- **返回值形式**：UMD 库导出方式各异，返回值可能为库对象或 `undefined`；若为 `undefined`，可按库文档从 `window` 访问。
- **依赖网络**：需访问 CDN，内网环境可通过 **ESM_CDN_BASE_URL** 指向自建服务。
- **与 importAsync 选择**：库同时提供 ESM 与 UMD 时，优先用 `ctx.importAsync()`。

## 相关

- [ctx.importAsync()](./import-async.md) - 加载 ESM 模块，适合 Vue、dayjs（ESM）等
- [ctx.render()](./render.md) - 将图表等渲染到容器
- [ctx.libs](./libs.md) - 内置 React、antd、dayjs 等，无需异步加载
