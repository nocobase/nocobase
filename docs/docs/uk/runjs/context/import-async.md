:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/import-async).
:::

# ctx.importAsync()

Динамічно завантажуйте **ESM-модулі** або **CSS** за URL-адресою, що підходить для різних сценаріїв RunJS. Використовуйте `ctx.importAsync()`, коли потрібні сторонні ESM-бібліотеки, та `ctx.requireAsync()` для UMD/AMD бібліотек; передача адреси `.css` завантажить та впровадить стилі на сторінку.

## Сценарії застосування

| Сценарій | Опис |
|------|------|
| **JSBlock** | Динамічне завантаження ESM-бібліотек, таких як Vue, ECharts або Tabulator, для реалізації користувацьких діаграм, таблиць, дашбордів тощо. |
| **JSField / JSItem / JSColumn** | Завантаження легких допоміжних ESM-бібліотек (наприклад, плагінів dayjs) для допомоги в рендерингу. |
| **Робочий процес / Події дій** | Завантаження залежностей за запитом перед виконанням бізнес-логіки. |

## Визначення типу

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Параметри

| Параметр | Тип | Опис |
|------|------|------|
| `url` | `string` | Адреса ESM-модуля або CSS. Підтримує скорочений запис `<назва_пакета>@<версія>` або підшляхи `<назва_пакета>@<версія>/<шлях_до_файлу>` (наприклад, `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), які будуть об'єднані з префіксом CDN відповідно до конфігурації; також підтримуються повні URL-адреси. При передачі `.css` стилі будуть завантажені та впроваджені на сторінку. Для бібліотек, що залежать від React, можна додати `?deps=react@18.2.0,react-dom@18.2.0`, щоб переконатися, що вони використовують той самий екземпляр React, що й сторінка. |

## Значення, що повертається

- Об'єкт простору імен модуля (результат виконання Promise).

## Опис формату URL

- **ESM та CSS**: Окрім ESM-модулів, також підтримується завантаження CSS (передайте URL-адресу `.css`, щоб завантажити та впровадити її на сторінку).
- **Скорочений формат**: За замовчуванням використовується **https://esm.sh** як префікс CDN, якщо інше не налаштовано. Наприклад, `vue@3.4.0` фактично запитує `https://esm.sh/vue@3.4.0`.
- **?deps**: Бібліотеки, що залежать від React (такі як `@dnd-kit/core`, `react-big-calendar`), повинні додавати `?deps=react@18.2.0,react-dom@18.2.0`, щоб уникнути конфліктів з екземпляром React на сторінці, що може призвести до помилок "Invalid hook call".
- **Власний CDN**: Ви можете вказати внутрішню мережу або власний сервіс за допомогою змінних оточення:
  - **ESM_CDN_BASE_URL**: Базова URL-адреса для ESM CDN (за замовчуванням `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Необов'язковий суфікс (наприклад, `/+esm` для jsDelivr).
  - Для власних сервісів зверніться до: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Відмінність від ctx.requireAsync()

- **ctx.importAsync()**: Завантажує **ESM-модулі** та повертає простір імен модуля. Підходить для сучасних бібліотек (ESM-збірки, такі як Vue, dayjs тощо).
- **ctx.requireAsync()**: Завантажує модулі **UMD/AMD** або скрипти, що прикріплюються до глобальної області видимості. Часто використовується для UMD-бібліотек, таких як ECharts або FullCalendar. Якщо бібліотека надає як ESM, так і UMD, перевага надається `ctx.importAsync()`.

## Приклади

### Базове використання

Демонструє найпростіше використання динамічного завантаження ESM-модулів та CSS за назвою пакета або повною URL-адресою.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Еквівалентно завантаженню з https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// З підшляхом (наприклад, плагін dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Повна URL-адреса

await ctx.importAsync('https://cdn.example.com/theme.css');
// Завантаження CSS та впровадження на сторінку
```

### Приклад ECharts

Використання ECharts для малювання діаграми огляду продажів зі стовпчиковим та лінійним графіками.

```ts
// 1. Динамічне завантаження модуля ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Створення контейнера для діаграми та рендеринг
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Ініціалізація екземпляра ECharts
const chart = echarts.init(chartEl);

// 4. Конфігурація діаграми
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

// 5. Встановлення параметрів та рендеринг діаграми
chart.setOption(option);

// 6. Опціонально: Адаптивний розмір
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Опціонально: Слухач подій
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Приклад Tabulator

Демонстрація рендерингу таблиці даних з пагінацією та подіями натискання на рядок у блоці за допомогою Tabulator.

```ts
// 1. Завантаження стилів Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Динамічне завантаження модуля Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Створення контейнера таблиці та рендеринг
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Ініціалізація таблиці Tabulator
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Kyiv' },
    { id: 2, name: 'Bob', age: 30, city: 'Lviv' },
    { id: 3, name: 'Charlie', age: 28, city: 'Odesa' },
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

// 5. Опціонально: Слухач подій
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Приклад FullCalendar (ESM)

Показує, як завантажити FullCalendar та його плагіни через ESM і відрендерити базовий календар з місячним виглядом.

```ts
// 1. Динамічне завантаження основного модуля FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Динамічне завантаження плагіна dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Створення контейнера календаря та рендеринг
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Ініціалізація та рендеринг календаря
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

### Простий приклад перетягування (Drag-and-Drop) dnd-kit

Використовує `@dnd-kit/core` для реалізації мінімального прикладу перетягування Box у цільову область всередині блоку.

```ts
// 1. Завантаження React, react-dom, @dnd-kit/core (?deps забезпечує той самий екземпляр React, щоб уникнути Invalid hook call)
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

// 2. Рендеринг
ctx.render(<App />);
```

Цей приклад покладається лише на `@dnd-kit/core` для запуску сповіщення, коли Box перетягується в певну область, демонструючи найпростішу взаємодію перетягування, поєднуючи `ctx.importAsync` та React у RunJS.

### Приклад списку з можливістю сортування dnd-kit

Реалізує вертикальний список із можливістю сортування за допомогою core, sortable та utilities від dnd-kit.

```ts
// 1. Завантаження React та пов'язаних пакетів dnd-kit (?deps забезпечує той самий екземпляр React)
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

// 2. Компонент SortableItem (повинен бути всередині SortableContext)
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

// 3. App: DndContext + SortableContext + Обробник завершення перетягування
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

// 4. Створення контейнера та монтування React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Цей приклад використовує `@dnd-kit/core`, `@dnd-kit/sortable` та `@dnd-kit/utilities` для реалізації списку з можливістю сортування, який оновлює свій порядок і відображає повідомлення "List reordered" після перетягування.

### Приклад react-big-calendar

Рендерить компонент календаря з підтримкою відображення подій у поточному блоці, використовуючи `react-big-calendar` та `date-fns` для локалізації.

```tsx
// 1. Завантаження стилів (ctx.importAsync використовує ctx.loadCSS для файлів .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Завантаження React, react-dom, react-big-calendar, date-fns та локалі (забезпечуючи той самий екземпляр React)
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

// 3. Рендеринг React-календаря
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

### Приклад frappe-gantt

Використовує `frappe-gantt` для рендерингу діаграми Ганта, що показує час початку/завершення завдань та прогрес.

```ts
// 1. Динамічне завантаження стилів та конструктора Ганта
// Залежить від ESM_CDN_BASE_URL (за замовчуванням https://esm.sh), можна використовувати скорочені шляхи
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Підготовка даних завдань
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

// 3. Створення контейнера та рендеринг
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Ініціалізація діаграми Ганта
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Гранулярність вигляду: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### Приклад @asseinfo/react-kanban

Використовує `@asseinfo/react-kanban` для рендерингу базової дошки Канбан зі стовпцями, такими як Backlog та Doing, всередині блоку.

```ts
// 1. Завантаження стилів (ctx.importAsync безпосередньо завантажує .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Завантаження React, react-dom, @asseinfo/react-kanban (?deps забезпечує той самий екземпляр React)
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

// 4. Монтування дошки
ctx.render(<Board initialBoard={board} />);
```

## Примітки

- Ця функція залежить від зовнішньої мережі або CDN. У середовищах внутрішньої мережі необхідно налаштувати **ESM_CDN_BASE_URL**, щоб він вказував на власний сервіс.
- Якщо бібліотека надає як ESM, так і UMD, використовуйте `ctx.importAsync()` для кращої семантики модулів.
- Для бібліотек, що залежать від React, обов'язково додавайте `?deps=react@18.2.0,react-dom@18.2.0`. Версія повинна збігатися з версією React, що використовується на сторінці, інакше може виникнути помилка "Invalid hook call".

## Пов'язане

- [ctx.requireAsync()](./require-async.md): Завантаження UMD/AMD або глобальних скриптів, підходить для UMD-бібліотек, таких як ECharts та FullCalendar.
- [ctx.render()](./render.md): Рендеринг вмісту в контейнер.