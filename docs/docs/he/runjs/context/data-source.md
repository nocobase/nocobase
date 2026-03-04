:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/data-source).
:::

# ctx.dataSource

מופע של מקור הנתונים (`DataSource`) המקושר להקשר ההרצה (context) הנוכחי של RunJS, המשמש לגישה לאוספים, מטא-דאטה של שדות וניהול הגדרות אוספים **בתוך מקור הנתונים הנוכחי**. בדרך כלל הוא מתייחס למקור הנתונים שנבחר עבור הדף או הבלוק הנוכחי (למשל, מסד הנתונים הראשי `main`).

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **פעולות במקור נתונים יחיד** | קבלת מטא-דאטה של אוספים ושדות כאשר מקור הנתונים הנוכחי ידוע. |
| **ניהול אוספים** | קבלה, הוספה, עדכון או מחיקה של אוספים תחת מקור הנתונים הנוכחי. |
| **קבלת שדות לפי נתיב** | שימוש בפורמט `collectionName.fieldPath` כדי לקבל הגדרות שדה (תומך בנתיבי קשר/association). |

> הערה: `ctx.dataSource` מייצג מקור נתונים יחיד עבור ההקשר הנוכחי; כדי למנות או לגשת למקורות נתונים אחרים, אנא השתמשו ב-[ctx.dataSourceManager](./data-source-manager.md).

## הגדרת טיפוסים (Type Definition)

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // מאפיינים לקריאה בלבד
  get flowEngine(): FlowEngine;   // מופע FlowEngine נוכחי
  get displayName(): string;      // שם תצוגה (תומך ב-i18n)
  get key(): string;              // מפתח מקור הנתונים, למשל 'main'
  get name(): string;             // זהה ל-key

  // קריאת אוספים
  getCollections(): Collection[];                      // קבלת כל האוספים
  getCollection(name: string): Collection | undefined; // קבלת אוסף לפי שם
  getAssociation(associationName: string): CollectionField | undefined; // קבלת שדה קשר (למשל users.roles)

  // ניהול אוספים
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // מטא-דאטה של שדות
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## מאפיינים נפוצים

| מאפיין | טיפוס | תיאור |
|------|------|------|
| `key` | `string` | מפתח מקור הנתונים, למשל `'main'` |
| `name` | `string` | זהה ל-key |
| `displayName` | `string` | שם תצוגה (תומך ב-i18n) |
| `flowEngine` | `FlowEngine` | מופע FlowEngine נוכחי |

## מתודות נפוצות

| מתודה | תיאור |
|------|------|
| `getCollections()` | מחזירה את כל האוספים תחת מקור הנתונים הנוכחי (ממוינים, לאחר סינון של אלו המוסתרים). |
| `getCollection(name)` | מחזירה אוסף לפי שם; ה-`name` יכול להיות בפורמט `collectionName.fieldName` כדי לקבל את אוסף היעד של קשר (association). |
| `getAssociation(associationName)` | מחזירה הגדרת שדה קשר לפי `collectionName.fieldName`. |
| `getCollectionField(fieldPath)` | מחזירה הגדרת שדה לפי `collectionName.fieldPath`, תומכת בנתיבי קשר כמו `users.profile.avatar`. |

## היחס ל-ctx.dataSourceManager

| צורך | שימוש מומלץ |
|------|----------|
| **מקור נתונים יחיד המקושר להקשר הנוכחי** | `ctx.dataSource` |
| **נקודת כניסה לכל מקורות הנתונים** | `ctx.dataSourceManager` |
| **קבלת אוסף בתוך מקור הנתונים הנוכחי** | `ctx.dataSource.getCollection(name)` |
| **קבלת אוסף בין מקורות נתונים שונים** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **קבלת שדה בתוך מקור הנתונים הנוכחי** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **קבלת שדה בין מקורות נתונים שונים** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## דוגמאות

### קבלת אוספים ושדות

```ts
// קבלת כל האוספים
const collections = ctx.dataSource.getCollections();

// קבלת אוסף לפי שם
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// קבלת הגדרת שדה לפי "collectionName.fieldPath" (תומך בקשרים)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### קבלת שדות קשר (Association)

```ts
// קבלת הגדרת שדה קשר לפי collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // עיבוד בהתבסס על מבנה אוסף היעד
}
```

### מעבר על אוספים לעיבוד דינמי

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### ביצוע אימות או UI דינמי בהתבסס על מטא-דאטה של שדות

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // ביצוע לוגיקת UI או אימות בהתבסס על interface, enum, validation וכו'.
}
```

## הערות

- פורמט הנתיב עבור `getCollectionField(fieldPath)` הוא `collectionName.fieldPath`, כאשר המקטע הראשון הוא שם האוסף והמקטעים הבאים הם נתיב השדה (תומך בקשרים, למשל `user.name`).
- `getCollection(name)` תומך בפורמט `collectionName.fieldName`, ומחזיר את אוסף היעד של שדה הקשר.
- בהקשר של RunJS, ה-`ctx.dataSource` נקבע בדרך כלל על ידי מקור הנתונים של הבלוק או הדף הנוכחי. אם לא קושר מקור נתונים להקשר, הוא עשוי להיות `undefined`; מומלץ לבצע בדיקת null לפני השימוש.

## קשור

- [ctx.dataSourceManager](./data-source-manager.md): מנהל מקורות נתונים, מנהל את כל מקורות הנתונים.
- [ctx.collection](./collection.md): האוסף המקושר להקשר הנוכחי.
- [ctx.collectionField](./collection-field.md): הגדרת שדה האוסף עבור השדה הנוכחי.