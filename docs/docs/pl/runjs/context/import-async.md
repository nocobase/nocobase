:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/import-async).
:::

# ctx.importAsync()

Dynamicznie ładuje **moduły ESM** lub **CSS** za pomocą adresu URL, co ma zastosowanie w różnych scenariuszach RunJS. Należy używać `ctx.importAsync()`, gdy wymagane są biblioteki ESM innych firm, oraz `ctx.requireAsync()` dla bibliotek UMD/AMD. Przekazanie adresu `.css` spowoduje załadowanie i wstrzyknięcie stylów do strony.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock** | Dynamiczne ładowanie bibliotek ESM, takich jak Vue, ECharts czy Tabulator, w celu implementacji niestandardowych wykresów, tabel, pulpitów nawigacyjnych itp. |
| **JSField / JSItem / JSColumn** | Ładowanie lekkich bibliotek narzędziowych ESM (np. wtyczek dayjs) wspomagających renderowanie. |
| **Przepływ pracy / Zdarzenia operacji** | Ładowanie zależności na żądanie przed wykonaniem logiki biznesowej. |

## Definicja typu

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parametry

| Parametr | Typ | Opis |
|------|------|------|
| `url` | `string` | Adres modułu ESM lub pliku CSS. Obsługuje skrócony zapis `<nazwa-pakietu>@<wersja>` lub ścieżki podrzędne `<nazwa-pakietu>@<wersja>/<ścieżka-do-pliku>` (np. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), które zostaną połączone z prefiksem CDN zgodnie z konfiguracją. Obsługiwane są również pełne adresy URL. W przypadku przekazania pliku `.css`, zostanie on załadowany i wstrzyknięty jako styl. Dla bibliotek zależnych od React można dodać `?deps=react@18.2.0,react-dom@18.2.0`, aby upewnić się, że współdzielą one tę samą instancję React ze stroną. |

## Wartość zwracana

- Obiekt przestrzeni nazw modułu (rozwiązana wartość Promise).

## Opis formatu URL

- **ESM i CSS**: Oprócz modułów ESM obsługiwane jest ładowanie CSS (należy podać adres URL `.css`, aby załadować i wstrzyknąć go do strony).
- **Format skrócony**: Jeśli nie skonfigurowano inaczej, domyślnie używany jest **https://esm.sh** jako prefiks CDN. Na przykład `vue@3.4.0` faktycznie wysyła żądanie do `https://esm.sh/vue@3.4.0`.
- **?deps**: Biblioteki zależne od React (takie jak `@dnd-kit/core`, `react-big-calendar`) powinny zawierać dopisek `?deps=react@18.2.0,react-dom@18.2.0`, aby uniknąć konfliktów z instancją React na stronie, co mogłoby prowadzić do błędów "Invalid hook call".
- **Własny CDN**: Można określić sieć wewnętrzną lub własną usługę za pomocą zmiennych środowiskowych:
  - **ESM_CDN_BASE_URL**: Podstawowy adres URL dla ESM CDN (domyślnie `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Opcjonalny sufiks (np. `/+esm` dla jsDelivr).
  - W przypadku własnych usług należy zapoznać się z: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Różnica między ctx.importAsync() a ctx.requireAsync()

- **ctx.importAsync()**: Ładuje **moduły ESM** i zwraca przestrzeń nazw modułu. Odpowiedni dla nowoczesnych bibliotek (kompilacje ESM, takie jak Vue, dayjs itp.).
- **ctx.requireAsync()**: Ładuje moduły **UMD/AMD** lub skrypty dołączane do zakresu globalnego. Często używane dla bibliotek UMD, takich jak ECharts lub FullCalendar. Jeśli biblioteka udostępnia zarówno ESM, jak i UMD, preferowane jest użycie `ctx.importAsync()`.

## Przykłady

### Podstawowe użycie

Demonstruje najbardziej podstawowe użycie dynamicznego ładowania modułów ESM i CSS według nazwy pakietu lub pełnego adresu URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Równoważne ładowaniu z https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Ze ścieżką podrzędną (np. wtyczka dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Pełny adres URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Ładuje CSS i wstrzykuje do strony
```

### Przykład ECharts

Użycie ECharts do narysowania wykresu przeglądu sprzedaży z wykresami słupkowymi i liniowymi.

```ts
// 1. Dynamiczne ładowanie modułu ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Tworzenie kontenera wykresu i renderowanie
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inicjalizacja instancji ECharts
const chart = echarts.init(chartEl);

// 4. Konfiguracja wykresu
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

// 5. Ustawienie opcji i renderowanie wykresu
chart.setOption(option);

// 6. Opcjonalnie: Responsywne dopasowanie rozmiaru
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Opcjonalnie: Nasłuchiwanie zdarzeń
chart.on('click', (params) => {
  ctx.message.info(`Kliknięto ${params.seriesName} w ${params.name}, wartość: ${params.value}`);
});
```

### Przykład Tabulator

Demonstruje renderowanie tabeli danych z paginacją i zdarzeniami kliknięcia wiersza w bloku przy użyciu biblioteki Tabulator.

```ts
// 1. Ładowanie stylów Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Dynamiczne ładowanie modułu Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Tworzenie kontenera tabeli i renderowanie
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Inicjalizacja tabeli Tabulator
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Warszawa' },
    { id: 2, name: 'Bob', age: 30, city: 'Kraków' },
    { id: 3, name: 'Charlie', age: 28, city: 'Gdańsk' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'Imię', field: 'name', width: 150 },
    { title: 'Wiek', field: 'age', width: 100 },
    { title: 'Miasto', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. Opcjonalnie: Nasłuchiwanie zdarzeń
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Kliknięto wiersz: ${rowData.name}`);
});
```

### Przykład FullCalendar (ESM)

Pokazuje, jak załadować FullCalendar i jego wtyczki przez ESM oraz wyrenderować podstawowy widok kalendarza miesięcznego.

```ts
// 1. Dynamiczne ładowanie modułu rdzenia FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Dynamiczne ładowanie wtyczki dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Tworzenie kontenera kalendarza i renderowanie
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inicjalizacja i renderowanie kalendarza
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

### Prosty przykład przeciągnij i upuść (dnd-kit)

Używa `@dnd-kit/core` do zaimplementowania minimalnego przykładu przeciągania pudełka (Box) do obszaru docelowego wewnątrz bloku.

```ts
// 1. Ładowanie React, react-dom, @dnd-kit/core (?deps zapewnia tę samą instancję React, aby uniknąć Invalid hook call)
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
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Przeciągnij mnie');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Upuść tutaj',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Upuszczono w strefie');
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

// 2. Renderowanie
ctx.render(<App />);
```

### Przykład listy sortowalnej dnd-kit

Implementuje pionową listę sortowalną przy użyciu rdzenia dnd-kit, modułu sortable i narzędzi utilities.

```ts
// 1. Ładowanie React i pakietów powiązanych z dnd-kit (?deps zapewnia tę samą instancję React)
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

// 2. Komponent SortableItem (musi znajdować się wewnątrz SortableContext)
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

// 3. App: DndContext + SortableContext + obsługa zakończenia przeciągania
const labels = { 1: 'Pierwszy', 2: 'Drugi', 3: 'Trzeci', 4: 'Czwarty' };
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
      ctx.message.success('Zmieniono kolejność listy');
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

// 4. Tworzenie kontenera i montowanie React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

### Przykład react-big-calendar

Renderuje komponent kalendarza obsługujący wyświetlanie zdarzeń w bieżącym bloku przy użyciu `react-big-calendar` i `date-fns` do lokalizacji.

```tsx
// 1. Ładowanie stylów (ctx.importAsync używa ctx.loadCSS dla plików .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Ładowanie React, react-dom, react-big-calendar, date-fns i locale (zapewniając tę samą instancję React)
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
  { title: 'Wydarzenie całodniowe', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Spotkanie', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. Renderowanie kalendarza React
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

### Przykład frappe-gantt

Używa `frappe-gantt` do renderowania widoku wykresu Gantta pokazującego czas rozpoczęcia/zakończenia zadań oraz postęp.

```ts
// 1. Dynamiczne ładowanie stylów i konstruktora Gantt
// Zależy od ESM_CDN_BASE_URL (domyślnie https://esm.sh), można używać skróconych ścieżek
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Przygotowanie danych zadań
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

// 3. Tworzenie kontenera i renderowanie
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inicjalizacja wykresu Gantta
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granulacja widoku: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### Przykład @asseinfo/react-kanban

Wykorzystuje `@asseinfo/react-kanban` do wyrenderowania podstawowej tablicy Kanban z kolumnami takimi jak Backlog i Doing wewnątrz bloku.

```ts
// 1. Ładowanie stylów (ctx.importAsync bezpośrednio ładuje .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Ładowanie React, react-dom, @asseinfo/react-kanban (?deps zapewnia tę samą instancję React)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Dodaj kartę', description: 'Dodaj możliwość dodawania karty w kolumnie' },
      ],
    },
    {
      id: 2,
      title: 'W toku',
      cards: [
        { id: 2, title: 'Obsługa przeciągnij i upuść', description: 'Przenoszenie karty między kolumnami' },
      ],
    },
  ],
};

// 4. Montowanie tablicy
ctx.render(<Board initialBoard={board} />);
```

## Uwagi

- Funkcja ta zależy od sieci zewnętrznej lub CDN. W środowiskach sieci wewnętrznej należy skonfigurować **ESM_CDN_BASE_URL**, aby wskazywał na własną usługę.
- Gdy biblioteka udostępnia zarówno ESM, jak i UMD, należy preferować `ctx.importAsync()` dla lepszej semantyki modułów.
- W przypadku bibliotek zależnych od React należy pamiętać o dodaniu `?deps=react@18.2.0,react-dom@18.2.0`. Wersja musi być zgodna z wersją React używaną na stronie, w przeciwnym razie może wystąpić błąd "Invalid hook call".

## Powiązane

- [ctx.requireAsync()](./require-async.md): Ładowanie skryptów UMD/AMD lub skryptów dołączanych globalnie, odpowiednie dla bibliotek UMD, takich jak ECharts i FullCalendar.
- [ctx.render()](./render.md): Renderowanie zawartości do kontenera.