:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# תוסף

ב-NocoBase, **תוסף צד-לקוח (Client Plugin)** הוא הדרך העיקרית להרחבה והתאמה אישית של פונקציונליות צד-לקוח (frontend). על ידי הרחבת מחלקת הבסיס `Plugin` המסופקת על ידי `@nocobase/client`, מפתחים יכולים לרשום לוגיקה, להוסיף רכיבי עמוד, להרחיב תפריטים או לשלב פונקציונליות של צד שלישי בשלבי מחזור חיים שונים.

## מבנה מחלקת תוסף

מבנה תוסף צד-לקוח בסיסי נראה כך:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // מבוצע לאחר הוספת התוסף
    console.log('Plugin added');
  }

  async beforeLoad() {
    // מבוצע לפני טעינת התוסף
    console.log('Before plugin load');
  }

  async load() {
    // מבוצע בעת טעינת התוסף, רושם נתיבים (routes), רכיבי ממשק משתמש (UI components) ועוד.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## תיאור מחזור החיים

כל תוסף עובר את מחזור החיים הבא ברצף כאשר הדפדפן מתרענן או היישום מאותחל:

| שיטת מחזור חיים | מועד ביצוע | תיאור |
|-----------------|------------|-------|
| **afterAdd()**  | מבוצע מיד לאחר הוספת התוסף למנהל התוספים | בשלב זה מופע התוסף כבר נוצר, אך לא כל התוספים סיימו את האתחול. מתאים לאתחול קל, כמו קריאת תצורה או קישור לאירועים בסיסיים. |
| **beforeLoad()**| מבוצע לפני שיטת `load()` של כל התוספים | ניתן לגשת לכל מופעי התוספים המופעלים (`this.app.pm.get()`). מתאים ללוגיקת הכנה התלויה בתוספים אחרים. |
| **load()**      | מבוצע בעת טעינת התוסף | שיטה זו מבוצעת לאחר שכל התוספים סיימו את `beforeLoad()`. מתאים לרישום נתיבי צד-לקוח (frontend routes), רכיבי ממשק משתמש (UI components) ולוגיקות ליבה אחרות. |

## סדר ביצוע

בכל פעם שהדפדפן מתרענן, יבוצעו `afterAdd()` → `beforeLoad()` → `load()` ברצף.

## הקשר התוסף (Plugin Context) ו-FlowEngine

החל מ-NocoBase 2.0, ממשקי ה-API להרחבת צד-לקוח מרוכזים בעיקר ב-**FlowEngine**. במחלקת התוסף, תוכלו לקבל את מופע המנוע דרך `this.engine`.

```ts
// גישה להקשר המנוע בשיטת load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

למידע נוסף, ראו:
- [FlowEngine](/flow-engine)
- [Context](./context.md)