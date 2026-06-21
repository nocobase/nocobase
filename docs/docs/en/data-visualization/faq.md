# FAQ

## Chart Selection
### Which chart should I use?
Answer: Choose based on your data and goals:
- Trend or change: line or area
- Value comparison: column or bar
- Composition: pie or donut
- Correlation or distribution: scatter
- Hierarchy or stage progress: funnel

For more chart types, see the [ECharts examples](https://echarts.apache.org/examples).

### What chart types does NocoBase support?
Answer: Visual mode includes common charts (line, area, column, bar, pie, donut, funnel, scatter, etc.). Custom mode supports all ECharts chart types.

## Data Query Issues
### Do Visual and SQL modes share configurations?
Answer: No. Their configurations are stored separately. The mode used in your last save takes effect.

## Chart Options
### How do I configure chart fields?
Answer: In Visual mode, select fields according to the chart type. For example, line or column charts require X and Y fields; pie charts require a category field and a value field. Click `Run query` first to verify the data; field mapping is automatically matched by default.

## Preview and Save
### Do I need to preview changes manually?
Answer: In Visual mode, changes are auto‑previewed. In SQL and Custom modes, to avoid frequent refreshes, finish editing and click `Preview` manually.

### Why is the preview lost after closing the dialog?
Answer: Preview is for temporary viewing. Save changes before closing; unsaved changes are not retained.