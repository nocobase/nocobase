# ctx.importAsync()

Динамически загружает **ESM-модули** или **CSS** по URL; применим во всех сценариях RunJS. Для сторонних ESM используйте `ctx.importAsync()`, для UMD/AMD — `ctx.requireAsync()`. URL с `.css` загружает и внедряет стили.

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **JS-блок** | Загрузка Vue, ECharts, Tabulator и т. д. для пользовательских графиков, таблиц, досок |
| **Поле JS / Элемент JS / JS-столбец таблицы** | Загрузка небольших ESM-утилит (например, плагинов dayjs) для рендера |
| **Поток событий / события действий** | Подгрузка зависимостей перед выполнением логики |

## Тип

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `url` | `string` | URL ESM или CSS. Поддерживает сокращённую запись `<package>@<version>` или подпуть `<package>@<version>/<path>` (например, `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`) — разрешается через настроенный префикс CDN; также поддерживается полный URL. Для `.css` загружает и внедряет стили. Для библиотек, зависящих от React, добавляйте `?deps=react@18.2.0,react-dom@18.2.0`, чтобы использовать тот же экземпляр React. |

## Возвращаемое значение

- Объект пространства имён загруженного модуля (значение Promise).

## Формат URL

- **ESM и CSS**: помимо ESM можно загружать CSS (передайте URL с `.css`; стиль будет внедрён в страницу).
- **Сокращённая форма**: если не настроено иначе, используется префикс CDN **https://esm.sh**. Например, `vue@3.4.0` → `https://esm.sh/vue@3.4.0`.
- **?deps**: для библиотек, зависящих от React (например, `@dnd-kit/core`, `react-big-calendar`), добавляйте `?deps=react@18.2.0,react-dom@18.2.0`, чтобы избежать некорректного вызова хука из-за нескольких экземпляров React.
- **Развёрнутый локально CDN**: для интрасети или пользовательского сервиса задайте переменные:
  - **ESM_CDN_BASE_URL**: базовый URL ESM CDN (по умолчанию `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: необязательный суффикс (например, `/+esm` у jsDelivr)
  - Ссылка: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Сравнение с ctx.requireAsync()

- **ctx.importAsync()**: загружает **ESM**, возвращает пространство имён модуля; подходит для Vue, dayjs и т. д. (ESM-сборки).
- **ctx.requireAsync()**: загружает **UMD/AMD** или глобальные скрипты; подходит для ECharts, FullCalendar (UMD) и т. д. Если у библиотеки есть ESM, предпочтителен `ctx.importAsync()`.

## Примеры

### Базовое использование

Демонстрация самого простого способа динамической загрузки ESM-модулей и CSS по имени пакета или полному URL.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Эквивалентно загрузке из https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// С подпутем (например, плагин dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Полный URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Загрузка CSS и внедрение на страницу
```

### Пример ECharts

Использование ECharts для отрисовки графика обзора продаж с гистограммой и линейным графиком.

```ts
// 1. Динамическая загрузка модуля ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Создание контейнера для графика и рендеринг
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Инициализация экземпляра ECharts
const chart = echarts.init(chartEl);

// 4. Конфигурация графика
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

// 5. Установка опций и рендеринг графика
chart.setOption(option);

// 6. Опционально: Адаптивный размер
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Опционально: Слушатель событий
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Пример Tabulator

Демонстрация рендеринга таблицы данных с пагинацией и событиями клика по строке в блоке с использованием Tabulator.

```ts
// 1. Загрузка стилей Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Динамическая загрузка модуля Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Создание контейнера для таблицы и рендеринг
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Инициализация таблицы Tabulator
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

// 5. Опционально: Слушатель событий
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### Пример FullCalendar (ESM)

Показывает, как загрузить FullCalendar и его плагины через ESM и отрендерить базовый календарь с видом на месяц.

```ts
// 1. Динамическая загрузка основного модуля FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Динамическая загрузка плагина dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Создание контейнера для календаря и рендеринг
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Инициализация и рендеринг календаря
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

### Простой пример dnd-kit (Drag-and-Drop)

Использование `@dnd-kit/core` для реализации минимального примера перетаскивания блока (Box) в целевую область внутри блока.

```ts
// 1. Загрузка React, react-dom, @dnd-kit/core (?deps обеспечивает тот же экземпляр React во избежание Invalid hook call)
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

Этот пример опирается только на `@dnd-kit/core` для вызова уведомления при сбросе блока в определенную область, демонстрируя простейшее взаимодействие drag-and-drop с использованием `ctx.importAsync` и React в RunJS.

### Пример сортируемого списка dnd-kit

Реализует вертикальный сортируемый список с использованием core, sortable и utilities из dnd-kit.

```ts
// 1. Загрузка React и пакетов dnd-kit (?deps обеспечивает тот же экземпляр React)
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

// 2. Компонент SortableItem (должен быть внутри SortableContext)
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

// 3. App: DndContext + SortableContext + Обработчик завершения перетаскивания
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

// 4. Создание контейнера и монтирование React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Этот пример использует `@dnd-kit/core`, `@dnd-kit/sortable` и `@dnd-kit/utilities` для реализации сортируемого списка, который обновляет свой порядок и отображает сообщение "List reordered" после перетаскивания.

### Пример react-big-calendar

Рендерит компонент календаря с поддержкой отображения событий в текущем блоке, используя `react-big-calendar` и `date-fns` для локализации.

```tsx
// 1. Загрузка стилей (ctx.importAsync использует ctx.loadCSS для файлов .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Загрузка React, react-dom, react-big-calendar, date-fns и локали (обеспечивая тот же экземпляр React)
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

### Пример frappe-gantt

Использует `frappe-gantt` для рендеринга диаграммы Ганта, показывающей время начала/окончания задач и прогресс.

```ts
// 1. Динамическая загрузка стилей и конструктора Gantt
// Зависит от ESM_CDN_BASE_URL (по умолчанию https://esm.sh), можно использовать сокращенные пути
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Подготовка данных задач
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

// 3. Создание контейнера и рендеринг
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Инициализация диаграммы Ганта
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Гранулярность вида: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### Пример @asseinfo/react-kanban

Использует `@asseinfo/react-kanban` для рендеринга базовой канбан-доски с колонками, такими как Backlog и Doing, внутри блока.

```ts
// 1. Загрузка стилей (ctx.importAsync напрямую загружает .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Загрузка React, react-dom, @asseinfo/react-kanban (?deps обеспечивает тот же экземпляр React)
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

// 4. Монтирование доски
ctx.render(<Board initialBoard={board} />);
```

## Примечания

- Зависит от сети и CDN; для интрасети используйте собственный сервис через **ESM_CDN_BASE_URL**.
- Если библиотека имеет и ESM, и UMD сборки, предпочтителен `ctx.importAsync()` для более корректной модульной семантики.
- Для библиотек, зависящих от React, добавляйте `?deps=react@18.2.0,react-dom@18.2.0` (или версии вашего приложения), чтобы избежать некорректного вызова хука.

## Связанные материалы

- [ctx.requireAsync()](./require-async.md): загрузка UMD/AMD и глобальных скриптов; подходит для ECharts, FullCalendar (UMD)
- [ctx.render()](./render.md): рендер в контейнер