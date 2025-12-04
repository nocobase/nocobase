:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# ניהול תלויות

בפיתוח תוספים ב-NocoBase, תלויות מתחלקות לשתי קטגוריות: **תלויות תוסף** ו**תלויות גלובליות**.

- **תלויות גלובליות**: מסופקות על ידי `@nocobase/server` ו-`@nocobase/client`, ותוספים אינם צריכים לארוז אותן בנפרד.
- **תלויות תוסף**: תלויות ייחודיות לתוסף (כולל תלויות צד-שרת), וייארזו לתוך תוצרי התוסף.

## עקרונות פיתוח

מכיוון שתלויות תוסף ייארזו לתוך תוצרי התוסף (כולל תלויות צד-שרת שייארזו לתוך `dist/node_modules`), במהלך פיתוח תוספים, תוכלו להצהיר על כל התלויות ב-`devDependencies` במקום ב-`dependencies`. זה מונע הבדלים בין סביבות פיתוח וייצור.

כאשר תוסף צריך להתקין את התלויות הבאות, ודאו ש**מספר הגרסה** תואם לתלויות הגלובליות ב-`@nocobase/server` וב-`@nocobase/client`, אחרת עלולות להיווצר התנגשויות בזמן ריצה.

## תלויות גלובליות

התלויות הבאות מסופקות על ידי NocoBase ואינן צריכות להיארז בתוספים. אם יש צורך, עליהן להתאים לגרסת הפריים-וורק.

``` js
// ליבת NocoBase
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// @nocobase/auth
'jsonwebtoken',

// @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// @nocobase/logger
'winston',
'winston-daily-rotate-file',

// אקוסיסטם של Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// אקוסיסטם של React
'react',
'react-dom',
'react/jsx-runtime',

// React Router
'react-router',
'react-router-dom',

// Ant Design
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// כלי עזר נפוצים
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## המלצות פיתוח

1.  **שמירה על עקביות תלויות**\
    אם אתם צריכים להשתמש בחבילות שכבר קיימות בתלויות הגלובליות, הימנעו מהתקנת גרסאות שונות והשתמשו ישירות בתלויות הגלובליות.

2.  **מזעור גודל החבילה**\
    עבור ספריות ממשק משתמש נפוצות (כגון `antd`), ספריות כלי עזר (כגון `lodash`), ומנהלי התקנים של מסדי נתונים (כגון `pg`, `mysql2`), עליכם להסתמך על הגרסאות המסופקות גלובלית כדי למנוע אריזה כפולה.

3.  **עקביות בין סביבות פיתוח וייצור**\
    שימוש ב-`devDependencies` מבטיח עקביות בין הפיתוח לבין התוצרים הסופיים, ומונע הבדלים סביבתיים הנגרמים כתוצאה מתצורה שגויה של `dependencies` ו-`peerDependencies`.