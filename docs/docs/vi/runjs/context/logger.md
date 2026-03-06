:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/logger).
:::

# ctx.logger

Một trình bao bọc (wrapper) nhật ký dựa trên [pino](https://github.com/pinojs/pino), cung cấp nhật ký JSON có cấu trúc với hiệu suất cao. Khuyến nghị sử dụng `ctx.logger` thay vì `console` để thuận tiện cho việc thu thập và phân tích nhật ký.

## Tình huống áp dụng

`ctx.logger` có thể được sử dụng trong tất cả các kịch bản RunJS để gỡ lỗi (debug), theo dõi lỗi, phân tích hiệu suất, v.v.

## Định nghĩa kiểu

```ts
logger: pino.Logger;
```

`ctx.logger` là một `engine.logger.child({ module: 'flow-engine' })`, tức là một logger con của pino đi kèm với ngữ cảnh `module`.

## Cấp độ nhật ký

pino hỗ trợ các cấp độ sau (từ cao đến thấp):

| Cấp độ | Phương thức | Mô tả |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Lỗi nghiêm trọng, thường dẫn đến thoát tiến trình |
| `error` | `ctx.logger.error()` | Lỗi, biểu thị yêu cầu hoặc thao tác thất bại |
| `warn` | `ctx.logger.warn()` | Cảnh báo, biểu thị rủi ro tiềm ẩn hoặc tình trạng bất thường |
| `info` | `ctx.logger.info()` | Thông tin vận hành chung |
| `debug` | `ctx.logger.debug()` | Thông tin gỡ lỗi, dùng trong quá trình phát triển |
| `trace` | `ctx.logger.trace()` | Truy vết chi tiết, dùng để chẩn đoán chuyên sâu |

## Cách viết khuyến nghị

Khuyến nghị sử dụng định dạng `level(msg, meta)`: thông báo (message) ở trước, đối tượng siêu dữ liệu (metadata) tùy chọn ở sau.

```ts
ctx.logger.info('Tải khối hoàn tất');
ctx.logger.info('Thao tác thành công', { recordId: 456 });
ctx.logger.warn('Cảnh báo hiệu suất', { duration: 5000 });
ctx.logger.error('Thao tác thất bại', { userId: 123, action: 'create' });
ctx.logger.error('Yêu cầu thất bại', { err });
```

pino cũng hỗ trợ `level(meta, msg)` (đối tượng ở trước) hoặc `level({ msg, ...meta })` (đối tượng duy nhất), có thể sử dụng tùy theo nhu cầu.

## Ví dụ

### Cách dùng cơ bản

```ts
ctx.logger.info('Tải khối hoàn tất');
ctx.logger.warn('Yêu cầu thất bại, đang sử dụng bộ nhớ đệm', { err });
ctx.logger.debug('Đang lưu', { recordId: ctx.record?.id });
```

### Sử dụng child() để tạo logger con

```ts
// Tạo logger con kèm ngữ cảnh cho logic hiện tại
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Thực hiện bước 1');
log.debug('Thực hiện bước 2', { step: 2 });
```

### Mối quan hệ với console

Khuyến nghị sử dụng trực tiếp `ctx.logger` để có được nhật ký JSON có cấu trúc. Nếu bạn đã quen sử dụng `console`, có thể đối chiếu tương ứng: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Định dạng nhật ký

pino xuất ra JSON có cấu trúc, mỗi dòng nhật ký bao gồm:

- `level`: Cấp độ nhật ký (số)
- `time`: Dấu thời gian (mili giây)
- `msg`: Thông báo nhật ký
- `module`: Cố định là `flow-engine`
- Các trường tùy chỉnh khác (được truyền qua đối tượng)

## Lưu ý

- Nhật ký ở dạng JSON có cấu trúc, giúp dễ dàng thu thập, tìm kiếm và phân tích.
- Các logger con được tạo qua `child()` cũng được khuyến nghị sử dụng cách viết `level(msg, meta)`.
- Một số môi trường chạy (như luồng công việc) có thể sử dụng các phương thức xuất nhật ký khác nhau.

## Liên quan

- [pino](https://github.com/pinojs/pino) — Thư viện nhật ký nền tảng.