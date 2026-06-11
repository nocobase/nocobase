---
title: "Logger - Nhật ký (Server)"
description: "Nhật ký phía server của NocoBase: app.logger, các cấp độ log, tạo logger con, cấu hình đầu ra log."
keywords: "Logger,Nhật ký,app.logger,Cấp độ log,Log server,NocoBase"
---

# Logger - Nhật ký

Log của NocoBase được đóng gói dựa trên <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Mặc định, NocoBase chia log thành log request interface, log chạy hệ thống và log thực thi SQL. Trong đó log request interface và log thực thi SQL được in bởi nội bộ ứng dụng, nhà phát triển Plugin thường chỉ cần quan tâm đến log chạy hệ thống liên quan đến Plugin.

Dưới đây giới thiệu cách tạo và in log khi phát triển Plugin.

## Phương thức in mặc định

NocoBase cung cấp phương thức in log chạy hệ thống, log được in theo các trường quy định, đồng thời xuất ra tệp đã chỉ định.

```ts
// Phương thức in mặc định
app.log.info("message");

// Sử dụng trong middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Sử dụng trong Plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Các phương thức trên đều tuân theo cách dùng sau:

Tham số đầu tiên là nội dung log, tham số thứ hai là object metadata tùy chọn, có thể là cặp key-value bất kỳ. Trong đó `module`, `submodule`, `method` sẽ được trích xuất thành trường riêng, các trường còn lại đặt vào trường `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Xuất ra tệp khác

Nếu muốn dùng phương thức in mặc định của hệ thống, nhưng không muốn xuất ra tệp mặc định, có thể dùng `createSystemLogger` để tạo một instance log hệ thống tùy chỉnh.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Có xuất log cấp error riêng vào xxx_error.log không
});
```

## Log tùy chỉnh

Nếu không muốn dùng phương thức in được hệ thống cung cấp, muốn dùng trực tiếp cách Winston gốc, có thể tạo log thông qua các phương thức sau.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` được mở rộng trên cơ sở `winston.LoggerOptions` ban đầu.

- `transports` - Có thể dùng `'console' | 'file' | 'dailyRotateFile'` để áp dụng phương thức xuất tích hợp sẵn.
- `format` - Có thể dùng `'logfmt' | 'json' | 'delimiter'` để áp dụng định dạng in tích hợp sẵn.

### `app.createLogger`

Trong tình huống đa ứng dụng, nếu bạn muốn log tùy chỉnh xuất ra thư mục có tên ứng dụng hiện tại, có thể dùng phương thức này.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Xuất ra /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Tình huống và cách dùng giống `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Xuất ra /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```

## Liên kết liên quan

- [Context Request](./context.md) — Trong middleware và Action in log thông qua `ctx.logger`
- [Plugin](./plugin.md) — Sử dụng log thông qua `this.log` và `plugin.createLogger` trong Plugin
- [Telemetry](./telemetry.md) — Kết hợp log và telemetry để triển khai khả năng quan sát
- [Middleware](./middleware.md) — Tình huống điển hình ghi log request trong middleware
- [Tổng quan phát triển server](./index.md) — Vị trí của hệ thống log trong kiến trúc server
