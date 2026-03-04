:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/import-async).
:::

# ctx.importAsync()

Dynamicky načítá **ESM moduly** nebo **CSS** pomocí URL, což je vhodné pro různé scénáře RunJS. Pokud potřebujete externí ESM knihovny, použijte `ctx.importAsync()`; pro knihovny typu UMD/AMD použijte `ctx.requireAsync()`. Předání adresy s příponou `.css` načte a vloží styly do stránky.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock** | Dynamické načítání ESM knihoven jako Vue, ECharts nebo Tabulator pro implementaci vlastních grafů, tabulek, nástěnek atd. |
| **JSField / JSItem / JSColumn** | Načítání lehkých ESM nástrojových knihoven (např. pluginy dayjs) pro pomoc při vykreslování. |
| **Pracovní postup / Akce událostí** | Načítání závislostí podle potřeby před provedením obchodní logiky. |

## Definice typu

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parametry

| Parametr | Typ | Popis |
|------|------|------|
| `url` | `string` | Adresa ESM modulu nebo CSS. Podporuje zkrácený zápis `<balíček>@<verze>` nebo podcesty `<balíček>@<verze>/<cesta-k-souboru>` (např. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), které budou spojeny s předponou CDN podle konfigurace. Podporovány jsou i úplné URL adresy. Při předání `.css` dojde k načtení a vložení stylu. U knihoven závislých na Reactu můžete přidat `?deps=react@18.2.0,react-dom@18.2.0`, aby bylo zajištěno sdílení stejné instance Reactu se stránkou. |

## Návratová hodnota

- Promise, která se vyřeší na objekt jmenného prostoru modulu (module namespace object).

## Popis formátu URL

- **ESM a CSS**: Kromě ESM modulů je podporováno i načítání CSS (předejte URL končící `.css`, po načtení bude vloženo do stránky).
- **Zkrácený formát**: Pokud není nakonfigurováno jinak, jako výchozí předpona CDN se používá **https://esm.sh**. Například `vue@3.4.0` skutečně vyžádá `https://esm.sh/vue@3.4.0`.
- **?deps**: Knihovny závislé na Reactu (jako `@dnd-kit/core`, `react-big-calendar`) by měly obsahovat `?deps=react@18.2.0,react-dom@18.2.0`, aby se předešlo konfliktům s instancí Reactu na stránce, což by mohlo vést k chybám "Invalid hook call".
- **Vlastní CDN**: Prostřednictvím proměnných prostředí můžete specifikovat interní síť nebo vlastní službu:
  - **ESM_CDN_BASE_URL**: Základní URL pro ESM CDN (výchozí je `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Volitelná přípona (např. `/+esm` pro jsDelivr).
  - Pro vlastní služby viz: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Rozdíl oproti ctx.requireAsync()

- **ctx.importAsync()**: Načítá **ESM moduly** a vrací jmenný prostor modulu. Vhodné pro moderní knihovny (ESM sestavení jako Vue, dayjs atd.).
- **ctx.requireAsync()**: Načítá **UMD/AMD** moduly nebo skripty, které se připojují ke globálnímu rozsahu. Často se používá pro UMD knihovny jako ECharts nebo FullCalendar. Pokud knihovna poskytuje ESM i UMD, upřednostňuje se `ctx.importAsync()`.

## Příklady

### Základní použití

Ukázka nejzákladnějšího použití dynamického načítání ESM modulů a CSS podle názvu balíčku nebo úplné URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Ekvivalentní načítání z https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// S podcestou (např. plugin dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Úplná URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Načtení CSS a vložení do stránky
```

### Příklad ECharts

Použití ECharts k vykreslení grafu přehledu prodejů se sloupcovým a spojnicovým grafem.

```ts
// 1. Dynamické načtení modulu ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Vytvoření kontejneru pro graf a vykreslení
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inicializace instance ECharts
const chart = echarts.init(chartEl);

// 4. Konfigurace grafu
const option = {
  title: {
    text: 'Přehled prodejů',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['Prodeje', 'Zisk'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Prodeje',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: 'Zisk',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. Nastavení možností a vykreslení grafu
chart.setOption(option);

// 6. Volitelné: Responzivní změna velikosti
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Volitelné: Naslouchání událostem
chart.on('click', (params) => {
  ctx.message.info(`Kliknuto na ${params.seriesName} v ${params.name}, hodnota: ${params.value}`);
});
```

### Příklad Tabulator

Ukázka vykreslení datové tabulky s podporou stránkování a událostí kliknutí na řádek v bloku pomocí knihovny Tabulator.

```ts
// 1. Načtení stylů Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Dynamické načtení modulu Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Vytvoření kontejneru pro tabulku a vykreslení
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Inicializace tabulky Tabulator
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Praha' },
    { id: 2, name: 'Bob', age: 30, city: 'Brno' },
    { id: 3, name: 'Charlie', age: 28, city: 'Ostrava' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'Jméno', field: 'name', width: 150 },
    { title: 'Věk', field: 'age', width: 100 },
    { title: 'Město', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. Volitelné: Naslouchání událostem
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Kliknuto na řádek: ${rowData.name}`);
});
```

### Příklad FullCalendar (ESM)

Ukázka načtení FullCalendar a jeho pluginů přes ESM a vykreslení základního měsíčního zobrazení kalendáře.

```ts
// 1. Dynamické načtení jádra FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Dynamické načtení pluginu dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Vytvoření kontejneru pro kalendář a vykreslení
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inicializace a vykreslení kalendáře
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

### dnd-kit: Jednoduchý příklad Drag-and-Drop

Použití `@dnd-kit/core` k implementaci minimálního příkladu přetažení Boxu do cílové oblasti v rámci bloku.

```ts
// 1. Načtení React, react-dom, @dnd-kit/core (?deps zajistí stejnou instanci Reactu pro zamezení Invalid hook call)
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
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Přetáhni mě');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Pusť to sem',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Puštěno v zóně');
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

// 2. Vykreslení
ctx.render(<App />);
```

Tento příklad spoléhá pouze na `@dnd-kit/core` ke spuštění oznámení, když je Box puštěn do specifické oblasti, což demonstruje nejjednodušší drag-and-drop interakci kombinující `ctx.importAsync` a React v RunJS.

### dnd-kit: Příklad řaditelného seznamu

Implementace vertikálního řaditelného seznamu pomocí dnd-kit core, sortable a utilities.

```ts
// 1. Načtení Reactu a balíčků souvisejících s dnd-kit (?deps zajistí stejnou instanci Reactu)
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

// 2. Komponenta SortableItem (musí být uvnitř SortableContext)
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

// 3. App: DndContext + SortableContext + obsluha konce přetažení
const labels = { 1: 'První', 2: 'Druhý', 3: 'Třetí', 4: 'Čtvrtý' };
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
      ctx.message.success('Seznam byl přerovnán');
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

// 4. Vytvoření kontejneru a připojení Reactu
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Tento příklad používá `@dnd-kit/core`, `@dnd-kit/sortable` a `@dnd-kit/utilities` k implementaci seznamu, který lze řadit přetažením, aktualizuje své pořadí a po dokončení zobrazí zprávu „Seznam byl přerovnán“.

### Příklad react-big-calendar

Vykreslení komponenty kalendáře s podporou zobrazení událostí v aktuálním bloku pomocí `react-big-calendar` a `date-fns` pro lokalizaci.

```tsx
// 1. Načtení stylů (ctx.importAsync používá ctx.loadCSS pro soubory .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Načtení React, react-dom, react-big-calendar, date-fns a locale (zajištění stejné instance Reactu)
const React = await ctx.importAsync('react@18.2.0');
const { Calendar, dateFnsLocalizer } = await ctx.importAsync('react-big-calendar@1.11.4?deps=react@18.2.0,react-dom@18.2.0');
const { format, parse, startOfWeek, getDay } = await ctx.importAsync('date-fns@2.30.0');
const cs = await ctx.importAsync('date-fns@2.30.0/locale/cs/index.js');

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'cs': cs },
});

const events = [
  { title: 'Celodenní událost', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Schůzka', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. Vykreslení React kalendáře
ctx.render(
  <Calendar
    localizer={localizer}
    events={events}
    startAccessor="start"
    endAccessor="end"
    style={{ height: '80vh' }}
    culture="cs"
  />
);
```

### Příklad frappe-gantt

Použití `frappe-gantt` k vykreslení Ganttova diagramu zobrazujícího časy zahájení/ukončení úkolů a jejich postup.

```ts
// 1. Dynamické načtení stylů a konstruktoru Gantt
// Závisí na ESM_CDN_BASE_URL (výchozí https://esm.sh), lze použít zkrácené cesty
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Příprava dat úkolů
let tasks = [
  {
    id: '1',
    name: 'Redesign webu',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20,
  },
  {
    id: '2',
    name: 'Vývoj nové funkce',
    start: '2017-01-01',
    end: '2017-01-05',
    progress: 40,
    dependencies: '1',
  },
  {
    id: '3',
    name: 'QA a testování',
    start: '2017-01-06',
    end: '2017-01-10',
    progress: 10,
    dependencies: '2',
  },
];

// 3. Vytvoření kontejneru a vykreslení
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inicializace Ganttova diagramu
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granularita zobrazení: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'cs',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Začátek: ${task._start.toISOString().slice(0, 10)}</p>
        <p>Konec: ${task._end.toISOString().slice(0, 10)}</p>
        <p>Postup: ${task.progress}%</p>
      </div>
    `;
  },
});
```

### Příklad @asseinfo/react-kanban

Využití `@asseinfo/react-kanban` k vykreslení základní nástěnky Kanban se sloupci jako Backlog a Doing v rámci bloku.

```ts
// 1. Načtení stylů (ctx.importAsync přímo načítá .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Načtení React, react-dom, @asseinfo/react-kanban (?deps zajistí stejnou instanci Reactu)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Přidat kartu', description: 'Přidat možnost přidání karty do sloupce' },
      ],
    },
    {
      id: 2,
      title: 'Rozpracováno',
      cards: [
        { id: 2, title: 'Podpora drag-n-drop', description: 'Přesun karty mezi sloupci' },
      ],
    },
  ],
};

// 4. Vykreslení nástěnky
ctx.render(<Board initialBoard={board} />);
```

## Poznámky

- Tato funkce závisí na externí síti nebo CDN. V prostředích s interní sítí musí být **ESM_CDN_BASE_URL** nakonfigurována tak, aby ukazovala na vlastní službu.
- Pokud knihovna poskytuje ESM i UMD, upřednostněte `ctx.importAsync()` pro lepší sémantiku modulů.
- U knihoven závislých na Reactu nezapomeňte přidat `?deps=react@18.2.0,react-dom@18.2.0`. Verze musí odpovídat verzi Reactu použité na stránce, jinak může dojít k chybě „Invalid hook call“.

## Související

- [ctx.requireAsync()](./require-async.md): Načítání UMD/AMD nebo globálně připojených skriptů, vhodné pro UMD knihovny jako ECharts a FullCalendar.
- [ctx.render()](./render.md): Vykreslení obsahu do kontejneru.