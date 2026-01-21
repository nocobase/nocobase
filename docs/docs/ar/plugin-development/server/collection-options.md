:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

## معلمات تهيئة المجموعة

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - اسم المجموعة
- **النوع**: `string`
- **مطلوب**: ✅
- **الوصف**: المعرف الفريد للمجموعة، ويجب أن يكون فريدًا على مستوى التطبيق بأكمله.
- **مثال**:
```typescript
{
  name: 'users'  // مجموعة المستخدمين
}
```

### `title` - عنوان المجموعة
- **النوع**: `string`
- **مطلوب**: ❌
- **الوصف**: العنوان المعروض للمجموعة، ويُستخدم للعرض في واجهة المستخدم الأمامية.
- **مثال**:
```typescript
{
  name: 'users',
  title: 'إدارة المستخدمين'  // يظهر كـ "إدارة المستخدمين" في الواجهة
}
```

### `migrationRules` - قواعد الترحيل
- **النوع**: `MigrationRule[]`
- **مطلوب**: ❌
- **الوصف**: قواعد المعالجة عند ترحيل البيانات.
- **مثال**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // الكتابة فوق البيانات الموجودة
  fields: [...]
}
```

### `inherits` - وراثة المجموعات
- **النوع**: `string[] | string`
- **مطلوب**: ❌
- **الوصف**: لوراثة تعريفات الحقول من مجموعات أخرى. يدعم وراثة مجموعة واحدة أو عدة مجموعات.
- **مثال**:

```typescript
// وراثة فردية
{
  name: 'admin_users',
  inherits: 'users',  // يرث جميع الحقول من مجموعة المستخدمين
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// وراثة متعددة
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // يرث من عدة مجموعات
  fields: [...]
}
```

### `filterTargetKey` - مفتاح الهدف للتصفية
- **النوع**: `string | string[]`
- **مطلوب**: ❌
- **الوصف**: المفتاح الهدف المستخدم لتصفية الاستعلامات. يدعم مفتاحًا واحدًا أو عدة مفاتيح.
- **مثال**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // التصفية حسب معرف المستخدم
  fields: [...]
}

// مفاتيح تصفية متعددة
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // التصفية حسب معرف المستخدم ومعرف الفئة
  fields: [...]
}
```

### `fields` - تعريفات الحقول
- **النوع**: `FieldOptions[]`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `[]`
- **الوصف**: مصفوفة من تعريفات الحقول للمجموعة. يتضمن كل حقل معلومات مثل النوع والاسم والتهيئة.
- **مثال**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'اسم المستخدم'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'البريد الإلكتروني'
    },
    {
      type: 'password',
      name: 'password',
      title: 'كلمة المرور'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'تاريخ الإنشاء'
    }
  ]
}
```

### `model` - النموذج المخصص
- **النوع**: `string | ModelStatic<Model>`
- **مطلوب**: ❌
- **الوصف**: يحدد فئة نموذج Sequelize مخصصًا، يمكن أن يكون اسم الفئة أو فئة النموذج نفسها.
- **مثال**:
```typescript
// تحديد اسم فئة النموذج كسلسلة نصية
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// استخدام فئة النموذج
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - المستودع المخصص
- **النوع**: `string | RepositoryType`
- **مطلوب**: ❌
- **الوصف**: يحدد فئة مستودع مخصصًا لمعالجة منطق الوصول إلى البيانات.
- **مثال**:
```typescript
// تحديد اسم فئة المستودع كسلسلة نصية
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// استخدام فئة المستودع
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - توليد المعرف تلقائيًا
- **النوع**: `boolean`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `true`
- **الوصف**: ما إذا كان سيتم توليد معرف المفتاح الأساسي تلقائيًا.
- **مثال**:
```typescript
{
  name: 'users',
  autoGenId: true,  // توليد معرف المفتاح الأساسي تلقائيًا
  fields: [...]
}

// تعطيل التوليد التلقائي للمعرف (يتطلب تحديد المفتاح الأساسي يدويًا)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - تمكين الطوابع الزمنية
- **النوع**: `boolean`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `true`
- **الوصف**: ما إذا كان سيتم تمكين حقلي `createdAt` و `updatedAt`.
- **مثال**:
```typescript
{
  name: 'users',
  timestamps: true,  // تمكين الطوابع الزمنية
  fields: [...]
}
```

### `createdAt` - حقل تاريخ الإنشاء
- **النوع**: `boolean | string`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `true`
- **الوصف**: تهيئة حقل تاريخ الإنشاء.
- **مثال**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // اسم مخصص لحقل تاريخ الإنشاء
  fields: [...]
}
```

### `updatedAt` - حقل تاريخ التحديث
- **النوع**: `boolean | string`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `true`
- **الوصف**: تهيئة حقل تاريخ التحديث.
- **مثال**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // اسم مخصص لحقل تاريخ التحديث
  fields: [...]
}
```

### `deletedAt` - حقل الحذف الناعم
- **النوع**: `boolean | string`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `false`
- **الوصف**: تهيئة حقل الحذف الناعم.
- **مثال**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // تمكين الحذف الناعم
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - وضع الحذف الناعم
- **النوع**: `boolean`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `false`
- **الوصف**: ما إذا كان سيتم تمكين وضع الحذف الناعم.
- **مثال**:
```typescript
{
  name: 'users',
  paranoid: true,  // تمكين الحذف الناعم
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - التسمية بالشرطة السفلية
- **النوع**: `boolean`
- **مطلوب**: ❌
- **القيمة الافتراضية**: `false`
- **الوصف**: ما إذا كان سيتم استخدام نمط التسمية بالشرطة السفلية.
- **مثال**:
```typescript
{
  name: 'users',
  underscored: true,  // استخدام نمط التسمية بالشرطة السفلية
  fields: [...]
}
```

### `indexes` - تهيئة الفهارس
- **النوع**: `ModelIndexesOptions[]`
- **مطلوب**: ❌
- **الوصف**: تهيئة فهارس قاعدة البيانات.
- **مثال**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## تهيئة معلمات الحقول

يدعم NocoBase أنواعًا متعددة من الحقول، وجميعها مُعرفة بناءً على نوع الاتحاد `FieldOptions`. تتضمن تهيئة الحقل الخصائص الأساسية، والخصائص الخاصة بنوع البيانات، وخصائص العلاقات، وخصائص العرض في الواجهة الأمامية.

### خيارات الحقول الأساسية

ترث جميع أنواع الحقول من `BaseFieldOptions`، مما يوفر إمكانيات تهيئة الحقول الشائعة:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // معلمات عامة
  name?: string;                    // اسم الحقل
  hidden?: boolean;                 // هل هو مخفي
  validation?: ValidationOptions<T>; // قواعد التحقق

  // خصائص حقول الأعمدة الشائعة
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // متعلق بالواجهة الأمامية
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**مثال**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // لا تسمح بالقيم الفارغة
  unique: true,           // قيد التفرد
  defaultValue: '',       // القيمة الافتراضية هي سلسلة نصية فارغة
  index: true,            // إنشاء فهرس
  comment: 'اسم تسجيل دخول المستخدم'    // تعليق قاعدة البيانات
}
```

### `name` - اسم الحقل

- **النوع**: `string`
- **مطلوب**: ❌
- **الوصف**: اسم عمود الحقل في قاعدة البيانات، ويجب أن يكون فريدًا ضمن المجموعة.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'username',  // اسم الحقل
  title: 'اسم المستخدم'
}
```

### `hidden` - إخفاء الحقل

- **النوع**: `boolean`
- **القيمة الافتراضية**: `false`
- **الوصف**: ما إذا كان سيتم إخفاء هذا الحقل افتراضيًا في القوائم والنماذج.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // إخفاء حقل المعرف الداخلي
  title: 'المعرف الداخلي'
}
```

### `validation` - قواعد التحقق

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // نوع التحقق
  rules: FieldValidationRule<T>[];  // مصفوفة قواعد التحقق
  [key: string]: any;              // خيارات التحقق الأخرى
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // مفتاح القاعدة
  name: FieldValidationRuleName<T>; // اسم القاعدة
  args?: {                         // وسائط القاعدة
    [key: string]: any;
  };
  paramsType?: 'object';           // نوع المعلمة
}
```

- **النوع**: `ValidationOptions<T>`
- **الوصف**: يُستخدم Joi لتعريف قواعد التحقق من صحة البيانات على جانب الخادم.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - السماح بالقيم الفارغة

- **النوع**: `boolean`
- **القيمة الافتراضية**: `true`
- **الوصف**: يتحكم فيما إذا كانت قاعدة البيانات تسمح بكتابة قيم `NULL`.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // لا تسمح بالقيم الفارغة
  title: 'اسم المستخدم'
}
```

### `defaultValue` - القيمة الافتراضية

- **النوع**: `any`
- **الوصف**: القيمة الافتراضية للحقل، تُستخدم عند إنشاء سجل دون توفير قيمة لهذا الحقل.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // القيمة الافتراضية هي حالة "مسودة"
  title: 'الحالة'
}
```

### `unique` - قيد التفرد

- **النوع**: `boolean | string`
- **القيمة الافتراضية**: `false`
- **الوصف**: ما إذا كانت القيمة يجب أن تكون فريدة. يمكن استخدام سلسلة نصية لتحديد اسم القيد.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // يجب أن يكون البريد الإلكتروني فريدًا
  title: 'البريد الإلكتروني'
}
```

### `primaryKey` - المفتاح الأساسي

- **النوع**: `boolean`
- **القيمة الافتراضية**: `false`
- **الوصف**: يعلن هذا الحقل كمفتاح أساسي.
- **مثال**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // تعيين كمفتاح أساسي
  autoIncrement: true
}
```

### `autoIncrement` - الزيادة التلقائية

- **النوع**: `boolean`
- **القيمة الافتراضية**: `false`
- **الوصف**: يمكّن الزيادة التلقائية (ينطبق فقط على الحقول الرقمية).
- **مثال**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // زيادة تلقائية
  primaryKey: true
}
```

### `field` - اسم عمود قاعدة البيانات

- **النوع**: `string`
- **الوصف**: يحدد اسم عمود قاعدة البيانات الفعلي (متوافق مع حقل Sequelize).
- **مثال**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // اسم العمود في قاعدة البيانات
  title: 'معرف المستخدم'
}
```

### `comment` - تعليق قاعدة البيانات

- **النوع**: `string`
- **الوصف**: تعليق لحقل قاعدة البيانات، يُستخدم لأغراض التوثيق.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'اسم تسجيل دخول المستخدم، يُستخدم لتسجيل الدخول إلى النظام',  // تعليق قاعدة البيانات
  title: 'اسم المستخدم'
}
```

### `title` - عنوان العرض

- **النوع**: `string`
- **الوصف**: عنوان العرض للحقل، يُستخدم عادةً في واجهة المستخدم الأمامية.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'اسم المستخدم',  // العنوان المعروض في الواجهة الأمامية
  allowNull: false
}
```

### `description` - وصف الحقل

- **النوع**: `string`
- **الوصف**: معلومات وصفية عن الحقل لمساعدة المستخدمين على فهم الغرض منه.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'البريد الإلكتروني',
  description: 'يرجى إدخال عنوان بريد إلكتروني صالح',  // وصف الحقل
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - مكون الواجهة

- **النوع**: `string`
- **الوصف**: مكون واجهة المستخدم الأمامية الموصى به للحقل.
- **مثال**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'المحتوى',
  interface: 'textarea',  // يوصى باستخدام مكون حقل النص المتعدد (textarea)
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### واجهات أنواع الحقول

### `type: 'string'` - حقل السلسلة النصية

- **الوصف**: يُستخدم لتخزين البيانات النصية القصيرة. يدعم قيود الطول والقص التلقائي للمسافات.
- **نوع قاعدة البيانات**: `VARCHAR`
- **خصائص مميزة**:
  - `length`: حد طول السلسلة النصية
  - `trim`: ما إذا كان سيتم إزالة المسافات البادئة واللاحقة تلقائيًا

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // حد طول السلسلة النصية
  trim?: boolean;     // ما إذا كان سيتم إزالة المسافات البادئة واللاحقة تلقائيًا
}
```

**مثال**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'اسم المستخدم',
  length: 50,           // 50 حرفًا كحد أقصى
  trim: true,           // إزالة المسافات تلقائيًا
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - حقل النص

- **الوصف**: يُستخدم لتخزين البيانات النصية الطويلة. يدعم أنواع النصوص المختلفة في MySQL.
- **نوع قاعدة البيانات**: `TEXT`، `MEDIUMTEXT`، `LONGTEXT`
- **خصائص مميزة**:
  - `length`: نوع طول نص MySQL (`tiny`/`medium`/`long`)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // نوع طول نص MySQL
}
```

**مثال**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'المحتوى',
  length: 'medium',     // استخدام MEDIUMTEXT
  allowNull: true
}
```

### أنواع الأرقام

### `type: 'integer'` - حقل العدد الصحيح

- **الوصف**: يُستخدم لتخزين بيانات الأعداد الصحيحة. يدعم الزيادة التلقائية والمفتاح الأساسي.
- **نوع قاعدة البيانات**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // يرث جميع الخيارات من نوع INTEGER في Sequelize
}
```

**مثال**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'المعرف',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - حقل العدد الصحيح الكبير

- **الوصف**: يُستخدم لتخزين بيانات الأعداد الصحيحة الكبيرة، بنطاق أكبر من العدد الصحيح العادي.
- **نوع قاعدة البيانات**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**مثال**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'معرف المستخدم',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - حقل الرقم العائم (Float)

- **الوصف**: يُستخدم لتخزين أرقام الفاصلة العائمة ذات الدقة الواحدة.
- **نوع قاعدة البيانات**: `FLOAT`
- **خصائص مميزة**:
  - `precision`: الدقة (إجمالي عدد الأرقام)
  - `scale`: عدد الأرقام العشرية

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // الدقة
  scale?: number;      // عدد الأرقام العشرية
}
```

**مثال**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'النتيجة',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - حقل الرقم العائم مزدوج الدقة (Double)

- **الوصف**: يُستخدم لتخزين أرقام الفاصلة العائمة مزدوجة الدقة، والتي تتمتع بدقة أعلى من Float.
- **نوع قاعدة البيانات**: `DOUBLE`
- **خصائص مميزة**:
  - `precision`: الدقة (إجمالي عدد الأرقام)
  - `scale`: عدد الأرقام العشرية

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**مثال**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'السعر',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - حقل الرقم الحقيقي (Real)

- **الوصف**: يُستخدم لتخزين الأرقام الحقيقية؛ يعتمد على قاعدة البيانات.
- **نوع قاعدة البيانات**: `REAL`
- **خصائص مميزة**:
  - `precision`: الدقة (إجمالي عدد الأرقام)
  - `scale`: عدد الأرقام العشرية

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**مثال**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'سعر الصرف',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - حقل الرقم العشري الدقيق (Decimal)

- **الوصف**: يُستخدم لتخزين الأرقام العشرية الدقيقة، وهو مناسب للحسابات المالية.
- **نوع قاعدة البيانات**: `DECIMAL`
- **خصائص مميزة**:
  - `precision`: الدقة (إجمالي عدد الأرقام)
  - `scale`: عدد الأرقام العشرية

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // الدقة (إجمالي عدد الأرقام)
  scale?: number;      // عدد الأرقام العشرية
}
```

**مثال**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'المبلغ',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### أنواع القيم المنطقية (Boolean)

### `type: 'boolean'` - حقل القيمة المنطقية (Boolean)

- **الوصف**: يُستخدم لتخزين قيم الصواب/الخطأ، وعادةً ما يُستخدم لحالات التشغيل/الإيقاف.
- **نوع قاعدة البيانات**: `BOOLEAN` أو `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**مثال**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'هل هو نشط',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - حقل خيار واحد (Radio)

- **الوصف**: يُستخدم لتخزين قيمة مختارة واحدة، وعادةً ما يُستخدم للخيارات الثنائية.
- **نوع قاعدة البيانات**: `BOOLEAN` أو `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**مثال**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'هل هو افتراضي',
  defaultValue: false,
  allowNull: false
}
```

### أنواع التاريخ والوقت

### `type: 'date'` - حقل التاريخ

- **الوصف**: يُستخدم لتخزين بيانات التاريخ دون معلومات الوقت.
- **نوع قاعدة البيانات**: `DATE`
- **خصائص مميزة**:
  - `timezone`: ما إذا كان يتضمن معلومات المنطقة الزمنية

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // ما إذا كان يتضمن معلومات المنطقة الزمنية
}
```

**مثال**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'تاريخ الميلاد',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - حقل الوقت

- **الوصف**: يُستخدم لتخزين بيانات الوقت دون معلومات التاريخ.
- **نوع قاعدة البيانات**: `TIME`
- **خصائص مميزة**:
  - `timezone`: ما إذا كان يتضمن معلومات المنطقة الزمنية

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**مثال**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'وقت البدء',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - حقل التاريخ والوقت مع المنطقة الزمنية

- **الوصف**: يُستخدم لتخزين بيانات التاريخ والوقت مع معلومات المنطقة الزمنية.
- **نوع قاعدة البيانات**: `TIMESTAMP WITH TIME ZONE`
- **خصائص مميزة**:
  - `timezone`: ما إذا كان يتضمن معلومات المنطقة الزمنية

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**مثال**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'تاريخ الإنشاء',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - حقل التاريخ والوقت بدون المنطقة الزمنية

- **الوصف**: يُستخدم لتخزين بيانات التاريخ والوقت دون معلومات المنطقة الزمنية.
- **نوع قاعدة البيانات**: `TIMESTAMP` أو `DATETIME`
- **خصائص مميزة**:
  - `timezone`: ما إذا كان يتضمن معلومات المنطقة الزمنية

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**مثال**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'تاريخ التحديث',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - حقل التاريخ فقط

- **الوصف**: يُستخدم لتخزين البيانات التي تحتوي على التاريخ فقط، دون الوقت.
- **نوع قاعدة البيانات**: `DATE`
- **مثال**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'تاريخ النشر',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - حقل طابع الوقت Unix

- **الوصف**: يُستخدم لتخزين بيانات طابع الوقت Unix.
- **نوع قاعدة البيانات**: `BIGINT`
- **خصائص مميزة**:
  - `epoch`: وقت الحقبة (Epoch)

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // وقت الحقبة (Epoch)
}
```

**مثال**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'آخر وقت تسجيل دخول',
  allowNull: true,
  epoch: 0
}
```

### أنواع JSON

### `type: 'json'` - حقل JSON

- **الوصف**: يُستخدم لتخزين البيانات بتنسيق JSON، ويدعم هياكل البيانات المعقدة.
- **نوع قاعدة البيانات**: `JSON` أو `TEXT`
- **مثال**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'البيانات الوصفية',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - حقل JSONB

- **الوصف**: يُستخدم لتخزين البيانات بتنسيق JSONB (خاص بـ PostgreSQL)، ويدعم الفهرسة والاستعلام.
- **نوع قاعدة البيانات**: `JSONB` (PostgreSQL)
- **مثال**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'التهيئة',
  allowNull: true,
  defaultValue: {}
}
```

### أنواع المصفوفات

### `type: 'array'` - حقل المصفوفة

- **الوصف**: يُستخدم لتخزين بيانات المصفوفات، ويدعم أنواع عناصر مختلفة.
- **نوع قاعدة البيانات**: `JSON` أو `ARRAY`
- **خصائص مميزة**:
  - `dataType`: نوع التخزين (json/array)
  - `elementType`: نوع العنصر (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // نوع التخزين
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // نوع العنصر
}
```

**مثال**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'العلامات',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - حقل المجموعة (Set)

- **الوصف**: يُستخدم لتخزين بيانات المجموعات، وهي تشبه المصفوفة ولكن مع قيد التفرد.
- **نوع قاعدة البيانات**: `JSON` أو `ARRAY`
- **خصائص مميزة**:
  - `dataType`: نوع التخزين (json/array)
  - `elementType`: نوع العنصر (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**مثال**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'الفئات',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### أنواع المعرفات

### `type: 'uuid'` - حقل UUID

- **الوصف**: يُستخدم لتخزين المعرفات الفريدة بتنسيق UUID.
- **نوع قاعدة البيانات**: `UUID` أو `VARCHAR(36)`
- **خصائص مميزة**:
  - `autoFill`: التعبئة التلقائية

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // التعبئة التلقائية
}
```

**مثال**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'المعرف',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - حقل Nanoid

- **الوصف**: يُستخدم لتخزين المعرفات الفريدة القصيرة بتنسيق Nanoid.
- **نوع قاعدة البيانات**: `VARCHAR`
- **خصائص مميزة**:
  - `size`: طول المعرف
  - `customAlphabet`: مجموعة الأحرف المخصصة
  - `autoFill`: التعبئة التلقائية

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // طول المعرف
  customAlphabet?: string;  // مجموعة الأحرف المخصصة
  autoFill?: boolean;
}
```

**مثال**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'معرف قصير',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - حقل UID مخصص

- **الوصف**: يُستخدم لتخزين المعرفات الفريدة بتنسيق مخصص.
- **نوع قاعدة البيانات**: `VARCHAR`
- **خصائص مميزة**:
  - `prefix`: بادئة
  - `pattern`: نمط التحقق

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // بادئة
  pattern?: string; // نمط التحقق
}
```

**مثال**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'الرمز',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - حقل معرف Snowflake

- **الوصف**: يُستخدم لتخزين المعرفات الفريدة التي تم إنشاؤها بواسطة خوارزمية Snowflake.
- **نوع قاعدة البيانات**: `BIGINT`
- **مثال**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'معرف Snowflake',
  allowNull: false,
  unique: true
}
```

### الحقول الوظيفية

### `type: 'password'` - حقل كلمة المرور

- **الوصف**: يُستخدم لتخزين بيانات كلمة المرور المشفرة.
- **نوع قاعدة البيانات**: `VARCHAR`
- **خصائص مميزة**:
  - `length`: طول التجزئة (Hash)
  - `randomBytesSize`: حجم البايتات العشوائية

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // طول التجزئة (Hash)
  randomBytesSize?: number;  // حجم البايتات العشوائية
}
```

**مثال**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'كلمة المرور',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - حقل التشفير

- **الوصف**: يُستخدم لتخزين البيانات الحساسة المشفرة.
- **نوع قاعدة البيانات**: `VARCHAR`
- **مثال**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'مفتاح سري',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - حقل افتراضي

- **الوصف**: يُستخدم لتخزين البيانات الافتراضية المحسوبة التي لا تُخزّن في قاعدة البيانات.
- **نوع قاعدة البيانات**: `لا يوجد (حقل افتراضي)`
- **مثال**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'الاسم الكامل'
}
```

### `type: 'context'` - حقل السياق

- **الوصف**: يُستخدم لقراءة البيانات من سياق التشغيل (مثل معلومات المستخدم الحالي).
- **نوع قاعدة البيانات**: `يُحدد بناءً على dataType`
- **خصائص مميزة**:
  - `dataIndex`: مسار فهرس البيانات
  - `dataType`: نوع البيانات
  - `createOnly`: يُعيّن عند الإنشاء فقط

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // مسار فهرس البيانات
  dataType?: string;   // نوع البيانات
  createOnly?: boolean; // يُعيّن عند الإنشاء فقط
}
```

**مثال**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'معرف المستخدم الحالي',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### حقول العلاقات

### `type: 'belongsTo'` - علاقة "ينتمي إلى"

- **الوصف**: يمثل علاقة متعدد إلى واحد، حيث ينتمي السجل الحالي إلى سجل آخر.
- **نوع قاعدة البيانات**: `حقل المفتاح الأجنبي`
- **خصائص مميزة**:
  - `target`: اسم المجموعة الهدف
  - `foreignKey`: اسم حقل المفتاح الأجنبي
  - `targetKey`: اسم حقل المفتاح الهدف في المجموعة الهدف
  - `onDelete`: إجراء متسلسل عند الحذف
  - `onUpdate`: إجراء متسلسل عند التحديث
  - `constraints`: ما إذا كان سيتم تمكين قيود المفتاح الأجنبي

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // اسم المجموعة الهدف
  foreignKey?: string;  // اسم حقل المفتاح الأجنبي
  targetKey?: string;   // اسم حقل المفتاح الهدف في المجموعة الهدف
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // ما إذا كان سيتم تمكين قيود المفتاح الأجنبي
}
```

**مثال**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'المؤلف',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - علاقة "يمتلك واحدًا"

- **الوصف**: يمثل علاقة واحد إلى واحد، حيث يمتلك السجل الحالي سجلًا واحدًا مرتبطًا.
- **نوع قاعدة البيانات**: `حقل المفتاح الأجنبي`
- **خصائص مميزة**:
  - `target`: اسم المجموعة الهدف
  - `foreignKey`: اسم حقل المفتاح الأجنبي
  - `sourceKey`: اسم حقل المفتاح المصدر في المجموعة المصدر
  - `onDelete`: إجراء متسلسل عند الحذف
  - `onUpdate`: إجراء متسلسل عند التحديث
  - `constraints`: ما إذا كان سيتم تمكين قيود المفتاح الأجنبي

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // اسم حقل المفتاح المصدر
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**مثال**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'ملف تعريف المستخدم',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - علاقة "يمتلك العديد"

- **الوصف**: يمثل علاقة واحد إلى متعدد، حيث يمتلك السجل الحالي سجلات متعددة مرتبطة.
- **نوع قاعدة البيانات**: `حقل المفتاح الأجنبي`
- **خصائص مميزة**:
  - `target`: اسم المجموعة الهدف
  - `foreignKey`: اسم حقل المفتاح الأجنبي
  - `sourceKey`: اسم حقل المفتاح المصدر في المجموعة المصدر
  - `sortBy`: حقل الفرز
  - `sortable`: ما إذا كان قابلًا للفرز
  - `onDelete`: إجراء متسلسل عند الحذف
  - `onUpdate`: إجراء متسلسل عند التحديث
  - `constraints`: ما إذا كان سيتم تمكين قيود المفتاح الأجنبي

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // حقل الفرز
  sortable?: boolean; // ما إذا كان قابلًا للفرز
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**مثال**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'المقالات',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - علاقة "ينتمي إلى العديد"

- **الوصف**: يمثل علاقة متعدد إلى متعدد، يربط مجموعتين عبر جدول وصل.
- **نوع قاعدة البيانات**: `جدول الوصل`
- **خصائص مميزة**:
  - `target`: اسم المجموعة الهدف
  - `through`: اسم جدول الوصل
  - `foreignKey`: اسم حقل المفتاح الأجنبي
  - `otherKey`: المفتاح الأجنبي الآخر في جدول الوصل
  - `sourceKey`: اسم حقل المفتاح المصدر في المجموعة المصدر
  - `targetKey`: اسم حقل المفتاح الهدف في المجموعة الهدف
  - `onDelete`: إجراء متسلسل عند الحذف
  - `onUpdate`: إجراء متسلسل عند التحديث
  - `constraints`: ما إذا كان سيتم تمكين قيود المفتاح الأجنبي

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // اسم جدول الوصل
  foreignKey?: string;
  otherKey?: string;  // المفتاح الأجنبي الآخر في جدول الوصل
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**مثال**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'العلامات',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```