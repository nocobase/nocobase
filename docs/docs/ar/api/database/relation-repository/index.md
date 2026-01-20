:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# RelationRepository

`RelationRepository` هو كائن `Repository` لأنواع العلاقات. يتيح `RelationRepository` التعامل مع البيانات المرتبطة دون الحاجة لتحميل العلاقة نفسها. بناءً على `RelationRepository`، يشتق كل نوع علاقة تطبيقًا خاصًا به، وهي:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## الدالة البانية

**التوقيع**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**المعلمات**

| اسم المعلمة | النوع | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- |
| `sourceCollection` | `Collection` | - | الـ `Collection` (المجموعة) المطابقة للعلاقة المرجعية (referencing relation) ضمن الارتباط. |
| `association` | `string` | - | اسم الارتباط |
| `sourceKeyValue` | `string \| number` | - | قيمة المفتاح المطابقة في العلاقة المرجعية |

## خصائص الفئة الأساسية

### `db: Database`

كائن قاعدة البيانات

### `sourceCollection`

الـ `Collection` (المجموعة) المطابقة للعلاقة المرجعية (referencing relation) ضمن الارتباط.

### `targetCollection`

الـ `Collection` (المجموعة) المطابقة للعلاقة المشار إليها (referenced relation) ضمن الارتباط.

### `association`

كائن الارتباط في Sequelize المطابق للارتباط الحالي.

### `associationField`

الحقل في الـ `Collection` (المجموعة) المطابق للارتباط الحالي.

### `sourceKeyValue`

قيمة المفتاح المطابقة في العلاقة المرجعية.