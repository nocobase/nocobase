:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# משתני סביבה גלובליים

## TZ

משמש להגדרת אזור הזמן של היישום. ברירת המחדל היא אזור הזמן של מערכת ההפעלה.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
פעולות הקשורות לזמן יעובדו בהתאם לאזור זמן זה. שינוי TZ עלול להשפיע על ערכי התאריך במסד הנתונים. לפרטים נוספים, עיינו ב'[סקירת תאריך ושעה](#)'.
:::

## APP_ENV

סביבת היישום. ערך ברירת המחדל הוא `development`. האפשרויות כוללות:

- `production` - סביבת ייצור
- `development` - סביבת פיתוח

```bash
APP_ENV=production
```

## APP_KEY

מפתח הסוד של היישום, המשמש ליצירת אסימוני משתמש (tokens) ועוד. שנו אותו למפתח יישום משלכם וודאו שהוא אינו נחשף כלפי חוץ.

:::warning
אם APP_KEY משתנה, גם האסימונים הישנים יפסיקו להיות תקפים.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

פורט היישום. ערך ברירת המחדל הוא `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

קידומת כתובת ה-API של NocoBase. ערך ברירת המחדל הוא `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

מצב הפעלה מרובה ליבות (אשכול). אם משתנה זה מוגדר, הוא יועבר לפקודת `pm2 start` כפרמטר `-i <instances>`. האפשרויות תואמות לפרמטר `-i` של pm2 (ראו [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), וכוללות:

- `max`: שימוש במספר הליבות המקסימלי של המעבד
- `-1`: שימוש במספר הליבות המקסימלי של המעבד פחות 1
- `<number>`: ציון מספר הליבות

ערך ברירת המחדל ריק, מה שאומר שהמצב אינו מופעל.

:::warning{title="שימו לב"}
מצב זה דורש שימוש בתוספים הקשורים למצב אשכול, אחרת פונקציונליות היישום עלולה להיות חריגה.
:::

למידע נוסף, עיינו ב: [מצב אשכול](#).

## PLUGIN_PACKAGE_PREFIX

קידומת שם חבילת ה**תוסף**. ברירת המחדל היא: `@nocobase/plugin-,@nocobase/preset-`.

לדוגמה, כדי להוסיף את ה**תוסף** `hello` לפרויקט `my-nocobase-app`, שם החבילה המלא של ה**תוסף** יהיה `@my-nocobase-app/plugin-hello`.

ניתן להגדיר את PLUGIN_PACKAGE_PREFIX כך:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

הקשר בין שמות ה**תוספים** לשמות החבילות הוא כדלקמן:

- שם החבילה עבור ה**תוסף** `users` הוא `@nocobase/plugin-users`
- שם החבילה עבור ה**תוסף** `nocobase` הוא `@nocobase/preset-nocobase`
- שם החבילה עבור ה**תוסף** `hello` הוא `@my-nocobase-app/plugin-hello`

## DB_DIALECT

סוג מסד הנתונים. האפשרויות כוללות:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

שרת מסד הנתונים (נדרש בעת שימוש במסד נתונים MySQL או PostgreSQL).

ערך ברירת המחדל הוא `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

פורט מסד הנתונים (נדרש בעת שימוש במסד נתונים MySQL או PostgreSQL).

- פורט ברירת המחדל של MySQL ו-MariaDB הוא 3306
- פורט ברירת המחדל של PostgreSQL הוא 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

שם מסד הנתונים (נדרש בעת שימוש במסד נתונים MySQL או PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

משתמש מסד הנתונים (נדרש בעת שימוש במסד נתונים MySQL או PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

סיסמת מסד הנתונים (נדרש בעת שימוש במסד נתונים MySQL או PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

קידומת טבלה.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

האם להמיר שמות טבלאות ושדות במסד הנתונים לסגנון snake case. ברירת המחדל היא `false`. אם אתם משתמשים במסד נתונים MySQL (MariaDB) ו-`lower_case_table_names=1`, אז DB_UNDERSCORED חייב להיות `true`.

:::warning
כאשר `DB_UNDERSCORED=true`, שמות הטבלאות והשדות בפועל במסד הנתונים לא יהיו זהים לאלה הנראים בממשק המשתמש. לדוגמה, `orderDetails` במסד הנתונים יהיה `order_details`.
:::

## DB_LOGGING

מתג רישום יומן מסד הנתונים. ערך ברירת המחדל הוא `off`. האפשרויות כוללות:

- `on` - מופעל
- `off` - מושבת

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

שיטת פלט היומן. ערכים מרובים מופרדים באמצעות `,`. ערך ברירת המחדל בסביבת פיתוח הוא `console`, ובסביבת ייצור הוא `console,dailyRotateFile`. האפשרויות:

- `console` - `console.log`
- `file` - `קובץ`
- `dailyRotateFile` - `קובץ מתגלגל יומי`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

נתיב אחסון יומנים מבוסס קבצים. ברירת המחדל היא `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

רמת פלט היומן. ערך ברירת המחדל בסביבת פיתוח הוא `debug`, ובסביבת ייצור הוא `info`. האפשרויות:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

רמת פלט יומן מסד הנתונים היא `debug`, והאם הוא מוצג נשלט על ידי `DB_LOGGING`, ואינו מושפע מ-`LOGGER_LEVEL`.

## LOGGER_MAX_FILES

המספר המרבי של קובצי יומן לשמירה.

- כאשר `LOGGER_TRANSPORT` הוא `file`, ערך ברירת המחדל הוא `10`.
- כאשר `LOGGER_TRANSPORT` הוא `dailyRotateFile`, השתמשו ב-`[n]d` כדי לייצג ימים. ערך ברירת המחדל הוא `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

גלגול יומנים לפי גודל.

- כאשר `LOGGER_TRANSPORT` הוא `file`, היחידה היא `byte`, וערך ברירת המחדל הוא `20971520 (20 * 1024 * 1024)`.
- כאשר `LOGGER_TRANSPORT` הוא `dailyRotateFile`, ניתן להשתמש ב-`[n]k`, `[n]m`, `[n]g`. אינו מוגדר כברירת מחדל.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

פורמט הדפסת יומן. ברירת המחדל בסביבת פיתוח היא `console`, ובסביבת ייצור היא `json`. האפשרויות:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

ראו: [פורמט יומן](#)

## CACHE_DEFAULT_STORE

מזהה ייחודי לשיטת אחסון המטמון לשימוש, המציין את שיטת המטמון המוגדרת כברירת מחדל בצד השרת. ערך ברירת המחדל הוא `memory`. האפשרויות המובנות הן:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

המספר המרבי של פריטים במטמון הזיכרון. ערך ברירת המחדל הוא `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

חיבור Redis, אופציונלי. דוגמה: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

הפעלת איסוף נתוני טלמטריה. ברירת המחדל היא `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

קוראי מדדי ניטור מופעלים. ברירת המחדל היא `console`. ערכים אחרים צריכים להתייחס לשמות הרשומים של ה**תוספים** המתאימים של הקוראים, כגון `prometheus`. ערכים מרובים מופרדים באמצעות `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

מעבדי נתוני עקבות (trace) מופעלים. ברירת המחדל היא `console`. ערכים אחרים צריכים להתייחס לשמות הרשומים של ה**תוספים** המתאימים של המעבדים. ערכים מרובים מופרדים באמצעות `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```