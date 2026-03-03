:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/import-async).
:::

# ctx.importAsync()

تحميل **وحدات ESM** أو **CSS** ديناميكيًا عبر URL، وهو مناسب لمختلف سيناريوهات RunJS. استخدم `ctx.importAsync()` عندما تكون مكتبات ESM الخارجية مطلوبة، و `ctx.requireAsync()` لمكتبات UMD/AMD؛ سيؤدي تمرير عنوان ينتهي بـ `.css` إلى تحميل الأنماط وحقنها في الصفحة.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock** | تحميل مكتبات ESM ديناميكيًا مثل Vue أو ECharts أو Tabulator لتنفيذ رسوم بيانية، جداول، أو لوحات معلومات مخصصة. |
| **JSField / JSItem / JSColumn** | تحميل مكتبات أدوات ESM خفيفة الوزن (مثل إضافات dayjs) للمساعدة في عملية العرض (Rendering). |
| **سير العمل / أحداث الإجراءات** | تحميل التبعيات عند الطلب قبل تنفيذ منطق العمل. |

## تعريف النوع

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## المعاملات

| المعامل | النوع | الوصف |
|------|------|------|
| `url` | `string` | عنوان وحدة ESM أو ملف CSS. يدعم التنسيق المختصر `<package>@<version>` أو المسارات الفرعية `<package>@<version>/<file-path>` (مثل `vue@3.4.0` أو `dayjs@1/plugin/relativeTime.js`)، والتي سيتم دمجها مع بادئة CDN وفقًا للإعدادات؛ كما يدعم الروابط الكاملة. عند تمرير ملف `.css` يتم تحميله وحقنه كنمط. بالنسبة للمكتبات التي تعتمد على React، يمكنك إضافة `?deps=react@18.2.0,react-dom@18.2.0` لضمان مشاركة نفس نسخة React مع الصفحة. |

## القيمة المرجعة

- كائن Promise يتم حله إلى كائن مساحة الاسم (namespace) الخاص بالوحدة.

## شرح تنسيق URL

- **ESM و CSS**: بالإضافة إلى وحدات ESM، يدعم تحميل CSS (مرر رابط `.css` لتحميله وحقنه في الصفحة).
- **التنسيق المختصر**: يتم استخدام **https://esm.sh** كبادئة CDN افتراضية إذا لم يتم تكوين غيرها. على سبيل المثال، `vue@3.4.0` تطلب فعليًا `https://esm.sh/vue@3.4.0`.
- **?deps**: المكتبات التي تعتمد على React (مثل `@dnd-kit/core` و `react-big-calendar`) يجب أن تضيف `?deps=react@18.2.0,react-dom@18.2.0` لتجنب التعارض مع نسخة React في الصفحة، مما قد يؤدي إلى خطأ "Invalid hook call".
- **CDN مستضاف ذاتيًا**: يمكنك تحديد شبكة داخلية أو خدمة مستضافة ذاتيًا عبر متغيرات البيئة:
  - **ESM_CDN_BASE_URL**: الرابط الأساسي لـ ESM CDN (الافتراضي هو `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: لاحقة اختيارية (مثل `/+esm` لـ jsDelivr).
  - للخدمات المستضافة ذاتيًا، راجع: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## الفرق عن ctx.requireAsync()

- **ctx.importAsync()**: يحمل **وحدات ESM** ويعيد مساحة اسم الوحدة. مناسب للمكتبات الحديثة (إصدارات ESM مثل Vue و dayjs وغيرها).
- **ctx.requireAsync()**: يحمل وحدات **UMD/AMD** أو السكربتات التي ترتبط بالنطاق العالمي (global scope). غالبًا ما يُستخدم لمكتبات UMD مثل ECharts أو FullCalendar. إذا كانت المكتبة توفر كلا النوعين، يُفضل استخدام `ctx.importAsync()`.

## أمثلة

### الاستخدام الأساسي

يوضح الاستخدام الأساسي لتحميل وحدات ESM و CSS ديناميكيًا باستخدام اسم الحزمة أو الرابط الكامل.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// يعادل التحميل من https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// مع مسار فرعي (مثل إضافة dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// رابط كامل

await ctx.importAsync('https://cdn.example.com/theme.css');
// تحميل CSS وحقنه في الصفحة
```

### مثال ECharts

استخدام ECharts لرسم مخطط نظرة عامة على المبيعات يتضمن رسومًا بيانية شريطية وخطية.

```ts
// 1. تحميل وحدة ECharts ديناميكيًا
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. إنشاء حاوية المخطط وعرضها
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. تهيئة مثيل ECharts
const chart = echarts.init(chartEl);

// 4. تكوين المخطط
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

// 5. تعيين الخيارات وعرض المخطط
chart.setOption(option);

// 6. اختياري: جعل الحجم متجاوبًا
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. اختياري: مستمع للأحداث
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### مثال Tabulator

يوضح عرض جدول بيانات مع ميزات الترقيم وأحداث النقر على الصفوف داخل كتلة باستخدام Tabulator.

```ts
// 1. تحميل أنماط Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. تحميل وحدة Tabulator ديناميكيًا
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. إنشاء حاوية الجدول وعرضها
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. تهيئة جدول Tabulator
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

// 5. اختياري: مستمع للأحداث
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### مثال FullCalendar (ESM)

يوضح كيفية تحميل FullCalendar وإضافاته عبر ESM وعرض تقويم عرض شهري أساسي.

```ts
// 1. تحميل وحدة FullCalendar core ديناميكيًا
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. تحميل إضافة dayGrid ديناميكيًا
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. إنشاء حاوية التقويم وعرضها
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. تهيئة وعرض التقويم
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

### مثال سحب وإفلات بسيط باستخدام dnd-kit

يستخدم `@dnd-kit/core` لتنفيذ مثال بسيط لسحب صندوق إلى منطقة مستهدفة داخل كتلة.

```ts
// 1. تحميل React و react-dom و @dnd-kit/core (استخدام ?deps لضمان نفس نسخة React وتجنب Invalid hook call)
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

// 2. العرض
ctx.render(<App />);
```

يعتمد هذا المثال فقط على `@dnd-kit/core` لإطلاق تنبيه عند إفلات الصندوق في منطقة محددة، مما يوضح أبسط تفاعل سحب وإفلات يجمع بين `ctx.importAsync` و React في RunJS.

### مثال قائمة قابلة للترتيب باستخدام dnd-kit

ينفذ قائمة عمودية قابلة للترتيب باستخدام core و sortable و utilities من dnd-kit.

```ts
// 1. تحميل React وحزم dnd-kit ذات الصلة (?deps لضمان نفس نسخة React)
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

// 2. مكون SortableItem (يجب أن يكون داخل SortableContext)
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

// 3. التطبيق: DndContext + SortableContext + معالج نهاية السحب
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

// 4. إنشاء الحاوية وتركيب React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

ينفذ هذا المثال قائمة قابلة للسحب والترتيب، ويقوم بتحديث الترتيب وعرض رسالة "List reordered" بعد انتهاء عملية السحب.

### مثال react-big-calendar

يعرض مكون تقويم يدعم عرض الأحداث في الكتلة الحالية باستخدام `react-big-calendar` و `date-fns` للتوطين (localization).

```tsx
// 1. تحميل الأنماط (ctx.importAsync يستخدم ctx.loadCSS لملفات .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. تحميل React و react-dom و react-big-calendar و date-fns والتوطين (لضمان نفس نسخة React)
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

// 3. عرض تقويم React
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

### مثال frappe-gantt

استخدام `frappe-gantt` لعرض مخطط غانت يوضح أوقات بدء/انتهاء المهام والتقدم.

```ts
// 1. تحميل أنماط Gantt والمُنشئ ديناميكيًا
// يعتمد على ESM_CDN_BASE_URL (الافتراضي https://esm.sh)، يمكن استخدام المسارات المختصرة
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. تحضير بيانات المهام
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

// 3. إنشاء الحاوية والعرض
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. تهيئة مخطط Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // دقة العرض: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### مثال @asseinfo/react-kanban

استخدام `@asseinfo/react-kanban` لعرض لوحة كانبان أساسية تحتوي على أعمدة مثل Backlog و Doing داخل كتلة.

```ts
// 1. تحميل الأنماط (ctx.importAsync يحمل .css مباشرة)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. تحميل React و react-dom و @asseinfo/react-kanban (?deps لضمان نفس نسخة React)
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

// 4. تركيب اللوحة
ctx.render(<Board initialBoard={board} />);
```

## ملاحظات

- تعتمد هذه الميزة على شبكة خارجية أو CDN. في بيئات الشبكة الداخلية، يجب تكوين **ESM_CDN_BASE_URL** ليشير إلى خدمة مستضافة ذاتيًا.
- عندما توفر المكتبة كلا من ESM و UMD، يفضل استخدام `ctx.importAsync()` للحصول على دلالات برمجية أفضل للوحدات.
- بالنسبة للمكتبات التي تعتمد على React، تأكد من إضافة `?deps=react@18.2.0,react-dom@18.2.0`. يجب أن يتطابق الإصدار مع إصدار React المستخدم في الصفحة، وإلا فقد يظهر خطأ "Invalid hook call".

## ذات صلة

- [ctx.requireAsync()](./require-async.md): تحميل وحدات UMD/AMD أو السكربتات العالمية، مناسب لمكتبات UMD مثل ECharts و FullCalendar.
- [ctx.render()](./render.md): عرض المحتوى داخل حاوية.