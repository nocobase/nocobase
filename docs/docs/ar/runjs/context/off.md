:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/off).
:::

# ctx.off()

يزيل مستمعي الأحداث المسجلين عبر `ctx.on(eventName, handler)`. يُستخدم غالباً بالاقتران مع [ctx.on](./on.md) لإلغاء الاشتراك في الوقت المناسب، مما يمنع تسرب الذاكرة أو التكرار في تشغيل الأحداث.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **تنظيف React useEffect** | يتم استدعاؤه داخل وظيفة التنظيف (cleanup) في `useEffect` لإزالة المستمعين عند إلغاء تثبيت المكون (unmount). |
| **JSField / JSEditableField** | إلغاء الاشتراك من `js-field:value-change` أثناء ربط البيانات ثنائي الاتجاه للحقول. |
| **ما يتعلق بالمورد (resource)** | إلغاء الاشتراك من المستمعين مثل `refresh` أو `saved` المسجلين عبر `ctx.resource.on`. |

## تعريف النوع

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## أمثلة

### الاستخدام المقترن في React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### إلغاء الاشتراك من أحداث المورد

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// في الوقت المناسب
ctx.resource?.off('refresh', handler);
```

## ملاحظات

1. **اتساق مرجع الـ handler**: يجب أن يكون الـ `handler` الممرر إلى `ctx.off` هو نفس المرجع المستخدم في `ctx.on`؛ وإلا فلن يتمكن النظام من إزالته بشكل صحيح.
2. **التنظيف في الوقت المناسب**: قم باستدعاء `ctx.off` قبل إلغاء تثبيت المكون أو تدمير السياق (context) لتجنب تسرب الذاكرة.

## وثائق ذات صلة

- [ctx.on](./on.md) - الاشتراك في الأحداث
- [ctx.resource](./resource.md) - مثيل المورد وطرق `on`/`off` الخاصة به