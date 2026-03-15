:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

مدير مصدر البيانات (نسخة من `DataSourceManager`)، يُستخدم لإدارة والوصول إلى مصادر بيانات متعددة (مثل قاعدة البيانات الرئيسية `main` وقاعدة بيانات السجلات `logging` وغيرها). يُستخدم عند وجود مصادر بيانات متعددة أو عند الحاجة للوصول إلى البيانات الوصفية (metadata) عبر مصادر بيانات مختلفة.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **تعدد مصادر البيانات** | تعداد جميع مصادر البيانات، أو الحصول على مصدر بيانات محدد بواسطة المفتاح (key). |
| **الوصول عبر مصادر البيانات** | الوصول إلى البيانات الوصفية باستخدام تنسيق "مفتاح مصدر البيانات + اسم المجموعة" عندما يكون مصدر البيانات في السياق الحالي غير معروف. |
| **الحصول على الحقول عبر المسار الكامل** | استخدام تنسيق `dataSourceKey.collectionName.fieldPath` للحصول على تعريفات الحقول عبر مصادر بيانات مختلفة. |

> ملاحظة: إذا كنت تعمل فقط على مصدر البيانات الحالي، فمن الأفضل استخدام `ctx.dataSource`. استخدم `ctx.dataSourceManager` فقط عندما تحتاج إلى تعداد أو التبديل بين مصادر البيانات.

## تعريف النوع (Type Definition)

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // إدارة مصدر البيانات
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // قراءة مصادر البيانات
  getDataSources(): DataSource[];                     // الحصول على جميع مصادر البيانات
  getDataSource(key: string): DataSource | undefined;  // الحصول على مصدر البيانات بواسطة المفتاح (key)

  // الوصول المباشر إلى البيانات الوصفية عبر مصدر البيانات + المجموعة
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## العلاقة مع ctx.dataSource

| المتطلب | الاستخدام الموصى به |
|------|----------|
| **مصدر بيانات واحد مرتبط بالسياق الحالي** | `ctx.dataSource` (مثل مصدر بيانات الصفحة/الكتلة الحالية) |
| **نقطة الدخول لجميع مصادر البيانات** | `ctx.dataSourceManager` |
| **سرد أو تبديل مصادر البيانات** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **الحصول على مجموعة داخل مصدر البيانات الحالي** | `ctx.dataSource.getCollection(name)` |
| **الحصول على مجموعة عبر مصادر البيانات** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **الحصول على حقل داخل مصدر البيانات الحالي** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **الحصول على حقل عبر مصادر البيانات** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## أمثلة

### الحصول على مصدر بيانات محدد

```ts
// الحصول على مصدر البيانات المسمى 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// الحصول على جميع المجموعات التابعة لمصدر البيانات هذا
const collections = mainDS?.getCollections();
```

### الوصول إلى البيانات الوصفية للمجموعة عبر مصادر البيانات

```ts
// الحصول على المجموعة بواسطة dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// الحصول على المفتاح الأساسي للمجموعة
const primaryKey = users?.filterTargetKey ?? 'id';
```

### الحصول على تعريف الحقل عبر المسار الكامل

```ts
// التنسيق: dataSourceKey.collectionName.fieldPath
// الحصول على تعريف الحقل عبر "مفتاح مصدر البيانات.اسم المجموعة.مسار الحقل"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// يدعم مسارات حقول الارتباط
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### التكرار عبر جميع مصادر البيانات

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`مصدر البيانات: ${ds.key}، الاسم المعروض: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - المجموعة: ${col.name}`);
  }
}
```

### اختيار مصدر البيانات ديناميكيًا بناءً على المتغيرات

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## ملاحظات

- تنسيق المسار لـ `getCollectionField` هو `dataSourceKey.collectionName.fieldPath`، حيث يكون الجزء الأول هو مفتاح مصدر البيانات، يليه اسم المجموعة ومسار الحقل.
- تعيد `getDataSource(key)` القيمة `undefined` إذا كان مصدر البيانات غير موجود؛ يُنصح بالتحقق من القيمة قبل الاستخدام.
- ستقوم `addDataSource` برمي استثناء إذا كان المفتاح موجودًا بالفعل؛ بينما تقوم `upsertDataSource` بتجاوز الموجود أو إضافة مفتاح جديد.

## روابط ذات صلة

- [ctx.dataSource](./data-source.md): نسخة مصدر البيانات الحالية
- [ctx.collection](./collection.md): المجموعة المرتبطة بالسياق الحالي
- [ctx.collectionField](./collection-field.md): تعريف حقل المجموعة للحقل الحالي