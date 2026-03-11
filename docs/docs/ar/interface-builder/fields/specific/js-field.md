:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/interface-builder/fields/specific/js-field).
:::

# JS Field

## مقدمة

يُستخدم JS Field لتخصيص رندرة (rendering) المحتوى باستخدام JavaScript في موضع الحقل، ويشيع استخدامه في كتل التفاصيل، أو العناصر المخصصة للقراءة فقط في النماذج، أو "العناصر المخصصة الأخرى" في أعمدة الجداول. وهو مناسب للعرض الشخصي، ودمج المعلومات المشتقة، وشارات الحالة، والنصوص المنسقة، أو الرسوم البيانية.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## الأنواع

- نوع القراءة فقط: يُستخدم للعرض غير القابل للتحرير، حيث يقرأ `ctx.value` لرندرة المخرجات.
- النوع القابل للتحرير: يُستخدم لتفاعلات الإدخال المخصصة، ويوفر `ctx.getValue()` / `ctx.setValue(v)` وحدث الحاوية `js-field:value-change` لتسهيل المزامنة ثنائية الاتجاه مع قيم النموذج.

## سيناريوهات الاستخدام

- نوع القراءة فقط
  - كتلة التفاصيل: عرض نتائج الحسابات، شارات الحالة، مقتطفات النصوص المنسقة، الرسوم البيانية، وغيرها من المحتويات للقراءة فقط؛
  - كتلة الجدول: يُستخدم كـ "أعمدة مخصصة أخرى > JS Field" للعرض للقراءة فقط (إذا كنت بحاجة إلى عمود غير مرتبط بحقل، يرجى استخدام JS Column)؛

- النوع القابل للتحرير
  - كتلة النموذج (CreateForm/EditForm): يُستخدم لعناصر التحكم المخصصة للإدخال أو الإدخال المركب، ويخضع للتحقق والإرسال مع النموذج؛
  - السيناريوهات المناسبة: مكونات إدخال المكتبات الخارجية، محررات النصوص المنسقة/الأكواد، المكونات الديناميكية المعقدة، إلخ؛

## واجهة برمجة تطبيقات سياق وقت التشغيل (Runtime Context API)

يمكن لكود وقت التشغيل في JS Field استخدام قدرات السياق التالية مباشرة:

- `ctx.element`: حاوية DOM للحقل (ElementProxy)، تدعم `innerHTML` و `querySelector` و `addEventListener` وغيرها؛
- `ctx.value`: قيمة الحقل الحالية (للقراءة فقط)؛
- `ctx.record`: كائن السجل الحالي (للقراءة فقط)؛
- `ctx.collection`: المعلومات الوصفية للمجموعة (Collection) التي ينتمي إليها الحقل (للقراءة فقط)؛
- `ctx.requireAsync(url)`: تحميل مكتبات AMD/UMD بشكل غير متزامن حسب عنوان URL؛
- `ctx.importAsync(url)`: استيراد وحدات ESM ديناميكيًا حسب عنوان URL؛
- `ctx.openView(options)`: فتح عرض تم تكوينه مسبقًا (نافذة منبثقة/درج/صفحة)؛
- `ctx.i18n.t()` / `ctx.t()`: التدويل؛
- `ctx.onRefReady(ctx.ref, cb)`: الرندرة بعد جاهزية الحاوية؛
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: مكتبات مدمجة تشمل React / ReactDOM / Ant Design / أيقونات Ant Design / dayjs / lodash / math.js / formula.js وغيرها من المكتبات العامة، تُستخدم لرندرة JSX ومعالجة الوقت وعمليات البيانات والحسابات الرياضية. (لا تزال `ctx.React` / `ctx.ReactDOM` / `ctx.antd` محفوظة للتوافق.)
- `ctx.render(vnode)`: رندرة عنصر React أو سلسلة HTML أو عقدة DOM في الحاوية الافتراضية `ctx.element`؛ ستؤدي الرندرة المتكررة إلى إعادة استخدام Root وتغطية المحتوى الحالي للحاوية.

ميزات خاصة بالنوع القابل للتحرير (JSEditableField):

- `ctx.getValue()`: الحصول على قيمة النموذج الحالية (الأولوية لحالة النموذج، ثم العودة إلى props الحقل).
- `ctx.setValue(v)`: تعيين قيمة النموذج و props الحقل، مع الحفاظ على المزامنة ثنائية الاتجاه.
- حدث الحاوية `js-field:value-change`: يتم تشغيله عند تغيير القيمة الخارجية، مما يسهل على السكريبت تحديث عرض الإدخال.

## المحرر والمقتطفات

يدعم محرر سكريبت JS Field تمييز بناء الجملة، وتلميحات الأخطاء، ومقتطفات الأكواد المدمجة (Snippets).

- `Snippets`: يفتح قائمة مقتطفات الأكواد المدمجة، حيث يمكن البحث والإدراج بنقرة واحدة في موضع المؤشر الحالي.
- `Run`: تشغيل الكود الحالي مباشرة، وتُعرض سجلات التشغيل في لوحة `Logs` بالأسفل، مع دعم `console.log/info/warn/error` وتمييز موقع الخطأ.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

يمكن دمجه مع موظف الذكاء الاصطناعي لإنشاء الأكواد:

- [موظف الذكاء الاصطناعي · Nathan: مهندس واجهة أمامية](/ai-employees/features/built-in-employee)

## الاستخدامات الشائعة

### 1) الرندرة الأساسية (قراءة قيمة الحقل)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) استخدام JSX لرندرة مكونات React

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

### 4) النقر لفتح نافذة منبثقة/درج (openView)

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

### 5) الإدخال القابل للتحرير (JSEditableFieldModel)

```js
// رندرة إدخال بسيط باستخدام JSX ومزامنة قيمة النموذج
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

- يُنصح باستخدام CDN موثوق لتحميل المكتبات الخارجية، مع توفير معالجة لحالات الفشل (مثل `if (!lib) return;`).
- يُنصح باستخدام `class` أو `[name=...]` للمحددات، وتجنب استخدام `id` ثابت لمنع تكرار `id` في كتل أو نوافذ منبثقة متعددة.
- تنظيف الأحداث: قد يتم إعادة رندرة الحقل عدة مرات بسبب تغير البيانات أو تبديل العرض، لذا يجب تنظيف الأحداث أو إزالة التكرار قبل الربط لتجنب التشغيل المتكرر. يمكن "الإزالة أولاً ثم الإضافة".