:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# BelongsToManyRepository

`BelongsToManyRepository` هو `Relation Repository` يُستخدم للتعامل مع علاقات `BelongsToMany`.

على عكس أنواع العلاقات الأخرى، تتطلب علاقات `BelongsToMany` التسجيل عبر جدول وسيط (junction table).
عند تعريف علاقة ارتباط في NocoBase، يمكن إنشاء جدول وسيط تلقائيًا، أو يمكن تحديده بشكل صريح.

## طرق الفئة

### `find()`

البحث عن الكائنات المرتبطة

**التوقيع**

- `async find(options?: FindOptions): Promise<M[]>`

**التفاصيل**

تتوافق معلمات الاستعلام مع [`Repository.find()`](../repository.md#find).

### `findOne()`

البحث عن كائن مرتبط، وإرجاع سجل واحد فقط

**التوقيع**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

يُرجع عدد السجلات التي تتطابق مع شروط الاستعلام

**التوقيع**

- `async count(options?: CountOptions)`

**النوع**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

يستعلم قاعدة البيانات عن مجموعة بيانات والعدد الإجمالي تحت شروط محددة.

**التوقيع**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**النوع**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

إنشاء كائن مرتبط

**التوقيع**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

تحديث الكائنات المرتبطة التي تستوفي الشروط

**التوقيع**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

حذف الكائنات المرتبطة التي تستوفي الشروط

**التوقيع**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

إضافة كائنات مرتبطة جديدة

**التوقيع**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**النوع**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**التفاصيل**

يمكنك تمرير `targetKey` للكائن المرتبط مباشرةً، أو تمرير `targetKey` مع قيم حقول الجدول الوسيط معًا.

**مثال**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// Pass targetKey
PostTagRepository.add([t1.id, t2.id]);

// Pass junction table fields
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

تعيين الكائنات المرتبطة

**التوقيع**

- `async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>`

**التفاصيل**

المعلمات هي نفسها في [add()](#add).

### `remove()`

إزالة الارتباط مع الكائنات المحددة

**التوقيع**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**النوع**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

تبديل الكائنات المرتبطة.

في بعض سيناريوهات العمل، غالبًا ما يكون من الضروري تبديل الكائنات المرتبطة. على سبيل المثال، يمكن للمستخدم إضافة منتج إلى المفضلة، ثم إزالته، ثم إضافته مرة أخرى. يمكن استخدام طريقة `toggle` لتنفيذ هذه الوظيفة بسرعة.

**التوقيع**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**التفاصيل**

تتحقق طريقة `toggle` تلقائيًا مما إذا كان الكائن المرتبط موجودًا بالفعل. إذا كان موجودًا، تتم إزالته؛ وإذا لم يكن موجودًا، تتم إضافته.