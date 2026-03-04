:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/import-async).
:::

# ctx.importAsync()

Carica dinamicamente **moduli ESM** o **CSS** tramite URL, applicabile a vari scenari RunJS. Utilizzi `ctx.importAsync()` quando sono richieste librerie ESM di terze parti e `ctx.requireAsync()` per librerie UMD/AMD; passando un indirizzo `.css` verranno caricati e iniettati gli stili nella pagina.

## Scenari applicativi

| Scenario | Descrizione |
|------|------|
| **JSBlock** | Caricamento dinamico di librerie ESM come Vue, ECharts o Tabulator per implementare grafici, tabelle, dashboard personalizzate, ecc. |
| **JSField / JSItem / JSColumn** | Caricamento di librerie di utilità ESM leggere (come i plugin di dayjs) per assistere nel rendering. |
| **Flusso di lavoro / Eventi azione** | Caricamento delle dipendenze su richiesta prima di eseguire la logica di business. |

## Definizione del tipo

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parametri

| Parametro | Tipo | Descrizione |
|------|------|------|
| `url` | `string` | L'indirizzo del modulo ESM o del CSS. Supporta la forma abbreviata `<pacchetto>@<versione>` o percorsi secondari `<pacchetto>@<versione>/<percorso-file>` (ad es. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), che verranno concatenati con il prefisso CDN in base alla configurazione; sono supportati anche URL completi. Quando viene passato un file `.css`, verrà caricato e iniettato come stile. Per le librerie che dipendono da React, è possibile aggiungere `?deps=react@18.2.0,react-dom@18.2.0` per garantire che condividano la stessa istanza React della pagina. |

## Valore di ritorno

- Un oggetto namespace del modulo risolto (valore risolto della Promise).

## Descrizione del formato URL

- **ESM e CSS**: Oltre ai moduli ESM, è supportato anche il caricamento di CSS (passando un URL `.css`, questo verrà caricato e iniettato nella pagina).
- **Formato abbreviato**: Se non configurato, viene utilizzato **https://esm.sh** come prefisso CDN. Ad esempio, `vue@3.4.0` richiede effettivamente `https://esm.sh/vue@3.4.0`.
- **?deps**: Le librerie che dipendono da React (come `@dnd-kit/core`, `react-big-calendar`) devono aggiungere `?deps=react@18.2.0,react-dom@18.2.0` per evitare conflitti con l'istanza React della pagina, che potrebbero causare errori di tipo "Invalid hook call".
- **CDN self-hosted**: È possibile specificare una rete interna o un servizio self-hosted tramite variabili d'ambiente:
  - **ESM_CDN_BASE_URL**: URL di base della CDN ESM (predefinito `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: Suffisso opzionale (come `/+esm` di jsDelivr)
  - Per i servizi self-hosted, consultare: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Differenza da ctx.requireAsync()

- **ctx.importAsync()**: Carica **moduli ESM** e restituisce il namespace del modulo, adatto per librerie moderne (build ESM come Vue, dayjs, ecc.).
- **ctx.requireAsync()**: Carica moduli **UMD/AMD** o script che si agganciano allo scope globale, spesso utilizzato per librerie UMD come ECharts o FullCalendar. Se una libreria fornisce sia ESM che UMD, è preferibile utilizzare `ctx.importAsync()`.

## Esempi

### Utilizzo di base

Dimostra l'utilizzo più semplice del caricamento dinamico di moduli ESM e CSS tramite nome del pacchetto o URL completo.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalente al caricamento da https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Con percorso secondario (ad es. plugin dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL completo

await ctx.importAsync('https://cdn.example.com/theme.css');
// Carica il CSS e lo inietta nella pagina
```

### Esempio ECharts

Utilizza ECharts per disegnare un grafico panoramica vendite con grafici a barre e a linee.

```ts
// 1. Caricamento dinamico del modulo ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Creazione del contenitore del grafico e rendering
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inizializzazione dell'istanza ECharts
const chart = echarts.init(chartEl);

// 4. Configurazione del grafico
const option = {
  title: {
    text: 'Panoramica delle vendite',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['Vendite', 'Profitto'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Vendite',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: 'Profitto',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. Impostazione della configurazione e rendering del grafico
chart.setOption(option);

// 6. Opzionale: Dimensionamento adattivo
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Opzionale: Ascolto degli eventi
chart.on('click', (params) => {
  ctx.message.info(`Cliccato su ${params.seriesName} in ${params.name}, valore: ${params.value}`);
});
```

### Esempio Tabulator

Dimostra il rendering di una tabella dati con paginazione ed eventi di clic sulle righe in un blocco utilizzando Tabulator.

```ts
// 1. Caricamento degli stili di Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Caricamento dinamico del modulo Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Creazione del contenitore della tabella e rendering
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Inizializzazione della tabella Tabulator
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Pechino' },
    { id: 2, name: 'Bob', age: 30, city: 'Shanghai' },
    { id: 3, name: 'Charlie', age: 28, city: 'Canton' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'Nome', field: 'name', width: 150 },
    { title: 'Età', field: 'age', width: 100 },
    { title: 'Città', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. Opzionale: Ascolto degli eventi
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Riga cliccata: ${rowData.name}`);
});
```

### Esempio FullCalendar (ESM)

Mostra come caricare FullCalendar e i suoi plugin in modalità ESM e renderizzare un calendario con vista mensile di base.

```ts
// 1. Caricamento dinamico del modulo core di FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Caricamento dinamico del plugin dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Creazione del contenitore del calendario e rendering
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inizializzazione e rendering del calendario
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

### Esempio dnd-kit Simple Drag-and-Drop

Utilizza `@dnd-kit/core` per implementare un esempio minimo di trascinamento di un Box in un'area di destinazione all'interno di un blocco.

```ts
// 1. Caricamento di React, react-dom, @dnd-kit/core (?deps garantisce la stessa istanza React della pagina per evitare Invalid hook call)
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
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Trascinami');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Rilascia qui',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Rilasciato nella zona');
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

// 2. Rendering
ctx.render(<App />);
```

Questo esempio dipende solo da `@dnd-kit/core` e attiva un avviso quando un Box viene trascinato in un'area specifica, dimostrando l'interazione di trascinamento più semplice combinando `ctx.importAsync` + React in RunJS.

### Esempio dnd-kit Sortable List

Implementa una lista ordinabile verticale che supporta il trascinamento basata su core / sortable / utilities di dnd-kit.

```ts
// 1. Caricamento di React e dei pacchetti relativi a dnd-kit (?deps garantisce la stessa istanza React)
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

// 2. Componente SortableItem (deve trovarsi all'interno di SortableContext)
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

// 3. App: DndContext + SortableContext + Gestione fine trascinamento
const labels = { 1: 'Primo', 2: 'Secondo', 3: 'Terzo', 4: 'Quarto' };
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
      ctx.message.success('Lista riordinata');
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

// 4. Creazione del contenitore e montaggio di React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Questo esempio, basato su `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities`, implementa una lista ordinabile tramite trascinamento, aggiornando l'ordine e mostrando il messaggio "Lista riordinata" al termine dell'operazione.

### Esempio react-big-calendar

Utilizza `react-big-calendar` con la localizzazione di `date-fns` per renderizzare un componente calendario che supporta la visualizzazione di eventi nel blocco corrente.

```tsx
// 1. Caricamento degli stili (ctx.importAsync utilizza ctx.loadCSS quando incontra .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Caricamento di React, react-dom, react-big-calendar, date-fns e locale (garantendo la stessa istanza React)
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
  { title: 'Evento tutto il giorno', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Riunione', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. Rendering del calendario React
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

### Esempio frappe-gantt

Utilizza `frappe-gantt` per renderizzare una vista diagramma di Gantt che mostra i tempi di inizio/fine delle attività e il progresso.

```ts
// 1. Caricamento dinamico dello stile e del costruttore di Gantt
// Dipende da ESM_CDN_BASE_URL (predefinito https://esm.sh), è possibile utilizzare percorsi abbreviati
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Preparazione dei dati delle attività
let tasks = [
  {
    id: '1',
    name: 'Riprogettazione sito web',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20,
  },
  {
    id: '2',
    name: 'Sviluppo nuova funzionalità',
    start: '2017-01-01',
    end: '2017-01-05',
    progress: 40,
    dependencies: '1',
  },
  {
    id: '3',
    name: 'QA e test',
    start: '2017-01-06',
    end: '2017-01-10',
    progress: 10,
    dependencies: '2',
  },
];

// 3. Creazione del contenitore e rendering
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inizializzazione del diagramma di Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granularità della vista: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'en',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Inizio: ${task._start.toISOString().slice(0, 10)}</p>
        <p>Fine: ${task._end.toISOString().slice(0, 10)}</p>
        <p>Progresso: ${task.progress}%</p>
      </div>
    `;
  },
});
```

### Esempio @asseinfo/react-kanban

Utilizza `@asseinfo/react-kanban` per renderizzare una bacheca Kanban di base con colonne come Backlog e Doing all'interno di un blocco.

```ts
// 1. Caricamento degli stili (ctx.importAsync carica direttamente il .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Caricamento di React, react-dom, @asseinfo/react-kanban (?deps garantisce la stessa istanza React)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Aggiungi scheda', description: 'Aggiungi la possibilità di inserire una scheda in una colonna' },
      ],
    },
    {
      id: 2,
      title: 'In corso',
      cards: [
        { id: 2, title: 'Supporto drag-n-drop', description: 'Sposta una scheda tra le colonne' },
      ],
    },
  ],
};

// 4. Montaggio della bacheca
ctx.render(<Board initialBoard={board} />);
```

## Note

- Questa funzionalità dipende da una rete esterna o da una CDN; in ambienti di rete interna, è necessario configurare **ESM_CDN_BASE_URL** in modo che punti a un servizio self-hosted.
- Quando una libreria fornisce sia ESM che UMD, preferisca `ctx.importAsync()` per ottenere una migliore semantica dei moduli.
- Per le librerie che dipendono da React, si assicuri di aggiungere `?deps=react@18.2.0,react-dom@18.2.0`; la versione deve corrispondere a quella di React utilizzata dalla pagina, altrimenti potrebbe verificarsi un errore "Invalid hook call".

## Correlati

- [ctx.requireAsync()](./require-async.md): Carica moduli UMD/AMD o script collegati globalmente, adatto per librerie UMD come ECharts e FullCalendar.
- [ctx.render()](./render.md): Renderizza il contenuto in un contenitore.