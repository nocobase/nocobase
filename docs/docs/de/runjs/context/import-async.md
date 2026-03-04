:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/import-async).
:::

# ctx.importAsync()

Lädt **ESM-Module** oder **CSS** dynamisch über eine URL, anwendbar in verschiedenen RunJS-Szenarien. Verwenden Sie `ctx.importAsync()`, wenn ESM-Bibliotheken von Drittanbietern erforderlich sind, und `ctx.requireAsync()` für UMD/AMD-Bibliotheken. Die Übergabe einer `.css`-Adresse lädt und injiziert die Stile in die Seite.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock** | Dynamisches Laden von ESM-Bibliotheken wie Vue, ECharts oder Tabulator zur Implementierung benutzerdefinierter Diagramme, Tabellen, Dashboards usw. |
| **JSField / JSItem / JSColumn** | Laden leichtgewichtiger ESM-Hilfsbibliotheken (z. B. dayjs-Plugins) zur Unterstützung beim Rendering. |
| **Workflow / Aktionsereignisse** | Bedarfsgerechtes Laden von Abhängigkeiten vor der Ausführung der Geschäftslogik. |

## Typdefinition

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parameter

| Parameter | Typ | Beschreibung |
|------|------|------|
| `url` | `string` | Die Adresse des ESM-Moduls oder der CSS-Datei. Unterstützt die Kurzschreibweise `<Paketname>@<Version>` oder Unterpfade `<Paketname>@<Version>/<Dateipfad>` (z. B. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), die gemäß der Konfiguration mit dem CDN-Präfix verkettet werden. Vollständige URLs werden ebenfalls unterstützt. Wenn eine `.css`-Datei übergeben wird, wird diese geladen und als Stil injiziert. Für Bibliotheken, die von React abhängen, können Sie `?deps=react@18.2.0,react-dom@18.2.0` anhängen, um sicherzustellen, dass sie dieselbe React-Instanz wie die Seite verwenden. |

## Rückgabewert

- Ein Promise, das zum Namespace-Objekt des Moduls aufgelöst wird.

## Beschreibung des URL-Formats

- **ESM und CSS**: Neben ESM-Modulen wird auch das Laden von CSS unterstützt (übergeben Sie eine `.css`-URL, um diese zu laden und in die Seite zu injizieren).
- **Kurzformat**: Standardmäßig wird **https://esm.sh** als CDN-Präfix verwendet, sofern nichts anderes konfiguriert ist. Beispielsweise fragt `vue@3.4.0` tatsächlich `https://esm.sh/vue@3.4.0` ab.
- **?deps**: Bibliotheken, die von React abhängen (wie `@dnd-kit/core`, `react-big-calendar`), sollten `?deps=react@18.2.0,react-dom@18.2.0` anhängen, um Konflikte mit der React-Instanz der Seite zu vermeiden, die zu Fehlern wie „Invalid hook call“ führen könnten.
- **Selbstgehostetes CDN**: Sie können ein internes Netzwerk oder einen selbstgehosteten Dienst über Umgebungsvariablen angeben:
  - **ESM_CDN_BASE_URL**: Die Basis-URL für das ESM-CDN (Standard ist `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Optionales Suffix (z. B. `/+esm` für jsDelivr).
  - Für selbstgehostete Dienste siehe: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Unterschied zu ctx.requireAsync()

- **ctx.importAsync()**: Lädt **ESM-Module** und gibt den Modul-Namespace zurück. Geeignet für moderne Bibliotheken (ESM-Builds wie Vue, dayjs usw.).
- **ctx.requireAsync()**: Lädt **UMD/AMD**-Module oder Skripte, die an den globalen Scope gebunden sind. Wird häufig für UMD-Bibliotheken wie ECharts oder FullCalendar verwendet. Wenn eine Bibliothek sowohl ESM als auch UMD anbietet, wird `ctx.importAsync()` bevorzugt.

## Beispiele

### Grundlegende Verwendung

Demonstriert die einfachste Verwendung des dynamischen Ladens von ESM-Modulen und CSS über den Paketnamen oder eine vollständige URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Entspricht dem Laden von https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Mit Unterpfad (z. B. dayjs-Plugin)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Vollständige URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// CSS laden und in die Seite injizieren
```

### ECharts-Beispiel

Verwendung von ECharts zum Zeichnen eines Verkaufsübersichtsdiagramms mit Balken- und Liniendiagrammen.

```ts
// 1. ECharts-Modul dynamisch laden
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Diagramm-Container erstellen und rendern
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. ECharts-Instanz initialisieren
const chart = echarts.init(chartEl);

// 4. Diagramm konfigurieren
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

// 5. Konfiguration setzen und Diagramm rendern
chart.setOption(option);

// 6. Optional: Responsive Größenanpassung
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Optional: Event-Listener
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator-Beispiel

Demonstriert das Rendern einer Datentabelle mit Paginierung und Zeilenklick-Ereignissen in einem Block unter Verwendung von Tabulator.

```ts
// 1. Tabulator-Stile laden
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Tabulator-Modul dynamisch laden
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Tabellen-Container erstellen und rendern
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Tabulator-Tabelle initialisieren
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

// 5. Optional: Event-Listener
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) Beispiel

Zeigt, wie FullCalendar und seine Plugins über ESM geladen und ein einfacher Kalender in der Monatsansicht gerendert werden.

```ts
// 1. FullCalendar Core-Modul dynamisch laden
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. dayGrid-Plugin dynamisch laden
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Kalender-Container erstellen und rendern
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Kalender initialisieren und rendern
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

### dnd-kit einfaches Drag-and-Drop-Beispiel

Verwendet `@dnd-kit/core`, um ein minimales Beispiel für das Ziehen einer Box in einen Zielbereich innerhalb eines Blocks zu implementieren.

```ts
// 1. React, react-dom, @dnd-kit/core laden (?deps stellt dieselbe React-Instanz sicher, um Invalid hook call zu vermeiden)
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

// 2. Rendern
ctx.render(<App />);
```

Dieses Beispiel basiert nur auf `@dnd-kit/core`, um eine Benachrichtigung auszulösen, wenn eine Box in einen bestimmten Bereich gezogen wird. Es demonstriert die einfachste Drag-and-Drop-Interaktion durch die Kombination von `ctx.importAsync` + React in RunJS.

### dnd-kit sortierbare Liste Beispiel

Implementiert eine vertikale sortierbare Liste unter Verwendung von dnd-kit Core, Sortable und Utilities.

```ts
// 1. React und dnd-kit-bezogene Pakete laden (?deps stellt dieselbe React-Instanz sicher)
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

// 2. SortableItem-Komponente (muss sich innerhalb von SortableContext befinden)
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

// 3. App: DndContext + SortableContext + Drag-End-Handler
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

// 4. Container erstellen und React einhängen
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Dieses Beispiel verwendet `@dnd-kit/core`, `@dnd-kit/sortable` und `@dnd-kit/utilities`, um eine sortierbare Liste zu implementieren, die ihre Reihenfolge aktualisiert und nach dem Ziehen die Meldung „List reordered“ anzeigt.

### react-big-calendar Beispiel

Rendert eine Kalenderkomponente mit Unterstützung für die Anzeige von Ereignissen im aktuellen Block unter Verwendung von `react-big-calendar` und `date-fns` für die Lokalisierung.

```tsx
// 1. Stile laden (ctx.importAsync verwendet ctx.loadCSS für .css-Dateien)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. React, react-dom, react-big-calendar, date-fns und Locale laden (dieselbe React-Instanz sicherstellen)
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

// 3. React-Kalender rendern
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

### frappe-gantt Beispiel

Verwendet `frappe-gantt`, um eine Gantt-Diagramm-Ansicht zu rendern, die Start-/Endzeiten und den Fortschritt von Aufgaben anzeigt.

```ts
// 1. Gantt-Stile und Konstruktor dynamisch laden
// Hängt von ESM_CDN_BASE_URL ab (Standard https://esm.sh), Kurzpfade können verwendet werden
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Aufgabendaten vorbereiten
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

// 3. Container erstellen und rendern
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Gantt-Diagramm initialisieren
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Ansichtsgranularität: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban Beispiel

Nutzt `@asseinfo/react-kanban`, um ein einfaches Kanban-Board mit Spalten wie Backlog und Doing innerhalb eines Blocks zu rendern.

```ts
// 1. Stile laden (ctx.importAsync lädt .css direkt)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. React, react-dom, @asseinfo/react-kanban laden (?deps stellt dieselbe React-Instanz sicher)
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

// 4. Board einhängen
ctx.render(<Board initialBoard={board} />);
```

## Hinweise

- Diese Funktion ist von einem externen Netzwerk oder CDN abhängig. In internen Netzwerkumgebungen muss **ESM_CDN_BASE_URL** so konfiguriert werden, dass sie auf einen selbstgehosteten Dienst zeigt.
- Wenn eine Bibliothek sowohl ESM als auch UMD anbietet, bevorzugen Sie `ctx.importAsync()` für eine bessere Modulsemantik.
- Für Bibliotheken, die von React abhängen, stellen Sie sicher, dass Sie `?deps=react@18.2.0,react-dom@18.2.0` anhängen. Die Version muss mit der von der Seite verwendeten React-Version übereinstimmen, da sonst ein „Invalid hook call“-Fehler auftreten kann.

## Verwandte Themen

- [ctx.requireAsync()](./require-async.md): Lädt UMD/AMD oder global gebundene Skripte, geeignet für UMD-Bibliotheken wie ECharts und FullCalendar.
- [ctx.render()](./render.md): Rendert Inhalte in einen Container.