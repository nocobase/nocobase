# Logger - Логгер

## Создание логгера

### `createLogger()`

Создает пользовательский логгер.

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

#### Подробности

| Свойство     | Описание                |
| :----------- | :---------------------- |
| `dirname`    | Директория вывода логов |
| `filename`   | Имя файла логов         |
| `format`     | Формат логов            |
| `transports` | Способ вывода логов     |

### `createSystemLogger()`

Создает системные runtime-логи и выводит их указанным способом. См. [Логгер - Системный лог](/log-and-monitor/logger/index.md#system-log)

#### Сигнатура

- `createSystemLogger(options: SystemLoggerOptions)`

#### Тип

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Подробности

| Свойство        | Описание                                          |
| :-------------- | :------------------------------------------------ |
| `seperateError` | Выводить ли логи уровня `error` отдельно          |

### `requestLogger()`

Middleware для логирования API-запросов и ответов.

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

#### Подробности

| Свойство            | Тип                               | Описание                                                        | По умолчанию                                                                                                                                             |
| :------------------ | :-------------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Пропускает логирование некоторых запросов по контексту запроса. | -                                                                                                                                                        |
| `requestWhitelist`  | `string[]`                        | Белый список данных запроса, которые выводятся в лог.           | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Белый список данных ответа, которые выводятся в лог.            | `['status']`                                                                                                                                             |

### app.createLogger()

#### Определение

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

Если `dirname` задан как относительный путь, файлы логов будут выводиться в директорию с именем текущего приложения.

### plugin.createLogger()

Использование аналогично `app.createLogger()`.

#### Определение

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Конфигурация логирования

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Возвращает уровень логирования, настроенный в системе.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Формирует путь к директории на основе текущей настройки каталога логов в системе.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Возвращает методы вывода логов, которые сейчас настроены в системе.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Возвращает формат логов, который сейчас настроен в системе.

## Вывод логов

### Transports

Предопределенные методы вывода.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Связанная документация

- [Руководство по разработке - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)