:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/import-async).
:::

# ctx.importAsync()

Ladda **ESM-moduler** eller **CSS** dynamiskt via URL, tillämpligt för olika RunJS-scenarier. Använd `ctx.importAsync()` när ESM-bibliotek från tredje part krävs, och `ctx.requireAsync()` för UMD/AMD-bibliotek. Om en `.css`-adress skickas med kommer stilar att laddas och injiceras på sidan.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | Ladda ESM-bibliotek som Vue, ECharts eller Tabulator dynamiskt för att implementera anpassade diagram, tabeller, instrumentpaneler etc. |
| **JSField / JSItem / JSColumn** | Ladda lätta ESM-verktygsbibliotek (t.ex. dayjs-plugins) för att underlätta rendering. |
| **Arbetsflöde / Åtgärdshändelser** | Ladda beroenden vid behov innan affärslogik körs. |

## Typdefinition

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parametrar

| Parameter | Typ | Beskrivning |
|------|------|------|
| `url` | `string` | Adressen till ESM-modulen eller CSS. Stöder kortformat `<paket>@<version>` eller underliggande sökvägar `<paket>@<version>/<filsökväg>` (t.ex. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), vilka kommer att sammanfogas med CDN-prefixet enligt konfigurationen. Fullständiga URL:er stöds också. När en `.css`-fil skickas med kommer den att laddas och injiceras som en stil. För bibliotek som är beroende av React kan ni lägga till `?deps=react@18.2.0,react-dom@18.2.0` för att säkerställa att de delar samma React-instans som sidan. |

## Returvärde

- Ett Promise som returnerar modulens namnrymdsobjekt.

## Beskrivning av URL-format

- **ESM och CSS**: Förutom ESM-moduler stöds även laddning av CSS (skicka en `.css`-URL för att ladda och injicera den på sidan).
- **Kortformat**: Som standard används **https://esm.sh** som CDN-prefix om inget annat konfigurerats. Till exempel innebär `vue@3.4.0` i praktiken en begäran till `https://esm.sh/vue@3.4.0`.
- **?deps**: Bibliotek som är beroende av React (som `@dnd-kit/core`, `react-big-calendar`) bör lägga till `?deps=react@18.2.0,react-dom@18.2.0` för att undvika konflikter med sidans React-instans, vilket annars kan leda till "Invalid hook call"-fel.
- **Egenvärdad CDN**: Ni kan ange ett internt nätverk eller en egenvärdad tjänst via miljövariabler:
  - **ESM_CDN_BASE_URL**: Bas-URL för ESM CDN (standard är `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Valfritt suffix (t.ex. `/+esm` för jsDelivr).
  - För egenvärdade tjänster, se: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Skillnad från ctx.requireAsync()

- **ctx.importAsync()**: Läser in **ESM-moduler** och returnerar modulens namnrymd. Lämplig för moderna bibliotek (ESM-byggen som Vue, dayjs etc.).
- **ctx.requireAsync()**: Läser in **UMD/AMD**-moduler eller skript som fäster sig vid det globala scopet. Används ofta för UMD-bibliotek som ECharts eller FullCalendar. Om ett bibliotek tillhandahåller både ESM och UMD föredras `ctx.importAsync()`.

## Exempel

### Grundläggande användning

Demonstrerar den mest grundläggande användningen för att dynamiskt ladda ESM-moduler och CSS via paketnamn eller fullständig URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Motsvarar laddning från https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Med undersökväg (t.ex. dayjs-plugin)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Fullständig URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Ladda CSS och injicera på sidan
```

### ECharts-exempel

Använd ECharts för att rita ett försäljningsöversiktsdiagram med stapel- och linjediagram.

```ts
// 1. Ladda ECharts-modulen dynamiskt
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Skapa diagrambehållare och rendera
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Initiera ECharts-instans
const chart = echarts.init(chartEl);

// 4. Konfigurera diagrammet
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

// 5. Ställ in alternativ och rendera diagrammet
chart.setOption(option);

// 6. Valfritt: Responsiv storleksändring
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Valfritt: Händelselyssnare
chart.on('click', (params) => {
  ctx.message.info(`Klickade på ${params.seriesName} för ${params.name}, värde: ${params.value}`);
});
```

### Tabulator-exempel

Demonstrerar rendering av en datatabell med paginering och radklickshändelser i ett block med hjälp av Tabulator.

```ts
// 1. Ladda Tabulator-stilar
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Ladda Tabulator-modulen dynamiskt
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Skapa tabellbehållare och rendera
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Initiera Tabulator-tabell
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Stockholm' },
    { id: 2, name: 'Bob', age: 30, city: 'Göteborg' },
    { id: 3, name: 'Charlie', age: 28, city: 'Malmö' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'Namn', field: 'name', width: 150 },
    { title: 'Ålder', field: 'age', width: 100 },
    { title: 'Stad', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. Valfritt: Händelselyssnare
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Rad klickad: ${rowData.name}`);
});
```

### FullCalendar (ESM)-exempel

Visar hur man laddar FullCalendar och dess plugins via ESM och renderar en grundläggande månadsvy.

```ts
// 1. Ladda FullCalendar core-modul dynamiskt
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Ladda dayGrid-plugin dynamiskt
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Skapa kalenderbehållare och rendera
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Initiera och rendera kalendern
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

### dnd-kit enkelt drag-och-släpp-exempel

Använder `@dnd-kit/core` för att implementera ett minimalt exempel på att dra en box till ett målområde i ett block.

```ts
// 1. Ladda React, react-dom, @dnd-kit/core (?deps säkerställer samma React-instans för att undvika Invalid hook call)
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
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Dra mig');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Släpp här',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Släppt i zonen');
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

// 2. Rendera
ctx.render(<App />);
```

Detta exempel förlitar sig enbart på `@dnd-kit/core` för att utlösa ett meddelande när en box släpps i ett specifikt område, vilket demonstrerar den enklaste drag-och-släpp-interaktionen genom att kombinera `ctx.importAsync` och React i RunJS.

### dnd-kit sorterbar list-exempel

Implementerar en vertikal sorterbar lista med dnd-kits core, sortable och utilities.

```ts
// 1. Ladda React och dnd-kit-relaterade paket (?deps säkerställer samma React-instans)
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

// 2. SortableItem-komponent (måste vara inuti SortableContext)
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

// 3. App: DndContext + SortableContext + Hantering av drag-slut
const labels = { 1: 'Första', 2: 'Andra', 3: 'Tredje', 4: 'Fjärde' };
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
      ctx.message.success('Listan har sorterats om');
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

// 4. Skapa behållare och montera React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Detta exempel använder `@dnd-kit/core`, `@dnd-kit/sortable` och `@dnd-kit/utilities` för att implementera en sorterbar lista som uppdaterar sin ordning och visar meddelandet "Listan har sorterats om" efter dragning.

### react-big-calendar-exempel

Renderar en kalenderkomponent med stöd för händelsevisning i det aktuella blocket med hjälp av `react-big-calendar` och `date-fns` för lokalisering.

```tsx
// 1. Ladda stilar (ctx.importAsync använder ctx.loadCSS för .css-filer)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Ladda React, react-dom, react-big-calendar, date-fns och språk (säkerställer samma React-instans)
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
  { title: 'Heldagshändelse', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Möte', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. Rendera React-kalender
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

### frappe-gantt-exempel

Använder `frappe-gantt` för att rendera en Gantt-schema-vy som visar uppgifters start-/sluttider och framsteg.

```ts
// 1. Ladda Gantt-stilar och konstruktor dynamiskt
// Beror på ESM_CDN_BASE_URL (standard https://esm.sh), kortformatssökvägar kan användas
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Förbered uppgiftsdata
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

// 3. Skapa behållare och rendera
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Initiera Gantt-schema
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Vy-granularitet: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'en',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Start: ${task._start.toISOString().slice(0, 10)}</p>
        <p>Slut: ${task._end.toISOString().slice(0, 10)}</p>
        <p>Framsteg: ${task.progress}%</p>
      </div>
    `;
  },
});
```

### @asseinfo/react-kanban-exempel

Använder `@asseinfo/react-kanban` för att rendera en grundläggande Kanban-tavla med kolumner som Backlog och Doing i ett block.

```ts
// 1. Ladda stilar (ctx.importAsync laddar .css direkt)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Ladda React, react-dom, @asseinfo/react-kanban (?deps säkerställer samma React-instans)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Lägg till kort', description: 'Lägg till funktionalitet för att lägga till kort i en kolumn' },
      ],
    },
    {
      id: 2,
      title: 'Doing',
      cards: [
        { id: 2, title: 'Stöd för drag-och-släpp', description: 'Flytta ett kort mellan kolumnerna' },
      ],
    },
  ],
};

// 4. Montera tavlan
ctx.render(<Board initialBoard={board} />);
```

## Anteckningar

- Denna funktion är beroende av ett externt nätverk eller CDN. I miljöer med internt nätverk måste **ESM_CDN_BASE_URL** konfigureras för att peka på en egenvärdad tjänst.
- När ett bibliotek tillhandahåller både ESM och UMD, föredra `ctx.importAsync()` för bättre modulsemantik.
- För bibliotek som är beroende av React, se till att lägga till `?deps=react@18.2.0,react-dom@18.2.0`. Versionen måste matcha den React-version som används på sidan, annars kan ett "Invalid hook call"-fel uppstå.

## Relaterat

- [ctx.requireAsync()](./require-async.md): Ladda UMD/AMD eller globalt fästa skript, lämpligt för UMD-bibliotek som ECharts och FullCalendar.
- [ctx.render()](./render.md): Rendera innehåll i en behållare.