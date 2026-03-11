:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/import-async).
:::

# ctx.importAsync()

Tải động **ESM module** hoặc **CSS** theo URL, áp dụng cho các kịch bản RunJS. Sử dụng `ctx.importAsync()` khi cần các thư viện ESM bên thứ ba, và `ctx.requireAsync()` cho các thư viện UMD/AMD; truyền vào địa chỉ `.css` sẽ tải và chèn style vào trang.

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Tải động các thư viện ESM như Vue, ECharts, Tabulator để triển khai biểu đồ, bảng, bảng điều khiển (dashboard) tùy chỉnh, v.v. |
| **JSField / JSItem / JSColumn** | Tải các thư viện công cụ ESM nhẹ (như plugin dayjs) để hỗ trợ hiển thị. |
| **Luồng công việc / Sự kiện thao tác** | Tải các phụ thuộc theo nhu cầu trước khi thực thi logic. |

## Định nghĩa kiểu

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `url` | `string` | Địa chỉ của ESM module hoặc CSS. Hỗ trợ viết tắt `<tên gói>@<phiên bản>` hoặc đường dẫn con `<tên gói>@<phiên bản>/<đường dẫn tệp>` (ví dụ: `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), hệ thống sẽ tự động ghép nối tiền tố CDN theo cấu hình; cũng hỗ trợ URL đầy đủ. Khi truyền vào `.css`, style sẽ được tải và chèn vào trang. Các thư viện phụ thuộc vào React có thể thêm `?deps=react@18.2.0,react-dom@18.2.0` để đảm bảo dùng chung một instance React với trang web. |

## Giá trị trả về

- Đối tượng namespace của module sau khi phân giải (giá trị phân giải của Promise).

## Mô tả định dạng URL

- **ESM và CSS**: Ngoài các module ESM, cũng hỗ trợ tải CSS (truyền URL `.css`, sau khi tải sẽ chèn vào trang).
- **Định dạng viết tắt**: Khi không cấu hình, mặc định sử dụng **https://esm.sh** làm tiền tố CDN. Ví dụ `vue@3.4.0` thực tế sẽ yêu cầu `https://esm.sh/vue@3.4.0`.
- **?deps**: Các thư viện phụ thuộc vào React (như `@dnd-kit/core`, `react-big-calendar`) cần thêm `?deps=react@18.2.0,react-dom@18.2.0` để tránh xung đột với instance React của trang, dẫn đến lỗi "Invalid hook call".
- **CDN tự triển khai**: Có thể chỉ định mạng nội bộ hoặc dịch vụ tự triển khai thông qua biến môi trường:
  - **ESM_CDN_BASE_URL**: Địa chỉ cơ sở của ESM CDN (mặc định là `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Hậu tố tùy chọn (ví dụ: `/+esm` của jsDelivr).
  - Dịch vụ tự triển khai có thể tham khảo: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Khác biệt so với ctx.requireAsync()

- **ctx.importAsync()**: Tải **ESM module**, trả về namespace của module, phù hợp với các thư viện hiện đại (được xây dựng theo chuẩn ESM như Vue, dayjs, v.v.).
- **ctx.requireAsync()**: Tải **UMD/AMD** hoặc các script gắn vào phạm vi toàn cục (global), thường dùng cho các thư viện UMD như ECharts, FullCalendar. Nếu thư viện cung cấp cả ESM, ưu tiên sử dụng `ctx.importAsync()`.

## Ví dụ

### Cách dùng cơ bản

Dùng để minh họa cách tải động ESM module và CSS cơ bản nhất theo tên gói hoặc URL đầy đủ.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Tương đương với việc tải từ https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Với đường dẫn con (ví dụ: plugin dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL đầy đủ

await ctx.importAsync('https://cdn.example.com/theme.css');
// Tải CSS và chèn vào trang
```

### Ví dụ ECharts

Sử dụng ECharts để vẽ một biểu đồ tổng quan doanh số với biểu đồ cột và biểu đồ đường.

```ts
// 1. Tải động module ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Tạo container biểu đồ và hiển thị
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Khởi tạo instance ECharts
const chart = echarts.init(chartEl);

// 4. Cấu hình biểu đồ
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

// 5. Thiết lập cấu hình và hiển thị biểu đồ
chart.setOption(option);

// 6. Tùy chọn: Tự động điều chỉnh kích thước
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Tùy chọn: Lắng nghe sự kiện
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Ví dụ Tabulator

Minh họa việc sử dụng Tabulator để hiển thị một bảng dữ liệu hỗ trợ phân trang và sự kiện nhấp vào hàng trong một khối.

```ts
// 1. Tải style của Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Tải động module Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Tạo container bảng và hiển thị
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Khởi tạo bảng Tabulator
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

// 5. Tùy chọn: Lắng nghe sự kiện
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Ví dụ FullCalendar (ESM)

Minh họa cách tải FullCalendar và các plugin của nó theo chuẩn ESM, đồng thời hiển thị một lịch xem theo tháng cơ bản.

```ts
// 1. Tải động module core của FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Tải động plugin dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Tạo container lịch và hiển thị
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Khởi tạo và hiển thị lịch
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

### Ví dụ kéo thả đơn giản với dnd-kit

Sử dụng `@dnd-kit/core` để triển khai một ví dụ kéo thả tối giản: kéo một Box vào vùng mục tiêu trong một khối.

```ts
// 1. Tải React, react-dom, @dnd-kit/core (?deps đảm bảo dùng chung instance React để tránh Invalid hook call)
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

// 2. Hiển thị
ctx.render(<App />);
```

Ví dụ này chỉ phụ thuộc vào `@dnd-kit/core`, thông qua việc kéo một Box vào vùng chỉ định để kích hoạt thông báo, minh họa cách kết hợp `ctx.importAsync` + React trong RunJS để thực hiện tương tác kéo thả đơn giản nhất.

### Ví dụ danh sách có thể sắp xếp với dnd-kit

Dựa trên core / sortable / utilities của dnd-kit để triển khai một danh sách sắp xếp theo chiều dọc hỗ trợ kéo thả.

```ts
// 1. Tải React và các gói liên quan đến dnd-kit (?deps đảm bảo dùng chung instance React)
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

// 2. Thành phần SortableItem (phải nằm trong SortableContext)
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

// 3. App: DndContext + SortableContext + Xử lý kết thúc kéo thả
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

// 4. Tạo container và gắn React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Ví dụ này dựa trên `@dnd-kit/core`, `@dnd-kit/sortable` và `@dnd-kit/utilities`, triển khai một danh sách có thể kéo thả để sắp xếp lại, và cập nhật thứ tự đồng thời hiển thị thông báo "List reordered" sau khi kết thúc kéo thả.

### Ví dụ react-big-calendar

Thông qua `react-big-calendar` và bản địa hóa với `date-fns`, hiển thị một thành phần lịch hỗ trợ trình diễn sự kiện trong khối hiện tại.

```tsx
// 1. Tải style (ctx.importAsync khi gặp .css sẽ chạy qua ctx.loadCSS)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Tải React, react-dom, react-big-calendar, date-fns và locale (đảm bảo dùng chung instance React)
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

// 3. Hiển thị lịch React
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

Sử dụng `frappe-gantt` để hiển thị một chế độ xem biểu đồ Gantt trình bày thời gian bắt đầu, kết thúc và tiến độ của các nhiệm vụ.

```ts
// 1. Tải động style và hàm khởi tạo Gantt
// Phụ thuộc vào ESM_CDN_BASE_URL (mặc định https://esm.sh), có thể dùng đường dẫn viết tắt
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Chuẩn bị dữ liệu nhiệm vụ
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

// 3. Tạo container và hiển thị
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Khởi tạo biểu đồ Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Độ chi tiết chế độ xem: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

Sử dụng `@asseinfo/react-kanban` để hiển thị một bảng Kanban cơ bản bao gồm các cột như Backlog / Doing trong một khối.

```ts
// 1. Tải style (ctx.importAsync trực tiếp tải .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Tải React, react-dom, @asseinfo/react-kanban (?deps đảm bảo dùng chung instance React)
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

// 4. Gắn bảng Kanban
ctx.render(<Board initialBoard={board} />);
```

## Lưu ý

- Phụ thuộc vào mạng bên ngoài hoặc CDN, môi trường mạng nội bộ cần cấu hình **ESM_CDN_BASE_URL** trỏ đến dịch vụ tự triển khai.
- Khi thư viện cung cấp cả ESM và UMD, ưu tiên sử dụng `ctx.importAsync()` để có ngữ nghĩa module tốt hơn.
- Các thư viện phụ thuộc vào React bắt buộc phải thêm `?deps=react@18.2.0,react-dom@18.2.0`, phiên bản phải nhất quán với React của trang, nếu không có thể báo lỗi "Invalid hook call".

## Liên quan

- [ctx.requireAsync()](./require-async.md): Tải UMD/AMD hoặc script gắn vào toàn cục, phù hợp cho các thư viện UMD như ECharts, FullCalendar.
- [ctx.render()](./render.md): Hiển thị nội dung vào container.