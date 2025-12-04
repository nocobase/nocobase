:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# DataSourceManager ניהול מקורות נתונים

NocoBase מספקת `DataSourceManager` לניהול מספר מקורות נתונים. לכל `DataSource` יש מופעים משלו של `Database`, `ResourceManager` ו-`ACL`, מה שמאפשר למפתחים לנהל ולהרחיב מספר מקורות נתונים בצורה גמישה.

## מושגי יסוד

כל מופע של `DataSource` כולל את הפריטים הבאים:

- **`dataSource.collectionManager`**: משמש לניהול אוספים ושדות.
- **`dataSource.resourceManager`**: מטפל בפעולות הקשורות למשאבים (כגון יצירה, קריאה, עדכון ומחיקה – CRUD).
- **`dataSource.acl`**: בקרת גישה (ACL) לפעולות על משאבים.

לגישה נוחה, סופקו כינויים לחברי מקור הנתונים הראשי:

- `app.db` שקול ל- `dataSourceManager.get('main').collectionManager.db`
- `app.acl` שקול ל- `dataSourceManager.get('main').acl`
- `app.resourceManager` שקול ל- `dataSourceManager.get('main').resourceManager`

## שיטות נפוצות

### dataSourceManager.get(dataSourceKey)

שיטה זו מחזירה את מופע ה-`DataSource` המבוקש.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

רושמת Middleware עבור כל מקורות הנתונים. פעולה זו תשפיע על כל הפעולות המתבצעות על מקורות הנתונים.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

מתבצעת לפני טעינת מקור הנתונים. נפוצה לרישום מחלקות סטטיות, כגון מחלקות מודל ורישום סוגי שדות:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // סוג שדה מותאם אישית
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

מתבצעת לאחר טעינת מקור הנתונים. נפוצה לרישום פעולות, הגדרת בקרת גישה וכדומה.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // הגדרת הרשאות גישה
});
```

## הרחבת מקור נתונים

להרחבה מלאה של מקורות נתונים, עיינו בפרק [הרחבת מקורות נתונים](#).