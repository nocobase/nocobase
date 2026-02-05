:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# משתני סביבה

## איך מגדירים משתני סביבה?

### שיטת התקנה מקוד מקור של Git או באמצעות `create-nocobase-app`

הגדירו משתני סביבה בקובץ `.env` שנמצא בספריית השורש של הפרויקט. לאחר שינוי משתני הסביבה, יש לסיים את תהליך היישום ולהפעיל אותו מחדש.

### שיטת התקנה באמצעות Docker

שנו את קובץ התצורה `docker-compose.yml` והגדירו את משתני הסביבה בפרמטר `environment`. דוגמה:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

אפשר גם להשתמש ב-`env_file` כדי להגדיר משתני סביבה בקובץ `.env`. דוגמה:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

לאחר שינוי משתני הסביבה, יש לבנות מחדש את קונטיינר היישום:

```yml
docker compose up -d app
```

## משתני סביבה גלובליים

### TZ

משמש להגדרת אזור הזמן של היישום. ברירת המחדל היא אזור הזמן של מערכת ההפעלה.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
פעולות הקשורות לזמן יטופלו בהתאם לאזור זמן זה. שינוי TZ עלול להשפיע על ערכי תאריך במסד הנתונים. לפרטים נוספים, עיינו ב-[סקירת תאריך ושעה](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

סביבת היישום. ברירת המחדל היא `development`. האפשרויות כוללות:

- `production` סביבת ייצור
- `development` סביבת פיתוח

```bash
APP_ENV=production
```

### APP_KEY

מפתח הסוד של היישום, המשמש ליצירת טוקנים למשתמשים ועוד. שנו אותו למפתח היישום שלכם וודאו שהוא אינו נחשף.

:::warning
אם ה-APP_KEY משתנה, טוקנים ישנים יהפכו ללא חוקיים.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

פורט היישום. ברירת המחדל היא `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

קידומת כתובת ה-API של NocoBase. ברירת המחדל היא `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

מצב הפעלה מרובה ליבות (אשכול). אם משתנה זה מוגדר, הוא יועבר לפקודת `pm2 start` כפרמטר `-i <instances>`. האפשרויות תואמות לפרמטר `-i` של pm2 (עיינו ב-[PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), וכוללות:

- `max`: שימוש במספר הליבות המרבי של המעבד
- `-1`: שימוש במספר הליבות המרבי של המעבד פחות אחת
- `<number>`: ציון מספר הליבות

ברירת המחדל ריקה, מה שאומר שהמצב אינו מופעל.

:::warning{title="שימו לב"}
מצב זה דורש שימוש בתוספים הקשורים למצב אשכול. אחרת, ייתכנו תקלות בלתי צפויות בפונקציונליות של היישום.
:::

למידע נוסף, עיינו ב-[מצב אשכול](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

קידומת שם חבילת ה-**תוסף**. ברירת המחדל היא: `@nocobase/plugin-,@nocobase/preset-`.

לדוגמה, כדי להוסיף את ה**תוסף** `hello` לפרויקט `my-nocobase-app`, שם החבילה המלא של ה**תוסף** יהיה `@my-nocobase-app/plugin-hello`.

ניתן להגדיר את PLUGIN_PACKAGE_PREFIX כך:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

אז הקשר בין שם ה**תוסף** לשם החבילה הוא כדלקמן:

- שם החבילה של ה**תוסף** `users` הוא `@nocobase/plugin-users`
- שם החבילה של ה**תוסף** `nocobase` הוא `@nocobase/preset-nocobase`
- שם החבילה של ה**תוסף** `hello` הוא `@my-nocobase-app/plugin-hello`

### DB_DIALECT

סוג מסד הנתונים. האפשרויות כוללות:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

שרת מסד הנתונים (נדרש בעת שימוש במסדי נתונים של MySQL או PostgreSQL).

ברירת המחדל היא `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

פורט מסד הנתונים (נדרש בעת שימוש במסדי נתונים של MySQL או PostgreSQL).

- פורט ברירת המחדל עבור MySQL ו-MariaDB הוא 3306
- פורט ברירת המחדל עבור PostgreSQL הוא 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

שם מסד הנתונים (נדרש בעת שימוש במסדי נתונים של MySQL או PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

משתמש מסד הנתונים (נדרש בעת שימוש במסדי נתונים של MySQL או PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

סיסמת מסד הנתונים (נדרש בעת שימוש במסדי נתונים של MySQL או PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

קידומת טבלת נתונים.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

האם שמות טבלאות ושדות במסד הנתונים יומרו לסגנון snake case. ברירת המחדל היא `false`. אם אתם משתמשים במסד נתונים של MySQL (MariaDB) ו-`lower_case_table_names=1`, אז `DB_UNDERSCORED` חייב להיות `true`.

:::warning
כאשר `DB_UNDERSCORED=true`, שמות הטבלאות והשדות בפועל במסד הנתונים לא יתאימו למה שמוצג בממשק המשתמש. לדוגמה, `orderDetails` יאוחסן במסד הנתונים כ-`order_details`.
:::

### DB_LOGGING

מתג יומן מסד הנתונים. ברירת המחדל היא `off`. האפשרויות כוללות:

- `on` הפעלה
- `off` כיבוי

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

מספר החיבורים המרבי במאגר החיבורים של מסד הנתונים. ברירת המחדל היא `5`.

### DB_POOL_MIN

מספר החיבורים המינימלי במאגר החיבורים של מסד הנתונים. ברירת המחדל היא `0`.

### DB_POOL_IDLE

הזמן המרבי, באלפיות השנייה, שחיבור יכול להיות במצב סרק לפני שחרורו. ברירת המחדל היא `10000` (10 שניות).

### DB_POOL_ACQUIRE

הזמן המרבי, באלפיות השנייה, שמאגר החיבורים ינסה להשיג חיבור לפני זריקת שגיאה. ברירת המחדל היא `60000` (60 שניות).

### DB_POOL_EVICT

מרווח הזמן, באלפיות השנייה, שלאחריו מאגר החיבורים יסיר חיבורים במצב סרק. ברירת המחדל היא `1000` (שנייה אחת).

### DB_POOL_MAX_USES

מספר הפעמים שחיבור יכול לשמש לפני שהוא נזרק ומוחלף. ברירת המחדל היא `0` (ללא הגבלה).

### LOGGER_TRANSPORT

שיטת פלט היומן. מספר ערכים מופרדים בפסיקים (`,`). ברירת המחדל בסביבת פיתוח היא `console`, ובסביבת ייצור היא `console,dailyRotateFile`.
אפשרויות:

- `console` - `console.log`
- `file` - פלט לקובץ
- `dailyRotateFile` - פלט לקבצים מתחלפים יומיים

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

נתיב אחסון יומן מבוסס קבצים. ברירת המחדל היא `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

רמת פלט היומן. ברירת המחדל בסביבת פיתוח היא `debug`, ובסביבת ייצור היא `info`. אפשרויות:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

רמת פלט יומן מסד הנתונים היא `debug`, ונשלטת על ידי `DB_LOGGING`. היא אינה מושפעת מ-`LOGGER_LEVEL`.

### LOGGER_MAX_FILES

מספר קבצי היומן המרבי לשמירה.

- כאשר `LOGGER_TRANSPORT` הוא `file`: ברירת המחדל היא `10`.
- כאשר `LOGGER_TRANSPORT` הוא `dailyRotateFile`, השתמשו ב-`[n]d` כדי לייצג ימים. ברירת המחדל היא `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

סיבוב יומן לפי גודל.

- כאשר `LOGGER_TRANSPORT` הוא `file`: היחידה היא `byte`. ברירת המחדל היא `20971520 (20 * 1024 * 1024)`.
- כאשר `LOGGER_TRANSPORT` הוא `dailyRotateFile`, ניתן להשתמש ב-`[n]k`, `[n]m`, `[n]g`. ברירת המחדל אינה מוגדרת.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

פורמט הדפסת יומן. ברירת המחדל בסביבת פיתוח היא `console`, ובסביבת ייצור היא `json`. אפשרויות:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

עיינו: [פורמט יומן](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

מזהה ייחודי לשיטת האחסון במטמון, המציין את שיטת המטמון ברירת המחדל של השרת. ברירת המחדל היא `memory`. האפשרויות המובנות כוללות:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

מספר הפריטים המרבי במטמון הזיכרון. ברירת המחדל היא `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

כתובת URL לחיבור Redis, אופציונלי. דוגמה: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

הפעילו איסוף נתוני טלמטריה. ברירת המחדל היא `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

אוספי מדדי ניטור מופעלים. ברירת המחדל היא `console`. ערכים אחרים צריכים להתייחס לשמות הרשומים על ידי **תוספי** האוספים המתאימים, כגון `prometheus`. מספר ערכים מופרדים בפסיקים (`,`).

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

מעבדי נתוני עקיבה מופעלים. ברירת המחדל היא `console`. ערכים אחרים צריכים להתייחס לשמות הרשומים על ידי **תוספי** המעבדים המתאימים. מספר ערכים מופרדים בפסיקים (`,`).

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## משתני סביבה ניסיוניים

### APPEND_PRESET_LOCAL_PLUGINS

משמש לצירוף **תוספים** מקומיים מוגדרים מראש שאינם פעילים. הערך הוא שם חבילת ה**תוסף** (הפרמטר `name` בקובץ `package.json`), כאשר מספר **תוספים** מופרדים בפסיקים.

:::info
1. ודאו שה**תוסף** הורד באופן מקומי וניתן למצוא אותו בספריית `node_modules`. לפרטים נוספים, עיינו ב-[ארגון תוספים](/plugin-development/project-structure).
2. לאחר הוספת משתנה הסביבה, ה**תוסף** יופיע בדף מנהל ה**תוספים** רק לאחר התקנה ראשונית (`nocobase install`) או שדרוג (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

משמש לצירוף **תוספים** מובנים המותקנים כברירת מחדל. הערך הוא שם חבילת ה**תוסף** (הפרמטר `name` בקובץ `package.json`), כאשר מספר **תוספים** מופרדים בפסיקים.

:::info
1. ודאו שה**תוסף** הורד באופן מקומי וניתן למצוא אותו בספריית `node_modules`. לפרטים נוספים, עיינו ב-[ארגון תוספים](/plugin-development/project-structure).
2. לאחר הוספת משתנה הסביבה, ה**תוסף** יותקן או ישודרג אוטומטית במהלך ההתקנה הראשונית (`nocobase install`) או השדרוג (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## משתני סביבה זמניים

ניתן לסייע להתקנת NocoBase על ידי הגדרת משתני סביבה זמניים, לדוגמה:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# שווה ערך ל-
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# שווה ערך ל-
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

שפת ההתקנה. ברירת המחדל היא `en-US`. האפשרויות כוללות:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

כתובת האימייל של משתמש ה-Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

סיסמת משתמש ה-Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

כינוי משתמש ה-Root.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```