:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אוספים (Collections)

בפיתוח תוספים ב-NocoBase, **אוסף (Collection) (טבלת נתונים)** הוא אחד ממושגי הליבה החשובים ביותר. באפשרותכם להוסיף או לשנות מבני טבלאות נתונים בתוספים על ידי הגדרה או הרחבה של אוספים. בניגוד לטבלאות נתונים שנוצרות דרך ממשק ניהול מקורות הנתונים, **אוספים המוגדרים בקוד הם לרוב טבלאות מטא-דאטה ברמת המערכת** ולא יופיעו ברשימת ניהול מקורות הנתונים.

## הגדרת טבלאות נתונים

בהתאם למבנה הספריות המקובל, קבצי אוספים צריכים להיות ממוקמים בספרייה `./src/server/collections`. השתמשו ב-`defineCollection()` כדי ליצור טבלאות חדשות וב-`extendCollection()` כדי להרחיב טבלאות קיימות.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'מאמרי דוגמה',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'כותרת', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'תוכן' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'מחבר' },
    },
  ],
});
```

בדוגמה שלעיל:

- `name`: שם הטבלה (טבלה עם שם זהה תיווצר אוטומטית במסד הנתונים).
- `title`: שם התצוגה של הטבלה בממשק המשתמש.
- `fields`: אוסף שדות, כאשר כל שדה מכיל תכונות כמו `type`, `name` ועוד.

כאשר אתם צריכים להוסיף שדות או לשנות הגדרות עבור אוספים של תוספים אחרים, תוכלו להשתמש ב-`extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

לאחר הפעלת התוסף, המערכת תוסיף אוטומטית את השדה `isPublished` לטבלת `articles` הקיימת.

:::tip
הספרייה המקובלת תושלם בטעינה לפני שכל מתודות ה-`load()` של התוספים יבוצעו, ובכך תימנע בעיות תלות הנגרמות כתוצאה מכך שטבלאות נתונים מסוימות לא נטענו.
:::

## סנכרון מבנה מסד הנתונים

כאשר תוסף מופעל לראשונה, המערכת תסנכרן אוטומטית את הגדרות האוספים עם מבנה מסד הנתונים. אם התוסף כבר מותקן ופועל, לאחר הוספה או שינוי של אוספים, עליכם להריץ ידנית את פקודת השדרוג:

```bash
yarn nocobase upgrade
```

אם מתרחשות שגיאות או נתונים לא תקינים (dirty data) במהלך הסנכרון, תוכלו לבנות מחדש את מבנה הטבלה על ידי התקנה מחדש של היישום:

```bash
yarn nocobase install -f
```

## יצירת משאבים (Resource) אוטומטית

לאחר הגדרת אוסף, המערכת תיצור עבורו אוטומטית משאב (Resource) מתאים, שבאמצעותו תוכלו לבצע ישירות פעולות CRUD (יצירה, קריאה, עדכון, מחיקה) דרך ה-API. לפרטים נוספים, ראו [ניהול משאבים](./resource-manager.md).