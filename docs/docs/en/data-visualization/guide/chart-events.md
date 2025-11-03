# Custom interaction events

Write JS in the events editor and register interactions via the ECharts instance `chart` to enable linkage, such as navigating to a new page or opening a drill-down dialog.


![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)


## Register and Unregister
- Register: `chart.on(eventName, handler)`
- Unregister: `chart.off(eventName, handler)` or `chart.off(eventName)` to clear events by name

**Note:**
For safety, it's strongly recommended to unregister an event before registering it again!


## Handler params structure


![20251026222859](https://static-docs.nocobase.com/20251026222859.png)


Common fields include `params.data` and `params.name`.

## Example: click to highlight selection
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Highlight the current data point
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Downplay others
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Example: click to navigate
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Option 1: internal navigation without full page refresh (recommended), only need relative path
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Option 2: navigate to external page, full URL required
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Option 3: open external page in a new tab, full URL required
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Example: click to open details dialog (drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // register context variables for the new dialog
  });
});
```


![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)


In the newly opened dialog, use chart context variables via `ctx.view.inputArgs.XXX`.

## Preview and Save
- Click "Preview" to load and execute the event code.
- Click "Save" to persist the current event configuration.
- Click "Cancel" to revert to the last saved state.

**Recommendations:**
- Always use `chart.off('event')` before binding to avoid duplicate executions or increased memory usage.
- Use lightweight operations (e.g., `dispatchAction`, `setOption`) inside event handlers to avoid blocking the rendering process.
- Validate against chart options and data queries to ensure that the fields handled in the event are consistent with the current data.