# FAQ

## Chart selection
### How should I choose the right chart?
Answer: Choose based on your data goals:
- Trend and change: line or area
- Value comparison: column or bar
- Composition: pie or donut
- Correlation and distribution: scatter
- Hierarchy and stage progress: funnel

For more chart types, see the [ECharts examples](https://echarts.apache.org/examples).

### Which charts does NocoBase support?
Answer: Visual configuration includes common charts (line, area, column, bar, pie, donut, funnel, scatter, etc.). Custom configuration can use all ECharts chart types.

## Data query issues
### Are visual configuration and SQL configuration interoperable?
Answer: No. They are stored independently. The mode used at the time of the last save takes effect.

## Chart options issues
### How should I configure chart fields?
Answer: In visual configuration, select fields based on chart type. For example, line/column charts require X and Y fields; pie charts require a category field and a value field. It is recommended to Run query first to verify data; field mapping is auto‑matched by default.

## Preview/save issues
### Do I need to preview manually after changes?
Answer: In visual mode, changes are auto-previewed. In SQL and Custom modes, to avoid frequent refreshes, finish editing and click Preview manually.

### After closing the dialog, the chart preview is lost?
Answer: Preview is for temporary viewing. Save changes before closing; unsaved changes are not retained.