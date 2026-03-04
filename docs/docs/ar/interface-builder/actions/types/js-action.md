:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/interface-builder/actions/types/js-action).
:::

# JS Action

## مقدمة

يُستخدم JS Action لتنفيذ JavaScript عند النقر على الزر، لتخصيص أي سلوك عمل. يمكن استخدامه في أشرطة أدوات النموذج، وأشرطة أدوات الجدول (على مستوى المجموعة)، وصفوف الجدول (على مستوى السجل)، وغيرها من المواقع، لتحقيق عمليات مثل التحقق، والتنبيهات، واستدعاء الواجهات، وفتح النوافذ المنبثقة/الأدراج، وتحديث البيانات.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## واجهة برمجة تطبيقات سياق وقت التشغيل (شائعة الاستخدام)

- `ctx.api.request(options)`: إرسال طلب HTTP؛
- `ctx.openView(viewUid, options)`: فتح عرض تم تكوينه (درج/مربع حوار/صفحة)؛
- `ctx.message` / `ctx.notification`: تنبيهات وإشعارات عالمية؛
- `ctx.t()` / `ctx.i18n.t()`: التدويل (Internationalization)؛
- `ctx.resource`: مورد بيانات سياق مستوى المجموعة (مثل شريط أدوات الجدول، يتضمن `getSelectedRows()` و `refresh()` وما إلى ذلك)؛
- `ctx.record`: سجل الصف الحالي لسياق مستوى السجل (مثل أزرار صفوف الجدول)؛
- `ctx.form`: مثيل AntD Form لسياق مستوى النموذج (مثل أزرار شريط أدوات النموذج)؛
- `ctx.collection`: معلومات التعريف للمجموعة الحالية؛
- يدعم محرر الأكواد مقتطفات `Snippets` والتشغيل المسبق `Run` (انظر أدناه).

- `ctx.requireAsync(url)`: تحميل مكتبات AMD/UMD بشكل غير متزامن عبر URL؛
- `ctx.importAsync(url)`: استيراد وحدات ESM ديناميكيًا عبر URL؛
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: مكتبات مدمجة مثل React / ReactDOM / Ant Design / أيقونات Ant Design / dayjs / lodash / math.js / formula.js وغيرها من المكتبات العامة، تُستخدم لتقديم JSX ومعالجة الوقت ومعالجة البيانات والعمليات الحسابية.

> تختلف المتغيرات المتاحة فعليًا حسب موقع الزر، وما سبق هو نظرة عامة على القدرات الشائعة.

## المحرر والمقتطفات

- `Snippets`: فتح قائمة مقتطفات الأكواد المدمجة، يمكن البحث عنها وإدراجها بنقرة واحدة في موضع المؤشر الحالي.
- `Run`: تشغيل الكود الحالي مباشرة، وإخراج سجلات التشغيل إلى لوحة `Logs` في الأسفل؛ يدعم `console.log/info/warn/error` وتحديد موقع الخطأ مع التمييز.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- يمكن دمجه مع موظف الذكاء الاصطناعي لإنشاء/تعديل السكربتات: [موظف الذكاء الاصطناعي · Nathan: مهندس واجهة أمامية](/ai-employees/features/built-in-employee)

## الاستخدامات الشائعة (أمثلة مبسطة)

### 1) طلب الواجهة والتنبيه

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) زر المجموعة: التحقق من التحديد والمعالجة

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: تنفيذ منطق العمل...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) زر السجل: قراءة سجل الصف الحالي

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) فتح عرض (درج/مربع حوار)

```js
const popupUid = ctx.model.uid + '-open'; // مرتبط بالزر الحالي للحفاظ على الاستقرار
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) تحديث البيانات بعد الإرسال

```js
// تحديث عام: الأولوية لموارد الجدول/القائمة، ثم مورد الكتلة التي يوجد بها النموذج
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## ملاحظات

- ثبات السلوك (Idempotency): تجنب عمليات الإرسال المتعددة الناتجة عن النقر المتكرر، يمكن إضافة مفتاح حالة في المنطق أو تعطيل الزر.
- معالجة الأخطاء: أضف try/catch لاستدعاءات الواجهة وقدم تنبيهات للمستخدم.
- ربط العرض: عند فتح نافذة منبثقة/درج عبر `ctx.openView` يُنصح بتمرير المعلمات صراحة، وتحديث المورد الأب بنشاط بعد نجاح الإرسال عند الضرورة.

## وثائق ذات صلة

- [المتغيرات والسياق](/interface-builder/variables)
- [قواعد الربط](/interface-builder/linkage-rule)
- [العروض والنوافذ المنبثقة](/interface-builder/actions/types/view)