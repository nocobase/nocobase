:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# عنصر JS

## مقدمة

يُستخدم عنصر JS للعناصر المخصصة (غير المرتبطة بحقل) في النموذج. يمكنك استخدام JavaScript/JSX لعرض أي محتوى (مثل التلميحات، الإحصائيات، المعاينات، الأزرار، وما إلى ذلك) والتفاعل مع سياق النموذج والسجل. إنه مناسب لسيناريوهات مثل المعاينات الفورية، والتلميحات الإرشادية، والمكونات التفاعلية الصغيرة.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## واجهة برمجة تطبيقات سياق وقت التشغيل (شائعة الاستخدام)

- `ctx.element`: حاوية DOM (ElementProxy) للعنصر الحالي، تدعم `innerHTML`، `querySelector`، `addEventListener`، وما إلى ذلك.
- `ctx.form`: مثيل نموذج AntD، يسمح بعمليات مثل `getFieldValue` / `getFieldsValue` / `setFieldsValue` / `validateFields`، وما إلى ذلك.
- `ctx.blockModel`: نموذج كتلة النموذج التي ينتمي إليها، ويمكنه الاستماع إلى `formValuesChange` لتنفيذ الربط.
- `ctx.record` / `ctx.collection`: السجل الحالي وبيانات تعريف المجموعة (متاحة في بعض السيناريوهات).
- `ctx.requireAsync(url)`: تحميل مكتبة AMD/UMD بشكل غير متزامن عبر URL.
- `ctx.importAsync(url)`: استيراد وحدة ESM ديناميكيًا عبر URL.
- `ctx.openView(viewUid, options)`: فتح عرض مُكوّن (درج/مربع حوار/صفحة).
- `ctx.message` / `ctx.notification`: رسالة وإشعار عامان.
- `ctx.t()` / `ctx.i18n.t()`: التدويل.
- `ctx.onRefReady(ctx.ref, cb)`: العرض بعد أن تصبح الحاوية جاهزة.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: مكتبات React و ReactDOM و Ant Design وأيقونات Ant Design و dayjs المضمنة، تُستخدم لعرض JSX وأدوات التاريخ والوقت. (يتم الاحتفاظ بـ `ctx.React` / `ctx.ReactDOM` / `ctx.antd` للتوافق).
- `ctx.render(vnode)`: يعرض عنصر React/HTML/DOM إلى الحاوية الافتراضية `ctx.element`. ستعيد عمليات العرض المتعددة استخدام الجذر وتتجاوز المحتوى الحالي للحاوية.

## المحرر والمقتطفات

- `Snippets`: يفتح قائمة بمقتطفات التعليمات البرمجية المضمنة، مما يتيح لك البحث عنها وإدراجها في موضع المؤشر الحالي بنقرة واحدة.
- `Run`: ينفذ التعليمات البرمجية الحالية مباشرةً ويُخرج سجلات التنفيذ إلى لوحة `Logs` في الأسفل. يدعم `console.log/info/warn/error` وتمييز الأخطاء.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- يمكن استخدامه مع موظف الذكاء الاصطناعي لإنشاء/تعديل السكربتات: [موظف الذكاء الاصطناعي · ناثان: مهندس واجهة أمامية](/ai-employees/built-in/ai-coding)

## الاستخدامات الشائعة (أمثلة مبسطة)

### 1) معاينة فورية (قراءة قيم النموذج)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) فتح عرض (درج)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) تحميل وعرض المكتبات الخارجية

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## ملاحظات

- يُوصى باستخدام شبكة توصيل محتوى (CDN) موثوقة لتحميل المكتبات الخارجية، ويجب توفير حل بديل لسيناريوهات الفشل (مثل `if (!lib) return;`).
- يُوصى بإعطاء الأولوية لاستخدام `class` أو `[name=...]` للمُحدِّدات وتجنب استخدام `id` ثابتة لمنع تكرار `id` في كتل/نوافذ منبثقة متعددة.
- ستؤدي التغييرات المتكررة في قيم النموذج إلى تشغيل عمليات عرض متعددة. قبل ربط حدث، يجب تنظيفه أو إزالة التكرار منه (على سبيل المثال، `remove` قبل `add`، أو استخدام `{ once: true }`، أو استخدام سمة `dataset` لمنع التكرار).

## الوثائق ذات الصلة

- [المتغيرات والسياق](/interface-builder/variables)
- [قواعد الربط](/interface-builder/linkage-rule)
- [العروض والنوافذ المنبثقة](/interface-builder/actions/types/view)