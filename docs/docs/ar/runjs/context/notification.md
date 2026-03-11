:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/notification).
:::

# ctx.notification

واجهة برمجة تطبيقات (API) عالمية للإشعارات تعتمد على Ant Design Notification، تُستخدم لعرض لوحات الإشعارات في **الزاوية العلوية اليمنى** من الصفحة. مقارنةً بـ `ctx.message`؛ يمكن أن تتضمن الإشعارات عنواناً ووصفاً، مما يجعلها مناسبة للمحتوى الذي يحتاج إلى العرض لفترة أطول أو يتطلب انتباه المستخدم.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock / أحداث الإجراءات** | إشعارات إتمام المهام، نتائج العمليات الجماعية، إتمام التصدير، إلخ. |
| **سير العمل (FlowEngine)** | تنبيهات على مستوى النظام بعد انتهاء العمليات غير المتزامنة. |
| **محتوى يتطلب عرضاً أطول** | إشعارات كاملة تحتوي على عناوين وأوصاف وأزرار إجراءات. |

## تعريف النوع

```ts
notification: NotificationInstance;
```

`NotificationInstance` هي واجهة إشعارات Ant Design، وتوفر الطرق التالية.

## الطرق الشائعة

| الطريقة | الوصف |
|------|------|
| `open(config)` | فتح إشعار بتكوين مخصص |
| `success(config)` | عرض إشعار من نوع "نجاح" |
| `info(config)` | عرض إشعار من نوع "معلومات" |
| `warning(config)` | عرض إشعار من نوع "تحذير" |
| `error(config)` | عرض إشعار من نوع "خطأ" |
| `destroy(key?)` | إغلاق الإشعار ذو المفتاح (key) المحدد؛ إذا لم يتم تمرير مفتاح، يتم إغلاق جميع الإشعارات |

**معلمات التكوين** (متوافقة مع [Ant Design notification](https://ant.design/components/notification)):

| المعلمة | النوع | الوصف |
|------|------|------|
| `message` | `ReactNode` | عنوان الإشعار |
| `description` | `ReactNode` | وصف الإشعار |
| `duration` | `number` | تأخير الإغلاق التلقائي (بالثواني). الافتراضي 4.5 ثانية؛ تعيينه إلى 0 يعني عدم الإغلاق تلقائياً |
| `key` | `string` | معرف فريد للإشعار، يُستخدم في `destroy(key)` لإغلاق إشعار محدد |
| `onClose` | `() => void` | وظيفة استدعاء (callback) عند إغلاق الإشعار |
| `placement` | `string` | الموقع: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## أمثلة

### الاستخدام الأساسي

```ts
ctx.notification.open({
  message: 'تمت العملية بنجاح',
  description: 'تم حفظ البيانات في الخادم.',
});
```

### استدعاء سريع حسب النوع

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### تخصيص المدة والمفتاح (key)

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // لا يغلق تلقائياً
});

// إغلاق يدوي بعد إتمام المهمة
ctx.notification.destroy('task-123');
```

### إغلاق جميع الإشعارات

```ts
ctx.notification.destroy();
```

## الفرق بينه وبين ctx.message

| الميزة | ctx.message | ctx.notification |
|------|--------------|------------------|
| **الموقع** | أعلى منتصف الصفحة | الزاوية العلوية اليمنى (قابل للتكوين) |
| **الهيكل** | تلميح خفيف من سطر واحد | يتضمن عنواناً + وصفاً |
| **الغرض** | ملاحظات مؤقتة، تختفي تلقائياً | إشعار كامل، يمكن عرضه لفترة طويلة |
| **سيناريوهات نموذجية** | نجاح العملية، فشل التحقق، نجاح النسخ | إتمام المهام، رسائل النظام، محتوى أطول يتطلب انتباه المستخدم |

## ذات صلة

- [ctx.message](./message.md) - تلميح خفيف علوي، مناسب للملاحظات السريعة
- [ctx.modal](./modal.md) - نافذة تأكيد منبثقة، تفاعل يحجب الواجهة
- [ctx.t()](./t.md) - التدويل (Internationalization)، غالباً ما يُستخدم مع الإشعارات