:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/import-async)をご参照ください。
:::

# ctx.importAsync()

URL を指定して **ESM モジュール** または **CSS** を動的に読み込みます。RunJS の各シーンで利用可能です。サードパーティの ESM ライブラリが必要な場合は `ctx.importAsync()` を、UMD/AMD ライブラリの場合は `ctx.requireAsync()` を使用します。`.css` のアドレスを渡すと、スタイルが読み込まれ、ページに注入されます。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock** | Vue、ECharts、Tabulator などの ESM ライブラリを動的に読み込み、カスタムチャート、テーブル、ダッシュボードなどを実現します。 |
| **JSField / JSItem / JSColumn** | 軽量な ESM ユーティリティライブラリ（dayjs プラグインなど）を読み込み、レンダリングを補助します。 |
| **ワークフロー / 操作イベント** | 必要に応じて依存関係を読み込んでからロジックを実行します。 |

## 型定義

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## パラメータ

| パラメータ | 型 | 説明 |
|------|------|------|
| `url` | `string` | ESM モジュールまたは CSS のアドレス。`<パッケージ名>@<バージョン>` という短縮形式や、`<パッケージ名>@<バージョン>/<ファイルパス>`（例: `vue@3.4.0`、`dayjs@1/plugin/relativeTime.js`）のようなサブパス指定に対応しており、設定に基づいた CDN プレフィックスが結合されます。完全な URL もサポートしています。`.css` を渡すとスタイルが読み込まれ注入されます。React に依存するライブラリの場合、`?deps=react@18.2.0,react-dom@18.2.0` を追加することで、ページと同じ React インスタンスを共有できます。 |

## 返回値

- 解析されたモジュールの名前空間オブジェクト（Promise の解決値）。

## URL 形式の説明

- **ESM と CSS**: ESM モジュールに加えて、CSS の読み込みもサポートしています（`.css` の URL を渡すと、読み込み後にページへ注入されます）。
- **短縮形式**: 設定がない場合、デフォルトで **https://esm.sh** が CDN プレフィックスとして使用されます。例えば、`vue@3.4.0` は実際には `https://esm.sh/vue@3.4.0` をリクエストします。
- **?deps**: React に依存するライブラリ（`@dnd-kit/core`、`react-big-calendar` など）は、ページの React インスタンスとの競合による "Invalid hook call" を避けるため、`?deps=react@18.2.0,react-dom@18.2.0` を付与する必要があります。
- **自前 CDN**: 環境変数を使用して、社内ネットワークや自前サービスを指定できます：
  - **ESM_CDN_BASE_URL**: ESM CDN のベースアドレス（デフォルトは `https://esm.sh`）
  - **ESM_CDN_SUFFIX**: オプションのサフィックス（例: jsDelivr の `/+esm`）
  - 自前サービスについては [nocobase/esm-server](https://github.com/nocobase/esm-server) を参照してください。

## ctx.requireAsync() との違い

- **ctx.importAsync()**: **ESM モジュール** を読み込み、モジュールの名前空間を返します。モダンなライブラリ（Vue、dayjs などの ESM ビルド）に適しています。
- **ctx.requireAsync()**: **UMD/AMD** またはグローバルに公開されるスクリプトを読み込みます。主に ECharts や FullCalendar などの UMD ライブラリで使用されます。ライブラリが ESM と UMD の両方を提供している場合は、`ctx.importAsync()` を優先してください。

## 示例

### 基本的な使い方

パッケージ名または完全な URL を使用して、ESM モジュールと CSS を動的に読み込む最も基本的な方法です。

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0 からの読み込みと同等

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// サブパスの指定（dayjs プラグインなど）

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// 完全な URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// CSS を読み込み、ページに注入
```

### ECharts の例

ECharts を使用して、棒グラフと折れ線グラフを含む売上概要チャートを描画します。

```ts
// 1. ECharts モジュールを動的に読み込む
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. チャートコンテナを作成してレンダリング
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. ECharts インスタンスを初期化
const chart = echarts.init(chartEl);

// 4. チャートを設定
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

// 5. 設定を適用してチャートをレンダリング
chart.setOption(option);

// 6. オプション：レスポンシブ対応
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. オプション：イベントリスナー
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator の例

Tabulator を使用して、ページネーションと行クリックイベントをサポートするデータテーブルをブロック内にレンダリングします。

```ts
// 1. Tabulator のスタイルを読み込む
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Tabulator モジュールを動的に読み込む
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. テーブルコンテナを作成してレンダリング
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Tabulator テーブルを初期化
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

// 5. オプション：イベントリスナー
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) の例

FullCalendar とそのプラグインを ESM 方式で読み込み、基本的な月表示カレンダーをレンダリングする方法を示します。

```ts
// 1. FullCalendar core モジュールを動的に読み込む
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. dayGrid プラグインを動的に読み込む
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. カレンダーコンテナを作成してレンダリング
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. カレンダーを初期化してレンダリング
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

### dnd-kit のシンプルなドラッグ＆ドロップの例

`@dnd-kit/core` を使用して、ブロック内で Box をターゲットエリアにドラッグする最小限のドラッグ＆ドロップの例を実装します。

```ts
// 1. React、react-dom、@dnd-kit/core を読み込む（?deps によりページと同じ React インスタンスを使用し、Invalid hook call を回避）
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

// 2. レンダリング
ctx.render(<App />);
```

この例は `@dnd-kit/core` のみに依存しており、Box を指定されたエリアにドラッグしたときに通知を表示します。RunJS において `ctx.importAsync` と React を組み合わせて最もシンプルなドラッグ操作を実現する方法を示しています。

### dnd-kit の並べ替え可能リストの例

dnd-kit の core / sortable / utilities を使用して、ドラッグによる並べ替えをサポートする垂直リストを実装します。

```ts
// 1. React と dnd-kit 関連パッケージを読み込む（?deps により同一の React インスタンスを保証）
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

// 2. SortableItem コンポーネント（SortableContext 内にある必要があります）
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

// 3. App：DndContext + SortableContext + ドラッグ終了処理
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

// 4. コンテナを作成して React をマウント
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

この例は `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` に基づいており、ドラッグで並べ替え可能なリストを実装し、ドラッグ終了後に順序を更新して「List reordered」と通知します。

### react-big-calendar の例

`react-big-calendar` と `date-fns` によるローカライズを組み合わせ、現在のブロック内にイベント表示をサポートするカレンダーコンポーネントをレンダリングします。

```tsx
// 1. スタイルを読み込む（ctx.importAsync は .css を検知すると ctx.loadCSS を実行します）
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. React、react-dom、react-big-calendar、date-fns および locale を読み込む（同一の React インスタンスを保証）
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

// 3. React カレンダーをレンダリング
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

### frappe-gantt の例

`frappe-gantt` を使用して、タスクの開始/終了時間と進捗状況を表示するガントチャートビューをレンダリングします。

```ts
// 1. Gantt のスタイルとコンストラクタを動的に読み込む
// ESM_CDN_BASE_URL（デフォルトは https://esm.sh）に依存。短縮パスが使用可能
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. タスクデータを準備
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

// 3. コンテナを作成してレンダリング
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Gantt チャートを初期化
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // 表示モード：'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban の例

`@asseinfo/react-kanban` を利用して、Backlog や Doing などの列を含む基本的なカンバンボードをレンダリングします。

```ts
// 1. スタイルを読み込む (ctx.importAsync は .css を直接読み込みます)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. React、react-dom、@asseinfo/react-kanban を読み込む (?deps により同一の React インスタンスを保証)
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

// 4. ボードをマウント
ctx.render(<Board initialBoard={board} />);
```

## 注意事項

- 外部ネットワークまたは CDN に依存します。オフライン環境では、**ESM_CDN_BASE_URL** を自前サービスに向けるよう設定する必要があります。
- ライブラリが ESM と UMD の両方を提供している場合は、モジュールのセマンティクスが優れている `ctx.importAsync()` を優先してください。
- React に依存するライブラリには必ず `?deps=react@18.2.0,react-dom@18.2.0` を追加してください。バージョンはページの React と一致させる必要があります。一致しない場合、Invalid hook call エラーが発生する可能性があります。

## 関連情報

- [ctx.requireAsync()](./require-async.md)：UMD/AMD またはグローバルスクリプトの読み込み。ECharts や FullCalendar などの UMD ライブラリに適しています。
- [ctx.render()](./render.md)：コンテンツをコンテナにレンダリングします。