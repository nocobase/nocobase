:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Логгер

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

| Свойство     | Описание                 |
| :----------- | :----------------------- |
| `dirname`    | Каталог вывода логов     |
| `filename`   | Имя файла логов          |
| `format`     | Формат логов             |
| `transports` | Метод вывода логов       |

### `createSystemLogger()`

Создает системные логи выполнения, выводимые указанным способом. Подробнее см. в разделе [Логгер - Системный лог](/log-and-monitor/logger/index.md#system-log).

#### Сигнатура

- `createSystemLogger(options: SystemLoggerOptions)`

#### Тип

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Подробности

| Свойство        | Описание                                     |
| :-------------- | :------------------------------------------- |
| `seperateError` | Выводить ли логи уровня `error` отдельно     |

### `requestLogger()`

Промежуточное ПО для логирования запросов и ответов API.

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

| Свойство            | Тип                               | Описание                                                         | По умолчанию                                                                                                                                            |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Пропускает логирование для определенных запросов на основе контекста запроса. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Белый список информации о запросах для вывода в лог.             | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Белый список информации об ответах для вывода в лог.             | `['status']`                                                                                                                                            |

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

Если `dirname` является относительным путем, файлы логов будут выводиться в каталог, названный в честь текущего приложения.

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

## Конфигурация логов

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Получает текущий уровень логирования, настроенный в системе.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Объединяет пути к каталогам на основе каталога логов, настроенного в системе.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Получает текущие методы вывода логов, настроенные в системе.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Получает текущий формат логов, настроенный в системе.

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

- [Руководство по разработке - Логгер](/plugin-development/server/logger)
- [Логгер](/log-and-monitor/logger/index.md)