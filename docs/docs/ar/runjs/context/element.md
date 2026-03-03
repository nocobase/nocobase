:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/element).
:::

# ctx.element

مثيل من `ElementProxy` يشير إلى حاوية DOM الخاصة بصندوق الحماية (sandbox)، ويعمل كهدف رندرة (rendering target) افتراضي لـ `ctx.render()`. متاح في السيناريوهات التي تحتوي على حاوية رندرة مثل `JSBlock` و `JSField` و `JSItem` و `JSColumn`.

## السيناريوهات القابلة للتطبيق

| السيناريو | الوصف |
|------|------|
| **JSBlock** | حاوية DOM للكتلة، تُستخدم لرندرة محتوى الكتلة المخصص. |
| **JSField / JSItem / FormJSFieldItem** | حاوية الرندرة للحقل أو عنصر النموذج (عادةً ما تكون `<span>`). |
| **JSColumn** | حاوية DOM لخلية الجدول، تُستخدم لرندرة محتوى العمود المخصص. |

> ملاحظة: `ctx.element` متاح فقط في سياقات RunJS التي تحتوي على حاوية رندرة؛ في السيناريوهات التي لا تحتوي على سياق واجهة مستخدم (مثل المنطق البرمجي للخلفية)، قد يكون `undefined`. يُنصح بالتحقق من القيمة قبل الاستخدام.

## تعريف النوع

```typescript
element: ElementProxy | undefined;

// ElementProxy هو وكيل لـ HTMLElement الأصلي، يكشف عن واجهة برمجة تطبيقات آمنة
class ElementProxy {
  __el: HTMLElement;  // عنصر DOM الأصلي الداخلي (يتم الوصول إليه في حالات محددة فقط)
  innerHTML: string;  // يتم تنظيفه عبر DOMPurify عند القراءة أو الكتابة
  outerHTML: string; // كما ورد أعلاه
  appendChild(child: HTMLElement | string): void;
  // يتم تمرير طرق HTMLElement الأخرى (لا يُنصح باستخدامها مباشرة)
}
```

## المتطلبات الأمنية

**موصى به: يجب تنفيذ جميع عمليات الرندرة عبر `ctx.render()`.** تجنب استخدام واجهات برمجة تطبيقات DOM الخاصة بـ `ctx.element` مباشرة (مثل `innerHTML` و `appendChild` و `querySelector` وما إلى ذلك).

### لماذا يُنصح بـ ctx.render()

| الميزة | الوصف |
|------|------|
| **الأمان** | تحكم أمني مركزي لتجنب هجمات XSS وعمليات DOM غير الصحيحة. |
| **دعم React** | دعم كامل لـ JSX ومكونات React ودورات الحياة (lifecycles). |
| **وراثة السياق** | يرث تلقائيًا `ConfigProvider` الخاص بالتطبيق والسمات (themes) وما إلى ذلك. |
| **معالجة التعارضات** | يدير تلقائيًا إنشاء/إزالة جذور React لتجنب تضارب المثيلات المتعددة. |

### ❌ غير موصى به: التعامل المباشر مع ctx.element

```ts
// ❌ غير موصى به: استخدام واجهات برمجة تطبيقات ctx.element مباشرة
ctx.element.innerHTML = '<div>محتوى</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> تم إهمال `ctx.element.innerHTML`؛ يرجى استخدام `ctx.render()` بدلاً من ذلك.

### ✅ موصى به: استخدام ctx.render()

```ts
// ✅ رندرة مكون React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('مرحباً')}>
    <Button type="primary">انقر هنا</Button>
  </Card>
);

// ✅ رندرة سلسلة نصية HTML
ctx.render('<div style="padding:16px;">' + ctx.t('المحتوى') + '</div>');

// ✅ رندرة عقدة DOM
const div = document.createElement('div');
div.textContent = ctx.t('مرحباً');
ctx.render(div);
```

## حالة خاصة: كمرساة للنافذة المنبثقة (Popover Anchor)

عند الحاجة لفتح Popover باستخدام العنصر الحالي كمرساة (anchor)، يمكن الوصول إلى `ctx.element?.__el` للحصول على DOM الأصلي كـ `target`:

```ts
// يتطلب ctx.viewer.popover عنصر DOM أصلي كـ target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>محتوى منبثق</div>,
});
```

> استخدم `__el` فقط في مثل هذه السيناريوهات (استخدام الحاوية الحالية كمرساة)؛ ولا تقم بتعديل DOM مباشرة في الحالات الأخرى.

## العلاقة مع ctx.render

- إذا تم استدعاء `ctx.render(vnode)` بدون تمرير `container` كمعامل، فسيتم الرندرة داخل حاوية `ctx.element` افتراضيًا.
- إذا كان `ctx.element` مفقودًا ولم يتم توفير `container` أيضًا، فسيتم طرح خطأ.
- يمكن تحديد حاوية بشكل صريح: `ctx.render(vnode, customContainer)`.

## ملاحظات

- يُستخدم `ctx.element` كحاوية داخلية لـ `ctx.render()` فقط، ولا يُنصح بالوصول المباشر إلى خصائصه أو طرقه أو تعديلها.
- في السياقات التي لا تحتوي على حاوية رندرة، يكون `ctx.element` بقيمة `undefined`. تأكد من توفر الحاوية أو مرر `container` يدويًا قبل استدعاء `ctx.render()`.
- على الرغم من أن `innerHTML`/`outerHTML` في `ElementProxy` يتم تنظيفهما عبر DOMPurify، إلا أنه لا يزال يُنصح باستخدام `ctx.render()` لإدارة الرندرة بشكل موحد.

## ذات صلة

- [ctx.render](./render.md): رندرة المحتوى في حاوية
- [ctx.view](./view.md): متحكم العرض الحالي
- [ctx.modal](./modal.md): واجهة برمجة تطبيقات سريعة للنوافذ المشروطة (Modals)