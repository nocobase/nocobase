:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/on).
:::

# ctx.on()

الاشتراك في أحداث السياق (مثل تغييرات قيم الحقول، تغييرات الخصائص، تحديثات الموارد، إلخ) في RunJS. تُربط الأحداث بأحداث DOM مخصصة على `ctx.element` أو بناقل أحداث داخلي لـ `ctx.resource` بناءً على نوعها.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSField / JSEditableField** | الاستماع لتغييرات قيمة الحقل من مصادر خارجية (النماذج، الارتباطات، إلخ) لتحديث واجهة المستخدم بشكل متزامن، مما يحقق الربط ثنائي الاتجاه (two-way binding). |
| **JSBlock / JSItem / JSColumn** | الاستماع للأحداث المخصصة على الحاوية للاستجابة لتغييرات البيانات أو الحالة. |
| **resource (الموارد)** | الاستماع لأحداث دورة حياة المورد مثل التحديث أو الحفظ لتنفيذ منطق معين بعد تحديث البيانات. |

## تعريف النوع

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## الأحداث الشائعة

| اسم الحدث | الوصف | مصدر الحدث |
|--------|------|----------|
| `js-field:value-change` | تم تعديل قيمة الحقل خارجيًا (مثل ارتباط النموذج، تحديث القيمة الافتراضية) | CustomEvent على `ctx.element`؛ حيث `ev.detail` هي القيمة الجديدة |
| `resource:refresh` | تم تحديث بيانات المورد | ناقل أحداث `ctx.resource` |
| `resource:saved` | اكتملت عملية حفظ المورد | ناقل أحداث `ctx.resource` |

> قواعد ربط الأحداث: الأحداث التي تبدأ بـ `:resource` تمر عبر `ctx.resource.on`، بينما تمر الأحداث الأخرى عادةً عبر أحداث DOM على `ctx.element` (إذا كان موجودًا).

## أمثلة

### الربط ثنائي الاتجاه للحقل (React useEffect + التنظيف)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### الاستماع لـ DOM الأصلي (بديل عند عدم توفر ctx.on)

```ts
// عند عدم توفر ctx.on، يمكنك استخدام ctx.element مباشرة
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// عند التنظيف: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### تحديث واجهة المستخدم بعد تحديث المورد

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // تحديث العرض بناءً على البيانات
});
```

## التنسيق مع ctx.off

- يجب إزالة المستمعين المسجلين باستخدام `ctx.on` في الوقت المناسب عبر [ctx.off](./off.md) لتجنب تسرب الذاكرة (memory leaks) أو تكرار الاستدعاء.
- في React، عادةً ما يتم استدعاء `ctx.off` داخل دالة التنظيف (cleanup function) لـ `useEffect`.
- قد لا يكون `ctx.off` موجودًا؛ لذا يُنصح باستخدام التسلسل الاختياري (optional chaining): `ctx.off?.('eventName', handler)`.

## ملاحظات

1. **الإلغاء المقترن**: يجب أن يقابل كل `ctx.on(eventName, handler)` استدعاء لـ `ctx.off(eventName, handler)`، ويجب أن يكون مرجع الـ `handler` الممرر متطابقًا تمامًا.
2. **دورة الحياة**: قم بإزالة المستمعين قبل إلغاء تثبيت المكون (unmount) أو تدمير السياق لمنع تسرب الذاكرة.
3. **توفر الأحداث**: تدعم أنواع السياق المختلفة أحداثًا مختلفة. يرجى مراجعة وثائق كل مكون للحصول على التفاصيل.

## وثائق ذات صلة

- [ctx.off](./off.md) - إزالة مستمعي الأحداث
- [ctx.element](./element.md) - حاوية العرض وأحداث DOM
- [ctx.resource](./resource.md) - مثيل المورد وطرق `on`/`off` الخاصة به
- [ctx.setValue](./set-value.md) - تعيين قيمة الحقل (يؤدي إلى إطلاق `js-field:value-change`)