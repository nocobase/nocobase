---
pkg: "@nocobase/plugin-logger"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::



pkg: '@nocobase/plugin-logger'
---

# יומנים

## מבוא

יומנים הם כלי חשוב שעוזר לנו לאתר בעיות במערכת. יומני השרת של NocoBase כוללים בעיקר יומני בקשות ממשק ויומני פעולות מערכת, ותומכים בהגדרת רמת יומן, אסטרטגיית גלגול (rolling strategy), גודל, פורמט הדפסה ועוד. מסמך זה מציג בעיקר את התוכן הקשור ליומני השרת של NocoBase, וכן כיצד להשתמש בתוסף הרישום כדי לארוז ולהוריד יומני שרת.

## הגדרות יומן

פרמטרים הקשורים ליומן, כגון רמת יומן, שיטת פלט ופורמט הדפסה, ניתנים להגדרה באמצעות [משתני סביבה](/get-started/installation/env.md#logger_transport).

## פורמטי יומן

NocoBase תומכת בהגדרת ארבעה פורמטים שונים של יומנים.

### `console`

פורמט ברירת המחדל בסביבת פיתוח, הודעות מוצגות בצבעים מודגשים.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

פורמט ברירת המחדל בסביבת ייצור.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

מופרד באמצעות מפריד `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## ספריית יומנים

מבנה הספריות הראשי של קבצי היומן ב-NocoBase הוא:

- `storage/logs` - ספריית פלט יומנים
  - `main` - שם היישום הראשי
    - `request_YYYY-MM-DD.log` - יומן בקשות
    - `system_YYYY-MM-DD.log` - יומן מערכת
    - `system_error_YYYY-MM-DD.log` - יומן שגיאות מערכת
    - `sql_YYYY-MM-DD.log` - יומן ביצוע SQL
    - `...`
  - `sub-app` - שם יישום משנה
    - `request_YYYY-MM-DD.log`
    - `...`

## קבצי יומן

### יומן בקשות

`request_YYYY-MM-DD.log`, יומני בקשות ותגובות ממשק.

| שדה           | תיאור                               |
| ------------- | ----------------------------------- |
| `level`       | רמת יומן                            |
| `timestamp`   | זמן הדפסת יומן `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` או `response`             |
| `userId`      | קיים רק ב-`response`                |
| `method`      | שיטת בקשה                           |
| `path`        | נתיב בקשה                           |
| `req` / `res` | תוכן בקשה/תגובה                     |
| `action`      | משאבים ופרמטרים מבוקשים             |
| `status`      | קוד סטטוס תגובה                     |
| `cost`        | משך בקשה                            |
| `app`         | שם היישום הנוכחי                    |
| `reqId`       | מזהה בקשה                           |

:::info{title=הערה}
`reqId` יועבר לצד הלקוח (frontend) באמצעות כותרת התגובה `X-Request-Id`.
:::

### יומן מערכת

`system_YYYY-MM-DD.log`, יומני פעולות מערכת של יישומים, Middleware, תוספים ועוד. יומני ברמת `error` יודפסו בנפרד לקובץ `system_error_YYYY-MM-DD.log`.

| שדה         | תיאור                               |
| ----------- | ----------------------------------- |
| `level`     | רמת יומן                            |
| `timestamp` | זמן הדפסת יומן `YYYY-MM-DD hh:mm:ss` |
| `message`   | הודעת יומן                          |
| `module`    | מודול                               |
| `submodule` | תת-מודול                            |
| `method`    | שיטה נקראת                          |
| `meta`      | מידע קשור נוסף, בפורמט JSON         |
| `app`       | שם היישום הנוכחי                    |
| `reqId`     | מזהה בקשה                           |

### יומן ביצוע SQL

`sql_YYYY-MM-DD.log`, יומני ביצוע SQL של מסד הנתונים. הצהרות `INSERT INTO` מוגבלות ל-2000 התווים הראשונים בלבד.

| שדה         | תיאור                               |
| ----------- | ----------------------------------- |
| `level`     | רמת יומן                            |
| `timestamp` | זמן הדפסת יומן `YYYY-MM-DD hh:mm:ss` |
| `sql`       | הצהרת SQL                           |
| `app`       | שם היישום הנוכחי                    |
| `reqId`     | מזהה בקשה                           |

## אריזה והורדה של יומנים

1. עברו לדף ניהול היומנים.
2. בחרו את קבצי היומן שברצונכם להוריד.
3. לחצו על כפתור ההורדה (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## מסמכים קשורים

- [פיתוח תוספים - צד שרת - רישום יומן](/plugin-development/server/logger)
- [תיעוד API - @nocobase/logger](/api/logger/logger)