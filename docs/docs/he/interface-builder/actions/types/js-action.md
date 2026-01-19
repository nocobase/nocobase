:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פעולת JS

## מבוא

פעולת JS משמשת להרצת JavaScript בלחיצת כפתור, ומאפשרת התאמה אישית של כל התנהגות עסקית. ניתן להשתמש בה במקומות שונים כמו סרגלי כלים של טפסים, סרגלי כלים של טבלאות (ברמת ה**אוסף**), שורות טבלה (ברמת הרשומה), ועוד. היא מאפשרת לבצע פעולות כמו אימות נתונים, הצגת התראות, קריאות ל-API, פתיחת חלונות קופצים/מגירות ורענון נתונים.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API של הקשר זמן ריצה (נפוץ)

- `ctx.api.request(options)`: שולח בקשת HTTP;
- `ctx.openView(viewUid, options)`: פותח תצוגה מוגדרת (מגירה/דיאלוג/עמוד);
- `ctx.message` / `ctx.notification`: הודעות והתראות גלובליות;
- `ctx.t()` / `ctx.i18n.t()`: בינאום (Internationalization);
- `ctx.resource`: משאב נתונים עבור הקשר ברמת ה**אוסף** (לדוגמה, סרגל כלים של טבלה), הכולל מתודות כמו `getSelectedRows()` ו-`refresh()`;
- `ctx.record`: רשומת השורה הנוכחית עבור הקשר ברמת הרשומה (לדוגמה, כפתור בשורת טבלה);
- `ctx.form`: מופע AntD Form עבור הקשר ברמת הטופס (לדוגמה, כפתור בסרגל כלים של טופס);
- `ctx.collection`: מטא-מידע של ה**אוסף** הנוכחי;
- עורך הקוד תומך ב`Snippets` (קטעי קוד) וב`Run` (הרצה מקדימה) (ראו להלן).

- `ctx.requireAsync(url)`: טוען ספריית AMD/UMD באופן אסינכרוני מכתובת URL;
- `ctx.importAsync(url)`: מייבא מודול ESM באופן דינמי מכתובת URL;

> המשתנים הזמינים בפועל עשויים להשתנות בהתאם למיקום הכפתור. הרשימה לעיל היא סקירה כללית של היכולות הנפוצות.

## עורך וקטעי קוד

- `Snippets`: פותח רשימה של קטעי קוד מובנים, אותם ניתן לחפש ולהוסיף בלחיצה אחת למיקום הסמן הנוכחי.
- `Run`: מריץ את הקוד הנוכחי ישירות ומציג את יומני ההרצה בלוח ה`Logs` שבתחתית. תומך ב`console.log/info/warn/error` ובהדגשת שגיאות לזיהוי קל.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- ניתן להשתמש בעובדי AI כדי ליצור/לשנות סקריפטים: [עובד AI · נתן: מהנדס פרונטאנד](/ai-employees/built-in/ai-coding)

## שימושים נפוצים (דוגמאות מקוצרות)

### 1) בקשת API והודעה

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) כפתור **אוסף**: אימות בחירה ועיבוד

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: הטמעו את הלוגיקה העסקית...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) כפתור רשומה: קריאת רשומת השורה הנוכחית

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) פתיחת תצוגה (מגירה/דיאלוג)

```js
const popupUid = ctx.model.uid + '-open'; // קשור לכפתור הנוכחי, לשמירה על יציבות
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) רענון נתונים לאחר שליחה

```js
// רענון כללי: קודם כל משאבי טבלה/רשימה, אחר כך משאבי הבלוק המכיל את הטופס
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## הערות

- **פעולות אידמפוטנטיות**: כדי למנוע שליחות מרובות כתוצאה מלחיצות חוזרות, ניתן להוסיף דגל מצב בלוגיקה שלכם או להשבית את הכפתור.
- **טיפול בשגיאות**: הוסיפו בלוקי try/catch לקריאות API וספקו משוב ידידותי למשתמש.
- **אינטראקציה עם תצוגות**: בעת פתיחת חלון קופץ/מגירה באמצעות `ctx.openView`, מומלץ להעביר פרמטרים במפורש, ובמידת הצורך, לרענן באופן יזום את משאב ההורה לאחר שליחה מוצלחת.

## מסמכים קשורים

- [משתנים והקשר](/interface-builder/variables)
- [כללי קישוריות](/interface-builder/linkage-rule)
- [תצוגות וחלונות קופצים](/interface-builder/actions/types/view)