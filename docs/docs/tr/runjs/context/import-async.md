:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/import-async) bakın.
:::

# ctx.importAsync()

URL aracılığıyla **ESM modüllerini** veya **CSS** dosyalarını dinamik olarak yükler; çeşitli RunJS senaryoları için uygundur. Üçüncü taraf ESM kütüphaneleri gerektiğinde `ctx.importAsync()` işlevini, UMD/AMD kütüphaneleri için ise `ctx.requireAsync()` işlevini kullanın. Bir `.css` adresi geçildiğinde, stiller yüklenir ve sayfaya enjekte edilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock** | Özel grafikler, tablolar, panolar vb. oluşturmak için Vue, ECharts veya Tabulator gibi ESM kütüphanelerini dinamik olarak yükleyin. |
| **JSField / JSItem / JSColumn** | İşlemeye yardımcı olması için hafif ESM araç kütüphanelerini (örneğin dayjs eklentileri) yükleyin. |
| **İş Akışı / İşlem Olayları** | İş mantığını yürütmeden önce bağımlılıkları isteğe bağlı olarak yükleyin. |

## Tip Tanımı

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parametreler

| Parametre | Tip | Açıklama |
|------|------|------|
| `url` | `string` | ESM modülünün veya CSS'in adresi. Kısa yazım `<paket>@<versiyon>` veya alt yollar `<paket>@<versiyon>/<dosya-yolu>` (örneğin `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`) desteklenir; bunlar yapılandırmaya göre CDN önekiyle birleştirilir. Tam URL'ler de desteklenir. Bir `.css` dosyası geçildiğinde, yüklenir ve stil olarak enjekte edilir. React'e bağımlı kütüphaneler için, sayfa ile aynı React örneğini paylaştıklarından emin olmak amacıyla `?deps=react@18.2.0,react-dom@18.2.0` parametresini ekleyebilirsiniz. |

## Dönüş Değeri

- Modülün ad alanı nesnesine (namespace object) çözümlenen bir Promise.

## URL Formatı Açıklaması

- **ESM ve CSS**: ESM modüllerine ek olarak, CSS yükleme de desteklenir (yüklemek ve sayfaya enjekte etmek için bir `.css` URL'si geçin).
- **Kısa Yazım Formatı**: Yapılandırılmamışsa, CDN öneki olarak varsayılan **https://esm.sh** kullanılır. Örneğin, `vue@3.4.0` aslında `https://esm.sh/vue@3.4.0` adresini ister.
- **?deps**: React'e bağımlı kütüphaneler (örneğin `@dnd-kit/core`, `react-big-calendar`), sayfanın React örneğiyle çakışmaları önlemek ve "Invalid hook call" hatalarından kaçınmak için `?deps=react@18.2.0,react-dom@18.2.0` eklemelidir.
- **Kendi CDN'iniz**: Ortam değişkenleri aracılığıyla dahili bir ağ veya kendi barındırdığınız servis belirtilebilir:
  - **ESM_CDN_BASE_URL**: ESM CDN için temel URL (varsayılan `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: İsteğe bağlı son ek (örneğin jsDelivr için `/+esm`).
  - Kendi barındırdığınız servisler için şuna bakabilirsiniz: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## ctx.requireAsync() ile Farkı

- **ctx.importAsync()**: **ESM modüllerini** yükler ve modül ad alanını döndürür. Modern kütüphaneler (Vue, dayjs vb. ESM sürümleri) için uygundur.
- **ctx.requireAsync()**: **UMD/AMD** modüllerini veya global kapsama eklenen betikleri yükler. Genellikle ECharts veya FullCalendar gibi UMD kütüphaneleri için kullanılır. Bir kütüphane hem ESM hem de UMD sunuyorsa, `ctx.importAsync()` tercih edilir.

## Örnekler

### Temel Kullanım

Paket adı veya tam URL kullanarak ESM modüllerini ve CSS'i dinamik olarak yüklemenin en temel kullanımını gösterir.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0 adresinden yüklemeye eşdeğerdir

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Alt yol ile (örneğin dayjs eklentisi)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Tam URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// CSS yükle ve sayfaya enjekte et
```

### ECharts Örneği

Sütun ve çizgi grafik içeren bir satış genel bakış grafiği çizmek için ECharts kullanın.

```ts
// 1. ECharts modülünü dinamik olarak yükleyin
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Grafik konteynerini oluşturun ve render edin
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. ECharts örneğini başlatın
const chart = echarts.init(chartEl);

// 4. Grafiği yapılandırın
const option = {
  title: {
    text: 'Satış Genel Bakışı',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['Satışlar', 'Kâr'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Satışlar',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: 'Kâr',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. Seçenekleri ayarlayın ve grafiği render edin
chart.setOption(option);

// 6. İsteğe bağlı: Duyarlı boyutlandırma
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. İsteğe bağlı: Olay dinleyici
chart.on('click', (params) => {
  ctx.message.info(`${params.name} üzerinde ${params.seriesName} tıklandı, değer: ${params.value}`);
});
```

### Tabulator Örneği

Tabulator kullanarak bir blok içinde sayfalama ve satır tıklama olayları içeren bir veri tablosunun nasıl render edileceğini gösterir.

```ts
// 1. Tabulator stillerini yükleyin
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Tabulator modülünü dinamik olarak yükleyin
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Tablo konteynerini oluşturun ve render edin
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Tabulator tablosunu başlatın
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'İstanbul' },
    { id: 2, name: 'Bob', age: 30, city: 'Ankara' },
    { id: 3, name: 'Charlie', age: 28, city: 'İzmir' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'İsim', field: 'name', width: 150 },
    { title: 'Yaş', field: 'age', width: 100 },
    { title: 'Şehir', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. İsteğe bağlı: Olay dinleyici
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Satır tıklandı: ${rowData.name}`);
});
```

### FullCalendar (ESM) Örneği

FullCalendar ve eklentilerinin ESM aracılığıyla nasıl yükleneceğini ve temel bir aylık görünüm takviminin nasıl render edileceğini gösterir.

```ts
// 1. FullCalendar core modülünü dinamik olarak yükleyin
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. dayGrid eklentisini dinamik olarak yükleyin
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Takvim konteynerini oluşturun ve render edin
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Takvimi başlatın ve render edin
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

### dnd-kit Basit Sürükle-Bırak Örneği

Bir blok içinde bir kutuyu hedef alana sürüklemeye yönelik minimal bir örnek uygulamak için `@dnd-kit/core` kullanır.

```ts
// 1. React, react-dom, @dnd-kit/core yükleyin (?deps, Invalid hook call hatasını önlemek için aynı React örneğini sağlar)
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
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Beni sürükle');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Buraya bırak',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Alana bırakıldı');
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

Bu örnek, bir kutu belirli bir alana bırakıldığında bir bildirim tetiklemek için yalnızca `@dnd-kit/core` kütüphanesine dayanır ve RunJS'de `ctx.importAsync` + React birleşimini kullanarak en basit sürükle-bırak etkileşimini gösterir.

### dnd-kit Sıralanabilir Liste Örneği

dnd-kit'in core, sortable ve utilities paketlerini kullanarak dikey olarak sıralanabilir bir liste uygular.

```ts
// 1. React ve dnd-kit ile ilgili paketleri yükleyin (?deps aynı React örneğini sağlar)
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

// 2. SortableItem bileşeni (SortableContext içinde olmalıdır)
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

// 3. App: DndContext + SortableContext + Sürükleme sonu işleyicisi
const labels = { 1: 'Birinci', 2: 'İkinci', 3: 'Üçüncü', 4: 'Dördüncü' };
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
      ctx.message.success('Liste yeniden sıralandı');
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

// 4. Konteyner oluşturun ve React'i bağlayın
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Bu örnek, `@dnd-kit/core`, `@dnd-kit/sortable` ve `@dnd-kit/utilities` kullanarak sıralanabilir bir liste uygular; sürükleme bittikten sonra sırayı günceller ve "Liste yeniden sıralandı" mesajını görüntüler.

### react-big-calendar Örneği

Yerelleştirme için `react-big-calendar` ve `date-fns` kullanarak mevcut blokta etkinlik gösterimini destekleyen bir takvim bileşeni render eder.

```tsx
// 1. Stilleri yükleyin (ctx.importAsync, .css dosyaları için ctx.loadCSS kullanır)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. React, react-dom, react-big-calendar, date-fns ve yerelleştirmeyi yükleyin (aynü React örneğini sağlayarak)
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
  { title: 'Tüm Gün Etkinliği', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Toplantı', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. React Takvimini render edin
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

### frappe-gantt Örneği

Görev başlangıç/bitiş zamanlarını ve ilerlemesini gösteren bir Gantt şeması görünümü render etmek için `frappe-gantt` kullanır.

```ts
// 1. Gantt stillerini ve kurucusunu dinamik olarak yükleyin
// ESM_CDN_BASE_URL'ye (varsayılan https://esm.sh) bağlıdır, kısa yollar kullanılabilir
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Görev verilerini hazırlayın
let tasks = [
  {
    id: '1',
    name: 'Web sitesini yeniden tasarla',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20,
  },
  {
    id: '2',
    name: 'Yeni özellik geliştir',
    start: '2017-01-01',
    end: '2017-01-05',
    progress: 40,
    dependencies: '1',
  },
  {
    id: '3',
    name: 'QA ve test',
    start: '2017-01-06',
    end: '2017-01-10',
    progress: 10,
    dependencies: '2',
  },
];

// 3. Konteyner oluşturun ve render edin
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Gantt şemasını başlatın
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Görünüm hassasiyeti: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'tr',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Başlangıç: ${task._start.toISOString().slice(0, 10)}</p>
        <p>Bitiş: ${task._end.toISOString().slice(0, 10)}</p>
        <p>İlerleme: ${task.progress}%</p>
      </div>
    `;
  },
});
```

### @asseinfo/react-kanban Örneği

Bir blok içinde Backlog ve Doing gibi sütunlar içeren temel bir Kanban panosu render etmek için `@asseinfo/react-kanban` kullanır.

```ts
// 1. Stilleri yükleyin (ctx.importAsync doğrudan .css yükler)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. React, react-dom, @asseinfo/react-kanban yükleyin (?deps aynı React örneğini sağlar)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Kart ekle', description: 'Bir sütuna kart ekleme yeteneği ekle' },
      ],
    },
    {
      id: 2,
      title: 'Yapılıyor',
      cards: [
        { id: 2, title: 'Sürükle-bırak desteği', description: 'Sütunlar arasında bir kartı taşı' },
      ],
    },
  ],
};

// 4. Panoyu bağlayın
ctx.render(<Board initialBoard={board} />);
```

## Notlar

- Bu özellik harici bir ağa veya CDN'e bağlıdır. Dahili ağ ortamlarında, **ESM_CDN_BASE_URL** kendi barındırdığınız bir servise işaret edecek şekilde yapılandırılmalıdır.
- Bir kütüphane hem ESM hem de UMD sunuyorsa, daha iyi modül semantiği için `ctx.importAsync()` işlevini tercih edin.
- React'e bağımlı kütüphaneler için `?deps=react@18.2.0,react-dom@18.2.0` eklediğinizden emin olun. Versiyon, sayfa tarafından kullanılan React versiyonuyla eşleşmelidir; aksi takdirde "Invalid hook call" hatası oluşabilir.

## İlgili

- [ctx.requireAsync()](./require-async.md): ECharts ve FullCalendar gibi UMD kütüphaneleri için uygun olan UMD/AMD veya global olarak eklenen betikleri yükleyin.
- [ctx.render()](./render.md): İçeriği bir konteynere render edin.