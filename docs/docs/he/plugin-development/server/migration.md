:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# סקריפטים לשדרוג (Migration)

במהלך פיתוח ועדכון תוספים ב-NocoBase, ייתכנו שינויים שאינם תואמים במבנה מסד הנתונים או בתצורת התוסף. כדי להבטיח שדרוגים חלקים, NocoBase מספקת מנגנון **Migration** המאפשר לטפל בשינויים אלה באמצעות כתיבת קבצי migration. מדריך זה יסייע לכם להבין באופן שיטתי את אופן השימוש ב-Migration ואת תהליך העבודה לפיתוחו.

## מושג ה-Migration

Migration הוא סקריפט המופעל באופן אוטומטי במהלך שדרוגי תוספים, ומשמש לפתרון הבעיות הבאות:

- התאמות במבנה טבלת הנתונים (הוספת שדות, שינוי סוגי שדות וכדומה)
- העברת נתונים (כגון עדכוני אצווה של ערכי שדות)
- עדכונים בתצורת התוסף או בלוגיקה הפנימית שלו

זמני ההפעלה של Migration מחולקים לשלושה סוגים:

| סוג | מועד הפעלה | תרחיש הפעלה |
|------|----------|----------|
| `beforeLoad` | לפני טעינת כל תצורות התוספים | |
| `afterSync`  | לאחר סנכרון תצורות האוספים עם מסד הנתונים (מבנה האוסף כבר השתנה) | |
| `afterLoad`  | לאחר טעינת כל תצורות התוספים | |

## יצירת קבצי Migration

קבצי Migration צריכים להיות ממוקמים בנתיב `src/server/migrations/*.ts` שבספריית התוסף. NocoBase מספקת את הפקודה `create-migration` ליצירה מהירה של קבצי migration.

```bash
yarn nocobase create-migration [options] <name>
```

פרמטרים אופציונליים

| פרמטר | תיאור |
|------|------|
| `--pkg <pkg>` | מציין את שם חבילת התוסף |
| `--on [on]`  | מציין את מועד ההפעלה, אפשרויות: `beforeLoad`、`afterSync`、`afterLoad` |

דוגמה

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

נתיב קובץ ה-migration שנוצר הוא כדלקמן:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

תוכן הקובץ הראשוני:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // כתבו כאן את לוגיקת השדרוג
  }
}
```

> ⚠️ `appVersion` משמש לזיהוי הגרסה שאליה מיועד השדרוג. סביבות עם גרסאות נמוכות מהגרסה שצוינה יפעילו את ה-migration הזה.

## כתיבת Migration

בקבצי Migration, תוכלו לגשת למאפיינים ולממשקי API הנפוצים הבאים באמצעות `this`, כדי לתפעל בקלות את מסד הנתונים, התוספים ומופעי היישום:

מאפיינים נפוצים

- **`this.app`**  
  מופע היישום הנוכחי של NocoBase. ניתן להשתמש בו לגישה לשירותים גלובליים, תוספים או תצורה.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  מופע שירות מסד הנתונים, המספק ממשקים לתפעול מודלים (אוספים).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  מופע התוסף הנוכחי, ניתן להשתמש בו לגישה למתודות מותאמות אישית של התוסף.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  מופע Sequelize, יכול לבצע ישירות פקודות SQL גולמיות או פעולות טרנזקציה.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  ה-QueryInterface של Sequelize, המשמש בדרך כלל לשינוי מבני טבלאות, כגון הוספת שדות, מחיקת טבלאות וכדומה.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

דוגמה לכתיבת Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // השתמשו ב-queryInterface כדי להוסיף שדה
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // השתמשו ב-db כדי לגשת למודלי נתונים
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // הפעילו מתודה מותאמת אישית של התוסף
    await this.plugin.customMethod();
  }
}
```

בנוסף למאפיינים הנפוצים המפורטים לעיל, Migration מספק גם ממשקי API עשירים. לתיעוד מפורט, עיינו ב-[Migration API](/api/server/migration).

## הפעלת Migration

הפעלת Migration מופעלת באמצעות הפקודה `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

במהלך השדרוג, המערכת תקבע את סדר ההפעלה בהתבסס על סוג ה-Migration ועל `appVersion`.

## בדיקת Migration

בפיתוח תוספים, מומלץ להשתמש ב-**Mock Server** כדי לבדוק אם ה-migration מופעל כהלכה, ובכך למנוע פגיעה בנתונים אמיתיים.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // שם התוסף
      version: '0.18.0-alpha.5', // גרסה לפני השדרוג
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // כתבו לוגיקת אימות, כגון בדיקה אם השדה קיים, אם העברת הנתונים הצליחה
  });
});
```

> טיפ: שימוש ב-Mock Server מאפשר לדמות במהירות תרחישי שדרוג ולאמת את סדר הפעלת ה-Migration ואת שינויי הנתונים.

## המלצות לשיטות עבודה מומלצות בפיתוח

1.  **פיצול Migration**  
    נסו ליצור קובץ migration אחד לכל שדרוג, כדי לשמור על אטומיות ולפשט את איתור התקלות.
2.  **ציון מועד הפעלה**  
    בחרו ב-`beforeLoad`, `afterSync` או `afterLoad` בהתאם לאובייקטים המופעלים, כדי למנוע תלות במודולים שטרם נטענו.
3.  **שימו לב לבקרת גרסאות**  
    השתמשו ב-`appVersion` כדי לציין בבירור את הגרסה הרלוונטית ל-migration, ובכך למנוע הפעלה חוזרת.
4.  **כיסוי בדיקות**  
    אמתו את ה-migration ב-Mock Server לפני ביצוע השדרוג בסביבה אמיתית.