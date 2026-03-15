:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/import-async)을 참조하세요.
:::

# ctx.importAsync()

URL을 통해 **ESM 모듈** 또는 **CSS**를 동적으로 로드하며, RunJS의 다양한 시나리오에 적용됩니다. 제3자 ESM 라이브러리가 필요할 때는 `ctx.importAsync()`를 사용하고, UMD/AMD 라이브러리는 `ctx.requireAsync()`를 사용합니다. `.css` 주소를 전달하면 스타일을 로드하고 페이지에 주입합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | Vue, ECharts, Tabulator 등 ESM 라이브러리를 동적으로 로드하여 사용자 정의 차트, 테이블, 대시보드 등을 구현합니다. |
| **JSField / JSItem / JSColumn** | 렌더링을 보조하기 위해 가벼운 ESM 유틸리티 라이브러리(예: dayjs 플러그인)를 로드합니다. |
| **워크플로우 / 조작 이벤트** | 비즈니스 로직을 실행하기 전 필요에 따라 의존성을 로드합니다. |

## 타입 정의

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## 매개변수

| 매개변수 | 타입 | 설명 |
|------|------|------|
| `url` | `string` | ESM 모듈 또는 CSS 주소입니다. `<패키지명>@<버전>` 또는 하위 경로를 포함한 `<패키지명>@<버전>/<파일 경로>`(예: `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`)와 같은 약식 표기를 지원하며, 설정에 따라 CDN 접두사가 붙습니다. 전체 URL도 지원합니다. `.css`를 전달하면 스타일을 로드하고 주입합니다. React에 의존하는 라이브러리는 `?deps=react@18.2.0,react-dom@18.2.0`을 추가하여 페이지와 동일한 React 인스턴스를 공유하도록 할 수 있습니다. |

## 반환값

- 해석된 모듈 네임스페이스 객체(Promise 결과값).

## URL 형식 설명

- **ESM 및 CSS**: ESM 모듈 외에도 CSS 로드를 지원합니다(`.css` URL 전달 시 로드 후 페이지에 주입).
- **약식 형식**: 별도로 설정하지 않은 경우 **https://esm.sh**를 CDN 접두사로 사용합니다. 예를 들어 `vue@3.4.0`은 실제로 `https://esm.sh/vue@3.4.0`을 요청합니다.
- **?deps**: React에 의존하는 라이브러리(예: `@dnd-kit/core`, `react-big-calendar`)는 페이지의 React 인스턴스와 충돌하여 발생하는 Invalid hook call 오류를 방지하기 위해 `?deps=react@18.2.0,react-dom@18.2.0`을 추가해야 합니다.
- **자체 구축 CDN**: 환경 변수를 통해 사내망 또는 자체 구축 서비스를 지정할 수 있습니다.
  - **ESM_CDN_BASE_URL**: ESM CDN 기본 주소 (기본값 `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: 선택적 접미사 (예: jsDelivr의 `/+esm`)
  - 자체 구축 서비스는 다음을 참고하십시오: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## ctx.requireAsync()와의 차이점

- **ctx.importAsync()**: **ESM 모듈**을 로드하고 모듈 네임스페이스를 반환합니다. 현대적인 라이브러리(Vue, dayjs 등 ESM 빌드)에 적합합니다.
- **ctx.requireAsync()**: **UMD/AMD** 또는 전역 스코프에 할당되는 스크립트를 로드합니다. 주로 ECharts, FullCalendar 등 UMD 라이브러리에 사용됩니다. 라이브러리가 ESM을 함께 제공한다면 `ctx.importAsync()`를 우선 사용하십시오.

## 예시

### 기초 사용법

패키지 이름 또는 전체 URL을 사용하여 ESM 모듈과 CSS를 동적으로 로드하는 가장 기본적인 방법을 보여줍니다.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0 에서 로드하는 것과 동일합니다.

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// 하위 경로가 포함된 경우 (예: dayjs 플러그인)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// 전체 URL 사용

await ctx.importAsync('https://cdn.example.com/theme.css');
// CSS를 로드하고 페이지에 주입합니다.
```

### ECharts 예시

ECharts를 사용하여 막대 그래프와 꺾은선 그래프가 포함된 판매 개요 차트를 그립니다.

```ts
// 1. ECharts 모듈 동적 로드
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. 차트 컨테이너 생성 및 렌더링
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. ECharts 인스턴스 초기화
const chart = echarts.init(chartEl);

// 4. 차트 설정
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

// 5. 설정 적용 및 차트 렌더링
chart.setOption(option);

// 6. 선택 사항: 반응형 크기 조절
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. 선택 사항: 이벤트 리스너
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator 예시

Tabulator를 사용하여 블록 내에 페이지네이션과 행 클릭 이벤트가 지원되는 데이터 테이블을 렌더링합니다.

```ts
// 1. Tabulator 스타일 로드
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Tabulator 모듈 동적 로드
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. 테이블 컨테이너 생성 및 렌더링
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Tabulator 테이블 초기화
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Seoul' },
    { id: 2, name: 'Bob', age: 30, city: 'Busan' },
    { id: 3, name: 'Charlie', age: 28, city: 'Incheon' },
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

// 5. 선택 사항: 이벤트 리스너
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) 예시

ESM 방식으로 FullCalendar와 관련 플러그인을 로드하여 기본적인 월간 뷰 달력을 렌더링합니다.

```ts
// 1. FullCalendar core 모듈 동적 로드
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. dayGrid 플러그인 동적 로드
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. 달력 컨테이너 생성 및 렌더링
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. 달력 초기화 및 렌더링
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

### dnd-kit 간단한 드래그 앤 드롭 예시

`@dnd-kit/core`를 사용하여 블록 내에서 Box를 대상 영역으로 드래그하는 최소한의 예시를 구현합니다.

```ts
// 1. React, react-dom, @dnd-kit/core 로드 (?deps를 통해 페이지와 동일한 React 인스턴스 보장)
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

// 2. 렌더링
ctx.render(<App />);
```

이 예시는 `@dnd-kit/core`에만 의존하며, Box를 특정 영역에 드래그했을 때 알림을 발생시킵니다. RunJS에서 `ctx.importAsync`와 React를 결합하여 간단한 드래그 앤 드롭 상호작용을 구현하는 방법을 보여줍니다.

### dnd-kit 정렬 가능 목록 예시

dnd-kit의 core, sortable, utilities를 사용하여 드래그 앤 드롭으로 순서를 변경할 수 있는 수직 목록을 구현합니다.

```ts
// 1. React 및 dnd-kit 관련 패키지 로드 (?deps 보장)
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

// 2. SortableItem 컴포넌트 (SortableContext 내부에 있어야 함)
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

// 3. App: DndContext + SortableContext + 드래그 종료 처리
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

// 4. 컨테이너 생성 및 React 마운트
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

이 예시는 `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`를 기반으로 드래그 정렬이 가능한 목록을 구현하며, 정렬이 완료되면 순서를 업데이트하고 "List reordered" 메시지를 표시합니다.

### react-big-calendar 예시

`react-big-calendar`와 `date-fns` 현지화를 통해 현재 블록에 이벤트 표시가 가능한 달력 컴포넌트를 렌더링합니다.

```tsx
// 1. 스타일 로드 (ctx.importAsync는 .css 확장자를 만나면 ctx.loadCSS를 실행합니다)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. React, react-dom, react-big-calendar, date-fns 및 locale 로드 (동일 React 인스턴스 보장)
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

// 3. React 달력 렌더링
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

### frappe-gantt 예시

`frappe-gantt`를 사용하여 작업의 시작/종료 시간과 진행률을 보여주는 간트 차트 뷰를 렌더링합니다.

```ts
// 1. 간트 차트 스타일 및 생성자 동적 로드
// ESM_CDN_BASE_URL(기본값 https://esm.sh)에 의존하며, 약식 경로를 사용할 수 있습니다.
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. 작업 데이터 준비
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

// 3. 컨테이너 생성 및 렌더링
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Gantt 차트 초기화
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // 뷰 모드: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban 예시

`@asseinfo/react-kanban`을 사용하여 블록 내에 Backlog, Doing 등의 열이 포함된 기본 칸반 보드를 렌더링합니다.

```ts
// 1. 스타일 로드 (ctx.importAsync는 .css를 직접 로드합니다)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. React, react-dom, @asseinfo/react-kanban 로드 (?deps 보장)
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

// 4. 보드 마운트
ctx.render(<Board initialBoard={board} />);
```

## 주의사항

- 외부 네트워크 또는 CDN에 의존합니다. 폐쇄망 환경에서는 **ESM_CDN_BASE_URL**이 사내 구축 서비스를 가리키도록 설정해야 합니다.
- 라이브러리가 ESM과 UMD를 동시에 제공하는 경우, 더 나은 모듈 시맨틱을 위해 `ctx.importAsync()`를 우선 사용하십시오.
- React에 의존하는 라이브러리는 반드시 `?deps=react@18.2.0,react-dom@18.2.0`을 추가해야 하며, 버전은 페이지의 React 버전과 일치해야 합니다. 그렇지 않으면 Invalid hook call 오류가 발생할 수 있습니다.

## 관련 문서

- [ctx.requireAsync()](./require-async.md): UMD/AMD 또는 전역 스크립트를 로드하며, ECharts, FullCalendar 등 UMD 라이브러리에 적합합니다.
- [ctx.render()](./render.md): 컨테이너에 내용을 렌더링합니다.