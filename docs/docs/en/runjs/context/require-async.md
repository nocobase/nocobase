# ctx.requireAsync()

Asynchronously loads **UMD/AMD** or globally mounted scripts via URL, as well as **CSS**. It is suitable for RunJS scenarios that require UMD/AMD libraries such as ECharts, Chart.js, FullCalendar (UMD version), or jQuery plugins. If a library also provides an ESM version, prioritize using [ctx.importAsync()](./import-async.md).

## Use Cases

Can be used in any RunJS scenario where UMD/AMD/global scripts or CSS need to be loaded on demand, such as JSBlock, JSField, JSItem, JSColumn, Workflow, JSAction, etc. Typical uses: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery plugins, etc.

## Type Definition

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | The script or CSS address. Supports **shorthand** `<package>@<version>/<file-path>` (appends `?raw` for the original UMD file when resolved via ESM CDN) or a **full URL**. Loads and injects styles if a `.css` file is passed. |

## Return Value

- The loaded library object (the first module value of the UMD/AMD callback). Many UMD libraries attach themselves to `window` (e.g., `window.echarts`), so the return value might be `undefined`. In such cases, access the global variable as per the library's documentation.
- Returns the result of `loadCSS` when a `.css` file is passed.

## URL Format Description

- **Shorthand path**: e.g., `echarts@5/dist/echarts.min.js`. Under the default ESM CDN (esm.sh), it requests `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. The `?raw` parameter is used to fetch the original UMD file instead of an ESM wrapper.
- **Full URL**: Any CDN address can be used directly, such as `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: A URL ending in `.css` will be loaded and injected into the page.

## Difference from ctx.importAsync()

- **ctx.requireAsync()**: Loads **UMD/AMD/global** scripts. Suitable for ECharts, Chart.js, FullCalendar (UMD), jQuery plugins, etc. Libraries often attach to `window` after loading; the return value may be the library object or `undefined`.
- **ctx.importAsync()**: Loads **ESM modules** and returns the module namespace. If a library provides ESM, use `ctx.importAsync()` for better module semantics and Tree-shaking.

## Examples

### Basic Usage

```javascript
// Shorthand path (resolved via ESM CDN as ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Full URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Load CSS and inject into the page
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts Chart

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Sales Overview') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js Bar Chart

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
      datasets: [{ label: ctx.t('Quantity'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Notes

- **Return value format**: UMD export methods vary; the return value may be the library object or `undefined`. If `undefined`, access it via `window` according to the library's documentation.
- **Network dependency**: Requires CDN access. In internal network environments, you can point to a self-hosted service via **ESM_CDN_BASE_URL**.
- **Choosing between importAsync**: If a library provides both ESM and UMD, prioritize `ctx.importAsync()`.

## Related

- [ctx.importAsync()](./import-async.md) - Loads ESM modules, suitable for Vue, dayjs (ESM), etc.
- [ctx.render()](./render.md) - Renders charts and other components into a container.
- [ctx.libs](./libs.md) - Built-in React, antd, dayjs, etc., no asynchronous loading required.