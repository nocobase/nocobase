:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Logger

NocoBase cung cấp một hệ thống ghi nhật ký hiệu suất cao dựa trên [pino](https://github.com/pinojs/pino). Ở bất kỳ đâu có thể truy cập `context`, bạn đều có thể lấy một thể hiện logger thông qua `ctx.logger` để ghi lại các nhật ký quan trọng trong quá trình chạy của **plugin** hoặc hệ thống.

## Cách sử dụng cơ bản

```ts
// Ghi lại lỗi nghiêm trọng (ví dụ: khởi tạo thất bại)
ctx.logger.fatal('Ứng dụng khởi tạo thất bại', { error });

// Ghi lại lỗi chung (ví dụ: yêu cầu API bị lỗi)
ctx.logger.error('Tải dữ liệu thất bại', { status, message });

// Ghi lại cảnh báo (ví dụ: rủi ro hiệu suất hoặc thao tác người dùng bất thường)
ctx.logger.warn('Biểu mẫu hiện tại chứa các thay đổi chưa lưu');

// Ghi lại thông tin hoạt động chung (ví dụ: thành phần đã tải xong)
ctx.logger.info('Thành phần hồ sơ người dùng đã tải xong');

// Ghi lại thông tin gỡ lỗi (ví dụ: thay đổi trạng thái)
ctx.logger.debug('Trạng thái người dùng hiện tại', { user });

// Ghi lại thông tin theo dõi chi tiết (ví dụ: luồng render)
ctx.logger.trace('Thành phần đã render xong', { component: 'UserProfile' });
```

Các phương thức này tương ứng với các cấp độ nhật ký khác nhau (từ cao đến thấp):

| Cấp độ | Phương thức | Mô tả |
|------|----------|------|
| `fatal` | `ctx.logger.fatal()` | Lỗi nghiêm trọng, thường khiến chương trình dừng hoạt động |
| `error` | `ctx.logger.error()` | Nhật ký lỗi, cho biết yêu cầu hoặc thao tác thất bại |
| `warn` | `ctx.logger.warn()` | Thông tin cảnh báo, báo hiệu rủi ro tiềm ẩn hoặc tình huống không mong muốn |
| `info` | `ctx.logger.info()` | Thông tin hoạt động thông thường |
| `debug` | `ctx.logger.debug()` | Thông tin gỡ lỗi, dành cho môi trường phát triển |
| `trace` | `ctx.logger.trace()` | Thông tin theo dõi chi tiết, thường dùng để chẩn đoán sâu |

## Định dạng nhật ký

Mỗi đầu ra nhật ký đều ở định dạng JSON có cấu trúc, mặc định chứa các trường sau:

| Trường | Kiểu | Mô tả |
|------|------|------|
| `level` | number | Cấp độ nhật ký |
| `time` | number | Dấu thời gian (mili giây) |
| `pid` | number | ID tiến trình |
| `hostname` | string | Tên máy chủ |
| `msg` | string | Thông báo nhật ký |
| Khác | object | Thông tin ngữ cảnh tùy chỉnh |

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

## Liên kết ngữ cảnh

`ctx.logger` tự động chèn thông tin ngữ cảnh, chẳng hạn như **plugin**, module hoặc nguồn yêu cầu hiện tại, giúp nhật ký có thể truy vết nguồn gốc một cách chính xác hơn.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Ví dụ đầu ra (có ngữ cảnh):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger tùy chỉnh

Bạn có thể tạo các thể hiện logger tùy chỉnh trong các **plugin**, kế thừa hoặc mở rộng cấu hình mặc định:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Các logger con sẽ kế thừa cấu hình của logger chính và tự động đính kèm ngữ cảnh.

## Phân cấp cấp độ nhật ký

Các cấp độ nhật ký của Pino tuân theo định nghĩa số từ cao xuống thấp, trong đó số càng nhỏ thì độ ưu tiên càng thấp.  
Dưới đây là bảng phân cấp cấp độ nhật ký đầy đủ:

| Tên cấp độ | Giá trị | Tên phương thức | Mô tả |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | Lỗi nghiêm trọng, thường khiến chương trình không thể tiếp tục chạy |
| `error` | 50 | `logger.error()` | Lỗi chung, cho biết yêu cầu thất bại hoặc thao tác ngoại lệ |
| `warn` | 40 | `logger.warn()` | Thông tin cảnh báo, báo hiệu rủi ro tiềm ẩn hoặc tình huống không mong muốn |
| `info` | 30 | `logger.info()` | Thông tin chung, ghi lại trạng thái hệ thống hoặc các hoạt động bình thường |
| `debug` | 20 | `logger.debug()` | Thông tin gỡ lỗi, dùng để phân tích vấn đề trong giai đoạn phát triển |
| `trace` | 10 | `logger.trace()` | Thông tin theo dõi chi tiết, dùng để chẩn đoán chuyên sâu |
| `silent` | -Infinity | (Không có phương thức tương ứng) | Tắt tất cả đầu ra nhật ký |

Pino chỉ xuất ra các nhật ký có cấp độ lớn hơn hoặc bằng cấu hình `level` hiện tại. Ví dụ, khi cấp độ nhật ký là `info`, các nhật ký `debug` và `trace` sẽ bị bỏ qua.

## Các phương pháp hay nhất trong phát triển **plugin**

1.  **Sử dụng Logger ngữ cảnh**  
    Sử dụng `ctx.logger` trong ngữ cảnh **plugin**, model hoặc ứng dụng để tự động đính kèm thông tin nguồn.

2.  **Phân biệt các cấp độ nhật ký**  
    - Sử dụng `error` để ghi lại các ngoại lệ nghiệp vụ  
    - Sử dụng `info` để ghi lại các thay đổi trạng thái  
    - Sử dụng `debug` để ghi lại thông tin gỡ lỗi phát triển  

3.  **Tránh ghi nhật ký quá mức**  
    Đặc biệt ở các cấp độ `debug` và `trace`, bạn nên chỉ bật chúng trong môi trường phát triển.

4.  **Sử dụng dữ liệu có cấu trúc**  
    Truyền các tham số đối tượng thay vì nối chuỗi, điều này giúp phân tích và lọc nhật ký hiệu quả hơn.

Bằng cách tuân thủ các phương pháp trên, nhà phát triển có thể theo dõi quá trình thực thi **plugin**, khắc phục sự cố hiệu quả hơn và duy trì một hệ thống nhật ký có cấu trúc và khả năng mở rộng.