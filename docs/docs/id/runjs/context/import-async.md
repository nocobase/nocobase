---
title: "ctx.importAsync()"
description: "ctx.importAsync() memuat modul ESM atau CSS secara dinamis berdasarkan URL, cocok untuk skenario RunJS seperti JSBlock, JSField, event flow."
keywords: "ctx.importAsync,ESM,loading dinamis,esm.sh,JSBlock,JSField,RunJS,NocoBase"
---

# ctx.importAsync()

Memuat **modul ESM** atau **CSS** secara dinamis berdasarkan URL, cocok untuk berbagai skenario RunJS. Saat membutuhkan library ESM pihak ketiga gunakan `ctx.importAsync()`, library UMD/AMD gunakan `ctx.requireAsync()`; meneruskan alamat `.css` akan memuat dan menyuntikkan style.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | Memuat library ESM seperti Vue, ECharts, Tabulator secara dinamis untuk mengimplementasikan chart, tabel, kanban kustom, dll. |
| **JSField / JSItem / JSColumn** | Memuat library utility ESM ringan (seperti plugin dayjs) untuk membantu render |
| **Event Flow / Action Event** | Memuat dependensi sesuai kebutuhan baru kemudian mengeksekusi logika |

## Definisi Tipe

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parameter

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `url` | `string` | Alamat modul ESM atau CSS. Mendukung format singkat `<nama-paket>@<versi>` atau dengan sub-path `<nama-paket>@<versi>/<path-file>` (seperti `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), akan digabungkan dengan prefix CDN sesuai konfigurasi; juga mendukung URL lengkap. Saat meneruskan `.css` akan memuat dan menyuntikkan style. Library yang bergantung pada React dapat menambahkan `?deps=react@18.2.0,react-dom@18.2.0` untuk memastikan menggunakan instance React yang sama dengan halaman. |

## Return Value

- Objek namespace modul yang sudah di-resolve (nilai resolve Promise).

## Penjelasan Format URL

- **ESM dan CSS**: selain modul ESM, juga mendukung loading CSS (meneruskan URL `.css`, di-inject ke halaman setelah loading).
- **Format singkat**: saat tidak dikonfigurasi menggunakan **https://esm.sh** sebagai prefix CDN. Contoh `vue@3.4.0` sebenarnya request `https://esm.sh/vue@3.4.0`.
- **?deps**: library yang bergantung pada React (seperti `@dnd-kit/core`, `react-big-calendar`) perlu menambahkan `?deps=react@18.2.0,react-dom@18.2.0`, untuk menghindari konflik dengan instance React halaman yang menyebabkan Invalid hook call.
- **CDN mandiri**: dapat menentukan layanan intranet atau mandiri melalui environment variable:
  - **ESM_CDN_BASE_URL**: alamat dasar ESM CDN (default `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: suffix opsional (seperti `/+esm` dari jsDelivr)
  - Layanan mandiri dapat merujuk ke: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Perbedaan dengan ctx.requireAsync()

- **ctx.importAsync()**: memuat **modul ESM**, mengembalikan namespace modul, cocok untuk library modern (build ESM seperti Vue, dayjs).
- **ctx.requireAsync()**: memuat script **UMD/AMD** atau yang di-mount ke global, banyak digunakan untuk library UMD seperti ECharts, FullCalendar. Jika library juga menyediakan ESM, lebih utamakan `ctx.importAsync()`.

## Contoh

### Penggunaan Dasar

Untuk demo penggunaan paling dasar untuk loading dinamis modul ESM dan CSS berdasarkan nama paket atau URL lengkap.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Setara dengan loading dari https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Dengan sub-path (seperti plugin dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL lengkap

await ctx.importAsync('https://cdn.example.com/theme.css');
// Memuat CSS dan menyuntikkan ke halaman
```

### Contoh ECharts

Menggunakan ECharts untuk menggambar chart ikhtisar penjualan dengan grafik batang dan grafik garis.

```ts
// 1. Memuat modul ECharts secara dinamis
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Membuat container chart dan render
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inisialisasi instance ECharts
const chart = echarts.init(chartEl);

// 4. Konfigurasi chart
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

// 5. Menyetel konfigurasi dan render chart
chart.setOption(option);

// 6. Opsional: ukuran adaptif
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Opsional: event listener
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Contoh Tabulator

Demo merender tabel data yang mendukung pagination dan event klik baris di dalam block melalui Tabulator.

```ts
// 1. Memuat style Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Memuat modul Tabulator secara dinamis
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Membuat container tabel dan render
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Inisialisasi tabel Tabulator
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

// 5. Opsional: event listener
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Contoh FullCalendar (ESM)

Menunjukkan cara memuat FullCalendar dan plugin-nya dalam bentuk ESM, dan merender kalender tampilan bulan dasar.

```ts
// 1. Memuat modul core FullCalendar secara dinamis
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Memuat plugin dayGrid secara dinamis
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Membuat container kalender dan render
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inisialisasi dan render kalender
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

### Contoh Drag-and-Drop Sederhana dnd-kit

Menggunakan `@dnd-kit/core` untuk mengimplementasikan contoh drag-and-drop minimal yang menyeret Box ke area target di dalam block.

```ts
// 1. Memuat React, react-dom, @dnd-kit/core (?deps memastikan instance React yang sama dengan halaman, untuk menghindari Invalid hook call)
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

Contoh ini hanya bergantung pada `@dnd-kit/core`, dengan menyeret Box ke area yang ditentukan untuk memicu tip, mendemonstrasikan interaksi drag-and-drop paling sederhana di RunJS dengan kombinasi `ctx.importAsync` + React.

### Contoh List yang Dapat Disortir dnd-kit

Berdasarkan dnd-kit core / sortable / utilities mengimplementasikan list sortir vertikal yang mendukung drag-and-drop reorder.

```ts
// 1. Memuat React dan paket terkait dnd-kit (?deps memastikan instance React yang sama)
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

// 2. Komponen SortableItem (harus berada dalam SortableContext)
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

// 3. App: DndContext + SortableContext + handler drag end
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

// 4. Membuat container dan mount React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Contoh ini berbasis `@dnd-kit/core`, `@dnd-kit/sortable`, dan `@dnd-kit/utilities`, mengimplementasikan list yang dapat di-drag dan disortir, serta memperbarui urutan dan memberi tip "List reordered" setelah drag selesai.

### Contoh react-big-calendar

Melalui `react-big-calendar` dan lokalisasi date-fns, merender komponen kalender yang mendukung tampilan event di block saat ini.

```tsx
// 1. Memuat style (ctx.importAsync akan menggunakan ctx.loadCSS saat menjumpai .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Memuat React, react-dom, react-big-calendar, date-fns dan locale (memastikan instance React yang sama)
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

// 3. Render kalender React
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

### Contoh frappe-gantt

Menggunakan `frappe-gantt` untuk merender tampilan grafik Gantt yang menampilkan waktu mulai/selesai task dan progress.

```ts
// 1. Memuat style Gantt dan constructor secara dinamis
// Bergantung pada ESM_CDN_BASE_URL (default https://esm.sh), dapat menggunakan path singkat
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Menyiapkan data task
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

// 3. Membuat container dan render
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inisialisasi grafik Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granularitas tampilan: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### Contoh @asseinfo/react-kanban

Memanfaatkan `@asseinfo/react-kanban` untuk merender kanban dasar yang berisi kolom seperti Backlog / Doing di block.

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

## Hal yang Perlu Diperhatikan

- Bergantung pada jaringan eksternal atau CDN, environment intranet perlu mengkonfigurasi **ESM_CDN_BASE_URL** mengarah ke layanan mandiri.
- Saat library menyediakan ESM dan UMD bersamaan, lebih utamakan `ctx.importAsync()` untuk mendapatkan semantik modul yang lebih baik.
- Library yang bergantung pada React harus menambahkan `?deps=react@18.2.0,react-dom@18.2.0`, versi harus sama dengan React halaman, jika tidak mungkin akan melaporkan Invalid hook call.

## Terkait

- [ctx.requireAsync()](./require-async.md): Memuat script UMD/AMD atau yang di-mount ke global, cocok untuk library UMD seperti ECharts, FullCalendar
- [ctx.render()](./render.md): Merender konten ke container
