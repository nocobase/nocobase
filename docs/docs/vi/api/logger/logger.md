:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Logger

## Tạo Logger

### `createLogger()`

Tạo một logger tùy chỉnh.

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

#### Chi tiết

| Thuộc tính | Mô tả                      |
| :--------- | :------------------------- |
| `dirname`  | Thư mục đầu ra của nhật ký |
| `filename` | Tên tệp nhật ký            |
| `format`   | Định dạng nhật ký          |
| `transports` | Phương thức xuất nhật ký   |

### `createSystemLogger()`

Tạo các nhật ký hệ thống được in theo một phương thức quy định. Tham khảo [Logger - Nhật ký hệ thống](/log-and-monitor/logger/index.md#system-log)

#### Chữ ký

- `createSystemLogger(options: SystemLoggerOptions)`

#### Kiểu

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}
```

#### Chi tiết

| Thuộc tính      | Mô tả                                        |
| :-------------- | :------------------------------------------- |
| `seperateError` | Có xuất riêng các nhật ký cấp độ `error` hay không |

### `requestLogger()`

Middleware để ghi nhật ký yêu cầu và phản hồi API.

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

#### Chi tiết

| Thuộc tính          | Kiểu                              | Mô tả                                                            | Giá trị mặc định                                                                                                                                                 |
| :------------------ | :-------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Bỏ qua việc ghi nhật ký cho một số yêu cầu dựa trên ngữ cảnh yêu cầu. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Danh sách trắng các thông tin yêu cầu được in trong nhật ký.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Danh sách trắng các thông tin phản hồi được in trong nhật ký.      | `['status']`                                                                                                                                            |

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

Khi `dirname` là một đường dẫn tương đối, các tệp nhật ký sẽ được xuất vào thư mục có tên của ứng dụng hiện tại.

### plugin.createLogger()

Cách sử dụng tương tự như `app.createLogger()`.

#### Định nghĩa

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Cấu hình Logger

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Lấy cấp độ nhật ký hiện đang được cấu hình trong hệ thống.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Nối các đường dẫn thư mục dựa trên thư mục nhật ký hiện đang được cấu hình trong hệ thống.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Lấy các phương thức xuất nhật ký hiện đang được cấu hình trong hệ thống.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Lấy định dạng nhật ký hiện đang được cấu hình trong hệ thống.

## Xuất nhật ký

### Transports

Các phương thức xuất được định nghĩa trước.

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

- [Hướng dẫn phát triển - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)