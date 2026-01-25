# Logger

## 创建日志

### `createLogger()`

创建自定义日志。

#### 签名

- `createLogger(options: LoggerOptions)`

#### 类型

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### 详细信息

| 属性         | 描述         |
| ------------ | ------------ |
| `dirname`    | 日志输出目录 |
| `filename`   | 日志文件名   |
| `format`     | 日志格式     |
| `transports` | 日志输出方式 |

### `createSystemLogger()`

创建以规定方式打印的系统运行日志。参考 [日志 - 系统日志](#)

#### 签名

- `createSystemLogger(options: SystemLoggerOptions)`

#### 类型

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### 详细信息

| 属性            | 描述                            |
| --------------- | ------------------------------- |
| `seperateError` | 是否将 `error` 级别日志单独输出 |

### `requestLogger()`

接口请求和响应日志中间件。

```ts
app.use(requestLogger(app.name));
```

#### 签名

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### 类型

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### 详细信息

| 属性                | 类型                              | 描述                           | 默认值                                                                                                                                                  |
| ------------------- | --------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip`              | `(ctx?: any) => Promise<boolean>` | 根据请求上下文跳过某些请求日志 | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | 日志打印的请求信息白名单       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | 日志打印的响应信息白名单       | `['status']`                                                                                                                                            |

### app.createLogger()

#### 定义

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

`dirname` 为相对路径时，输出日志文件到当前应用名称的目录下。

### plugin.createLogger()

用法同 `app.createLogger()`

#### 定义

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## 日志配置

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

获取当前系统配置的日志级别。

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

以当前系统配置的日志目录为基础，拼接目录路径。

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

获取当前系统配置的日志输出方式。

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

获取当前系统配置的日志格式。

## 日志输出

### Transports

预置的输出方式。

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## 相关文档

- [开发指南 - 日志](/plugin-development/server/logger)
- [日志](/log-and-monitor/logger/)
