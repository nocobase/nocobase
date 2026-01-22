:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# יומן אירועים (Logger)

מנגנון יומן האירועים של NocoBase מבוסס על <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. כברירת מחדל, NocoBase מחלק את יומני האירועים ליומני בקשות API, יומני ריצת מערכת ויומני ביצוע SQL. יומני בקשות API ויומני ביצוע SQL מודפסים באופן פנימי על ידי היישום. מפתחי תוספים (Plugin) בדרך כלל צריכים להדפיס רק יומני ריצת מערכת הקשורים לתוסף שלהם.

מסמך זה מתאר כיצד ליצור ולהדפיס יומני אירועים בעת פיתוח תוספים.

## שיטות הדפסה ברירת מחדל

NocoBase מספקת שיטות להדפסת יומני ריצת מערכת. יומני האירועים מודפסים לפי שדות מוגדרים מראש ומופקים לקבצים ייעודיים.

```ts
// שיטת הדפסה ברירת מחדל
app.log.info("message");

// שימוש ב-middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// שימוש בתוספים
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

כל השיטות שהוצגו לעיל פועלות לפי אופן השימוש הבא:

הפרמטר הראשון הוא הודעת היומן, והפרמטר השני הוא אובייקט מטא-דאטה אופציונלי. אובייקט זה יכול להכיל כל זוגות מפתח-ערך, כאשר השדות `module`, `submodule` ו-`method` יחולצו כשדות נפרדים, ואילו שאר השדות ימוקמו בשדה `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## פלט לקבצים אחרים

אם ברצונכם להשתמש בשיטת ההדפסה המוגדרת כברירת מחדל של המערכת, אך לא להפיק את היומנים לקובץ ברירת המחדל, באפשרותכם ליצור מופע לוגר מערכת מותאם אישית באמצעות `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // האם להפיק יומני שגיאה (error) בנפרד לקובץ 'xxx_error.log'
});
```

## יומן אירועים מותאם אישית

אם אינכם מעוניינים להשתמש בשיטות ההדפסה שמספקת המערכת, וברצונכם להשתמש בשיטות המקוריות של Winston, תוכלו ליצור יומני אירועים באמצעות השיטות הבאות.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

האובייקט `options` מרחיב את `winston.LoggerOptions` המקורי.

- `transports` - ניתן להשתמש ב-`'console' | 'file' | 'dailyRotateFile'` כדי ליישם שיטות פלט מוגדרות מראש.
- `format` - ניתן להשתמש ב-`'logfmt' | 'json' | 'delimiter'` כדי ליישם פורמטים מוגדרים מראש להדפסה.

### `app.createLogger`

בתרחישים של ריבוי יישומים, לעיתים אנו רוצים להגדיר ספריות וקבצי פלט מותאמים אישית, שיוכלו להיות מופקים לספרייה הנושאת את שם היישום הנוכחי.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // פלט אל /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

תרחיש השימוש ואופן הפעולה זהים ל-`app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // פלט אל /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```