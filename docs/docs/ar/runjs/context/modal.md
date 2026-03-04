:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/modal).
:::

# ctx.modal

واجهة برمجة تطبيقات (API) مختصرة تعتمد على Ant Design Modal، تُستخدم لفتح النوافذ المنبثقة (Modal) بشكل نشط في RunJS (تنبيهات المعلومات، نوافذ التأكيد، إلخ). يتم تنفيذها بواسطة `ctx.viewer` / نظام العرض.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock / JSField** | عرض نتائج العمليات، أو تنبيهات الأخطاء، أو التأكيدات الثانوية بعد تفاعل المستخدم. |
| **سير العمل / أحداث الإجراءات** | نافذة تأكيد منبثقة قبل الإرسال؛ إنهاء الخطوات اللاحقة عبر `ctx.exit()` في حال إلغاء المستخدم. |
| **قواعد الارتباط** | تنبيهات منبثقة للمستخدم عند فشل التحقق من الصحة. |

> ملاحظة: `ctx.modal` متاح في بيئات RunJS التي تحتوي على سياق عرض (مثل JSBlock داخل الصفحة، أو سير العمل، إلخ)؛ قد لا يكون موجوداً في الخلفية (backend) أو السياقات التي لا تحتوي على واجهة مستخدم. يُنصح باستخدام الاختيار الاختياري (optional chaining) عند الاستدعاء (`ctx.modal?.confirm?.()`).

## تعريف النوع (Type Definition)

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // يعيد true إذا نقر المستخدم على "موافق"، و false إذا ألغى العملية
};
```

تتوافق `ModalConfig` مع إعدادات الطرق الثابتة (static methods) لـ `Modal` في Ant Design.

## الطرق الشائعة

| الطريقة | القيمة المعادة | الوصف |
|------|--------|------|
| `info(config)` | `Promise<void>` | نافذة منبثقة للمعلومات |
| `success(config)` | `Promise<void>` | نافذة منبثقة للنجاح |
| `error(config)` | `Promise<void>` | نافذة منبثقة للخطأ |
| `warning(config)` | `Promise<void>` | نافذة منبثقة للتحذير |
| `confirm(config)` | `Promise<boolean>` | نافذة تأكيد؛ يعيد `true` عند النقر على "موافق" و `false` عند الإلغاء |

## معلمات التكوين (Configuration Parameters)

تتوافق مع `Modal` في Ant Design، وتشمل الحقول الشائعة:

| المعلمة | النوع | الوصف |
|------|------|------|
| `title` | `ReactNode` | العنوان |
| `content` | `ReactNode` | المحتوى |
| `okText` | `string` | نص زر الموافقة |
| `cancelText` | `string` | نص زر الإلغاء (في `confirm` فقط) |
| `onOk` | `() => void \| Promise<void>` | يُنفذ عند النقر على موافق |
| `onCancel` | `() => void` | يُنفذ عند النقر على إلغاء |

## العلاقة مع ctx.message و ctx.openView

| الغرض | الاستخدام الموصى به |
|------|----------|
| **تنبيه خفيف ومؤقت** | `ctx.message` (يختفي تلقائياً) |
| **نوافذ معلومات/نجاح/خطأ/تحذير** | `ctx.modal.info` / `success` / `error` / `warning` |
| **تأكيد ثانوي (يتطلب اختيار المستخدم)** | `ctx.modal.confirm` مع `ctx.exit()` للتحكم في التدفق |
| **تفاعلات معقدة مثل النماذج أو القوائم** | `ctx.openView` لفتح عرض مخصص (صفحة/درج/نافذة منبثقة) |

## أمثلة

### نافذة معلومات بسيطة

```ts
ctx.modal.info({
  title: 'تنبيه',
  content: 'تم اكتمال العملية',
});
```

### نافذة تأكيد والتحكم في التدفق

```ts
const confirmed = await ctx.modal.confirm({
  title: 'تأكيد الحذف',
  content: 'هل أنت متأكد أنك تريد حذف هذا السجل؟',
  okText: 'تأكيد',
  cancelText: 'إلغاء',
});
if (!confirmed) {
  ctx.exit();  // إنهاء الخطوات اللاحقة إذا ألغى المستخدم
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### نافذة تأكيد مع onOk

```ts
await ctx.modal.confirm({
  title: 'تأكيد الإرسال',
  content: 'لا يمكن تعديل التغييرات بعد الإرسال. هل تريد الاستمرار؟',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### تنبيه خطأ

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'نجاح', content: 'تمت العملية بنجاح' });
} catch (e) {
  ctx.modal.error({ title: 'خطأ', content: e.message });
}
```

## روابط ذات صلة

- [ctx.message](./message.md): تنبيه خفيف ومؤقت، يختفي تلقائياً.
- [ctx.exit()](./exit.md): يُستخدم عادةً كـ `if (!confirmed) ctx.exit()` لإنهاء التدفق عند إلغاء المستخدم للتأكيد.
- [ctx.openView()](./open-view.md): لفتح عرض مخصص، مناسب للتفاعلات المعقدة.