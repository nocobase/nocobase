:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/import-async).
:::

# ctx.importAsync()

Carrega dinamicamente **módulos ESM** ou **CSS** via URL, aplicável a vários cenários do RunJS. Use `ctx.importAsync()` quando bibliotecas ESM de terceiros forem necessárias, e `ctx.requireAsync()` para bibliotecas UMD/AMD; passar um endereço `.css` carregará e injetará os estilos na página.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | Carregar dinamicamente bibliotecas ESM como Vue, ECharts ou Tabulator para implementar gráficos, tabelas, painéis personalizados, etc. |
| **JSField / JSItem / JSColumn** | Carregar bibliotecas utilitárias ESM leves (ex: plugins do dayjs) para auxiliar na renderização. |
| **Fluxo de trabalho / Eventos de ação** | Carregar dependências sob demanda antes de executar a lógica de negócio. |

## Definição de tipo

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `url` | `string` | O endereço do módulo ESM ou CSS. Suporta a forma abreviada `<pacote>@<versão>` ou subcaminhos `<pacote>@<versão>/<caminho-do-arquivo>` (ex: `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), que serão concatenados com o prefixo do CDN de acordo com a configuração; URLs completas também são suportadas. Quando um arquivo `.css` é passado, ele será carregado e injetado como um estilo. Para bibliotecas que dependem do React, você pode adicionar `?deps=react@18.2.0,react-dom@18.2.0` para garantir que elas compartilhem a mesma instância do React com a página. |

## Valor de retorno

- Uma Promise que resolve para o objeto de namespace do módulo.

## Descrição do formato da URL

- **ESM e CSS**: Além de módulos ESM, o carregamento de CSS também é suportado (passe uma URL `.css` para carregá-la e injetá-la na página).
- **Formato Abreviado**: Por padrão, utiliza **https://esm.sh** como prefixo do CDN se não estiver configurado. Por exemplo, `vue@3.4.0` na verdade solicita `https://esm.sh/vue@3.4.0`.
- **?deps**: Bibliotecas que dependem do React (como `@dnd-kit/core`, `react-big-calendar`) devem adicionar `?deps=react@18.2.0,react-dom@18.2.0` para evitar conflitos com a instância do React da página, o que poderia levar a erros de "Invalid hook call".
- **CDN Próprio**: Você pode especificar uma rede interna ou serviço próprio através de variáveis de ambiente:
  - **ESM_CDN_BASE_URL**: URL base para o CDN ESM (padrão é `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Sufixo opcional (ex: `/+esm` para o jsDelivr).
  - Para serviços próprios, consulte: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Diferença de ctx.requireAsync()

- **ctx.importAsync()**: Carrega **módulos ESM** e retorna o namespace do módulo. Adequado para bibliotecas modernas (builds ESM como Vue, dayjs, etc.).
- **ctx.requireAsync()**: Carrega módulos **UMD/AMD** ou scripts que se anexam ao escopo global. Frequentemente usado para bibliotecas UMD como ECharts ou FullCalendar. Se uma biblioteca fornecer tanto ESM quanto UMD, `ctx.importAsync()` é preferível.

## Exemplos

### Uso básico

Demonstra o uso mais básico do carregamento dinâmico de módulos ESM e CSS por nome de pacote ou URL completa.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalente a carregar de https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Com subcaminho (ex: plugin do dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL completa

await ctx.importAsync('https://cdn.example.com/theme.css');
// Carrega o CSS e injeta na página
```

### Exemplo com ECharts

Usa o ECharts para desenhar um gráfico de visão geral de vendas com gráficos de barras e linhas.

```ts
// 1. Carrega dinamicamente o módulo ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Cria o contêiner do gráfico e renderiza
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Inicializa a instância do ECharts
const chart = echarts.init(chartEl);

// 4. Configura o gráfico
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

// 5. Define as opções e renderiza o gráfico
chart.setOption(option);

// 6. Opcional: Redimensionamento responsivo
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Opcional: Ouvinte de eventos
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Exemplo com Tabulator

Demonstra a renderização de uma tabela de dados com paginação e eventos de clique em linha em um bloco usando o Tabulator.

```ts
// 1. Carrega os estilos do Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Carrega dinamicamente o módulo Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Cria o contêiner da tabela e renderiza
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Inicializa a tabela Tabulator
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

// 5. Opcional: Ouvinte de eventos
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Exemplo com FullCalendar (ESM)

Mostra como carregar o FullCalendar e seus plugins via ESM e renderizar um calendário básico com visualização mensal.

```ts
// 1. Carrega dinamicamente o módulo core do FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Carrega dinamicamente o plugin dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Cria o contêiner do calendário e renderiza
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Inicializa e renderiza o calendário
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

### Exemplo simples de Drag-and-Drop com dnd-kit

Usa o `@dnd-kit/core` para implementar um exemplo mínimo de arrastar um Box para uma área de destino dentro de um bloco.

```ts
// 1. Carrega React, react-dom, @dnd-kit/core (?deps garante a mesma instância do React para evitar Invalid hook call)
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

// 2. Renderiza
ctx.render(<App />);
```

Este exemplo depende apenas do `@dnd-kit/core` para disparar uma notificação quando um Box é solto em uma área específica, demonstrando a interação de arrastar e soltar mais simples combinando `ctx.importAsync` + React no RunJS.

### Exemplo de lista ordenável com dnd-kit

Implementa uma lista ordenável vertical usando o core, sortable e utilities do dnd-kit.

```ts
// 1. Carrega o React e pacotes relacionados ao dnd-kit (?deps garante a mesma instância do React)
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

// 2. Componente SortableItem (deve estar dentro do SortableContext)
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

// 3. App: DndContext + SortableContext + Manipulador de fim de arrasto
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

// 4. Cria o contêiner e monta o React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Este exemplo utiliza `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities` para implementar uma lista ordenável que atualiza sua ordem e exibe uma mensagem "List reordered" após o arrasto.

### Exemplo com react-big-calendar

Renderiza um componente de calendário que suporta a exibição de eventos no bloco atual usando `react-big-calendar` e `date-fns` para localização.

```tsx
// 1. Carrega os estilos (ctx.importAsync usa ctx.loadCSS para arquivos .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Carrega React, react-dom, react-big-calendar, date-fns e locale (garantindo a mesma instância do React)
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

// 3. Renderiza o Calendário React
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

### Exemplo com frappe-gantt

Usa o `frappe-gantt` para renderizar uma visualização de gráfico de Gantt mostrando os horários de início/fim das tarefas e o progresso.

```ts
// 1. Carrega dinamicamente os estilos e o construtor do Gantt
// Depende de ESM_CDN_BASE_URL (padrão https://esm.sh), caminhos abreviados podem ser usados
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Prepara os dados das tarefas
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

// 3. Cria o contêiner e renderiza
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Inicializa o gráfico de Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granularidade da visualização: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### Exemplo com @asseinfo/react-kanban

Utiliza o `@asseinfo/react-kanban` para renderizar um quadro Kanban básico com colunas como Backlog e Doing dentro de um bloco.

```ts
// 1. Carrega os estilos (ctx.importAsync carrega diretamente o .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Carrega React, react-dom, @asseinfo/react-kanban (?deps garante a mesma instância do React)
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

// 4. Monta o quadro
ctx.render(<Board initialBoard={board} />);
```

## Observações

- Esta funcionalidade depende de uma rede externa ou CDN. Em ambientes de rede interna, o **ESM_CDN_BASE_URL** deve ser configurado para apontar para um serviço próprio.
- Quando uma biblioteca oferece tanto ESM quanto UMD, prefira `ctx.importAsync()` para obter uma melhor semântica de módulos.
- Para bibliotecas que dependem do React, certifique-se de adicionar `?deps=react@18.2.0,react-dom@18.2.0`. A versão deve corresponder à versão do React usada pela página, caso contrário, um erro "Invalid hook call" pode ocorrer.

## Relacionado

- [ctx.requireAsync()](./require-async.md): Carrega scripts UMD/AMD ou globais, adequado para bibliotecas UMD como ECharts e FullCalendar.
- [ctx.render()](./render.md): Renderiza conteúdo em um contêiner.