:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Logger

Hệ thống ghi nhật ký (logging) của NocoBase được xây dựng dựa trên <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Theo mặc định, NocoBase phân loại nhật ký thành nhật ký yêu cầu API, nhật ký hoạt động hệ thống và nhật ký thực thi SQL. Trong đó, nhật ký yêu cầu API và nhật ký thực thi SQL được ứng dụng in ra nội bộ. Các nhà phát triển plugin thường chỉ cần in các nhật ký hoạt động hệ thống liên quan đến plugin.

Tài liệu này sẽ hướng dẫn cách tạo và in nhật ký khi phát triển plugin.

## Các phương thức in mặc định

NocoBase cung cấp các phương thức in nhật ký hoạt động hệ thống. Nhật ký được in theo các trường quy định và đồng thời được xuất ra các tệp chỉ định.

```ts
// Phương thức in mặc định
app.log.info("message");

// Sử dụng trong middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Sử dụng trong plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Tất cả các phương thức trên đều tuân theo cách sử dụng dưới đây:

Tham số đầu tiên là thông báo nhật ký, và tham số thứ hai là một đối tượng metadata tùy chọn, có thể là bất kỳ cặp khóa-giá trị nào. Trong đó, `module`, `submodule` và `method` sẽ được trích xuất thành các trường riêng biệt, còn các trường còn lại sẽ được đặt trong trường `meta`.

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

## Xuất ra các tệp khác

Nếu bạn muốn sử dụng phương thức in mặc định của hệ thống nhưng không muốn xuất ra tệp mặc định, bạn có thể tạo một thể hiện logger hệ thống tùy chỉnh bằng cách sử dụng `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Có xuất riêng nhật ký cấp độ error ra tệp 'xxx_error.log' hay không
});
```

## Logger tùy chỉnh

Nếu bạn không muốn sử dụng các phương thức in do hệ thống cung cấp mà muốn sử dụng các phương thức gốc của Winston, bạn có thể tạo nhật ký bằng các phương thức sau.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` mở rộng từ `winston.LoggerOptions` gốc.

- `transports` - Sử dụng `'console' | 'file' | 'dailyRotateFile'` để áp dụng các phương thức xuất đã được cài đặt sẵn.
- `format` - Sử dụng `'logfmt' | 'json' | 'delimiter'` để áp dụng các định dạng in đã được cài đặt sẵn.

### `app.createLogger`

Trong các tình huống đa ứng dụng, đôi khi chúng ta muốn tùy chỉnh thư mục và tệp đầu ra, có thể xuất ra thư mục được đặt tên theo ứng dụng hiện tại.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Xuất ra /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Trường hợp sử dụng và cách dùng tương tự như `app.createLogger`.

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