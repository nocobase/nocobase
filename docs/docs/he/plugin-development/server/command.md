:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פקודה (Command)

ב-NocoBase, פקודות משמשות לביצוע פעולות הקשורות ליישומים או לתוספים בשורת הפקודה, כגון הפעלת משימות מערכת, ביצוע פעולות מיגרציה או סנכרון, אתחול תצורה, או אינטראקציה עם מופעי יישום פועלים. מפתחים יכולים להגדיר פקודות מותאמות אישית עבור תוספים ולרשום אותן באמצעות אובייקט ה-`app`, ולהפעיל אותן בממשק שורת הפקודה (CLI) בצורה `nocobase <command>`.

## סוגי פקודות

ב-NocoBase, רישום פקודות מחולק לשני סוגים:

| סוג | שיטת רישום | האם התוסף צריך להיות מופעל | תרחישים אופייניים |
|------|------------|--------------------------|-------------------|
| פקודה דינמית | `app.command()` | ✅ כן | פקודות הקשורות ללוגיקה עסקית של תוסף |
| פקודה סטטית | `Application.registerStaticCommand()` | ❌ לא | פקודות התקנה, אתחול ותחזוקה |

## פקודות דינמיות

השתמשו ב-`app.command()` כדי להגדיר פקודות תוסף. פקודות אלו יכולות להתבצע רק לאחר שהתוסף מופעל. קובצי הפקודה צריכים להיות ממוקמים בנתיב `src/server/commands/*.ts` בתיקיית התוסף.

דוגמה

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

הסבר

- `app.command('echo')`: מגדיר פקודה בשם `echo`.
- `.option('-v, --version')`: מוסיף אפשרות (option) לפקודה.
- `.action()`: מגדיר את לוגיקת הביצוע של הפקודה.
- `app.version.get()`: מאחזר את גרסת היישום הנוכחית.

ביצוע הפקודה

```bash
nocobase echo
nocobase echo -v
```

## פקודות סטטיות

השתמשו ב-`Application.registerStaticCommand()` לרישום. פקודות סטטיות יכולות להתבצע ללא צורך בהפעלת תוספים, והן מתאימות למשימות התקנה, אתחול, מיגרציה או דיבוג. רשמו אותן בשיטת `staticImport()` של מחלקת התוסף.

דוגמה

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

ביצוע הפקודה

```bash
nocobase echo
nocobase echo --version
```

הסבר

- `Application.registerStaticCommand()` רושם פקודות לפני שהיישום עובר אינסטנסציה (instantiation).
- פקודות סטטיות משמשות בדרך כלל לביצוע משימות גלובליות שאינן תלויות במצב היישום או התוסף.

## API של פקודות

אובייקטי פקודה מספקים שלוש שיטות עזר אופציונליות לשליטה על הקשר הביצוע של הפקודה:

| שיטה | מטרה | דוגמה |
|------|------|-------|
| `ipc()` | תקשורת עם מופעי יישום פועלים (באמצעות IPC) | `app.command('reload').ipc().action()` |
| `auth()` | אימות שתצורת מסד הנתונים נכונה | `app.command('seed').auth().action()` |
| `preload()` | טעינה מוקדמת של תצורת היישום (ביצוע `app.load()`) | `app.command('sync').preload().action()` |

תיאור התצורה

- **`ipc()`**
  כברירת מחדל, פקודות מתבצעות במופע יישום חדש. לאחר הפעלת `ipc()`, פקודות מקיימות אינטראקציה עם מופע היישום הפועל כרגע באמצעות תקשורת בין-תהליכית (IPC), וזה מתאים לפקודות פעולה בזמן אמת (כגון רענון מטמון, שליחת התראות).

- **`auth()`**
  בודק אם תצורת מסד הנתונים זמינה לפני ביצוע הפקודה. אם תצורת מסד הנתונים שגויה או שהחיבור נכשל, הפקודה לא תמשיך בביצוע. משמש בדרך כלל למשימות הכוללות כתיבה או קריאה למסד הנתונים.

- **`preload()`**
  טוען מראש את תצורת היישום לפני ביצוע הפקודה, שווה ערך לביצוע `app.load()`. מתאים לפקודות התלויות בתצורה או בהקשר של התוסף.

לשיטות API נוספות, עיינו ב-[AppCommand](/api/server/app-command).

## דוגמאות נפוצות

אתחול נתוני ברירת מחדל

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

טעינה מחדש של מטמון עבור מופע פועל (מצב IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

רישום סטטי של פקודת התקנה

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```