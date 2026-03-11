:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/interface-builder/fields/specific/js-item).
:::

# JS Item

## مقدمة

يُستخدم JS Item لـ "العناصر المخصصة" (غير المرتبطة بحقل) في النماذج. يمكنك استخدام JavaScript/JSX لعرض أي محتوى (تلميحات، إحصائيات، معاينة، أزرار، إلخ)، والتفاعل مع سياق النموذج والسجل، وهو مناسب لسيناريوهات مثل المعاينة في الوقت الفعلي، وتلميحات الشرح، ومكونات التفاعل الصغيرة.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## واجهة برمجة تطبيقات سياق وقت التشغيل (شائعة الاستخدام)

- `ctx.element`: حاوية DOM (ElementProxy) للعنصر الحالي، تدعم `innerHTML` و `querySelector` و `addEventListener` وما إلى ذلك؛
- `ctx.form`: مثيل AntD Form، يمكنه تنفيذ `getFieldValue / getFieldsValue / setFieldsValue / validateFields` وما إلى ذلك؛
- `ctx.blockModel`: نموذج كتلة النموذج الموجود فيها، يمكنه الاستماع إلى `formValuesChange` لتحقيق الربط؛
- `ctx.record` / `ctx.collection`: السجل الحالي ومعلومات تعريف المجموعة (متاحة في بعض السيناريوهات)؛
- `ctx.requireAsync(url)`: تحميل مكتبة AMD/UMD بشكل غير متزامن عبر URL؛
- `ctx.importAsync(url)`: استيراد وحدة ESM ديناميكيًا عبر URL؛
- `ctx.openView(viewUid, options)`: فتح عرض تم تكوينه (درج/مربع حوار/صفحة)؛
- `ctx.message` / `ctx.notification`: رسائل وإشعارات عالمية؛
- `ctx.t()` / `ctx.i18n.t()`: التدويل؛
- `ctx.onRefReady(ctx.ref, cb)`: العرض بعد جاهزية الحاوية؛
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: مكتبات React / ReactDOM / Ant Design / أيقونات Ant Design / dayjs / lodash / math.js / formula.js المضمنة، وتستخدم لعرض JSX ومعالجة الوقت ومعالجة البيانات والعمليات الحسابية. (لا يزال يتم الاحتفاظ بـ `ctx.React` / `ctx.ReactDOM` / `ctx.antd` للتوافق.)
- `ctx.render(vnode)`: عرض عنصر React/HTML/DOM في الحاوية الافتراضية `ctx.element`؛ ستعيد عمليات العرض المتعددة استخدام Root وتغطي المحتوى الحالي للحاوية.

## المحرر والمقتطفات

- `Snippets`: يفتح قائمة مقتطفات التعليمات البرمجية المضمنة، والتي يمكن البحث فيها وإدراجها بنقرة واحدة في موضع المؤشر الحالي.
- `Run`: تشغيل الكود الحالي مباشرة، وإخراج سجلات التشغيل إلى لوحة `Logs` في الأسفل؛ يدعم `console.log/info/warn/error` وتحديد موقع الخطأ مع التمييز.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- يمكن دمجه مع موظف الذكاء الاصطناعي لإنشاء/تعديل السكربتات: [موظف الذكاء الاصطناعي · Nathan: مهندس واجهة أمامية](/ai-employees/features/built-in-employee)

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

- يُنصح باستخدام CDN موثوق لتحميل المكتبات الخارجية، ويجب التعامل مع حالات الفشل (مثل `if (!lib) return;`).
- يُنصح بإعطاء الأولوية لاستخدام `class` أو `[name=...]` للمحددات، وتجنب استخدام `id` ثابت لمنع تكرار الـ `id` في كتل أو نوافذ منبثقة متعددة.
- تنظيف الأحداث: ستؤدي التغييرات المتكررة في قيم النموذج إلى تشغيل عمليات عرض متعددة، لذا يجب تنظيف الأحداث أو إزالة التكرار قبل ربطها (مثل `remove` قبل `add` أو استخدام `{ once: true }` أو علامة `dataset` لمنع التكرار).

## الوثائق ذات الصلة

- [المتغيرات والسياق](/interface-builder/variables)
- [قواعد الربط](/interface-builder/linkage-rule)
- [العروض والنوافذ المنبثقة](/interface-builder/actions/types/view)