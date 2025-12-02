:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# حقل JS

## مقدمة

يُستخدم حقل JS لتخصيص عرض المحتوى في موضع الحقل باستخدام JavaScript. يُستخدم عادةً في كتل التفاصيل، والعناصر للقراءة فقط في النماذج، أو كـ "عناصر مخصصة أخرى" في أعمدة الجداول. وهو مناسب للعروض التقديمية المخصصة، ودمج المعلومات المشتقة، وعرض شارات الحالة، والنصوص المنسقة، أو الرسوم البيانية.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## الأنواع

-   **للقراءة فقط:** يُستخدم للعرض غير القابل للتحرير، ويقرأ `ctx.value` لعرض المخرجات.
-   **قابل للتحرير:** يُستخدم لتفاعلات الإدخال المخصصة. يوفر `ctx.getValue()`/`ctx.setValue(v)` وحدث الحاوية `js-field:value-change` لتسهيل المزامنة ثنائية الاتجاه مع قيم النموذج.

## حالات الاستخدام

-   **للقراءة فقط**
    -   **كتلة التفاصيل:** لعرض محتوى للقراءة فقط مثل نتائج الحسابات، شارات الحالة، مقتطفات النصوص المنسقة، الرسوم البيانية، وما إلى ذلك.
    -   **كتلة الجدول:** يُستخدم كـ "عمود مخصص آخر > حقل JS" للعرض للقراءة فقط (إذا كنت بحاجة إلى عمود غير مرتبط بحقل، يرجى استخدام JS Column).

-   **قابل للتحرير**
    -   **كتلة النموذج (CreateForm/EditForm):** يُستخدم لعناصر التحكم المخصصة للإدخال أو الإدخالات المركبة، والتي يتم التحقق منها وإرسالها مع النموذج.
    -   **مناسب لسيناريوهات مثل:** مكونات الإدخال من المكتبات الخارجية، محررات النصوص المنسقة/التعليمات البرمجية، المكونات الديناميكية المعقدة، وما إلى ذلك.

## واجهة برمجة تطبيقات سياق وقت التشغيل (Runtime Context API)

يمكن لرمز وقت تشغيل حقل JS استخدام إمكانيات السياق التالية مباشرةً:

-   `ctx.element`: حاوية DOM للحقل (ElementProxy)، تدعم `innerHTML`، `querySelector`، `addEventListener`، وما إلى ذلك.
-   `ctx.value`: قيمة الحقل الحالية (للقراءة فقط).
-   `ctx.record`: كائن السجل الحالي (للقراءة فقط).
-   `ctx.collection`: البيانات الوصفية للمجموعة التي ينتمي إليها الحقل (للقراءة فقط).
-   `ctx.requireAsync(url)`: تحميل مكتبة AMD/UMD بشكل غير متزامن عبر عنوان URL.
-   `ctx.importAsync(url)`: استيراد وحدة ESM ديناميكيًا عبر عنوان URL.
-   `ctx.openView(options)`: فتح عرض مُكوّن (نافذة منبثقة/درج جانبي/صفحة).
-   `ctx.i18n.t()` / `ctx.t()`: التدويل (Internationalization).
-   `ctx.onRefReady(ctx.ref, cb)`: العرض بعد أن تصبح الحاوية جاهزة.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: مكتبات عامة مدمجة مثل React وReactDOM وAnt Design وأيقونات Ant Design وdayjs، تُستخدم لعرض JSX ومعالجة الوقت. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` لا تزال محتفظ بها للتوافق).
-   `ctx.render(vnode)`: يعرض عنصر React أو سلسلة HTML أو عقدة DOM في الحاوية الافتراضية `ctx.element`؛ سيؤدي العرض المتكرر إلى إعادة استخدام الجذر (Root) وكتابة المحتوى الحالي للحاوية.

خاص بالنوع القابل للتحرير (JSEditableField):

-   `ctx.getValue()`: الحصول على قيمة النموذج الحالية (يعطي الأولوية لحالة النموذج، ثم يعود إلى خصائص الحقل).
-   `ctx.setValue(v)`: تعيين قيمة النموذج وخصائص الحقل، مع الحفاظ على المزامنة ثنائية الاتجاه.
-   حدث الحاوية `js-field:value-change`: يتم تشغيله عند تغيير قيمة خارجية، مما يسهل على السكريبت تحديث عرض الإدخال.

## المحرر والمقتطفات

يدعم محرر سكريبت حقل JS تمييز بناء الجملة، وتلميحات الأخطاء، ومقتطفات التعليمات البرمجية المدمجة (Snippets).

-   `Snippets`: يفتح قائمة بمقتطفات التعليمات البرمجية المدمجة، والتي يمكن البحث عنها وإدراجها بنقرة واحدة في موضع المؤشر الحالي.
-   `Run`: ينفذ التعليمات البرمجية الحالية مباشرةً. يتم إخراج سجل التنفيذ إلى لوحة `Logs` في الأسفل، ويدعم `console.log/info/warn/error` وتمييز الأخطاء لتحديد موقعها بسهولة.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

يمكنك أيضًا إنشاء التعليمات البرمجية باستخدام موظف الذكاء الاصطناعي:

-   [موظف الذكاء الاصطناعي · ناثان: مهندس واجهة أمامية](/ai-employees/built-in/ai-coding)

## الاستخدامات الشائعة

### 1) العرض الأساسي (قراءة قيمة الحقل)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) استخدام JSX لعرض مكون React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) تحميل مكتبات الطرف الثالث (AMD/UMD أو ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) النقر لفتح نافذة منبثقة/درج جانبي (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">عرض التفاصيل</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) إدخال قابل للتحرير (JSEditableFieldModel)

```js
// يعرض إدخالًا بسيطًا باستخدام JSX ويزامن قيمة النموذج
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// مزامنة الإدخال عند تغيير القيمة الخارجية (اختياري)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## ملاحظات

-   يُنصح باستخدام شبكة توصيل محتوى (CDN) موثوقة لتحميل المكتبات الخارجية، وتوفير حلول بديلة لسيناريوهات الفشل (مثل `if (!lib) return;`).
-   يُنصح بإعطاء الأولوية لاستخدام `class` أو `[name=...]` للمُحدّدات (selectors) وتجنب استخدام `id` ثابت لمنع تكرار `id` في كتل أو نوافذ منبثقة متعددة.
-   **تنظيف الأحداث:** قد يُعاد عرض الحقل عدة مرات بسبب تغييرات البيانات أو تبديل العروض. قبل ربط أي حدث، يجب تنظيفه أو إزالة التكرارات لتجنب التشغيل المتكرر. يمكن القيام بذلك بـ "إزالة ثم إضافة".