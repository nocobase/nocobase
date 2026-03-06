:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/data-source).
:::

# ctx.dataSource

يمثل `ctx.dataSource` مثيل مصدر البيانات (`DataSource`) المرتبط بسياق تنفيذ RunJS الحالي، ويُستخدم للوصول إلى المجموعات، والبيانات الوصفية للحقول، وإدارة تكوينات المجموعات **داخل مصدر البيانات الحالي**. عادةً ما يتوافق مع مصدر البيانات المحدد للصفحة أو الكتلة (Block) الحالية (مثل قاعدة البيانات الرئيسية `main`).

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **عمليات مصدر البيانات الواحد** | الحصول على البيانات الوصفية للمجموعات والحقول عندما يكون مصدر البيانات الحالي معروفاً. |
| **إدارة المجموعات** | الحصول على المجموعات، أو إضافتها، أو تحديثها، أو حذفها ضمن مصدر البيانات الحالي. |
| **الحصول على الحقول عبر المسار** | استخدام تنسيق `collectionName.fieldPath` للحصول على تعريفات الحقول (يدعم مسارات الارتباط). |

> ملاحظة: يمثل `ctx.dataSource` مصدر بيانات واحد للسياق الحالي؛ للوصول إلى مصادر بيانات أخرى أو سردها، يرجى استخدام [ctx.dataSourceManager](./data-source-manager.md).

## تعريف النوع (Type Definition)

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // خصائص للقراءة فقط
  get flowEngine(): FlowEngine;   // مثيل FlowEngine الحالي
  get displayName(): string;      // الاسم المعروض (يدعم i18n)
  get key(): string;              // مفتاح مصدر البيانات، مثل 'main'
  get name(): string;             // نفس المفتاح (key)

  // قراءة المجموعات
  getCollections(): Collection[];                      // جلب جميع المجموعات
  getCollection(name: string): Collection | undefined; // جلب مجموعة بالاسم
  getAssociation(associationName: string): CollectionField | undefined; // جلب حقل ارتباط (مثل users.roles)

  // إدارة المجموعات
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // البيانات الوصفية للحقول
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## الخصائص الشائعة

| الخاصية | النوع | الوصف |
|------|------|------|
| `key` | `string` | مفتاح مصدر البيانات، مثل `'main'` |
| `name` | `string` | نفس المفتاح (key) |
| `displayName` | `string` | الاسم المعروض (يدعم i18n) |
| `flowEngine` | `FlowEngine` | مثيل FlowEngine الحالي |

## الطرق (Methods) الشائعة

| الطريقة | الوصف |
|------|------|
| `getCollections()` | جلب جميع المجموعات ضمن مصدر البيانات الحالي (مرتبة، مع تصفية المجموعات المخفية). |
| `getCollection(name)` | جلب مجموعة بالاسم؛ يمكن أن يكون `name` بتنسيق `collectionName.fieldName` لجلب المجموعة المستهدفة من الارتباط. |
| `getAssociation(associationName)` | جلب تعريف حقل الارتباط عبر `collectionName.fieldName`. |
| `getCollectionField(fieldPath)` | جلب تعريف الحقل عبر `collectionName.fieldPath`؛ يدعم مسارات الارتباط مثل `users.profile.avatar`. |

## العلاقة مع ctx.dataSourceManager

| المتطلب | الاستخدام الموصى به |
|------|----------|
| **مصدر بيانات واحد مرتبط بالسياق الحالي** | `ctx.dataSource` |
| **نقطة الدخول لجميع مصادر البيانات** | `ctx.dataSourceManager` |
| **جلب مجموعة داخل مصدر البيانات الحالي** | `ctx.dataSource.getCollection(name)` |
| **جلب مجموعة عبر مصادر بيانات مختلفة** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **جلب حقل داخل مصدر البيانات الحالي** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **جلب حقل عبر مصادر بيانات مختلفة** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## أمثلة

### جلب المجموعات والحقول

```ts
// جلب جميع المجموعات
const collections = ctx.dataSource.getCollections();

// جلب مجموعة بالاسم
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// جلب تعريف الحقل عبر "اسم_المجموعة.مسار_الحقل" (يدعم الارتباطات)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### جلب حقول الارتباط

```ts
// جلب تعريف حقل الارتباط عبر collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // المعالجة بناءً على هيكل المجموعة المستهدفة
}
```

### التكرار عبر المجموعات للمعالجة الديناميكية

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### إجراء التحقق أو واجهة مستخدم ديناميكية بناءً على البيانات الوصفية للحقل

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // تنفيذ منطق واجهة المستخدم أو التحقق بناءً على الواجهة (interface)، التعداد (enum)، التحقق (validation)، إلخ.
}
```

## ملاحظات

- تنسيق المسار لـ `getCollectionField(fieldPath)` هو `collectionName.fieldPath`، حيث يكون الجزء الأول هو اسم المجموعة والأجزاء اللاحقة هي مسار الحقل (يدعم الارتباطات، مثل `user.name`).
- تدعم `getCollection(name)` تنسيق `collectionName.fieldName` وتُرجع المجموعة المستهدفة لحقل الارتباط.
- في سياق RunJS، يتم تحديد `ctx.dataSource` عادةً بواسطة مصدر بيانات الكتلة أو الصفحة الحالية؛ إذا لم يكن هناك مصدر بيانات مرتبط بالسياق، فقد تكون القيمة `undefined`؛ لذا يوصى بالتحقق من القيمة قبل الاستخدام.

## روابط ذات صلة

- [ctx.dataSourceManager](./data-source-manager.md): مدير مصادر البيانات، يدير جميع مصادر البيانات.
- [ctx.collection](./collection.md): المجموعة المرتبطة بالسياق الحالي.
- [ctx.collectionField](./collection-field.md): تعريف حقل المجموعة للحقل الحالي.