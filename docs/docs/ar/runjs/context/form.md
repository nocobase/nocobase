:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/form).
:::

# ctx.form

مثيل Ant Design Form داخل الكتلة الحالية، يُستخدم لقراءة وكتابة حقول النموذج، وتفعيل التحقق من الصحة (validation) والإرسال. يعادل `ctx.blockModel?.form` ويمكن استخدامه مباشرة في الكتل المتعلقة بالنماذج (Form، EditForm، النماذج الفرعية، إلخ).

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSField** | قراءة/كتابة حقول النموذج الأخرى لتحقيق الارتباط (linkage)، أو إجراء الحسابات والتحقق بناءً على قيم الحقول الأخرى. |
| **JSItem** | قراءة/كتابة الحقول في نفس الصف أو الحقول الأخرى داخل عناصر الجداول الفرعية لتحقيق الارتباط داخل الجدول. |
| **JSColumn** | قراءة قيم الصف الحالي أو الحقول المرتبطة في عمود الجدول لأغراض العرض (rendering). |
| **عمليات النموذج / تدفق الأحداث** | التحقق قبل الإرسال، تحديث الحقول بالجملة، إعادة تعيين النموذج، إلخ. |

> ملاحظة: `ctx.form` متاح فقط في سياقات RunJS المتعلقة بكتل النماذج (Form، EditForm، النماذج الفرعية، إلخ). قد لا يكون موجوداً في السيناريوهات غير المتعلقة بالنماذج (مثل كتل JSBlock المستقلة أو كتل الجداول). يُنصح بالتحقق من وجود القيمة قبل الاستخدام: `ctx.form?.getFieldsValue()`.

## تعريف النوع

```ts
form: FormInstance<any>;
```

`FormInstance` هو نوع المثيل لـ Ant Design Form. الطرق الشائعة هي كما يلي.

## الطرق الشائعة

### قراءة قيم النموذج

```ts
// قراءة قيم الحقول المسجلة حالياً (افتراضياً تشمل الحقول التي تم تصييرها فقط)
const values = ctx.form.getFieldsValue();

// قراءة قيم جميع الحقول (بما في ذلك الحقول المسجلة ولكن لم يتم تصييرها، مثل الحقول المخفية أو داخل الأقسام المطوية)
const allValues = ctx.form.getFieldsValue(true);

// قراءة حقل واحد
const email = ctx.form.getFieldValue('email');

// قراءة الحقول المتداخلة (مثل الجداول الفرعية)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### كتابة قيم النموذج

```ts
// تحديث بالجملة (يُستخدم غالباً للارتباط)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// تحديث حقل واحد
ctx.form.setFieldValue('remark', 'تمت إضافة ملاحظة');
```

### التحقق والإرسال

```ts
// تفعيل التحقق من صحة الحقول
await ctx.form.validateFields();

// تفعيل إرسال النموذج
ctx.form.submit();
```

### إعادة التعيين

```ts
// إعادة تعيين جميع الحقول
ctx.form.resetFields();

// إعادة تعيين حقول محددة فقط
ctx.form.resetFields(['status', 'remark']);
```

## العلاقة مع السياقات (contexts) ذات الصلة

### ctx.getValue / ctx.setValue

| السيناريو | الاستخدام الموصى به |
|------|----------|
| **قراءة/كتابة الحقل الحالي** | `ctx.getValue()` / `ctx.setValue(v)` |
| **قراءة/كتابة الحقول الأخرى** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

داخل حقل JS الحالي، الأولوية لاستخدام `getValue`/`setValue` لقراءة وكتابة الحقل نفسه؛ واستخدم `ctx.form` عندما تحتاج للوصول إلى حقول أخرى.

### ctx.blockModel

| المتطلبات | الاستخدام الموصى به |
|------|----------|
| **قراءة/كتابة حقول النموذج** | `ctx.form` (يعادل `ctx.blockModel?.form` وهو أكثر ملاءمة) |
| **الوصول إلى الكتلة الأب** | `ctx.blockModel` (يحتوي على `collection` و `resource` إلخ) |

### ctx.getVar('ctx.formValues')

يجب الحصول على قيم النموذج عبر `await ctx.getVar('ctx.formValues')` ولا يتم عرضها مباشرة كـ `ctx.formValues`. في سياق النموذج، يُفضل استخدام `ctx.form.getFieldsValue()` للقراءة الفورية لأحدث القيم.

## ملاحظات

- تعيد `getFieldsValue()` الحقول التي تم تصييرها (rendered) فقط افتراضياً؛ الحقول غير المصيرة (مثل الأقسام المطوية أو المخفية بقواعد شرطية) تتطلب تمرير `true`: `getFieldsValue(true)`.
- مسارات الحقول المتداخلة مثل الجداول الفرعية تكون على شكل مصفوفة، مثل `['orders', 0, 'amount']`. يمكنك استخدام `ctx.namePath` للحصول على مسار الحقل الحالي واستخدامه لبناء مسارات للأعمدة الأخرى في نفس الصف.
- ترمي `validateFields()` كائن خطأ يحتوي على معلومات مثل `errorFields`. عند فشل التحقق قبل الإرسال، يمكنك استخدام `ctx.exit()` لإنهاء الخطوات اللاحقة.
- في السيناريوهات غير المتزامنة مثل تدفق الأحداث أو قواعد الارتباط، قد لا يكون `ctx.form` جاهزاً بعد، لذا يُنصح باستخدام الاختيار الاختياري (optional chaining) أو التحقق من وجود القيمة.

## أمثلة

### ارتباط الحقول: عرض محتوى مختلف بناءً على النوع

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### حساب الحقل الحالي بناءً على حقول أخرى

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### القراءة والكتابة من أعمدة أخرى في نفس الصف داخل جدول فرعي

```ts
// ctx.namePath هو مسار الحقل الحالي في النموذج، مثل ['orders', 0, 'amount']
// قراءة 'status' في نفس الصف: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### التحقق قبل الإرسال

```ts
try {
  await ctx.form.validateFields();
  // نجح التحقق، تابع منطق الإرسال
} catch (e) {
  ctx.message.error('يرجى التحقق من صحة بيانات النموذج');
  ctx.exit();
}
```

### الإرسال بعد التأكيد

```ts
const confirmed = await ctx.modal.confirm({
  title: 'تأكيد الإرسال',
  content: 'لن تتمكن من التعديل بعد الإرسال، هل تريد الاستمرار؟',
  okText: 'تأكيد',
  cancelText: 'إلغاء',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // إنهاء العملية عند إلغاء المستخدم
}
```

## مواضيع ذات صلة

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): قراءة وكتابة قيمة الحقل الحالي.
- [ctx.blockModel](./block-model.md): نموذج الكتلة الأب، `ctx.form` يعادل `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): نوافذ التأكيد المنبثقة، تُستخدم غالباً مع `ctx.form.validateFields()` و `ctx.form.submit()`.
- [ctx.exit()](./exit.md): إنهاء العملية عند فشل التحقق أو إلغاء المستخدم.
- `ctx.namePath`: مسار الحقل الحالي في النموذج (مصفوفة)، يُستخدم لبناء الأسماء لـ `getFieldValue` / `setFieldValue` في الحقول المتداخلة.