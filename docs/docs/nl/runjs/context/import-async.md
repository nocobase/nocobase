:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/import-async) voor nauwkeurige informatie.
:::

# ctx.importAsync()

Laad dynamisch **ESM-modules** of **CSS** via een URL, toepasbaar in verschillende RunJS-scenario's. Gebruik `ctx.importAsync()` wanneer ESM-bibliotheken van derden vereist zijn, en `ctx.requireAsync()` voor UMD/AMD-bibliotheken. Het doorgeven van een `.css`-adres zal de stijlen laden en in de pagina injecteren.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | Dynamisch laden van ESM-bibliotheken zoals Vue, ECharts of Tabulator om aangepaste grafieken, tabellen, dashboards, enz. te implementeren. |
| **JSField / JSItem / JSColumn** | Laad lichtgewicht ESM-hulpprogramma's (bijv. dayjs-plugins) ter ondersteuning van de weergave. |
| **Gebeurtenisstroom / Actie-gebeurtenissen** | Laad afhankelijkheden op aanvraag voordat de bedrijfslogica wordt uitgevoerd. |

## Type-definitie

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Beschrijving |
|------|------|------|
| `url` | `string` | Het adres van de ESM-module of CSS. Ondersteunt verkorte notatie `<pakket>@<versie>` of subpaden `<pakket>@<versie>/<bestands-pad>` (bijv. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), die worden samengevoegd met het CDN-voorvoegsel volgens de configuratie. Volledige URL's worden ook ondersteund. Wanneer een `.css`-bestand wordt doorgegeven, wordt dit geladen en als stijl geïnjecteerd. Voor bibliotheken die afhankelijk zijn van React, kunt u `?deps=react@18.2.0,react-dom@18.2.0` toevoegen om ervoor te zorgen dat ze dezelfde React-instantie delen met de pagina. |

## Retourwaarde

- Een Promise die wordt opgelost naar het namespace-object van de module.

## Beschrijving URL-formaat

- **ESM en CSS**: Naast ESM-modules wordt ook het laden van CSS ondersteund (geef een `.css` URL door om deze te laden en in de pagina te injecteren).
- **Verkorte notatie**: Standaard wordt **https://esm.sh** gebruikt als CDN-voorvoegsel indien niet geconfigureerd. Bijvoorbeeld, `vue@3.4.0` vraagt feitelijk `https://esm.sh/vue@3.4.0` op.
- **?deps**: Bibliotheken die afhankelijk zijn van React (zoals `@dnd-kit/core`, `react-big-calendar`) moeten `?deps=react@18.2.0,react-dom@18.2.0` toevoegen om conflicten met de React-instantie van de pagina te voorkomen, wat kan leiden tot "Invalid hook call"-fouten.
- **Zelfgehoste CDN**: U kunt een intern netwerk of zelfgehoste service specificeren via omgevingsvariabelen:
  - **ESM_CDN_BASE_URL**: De basis-URL voor de ESM CDN (standaard is `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Optioneel achtervoegsel (bijv. `/+esm` voor jsDelivr).
  - Voor zelfgehoste services, zie: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Verschil met ctx.requireAsync()

- **ctx.importAsync()**: Laadt **ESM-modules** en retourneert de module-namespace. Geschikt voor moderne bibliotheken (ESM-builds zoals Vue, dayjs, enz.).
- **ctx.requireAsync()**: Laadt **UMD/AMD**-modules of scripts die aan de globale scope worden gekoppeld. Vaak gebruikt voor UMD-bibliotheken zoals ECharts of FullCalendar. Als een bibliotheek zowel ESM als UMD biedt, heeft `ctx.importAsync()` de voorkeur.

## Voorbeelden

### Basisgebruik

Demonstreert het meest eenvoudige gebruik van het dynamisch laden van ESM-modules en CSS via pakketnaam of volledige URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Gelijk aan laden van https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Met subpad (bijv. dayjs-plugin)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Volledige URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Laad CSS en injecteer in de pagina
```

### ECharts-voorbeeld

Gebruik ECharts om een verkoopoverzichtsgrafiek te tekenen met staaf- en lijngrafieken.

```ts
// 1. Laad dynamisch de ECharts-module
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Maak een grafiekcontainer en render deze
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Initialiseer de ECharts-instantie
const chart = echarts.init(chartEl);

// 4. Configureer de grafiek
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

// 5. Stel de opties in en render de grafiek
chart.setOption(option);

// 6. Optioneel: Responsieve afmetingen
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Optioneel: Event listener
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator-voorbeeld

Demonstreert het renderen van een gegevenstabel met paginering en rij-klikgebeurtenissen in een blok met behulp van Tabulator.

```ts
// 1. Laad Tabulator-stijlen
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Laad dynamisch de Tabulator-module
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Maak een tabelcontainer en render deze
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Initialiseer de Tabulator-tabel
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

// 5. Optioneel: Event listener
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) voorbeeld

Laat zien hoe u FullCalendar en zijn plugins via ESM laadt en een basiskalender met maandweergave rendert.

```ts
// 1. Laad dynamisch de FullCalendar core-module
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Laad dynamisch de dayGrid-plugin
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Maak een kalendercontainer en render deze
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Initialiseer en render de kalender
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

### dnd-kit Eenvoudig Sleep-en-neerzet-voorbeeld

Gebruikt `@dnd-kit/core` om een minimaal voorbeeld te implementeren van het slepen van een Box naar een doelgebied binnen een blok.

```ts
// 1. Laad React, react-dom, @dnd-kit/core (?deps zorgt voor dezelfde React-instantie om Invalid hook call te voorkomen)
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

// 2. Renderen
ctx.render(<App />);
```

Dit voorbeeld is alleen afhankelijk van `@dnd-kit/core` om een melding te activeren wanneer een Box in een specifiek gebied wordt neergezet, wat de eenvoudigste sleep-en-neerzet-interactie demonstreert door `ctx.importAsync` + React te combineren in RunJS.

### dnd-kit Sorteerbare Lijst voorbeeld

Implementeert een verticale sorteerbare lijst met behulp van de core, sortable en utilities van dnd-kit.

```ts
// 1. Laad React en dnd-kit gerelateerde pakketten (?deps zorgt voor dezelfde React-instantie)
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

// 2. SortableItem component (moet binnen SortableContext staan)
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

// 3. App: DndContext + SortableContext + Drag end handler
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

// 4. Maak container en koppel React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Dit voorbeeld gebruikt `@dnd-kit/core`, `@dnd-kit/sortable` en `@dnd-kit/utilities` om een sorteerbare lijst te implementeren die de volgorde bijwerkt en een melding "List reordered" toont na het slepen.

### react-big-calendar voorbeeld

Rendert een kalendercomponent die de weergave van evenementen ondersteunt in het huidige blok met behulp van `react-big-calendar` en `date-fns` voor lokalisatie.

```tsx
// 1. Laad stijlen (ctx.importAsync gebruikt ctx.loadCSS voor .css bestanden)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Laad React, react-dom, react-big-calendar, date-fns en locale (zorgt voor dezelfde React-instantie)
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

// 3. Render React Calendar
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

### frappe-gantt voorbeeld

Gebruikt `frappe-gantt` om een Gantt-diagramweergave te renderen die start-/eindtijden en voortgang van taken toont.

```ts
// 1. Laad dynamisch de Gantt-stijlen en constructor
// Afhankelijk van ESM_CDN_BASE_URL (standaard https://esm.sh), verkorte paden kunnen worden gebruikt
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Bereid taakgegevens voor
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

// 3. Maak container en render deze
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Initialiseer het Gantt-diagram
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Weergavegranulariteit: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban voorbeeld

Maakt gebruik van `@asseinfo/react-kanban` om een basis Kanban-bord te renderen met kolommen zoals Backlog en Doing binnen een blok.

```ts
// 1. Laad stijlen (ctx.importAsync laadt direct .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Laad React, react-dom, @asseinfo/react-kanban (?deps zorgt voor dezelfde React-instantie)
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

// 4. Koppel het bord
ctx.render(<Board initialBoard={board} />);
```

## Aandachtspunten

- Deze functie is afhankelijk van een extern netwerk of CDN. In interne netwerkomgevingen moet **ESM_CDN_BASE_URL** worden geconfigureerd om naar een zelfgehoste service te verwijzen.
- Wanneer een bibliotheek zowel ESM als UMD biedt, geef dan de voorkeur aan `ctx.importAsync()` voor betere module-semantiek.
- Voor bibliotheken die afhankelijk zijn van React, zorg ervoor dat u `?deps=react@18.2.0,react-dom@18.2.0` toevoegt. De versie moet overeenkomen met de React-versie die door de pagina wordt gebruikt, anders kan er een "Invalid hook call"-fout optreden.

## Gerelateerd

- [ctx.requireAsync()](./require-async.md): Laad UMD/AMD of globaal gekoppelde scripts, geschikt voor UMD-bibliotheken zoals ECharts en FullCalendar.
- [ctx.render()](./render.md): Inhoud renderen in een container.