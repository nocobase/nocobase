:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אירועים

השרת של NocoBase מפעיל אירועים מתאימים במהלך מחזור חיי היישום, מחזור חיי ה**תוסף** ופעולות מסד נתונים. **מפתחי תוספים** יכולים להאזין לאירועים אלה כדי ליישם לוגיקה מורחבת, פעולות אוטומטיות או התנהגויות מותאמות אישית.

מערכת האירועים של NocoBase מחולקת בעיקר לשתי רמות:

-   **`app.on()` - אירועים ברמת היישום**: מאזינים לאירועי מחזור חיי היישום, כגון הפעלה, התקנה, הפעלת **תוספים** ועוד.
-   **`db.on()` - אירועים ברמת מסד הנתונים**: מאזינים לאירועי פעולה ברמת מודל הנתונים, כגון יצירה, עדכון או מחיקת רשומות.

שניהם יורשים מ-`EventEmitter` של Node.js, ותומכים בשימוש בממשקי `.on()`, `.off()` ו-`.emit()` הסטנדרטיים. NocoBase גם הרחיבה את התמיכה ב-`emitAsync`, המשמש להפעלת אירועים באופן אסינכרוני ולהמתנה להשלמת ביצוע כל המאזינים.

## היכן לרשום מאזיני אירועים

מאזיני אירועים נרשמים בדרך כלל בשיטת `beforeLoad()` של ה**תוסף**, מה שמבטיח שהאירועים יהיו מוכנים כבר בשלב טעינת ה**תוסף**, ושהלוגיקה העוקבת תוכל להגיב כראוי.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // האזנה לאירועי יישום
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase הופעל');
    });

    // האזנה לאירועי מסד נתונים
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`פוסט חדש: ${model.get('title')}`);
      }
    });
  }
}
```

## האזנה לאירועי יישום `app.on()`

אירועי יישום משמשים ללכידת שינויים במחזור החיים של יישום NocoBase ושל ה**תוספים** שלו, והם מתאימים ללוגיקת אתחול, רישום משאבים או זיהוי תלויות **תוספים**.

### סוגי אירועים נפוצים

| שם האירוע | מועד ההפעלה | שימושים אופייניים |
| :---------- | :---------- | :----------------- |
| `beforeLoad` / `afterLoad` | לפני / אחרי טעינת היישום | רישום משאבים, אתחול תצורה |
| `beforeStart` / `afterStart` | לפני / אחרי הפעלת השירות | הפעלת משימות, הדפסת יומני הפעלה |
| `beforeInstall` / `afterInstall` | לפני / אחרי התקנת היישום | אתחול נתונים, ייבוא תבניות |
| `beforeStop` / `afterStop` | לפני / אחרי עצירת השירות | ניקוי משאבים, שמירת מצב |
| `beforeDestroy` / `afterDestroy` | לפני / אחרי השמדת היישום | מחיקת מטמון, ניתוק חיבורים |
| `beforeLoadPlugin` / `afterLoadPlugin` | לפני / אחרי טעינת תוסף | שינוי תצורת תוסף או הרחבת פונקציונליות |
| `beforeEnablePlugin` / `afterEnablePlugin` | לפני / אחרי הפעלת תוסף | בדיקת תלויות, אתחול לוגיקת תוסף |
| `beforeDisablePlugin` / `afterDisablePlugin` | לפני / אחרי השבתת תוסף | ניקוי משאבי תוסף |
| `afterUpgrade` | לאחר השלמת שדרוג היישום | ביצוע העברת נתונים או תיקוני תאימות |

דוגמה: האזנה לאירוע הפעלת יישום

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 שירות NocoBase הופעל!');
});
```

דוגמה: האזנה לאירוע טעינת תוסף

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`התוסף ${plugin.name} נטען`);
});
```

## האזנה לאירועי מסד נתונים `db.on()`

אירועי מסד נתונים יכולים ללכוד שינויים שונים בנתונים ברמת המודל, והם מתאימים לפעולות כמו ביקורת, סנכרון, מילוי אוטומטי ועוד.

### סוגי אירועים נפוצים

| שם האירוע | מועד ההפעלה |
| :---------- | :---------- |
| `beforeSync` / `afterSync` | לפני / אחרי סנכרון מבנה מסד הנתונים |
| `beforeValidate` / `afterValidate` | לפני / אחרי אימות נתונים |
| `beforeCreate` / `afterCreate` | לפני / אחרי יצירת רשומות |
| `beforeUpdate` / `afterUpdate` | לפני / אחרי עדכון רשומות |
| `beforeSave` / `afterSave` | לפני / אחרי שמירה (כולל יצירה ועדכון) |
| `beforeDestroy` / `afterDestroy` | לפני / אחרי מחיקת רשומות |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | לאחר פעולות הכוללות נתונים מקושרים |
| `beforeDefineCollection` / `afterDefineCollection` | לפני / אחרי הגדרת **אוסף** |
| `beforeRemoveCollection` / `afterRemoveCollection` | לפני / אחרי מחיקת **אוסף** |

דוגמה: האזנה לאירוע לאחר יצירת נתונים

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('הנתונים נוצרו!');
});
```

דוגמה: האזנה לאירוע לפני עדכון נתונים

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('הנתונים עומדים להתעדכן!');
});
```