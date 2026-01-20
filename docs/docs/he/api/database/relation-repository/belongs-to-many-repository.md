:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# BelongsToManyRepository

`BelongsToManyRepository` הוא `Relation Repository` (מאגר יחסים) המיועד לטיפול ביחסי `BelongsToMany`.

בניגוד לסוגי יחסים אחרים, יחסי `BelongsToMany` דורשים תיעוד באמצעות טבלת צומת (junction table). בעת הגדרת יחס אסוציאטיבי ב-NocoBase, ניתן ליצור טבלת צומת באופן אוטומטי, או לציין אותה במפורש.

## מתודות מחלקה

### `find()`

מאתר אובייקטים מקושרים

**חתימה**

- `async find(options?: FindOptions): Promise<M[]>`

**פרטים**

פרמטרי השאילתה תואמים ל- [`Repository.find()`](../repository.md#find).

### `findOne()`

מאתר אובייקט מקושר, ומחזיר רשומה אחת בלבד

**חתימה**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

מחזיר את מספר הרשומות התואמות לתנאי השאילתה

**חתימה**

- `async count(options?: CountOptions)`

**סוג**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

מבצע שאילתה במסד הנתונים עבור קבוצת נתונים וספירה כוללת תחת תנאים ספציפיים.

**חתימה**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**סוג**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

יוצר אובייקט מקושר

**חתימה**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

מעדכן אובייקטים מקושרים העומדים בתנאים

**חתימה**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

מוחק אובייקטים מקושרים העומדים בתנאים

**חתימה**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

מוסיף אובייקטים מקושרים חדשים

**חתימה**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**סוג**

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

**פרטים**

ניתן להעביר ישירות את ה-`targetKey` של האובייקט המקושר, או להעביר את ה-`targetKey` יחד עם ערכי השדות של טבלת הצומת.

**דוגמה**

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

// העברת targetKey
PostTagRepository.add([t1.id, t2.id]);

// העברת שדות טבלת צומת
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

מגדיר אובייקטים מקושרים

**חתימה**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**פרטים**

הפרמטרים זהים לאלו של [add()](#add).

### `remove()`

מסיר את הקישוריות עם האובייקטים הנתונים

**חתימה**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**סוג**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

מחליף (toggle) אובייקטים מקושרים.

בתרחישים עסקיים מסוימים, לעיתים קרובות יש צורך להחליף אובייקטים מקושרים. לדוגמה, משתמש יכול לסמן מוצר כמועדף, לבטל את הסימון, ולסמן אותו שוב. מתודת ה-`toggle` מאפשרת ליישם פונקציונליות דומה במהירות.

**חתימה**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**פרטים**

מתודת ה-`toggle` בודקת באופן אוטומטי אם האובייקט המקושר כבר קיים. אם הוא קיים, הוא מוסר; אם לא, הוא מתווסף.