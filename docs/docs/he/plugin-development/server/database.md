:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מסד נתונים

`Database` הוא רכיב חשוב במקורות נתונים מסוג מסד נתונים (`DataSource`). לכל מקור נתונים מסוג מסד נתונים יש מופע `Database` מתאים, הנגיש דרך `dataSource.db`. מופע מסד הנתונים של מקור הנתונים הראשי מספק גם את הכינוי הנוח `app.db`. היכרות עם השיטות הנפוצות של `db` היא הבסיס לכתיבת תוספים בצד השרת.

## רכיבי ה-Database

`Database` טיפוסי מורכב מהחלקים הבאים:

- **אוסף** (`Collection`): מגדיר את מבנה טבלת הנתונים.
- **Model**: מתאים למודלים של ORM (מנוהל בדרך כלל על ידי Sequelize).
- **Repository**: שכבת מאגר המכילה לוגיקה לגישה לנתונים, ומספקת שיטות פעולה ברמה גבוהה יותר.
- **FieldType**: סוגי שדות.
- **FilterOperator**: אופרטורים המשמשים לסינון.
- **Event**: אירועי מחזור חיים ואירועי מסד נתונים.

## תזמון שימוש בתוספים

### פעולות מתאימות בשלב beforeLoad

בשלב זה, אין לבצע פעולות במסד הנתונים. הוא מתאים לרישום מחלקות סטטיות או להאזנה לאירועים.

- `db.registerFieldTypes()` — סוגי שדות מותאמים אישית
- `db.registerModels()` — רישום מחלקות Model מותאמות אישית
- `db.registerRepositories()` — רישום מחלקות Repository מותאמות אישית
- `db.registerOperators()` — רישום אופרטורי סינון מותאמים אישית
- `db.on()` — האזנה לאירועים הקשורים למסד הנתונים

### פעולות מתאימות בשלב load

בשלב זה, כל הגדרות המחלקות והאירועים הקודמים כבר נטענו, כך שטעינת טבלאות נתונים לא תכלול חוסרים או השמטות.

- `db.defineCollection()` — הגדרת טבלאות נתונים חדשות
- `db.extendCollection()` — הרחבת תצורות טבלאות נתונים קיימות

אם אתם מגדירים טבלאות מובנות של תוספים, מומלץ יותר למקם אותן בספרייה `./src/server/collections`. לפרטים נוספים, ראו [אוספים](./collections.md).

## פעולות נתונים

`Database` מספק שתי דרכים עיקריות לגישה ולתפעול נתונים:

### פעולות באמצעות Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

שכבת ה-Repository משמשת בדרך כלל לעטיפת לוגיקה עסקית, כגון חלוקה לעמודים (pagination), סינון, בדיקות הרשאות ועוד.

### פעולות באמצעות Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

שכבת ה-Model מתאימה ישירות לישויות ORM, והיא מתאימה לביצוע פעולות מסד נתונים ברמה נמוכה יותר.

## באילו שלבים מותר לבצע פעולות במסד הנתונים?

### מחזור חיים של תוסף

| שלב | מותר לבצע פעולות במסד הנתונים |
|------|-------------------------------|
| `staticImport` | לא |
| `afterAdd` | לא |
| `beforeLoad` | לא |
| `load` | לא |
| `install` | כן |
| `beforeEnable` | כן |
| `afterEnable` | כן |
| `beforeDisable` | כן |
| `afterDisable` | כן |
| `remove` | כן |
| `handleSyncMessage` | כן |

### אירועי App

| שלב | מותר לבצע פעולות במסד הנתונים |
|------|-------------------------------|
| `beforeLoad` | לא |
| `afterLoad` | לא |
| `beforeStart` | כן |
| `afterStart` | כן |
| `beforeInstall` | לא |
| `afterInstall` | כן |
| `beforeStop` | כן |
| `afterStop` | לא |
| `beforeDestroy` | כן |
| `afterDestroy` | לא |
| `beforeLoadPlugin` | לא |
| `afterLoadPlugin` | לא |
| `beforeEnablePlugin` | כן |
| `afterEnablePlugin` | כן |
| `beforeDisablePlugin` | כן |
| `afterDisablePlugin` | כן |
| `afterUpgrade` | כן |

### אירועים/ווים של Database

| שלב | מותר לבצע פעולות במסד הנתונים |
|------|-------------------------------|
| `beforeSync` | לא |
| `afterSync` | כן |
| `beforeValidate` | כן |
| `afterValidate` | כן |
| `beforeCreate` | כן |
| `afterCreate` | כן |
| `beforeUpdate` | כן |
| `afterUpdate` | כן |
| `beforeSave` | כן |
| `afterSave` | כן |
| `beforeDestroy` | כן |
| `afterDestroy` | כן |
| `afterCreateWithAssociations` | כן |
| `afterUpdateWithAssociations` | כן |
| `afterSaveWithAssociations` | כן |
| `beforeDefineCollection` | לא |
| `afterDefineCollection` | לא |
| `beforeRemoveCollection` | לא |
| `afterRemoveCollection` | לא |