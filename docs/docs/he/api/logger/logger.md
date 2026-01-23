:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# יומן

## יצירת יומן

### `createLogger()`

יוצר יומן מותאם אישית.

#### חתימה

- `createLogger(options: LoggerOptions)`

#### טיפוס

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### פרטים

| מאפיין      | תיאור            |
| :---------- | :--------------- |
| `dirname`   | תיקיית פלט היומן |
| `filename`  | שם קובץ היומן    |
| `format`    | פורמט היומן      |
| `transports`| שיטת פלט היומן   |

### `createSystemLogger()`

יוצר יומני ריצה של המערכת המודפסים בשיטה מוגדרת. עיינו ב[יומן - יומן מערכת](#).

#### חתימה

- `createSystemLogger(options: SystemLoggerOptions)`

#### טיפוס

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // מדפיס שגיאות בנפרד, ברירת מחדל: true
}
```

#### פרטים

| מאפיין         | תיאור                                   |
| :------------- | :-------------------------------------- |
| `seperateError`| האם להוציא יומני ברמת `error` בנפרד      |

### `requestLogger()`

Middleware לרישום יומני בקשות ותגובות API.

```ts
app.use(requestLogger(app.name));
```

#### חתימה

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### טיפוס

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### פרטים

| מאפיין            | טיפוס                             | תיאור                                                      | ברירת מחדל                                                                                                                                                 |
| :---------------- | :-------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`            | `(ctx?: any) => Promise<boolean>` | מדלג על רישום יומן עבור בקשות מסוימות בהתבסס על הקשר הבקשה. | -                                                                                                                                                       |
| `requestWhitelist`| `string[]`                        | רשימת היתרים (whitelist) של פרטי בקשה להדפסה ביומן.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist`| `string[]`                        | רשימת היתרים (whitelist) של פרטי תגובה להדפסה ביומן.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### הגדרה

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

כאשר `dirname` הוא נתיב יחסי, קובצי היומן ייפלטו לתיקייה על שם היישום הנוכחי.

### plugin.createLogger()

השימוש זהה ל-`app.createLogger()`.

#### הגדרה

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## תצורת יומן

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

מקבל את רמת היומן המוגדרת כעת במערכת.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

משרשר נתיבי תיקיות בהתבסס על תיקיית היומן המוגדרת כעת במערכת.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

מקבל את שיטות פלט היומן המוגדרות כעת במערכת.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

מקבל את פורמט היומן המוגדר כעת במערכת.

## פלט יומן

### Transports

שיטות פלט מוגדרות מראש.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## תיעוד קשור

- [מדריך פיתוח - יומן](/plugin-development/server/logger)
- [יומן](/log-and-monitor/logger/index.md)