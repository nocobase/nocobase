---
title: "ctx.importAsync()"
description: "ctx.importAsync() tải động module ESM hoặc CSS theo URL, phù hợp với các kịch bản RunJS như JSBlock, JSField, luồng sự kiện."
keywords: "ctx.importAsync,ESM,tải động,esm.sh,JSBlock,JSField,RunJS,NocoBase"
---

# ctx.importAsync()

Tải động **module ESM** hoặc **CSS** theo URL, phù hợp với mọi kịch bản RunJS. Khi cần thư viện ESM bên thứ ba sử dụng `ctx.importAsync()`, thư viện UMD/AMD sử dụng `ctx.requireAsync()`; khi truyền địa chỉ `.css` sẽ tải và inject style.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Tải động các thư viện ESM như Vue, ECharts, Tabulator để thực hiện chart, table, dashboard tùy chỉnh |
| **JSField / JSItem / JSColumn** | Tải các thư viện công cụ ESM nhẹ (như plugin dayjs) hỗ trợ render |
| **Luồng sự kiện / sự kiện action** | Tải dependency theo nhu cầu rồi thực thi logic |

## Định nghĩa kiểu

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `url` | `string` | Địa chỉ module ESM hoặc CSS. Hỗ trợ rút gọn `<tên gói>@<phiên bản>` hoặc với đường dẫn con `<tên gói>@<phiên bản>/<đường dẫn file>` (như `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), sẽ được nối với prefix CDN theo cấu hình; cũng hỗ trợ URL đầy đủ. Khi truyền `.css` sẽ tải và inject style. Thư viện phụ thuộc React có thể thêm `?deps=react@18.2.0,react-dom@18.2.0` để đảm bảo dùng chung instance React với page. |

## Giá trị trả về

- Object namespace của module sau khi parse (giá trị resolve của Promise).

## Giải thích về định dạng URL

- **ESM và CSS**: Ngoài module ESM, còn hỗ trợ tải CSS (truyền URL `.css`, sau khi tải sẽ inject vào page).
- **Định dạng rút gọn**: Khi chưa cấu hình, sử dụng **https://esm.sh** làm prefix CDN. Ví dụ `vue@3.4.0` thực tế yêu cầu `https://esm.sh/vue@3.4.0`.
- **?deps**: Thư viện phụ thuộc React (như `@dnd-kit/core`, `react-big-calendar`) cần thêm `?deps=react@18.2.0,react-dom@18.2.0` để tránh xung đột với instance React của page dẫn đến Invalid hook call.
- **CDN tự host**: Có thể chỉ định service nội bộ hoặc tự host qua biến môi trường:
  - **ESM_CDN_BASE_URL**: Địa chỉ cơ sở của ESM CDN (mặc định `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: Hậu tố tùy chọn (như `/+esm` của jsDelivr)
  - Tham khảo dịch vụ tự host: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Khác biệt với ctx.requireAsync()

- **ctx.importAsync()**: Tải **module ESM**, trả về namespace module, phù hợp với thư viện hiện đại (Vue, dayjs, v.v. build ESM).
- **ctx.requireAsync()**: Tải script **UMD/AMD** hoặc gắn vào global, thường dùng cho các thư viện UMD như ECharts, FullCalendar. Nếu thư viện cũng cung cấp ESM, ưu tiên dùng `ctx.importAsync()`.

## Ví dụ

### Cách sử dụng cơ bản

Dùng để minh họa cách sử dụng cơ bản nhất để tải động module ESM và CSS theo tên gói hoặc URL đầy đủ.

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

### Ví dụ ECharts

Sử dụng ECharts để vẽ biểu đồ tổng quan bán hàng với cột và đường.

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

### Ví dụ Tabulator

Minh họa render bảng dữ liệu hỗ trợ phân trang và sự kiện click hàng trong block qua Tabulator.

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

### Ví dụ FullCalendar (ESM)

Hiển thị cách tải FullCalendar và plugin của nó theo dạng ESM, và render lịch month view cơ bản.

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

### Ví dụ kéo thả đơn giản dnd-kit

Sử dụng `@dnd-kit/core` để thực hiện ví dụ kéo thả tối thiểu kéo Box vào vùng đích trong block.

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

Ví dụ này chỉ phụ thuộc `@dnd-kit/core`, kéo Box vào vùng được chỉ định để trigger thông báo, minh họa cách thực hiện tương tác kéo thả đơn giản nhất kết hợp `ctx.importAsync` + React trong RunJS.

### Ví dụ danh sách có thể sắp xếp dnd-kit

Dựa trên core / sortable / utilities của dnd-kit để thực hiện danh sách sắp xếp dọc hỗ trợ kéo thả để sắp xếp lại.

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

Ví dụ này dựa trên `@dnd-kit/core`, `@dnd-kit/sortable` và `@dnd-kit/utilities`, thực hiện danh sách có thể kéo thả sắp xếp, và sau khi kết thúc kéo thả cập nhật thứ tự và thông báo "List reordered".

### Ví dụ react-big-calendar

Qua `react-big-calendar` và localization date-fns, render component lịch hỗ trợ hiển thị sự kiện trong block hiện tại.

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

### Ví dụ frappe-gantt

Sử dụng `frappe-gantt` để render gantt chart hiển thị thời gian bắt đầu/kết thúc và tiến độ của task.

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

### Ví dụ @asseinfo/react-kanban

Sử dụng `@asseinfo/react-kanban` để render kanban cơ bản chứa các column như Backlog / Doing trong block.

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

## Lưu ý

- Phụ thuộc vào mạng bên ngoài hoặc CDN, môi trường nội bộ cần cấu hình **ESM_CDN_BASE_URL** trỏ đến service tự host.
- Khi thư viện cung cấp cả ESM và UMD, ưu tiên dùng `ctx.importAsync()` để có ngữ nghĩa module tốt hơn.
- Thư viện phụ thuộc React phải thêm `?deps=react@18.2.0,react-dom@18.2.0`, phiên bản phải đồng nhất với React của page, nếu không có thể báo Invalid hook call.

## Liên quan

- [ctx.requireAsync()](./require-async.md): Tải UMD/AMD hoặc script gắn vào global, phù hợp với các thư viện UMD như ECharts, FullCalendar
- [ctx.render()](./render.md): Render nội dung vào container
