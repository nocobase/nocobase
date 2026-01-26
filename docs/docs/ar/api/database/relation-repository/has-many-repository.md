:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# HasManyRepository

`HasManyRepository` هو `مستودع علاقات` (Relation Repository) يُستخدم للتعامل مع علاقات `HasMany`.

## طرق الفئة

### `find()`

البحث عن الكائنات المرتبطة

**التوقيع**

- `async find(options?: FindOptions): Promise<M[]>`

**التفاصيل**

تتطابق معلمات الاستعلام مع تلك الموجودة في [`Repository.find()`](../repository.md#find).

### `findOne()`

البحث عن كائن مرتبط، وإرجاع سجل واحد فقط

**التوقيع**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

إرجاع عدد السجلات التي تتطابق مع شروط الاستعلام

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

استعلام قاعدة البيانات عن مجموعة بيانات وعدد النتائج التي تتطابق مع شروط محددة.

**التوقيع**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**النوع**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

إنشاء كائنات مرتبطة

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

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

إضافة ارتباطات الكائنات

**التوقيع**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**النوع**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**التفاصيل**

- `tk` - قيمة `targetKey` للكائن المرتبط، يمكن أن تكون قيمة فردية أو مصفوفة.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

إزالة الارتباط مع الكائنات المحددة

**التوقيع**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**التفاصيل**

المعلمات هي نفسها المستخدمة في طريقة [`add()`](#add).

### `set()`

تعيين الكائنات المرتبطة للعلاقة الحالية

**التوقيع**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**التفاصيل**

المعلمات هي نفسها المستخدمة في طريقة [`add()`](#add).