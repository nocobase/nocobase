:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

الـ Resource الموجه نحو **سجل واحد**: البيانات عبارة عن كائن واحد، يدعم الجلب بواسطة المفتاح الأساسي، الإنشاء/التحديث (save)، والحذف. هذا النوع مناسب لسيناريوهات "السجل الواحد" مثل التفاصيل والنماذج. على عكس [MultiRecordResource](./multi-record-resource.md)، فإن دالة `getData()` في `SingleRecordResource` تعيد كائناً واحداً، ويتم تحديد المفتاح الأساسي عبر `setFilterByTk(id)`، بينما يقوم `save()` باستدعاء `create` أو `update` تلقائياً بناءً على حالة `isNewRecord`.

**علاقة الوراثة**: FlowResource ← APIResource ← BaseRecordResource ← SingleRecordResource.

**طريقة الإنشاء**: `ctx.makeResource('SingleRecordResource')` أو `ctx.initResource('SingleRecordResource')`. يجب استدعاء `setResourceName('اسم المجموعة')` قبل الاستخدام؛ وعند إجراء عمليات بناءً على المفتاح الأساسي، يجب استدعاء `setFilterByTk(id)`. في RunJS، يتم حقن `ctx.api` بواسطة بيئة التشغيل.

---

## سيناريوهات الاستخدام

| السيناريو | الوصف |
|------|------|
| **كتلة التفاصيل** | تستخدم كتلة التفاصيل (Details block) الـ `SingleRecordResource` افتراضياً لتحميل سجل واحد بواسطة مفتاحه الأساسي. |
| **كتلة النموذج** | تستخدم نماذج الإنشاء/التعديل الـ `SingleRecordResource`؛ حيث يقوم `save()` بالتمييز تلقائياً بين الإنشاء والتحديث. |
| **تفاصيل JSBlock** | تحميل سجل واحد لمستخدم أو طلب أو غيره داخل JSBlock وتخصيص طريقة عرضه. |
| **الموارد المرتبطة** | تحميل سجلات مرتبطة مفردة بتنسيق مثل `users.profile`؛ ويتطلب ذلك استخدام `setSourceId(معرف السجل الأب)`. |

---

## تنسيق البيانات

- تعيد `getData()` **كائن سجل واحد**، وهو ما يقابل حقل `data` في استجابة واجهة برمجة التطبيقات (API).
- تعيد `getMeta()` البيانات الوصفية (Metadata) إن وجدت.

---

## اسم المورد والمفتاح الأساسي

| الطريقة | الوصف |
|------|------|
| `setResourceName(name)` / `getResourceName()` | اسم المورد، مثل `'users'` أو `'users.profile'` (مورد مرتبط). |
| `setSourceId(id)` / `getSourceId()` | معرف السجل الأب عند التعامل مع الموارد المرتبطة (مثلاً: `users.profile` يتطلب المفتاح الأساسي لسجل المستخدمين). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | معرف مصدر البيانات (يستخدم في بيئات مصادر البيانات المتعددة). |
| `setFilterByTk(tk)` / `getFilterByTk()` | المفتاح الأساسي للسجل الحالي؛ بمجرد تعيينه، تصبح قيمة `isNewRecord` هي `false`. |

---

## الحالة

| الخاصية/الطريقة | الوصف |
|----------|------|
| `isNewRecord` | ما إذا كان السجل في حالة "جديد" (تكون `true` إذا لم يتم تعيين `filterByTk` أو إذا تم إنشاؤه للتو). |

---

## بارامترات الطلب (الفلترة / الحقول)

| الطريقة | الوصف |
|------|------|
| `setFilter(filter)` / `getFilter()` | الفلترة (متاحة عندما لا يكون السجل في حالة "جديد"). |
| `setFields(fields)` / `getFields()` | الحقول المطلوبة في الطلب. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | تحميل العلاقات المرتبطة (Appends). |

---

## عمليات CRUD

| الطريقة | الوصف |
|------|------|
| `refresh()` | يرسل طلب `get` بناءً على الـ `filterByTk` الحالي ويحدث `getData()`؛ لا يقوم بأي إجراء في حالة "جديد". |
| `save(data, options?)` | يستدعي `create` في حالة "جديد"، وإلا يستدعي `update`؛ الخيار `{ refresh: false }` يمنع التحديث التلقائي بعد الحفظ. |
| `destroy(options?)` | يحذف السجل بناءً على الـ `filterByTk` الحالي ويمسح البيانات المحلية. |
| `runAction(actionName, options)` | يستدعي أي إجراء (action) خاص بالمورد. |

---

## الإعدادات والأحداث

| الطريقة | الوصف |
|------|------|
| `setSaveActionOptions(options)` | إعدادات الطلب لإجراء الحفظ `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | يتم تفعيله عند اكتمال التحديث أو بعد الحفظ. |

---

## أمثلة

### الجلب والتحديث الأساسي

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// تحديث
await ctx.resource.save({ name: 'أحمد' });
```

### إنشاء سجل جديد

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'سارة', email: 'sara@example.com' });
```

### حذف سجل

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// بعد الحذف، تعيد getData() القيمة null
```

### توسيع العلاقات والحقول

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### الموارد المرتبطة (مثل users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // المفتاح الأساسي للسجل الأب
res.setFilterByTk(profileId);    // يمكن حذف filterByTk إذا كانت profile علاقة من نوع hasOne
await res.refresh();
const profile = res.getData();
```

### الحفظ بدون تحديث تلقائي

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// تحتفظ getData() بالقيمة القديمة لأن التحديث (refresh) لم يتم تفعيله بعد الحفظ
```

### الاستماع لأحداث refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>المستخدم: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('تم الحفظ بنجاح');
});
await ctx.resource?.refresh?.();
```

---

## ملاحظات هامة

- **setResourceName إلزامي**: يجب استدعاء `setResourceName('اسم المجموعة')` قبل الاستخدام، وإلا فلن يمكن بناء رابط الطلب (URL).
- **filterByTk و isNewRecord**: إذا لم يتم استدعاء `setFilterByTk` تكون حالة `isNewRecord` هي `true` ولن يقوم `refresh()` بإرسال طلب؛ وسيقوم `save()` بتنفيذ إجراء الإنشاء `create`.
- **الموارد المرتبطة**: عندما يكون اسم المورد بتنسيق `parent.child` (مثل `users.profile`)، يجب استدعاء `setSourceId(المفتاح الأساسي للأب)` أولاً.
- **getData تعيد كائناً**: البيانات التي تعيدها واجهات برمجة التطبيقات للسجل الواحد هي كائن سجل؛ وتعيد `getData()` هذا الكائن مباشرة. وتصبح قيمتها `null` بعد تنفيذ `destroy()`.

---

## روابط ذات صلة

- [ctx.resource](../context/resource.md) - مثيل الـ resource في السياق الحالي.
- [ctx.initResource()](../context/init-resource.md) - تهيئة المورد وربطه بـ `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - إنشاء مثيل مورد جديد دون ربطه بالسياق.
- [APIResource](./api-resource.md) - مورد API عام يتم طلبه عبر الرابط (URL).
- [MultiRecordResource](./multi-record-resource.md) - موجه نحو المجموعات/القوائم، ويدعم عمليات CRUD والتنظيم الصفحي (Pagination).