:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# إجراء JS (JS Action)

## مقدمة

يُستخدم إجراء JS (JS Action) لتنفيذ JavaScript عند النقر على زر، مما يتيح تخصيص أي سلوك عمل. يمكن استخدامه في أشرطة أدوات النماذج، وأشرطة أدوات الجداول (على مستوى المجموعة)، وصفوف الجداول (على مستوى السجل)، ومواقع أخرى لتنفيذ عمليات مثل التحقق من الصحة، وعرض الإشعارات، وإجراء استدعاءات API، وفتح النوافذ المنبثقة/الأدراج، وتحديث البيانات.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## واجهة برمجة تطبيقات سياق وقت التشغيل (شائعة الاستخدام)

- `ctx.api.request(options)`: لإجراء طلب HTTP.
- `ctx.openView(viewUid, options)`: لفتح عرض مُكوّن (درج/مربع حوار/صفحة).
- `ctx.message` / `ctx.notification`: للرسائل والإشعارات العامة.
- `ctx.t()` / `ctx.i18n.t()`: للتعريب (Internationalization).
- `ctx.resource`: مصدر البيانات لسياق مستوى المجموعة (مثل شريط أدوات الجدول)، ويتضمن دوال مثل `getSelectedRows()` و `refresh()`.
- `ctx.record`: سجل الصف الحالي لسياق مستوى السجل (مثل زر صف الجدول).
- `ctx.form`: مثيل نموذج AntD لسياق مستوى النموذج (مثل زر شريط أدوات النموذج).
- `ctx.collection`: البيانات الوصفية للمجموعة الحالية.
- يدعم محرر الأكواد `Snippets` (المقتطفات) و `Run` (التشغيل المسبق) (انظر أدناه).

- `ctx.requireAsync(url)`: لتحميل مكتبة AMD/UMD بشكل غير متزامن عبر URL.
- `ctx.importAsync(url)`: لاستيراد وحدة ESM ديناميكيًا عبر URL.

> قد تختلف المتغيرات المتاحة فعليًا بناءً على موقع الزر. القائمة أعلاه هي نظرة عامة على الإمكانيات الشائعة.

## المحرر والمقتطفات

- `Snippets`: يفتح قائمة بمقتطفات الأكواد المضمنة، والتي يمكن البحث عنها وإدراجها بنقرة واحدة في موضع المؤشر الحالي.
- `Run`: يقوم بتنفيذ الكود الحالي مباشرةً ويُخرج سجلات التشغيل إلى لوحة `Logs` السفلية؛ يدعم `console.log/info/warn/error` وتحديد الأخطاء بإبرازها.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- يمكنك استخدام موظفي الذكاء الاصطناعي لإنشاء/تعديل السكربتات: [موظف الذكاء الاصطناعي · ناثان: مهندس واجهة أمامية](/ai-employees/built-in/ai-coding)

## الاستخدامات الشائعة (أمثلة مبسطة)

### 1) طلب API وإشعار

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
// TODO: Implement business logic...
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
const popupUid = ctx.model.uid + '-open'; // Bind to the current button for stability
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) تحديث البيانات بعد الإرسال

```js
// General refresh: Prioritize table/list resources, then the resource of the block containing the form
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## ملاحظات

- **إجراءات متكررة النتائج (Idempotent Actions)**: لتجنب عمليات الإرسال المتعددة الناتجة عن النقرات المتكررة، يمكنك إضافة علامة حالة في منطقك أو تعطيل الزر.
- **معالجة الأخطاء**: أضف كتل `try/catch` لاستدعاءات API وقدم ملاحظات سهلة الاستخدام للمستخدم.
- **تفاعل العرض**: عند فتح نافذة منبثقة/درج باستخدام `ctx.openView`، يُنصح بتمرير المعلمات بشكل صريح، وإذا لزم الأمر، تحديث المصدر الأصلي بشكل فعال بعد الإرسال الناجح.

## وثائق ذات صلة

- [المتغيرات والسياق](/interface-builder/variables)
- [قواعد الربط](/interface-builder/linkage-rule)
- [العروض والنوافذ المنبثقة](/interface-builder/actions/types/view)