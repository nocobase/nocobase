:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/require-async).
:::

# ctx.requireAsync()

يقوم بتحميل البرامج النصية (scripts) من نوع **UMD/AMD** أو تلك المثبتة عالمياً (global) بشكل غير متزامن عبر رابط URL، كما يمكنه تحميل ملفات **CSS**. يُعد مناسباً لسيناريوهات RunJS التي تتطلب مكتبات UMD/AMD مثل ECharts و Chart.js و FullCalendar (إصدار UMD) وإضافات jQuery؛ يؤدي تمرير عنوان ينتهي بـ `.css` إلى تحميل الأنماط وحقنها. إذا كانت المكتبة توفر إصدار ESM أيضاً، فيُفضل استخدام [ctx.importAsync()](./import-async.md).

## سيناريوهات الاستخدام

يمكن استخدامه في أي سيناريو RunJS يتطلب تحميل برامج نصية UMD/AMD/global أو ملفات CSS عند الطلب، مثل JSBlock و JSField و JSItem و JSColumn وسير العمل (Workflow) و JSAction وغيرها. الاستخدامات النموذجية تشمل: رسوم ECharts البيانية، Chart.js، FullCalendar (UMD)، dayjs (UMD)، وإضافات jQuery.

## تعريف النوع

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## المعاملات

| المعامل | النوع | الوصف |
|-----------|------|-------------|
| `url` | `string` | عنوان البرنامج النصي أو ملف CSS. يدعم **المسار المختصر** `<package>@<version>/<file-path>` (يتم إضافة `?raw` للملف الأصلي UMD عند التحليل عبر ESM CDN) أو **رابط URL كامل**. يقوم بتحميل وحقن الأنماط عند تمرير ملف `.css`. |

## القيمة المعادة

- كائن المكتبة المحملة (قيمة الوحدة الأولى في استدعاء UMD/AMD). العديد من مكتبات UMD تربط نفسها بـ `window` (مثل `window.echarts`)؛ لذا قد تكون القيمة المعادة `undefined`. في هذه الحالة، استخدم المتغير العالمي وفقاً لتوثيق المكتبة.
- يعيد نتيجة `loadCSS` عند تمرير ملف `.css`.

## وصف تنسيق URL

- **المسار المختصر**: مثل `echarts@5/dist/echarts.min.js`. في ESM CDN الافتراضي (esm.sh)، سيطلب الرابط `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. يُستخدم المعامل `?raw` للحصول على ملف UMD الأصلي بدلاً من غلاف ESM.
- **رابط URL كامل**: يمكن كتابة أي عنوان CDN مباشرة، مثل `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: سيتم تحميل الرابط الذي ينتهي بـ `.css` وحقنه في الصفحة.

## الفرق بينه وبين ctx.importAsync()

- **ctx.requireAsync()**: يحمل البرامج النصية من نوع **UMD/AMD/global**. مناسب لـ ECharts و Chart.js و FullCalendar (UMD) وإضافات jQuery وغيرها. غالباً ما ترتبط المكتبات بـ `window` بعد التحميل؛ وقد تكون القيمة المعادة هي كائن المكتبة أو `undefined`.
- **ctx.importAsync()**: يحمل **وحدات ESM** ويعيد مساحة اسم الوحدة (module namespace). إذا كانت المكتبة توفر ESM، فاستخدم `ctx.importAsync()` للحصول على دلالات برمجية أفضل للوحدات ودعم الـ Tree-shaking.

## أمثلة

### الاستخدام الأساسي

```javascript
// مسار مختصر (يتم تحليله عبر ESM CDN كـ ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// رابط URL كامل
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// تحميل CSS وحقنه في الصفحة
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### رسم بياني باستخدام ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('نظرة عامة على المبيعات') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### رسم بياني شريطي باستخدام Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('الكمية'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## ملاحظات

- **صيغة القيمة المعادة**: تختلف طرق تصدير UMD؛ قد تكون القيمة المعادة هي كائن المكتبة أو `undefined`. إذا كانت `undefined` فيمكن الوصول إليها عبر `window` بناءً على توثيق المكتبة.
- **الاعتماد على الشبكة**: يتطلب الوصول إلى CDN. في بيئات الشبكة الداخلية، يمكن التوجيه إلى خدمة مستضافة ذاتياً عبر **ESM_CDN_BASE_URL**.
- **الاختيار بين importAsync**: إذا كانت المكتبة توفر كلاً من ESM و UMD، فامنح الأولوية لـ `ctx.importAsync()`.

## روابط ذات صلة

- [ctx.importAsync()](./import-async.md) - يحمل وحدات ESM، مناسب لـ Vue و dayjs (ESM) وغيرها.
- [ctx.render()](./render.md) - يقوم برسم الرسوم البيانية والمكونات الأخرى داخل حاوية.
- [ctx.libs](./libs.md) - يتضمن React و antd و dayjs وغيرها بشكل مدمج، دون الحاجة للتحميل غير المتزامن.