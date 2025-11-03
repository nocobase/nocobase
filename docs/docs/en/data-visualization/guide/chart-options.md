# Chart options

Configure how charts are displayed. Two modes are supported: Basic (visual) and Custom (JS). Basic is ideal for quick mapping and common properties; Custom fits complex scenarios and advanced customization.

## Panel layout


![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)


> Tips: To configure more easily, collapse other panels first.

Top action bar
Mode selection:
- Basic: Visual configuration. Choose a type and complete field mapping; adjust common properties with switches.
- Custom: Write JS in the editor and return an ECharts `option`.

## Basic mode


![20251026190615](https://static-docs.nocobase.com/20251026190615.png)


### Choose chart type
- Supported: line, area, column, bar, pie, donut, funnel, scatter, etc.
- Required fields vary by chart type. First confirm column names and types in “Data query → View data”.

### Field mapping
- Line/area/column/bar:
  - `xField`: dimension (date, category, region)
  - `yField`: measure (aggregated numeric value)
  - `seriesField` (optional): series grouping (for multiple lines/groups)
- Pie/donut:
  - `Category`: categorical dimension
  - `Value`: measure
- Funnel:
  - `Category`: stage/category
  - `Value`: value (usually count or percentage)
- Scatter:
  - `xField`, `yField`: two measures or dimensions for axes

> For more chart options, refer to the ECharts docs: [Axis](https://echarts.apache.org/handbook/en/concepts/axis) and [Examples](https://echarts.apache.org/examples/en/index.html)

**Notes:**
- After changing dimensions or measures, recheck the mapping to avoid empty or misaligned charts.
- Pie/donut and funnel must provide a “category + value” combination.

### Common properties


![20251026191332](https://static-docs.nocobase.com/20251026191332.png)


- Stack, smooth (line/area)
- Labels, tooltip, legend
- Axis label rotation, split lines
- Pie/donut radius and inner radius, funnel sort order

**Recommendations:**
- Use line/area for time series with moderate smoothing; use column/bar for category comparison.
- With dense data, avoid showing all labels to prevent overlap.

## Custom mode

Return a full ECharts `option`. Suitable for advanced customization such as merging multiple series, complex tooltips, and dynamic styles. Recommended approach: consolidate data in `dataset.source`. For details, see ECharts docs: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)


![20251026191728](https://static-docs.nocobase.com/20251026191728.png)


### Data context
- `ctx.data.objects`: array of objects (each row as an object, recommended)
- `ctx.data.rows`: 2D array (with header)
- `ctx.data.columns`: 2D array grouped by columns

### Example: monthly orders line chart
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Preview and Save
- In Custom mode, after editing, click the Preview button on the right to update the chart preview.
- At the bottom, click Save to apply and persist; click Cancel to revert all changes made this time.


![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> For more on chart options, see Advanced — Custom chart configuration.
