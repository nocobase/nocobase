:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/import-async).
:::

# ctx.importAsync()

Carga dinámicamente **módulos ESM** o **CSS** mediante una URL, aplicable a diversos escenarios de RunJS. Utilice `ctx.importAsync()` cuando se requieran librerías ESM de terceros, y `ctx.requireAsync()` para librerías UMD/AMD; al pasar una dirección `.css`, se cargará e inyectará el estilo en la página.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock** | Carga dinámicamente librerías ESM como Vue, ECharts o Tabulator para implementar gráficos, tablas o tableros personalizados, etc. |
| **JSField / JSItem / JSColumn** | Carga librerías de utilidades ESM ligeras (por ejemplo, plugins de dayjs) para asistir en el renderizado. |
| **Flujo de trabajo / Eventos de acción** | Carga dependencias bajo demanda antes de ejecutar la lógica de negocio. |

## Definición de tipo

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parámetros

| Parámetro | Tipo | Descripción |
|------|------|------|
| `url` | `string` | La dirección del módulo ESM o CSS. Admite el formato abreviado `<paquete>@<versión>` o subrutas `<paquete>@<versión>/<ruta-al-archivo>` (por ejemplo, `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), que se concatenarán con el prefijo CDN según la configuración; también admite URLs completas. Al pasar un archivo `.css`, se cargará e inyectará como estilo. Para librerías que dependen de React, puede añadir `?deps=react@18.2.0,react-dom@18.2.0` para asegurar que compartan la misma instancia de React con la página. |

## Valor de retorno

- Una Promesa que se resuelve con el objeto de espacio de nombres (namespace) del módulo.

## Descripción del formato de URL

- **ESM y CSS**: Además de los módulos ESM, también se admite la carga de CSS (pase una URL `.css` para cargarla e inyectarla en la página).
- **Formato abreviado**: Si no se configura, se utiliza **https://esm.sh** como prefijo CDN predeterminado. Por ejemplo, `vue@3.4.0` solicita en realidad `https://esm.sh/vue@3.4.0`.
- **?deps**: Las librerías que dependen de React (como `@dnd-kit/core`, `react-big-calendar`) deben añadir `?deps=react@18.2.0,react-dom@18.2.0` para evitar conflictos con la instancia de React de la página, lo que podría causar errores de "Invalid hook call".
- **CDN propio**: Puede especificar una red interna o un servicio autohospedado mediante variables de entorno:
  - **ESM_CDN_BASE_URL**: Dirección base del CDN ESM (por defecto `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Sufijo opcional (por ejemplo, `/+esm` para jsDelivr).
  - Para servicios autohospedados, consulte: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Diferencia con ctx.requireAsync()

- **ctx.importAsync()**: Carga **módulos ESM** y devuelve el espacio de nombres del módulo. Es adecuado para librerías modernas (compilaciones ESM como Vue, dayjs, etc.).
- **ctx.requireAsync()**: Carga módulos **UMD/AMD** o scripts que se adjuntan al ámbito global. Se utiliza frecuentemente para librerías UMD como ECharts o FullCalendar. Si una librería ofrece tanto ESM como UMD, se prefiere `ctx.importAsync()`.

## Ejemplos

### Uso básico

Demuestra el uso más básico de la carga dinámica de módulos ESM y CSS mediante el nombre del paquete o una URL completa.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalente a cargar desde https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Con subruta (por ejemplo, plugin de dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL completa

await ctx.importAsync('https://cdn.example.com/theme.css');
// Carga CSS e inyecta en la página
```

### Ejemplo de ECharts

Utiliza ECharts para dibujar un gráfico de resumen de ventas con diagramas de barras y líneas.

```ts
// 1. Cargar dinámicamente el módulo ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Crear el contenedor del gráfico y renderizar
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inicializar la instancia de ECharts
const chart = echarts.init(chartEl);

// 4. Configurar el gráfico
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

// 5. Establecer la configuración y renderizar el gráfico
chart.setOption(option);

// 6. Opcional: Ajuste de tamaño adaptativo
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Opcional: Escucha de eventos
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Ejemplo de Tabulator

Muestra cómo renderizar una tabla de datos con paginación y eventos de clic en filas dentro de un bloque usando Tabulator.

```ts
// 1. Cargar los estilos de Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Cargar dinámicamente el módulo Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Crear el contenedor de la tabla y renderizar
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Inicializar la tabla Tabulator
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

// 5. Opcional: Escucha de eventos
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Ejemplo de FullCalendar (ESM)

Muestra cómo cargar FullCalendar y sus plugins mediante ESM y renderizar un calendario básico con vista mensual.

```ts
// 1. Cargar dinámicamente el módulo core de FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Cargar dinámicamente el plugin dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Crear el contenedor del calendario y renderizar
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inicializar y renderizar el calendario
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

### Ejemplo simple de arrastrar y soltar con dnd-kit

Utiliza `@dnd-kit/core` para implementar un ejemplo mínimo de arrastrar una caja (Box) a un área de destino dentro de un bloque.

```ts
// 1. Cargar React, react-dom, @dnd-kit/core (?deps asegura la misma instancia de React para evitar Invalid hook call)
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

// 2. Renderizar
ctx.render(<App />);
```

Este ejemplo depende únicamente de `@dnd-kit/core` para activar una notificación cuando se suelta una caja en un área específica, demostrando la interacción más sencilla de arrastrar y soltar combinando `ctx.importAsync` y React en RunJS.

### Ejemplo de lista ordenable con dnd-kit

Implementa una lista de ordenación vertical utilizando core, sortable y utilities de dnd-kit.

```ts
// 1. Cargar React y paquetes relacionados con dnd-kit (?deps asegura la misma instancia de React)
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

// 2. Componente SortableItem (debe estar dentro de SortableContext)
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

// 3. App: DndContext + SortableContext + Manejador de fin de arrastre
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

// 4. Crear contenedor y montar React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Este ejemplo utiliza `@dnd-kit/core`, `@dnd-kit/sortable` y `@dnd-kit/utilities` para implementar una lista ordenable que actualiza su orden y muestra el mensaje "List reordered" después de arrastrar.

### Ejemplo de react-big-calendar

Renderiza un componente de calendario que admite la visualización de eventos en el bloque actual utilizando `react-big-calendar` y `date-fns` para la localización.

```tsx
// 1. Cargar estilos (ctx.importAsync utiliza ctx.loadCSS para archivos .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Cargar React, react-dom, react-big-calendar, date-fns y locale (asegurando la misma instancia de React)
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

// 3. Renderizar el calendario de React
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

### Ejemplo de frappe-gantt

Utiliza `frappe-gantt` para renderizar una vista de gráfico de Gantt que muestra los tiempos de inicio/fin y el progreso de las tareas.

```ts
// 1. Cargar dinámicamente los estilos y el constructor de Gantt
// Depende de ESM_CDN_BASE_URL (por defecto https://esm.sh), se pueden usar rutas abreviadas
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Preparar los datos de las tareas
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

// 3. Crear el contenedor y renderizar
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inicializar el gráfico de Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granularidad de la vista: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### Ejemplo de @asseinfo/react-kanban

Utiliza `@asseinfo/react-kanban` para renderizar un tablero Kanban básico con columnas como Backlog y Doing dentro de un bloque.

```ts
// 1. Cargar estilos (ctx.importAsync carga directamente .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Cargar React, react-dom, @asseinfo/react-kanban (?deps asegura la misma instancia de React)
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

// 4. Montar el tablero
ctx.render(<Board initialBoard={board} />);
```

## Notas

- Esta funcionalidad depende de una red externa o CDN. En entornos de red interna, se debe configurar **ESM_CDN_BASE_URL** para que apunte a un servicio autohospedado.
- Cuando una librería proporcione tanto ESM como UMD, prefiera `ctx.importAsync()` para obtener una mejor semántica de módulos.
- Para librerías que dependan de React, asegúrese de añadir `?deps=react@18.2.0,react-dom@18.2.0`. La versión debe coincidir con la versión de React utilizada por la página; de lo contrario, puede producirse un error de "Invalid hook call".

## Relacionado

- [ctx.requireAsync()](./require-async.md): Carga módulos UMD/AMD o scripts adjuntos globalmente, adecuado para librerías UMD como ECharts y FullCalendar.
- [ctx.render()](./render.md): Renderiza contenido en un contenedor.