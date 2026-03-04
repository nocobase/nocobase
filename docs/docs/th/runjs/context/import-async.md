:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/import-async)
:::

# ctx.importAsync()

โหลด **ESM โมดูล** หรือ **CSS** ตาม URL แบบไดนามิก (Dynamic Loading) เหมาะสำหรับสถานการณ์ต่าง ๆ ใน RunJS หากต้องการใช้ไลบรารี ESM จากภายนอกให้ใช้ `ctx.importAsync()` ส่วนไลบรารี UMD/AMD ให้ใช้ `ctx.requireAsync()` หากระบุที่อยู่เป็นไฟล์ `.css` ระบบจะโหลดและแทรกสไตล์ (Style) เข้าไปในหน้าเว็บโดยอัตโนมัติครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | โหลดไลบรารี ESM เช่น Vue, ECharts หรือ Tabulator แบบไดนามิกเพื่อสร้างแผนภูมิ ตาราง หรือแดชบอร์ดแบบกำหนดเอง |
| **JSField / JSItem / JSColumn** | โหลดไลบรารีเครื่องมือ ESM ขนาดเล็ก (เช่น ปลั๊กอิน dayjs) เพื่อช่วยในการแสดงผล |
| **เวิร์กโฟลว์ / เหตุการณ์การดำเนินการ** | โหลด Dependency ตามความต้องการก่อนที่จะรันตรรกะทางธุรกิจ |

## การกำหนดประเภท (Type Definition)

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## พารามิเตอร์

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `url` | `string` | ที่อยู่ของ ESM โมดูล หรือ CSS รองรับรูปแบบย่อ `<ชื่อแพ็กเกจ>@<เวอร์ชัน>` หรือระบุเส้นทางย่อย `<ชื่อแพ็กเกจ>@<เวอร์ชัน>/<เส้นทางไฟล์>` (เช่น `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`) ซึ่งจะถูกนำไปต่อกับ CDN Prefix ตามที่กำหนดไว้ นอกจากนี้ยังรองรับ URL แบบเต็มอีกด้วย หากระบุไฟล์ `.css` จะเป็นการโหลดและแทรกสไตล์ สำหรับไลบรารีที่ต้องพึ่งพา React สามารถเพิ่ม `?deps=react@18.2.0,react-dom@18.2.0` เพื่อให้แน่ใจว่าใช้ React อินสแตนซ์เดียวกับหน้าเว็บครับ |

## ค่าที่ส่งคืน

- ออบเจกต์ Namespace ของโมดูลที่ถูก Resolve แล้ว (ค่าจาก Promise)

## คำอธิบายรูปแบบ URL

- **ESM และ CSS**: นอกจาก ESM โมดูลแล้ว ยังรองรับการโหลด CSS (ระบุ URL ของไฟล์ `.css` เพื่อโหลดและแทรกสไตล์ลงในหน้าเว็บ)
- **รูปแบบย่อ**: หากไม่ได้กำหนดค่าไว้ จะใช้ **https://esm.sh** เป็น CDN Prefix ตัวอย่างเช่น `vue@3.4.0` จะเป็นการเรียกใช้ `https://esm.sh/vue@3.4.0` จริง ๆ
- **?deps**: ไลบรารีที่ต้องพึ่งพา React (เช่น `@dnd-kit/core`, `react-big-calendar`) จำเป็นต้องเพิ่ม `?deps=react@18.2.0,react-dom@18.2.0` เพื่อหลีกเลี่ยงความขัดแย้งกับ React อินสแตนซ์ของหน้าเว็บ ซึ่งอาจทำให้เกิดข้อผิดพลาด "Invalid hook call" ได้
- **CDN ส่วนตัว**: สามารถระบุที่อยู่เครือข่ายภายในหรือบริการส่วนตัวผ่านตัวแปรสภาพแวดล้อม (Environment Variables):
  - **ESM_CDN_BASE_URL**: ที่อยู่พื้นฐานของ ESM CDN (ค่าเริ่มต้นคือ `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: ส่วนต่อท้ายที่เลือกได้ (เช่น `/+esm` สำหรับ jsDelivr)
  - สำหรับบริการส่วนตัว สามารถอ้างอิงได้ที่: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## ความแตกต่างจาก ctx.requireAsync()

- **ctx.importAsync()**: โหลด **ESM โมดูล** และส่งคืน Namespace ของโมดูล เหมาะสำหรับไลบรารีสมัยใหม่ (ที่สร้างด้วย ESM เช่น Vue, dayjs เป็นต้น)
- **ctx.requireAsync()**: โหลดสคริปต์แบบ **UMD/AMD** หรือสคริปต์ที่ผูกกับ Global Scope มักใช้กับไลบรารี UMD เช่น ECharts, FullCalendar หากไลบรารีมีให้เลือกทั้ง ESM และ UMD แนะนำให้ใช้ `ctx.importAsync()` เป็นอันดับแรกครับ

## ตัวอย่าง

### การใช้งานพื้นฐาน

ใช้เพื่อสาธิตการโหลด ESM โมดูลและ CSS แบบไดนามิกโดยใช้ชื่อแพ็กเกจหรือ URL แบบเต็ม

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// เทียบเท่ากับการโหลดจาก https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// แบบระบุเส้นทางย่อย (เช่น ปลั๊กอินของ dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL แบบเต็ม

await ctx.importAsync('https://cdn.example.com/theme.css');
// โหลด CSS และแทรกเข้าไปในหน้าเว็บ
```

### ตัวอย่าง ECharts

ใช้ ECharts เพื่อวาดแผนภูมิภาพรวมการขายที่มีทั้งกราฟแท่งและกราฟเส้น

```ts
// 1. โหลดโมดูล ECharts แบบไดนามิก
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. สร้างคอนเทนเนอร์สำหรับแผนภูมิและเรนเดอร์
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. เริ่มต้นอินสแตนซ์ ECharts
const chart = echarts.init(chartEl);

// 4. กำหนดค่าแผนภูมิ
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

// 5. ตั้งค่าและเรนเดอร์แผนภูมิ
chart.setOption(option);

// 6. ทางเลือก: ปรับขนาดตามหน้าจอ
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. ทางเลือก: การฟังเหตุการณ์ (Event Listener)
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### ตัวอย่าง Tabulator

สาธิตการเรนเดอร์ตารางข้อมูลที่รองรับการแบ่งหน้าและเหตุการณ์การคลิกแถวในบล็อกโดยใช้ Tabulator

```ts
// 1. โหลดสไตล์ของ Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. โหลดโมดูล Tabulator แบบไดนามิก
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. สร้างคอนเทนเนอร์สำหรับตารางและเรนเดอร์
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. เริ่มต้นตาราง Tabulator
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

// 5. ทางเลือก: การฟังเหตุการณ์
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### ตัวอย่าง FullCalendar (ESM)

แสดงวิธีการโหลด FullCalendar และปลั๊กอินในรูปแบบ ESM และเรนเดอร์ปฏิทินมุมมองรายเดือนพื้นฐาน

```ts
// 1. โหลดโมดูลหลักของ FullCalendar แบบไดนามิก
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. โหลดปลั๊กอิน dayGrid แบบไดนามิก
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. สร้างคอนเทนเนอร์สำหรับปฏิทินและเรนเดอร์
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. เริ่มต้นและเรนเดอร์ปฏิทิน
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

### ตัวอย่างการลากและวางอย่างง่ายด้วย dnd-kit

ใช้ `@dnd-kit/core` เพื่อสร้างตัวอย่างการลาก Box ไปยังพื้นที่เป้าหมายภายในบล็อก

```ts
// 1. โหลด React, react-dom, @dnd-kit/core (?deps เพื่อให้แน่ใจว่าเป็น React อินสแตนซ์เดียวกับหน้าเว็บ เพื่อเลี่ยง Invalid hook call)
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

// 2. เรนเดอร์
ctx.render(<App />);
```

ตัวอย่างนี้พึ่งพาเพียง `@dnd-kit/core` โดยจะแสดงการแจ้งเตือนเมื่อลาก Box ไปวางในพื้นที่ที่กำหนด ซึ่งเป็นการสาธิตการใช้ `ctx.importAsync` ร่วมกับ React เพื่อสร้างการโต้ตอบแบบลากและวางที่ง่ายที่สุดใน RunJS ครับ

### ตัวอย่างรายการที่จัดเรียงได้ด้วย dnd-kit

สร้างรายการที่รองรับการลากเพื่อจัดเรียงลำดับในแนวตั้ง โดยใช้ core / sortable / utilities ของ dnd-kit

```ts
// 1. โหลด React และแพ็กเกจที่เกี่ยวข้องกับ dnd-kit (?deps เพื่อให้แน่ใจว่าเป็น React อินสแตนซ์เดียวกัน)
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

// 2. คอมโพเนนต์ SortableItem (ต้องอยู่ภายใน SortableContext)
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

// 3. App: DndContext + SortableContext + การจัดการเมื่อสิ้นสุดการลาก
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

// 4. สร้างคอนเทนเนอร์และเมานต์ React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

ตัวอย่างนี้ใช้ `@dnd-kit/core`, `@dnd-kit/sortable` และ `@dnd-kit/utilities` เพื่อสร้างรายการที่สามารถลากจัดเรียงลำดับได้ และจะอัปเดตลำดับพร้อมแสดงข้อความ "List reordered" เมื่อการลากสิ้นสุดลงครับ

### ตัวอย่าง react-big-calendar

ใช้ `react-big-calendar` ร่วมกับการกำหนดรูปแบบตามท้องถิ่นของ date-fns เพื่อเรนเดอร์คอมโพเนนต์ปฏิทินที่รองรับการแสดงเหตุการณ์ในบล็อกปัจจุบัน

```tsx
// 1. โหลดสไตล์ (ctx.importAsync จะเรียกใช้ ctx.loadCSS เมื่อเจอ .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. โหลด React, react-dom, react-big-calendar, date-fns และ locale (เพื่อให้แน่ใจว่าเป็น React อินสแตนซ์เดียวกัน)
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

// 3. เรนเดอร์ React ปฏิทิน
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

### ตัวอย่าง frappe-gantt

ใช้ `frappe-gantt` เพื่อเรนเดอร์มุมมองแผนภูมิแกนต์ (Gantt Chart) ที่แสดงเวลาเริ่มต้น/สิ้นสุด และความคืบหน้าของงาน

```ts
// 1. โหลดสไตล์และ Constructor ของ Gantt แบบไดนามิก
// พึ่งพา ESM_CDN_BASE_URL (ค่าเริ่มต้นคือ https://esm.sh) สามารถใช้เส้นทางแบบย่อได้
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. เตรียมข้อมูลงาน
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

// 3. สร้างคอนเทนเนอร์และเรนเดอร์
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. เริ่มต้นแผนภูมิ Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // ความละเอียดของมุมมอง: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### ตัวอย่าง @asseinfo/react-kanban

ใช้ `@asseinfo/react-kanban` เพื่อเรนเดอร์กระดานคัมบัง (Kanban Board) พื้นฐานที่มีคอลัมน์ เช่น Backlog / Doing ภายในบล็อก

```ts
// 1. โหลดสไตล์ (ctx.importAsync จะโหลด .css โดยตรง)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. โหลด React, react-dom, @asseinfo/react-kanban (?deps เพื่อให้แน่ใจว่าเป็น React อินสแตนซ์เดียวกัน)
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

// 4. เมานต์กระดานคัมบัง
ctx.render(<Board initialBoard={board} />);
```

## ข้อควรระวัง

- ฟีเจอร์นี้ต้องพึ่งพาเครือข่ายภายนอกหรือ CDN หากอยู่ในสภาพแวดล้อมเครือข่ายภายใน ต้องกำหนดค่า **ESM_CDN_BASE_URL** ให้ชี้ไปยังบริการส่วนตัวครับ
- หากไลบรารีมีให้เลือกทั้ง ESM และ UMD แนะนำให้ใช้ `ctx.importAsync()` เพื่อให้ได้รูปแบบโมดูลที่ทันสมัยกว่า
- สำหรับไลบรารีที่ต้องพึ่งพา React อย่าลืมเพิ่ม `?deps=react@18.2.0,react-dom@18.2.0` โดยเวอร์ชันต้องตรงกับ React ที่หน้าเว็บใช้งาน มิฉะนั้นอาจเกิดข้อผิดพลาด Invalid hook call ได้ครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.requireAsync()](./require-async.md): โหลด UMD/AMD หรือสคริปต์ที่ผูกกับ Global Scope เหมาะสำหรับไลบรารี UMD เช่น ECharts, FullCalendar
- [ctx.render()](./render.md): เรนเดอร์เนื้อหาลงในคอนเทนเนอร์