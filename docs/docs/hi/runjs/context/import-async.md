:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/import-async) देखें।
:::

# ctx.importAsync()

URL के माध्यम से **ESM मॉड्यूल** या **CSS** को गतिशील रूप से (dynamically) लोड करें, जो RunJS के विभिन्न परिदृश्यों के लिए उपयुक्त है। जब तीसरे पक्ष (third-party) की ESM लाइब्रेरी की आवश्यकता हो तो `ctx.importAsync()` का उपयोग करें, और UMD/AMD लाइब्रेरी के लिए `ctx.requireAsync()` का उपयोग करें; `.css` एड्रेस पास करने पर यह स्टाइल लोड करेगा और पेज में इंजेक्ट करेगा।

##适用 परिदृश्य

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | कस्टम चार्ट, टेबल, डैशबोर्ड आदि को लागू करने के लिए Vue, ECharts, या Tabulator जैसी ESM लाइब्रेरी को गतिशील रूप से लोड करें। |
| **JSField / JSItem / JSColumn** | रेंडरिंग में सहायता के लिए हल्के ESM यूटिलिटी लाइब्रेरी (जैसे dayjs प्लगइन्स) लोड करें। |
| **वर्कफ़्लो / ऑपरेशन इवेंट** | बिजनेस लॉजिक निष्पादित करने से पहले मांग पर निर्भरता (dependencies) लोड करें। |

## टाइप परिभाषा

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## पैरामीटर

| पैरामीटर | प्रकार | विवरण |
|------|------|------|
| `url` | `string` | ESM मॉड्यूल या CSS का एड्रेस। यह शॉर्टहैंड `<package>@<version>` या सब-पाथ `<package>@<version>/<file-path>` (जैसे `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`) का समर्थन करता है, जिसे कॉन्फ़िगरेशन के अनुसार CDN प्रीफ़िक्स के साथ जोड़ा जाएगा; पूर्ण URL भी समर्थित हैं। जब `.css` फ़ाइल पास की जाती है, तो इसे लोड किया जाएगा और स्टाइल के रूप में इंजेक्ट किया जाएगा। React पर निर्भर लाइब्रेरी के लिए, आप `?deps=react@18.2.0,react-dom@18.2.0` जोड़ सकते हैं ताकि यह सुनिश्चित हो सके कि वे पेज के साथ एक ही React इंस्टेंस साझा करते हैं। |

## रिटर्न वैल्यू

- मॉड्यूल के नेमस्पेस ऑब्जेक्ट के लिए एक Promise (रिज़ॉल्व्ड वैल्यू)।

## URL फॉर्मेट विवरण

- **ESM और CSS**: ESM मॉड्यूल के अलावा, CSS लोड करना भी समर्थित है (पेज में लोड और इंजेक्ट करने के लिए `.css` URL पास करें)।
- **शॉर्टहैंड फॉर्मेट**: कॉन्फ़िगर नहीं होने पर डिफ़ॉल्ट रूप से **https://esm.sh** का उपयोग CDN प्रीफ़िक्स के रूप में किया जाता है। उदाहरण के लिए, `vue@3.4.0` वास्तव में `https://esm.sh/vue@3.4.0` के लिए अनुरोध करता है।
- **?deps**: React पर निर्भर लाइब्रेरी (जैसे `@dnd-kit/core`, `react-big-calendar`) में `?deps=react@18.2.0,react-dom@18.2.0` जोड़ना चाहिए ताकि पेज के React इंस्टेंस के साथ टकराव से बचा जा सके, जिससे "Invalid hook call" त्रुटि हो सकती है।
- **स्व-होस्टेड (Self-hosted) CDN**: आप एनवायरनमेंट वेरिएबल्स के माध्यम से आंतरिक नेटवर्क या स्व-होस्टेड सेवा निर्दिष्ट कर सकते हैं:
  - **ESM_CDN_BASE_URL**: ESM CDN का बेस URL (डिफ़ॉल्ट `https://esm.sh` है)।
  - **ESM_CDN_SUFFIX**: वैकल्पिक सफ़िक्स (जैसे jsDelivr के लिए `/+esm`)।
  - स्व-होस्टेड सेवाओं के लिए, देखें: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## ctx.requireAsync() से अंतर

- **ctx.importAsync()**: **ESM मॉड्यूल** लोड करता है और मॉड्यूल नेमस्पेस लौटाता है। आधुनिक लाइब्रेरी (Vue, dayjs जैसे ESM बिल्ड) के लिए उपयुक्त है।
- **ctx.requireAsync()**: **UMD/AMD** मॉड्यूल या उन स्क्रिप्ट को लोड करता है जो ग्लोबल स्कोप से जुड़ती हैं। अक्सर ECharts या FullCalendar जैसी UMD लाइब्रेरी के लिए उपयोग किया जाता है। यदि कोई लाइब्रेरी ESM और UMD दोनों प्रदान करती है, तो `ctx.importAsync()` को प्राथमिकता दी जाती है।

## उदाहरण

### बुनियादी उपयोग

पैकेज के नाम या पूर्ण URL द्वारा ESM मॉड्यूल और CSS को गतिशील रूप से लोड करने के सबसे बुनियादी उपयोग को दर्शाता है।

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0 से लोड करने के बराबर

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// सब-पाथ के साथ (जैसे dayjs प्लगइन)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// पूर्ण URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// CSS लोड करें और पेज में इंजेक्ट करें
```

### ECharts उदाहरण

बार और लाइन ग्राफ़ के साथ बिक्री अवलोकन (sales overview) चार्ट बनाने के लिए ECharts का उपयोग करें।

```ts
// 1. ECharts मॉड्यूल को गतिशील रूप से लोड करें
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. चार्ट कंटेनर बनाएं और रेंडर करें
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. ECharts इंस्टेंस को इनिशियलाइज़ करें
const chart = echarts.init(chartEl);

// 4. चार्ट कॉन्फ़िगर करें
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

// 5. विकल्प सेट करें और चार्ट रेंडर करें
chart.setOption(option);

// 6. वैकल्पिक: रिस्पॉन्सिव साइजिंग
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. वैकल्पिक: इवेंट लिसनर
chart.on('click', (params) => {
  ctx.message.info(`Clicked ${params.seriesName} on ${params.name}, value: ${params.value}`);
});
```

### Tabulator उदाहरण

Tabulator का उपयोग करके एक ब्लॉक में पेजिनेशन और रो क्लिक इवेंट के साथ डेटा टेबल रेंडर करने का उदाहरण।

```ts
// 1. Tabulator स्टाइल लोड करें
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Tabulator मॉड्यूल को गतिशील रूप से लोड करें
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. टेबल कंटेनर बनाएं और रेंडर करें
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Tabulator टेबल को इनिशियलाइज़ करें
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

// 5. वैकल्पिक: इवेंट लिसनर
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Row clicked: ${rowData.name}`);
});
```

### FullCalendar (ESM) उदाहरण

दिखाता है कि ESM के माध्यम से FullCalendar और उसके प्लगइन्स को कैसे लोड किया जाए और एक बुनियादी मासिक दृश्य कैलेंडर रेंडर किया जाए।

```ts
// 1. FullCalendar कोर मॉड्यूल को गतिशील रूप से लोड करें
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. dayGrid प्लगइन को गतिशील रूप से लोड करें
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. कैलेंडर कंटेनर बनाएं और रेंडर करें
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. कैलेंडर को इनिशियलाइज़ और रेंडर करें
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

### dnd-kit सरल ड्रैग-एंड-ड्रॉप उदाहरण

एक ब्लॉक के भीतर एक बॉक्स को लक्ष्य क्षेत्र (target area) तक खींचने का एक न्यूनतम उदाहरण लागू करने के लिए `@dnd-kit/core` का उपयोग करता है।

```ts
// 1. React, react-dom, @dnd-kit/core लोड करें (Invalid hook call से बचने के लिए ?deps सुनिश्चित करता है कि एक ही React इंस्टेंस हो)
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

// 2. रेंडर करें
ctx.render(<App />);
```

यह उदाहरण केवल `@dnd-kit/core` पर निर्भर करता है ताकि किसी विशिष्ट क्षेत्र में बॉक्स छोड़े जाने पर एक सूचना ट्रिगर हो सके, जो RunJS में `ctx.importAsync` और React के संयोजन से सबसे सरल ड्रैग-एंड-ड्रॉप इंटरैक्शन को प्रदर्शित करता है।

### dnd-kit सॉर्ट करने योग्य सूची (Sortable List) उदाहरण

dnd-kit के कोर, सॉर्टेबल और यूटिलिटीज का उपयोग करके एक वर्टिकल सॉर्ट करने योग्य सूची लागू करता है।

```ts
// 1. React और dnd-kit से संबंधित पैकेज लोड करें (?deps एक ही React इंस्टेंस सुनिश्चित करता है)
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

// 2. SortableItem घटक (SortableContext के अंदर होना चाहिए)
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

// 3. App: DndContext + SortableContext + ड्रैग एंड हैंडलर
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

// 4. कंटेनर बनाएं और React को माउंट करें
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

यह उदाहरण एक सॉर्ट करने योग्य सूची को लागू करने के लिए `@dnd-kit/core`, `@dnd-kit/sortable`, और `@dnd-kit/utilities` का उपयोग करता है जो अपने क्रम को अपडेट करता है और ड्रैगिंग के बाद "List reordered" संदेश प्रदर्शित करता है।

### react-big-calendar उदाहरण

स्थानीयकरण (localization) के लिए `react-big-calendar` और `date-fns` का उपयोग करके वर्तमान ब्लॉक में इवेंट डिस्प्ले का समर्थन करने वाला एक कैलेंडर घटक रेंडर करता है।

```tsx
// 1. स्टाइल लोड करें (ctx.importAsync .css फ़ाइलों के लिए ctx.loadCSS का उपयोग करता है)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. React, react-dom, react-big-calendar, date-fns, और लोकेल लोड करें (एक ही React इंस्टेंस सुनिश्चित करते हुए)
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

// 3. React कैलेंडर रेंडर करें
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

### frappe-gantt उदाहरण

टास्क के शुरू/समाप्त होने के समय और प्रगति को दिखाने वाला गैंट चार्ट (Gantt chart) व्यू रेंडर करने के लिए `frappe-gantt` का उपयोग करता है।

```ts
// 1. Gantt स्टाइल और कंस्ट्रक्टर को गतिशील रूप से लोड करें
// ESM_CDN_BASE_URL (डिफ़ॉल्ट https://esm.sh) पर निर्भर करता है, शॉर्टहैंड पाथ का उपयोग किया जा सकता है
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. टास्क डेटा तैयार करें
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

// 3. कंटेनर बनाएं और रेंडर करें
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Gantt चार्ट को इनिशियलाइज़ करें
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // व्यू ग्रैन्युलैरिटी: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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

### @asseinfo/react-kanban उदाहरण

एक ब्लॉक के भीतर Backlog और Doing जैसे कॉलम के साथ एक बुनियादी कानबान (Kanban) बोर्ड रेंडर करने के लिए `@asseinfo/react-kanban` का उपयोग करता है।

```ts
// 1. स्टाइल लोड करें (ctx.importAsync सीधे .css लोड करता है)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. React, react-dom, @asseinfo/react-kanban लोड करें (?deps एक ही React इंस्टेंस सुनिश्चित करता है)
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

// 4. बोर्ड को माउंट करें
ctx.render(<Board initialBoard={board} />);
```

## ध्यान देने योग्य बातें

- यह सुविधा बाहरी नेटवर्क या CDN पर निर्भर करती है। आंतरिक नेटवर्क वातावरण में, **ESM_CDN_BASE_URL** को स्व-होस्टेड सेवा की ओर इंगित करने के लिए कॉन्फ़िगर किया जाना चाहिए।
- जब कोई लाइब्रेरी ESM और UMD दोनों प्रदान करती है, तो बेहतर मॉड्यूल सिमेंटिक्स के लिए `ctx.importAsync()` को प्राथमिकता दें।
- React पर निर्भर लाइब्रेरी के लिए, सुनिश्चित करें कि आप `?deps=react@18.2.0,react-dom@18.2.0` जोड़ते हैं। वर्ज़न पेज द्वारा उपयोग किए जाने वाले React वर्ज़न से मेल खाना चाहिए, अन्यथा "Invalid hook call" त्रुटि आ सकती है।

## संबंधित

- [ctx.requireAsync()](./require-async.md): UMD/AMD या ग्लोबली अटैच्ड स्क्रिप्ट लोड करें, जो ECharts और FullCalendar जैसी UMD लाइब्रेरी के लिए उपयुक्त है।
- [ctx.render()](./render.md): कंटेनर में सामग्री रेंडर करें।