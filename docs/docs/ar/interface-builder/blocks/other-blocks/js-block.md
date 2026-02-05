:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# كتلة JS Block

## مقدمة

كتلة JS Block هي "كتلة عرض مخصصة" تتميز بمرونة عالية، وتتيح لك كتابة نصوص JavaScript برمجية مباشرة لإنشاء الواجهات، وربط الأحداث، واستدعاء واجهات برمجة التطبيقات للبيانات، أو دمج مكتبات الطرف الثالث. إنها مناسبة لسيناريوهات التصورات المخصصة، والتجارب المؤقتة، والتوسعات الخفيفة التي يصعب تغطيتها بالكتل المدمجة.

## واجهة برمجة تطبيقات سياق وقت التشغيل

تم حقن سياق وقت تشغيل كتلة JS Block بإمكانيات شائعة يمكن استخدامها مباشرة:

- `ctx.element`: حاوية DOM للكتلة (مغلفة بأمان كـ ElementProxy)، تدعم `innerHTML`، و`querySelector`، و`addEventListener`، وغيرها.
- `ctx.requireAsync(url)`: تحمّل مكتبة AMD/UMD بشكل غير متزامن باستخدام عنوان URL.
- `ctx.importAsync(url)`: تستورد وحدة ESM ديناميكيًا باستخدام عنوان URL.
- `ctx.openView`: تفتح عرضًا مُكوّنًا (نافذة منبثقة/درج جانبي/صفحة).
- `ctx.useResource(...)` + `ctx.resource`: تصل إلى البيانات كمصدر.
- `ctx.i18n.t()` / `ctx.t()`: إمكانية التدويل المدمجة.
- `ctx.onRefReady(ctx.ref, cb)`: تُعرض بعد أن تصبح الحاوية جاهزة لتجنب مشاكل التوقيت.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: مكتبات عامة مدمجة مثل React وReactDOM وAnt Design وأيقونات Ant Design وdayjs، تُستخدم لعرض JSX ومعالجة الوقت والتاريخ. (لا تزال `ctx.React` / `ctx.ReactDOM` / `ctx.antd` محتفظ بها للتوافق.)
- `ctx.render(vnode)`: تعرض عنصر React أو سلسلة HTML أو عقدة DOM إلى الحاوية الافتراضية `ctx.element`؛ الاستدعاءات المتعددة ستعيد استخدام نفس React Root وتتجاوز المحتوى الحالي للحاوية.

## إضافة كتلة

يمكنك إضافة كتلة JS Block إلى صفحة أو نافذة منبثقة.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## المحرر والمقتطفات

يدعم محرر النصوص البرمجية لكتلة JS Block تمييز بناء الجملة، وتلميحات الأخطاء، ومقتطفات التعليمات البرمجية المدمجة (Snippets)، مما يتيح لك إدراج أمثلة شائعة بسرعة، مثل: عرض الرسوم البيانية، وربط أحداث الأزرار، وتحميل المكتبات الخارجية، وعرض مكونات React/Vue، والخطوط الزمنية، وبطاقات المعلومات، وغيرها.

- `Snippets`: يفتح قائمة مقتطفات التعليمات البرمجية المدمجة. يمكنك البحث وإدراج المقتطف المحدد في موضع المؤشر الحالي في محرر التعليمات البرمجية بنقرة واحدة.
- `Run`: يشغل التعليمات البرمجية في المحرر الحالي مباشرة ويُخرج سجلات التنفيذ إلى لوحة `Logs` في الأسفل. يدعم عرض `console.log/info/warn/error`، وسيتم تمييز الأخطاء مع إمكانية تحديد موقعها في السطر والعمود المحددين.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

بالإضافة إلى ذلك، يمكنك استدعاء الموظف الذكاء الاصطناعي "مهندس الواجهة الأمامية · Nathan" مباشرة من الزاوية العلوية اليمنى للمحرر. يمكن لـ Nathan مساعدتك في كتابة أو تعديل النصوص البرمجية بناءً على السياق الحالي. ثم يمكنك "Apply to editor" (تطبيق على المحرر) بنقرة واحدة وتشغيل التعليمات البرمجية لرؤية التأثير. للتفاصيل، انظر:

- [الموظف الذكاء الاصطناعي · Nathan: مهندس الواجهة الأمامية](/ai-employees/built-in/ai-coding)

## بيئة وقت التشغيل والأمان

- **الحاوية**: يوفر النظام للنص البرمجي حاوية DOM آمنة `ctx.element` (ElementProxy)، تؤثر فقط على الكتلة الحالية ولا تتداخل مع مناطق أخرى من الصفحة.
- **صندوق الحماية (Sandbox)**: يعمل النص البرمجي في بيئة محكومة. تستخدم `window`/`document`/`navigator` كائنات وكيل آمنة، مما يتيح استخدام واجهات برمجة التطبيقات الشائعة مع تقييد السلوكيات الخطرة.
- **إعادة العرض**: تُعاد الكتلة عرض نفسها تلقائيًا عند إخفائها ثم إظهارها مرة أخرى (لتجنب إعادة تنفيذ نص التثبيت الأولي).

## الاستخدامات الشائعة (أمثلة مبسطة)

### 1) عرض React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) قالب طلب واجهة برمجة التطبيقات

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) تحميل ECharts وعرضها

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) فتح عرض (درج جانبي)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) قراءة مصدر وعرض JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## ملاحظات

- يُنصح باستخدام شبكات توصيل المحتوى (CDN) الموثوقة لتحميل المكتبات الخارجية.
- **نصيحة حول استخدام المحددات**: أعطِ الأولوية لاستخدام محددات `class` أو محددات السمات `[name=...]`. تجنب استخدام معرفات `id` الثابتة لتجنب التعارضات في الأنماط أو الأحداث الناتجة عن تكرار معرفات `id` عند استخدام كتل أو نوافذ منبثقة متعددة.
- **تنظيف الأحداث**: نظرًا لأن الكتلة قد تُعاد عرض نفسها عدة مرات، يجب تنظيف مستمعي الأحداث أو إزالة التكرارات قبل ربطها لتجنب التنشيط المتكرر. يمكنك استخدام أسلوب "إزالة ثم إضافة"، أو مستمع لمرة واحدة، أو إضافة علامة لمنع التكرار.

## المستندات ذات الصلة

- [المتغيرات والسياق](/interface-builder/variables)
- [قواعد الربط](/interface-builder/linkage-rule)
- [العروض والنوافذ المنبثقة](/interface-builder/actions/types/view)