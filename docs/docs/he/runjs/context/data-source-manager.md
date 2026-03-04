:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

מנהל מקורות הנתונים (מופע של `DataSourceManager`), המשמש לניהול וגישה למספר מקורות נתונים (כגון מסד הנתונים הראשי `main`, מסד נתוני לוגים `logging` וכו'). נעשה בו שימוש כאשר קיימים מספר מקורות נתונים או כאשר נדרשת גישה למטא-דאטה חוצה מקורות נתונים.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **ריבוי מקורות נתונים** | פירוט כל מקורות הנתונים, או קבלת מקור נתונים ספציפי לפי מפתח (key). |
| **גישה חוצת מקורות נתונים** | גישה למטא-דאטה באמצעות הפורמט "מפתח מקור נתונים + שם אוסף" כאשר מקור הנתונים של ההקשר הנוכחי אינו ידוע. |
| **קבלת שדות לפי נתיב מלא** | שימוש בפורמט `dataSourceKey.collectionName.fieldPath` כדי לאחזר הגדרות שדה בין מקורות נתונים שונים. |

> **הערה:** אם אתם פועלים רק על מקור הנתונים הנוכחי, העדיפו להשתמש ב-`ctx.dataSource`. השתמשו ב-`ctx.dataSourceManager` רק כאשר עליכם למנות או לעבור בין מקורות נתונים.

## הגדרת טיפוסים (Type Definition)

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // ניהול מקורות נתונים
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // קריאת מקורות נתונים
  getDataSources(): DataSource[];                     // קבלת כל מקורות הנתונים
  getDataSource(key: string): DataSource | undefined;  // קבלת מקור נתונים לפי מפתח

  // גישה ישירה למטא-דאטה לפי מקור נתונים + אוסף
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## היחס ל-ctx.dataSource

| צורך | שימוש מומלץ |
|------|----------|
| **מקור נתונים יחיד הקשור להקשר הנוכחי** | `ctx.dataSource` (למשל, מקור הנתונים של הדף/הבלוק הנוכחי) |
| **נקודת כניסה לכל מקורות הנתונים** | `ctx.dataSourceManager` |
| **פירוט או החלפת מקורות נתונים** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **קבלת אוסף בתוך מקור הנתונים הנוכחי** | `ctx.dataSource.getCollection(name)` |
| **קבלת אוסף בין מקורות נתונים** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **קבלת שדה בתוך מקור הנתונים הנוכחי** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **קבלת שדה בין מקורות נתונים** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## דוגמאות

### קבלת מקור נתונים ספציפי

```ts
// קבלת מקור הנתונים בשם 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// קבלת כל האוספים תחת מקור נתונים זה
const collections = mainDS?.getCollections();
```

### גישה למטא-דאטה של אוסף בין מקורות נתונים

```ts
// קבלת אוסף לפי dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// קבלת המפתח הראשי (primary key) של האוסף
const primaryKey = users?.filterTargetKey ?? 'id';
```

### קבלת הגדרת שדה לפי נתיב מלא

```ts
// פורמט: dataSourceKey.collectionName.fieldPath
// קבלת הגדרת שדה לפי "מפתח מקור נתונים.שם אוסף.נתיב שדה"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// תמיכה בנתיבי שדות מקושרים (association fields)
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### מעבר על כל מקורות הנתונים

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`מקור נתונים: ${ds.key}, שם תצוגה: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - אוסף: ${col.name}`);
  }
}
```

### בחירה דינמית של מקור נתונים על סמך משתנים

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## נקודות לתשומת לב

- פורמט הנתיב עבור `getCollectionField` הוא `dataSourceKey.collectionName.fieldPath`, כאשר המקטע הראשון הוא מפתח מקור הנתונים, ולאחריו שם האוסף ונתיב השדה.
- הפונקציה `getDataSource(key)` מחזירה `undefined` אם מקור הנתונים אינו קיים; מומלץ לבצע בדיקת ערך ריק לפני השימוש.
- הפונקציה `addDataSource` תזרוק שגיאה אם המפתח כבר קיים; `upsertDataSource` תדרוס את הקיים או תוסיף מקור נתונים חדש.

## נושאים קשורים

- [ctx.dataSource](./data-source.md): מופע מקור הנתונים הנוכחי
- [ctx.collection](./collection.md): האוסף הקשור להקשר הנוכחי
- [ctx.collectionField](./collection-field.md): הגדרת שדה האוסף עבור השדה הנוכחי