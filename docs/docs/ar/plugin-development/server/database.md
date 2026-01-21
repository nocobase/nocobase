:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# قاعدة البيانات

تُعد `Database` مكونًا أساسيًا لمصادر البيانات من نوع قاعدة البيانات (`DataSource`). يمتلك كل مصدر بيانات من نوع قاعدة البيانات نسخة (`instance`) مقابلة من `Database`، يمكن الوصول إليها عبر `dataSource.db`. توفر نسخة قاعدة البيانات لمصدر البيانات الرئيسي أيضًا الاسم المستعار المريح `app.db`. إن الإلمام بالأساليب الشائعة لـ `db` هو أساس كتابة الإضافات (`Plugin`) من جانب الخادم.

## مكونات قاعدة البيانات

تتكون `Database` النموذجية من الأجزاء التالية:

-   **مجموعة** (`Collection`): تُعرّف بنية جدول البيانات.
-   **Model**: يتوافق مع نماذج ORM (عادةً ما تتم إدارتها بواسطة Sequelize).
-   **Repository**: طبقة المستودع التي تغلف منطق الوصول إلى البيانات، وتوفر أساليب تشغيل أعلى مستوى.
-   **FieldType**: أنواع الحقول.
-   **FilterOperator**: عوامل التشغيل المستخدمة للتصفية.
-   **Event**: أحداث دورة الحياة وأحداث قاعدة البيانات.

## توقيت الاستخدام في الإضافات

### ما يناسب مرحلة `beforeLoad`

في هذه المرحلة، لا يُسمح بإجراء عمليات على قاعدة البيانات. وهي مناسبة لتسجيل الفئات الساكنة (`static classes`) أو الاستماع إلى الأحداث.

-   `db.registerFieldTypes()` — أنواع الحقول المخصصة
-   `db.registerModels()` — تسجيل فئات النموذج المخصصة
-   `db.registerRepositories()` — تسجيل فئات المستودع المخصصة
-   `db.registerOperators()` — تسجيل عوامل التصفية المخصصة
-   `db.on()` — الاستماع إلى الأحداث المتعلقة بقاعدة البيانات

### ما يناسب مرحلة `load`

في هذه المرحلة، تكون جميع تعريفات الفئات والأحداث السابقة قد تم تحميلها، وبالتالي لن يكون هناك أي نقص أو إغفال عند تحميل جداول البيانات.

-   `db.defineCollection()` — تعريف جداول بيانات جديدة
-   `db.extendCollection()` — توسيع إعدادات جداول البيانات الموجودة

إذا كنت تُعرّف جداول مدمجة للإضافة (`Plugin`)، فمن الأفضل وضعها في دليل `./src/server/collections`. لمزيد من التفاصيل، راجع [المجموعات](./collections.md).

## عمليات البيانات

توفر `Database` طريقتين رئيسيتين للوصول إلى البيانات والتعامل معها:

### العمليات عبر `Repository`

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

تُستخدم طبقة `Repository` عادةً لتغليف منطق الأعمال، مثل تقسيم الصفحات (`pagination`)، والتصفية (`filtering`)، وفحص الأذونات (`permission checks`)، وما إلى ذلك.

### العمليات عبر `Model`

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

تتوافق طبقة `Model` مباشرةً مع كيانات ORM، وهي مناسبة لتنفيذ عمليات قاعدة البيانات ذات المستوى الأدنى.

## ما هي المراحل التي تسمح بعمليات قاعدة البيانات؟

### دورة حياة الإضافة (`Plugin`)

| المرحلة | هل يُسمح بعمليات قاعدة البيانات؟ |
| :------------------- | :--------------------------: |
| `staticImport` | لا |
| `afterAdd` | لا |
| `beforeLoad` | لا |
| `load` | لا |
| `install` | نعم |
| `beforeEnable` | نعم |
| `afterEnable` | نعم |
| `beforeDisable` | نعم |
| `afterDisable` | نعم |
| `remove` | نعم |
| `handleSyncMessage` | نعم |

### أحداث التطبيق (`App`)

| المرحلة | هل يُسمح بعمليات قاعدة البيانات؟ |
| :------------------- | :--------------------------: |
| `beforeLoad` | لا |
| `afterLoad` | لا |
| `beforeStart` | نعم |
| `afterStart` | نعم |
| `beforeInstall` | لا |
| `afterInstall` | نعم |
| `beforeStop` | نعم |
| `afterStop` | لا |
| `beforeDestroy` | نعم |
| `afterDestroy` | لا |
| `beforeLoadPlugin` | لا |
| `afterLoadPlugin` | لا |
| `beforeEnablePlugin` | نعم |
| `afterEnablePlugin` | نعم |
| `beforeDisablePlugin` | نعم |
| `afterDisablePlugin` | نعم |
| `afterUpgrade` | نعم |

### أحداث/خطافات قاعدة البيانات (`Database Events/Hooks`)

| المرحلة | هل يُسمح بعمليات قاعدة البيانات؟ |
| :------------------------------ | :--------------------------: |
| `beforeSync` | لا |
| `afterSync` | نعم |
| `beforeValidate` | نعم |
| `afterValidate` | نعم |
| `beforeCreate` | نعم |
| `afterCreate` | نعم |
| `beforeUpdate` | نعم |
| `afterUpdate` | نعم |
| `beforeSave` | نعم |
| `afterSave` | نعم |
| `beforeDestroy` | نعم |
| `afterDestroy` | نعم |
| `afterCreateWithAssociations` | نعم |
| `afterUpdateWithAssociations` | نعم |
| `afterSaveWithAssociations` | نعم |
| `beforeDefineCollection` | لا |
| `afterDefineCollection` | لا |
| `beforeRemoveCollection` | لا |
| `afterRemoveCollection` | لا |