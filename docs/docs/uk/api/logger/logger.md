:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Логер

## Створення логера

### `createLogger()`

Створює користувацький логер.

#### Сигнатура

- `createLogger(options: LoggerOptions)`

#### Тип

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Деталі

| Властивість  | Опис                       |
| :----------- | :------------------------- |
| `dirname`    | Каталог для виводу логів   |
| `filename`   | Ім'я файлу логу            |
| `format`     | Формат логу                |
| `transports` | Метод виводу логів         |

### `createSystemLogger()`

Створює системні логи виконання, які виводяться визначеним методом. Дивіться [Логер - Системний лог](/log-and-monitor/logger/index.md#system-log)

#### Сигнатура

- `createSystemLogger(options: SystemLoggerOptions)`

#### Тип

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Деталі

| Властивість     | Опис                                    |
| :-------------- | :-------------------------------------- |
| `seperateError` | Чи виводити логи рівня `error` окремо   |

### `requestLogger()`

Проміжне ПЗ для логування запитів та відповідей API.

```ts
app.use(requestLogger(app.name));
```

#### Сигнатура

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Тип

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Деталі

| Властивість         | Тип                               | Опис                                                             | За замовчуванням                                                                                                                                        |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Пропускає логування для певних запитів на основі контексту запиту. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Білий список інформації про запит, яку потрібно вивести в лог.   | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Білий список інформації про відповідь, яку потрібно вивести в лог. | `['status']`                                                                                                                                            |

### app.createLogger()

#### Визначення

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

Коли `dirname` є відносним шляхом, файли логів будуть виводитись у каталог, названий на честь поточної програми.

### plugin.createLogger()

Використання таке ж, як і у `app.createLogger()`.

#### Визначення

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Конфігурація логів

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Отримує поточний рівень логування, налаштований у системі.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Об'єднує шляхи каталогів на основі каталогу логів, налаштованого в системі.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Отримує поточні методи виводу логів, налаштовані в системі.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Отримує поточний формат логів, налаштований у системі.

## Вивід логів

### Transports

Заздалегідь визначені методи виводу.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Пов'язана документація

- [Посібник розробника - Логер](/plugin-development/server/logger)
- [Логер](/log-and-monitor/logger/index.md)