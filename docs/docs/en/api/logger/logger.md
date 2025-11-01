# Logger

## Create Logger

### createLogger()

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

- `dirname`: Log directory
- `filename`: Log file name
- `format`: Log format
- `transports`: Log transports

### createSystemLogger()

Creates system runtime logs printed in a specified method. Refer to [Logger plugin - System log](../plugins/logger/index.md#system-log).

#### Signature

- `createSystemLogger(options: SystemLoggerOptions)`

#### Type

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Details

- `seperateError`: Whether to print `error` level logs separately

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

## Configuration

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

## Logger Transports

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

## References

- [Development - Logger](/plugin-development/logger/index.md)
- [Logger Plugin](/log-and-monitor/logger/index.md)
