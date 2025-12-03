:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# المسجل

## إنشاء مسجل

### `createLogger()`

ينشئ مسجلاً مخصصًا.

#### التوقيع

- `createLogger(options: LoggerOptions)`

#### النوع

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### التفاصيل

| الخاصية         | الوصف                |
| :----------- | :------------------- |
| `dirname`    | دليل إخراج السجل     |
| `filename`   | اسم ملف السجل        |
| `format`     | تنسيق السجل          |
| `transports` | طريقة إخراج السجل     |

### `createSystemLogger()`

ينشئ سجلات تشغيل النظام التي تُطبع بطريقة محددة. راجع [المسجل - سجل النظام](#)

#### التوقيع

- `createSystemLogger(options: SystemLoggerOptions)`

#### النوع

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### التفاصيل

| الخاصية            | الوصف                                      |
| :--------------- | :---------------------------------------------- |
| `seperateError` | هل يتم إخراج سجلات مستوى `error` بشكل منفصل؟ |

### `requestLogger()`

وسيط (Middleware) لتسجيل طلبات واستجابات الواجهة البرمجية (API).

```ts
app.use(requestLogger(app.name));
```

#### التوقيع

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### النوع

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### التفاصيل

| الخاصية                | النوع                              | الوصف                                                               | القيمة الافتراضية                                                                                                                                                  |
| :------------------- | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | يتخطى التسجيل لطلبات معينة بناءً على سياق الطلب. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | قائمة بيضاء لمعلومات الطلب التي ستُطبع في السجل.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | قائمة بيضاء لمعلومات الاستجابة التي ستُطبع في السجل.      | `['status']`                                                                                                                                            |

### `app.createLogger()`

#### التعريف

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

عندما يكون `dirname` مسارًا نسبيًا، ستُخرج ملفات السجل إلى الدليل الذي يحمل اسم التطبيق الحالي.

### `plugin.createLogger()`

الاستخدام هو نفسه لـ `app.createLogger()`.

#### التعريف

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## إعدادات المسجل

### `getLoggerLevel()`

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

يحصل على مستوى السجل المُكوّن حاليًا في النظام.

### `getLoggerFilePath()`

`getLoggerFilePath(...paths: string[]): string`

يربط مسارات الدلائل بناءً على دليل السجل المُكوّن حاليًا في النظام.

### `getLoggerTransports()`

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

يحصل على طرق إخراج السجل المُكوّنة حاليًا في النظام.

### `getLoggerFormat()`

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

يحصل على تنسيق السجل المُكوّن حاليًا في النظام.

## إخراج السجل

### طرق الإخراج (Transports)

طرق الإخراج المحددة مسبقًا.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## الوثائق ذات الصلة

- [دليل التطوير - المسجل](/plugin-development/server/logger)
- [المسجل](#)