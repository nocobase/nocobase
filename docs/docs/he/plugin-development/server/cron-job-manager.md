:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# CronJobManager ניהול משימות מתוזמנות

`CronJobManager` הוא מנהל משימות מתוזמנות שמסופק על ידי NocoBase, המבוסס על [cron](https://www.npmjs.com/package/cron). הוא מאפשר לתוספים לרשום משימות מתוזמנות בצד השרת, המיועדות לביצוע לוגיקה ספציפית באופן מחזורי.

## שימוש בסיסי

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // יבוצע כל יום ב-00:00
      onTick: async () => {
        console.log('משימה יומית: ניקוי נתונים זמניים');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // הפעלה אוטומטית
    });
  }

  async cleanTemporaryData() {
    // כאן תתבצע לוגיקת הניקוי
  }
}
```

## תיאור פרמטרים

הגדרת הטיפוס `CronJobParameters` היא כדלקמן (מתוך [cron](https://www.npmjs.com/package/cron)):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| פרמטר | טיפוס | תיאור |
| ---------------- | ---------- | ---------- |
| **cronTime** | `string \| Date \| DateTime` | ביטוי הזמן של המשימה המתוזמנת. תומך בביטויי cron סטנדרטיים, לדוגמה `0 0 * * *` מציין ביצוע יומי ב-00:00. |
| **onTick** | `function` | פונקציית המשימה הראשית. תופעל בזמן שצוין. |
| **onComplete** | `function` | מבוצעת כאשר המשימה נעצרת על ידי `job.stop()` או לאחר שפונקציית `onTick` מסיימת את פעולתה. |
| **timeZone** | `string` | מציין את אזור הזמן לביצוע (לדוגמה `Asia/Shanghai`). |
| **context** | `any` | הקונטקסט (ההקשר) בעת ביצוע `onTick`. |
| **runOnInit** | `boolean` | האם לבצע פעם אחת מיד בעת האתחול. |
| **utcOffset** | `string \| number` | מציין את היסט אזור הזמן. |
| **unrefTimeout** | `boolean` | שולט האם לולאת האירועים נשארת פעילה. |

## דוגמאות לביטויי Cron

| ביטוי | משמעות |
| -------------- | ------------ |
| `* * * * *` | מבוצע כל דקה |
| `0 * * * *` | מבוצע כל שעה |
| `0 0 * * *` | מבוצע כל יום ב-00:00 |
| `0 9 * * 1` | מבוצע כל יום שני ב-09:00 |
| `*/10 * * * *` | מבוצע כל 10 דקות |

> 💡 ניתן להשתמש ב-[crontab.guru](https://crontab.guru/) כדי לסייע ביצירת ביטויים.

## שליטה בהפעלה ובעצירה של משימות

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // מפעיל את המשימה
job.stop();  // עוצר את המשימה
```

:::tip

משימות מתוזמנות מופעלות עם הפעלת היישום ונעצרות עם עצירתו. בדרך כלל אין צורך להפעיל או לעצור אותן ידנית, אלא אם כן יש צורך מיוחד.

:::