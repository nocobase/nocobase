# ctx.importAsync()

Dynamically load **ESM modules** or **CSS** by URL, for JS block, JS field, JS action, and similar scenarios. Use `ctx.importAsync()` for third-party ESM libraries; use `ctx.requireAsync()` for UMD/AMD libraries. Passing a `.css` URL loads and injects styles.

## Type definition

```typescript
importAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | ESM module or CSS URL. Supports shorthand `<package>@<version>` or with subpath `<package>@<version>/<file>` (e.g. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), resolved using the CDN base; full URLs are also supported. Passing a `.css` URL loads and injects styles. |

## Return value

- The resolved module namespace object (Promise value).

## Notes

- **ESM and CSS**: besides ESM modules, CSS is also supported (pass a `.css` URL; it is loaded and injected into the page).
- **Shorthand**: when not configured, **https://esm.sh** is used as the CDN base. For example `vue@3.4.0` resolves to `https://esm.sh/vue@3.4.0`.
- **Self-hosted CDN**: configure an internal or self-hosted CDN via environment variables:
  - **ESM_CDN_BASE_URL**: ESM CDN base URL (default `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: optional suffix (e.g. `/+esm` for jsDelivr)
  - See: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Difference from ctx.requireAsync()

- **ctx.importAsync()**: loads **ESM modules**, returns module namespace, suitable for modern libraries (Vue, dayjs, etc.).
- **ctx.requireAsync()**: loads **UMD/AMD** or global scripts, commonly used for ECharts, FullCalendar, and similar UMD libraries. If an ESM build exists, prefer `ctx.importAsync()`.

## Examples

### Basic usage

Demonstrates the most basic dynamic loading of ESM modules and CSS by package name or full URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalent to loading from https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// With subpath (e.g. dayjs plugin)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Full URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Load CSS and inject into the page
```

### ECharts example

Use ECharts to render a sales overview chart with bar and line series.

```ts
// 1. Dynamically load ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Create chart container and render
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Initialize ECharts instance
const chart = echarts.init(chartEl);

// 4. Configure chart
const option = {
  title: {
    text: 'Sales Overview',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['Sales', 'Profit'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Sales',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: 'Profit',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. Set option and render
chart.setOption(option);

// 6. Optional: responsive resize
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Optional: event listener
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator example

Render a data table with pagination and row click events in a block using Tabulator.

```ts
// 1. Load Tabulator styles
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Dynamically load Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Create table container and render
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Initialize Tabulator
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

// 5. Optional: event listener
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) example

Load FullCalendar and its plugins via ESM and render a basic month-view calendar.

```ts
// 1. Dynamically load FullCalendar core
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Dynamically load dayGrid plugin
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Create calendar container and render
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Initialize and render calendar
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

### dnd-kit simple drag example

Minimal drag-and-drop example using `@dnd-kit/core`: drag a box into a drop zone inside a block.

```ts
// 1. Load React, react-dom, @dnd-kit/core (?deps ensures same React instance, avoids Invalid hook call)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const core = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
const { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } = core;

function DraggableBox() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'box' });
  const style = {
    padding: 12,
    marginBottom: 8,
    background: '#e6f7ff',
    cursor: 'grab',
    transform: transform ? 'translate3d(' + transform.x + 'px,' + transform.y + 'px,0)' : undefined,
  };
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Drag me');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Drop here',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Dropped in zone');
  }
  return React.createElement(
    DndContext,
    { sensors, collisionDetection: closestCenter, onDragEnd },
    React.createElement(
      'div',
      { style: { maxWidth: 280 } },
      React.createElement(DraggableBox),
      React.createElement(DropZone),
    ),
  );
}

// 2. Create container and mount React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

This example uses only `@dnd-kit/core`, dragging a box into a zone to trigger a message, and shows the simplest drag interaction in RunJS with `ctx.importAsync` and React.

### dnd-kit sortable list example

A vertical sortable list with drag-to-reorder using dnd-kit core, sortable, and utilities.

```ts
// 1. Load React and dnd-kit packages (?deps ensures same React instance)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const dndCore = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
const dndSortable = await ctx.importAsync('@dnd-kit/sortable@10.0.0?deps=react@18.2.0,react-dom@18.2.0');
const dndUtils = await ctx.importAsync('@dnd-kit/utilities@3.2.2');

const { useState } = React;
const { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } = dndCore;
const {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} = dndSortable;
const { CSS } = dndUtils;

// 2. SortableItem (must be inside SortableContext)
function SortableItem(props) {
  const { id, label } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px 16px',
    marginBottom: 8,
    background: '#f5f5f5',
    borderRadius: 6,
    cursor: 'grab',
  };
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, label);
}

// 3. App: DndContext + SortableContext + drag end handler
const labels = { 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth' };
function App() {
  const [items, setItems] = useState([1, 2, 3, 4]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      ctx.message.success('List reordered');
    }
  }

  return React.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: handleDragEnd,
    },
    React.createElement(
      SortableContext,
      { items, strategy: verticalListSortingStrategy },
      React.createElement(
        'div',
        { style: { maxWidth: 320 } },
        items.map((id) => React.createElement(SortableItem, { key: id, id, label: labels[id] })),
      ),
    ),
  );
}

// 4. Create container and mount React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

This example uses `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` to build a sortable list that updates order on drag end and shows "List reordered".

### react-big-calendar example

Render a calendar component with events in the current block using `react-big-calendar` and date-fns localization.

```tsx
// 1. Load styles (ctx.importAsync with .css uses ctx.loadCSS)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Load React, react-dom, react-big-calendar, date-fns and locale (same React instance)
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

// 3. Render React calendar
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

### frappe-gantt example

Use `frappe-gantt` to render a Gantt view showing task start/end and progress.

```ts
// 1. Dynamically load Gantt styles and constructor
// Uses ESM_CDN_BASE_URL (default https://esm.sh); shorthand path is supported
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Prepare task data
let tasks = [
  {
    id: '1',
    name: 'Redesign website',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20,
  },
  {
    id: '2',
    name: 'Develop new feature',
    start: '2017-01-01',
    end: '2017-01-05',
    progress: 40,
    dependencies: '1',
  },
  {
    id: '3',
    name: 'QA & testing',
    start: '2017-01-06',
    end: '2017-01-10',
    progress: 10,
    dependencies: '2',
  },
];

// 3. Create container and render
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Initialize Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'en',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Start: ${task._start.toISOString().slice(0, 10)}</p>
        <p>End: ${task._end.toISOString().slice(0, 10)}</p>
        <p>Progress: ${task.progress}%</p>
      </div>
    `;
  },
});
```

### @asseinfo/react-kanban example

Use `@asseinfo/react-kanban` to render a basic kanban with Backlog / Doing columns in a block.

```ts
// 1. Load styles (ctx.importAsync directly loads .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Load React, react-dom, @asseinfo/react-kanban (?deps ensures same React instance)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Add card', description: 'Add capability to add a card in a column' },
      ],
    },
    {
      id: 2,
      title: 'Doing',
      cards: [
        { id: 2, title: 'Drag-n-drop support', description: 'Move a card between the columns' },
      ],
    },
  ],
};

// 4. Mount the board
ctx.render(<Board initialBoard={board} />);
```
