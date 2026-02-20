# ctx.importAsync()

按 URL 动态加载 **ESM 模块**或 **CSS**，适用于 RunJS 各场景。需要第三方 ESM 库时使用 `ctx.importAsync()`，UMD/AMD 库使用 `ctx.requireAsync()`；传入 `.css` 地址会加载并注入样式。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | 动态加载 Vue、ECharts、Tabulator 等 ESM 库实现自定义图表、表格、看板等 |
| **JSField / JSItem / JSColumn** | 加载轻量 ESM 工具库（如 dayjs 插件）辅助渲染 |
| **事件流 / 操作事件** | 按需加载依赖后再执行逻辑 |

## 类型定义

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | `string` | ESM 模块或 CSS 地址。支持简写 `<包名>@<版本>` 或带子路径 `<包名>@<版本>/<文件路径>`（如 `vue@3.4.0`、`dayjs@1/plugin/relativeTime.js`），会按配置拼接 CDN 前缀；也支持完整 URL。传入 `.css` 时会加载并注入样式。依赖 React 的库可加 `?deps=react@18.2.0,react-dom@18.2.0` 确保与页面共用同一 React 实例。 |

## 返回值

- 解析后的模块命名空间对象（Promise 解析值）。

## URL 格式说明

- **ESM 与 CSS**：除 ESM 模块外，也支持加载 CSS（传入 `.css` URL，加载后注入页面）。
- **简写格式**：未配置时使用 **https://esm.sh** 作为 CDN 前缀。例如 `vue@3.4.0` 实际请求 `https://esm.sh/vue@3.4.0`。
- **?deps**：依赖 React 的库（如 `@dnd-kit/core`、`react-big-calendar`）需加 `?deps=react@18.2.0,react-dom@18.2.0`，避免与页面 React 实例冲突导致 Invalid hook call。
- **自建 CDN**：可通过环境变量指定内网或自建服务：
  - **ESM_CDN_BASE_URL**：ESM CDN 基础地址（默认 `https://esm.sh`）
  - **ESM_CDN_SUFFIX**：可选后缀（如 jsDelivr 的 `/+esm`）
  - 自建服务可参考：[nocobase/esm-server](https://github.com/nocobase/esm-server)

## 与 ctx.requireAsync() 的区别

- **ctx.importAsync()**：加载 **ESM 模块**，返回模块命名空间，适合现代库（Vue、dayjs 等 ESM 构建）。
- **ctx.requireAsync()**：加载 **UMD/AMD** 或挂到全局的脚本，多用于 ECharts、FullCalendar 等 UMD 库。若库同时提供 ESM，优先用 `ctx.importAsync()`。

## 示例

### 基础用法

用于演示最基础的按包名或完整 URL 动态加载 ESM 模块和 CSS 的用法。

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// 等价于从 https://esm.sh/vue@3.4.0 加载

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// 带子路径（如 dayjs 插件）

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// 完整 URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// 加载 CSS 并注入页面
```

### ECharts 示例

使用 ECharts 绘制一个带柱状图和折线图的销售概览图表。

```ts
// 1. 动态加载 ECharts 模块
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. 创建图表容器并渲染
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. 初始化 ECharts 实例
const chart = echarts.init(chartEl);

// 4. 配置图表
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

// 5. 设置配置并渲染图表
chart.setOption(option);

// 6. 可选：自适应尺寸
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. 可选：事件监听
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator 示例

演示通过 Tabulator 在区块中渲染一个支持分页和行点击事件的数据表格。

```ts
// 1. 加载 Tabulator 样式
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. 动态加载 Tabulator 模块
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. 创建表格容器并渲染
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. 初始化 Tabulator 表格
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

// 5. 可选：事件监听
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar（ESM） 示例

展示如何以 ESM 方式加载 FullCalendar 及其插件，并渲染一个基础的月视图日历。

```ts
// 1. 动态加载 FullCalendar core 模块
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. 动态加载 dayGrid 插件
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. 创建日历容器并渲染
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. 初始化并渲染日历
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

### dnd-kit 简单拖拽示例

使用 `@dnd-kit/core` 在区块中实现一个拖拽 Box 到目标区域的最小拖拽示例。

```ts
// 1. 加载 React、react-dom、@dnd-kit/core（?deps 确保与页面同一个 React 实例，避免 Invalid hook call）
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

// 2. 渲染
ctx.render(<App />);
```

这个示例只依赖 `@dnd-kit/core`，通过拖拽一个 Box 到指定区域触发提示，演示了在 RunJS 中结合 `ctx.importAsync` + React 实现最简单的拖拽交互。

### dnd-kit 可排序列表示例

基于 dnd-kit 的 core / sortable / utilities 实现一个支持拖拽重排的纵向排序列表。

```ts
// 1. 加载 React 和 dnd-kit 相关包（?deps 确保同一 React 实例）
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

// 2. SortableItem 组件（必须在 SortableContext 中）
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

// 3. App：DndContext + SortableContext + 拖拽结束处理
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

// 4. 创建容器并挂载 React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

这个示例基于 `@dnd-kit/core`、`@dnd-kit/sortable` 和 `@dnd-kit/utilities`，实现了一个可拖拽排序的列表，并在拖拽结束后更新顺序并提示“List reordered”。

### react-big-calendar 示例

通过 `react-big-calendar` 与 date-fns 本地化，在当前区块中渲染一个支持事件展示的日历组件。

```tsx
// 1. 加载样式（ctx.importAsync 遇到 .css 会走 ctx.loadCSS）
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. 加载 React、react-dom、react-big-calendar、date-fns 及 locale（保证同一 React 实例）
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

// 3. 渲染 React 日历
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

### frappe-gantt 示例

使用 `frappe-gantt` 渲染一个展示任务起止时间与进度的甘特图视图。

```ts
// 1. 动态加载 Gantt 样式和构造函数
// 依赖 ESM_CDN_BASE_URL（默认 https://esm.sh），可使用简写路径
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. 准备任务数据
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

// 3. 创建容器并渲染
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. 初始化 Gantt 图
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // 视图粒度：'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban 示例

利用 `@asseinfo/react-kanban` 在区块中渲染一个包含 Backlog / Doing 等列的基础看板。

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

## 注意事项

- 依赖外部网络或 CDN，内网环境需配置 **ESM_CDN_BASE_URL** 指向自建服务。
- 库同时提供 ESM 与 UMD 时，优先用 `ctx.importAsync()` 获得更好的模块语义。
- 依赖 React 的库务必加 `?deps=react@18.2.0,react-dom@18.2.0`，版本需与页面 React 一致，否则可能报 Invalid hook call。

## 相关

- [ctx.requireAsync()](./require-async.md)：加载 UMD/AMD 或挂到全局的脚本，适合 ECharts、FullCalendar 等 UMD 库
- [ctx.render()](./render.md)：渲染内容到容器
