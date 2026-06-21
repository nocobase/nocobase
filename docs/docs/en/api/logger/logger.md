# Logger

## Create Logger

### `createLogger()`

Creates a custom logger.

#### Signature

- `createLogger(options: LoggerOptions)`

#### Type

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Details

| Property     | Description          |
| :----------- | :------------------- |
| `dirname`    | Log output directory |
| `filename`   | Log file name        |
| `format`     | Log format           |
| `transports` | Log output method    |

### `createSystemLogger()`

Creates system runtime logs printed in a specified method. Refer to [Logger - System Log](/log-and-monitor/logger/index.md#system-log)

#### Signature

- `createSystemLogger(options: SystemLoggerOptions)`

#### Type

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Details

| Property        | Description                                     |
| :-------------- | :---------------------------------------------- |
| `seperateError` | Whether to output `error` level logs separately |

### `requestLogger()`

Middleware for API request and response logging.

```ts
app.use(requestLogger(app.name));
```

#### Signature

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Type

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Details

| Property            | Type                              | Description                                                      | Default                                                                                                                                                 |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Skips logging for certain requests based on the request context. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Whitelist of request information to be printed in the log.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Whitelist of response information to be printed in the log.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definition

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

When `dirname` is a relative path, the log files will be output to the directory named after the current application.

### plugin.createLogger()

Usage is the same as `app.createLogger()`.

#### Definition

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Log Configuration

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Gets the log level currently configured in the system.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Concatenates directory paths based on the log directory currently configured in the system.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Gets the log output methods currently configured in the system.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Gets the log format currently configured in the system.

## Log Output

### Transports

Predefined output methods.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Related Documentation

- [Development Guide - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)
