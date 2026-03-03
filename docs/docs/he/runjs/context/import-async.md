:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/import-async).
:::

# ctx.importAsync()

טעינה דינמית של **מודולי ESM** או **CSS** באמצעות URL, מתאים לתרחישי RunJS שונים. השתמשו ב-`ctx.importAsync()` כאשר נדרשות ספריות ESM של צד שלישי, וב-`ctx.requireAsync()` עבור ספריות UMD/AMD; העברת כתובת `.css` תטען ותזריק את העיצוב לדף.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock** | טעינה דינמית של ספריות ESM כגון Vue, ECharts או Tabulator למימוש תרשימים, טבלאות, לוחות מחוונים (dashboards) מותאמים אישית וכו'. |
| **JSField / JSItem / JSColumn** | טעינת ספריות עזר קלות בפורמט ESM (כגון תוספי dayjs) לסיוע ברינדור. |
| **תהליך עבודה / אירועי פעולה** | טעינת תלויות לפי דרישה לפני ביצוע הלוגיקה העסקית. |

## הגדרת טיפוסים (Type Definition)

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## פרמטרים

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `url` | `string` | כתובת מודול ה-ESM או ה-CSS. תומך בפורמט מקוצר `<package>@<version>` או נתיבי משנה `<package>@<version>/<file-path>` (למשל `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), אשר ישורשרו עם קידומת ה-CDN בהתאם להגדרות; נתמכות גם כתובות URL מלאות. כאשר מועבר קובץ `.css`, הוא ייטען ויוזרק כסגנון עיצוב. עבור ספריות התלויות ב-React, ניתן להוסיף `?deps=react@18.2.0,react-dom@18.2.0` כדי להבטיח שהן חולקות את אותו מופע React עם הדף. |

## ערך חזרה

- Promise המתמיש (resolves) לאובייקט ה-namespace של המודול.

## הסבר על פורמט URL

- **ESM ו-CSS**: בנוסף למודולי ESM, נתמכת גם טעינת CSS (העבירו URL של `.css` כדי לטעון ולהזריק אותו לדף).
- **פורמט מקוצר**: כברירת מחדל נעשה שימוש ב-**https://esm.sh** כקידומת CDN אם לא הוגדר אחרת. לדוגמה, `vue@3.4.0` בפועל מבצע בקשה ל-`https://esm.sh/vue@3.4.0`.
- **?deps**: ספריות התלויות ב-React (כגון `@dnd-kit/core`, `react-big-calendar`) צריכות להוסיף `?deps=react@18.2.0,react-dom@18.2.0` כדי למנוע התנגשויות עם מופע ה-React של הדף, מה שעלול להוביל לשגיאות "Invalid hook call".
- **CDN בניהול עצמי**: ניתן לציין רשת פנימית או שירות בניהול עצמי באמצעות משתני סביבה:
  - **ESM_CDN_BASE_URL**: כתובת הבסיס של ה-ESM CDN (ברירת המחדל היא `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: סיומת אופציונלית (למשל `/+esm` עבור jsDelivr).
  - לשירותים בניהול עצמי, עיינו ב: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## ההבדל מ-ctx.requireAsync()

- **ctx.importAsync()**: טוען **מודולי ESM** ומחזיר את ה-namespace של המודול. מתאים לספריות מודרניות (גרסאות ESM של Vue, dayjs וכו').
- **ctx.requireAsync()**: טוען מודולי **UMD/AMD** או סקריפטים המתווספים לטווח הגלובלי. משמש לרוב עבור ספריות UMD כמו ECharts או FullCalendar. אם ספרייה מספקת גם ESM וגם UMD, עדיף להשתמש ב-`ctx.importAsync()`.

## דוגמאות

### שימוש בסיסי

מדגים את השימוש הבסיסי ביותר בטעינה דינמית של מודולי ESM ו-CSS לפי שם חבילה או URL מלא.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// שווה ערך לטעינה מ-https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// עם נתיב משנה (למשל תוסף dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL מלא

await ctx.importAsync('https://cdn.example.com/theme.css');
// טעינת CSS והזרקה לדף
```

### דוגמת ECharts

שימוש ב-ECharts לשרטוט תרשים סקירת מכירות עם גרף עמודות וגרף קווי.

```ts
// 1. טעינה דינמית של מודול ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. יצירת מיכל לתרשים ורינדור
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. אתחול מופע ECharts
const chart = echarts.init(chartEl);

// 4. הגדרת התרשים
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

// 5. החלת ההגדרות ורינדור התרשים
chart.setOption(option);

// 6. אופציונלי: התאמה רספונסיבית לגודל
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. אופציונלי: האזנה לאירועים
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### דוגמת Tabulator

מדגים רינדור טבלת נתונים עם דפדוף (pagination) ואירועי לחיצה על שורות בתוך בלוק באמצעות Tabulator.

```ts
// 1. טעינת עיצובי Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. טעינה דינמית של מודול Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. יצירת מיכל לטבלה ורינדור
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. אתחול טבלת Tabulator
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

// 5. אופציונלי: האזנה לאירועים
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### דוגמת FullCalendar (ESM)

מציג כיצד לטעון את FullCalendar והתוספים שלו באמצעות ESM ולרנדר לוח שנה בתצוגה חודשית בסיסית.

```ts
// 1. טעינה דינמית של מודול הליבה של FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. טעינה דינמית של תוסף dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. יצירת מיכל ללוח השנה ורינדור
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. אתחול ורינדור לוח השנה
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

### דוגמת גרירה והשלכה (Drag-and-Drop) פשוטה עם dnd-kit

שימוש ב-`@dnd-kit/core` למימוש דוגמה מינימלית של גרירת קופסה לאזור יעד בתוך בלוק.

```ts
// 1. טעינת React, react-dom, @dnd-kit/core (?deps מבטיח שימוש באותו מופע React למניעת Invalid hook call)
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

// 2. רינדור
ctx.render(<App />);
```

דוגמה זו מסתמכת רק על `@dnd-kit/core` כדי להפעיל התראה כאשר קופסה נגררת לאזור מסוים, ומדגימה את אינטראקציית הגרירה הפשוטה ביותר בשילוב `ctx.importAsync` ו-React בתוך RunJS.

### דוגמת רשימה ניתנת לסידור עם dnd-kit

מימוש רשימה אנכית ניתנת לסידור מחדש באמצעות core, sortable ו-utilities של dnd-kit.

```ts
// 1. טעינת React וחבילות dnd-kit רלוונטיות (?deps מבטיח שימוש באותו מופע React)
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

// 2. רכיב SortableItem (חייב להיות בתוך SortableContext)
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

// 3. App: DndContext + SortableContext + טיפול בסיום גרירה
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

// 4. יצירת מיכל וחיבור React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

דוגמה זו מבוססת על `@dnd-kit/core`, `@dnd-kit/sortable` ו-`@dnd-kit/utilities`, ומממשת רשימה הניתנת לגרירה וסידור מחדש, תוך עדכון הסדר והצגת הודעת "List reordered" בסיום הפעולה.

### דוגמת react-big-calendar

רינדור רכיב לוח שנה התומך בהצגת אירועים בבלוק הנוכחי תוך שימוש ב-`react-big-calendar` ו-`date-fns` ללוקליזציה.

```tsx
// 1. טעינת עיצובים (ctx.importAsync משתמש ב-ctx.loadCSS עבור קבצי .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. טעינת React, react-dom, react-big-calendar, date-fns ולוקאל (הבטחת אותו מופע React)
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

// 3. רינדור לוח שנה של React
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

### דוגמת frappe-gantt

שימוש ב-`frappe-gantt` לרינדור תצוגת תרשים גאנט המציג זמני התחלה/סיום של משימות והתקדמות.

```ts
// 1. טעינה דינמית של עיצובי Gantt והבנאי (constructor)
// תלוי ב-ESM_CDN_BASE_URL (ברירת מחדל https://esm.sh), ניתן להשתמש בנתיבים מקוצרים
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. הכנת נתוני משימות
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

// 3. יצירת מיכל ורינדור
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. אתחול תרשים הגאנט
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // רזולוציית תצוגה: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### דוגמת @asseinfo/react-kanban

שימוש ב-`@asseinfo/react-kanban` לרינדור לוח קנבן בסיסי עם עמודות כמו Backlog ו-Doing בתוך בלוק.

```ts
// 1. טעינת עיצובים (ctx.importAsync טוען ישירות קבצי .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. טעינת React, react-dom, @asseinfo/react-kanban (?deps מבטיח שימוש באותו מופע React)
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

// 4. חיבור הלוח
ctx.render(<Board initialBoard={board} />);
```

## הערות

- תכונה זו תלויה ברשת חיצונית או ב-CDN. בסביבות רשת פנימית, יש להגדיר את **ESM_CDN_BASE_URL** כך שיצביע לשירות בניהול עצמי.
- כאשר ספרייה מספקת גם ESM וגם UMD, העדיפו את `ctx.importAsync()` עבור סמנטיקה טובה יותר של מודולים.
- עבור ספריות התלויות ב-React, הקפידו להוסיף `?deps=react@18.2.0,react-dom@18.2.0`. הגרסה חייבת להתאים לגרסת ה-React שבשימוש הדף, אחרת עלולה להופיע שגיאת "Invalid hook call".

## נושאים קשורים

- [ctx.requireAsync()](./require-async.md): טעינת סקריפטים מסוג UMD/AMD או כאלו המחוברים גלובלית, מתאים לספריות UMD כמו ECharts ו-FullCalendar.
- [ctx.render()](./render.md): רינדור תוכן לתוך מיכל (container).