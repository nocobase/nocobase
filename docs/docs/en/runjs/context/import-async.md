# ctx.importAsync()

Dynamically load **ESM modules** or **CSS** via URL, applicable to various RunJS scenarios. Use `ctx.importAsync()` when third-party ESM libraries are required, and `ctx.requireAsync()` for UMD/AMD libraries. Passing a `.css` address will load and inject the styles into the page.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock** | Dynamically load ESM libraries such as Vue, ECharts, or Tabulator to implement custom charts, tables, dashboards, etc. |
| **JSField / JSItem / JSColumn** | Load lightweight ESM utility libraries (e.g., dayjs plugins) to assist in rendering. |
| **Workflow / Action Events** | Load dependencies on demand before executing business logic. |

## Type Definition

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Description |
|------|------|------|
| `url` | `string` | The address of the ESM module or CSS. Supports shorthand `<package>@<version>` or subpaths `<package>@<version>/<file-path>` (e.g., `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), which will be concatenated with the CDN prefix according to the configuration. Full URLs are also supported. When a `.css` file is passed, it will be loaded and injected as a style. For libraries depending on React, you can append `?deps=react@18.2.0,react-dom@18.2.0` to ensure they share the same React instance with the page. |

## Return Value

- A Promise that resolves to the module's namespace object.

## URL Format Description

- **ESM and CSS**: In addition to ESM modules, loading CSS is also supported (pass a `.css` URL to load and inject it into the page).
- **Shorthand Format**: Defaults to **https://esm.sh** as the CDN prefix if not configured. For example, `vue@3.4.0` actually requests `https://esm.sh/vue@3.4.0`.
- **?deps**: Libraries that depend on React (such as `@dnd-kit/core`, `react-big-calendar`) should append `?deps=react@18.2.0,react-dom@18.2.0` to avoid conflicts with the page's React instance, which could lead to "Invalid hook call" errors.
- **Self-hosted CDN**: You can specify an internal network or self-hosted service via environment variables:
  - **ESM_CDN_BASE_URL**: The base URL for the ESM CDN (default is `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Optional suffix (e.g., `/+esm` for jsDelivr).
  - For self-hosted services, refer to: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Difference from ctx.requireAsync()

- **ctx.importAsync()**: Loads **ESM modules** and returns the module namespace. Suitable for modern libraries (ESM builds like Vue, dayjs, etc.).
- **ctx.requireAsync()**: Loads **UMD/AMD** modules or scripts that attach to the global scope. Often used for UMD libraries like ECharts or FullCalendar. If a library provides both ESM and UMD, `ctx.importAsync()` is preferred.

## Examples

### Basic Usage

Demonstrates the most basic usage of dynamically loading ESM modules and CSS by package name or full URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalent to loading from https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// With subpath (e.g., dayjs plugin)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Full URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Load CSS and inject into the page
```

### ECharts Example

Use ECharts to draw a sales overview chart with bar and line graphs.

```ts
// 1. Dynamically load ECharts module
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

// 5. Set option and render chart
chart.setOption(option);

// 6. Optional: Responsive sizing
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Optional: Event listener
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator Example

Demonstrates rendering a data table with pagination and row click events in a block using Tabulator.

```ts
// 1. Load Tabulator styles
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Dynamically load Tabulator module
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Create table container and render
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Initialize Tabulator table
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'New York' },
    { id: 2, name: 'Bob', age: 30, city: 'London' },
    { id: 3, name: 'Charlie', age: 28, city: 'Paris' },
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

// 5. Optional: Event listener
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) Example

Shows how to load FullCalendar and its plugins via ESM and render a basic monthly view calendar.

```ts
// 1. Dynamically load FullCalendar core module
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

### dnd-kit Simple Drag-and-Drop Example

Uses `@dnd-kit/core` to implement a minimal example of dragging a Box to a target area within a block.

```ts
// 1. Load React, react-dom, @dnd-kit/core (?deps ensures same React instance to avoid Invalid hook call)
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

// 2. Render
ctx.render(<App />);
```

This example relies only on `@dnd-kit/core` to trigger a notification when a Box is dropped into a specific area, demonstrating the simplest drag-and-drop interaction combining `ctx.importAsync` and React in RunJS.

### dnd-kit Sortable List Example

Implements a vertical sortable list using dnd-kit's core, sortable, and utilities.

```ts
// 1. Load React and dnd-kit related packages (?deps ensures same React instance)
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

// 2. SortableItem component (must be inside SortableContext)
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

// 3. App: DndContext + SortableContext + Drag end handler
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

This example uses `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` to implement a sortable list that updates its order and displays a "List reordered" message after dragging.

### react-big-calendar Example

Renders a calendar component supporting event display in the current block using `react-big-calendar` and `date-fns` for localization.

```tsx
// 1. Load styles (ctx.importAsync uses ctx.loadCSS for .css files)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Load React, react-dom, react-big-calendar, date-fns, and locale (ensuring same React instance)
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

// 3. Render React Calendar
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

### frappe-gantt Example

Uses `frappe-gantt` to render a Gantt chart view showing task start/end times and progress.

```ts
// 1. Dynamically load Gantt styles and constructor
// Depends on ESM_CDN_BASE_URL (default https://esm.sh), shorthand paths can be used
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

// 4. Initialize Gantt chart
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // View granularity: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban Example

Utilizes `@asseinfo/react-kanban` to render a basic Kanban board with columns like Backlog and Doing within a block.

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

## Notes

- This feature depends on an external network or CDN. In internal network environments, **ESM_CDN_BASE_URL** must be configured to point to a self-hosted service.
- When a library provides both ESM and UMD, prefer `ctx.importAsync()` for better module semantics.
- For libraries depending on React, ensure you append `?deps=react@18.2.0,react-dom@18.2.0`. The version must match the React version used by the page, otherwise, an "Invalid hook call" error may occur.

## Related

- [ctx.requireAsync()](./require-async.md): Load UMD/AMD or globally attached scripts, suitable for UMD libraries like ECharts and FullCalendar.
- [ctx.render()](./render.md): Render content into a container.