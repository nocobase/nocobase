:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# DataSourceManager إدارة مصادر البيانات

توفر NocoBase أداة `DataSourceManager` لإدارة مصادر بيانات متعددة. يحتوي كل `DataSource` على نسخ خاصة به من `Database` و`ResourceManager` و`ACL`، مما يسهل على المطورين إدارة وتوسيع مصادر البيانات المتعددة بمرونة.

## المفاهيم الأساسية

يحتوي كل نسخة من `DataSource` على ما يلي:

- **`dataSource.collectionManager`**: يُستخدم لإدارة المجموعات والحقول.
- **`dataSource.resourceManager`**: يتعامل مع العمليات المتعلقة بالموارد (مثل عمليات الإنشاء والقراءة والتحديث والحذف - CRUD - وغيرها).
- **`dataSource.acl`**: التحكم في الوصول (ACL) لعمليات الموارد.

لتسهيل الوصول، تتوفر أسماء مستعارة سريعة لأعضاء مصدر البيانات الرئيسي:

- `app.db` يكافئ `dataSourceManager.get('main').collectionManager.db`
- `app.acl` يكافئ `dataSourceManager.get('main').acl`
- `app.resourceManager` يكافئ `dataSourceManager.get('main').resourceManager`

## الطرق الشائعة

### dataSourceManager.get(dataSourceKey)

تُرجع هذه الدالة نسخة `DataSource` المحددة.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

لتسجيل برمجيات وسيطة (middleware) لجميع مصادر البيانات. سيؤثر هذا على العمليات في جميع مصادر البيانات.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

يُنفذ قبل تحميل مصدر البيانات. يُستخدم عادة لتسجيل الفئات الثابتة، مثل فئات النموذج وتسجيل أنواع الحقول:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // نوع حقل مخصص
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

يُنفذ بعد تحميل مصدر البيانات. يُستخدم عادة لتسجيل العمليات، وتعيين التحكم في الوصول، وما إلى ذلك.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // تعيين صلاحيات الوصول
});
```

## توسيع مصدر البيانات

للحصول على توسيع كامل لمصدر البيانات، يرجى الرجوع إلى فصل توسيع مصدر البيانات.