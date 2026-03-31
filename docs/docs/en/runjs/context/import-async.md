# ctx.importAsync()

Dynamically loads **ESM modules** or **CSS** by URL; use in all RunJS scenarios. For third-party ESM use `ctx.importAsync()`; for UMD/AMD use `ctx.requireAsync()`. Pass a `.css` URL to load and inject styles.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock** | Load Vue, ECharts, Tabulator, etc. for custom charts, tables, boards |
| **JSField / JSItem / JSColumn** | Load small ESM utils (e.g. dayjs plugins) for rendering |
| **Event flow / action events** | Load dependencies then run logic |

## Type

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | ESM or CSS URL. Supports shorthand `<package>@<version>` or subpath `<package>@<version>/<path>` (e.g. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), resolved with configured CDN prefix; full URLs also supported. For `.css` URLs, loads and injects styles. For React-dependent libs add `?deps=react@18.2.0,react-dom@18.2.0` to share the same React instance. |

## Returns

- Resolved module namespace object (Promise value).

## URL format

- **ESM and CSS**: Besides ESM, you can load CSS (pass a `.css` URL; it is injected into the page).
- **Shorthand**: When not configured, **https://esm.sh** is used as CDN prefix. E.g. `vue@3.4.0` → `https://esm.sh/vue@3.4.0`.
- **?deps**: For React-dependent libs (e.g. `@dnd-kit/core`, `react-big-calendar`) add `?deps=react@18.2.0,react-dom@18.2.0` to avoid Invalid hook call from multiple React instances.
- **Self-hosted CDN**: Set env vars for intranet or custom service:
  - **ESM_CDN_BASE_URL**: ESM CDN base (default `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: Optional suffix (e.g. jsDelivr `/+esm`)
  - Reference: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## vs ctx.requireAsync()

- **ctx.importAsync()**: Loads **ESM**; returns module namespace; good for Vue, dayjs, etc. (ESM builds).
- **ctx.requireAsync()**: Loads **UMD/AMD** or global scripts; good for ECharts, FullCalendar (UMD), etc. If a lib has ESM, prefer `ctx.importAsync()`.

## Examples

### Basic

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');

await ctx.importAsync('https://cdn.example.com/theme.css');
```

### ECharts

```ts
const echarts = await ctx.importAsync('echarts@5.4.3');

const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

const chart = echarts.init(chartEl);

const option = {
  title: { text: 'Sales Overview', left: 'center' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['Sales', 'Profit'], top: '10%' },
  xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Sales', type: 'bar', data: [120, 200, 150, 80, 70, 110] },
    { name: 'Profit', type: 'line', data: [20, 40, 30, 15, 12, 25] },
  ],
};

chart.setOption(option);

window.addEventListener('resize', () => chart.resize());

chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator

```ts
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

const tableEl = document.createElement('div');
ctx.render(tableEl);

const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Beijing' },
    { id: 2, name: 'Bob', age: 30, city: 'Shanghai' },
    { id: 3, name: 'Charlie', age: 28, city: 'Guangzhou' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'Name', field: 'name', width: 150 },
    { title: 'Age', field: 'age', width: 100 },
    { title: 'City', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM)

```ts
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin.default || dayGridPlugin],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth',
  },
});

calendar.render();
```

### dnd-kit (with ?deps)

For React-based libs like `@dnd-kit/core`, use `?deps=react@18.2.0,react-dom@18.2.0` so the same React instance is used and hooks work:

```ts
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const core = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
// Use core (DndContext, useDraggable, useDroppable, etc.) with React
```

### react-big-calendar

```tsx
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

const React = await ctx.importAsync('react@18.2.0');
const { Calendar, dateFnsLocalizer } = await ctx.importAsync('react-big-calendar@1.11.4?deps=react@18.2.0,react-dom@18.2.0');
const { format, parse, startOfWeek, getDay } = await ctx.importAsync('date-fns@2.30.0');
const enUS = await ctx.importAsync('date-fns@2.30.0/locale/en-US.js');

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

const events = [
  { title: 'All Day Event', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Meeting', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

ctx.render(
  <Calendar
    localizer={localizer}
    events={events}
    startAccessor="start"
    endAccessor="end"
    style={{ height: '80vh' }}
  />
);
```

## Notes

- Depends on network/CDN; for intranet set **ESM_CDN_BASE_URL** to your own service.
- When a lib has both ESM and UMD, prefer `ctx.importAsync()` for better module semantics.
- For React-dependent libs always add `?deps=react@18.2.0,react-dom@18.2.0` (or the version your app uses) to avoid Invalid hook call.

## Related

- [ctx.requireAsync()](./require-async.md): load UMD/AMD or global scripts; good for ECharts, FullCalendar (UMD)
- [ctx.render()](./render.md): render into container
