---
title: "Logger"
description: "API log của NocoBase: tạo logger, mức log, cấu hình xuất log."
keywords: "Logger,API log,mức log,xuất log,NocoBase"
---

# Logger

## Tạo log

### `createLogger()`

Tạo logger tùy chỉnh.

#### Chữ ký

- `createLogger(options: LoggerOptions)`

#### Kiểu

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Thông tin chi tiết

| Thuộc tính   | Mô tả             |
| ------------ | ----------------- |
| `dirname`    | Thư mục xuất log  |
| `filename`   | Tên file log      |
| `format`     | Định dạng log     |
| `transports` | Phương thức xuất log |

### `createSystemLogger()`

Tạo log vận hành hệ thống được in theo cách quy định. Tham khảo [Log - Log hệ thống](#).

#### Chữ ký

- `createSystemLogger(options: SystemLoggerOptions)`

#### Kiểu

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Thông tin chi tiết

| Thuộc tính      | Mô tả                                  |
| --------------- | -------------------------------------- |
| `seperateError` | Có xuất log mức `error` riêng hay không |

### `requestLogger()`

Middleware log request và response của API.

```ts
app.use(requestLogger(app.name));
```

#### Chữ ký

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Kiểu

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Thông tin chi tiết

| Thuộc tính          | Kiểu                              | Mô tả                                  | Giá trị mặc định                                                                                                                                       |
| ------------------- | --------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Bỏ qua một số log request theo ngữ cảnh | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Whitelist thông tin request được in log | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Whitelist thông tin response được in log | `['status']`                                                                                                                                            |

### app.createLogger()

#### Định nghĩa

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

Khi `dirname` là đường dẫn tương đối, file log sẽ được xuất vào thư mục có tên là tên ứng dụng hiện tại.

### plugin.createLogger()

Cách dùng giống `app.createLogger()`.

#### Định nghĩa

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Cấu hình log

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Lấy mức log đã cấu hình của hệ thống hiện tại.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Lấy đường dẫn ghép dựa trên thư mục log đã cấu hình của hệ thống hiện tại.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Lấy phương thức xuất log đã cấu hình của hệ thống hiện tại.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Lấy định dạng log đã cấu hình của hệ thống hiện tại.

## Xuất log

### Transports

Các phương thức xuất có sẵn.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Tài liệu liên quan

- [Hướng dẫn phát triển - Log](/plugin-development/server/logger)
- [Log](/log-and-monitor/logger/index.md)
