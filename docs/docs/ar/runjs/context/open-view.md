:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/open-view).
:::

# ctx.openView()

فتح عرض محدد برمجياً (درج، نافذة منبثقة، صفحة مضمنة، إلخ). يتم توفيره بواسطة `FlowModelContext` ويُستخدم لفتح عروض `ChildPage` أو `PopupAction` المهيأة في سيناريوهات مثل `JSBlock` وخلايا الجداول وسير العمل.

## سيناريوهات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock** | فتح نافذة تفاصيل/تعديل منبثقة بعد النقر على زر، مع تمرير `filterByTk` للصف الحالي. |
| **خلايا الجدول** | رندرة (عرض) زر داخل الخلية يفتح نافذة تفاصيل الصف عند النقر. |
| **سير العمل / JSAction** | فتح العرض التالي أو نافذة منبثقة بعد نجاح العملية. |
| **حقل الارتباط** | فتح نافذة اختيار/تعديل منبثقة عبر `ctx.runAction('openView', params)`. |

> ملاحظة: `ctx.openView` متاح في بيئة RunJS التي يتوفر فيها سياق `FlowModel`؛ إذا كان النموذج المقابل لـ `uid` غير موجود، فسيتم إنشاء `PopupActionModel` وحفظه تلقائياً.

## التوقيع (Signature)

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## شرح المعلمات

### uid

المعرف الفريد لنموذج العرض. إذا لم يكن موجوداً، فسيتم إنشاؤه وحفظه تلقائياً. يُنصح باستخدام UID ثابت، مثل `${ctx.model.uid}-detail` لضمان إعادة استخدام التكوين عند فتح نفس النافذة عدة مرات.

### حقول options الشائعة

| الحقل | النوع | الوصف |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | طريقة الفتح: درج (drawer)، نافذة منبثقة (dialog)، أو مضمن (embed). الافتراضي هو `drawer`. |
| `size` | `small` / `medium` / `large` | حجم النافذة المنبثقة أو الدرج. الافتراضي هو `medium`. |
| `title` | `string` | عنوان العرض. |
| `params` | `Record<string, any>` | أي معلمات يتم تمريرها إلى العرض. |
| `filterByTk` | `any` | قيمة المفتاح الأساسي، تُستخدم في سيناريوهات تفاصيل/تعديل سجل واحد. |
| `sourceId` | `string` | معرف السجل المصدر، يُستخدم في سيناريوهات الارتباط. |
| `dataSourceKey` | `string` | مصدر البيانات. |
| `collectionName` | `string` | اسم المجموعة. |
| `associationName` | `string` | اسم حقل الارتباط. |
| `navigation` | `boolean` | ما إذا كان سيتم استخدام التنقل عبر المسارات (routing). يتم ضبطه قسراً على `false` عند تمرير `defineProperties` أو `defineMethods`. |
| `preventClose` | `boolean` | ما إذا كان سيتم منع الإغلاق. |
| `defineProperties` | `Record<string, PropertyOptions>` | حقن الخصائص ديناميكياً في النموذج داخل العرض. |
| `defineMethods` | `Record<string, Function>` | حقن الأساليب (methods) ديناميكياً في النموذج داخل العرض. |

## أمثلة

### الاستخدام الأساسي: فتح درج

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('التفاصيل'),
});
```

### تمرير سياق الصف الحالي

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('تفاصيل الصف'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### الفتح عبر runAction

عندما يتم تهيئة نموذج بإجراء `openView` (مثل حقول الارتباط أو الحقول القابلة للنقر)، يمكنك استدعاء:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### حقن سياق مخصص

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## العلاقة مع ctx.viewer و ctx.view

| الغرض | الاستخدام الموصى به |
|------|----------|
| **فتح عرض سير عمل مهيأ** | `ctx.openView(uid, options)` |
| **فتح محتوى مخصص (بدون سير عمل)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **العمل على العرض المفتوح حالياً** | `ctx.view.close()`، `ctx.view.inputArgs` |

يفتح `ctx.openView` صفحة `FlowPage` (`ChildPageModel`) التي تقوم برندرة صفحة سير عمل كاملة داخلياً؛ بينما يفتح `ctx.viewer` أي محتوى React عشوائي.

## ملاحظات

- يُنصح بربط الـ `uid` بـ `ctx.model.uid` (مثل `${ctx.model.uid}-xxx`) لتجنب التعارض بين الكتل المتعددة.
- عند تمرير `defineProperties` أو `defineMethods` يتم فرض قيمة `false` لـ `navigation` لمنع فقدان السياق بعد التحديث.
- يشير `ctx.view` داخل النافذة المنبثقة إلى مثيل العرض الحالي، ويمكن استخدام `ctx.view.inputArgs` لقراءة المعلمات التي تم تمريرها عند الفتح.

## ذات صلة

- [ctx.view](./view.md): مثيل العرض المفتوح حالياً.
- [ctx.model](./model.md): النموذج الحالي، يُستخدم لإنشاء `popupUid` ثابت.