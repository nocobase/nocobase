:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

## פרמטרי הגדרת אוסף

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

### `name` - שם אוסף
- **סוג**: `string`
- **נדרש**: ✅
- **תיאור**: המזהה הייחודי עבור האוסף, חייב להיות ייחודי בכל היישום.
- **דוגמה**:
```typescript
{
  name: 'users'  // אוסף משתמשים
}
```

### `title` - כותרת אוסף
- **סוג**: `string`
- **נדרש**: ❌
- **תיאור**: כותרת התצוגה של האוסף, המשמשת להצגה בממשק הקצה.
- **דוגמה**:
```typescript
{
  name: 'users',
  title: 'ניהול משתמשים'  // יוצג כ"ניהול משתמשים" בממשק
}
```

### `migrationRules` - כללי הגירה
- **סוג**: `MigrationRule[]`
- **נדרש**: ❌
- **תיאור**: כללי העיבוד עבור הגירת נתונים.
- **דוגמה**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // דריסת נתונים קיימים
  fields: [...]
}
```

### `inherits` - ירושה מאוספים
- **סוג**: `string[] | string`
- **נדרש**: ❌
- **תיאור**: ירושת הגדרות שדה מאוספים אחרים. תומך בירושה מאוסף יחיד או מרובה.
- **דוגמה**:

```typescript
// ירושה יחידה
{
  name: 'admin_users',
  inherits: 'users',  // יורש את כל השדות מאוסף המשתמשים
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// ירושה מרובה
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // יורש ממספר אוספים
  fields: [...]
}
```

### `filterTargetKey` - מפתח יעד לסינון
- **סוג**: `string | string[]`
- **נדרש**: ❌
- **תיאור**: מפתח היעד המשמש לסינון שאילתות. תומך במפתח יחיד או מרובה.
- **דוגמה**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // סינון לפי מזהה משתמש
  fields: [...]
}

// מספר מפתחות סינון
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // סינון לפי מזהה משתמש ומזהה קטגוריה
  fields: [...]
}
```

### `fields` - הגדרות שדה
- **סוג**: `FieldOptions[]`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `[]`
- **תיאור**: מערך של הגדרות שדה עבור האוסף. כל שדה כולל מידע כגון סוג, שם והגדרות.
- **דוגמה**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'שם משתמש'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'אימייל'
    },
    {
      type: 'password',
      name: 'password',
      title: 'סיסמה'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'נוצר ב'
    }
  ]
}
```

### `model` - מודל מותאם אישית
- **סוג**: `string | ModelStatic<Model>`
- **נדרש**: ❌
- **תיאור**: מציין מחלקת מודל Sequelize מותאמת אישית, שיכולה להיות שם המחלקה או מחלקת המודל עצמה.
- **דוגמה**:
```typescript
// ציון שם מחלקת המודל כמחרוזת
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// שימוש במחלקת המודל
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - מאגר מותאם אישית
- **סוג**: `string | RepositoryType`
- **נדרש**: ❌
- **תיאור**: מציין מחלקת מאגר מותאמת אישית לטיפול בלוגיקת גישה לנתונים.
- **דוגמה**:
```typescript
// ציון שם מחלקת המאגר כמחרוזת
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// שימוש במחלקת המאגר
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - יצירת ID אוטומטית
- **סוג**: `boolean`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `true`
- **תיאור**: האם ליצור אוטומטית מזהה מפתח ראשי.
- **דוגמה**:
```typescript
{
  name: 'users',
  autoGenId: true,  // יצירת מזהה מפתח ראשי אוטומטית
  fields: [...]
}

// השבתת יצירת ID אוטומטית (דורש הגדרה ידנית של מפתח ראשי)
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

### `timestamps` - הפעלת חותמות זמן
- **סוג**: `boolean`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `true`
- **תיאור**: האם לאפשר את שדות `createdAt` ו-`updatedAt`.
- **דוגמה**:
```typescript
{
  name: 'users',
  timestamps: true,  // הפעלת חותמות זמן
  fields: [...]
}
```

### `createdAt` - שדה נוצר ב
- **סוג**: `boolean | string`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `true`
- **תיאור**: הגדרות עבור שדה `createdAt`.
- **דוגמה**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // שם מותאם אישית לשדה createdAt
  fields: [...]
}
```

### `updatedAt` - שדה עודכן ב
- **סוג**: `boolean | string`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `true`
- **תיאור**: הגדרות עבור שדה `updatedAt`.
- **דוגמה**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // שם מותאם אישית לשדה updatedAt
  fields: [...]
}
```

### `deletedAt` - שדה מחיקה רכה
- **סוג**: `boolean | string`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `false`
- **תיאור**: הגדרות עבור שדה המחיקה הרכה.
- **דוגמה**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // הפעלת מחיקה רכה
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - מצב מחיקה רכה
- **סוג**: `boolean`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `false`
- **תיאור**: האם לאפשר מצב מחיקה רכה.
- **דוגמה**:
```typescript
{
  name: 'users',
  paranoid: true,  // הפעלת מחיקה רכה
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - שמות עם קו תחתון
- **סוג**: `boolean`
- **נדרש**: ❌
- **ערך ברירת מחדל**: `false`
- **תיאור**: האם להשתמש בסגנון שמות עם קו תחתון (לדוגמה: `created_at` במקום `createdAt`).
- **דוגמה**:
```typescript
{
  name: 'users',
  underscored: true,  // שימוש בסגנון שמות עם קו תחתון
  fields: [...]
}
```

### `indexes` - הגדרת אינדקסים
- **סוג**: `ModelIndexesOptions[]`
- **נדרש**: ❌
- **תיאור**: הגדרת אינדקסים במסד הנתונים.
- **דוגמה**:
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

## הגדרת פרמטרי שדה

NocoBase תומך במספר סוגי שדות, כולם מוגדרים על בסיס טיפוס האיחוד `FieldOptions`. הגדרת שדה כוללת מאפיינים בסיסיים, מאפיינים ספציפיים לסוג הנתונים, מאפייני קשרים ומאפייני רינדור קצה.

### אפשרויות שדה בסיסיות

כל סוגי השדות יורשים מ-`BaseFieldOptions`, ומספקים יכולות הגדרת שדה נפוצות:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // פרמטרים כלליים
  name?: string;                    // שם שדה
  hidden?: boolean;                 // האם להסתיר
  validation?: ValidationOptions<T>; // כללי אימות

  // מאפייני עמודה נפוצים
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // קשור לממשק קצה
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**דוגמה**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // לא מאפשר ערכי NULL
  unique: true,           // אילוץ ייחודיות
  defaultValue: '',       // ברירת מחדל למחרוזת ריקה
  index: true,            // יצירת אינדקס
  comment: 'שם משתמש להתחברות'    // הערה במסד הנתונים
}
```

### `name` - שם שדה

- **סוג**: `string`
- **נדרש**: ❌
- **תיאור**: שם העמודה של השדה במסד הנתונים, חייב להיות ייחודי בתוך האוסף.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'username',  // שם שדה
  title: 'שם משתמש'
}
```

### `hidden` - שדה מוסתר

- **סוג**: `boolean`
- **ערך ברירת מחדל**: `false`
- **תיאור**: האם להסתיר שדה זה כברירת מחדל ברשימות ובטפסים.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // הסתרת שדה מזהה פנימי
  title: 'מזהה פנימי'
}
```

### `validation` - כללי אימות

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // סוג אימות
  rules: FieldValidationRule<T>[];  // מערך של כללי אימות
  [key: string]: any;              // אפשרויות אימות נוספות
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // מפתח כלל
  name: FieldValidationRuleName<T>; // שם כלל
  args?: {                         // ארגומנטים לכלל
    [key: string]: any;
  };
  paramsType?: 'object';           // סוג פרמטר
}
```

- **סוג**: `ValidationOptions<T>`
- **תיאור**: שימוש ב-Joi להגדרת כללי אימות בצד השרת.
- **דוגמה**:
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

### `allowNull` - אפשר ערכי NULL

- **סוג**: `boolean`
- **ערך ברירת מחדל**: `true`
- **תיאור**: קובע אם מסד הנתונים מאפשר כתיבת ערכי `NULL`.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // לא מאפשר ערכי NULL
  title: 'שם משתמש'
}
```

### `defaultValue` - ערך ברירת מחדל

- **סוג**: `any`
- **תיאור**: ערך ברירת המחדל עבור השדה, משמש כאשר רשומה נוצרת ללא מתן ערך לשדה זה.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // ברירת מחדל למצב טיוטה
  title: 'סטטוס'
}
```

### `unique` - אילוץ ייחודיות

- **סוג**: `boolean | string`
- **ערך ברירת מחדל**: `false`
- **תיאור**: האם הערך חייב להיות ייחודי. מחרוזת יכולה לשמש לציון שם האילוץ.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // אימייל חייב להיות ייחודי
  title: 'אימייל'
}
```

### `primaryKey` - מפתח ראשי

- **סוג**: `boolean`
- **ערך ברירת מחדל**: `false`
- **תיאור**: מצהיר על שדה זה כמפתח ראשי.
- **דוגמה**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // הגדרה כמפתח ראשי
  autoIncrement: true
}
```

### `autoIncrement` - גידול אוטומטי

- **סוג**: `boolean`
- **ערך ברירת מחדל**: `false`
- **תיאור**: מאפשר גידול אוטומטי (חל רק על שדות מספריים).
- **דוגמה**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // גידול אוטומטי
  primaryKey: true
}
```

### `field` - שם עמודה במסד הנתונים

- **סוג**: `string`
- **תיאור**: מציין את שם עמודת מסד הנתונים בפועל (תואם ל-`field` של Sequelize).
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // שם העמודה במסד הנתונים
  title: 'מזהה משתמש'
}
```

### `comment` - הערה במסד הנתונים

- **סוג**: `string`
- **תיאור**: הערה עבור שדה מסד הנתונים, המשמשת למטרות תיעוד.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'שם משתמש להתחברות למערכת',  // הערה במסד הנתונים
  title: 'שם משתמש'
}
```

### `title` - כותרת תצוגה

- **סוג**: `string`
- **תיאור**: כותרת התצוגה עבור השדה, נפוץ לשימוש בממשק הקצה.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'שם משתמש',  // הכותרת המוצגת בממשק הקצה
  allowNull: false
}
```

### `description` - תיאור שדה

- **סוג**: `string`
- **תיאור**: מידע תיאורי על השדה כדי לעזור למשתמשים להבין את מטרתו.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'אימייל',
  description: 'אנא הזן כתובת אימייל חוקית',  // תיאור שדה
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - רכיב ממשק

- **סוג**: `string`
- **תיאור**: רכיב ממשק הקצה המומלץ עבור השדה.
- **דוגמה**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'תוכן',
  interface: 'textarea',  // מומלץ להשתמש ברכיב תיבת טקסט
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### ממשקי סוגי שדות

### `type: 'string'` - שדה מחרוזת

- **תיאור**: משמש לאחסון נתוני טקסט קצרים. תומך במגבלות אורך וקיצוץ אוטומטי.
- **סוג מסד נתונים**: `VARCHAR`
- **מאפיינים ספציפיים**:
  - `length`: מגבלת אורך המחרוזת.
  - `trim`: האם להסיר אוטומטית רווחים מובילים וסופיים.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // מגבלת אורך המחרוזת
  trim?: boolean;     // האם להסיר אוטומטית רווחים מובילים וסופיים
}
```

**דוגמה**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'שם משתמש',
  length: 50,           // מקסימום 50 תווים
  trim: true,           // הסרת רווחים אוטומטית
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

### `type: 'text'` - שדה טקסט

- **תיאור**: משמש לאחסון נתוני טקסט ארוכים. תומך בסוגי טקסט שונים ב-MySQL.
- **סוג מסד נתונים**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **מאפיינים ספציפיים**:
  - `length`: סוג אורך טקסט ב-MySQL (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // סוג אורך טקסט ב-MySQL
}
```

**דוגמה**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'תוכן',
  length: 'medium',     // שימוש ב-MEDIUMTEXT
  allowNull: true
}
```

### סוגים מספריים

### `type: 'integer'` - שדה מספר שלם

- **תיאור**: משמש לאחסון נתוני מספר שלם. תומך בגידול אוטומטי ובמפתח ראשי.
- **סוג מסד נתונים**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // יורש את כל האפשרויות מטיפוס INTEGER של Sequelize
}
```

**דוגמה**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'מזהה',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - שדה מספר שלם גדול

- **תיאור**: משמש לאחסון נתוני מספר שלם גדול, עם טווח גדול יותר מ-`integer`.
- **סוג מסד נתונים**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**דוגמה**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'מזהה משתמש',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - שדה נקודה צפה

- **תיאור**: משמש לאחסון מספרי נקודה צפה בדיוק יחיד.
- **סוג מסד נתונים**: `FLOAT`
- **מאפיינים ספציפיים**:
  - `precision`: דיוק (מספר כולל של ספרות).
  - `scale`: קנה מידה (מספר מקומות עשרוניים).

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // דיוק
  scale?: number;      // מספר מקומות עשרוניים
}
```

**דוגמה**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'ציון',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - שדה נקודה צפה בדיוק כפול

- **תיאור**: משמש לאחסון מספרי נקודה צפה בדיוק כפול, בעלי דיוק גבוה יותר מ-`float`.
- **סוג מסד נתונים**: `DOUBLE`
- **מאפיינים ספציפיים**:
  - `precision`: דיוק (מספר כולל של ספרות).
  - `scale`: קנה מידה (מספר מקומות עשרוניים).

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**דוגמה**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'מחיר',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - שדה מספר ממשי

- **תיאור**: משמש לאחסון מספרים ממשיים; תלוי במסד הנתונים.
- **סוג מסד נתונים**: `REAL`
- **מאפיינים ספציפיים**:
  - `precision`: דיוק (מספר כולל של ספרות).
  - `scale`: קנה מידה (מספר מקומות עשרוניים).

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**דוגמה**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'שער חליפין',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - שדה עשרוני מדויק

- **תיאור**: משמש לאחסון מספרים עשרוניים מדויקים, מתאים לחישובים פיננסיים.
- **סוג מסד נתונים**: `DECIMAL`
- **מאפיינים ספציפיים**:
  - `precision`: דיוק (מספר כולל של ספרות).
  - `scale`: קנה מידה (מספר מקומות עשרוניים).

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // דיוק (מספר כולל של ספרות)
  scale?: number;      // מספר מקומות עשרוניים
}
```

**דוגמה**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'סכום',
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

### סוגים בוליאניים

### `type: 'boolean'` - שדה בוליאני

- **תיאור**: משמש לאחסון ערכי אמת/שקר, בדרך כלל למצבי הפעלה/כיבוי.
- **סוג מסד נתונים**: `BOOLEAN` או `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**דוגמה**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'האם פעיל',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - שדה רדיו

- **תיאור**: משמש לאחסון ערך יחיד נבחר, בדרך כלל לבחירות בינאריות.
- **סוג מסד נתונים**: `BOOLEAN` או `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**דוגמה**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'האם ברירת מחדל',
  defaultValue: false,
  allowNull: false
}
```

### סוגי תאריך ושעה

### `type: 'date'` - שדה תאריך

- **תיאור**: משמש לאחסון נתוני תאריך ללא מידע על שעה.
- **סוג מסד נתונים**: `DATE`
- **מאפיינים ספציפיים**:
  - `timezone`: האם לכלול מידע על אזור זמן.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // האם לכלול מידע על אזור זמן
}
```

**דוגמה**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'תאריך לידה',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - שדה שעה

- **תיאור**: משמש לאחסון נתוני שעה ללא מידע על תאריך.
- **סוג מסד נתונים**: `TIME`
- **מאפיינים ספציפיים**:
  - `timezone`: האם לכלול מידע על אזור זמן.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**דוגמה**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'שעת התחלה',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - שדה תאריך ושעה עם אזור זמן

- **תיאור**: משמש לאחסון נתוני תאריך ושעה עם מידע על אזור זמן.
- **סוג מסד נתונים**: `TIMESTAMP WITH TIME ZONE`
- **מאפיינים ספציפיים**:
  - `timezone`: האם לכלול מידע על אזור זמן.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**דוגמה**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'נוצר ב',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - שדה תאריך ושעה ללא אזור זמן

- **תיאור**: משמש לאחסון נתוני תאריך ושעה ללא מידע על אזור זמן.
- **סוג מסד נתונים**: `TIMESTAMP` או `DATETIME`
- **מאפיינים ספציפיים**:
  - `timezone`: האם לכלול מידע על אזור זמן.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**דוגמה**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'עודכן ב',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - שדה תאריך בלבד

- **תיאור**: משמש לאחסון נתונים המכילים רק את התאריך, ללא שעה.
- **סוג מסד נתונים**: `DATE`
- **דוגמה**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'תאריך פרסום',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - שדה חותמת זמן Unix

- **תיאור**: משמש לאחסון נתוני חותמת זמן Unix.
- **סוג מסד נתונים**: `BIGINT`
- **מאפיינים ספציפיים**:
  - `epoch`: זמן האפוק (Epoch time).

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // זמן האפוק
}
```

**דוגמה**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'זמן התחברות אחרון',
  allowNull: true,
  epoch: 0
}
```

### סוגי JSON

### `type: 'json'` - שדה JSON

- **תיאור**: משמש לאחסון נתונים בפורמט JSON, תומך במבני נתונים מורכבים.
- **סוג מסד נתונים**: `JSON` או `TEXT`
- **דוגמה**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'מטא נתונים',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - שדה JSONB

- **תיאור**: משמש לאחסון נתונים בפורמט JSONB (ספציפי ל-PostgreSQL), התומך באינדקסים ובשאילתות.
- **סוג מסד נתונים**: `JSONB` (PostgreSQL)
- **דוגמה**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'הגדרות',
  allowNull: true,
  defaultValue: {}
}
```

### סוגי מערכים

### `type: 'array'` - שדה מערך

- **תיאור**: משמש לאחסון נתוני מערך, תומך בסוגי אלמנטים שונים.
- **סוג מסד נתונים**: `JSON` או `ARRAY`
- **מאפיינים ספציפיים**:
  - `dataType`: סוג אחסון (`json`/`array`).
  - `elementType`: סוג אלמנט (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // סוג אחסון
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // סוג אלמנט
}
```

**דוגמה**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'תגיות',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - שדה קבוצה

- **תיאור**: משמש לאחסון נתוני קבוצה, בדומה למערך אך עם אילוץ ייחודיות.
- **סוג מסד נתונים**: `JSON` או `ARRAY`
- **מאפיינים ספציפיים**:
  - `dataType`: סוג אחסון (`json`/`array`).
  - `elementType`: סוג אלמנט (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**דוגמה**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'קטגוריות',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
}
```

### סוגי מזהים

### `type: 'uuid'` - שדה UUID

- **תיאור**: משמש לאחסון מזהים ייחודיים בפורמט UUID.
- **סוג מסד נתונים**: `UUID` או `VARCHAR(36)`
- **מאפיינים ספציפיים**:
  - `autoFill`: מילוי אוטומטי.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // מילוי אוטומטי
}
```

**דוגמה**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'מזהה',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - שדה Nanoid

- **תיאור**: משמש לאחסון מזהים ייחודיים קצרים בפורמט Nanoid.
- **סוג מסד נתונים**: `VARCHAR`
- **מאפיינים ספציפיים**:
  - `size`: אורך המזהה.
  - `customAlphabet`: סט תווים מותאם אישית.
  - `autoFill`: מילוי אוטומטי.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // אורך המזהה
  customAlphabet?: string;  // סט תווים מותאם אישית
  autoFill?: boolean;
}
```

**דוגמה**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'מזהה קצר',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - שדה UID מותאם אישית

- **תיאור**: משמש לאחסון מזהים ייחודיים בפורמט מותאם אישית.
- **סוג מסד נתונים**: `VARCHAR`
- **מאפיינים ספציפיים**:
  - `prefix`: קידומת.
  - `pattern`: תבנית אימות.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // קידומת
  pattern?: string; // תבנית אימות
}
```

**דוגמה**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'קוד',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - שדה Snowflake ID

- **תיאור**: משמש לאחסון מזהים ייחודיים שנוצרו על ידי אלגוריתם Snowflake.
- **סוג מסד נתונים**: `BIGINT`
- **דוגמה**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'מזהה Snowflake',
  allowNull: false,
  unique: true
}
```

### שדות פונקציונליים

### `type: 'password'` - שדה סיסמה

- **תיאור**: משמש לאחסון נתוני סיסמה מוצפנים.
- **סוג מסד נתונים**: `VARCHAR`
- **מאפיינים ספציפיים**:
  - `length`: אורך הגיבוב.
  - `randomBytesSize`: גודל בתים אקראיים.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // אורך הגיבוב
  randomBytesSize?: number;  // גודל בתים אקראיים
}
```

**דוגמה**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'סיסמה',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - שדה הצפנה

- **תיאור**: משמש לאחסון נתונים רגישים מוצפנים.
- **סוג מסד נתונים**: `VARCHAR`
- **דוגמה**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'מפתח סודי',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - שדה וירטואלי

- **תיאור**: משמש לאחסון נתונים וירטואליים מחושבים שאינם נשמרים במסד הנתונים.
- **סוג מסד נתונים**: ללא (שדה וירטואלי)
- **דוגמה**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'שם מלא'
}
```

### `type: 'context'` - שדה הקשר

- **תיאור**: משמש לקריאת נתונים מהקשר זמן הריצה (לדוגמה, מידע על המשתמש הנוכחי).
- **סוג מסד נתונים**: נקבע לפי `dataType`
- **מאפיינים ספציפיים**:
  - `dataIndex`: נתיב אינדקס הנתונים.
  - `dataType`: סוג הנתונים.
  - `createOnly`: הגדרה בעת יצירה בלבד.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // נתיב אינדקס נתונים
  dataType?: string;   // סוג נתונים
  createOnly?: boolean; // הגדרה בעת יצירה בלבד
}
```

**דוגמה**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'מזהה משתמש נוכחי',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### שדות קשרים

### `type: 'belongsTo'` - קשר שייכות (Belongs To)

- **תיאור**: מייצג קשר רבים-לאחד, כאשר הרשומה הנוכחית שייכת לרשומה אחרת.
- **סוג מסד נתונים**: שדה מפתח זר
- **מאפיינים ספציפיים**:
  - `target`: שם אוסף היעד.
  - `foreignKey`: שם שדה המפתח הזר.
  - `targetKey`: שם שדה המפתח באוסף היעד.
  - `onDelete`: פעולת מפל בעת מחיקה.
  - `onUpdate`: פעולת מפל בעת עדכון.
  - `constraints`: האם לאפשר אילוצי מפתח זר.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // שם אוסף היעד
  foreignKey?: string;  // שם שדה המפתח הזר
  targetKey?: string;   // שם שדה המפתח באוסף היעד
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // האם לאפשר אילוצי מפתח זר
}
```

**דוגמה**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'מחבר',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - קשר בעלות יחידה (Has One)

- **תיאור**: מייצג קשר אחד-לאחד, כאשר לרשומה הנוכחית יש רשומה קשורה אחת.
- **סוג מסד נתונים**: שדה מפתח זר
- **מאפיינים ספציפיים**:
  - `target`: שם אוסף היעד.
  - `foreignKey`: שם שדה המפתח הזר.
  - `sourceKey`: שם שדה המפתח באוסף המקור.
  - `onDelete`: פעולת מפל בעת מחיקה.
  - `onUpdate`: פעולת מפל בעת עדכון.
  - `constraints`: האם לאפשר אילוצי מפתח זר.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // שם שדה המפתח באוסף המקור
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**דוגמה**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'פרופיל משתמש',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - קשר בעלות מרובה (Has Many)

- **תיאור**: מייצג קשר אחד-לרבים, כאשר לרשומה הנוכחית יש מספר רשומות קשורות.
- **סוג מסד נתונים**: שדה מפתח זר
- **מאפיינים ספציפיים**:
  - `target`: שם אוסף היעד.
  - `foreignKey`: שם שדה המפתח הזר.
  - `sourceKey`: שם שדה המפתח באוסף המקור.
  - `sortBy`: שדה מיון.
  - `sortable`: האם ניתן למיון.
  - `onDelete`: פעולת מפל בעת מחיקה.
  - `onUpdate`: פעולת מפל בעת עדכון.
  - `constraints`: האם לאפשר אילוצי מפתח זר.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // שדה מיון
  sortable?: boolean; // האם ניתן למיון
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**דוגמה**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'רשימת מאמרים',
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

### `type: 'belongsToMany'` - קשר רבים-לרבים (Belongs To Many)

- **תיאור**: מייצג קשר רבים-לרבים, המחבר שני אוספים באמצעות טבלת קישור.
- **סוג מסד נתונים**: טבלת קישור
- **מאפיינים ספציפיים**:
  - `target`: שם אוסף היעד.
  - `through`: שם טבלת הקישור.
  - `foreignKey`: שם שדה המפתח הזר.
  - `otherKey`: המפתח הזר השני בטבלת הקישור.
  - `sourceKey`: שם שדה המפתח באוסף המקור.
  - `targetKey`: שם שדה המפתח באוסף היעד.
  - `onDelete`: פעולת מפל בעת מחיקה.
  - `onUpdate`: פעולת מפל בעת עדכון.
  - `constraints`: האם לאפשר אילוצי מפתח זר.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // שם טבלת הקישור
  foreignKey?: string;
  otherKey?: string;  // המפתח הזר השני בטבלת הקישור
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**דוגמה**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'תגיות',
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