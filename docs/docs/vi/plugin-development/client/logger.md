---
title: "Logger - Nhật ký (Client)"
description: "Nhật ký phía client của NocoBase: app.logger, các cấp độ log, debug frontend, đầu ra console của trình duyệt."
keywords: "Logger,Nhật ký,app.logger,Log client,Debug frontend,NocoBase"
---

# Logger - Nhật ký

NocoBase cung cấp một hệ thống log hiệu năng cao dựa trên [pino](https://github.com/pinojs/pino). Tại bất kỳ nơi nào có `context`, bạn đều có thể lấy instance logger thông qua `ctx.logger` để ghi lại các log quan trọng trong runtime của Plugin hoặc hệ thống.

## Cách dùng cơ bản

```ts
// Ghi lỗi nghiêm trọng (ví dụ: khởi tạo thất bại)
ctx.logger.fatal('Khởi tạo ứng dụng thất bại', { error });

// Ghi lỗi thông thường (ví dụ: yêu cầu API gặp lỗi)
ctx.logger.error('Tải dữ liệu thất bại', { status, message });

// Ghi cảnh báo (ví dụ: rủi ro hiệu năng hoặc thao tác bất thường của người dùng)
ctx.logger.warn('Form hiện tại có thay đổi chưa lưu');

// Ghi thông tin chạy thông thường (ví dụ: component đã tải xong)
ctx.logger.info('Component thông tin người dùng đã tải xong');

// Ghi thông tin debug (ví dụ: thay đổi trạng thái)
ctx.logger.debug('Trạng thái người dùng hiện tại', { user });

// Ghi thông tin trace chi tiết (ví dụ: quy trình render)
ctx.logger.trace('Component render xong', { component: 'UserProfile' });
```

Các phương thức này tương ứng với các cấp độ log khác nhau (từ cao xuống thấp):

| Cấp độ | Phương thức | Mô tả |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Lỗi nghiêm trọng, thường khiến chương trình thoát |
| `error` | `ctx.logger.error()` | Log lỗi, biểu thị yêu cầu hoặc thao tác thất bại |
| `warn` | `ctx.logger.warn()` | Cảnh báo, gợi ý rủi ro tiềm tàng hoặc tình huống bất thường |
| `info` | `ctx.logger.info()` | Thông tin chạy thông thường |
| `debug` | `ctx.logger.debug()` | Thông tin debug, dùng cho môi trường phát triển |
| `trace` | `ctx.logger.trace()` | Thông tin trace chi tiết, thường dùng để chẩn đoán sâu |

## Định dạng log

Mỗi dòng log đầu ra là định dạng JSON có cấu trúc, mặc định bao gồm các trường sau:

| Trường | Kiểu | Mô tả |
|------|------|------|
| `level` | number | Cấp độ log |
| `time` | number | Timestamp (mili giây) |
| `pid` | number | ID tiến trình |
| `hostname` | string | Tên host |
| `msg` | string | Nội dung log |
| Khác | object | Thông tin context tùy chỉnh |

Ví dụ đầu ra:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Gắn context

`ctx.logger` sẽ tự động đưa thông tin context vào, ví dụ Plugin, module hiện tại hoặc nguồn yêu cầu, giúp log truy vết nguồn gốc chính xác hơn.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Ví dụ đầu ra (kèm context):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger tùy chỉnh

Bạn có thể tạo instance logger tùy chỉnh trong Plugin, kế thừa hoặc mở rộng cấu hình mặc định:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Logger con sẽ kế thừa cấu hình của logger chính và tự động đính kèm context.

## Phân chia cấp độ log

Các cấp độ log của Pino tuân theo định nghĩa số từ cao đến thấp, số càng nhỏ thì độ ưu tiên càng thấp.  
Dưới đây là bảng phân chia cấp độ log đầy đủ:

| Tên cấp độ | Giá trị | Tên phương thức | Mô tả |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | Lỗi nghiêm trọng, thường khiến chương trình không thể tiếp tục |
| `error` | 50 | `logger.error()` | Lỗi thông thường, biểu thị yêu cầu thất bại hoặc thao tác bất thường |
| `warn` | 40 | `logger.warn()` | Cảnh báo, gợi ý rủi ro tiềm tàng hoặc tình huống bất thường |
| `info` | 30 | `logger.info()` | Thông tin thông thường, ghi trạng thái hệ thống hoặc thao tác bình thường |
| `debug` | 20 | `logger.debug()` | Thông tin debug, dùng để phân tích vấn đề trong giai đoạn phát triển |
| `trace` | 10 | `logger.trace()` | Thông tin trace chi tiết, dùng để chẩn đoán sâu |
| `silent` | -Infinity | (không có phương thức) | Tắt toàn bộ đầu ra log |

Pino chỉ xuất các log có cấp độ lớn hơn hoặc bằng cấu hình `level` hiện tại. Ví dụ, khi cấp độ log là `info`, các log `debug` và `trace` sẽ bị bỏ qua.

## Best practices trong phát triển Plugin

1. **Sử dụng log có context**  
   Sử dụng `ctx.logger` trong context của Plugin, model hoặc app để tự động mang theo thông tin nguồn gốc.

2. **Phân biệt cấp độ log**  
   - Dùng `error` để ghi lỗi nghiệp vụ  
   - Dùng `info` để ghi thay đổi trạng thái  
   - Dùng `debug` để ghi thông tin debug khi phát triển  

3. **Tránh log quá nhiều**  
   Đặc biệt ở cấp độ `debug` và `trace`, khuyến nghị chỉ bật trong môi trường phát triển.

4. **Sử dụng dữ liệu có cấu trúc**  
   Truyền tham số dạng object thay vì nối chuỗi, giúp phân tích và lọc log dễ hơn.

Thông qua các cách trên, nhà phát triển có thể truy vết quy trình thực thi Plugin hiệu quả hơn, gỡ lỗi và giữ cho hệ thống log có cấu trúc và dễ mở rộng.
