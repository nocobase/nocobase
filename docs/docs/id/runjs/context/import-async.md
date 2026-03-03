:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/import-async).
:::

# ctx.importAsync()

Memuat **modul ESM** atau **CSS** secara dinamis melalui URL, berlaku untuk berbagai skenario RunJS. Gunakan `ctx.importAsync()` saat pustaka ESM pihak ketiga diperlukan, dan `ctx.requireAsync()` untuk pustaka UMD/AMD; memasukkan alamat `.css` akan memuat dan menyuntikkan gaya (style) ke dalam halaman.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock** | Memuat pustaka ESM secara dinamis seperti Vue, ECharts, atau Tabulator untuk mengimplementasikan grafik, tabel, dasbor kustom, dll. |
| **JSField / JSItem / JSColumn** | Memuat pustaka utilitas ESM ringan (misalnya plugin dayjs) untuk membantu perenderan. |
| **Alur Kerja / Peristiwa Tindakan** | Memuat dependensi sesuai kebutuhan sebelum mengeksekusi logika bisnis. |

## Definisi Tipe

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parameter

| Parameter | Tipe | Keterangan |
|------|------|------|
| `url` | `string` | Alamat modul ESM atau CSS. Mendukung penulisan singkat `<nama-paket>@<versi>` atau sub-jalur `<nama-paket>@<versi>/<jalur-file>` (misalnya `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), yang akan digabungkan dengan awalan CDN sesuai konfigurasi; URL lengkap juga didukung. Saat file `.css` dimasukkan, file tersebut akan dimuat dan disuntikkan sebagai gaya. Untuk pustaka yang bergantung pada React, Anda dapat menambahkan `?deps=react@18.2.0,react-dom@18.2.0` untuk memastikan pustaka tersebut berbagi instans React yang sama dengan halaman. |

## Nilai Kembalian

- Objek namespace modul yang telah diurai (nilai resolusi Promise).

## Penjelasan Format URL

- **ESM dan CSS**: Selain modul ESM, pemuatan CSS juga didukung (masukkan URL `.css` untuk memuat dan menyuntikkannya ke halaman).
- **Format Singkat**: Secara default menggunakan **https://esm.sh** sebagai awalan CDN jika tidak dikonfigurasi. Contohnya, `vue@3.4.0` sebenarnya meminta `https://esm.sh/vue@3.4.0`.
- **?deps**: Pustaka yang bergantung pada React (seperti `@dnd-kit/core`, `react-big-calendar`) harus menambahkan `?deps=react@18.2.0,react-dom@18.2.0` untuk menghindari konflik dengan instans React halaman, yang dapat menyebabkan kesalahan "Invalid hook call".
- **CDN Mandiri**: Anda dapat menentukan jaringan internal atau layanan mandiri melalui variabel lingkungan:
  - **ESM_CDN_BASE_URL**: URL dasar CDN ESM (default adalah `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Akhiran opsional (misalnya `/+esm` untuk jsDelivr).
  - Untuk layanan mandiri, silakan merujuk ke: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Perbedaan dengan ctx.requireAsync()

- **ctx.importAsync()**: Memuat **modul ESM** dan mengembalikan namespace modul. Cocok untuk pustaka modern (build ESM seperti Vue, dayjs, dll.).
- **ctx.requireAsync()**: Memuat modul **UMD/AMD** atau skrip yang menempel pada cakupan global. Sering digunakan untuk pustaka UMD seperti ECharts atau FullCalendar. Jika pustaka menyediakan ESM dan UMD, `ctx.importAsync()` lebih diutamakan.

## Contoh

### Penggunaan Dasar

Menunjukkan penggunaan paling dasar dari pemuatan modul ESM dan CSS secara dinamis berdasarkan nama paket atau URL lengkap.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Setara dengan memuat dari https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Dengan sub-jalur (misalnya plugin dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL lengkap

await ctx.importAsync('https://cdn.example.com/theme.css');
// Memuat CSS dan menyuntikkannya ke halaman
```

### Contoh ECharts

Menggunakan ECharts untuk menggambar grafik ringkasan penjualan dengan diagram batang dan garis.

```ts
// 1. Memuat modul ECharts secara dinamis
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Membuat kontainer grafik dan merender
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inisialisasi instans ECharts
const chart = echarts.init(chartEl);

// 4. Konfigurasi grafik
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

// 5. Mengatur opsi dan merender grafik
chart.setOption(option);

// 6. Opsional: Ukuran responsif
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Opsional: Pendengar peristiwa (event listener)
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Contoh Tabulator

Mendemonstrasikan perenderan tabel data dengan paginasi dan peristiwa klik baris dalam sebuah blok menggunakan Tabulator.

```ts
// 1. Memuat gaya Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Memuat modul Tabulator secara dinamis
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Membuat kontainer tabel dan merender
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

// 5. Opsional: Pendengar peristiwa
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Contoh FullCalendar (ESM)

Menunjukkan cara memuat FullCalendar dan pluginnya melalui ESM dan merender kalender tampilan bulanan dasar.

```ts
// 1. Memuat modul core FullCalendar secara dinamis
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Memuat plugin dayGrid secara dinamis
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Membuat kontainer kalender dan merender
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inisialisasi dan merender kalender
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

### Contoh dnd-kit Sederhana

Menggunakan `@dnd-kit/core` untuk mengimplementasikan contoh minimal menyeret Box ke area target dalam sebuah blok.

```ts
// 1. Memuat React, react-dom, @dnd-kit/core (?deps memastikan instans React yang sama untuk menghindari Invalid hook call)
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

// 2. Merender
ctx.render(<App />);
```

Contoh ini hanya bergantung pada `@dnd-kit/core` untuk memicu notifikasi saat Box dijatuhkan ke area tertentu, mendemonstrasikan interaksi seret-dan-lepas paling sederhana yang menggabungkan `ctx.importAsync` + React di RunJS.

### Contoh Daftar Urut dnd-kit

Mengimplementasikan daftar urut vertikal menggunakan core, sortable, dan utilities dari dnd-kit.

```ts
// 1. Memuat React dan paket terkait dnd-kit (?deps memastikan instans React yang sama)
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

// 2. Komponen SortableItem (harus berada di dalam SortableContext)
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

// 3. App: DndContext + SortableContext + Penangan akhir seret
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

// 4. Membuat kontainer dan memasang React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Contoh ini menggunakan `@dnd-kit/core`, `@dnd-kit/sortable`, dan `@dnd-kit/utilities` untuk mengimplementasikan daftar urut yang memperbarui urutannya dan menampilkan pesan "List reordered" setelah penyeretan selesai.

### Contoh react-big-calendar

Merender komponen kalender yang mendukung tampilan acara di blok saat ini menggunakan `react-big-calendar` dan `date-fns` untuk lokalisasi.

```tsx
// 1. Memuat gaya (ctx.importAsync menggunakan ctx.loadCSS untuk file .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Memuat React, react-dom, react-big-calendar, date-fns, dan locale (memastikan instans React yang sama)
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

// 3. Merender Kalender React
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

Menggunakan `frappe-gantt` untuk merender tampilan bagan Gantt yang menunjukkan waktu mulai/selesai tugas dan progresnya.

```ts
// 1. Memuat gaya Gantt dan konstruktor secara dinamis
// Bergantung pada ESM_CDN_BASE_URL (default https://esm.sh), jalur singkat dapat digunakan
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Menyiapkan data tugas
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

// 3. Membuat kontainer dan merender
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inisialisasi bagan Gantt
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

Menggunakan `@asseinfo/react-kanban` untuk merender papan Kanban dasar dengan kolom seperti Backlog dan Doing di dalam sebuah blok.

```ts
// 1. Memuat gaya (ctx.importAsync langsung memuat .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Memuat React, react-dom, @asseinfo/react-kanban (?deps memastikan instans React yang sama)
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

// 4. Memasang papan (board)
ctx.render(<Board initialBoard={board} />);
```

## Catatan

- Fitur ini bergantung pada jaringan eksternal atau CDN. Dalam lingkungan jaringan internal, **ESM_CDN_BASE_URL** harus dikonfigurasi untuk mengarah ke layanan mandiri.
- Ketika pustaka menyediakan ESM dan UMD, gunakan `ctx.importAsync()` untuk semantik modul yang lebih baik.
- Untuk pustaka yang bergantung pada React, pastikan Anda menambahkan `?deps=react@18.2.0,react-dom@18.2.0`. Versi tersebut harus sesuai dengan versi React yang digunakan oleh halaman, jika tidak, kesalahan "Invalid hook call" mungkin terjadi.

## Terkait

- [ctx.requireAsync()](./require-async.md): Memuat UMD/AMD atau skrip yang menempel secara global, cocok untuk pustaka UMD seperti ECharts dan FullCalendar.
- [ctx.render()](./render.md): Merender konten ke dalam kontainer.