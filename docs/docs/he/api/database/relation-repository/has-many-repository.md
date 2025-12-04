:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# HasManyRepository

`HasManyRepository` הוא `Relation Repository` המשמש לטיפול במערכות יחסים מסוג `HasMany`.

## מתודות מחלקה

### `find()`

מוצא אובייקטים מקושרים

**חתימה**

- `async find(options?: FindOptions): Promise<M[]>`

**פרטים**

פרמטרי השאילתה זהים לאלו של [`Repository.find()`](../repository.md#find).

### `findOne()`

מוצא אובייקט מקושר, ומחזיר רשומה אחת בלבד.

**חתימה**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

מחזיר את מספר הרשומות התואמות את תנאי השאילתה.

**חתימה**

- `async count(options?: CountOptions)`

**טיפוס**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

שולף מהמסד נתונים אוסף נתונים ומספר תוצאות התואמים תנאים ספציפיים.

**חתימה**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**טיפוס**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

יוצר אובייקטים מקושרים.

**חתימה**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

מעדכן אובייקטים מקושרים העומדים בתנאים.

**חתימה**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

מוחק אובייקטים מקושרים העומדים בתנאים.

**חתימה**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

מוסיף קישורי אובייקטים.

**חתימה**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**טיפוס**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**פרטים**

- `tk` - ערך ה-`targetKey` של האובייקט המקושר, יכול להיות ערך בודד או מערך.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

מסיר את הקישור עם האובייקטים הנתונים.

**חתימה**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**פרטים**

הפרמטרים זהים לאלו של מתודת [`add()`](#add).

### `set()`

מגדיר את האובייקטים המקושרים עבור מערכת היחסים הנוכחית.

**חתימה**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**פרטים**

הפרמטרים זהים לאלו של מתודת [`add()`](#add).