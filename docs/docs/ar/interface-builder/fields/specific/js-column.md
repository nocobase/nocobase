:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# عمود JS

## مقدمة

يُستخدم عمود JS لـ "الأعمدة المخصصة" في الجداول، حيث يقوم بعرض محتوى كل خلية في الصف باستخدام JavaScript. لا يرتبط بحقل معين، وهو مناسب لسيناريوهات مثل الأعمدة المشتقة، والعروض المجمعة عبر الحقول، وشارات الحالة، وأزرار الإجراءات، وتجميع البيانات عن بُعد.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## واجهة برمجة تطبيقات السياق في وقت التشغيل (Runtime Context API)

عند عرض كل خلية، توفر JS Column واجهات برمجة التطبيقات (APIs) السياقية التالية:

- `ctx.element`: حاوية DOM للخلية الحالية (ElementProxy)، تدعم `innerHTML` و `querySelector` و `addEventListener` وما إلى ذلك.
- `ctx.record`: كائن سجل الصف الحالي (للقراءة فقط).
- `ctx.recordIndex`: فهرس الصف ضمن الصفحة الحالية (يبدأ من 0، وقد يتأثر بالترقيم).
- `ctx.collection`: البيانات الوصفية لـ `مجموعة` المرتبطة بالجدول (للقراءة فقط).
- `ctx.requireAsync(url)`: يُحمّل مكتبة AMD/UMD بشكل غير متزامن عبر URL.
- `ctx.importAsync(url)`: يستورد وحدة ESM ديناميكيًا عبر URL.
- `ctx.openView(options)`: يفتح عرضًا مُكوّنًا (نافذة منبثقة/درج/صفحة).
- `ctx.i18n.t()` / `ctx.t()`: للتعريب (Internationalization).
- `ctx.onRefReady(ctx.ref, cb)`: يعرض بعد أن تصبح الحاوية جاهزة.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: مكتبات React و ReactDOM و Ant Design وأيقونات Ant Design و dayjs المضمنة للاستخدام في عرض JSX وأدوات التاريخ والوقت. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` محتفظ بها للتوافق).
- `ctx.render(vnode)`: يعرض عنصر React/HTML/DOM إلى الحاوية الافتراضية `ctx.element` (الخلية الحالية). عمليات العرض المتعددة ستعيد استخدام الجذر وتتجاوز المحتوى الحالي للحاوية.

## المحرر والمقتطفات

يدعم محرر نصوص JS Column تمييز بناء الجملة، وتلميحات الأخطاء، ومقتطفات التعليمات البرمجية المضمنة (Snippets).

- `Snippets`: يفتح قائمة مقتطفات التعليمات البرمجية المضمنة، مما يتيح لك البحث عنها وإدراجها في موضع المؤشر الحالي بنقرة واحدة.
- `Run`: يشغل التعليمات البرمجية الحالية مباشرةً. يتم إخراج سجل التنفيذ إلى لوحة `Logs` في الأسفل، ويدعم `console.log/info/warn/error` وتمييز الأخطاء.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

يمكنك أيضًا استخدام موظف AI لإنشاء التعليمات البرمجية:

- [موظف AI · ناثان: مهندس واجهة أمامية](/ai-employees/built-in/ai-coding)

## الاستخدامات الشائعة

### 1) العرض الأساسي (قراءة سجل الصف الحالي)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) استخدام JSX لعرض مكونات React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) فتح نافذة منبثقة/درج من خلية (عرض/تحرير)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>عرض</a>
);
```

### 4) تحميل مكتبات الطرف الثالث (AMD/UMD أو ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## ملاحظات

- يُوصى باستخدام شبكة توصيل محتوى (CDN) موثوقة لتحميل المكتبات الخارجية، وتوفير حلول بديلة لسيناريوهات الفشل (مثل `if (!lib) return;`).
- يُوصى باستخدام محددات `class` أو `[name=...]` بدلاً من `id` الثابتة لمنع تكرار `id` عبر الكتل المتعددة أو النوافذ المنبثقة.
- تنظيف الأحداث: قد تتغير صفوف الجدول ديناميكيًا مع الترقيم أو التحديث، مما يتسبب في إعادة عرض الخلايا عدة مرات. يجب تنظيف أو إزالة تكرار مستمعي الأحداث قبل ربطها لتجنب التكرار في التشغيل.
- نصيحة للأداء: تجنب تحميل المكتبات الكبيرة بشكل متكرر في كل خلية. بدلاً من ذلك، قم بتخزين المكتبة مؤقتًا في مستوى أعلى (مثل استخدام متغير عام أو متغير على مستوى الجدول) ثم أعد استخدامها.