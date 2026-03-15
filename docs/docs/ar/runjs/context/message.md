:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/message).
:::

# ctx.message

واجهة برمجة تطبيقات الرسائل (message API) العالمية من Ant Design، تُستخدم لعرض تنبيهات خفيفة مؤقتة في أعلى وسط الصفحة. تُغلق الرسائل تلقائيًا بعد فترة زمنية معينة أو يمكن للمستخدم إغلاقها يدويًا.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | ملاحظات العمليات، تنبيهات التحقق، نجاح النسخ، وغيرها من التنبيهات الخفيفة |
| **عمليات النماذج / سير العمل** | ملاحظات حول نجاح الإرسال، فشل الحفظ، فشل التحقق، إلخ. |
| **أحداث الإجراءات (JSAction)** | ملاحظات فورية للنقرات، إتمام العمليات الجماعية، إلخ. |

## تعريف النوع

```ts
message: MessageInstance;
```

`MessageInstance` هي واجهة رسائل Ant Design، وتوفر الطرق التالية.

## الطرق الشائعة

| الطريقة | الوصف |
|------|------|
| `success(content, duration?)` | عرض تنبيه نجاح |
| `error(content, duration?)` | عرض تنبيه خطأ |
| `warning(content, duration?)` | عرض تنبيه تحذير |
| `info(content, duration?)` | عرض تنبيه معلومات |
| `loading(content, duration?)` | عرض تنبيه تحميل (يجب إغلاقه يدويًا) |
| `open(config)` | فتح رسالة باستخدام تكوين مخصص |
| `destroy()` | إغلاق جميع الرسائل المعروضة حاليًا |

**المعاملات:**

- `content` (`string` \| `ConfigOptions`): محتوى الرسالة أو كائن التكوين.
- `duration` (`number`، اختياري): تأخير الإغلاق التلقائي (بالثواني)، الافتراضي 3 ثوانٍ؛ اضبطه على 0 لتعطيل الإغلاق التلقائي.

**ConfigOptions** (عندما يكون `content` كائنًا):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // محتوى الرسالة
  duration?: number;        // تأخير الإغلاق التلقائي (بالثواني)
  onClose?: () => void;    // دالة استدعاء عند الإغلاق
  icon?: React.ReactNode;  // أيقونة مخصصة
}
```

## أمثلة

### الاستخدام الأساسي

```ts
ctx.message.success('تمت العملية بنجاح');
ctx.message.error('فشلت العملية');
ctx.message.warning('يرجى اختيار البيانات أولاً');
ctx.message.info('جاري المعالجة...');
```

### التدويل باستخدام ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### التحميل والإغلاق اليدوي

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// تنفيذ عملية غير متزامنة
await saveData();
hide();  // إغلاق تنبيه التحميل يدويًا
ctx.message.success(ctx.t('Saved'));
```

### استخدام open لتكوين مخصص

```ts
ctx.message.open({
  type: 'success',
  content: 'تنبيه نجاح مخصص',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### إغلاق جميع الرسائل

```ts
ctx.message.destroy();
```

## الفرق بين ctx.message و ctx.notification

| الميزة | ctx.message | ctx.notification |
|------|--------------|------------------|
| **الموقع** | أعلى وسط الصفحة | الزاوية العلوية اليمنى |
| **الغرض** | تنبيه خفيف مؤقت، يختفي تلقائيًا | لوحة إشعارات، يمكن أن تتضمن عنوانًا ووصفًا، مناسبة للعرض لفترة أطول |
| **السيناريوهات النموذجية** | ملاحظات العمليات، تنبيهات التحقق، نجاح النسخ | إشعارات إتمام المهام، رسائل النظام، المحتوى الطويل الذي يتطلب انتباه المستخدم |

## ذات صلة

- [ctx.notification](./notification.md) - إشعارات الزاوية العلوية اليمنى، مناسبة لفترات العرض الطويلة.
- [ctx.modal](./modal.md) - نافذة منبثقة للتأكيد، تفاعل مانع (blocking).
- [ctx.t()](./t.md) - التدويل، تُستخدم عادةً مع message.