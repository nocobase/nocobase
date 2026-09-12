---
title: "ctx.logger"
description: "ctx.logger là instance log RunJS, dùng để output log phân cấp như debug, info, warn, error."
keywords: "ctx.logger,log,debug,info,warn,error,RunJS,NocoBase"
---

# ctx.logger

Wrapper log dựa trên [pino](https://github.com/pinojs/pino), cung cấp log JSON có cấu trúc hiệu suất cao. Khuyến nghị sử dụng `ctx.logger` thay vì `console` để thuận tiện cho việc thu thập và phân tích log.

## Kịch bản áp dụng

Tất cả kịch bản RunJS đều có thể sử dụng `ctx.logger`, dùng để debug, theo dõi lỗi, phân tích performance, v.v.

## Định nghĩa kiểu

```ts
logger: pino.Logger;
```

`ctx.logger` là `engine.logger.child({ module: 'flow-engine' })`, tức là child logger pino kèm theo ngữ cảnh `module`.

## Cấp độ log

pino hỗ trợ các cấp độ sau (từ cao đến thấp):

| Cấp độ | Phương thức | Mô tả |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Lỗi nghiêm trọng, thường gây thoát process |
| `error` | `ctx.logger.error()` | Lỗi, biểu thị request hoặc thao tác thất bại |
| `warn` | `ctx.logger.warn()` | Cảnh báo, biểu thị rủi ro tiềm ẩn hoặc tình huống bất thường |
| `info` | `ctx.logger.info()` | Thông tin runtime thông thường |
| `debug` | `ctx.logger.debug()` | Thông tin debug, dùng cho phát triển |
| `trace` | `ctx.logger.trace()` | Theo dõi chi tiết, dùng cho chẩn đoán sâu |

## Cách viết khuyến nghị

Khuyến nghị sử dụng dạng `level(msg, meta)`: thông điệp đứng trước, object metadata tùy chọn đứng sau.

```ts
ctx.logger.info('区块加载完成');
ctx.logger.info('操作成功', { recordId: 456 });
ctx.logger.warn('性能警告', { duration: 5000 });
ctx.logger.error('操作失败', { userId: 123, action: 'create' });
ctx.logger.error('请求失败', { err });
```

pino cũng hỗ trợ `level(meta, msg)` (object đứng trước) hoặc `level({ msg, ...meta })` (object đơn), có thể sử dụng theo nhu cầu.

## Ví dụ

### Cách dùng cơ bản

```ts
ctx.logger.info('区块加载完成');
ctx.logger.warn('请求失败，使用缓存', { err });
ctx.logger.debug('正在保存', { recordId: ctx.record?.id });
```

### Sử dụng child() để tạo child logger

```ts
// 为当前逻辑创建带上下文的子 logger
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('执行步骤 1');
log.debug('执行步骤 2', { step: 2 });
```

### Quan hệ với console

Khuyến nghị sử dụng trực tiếp `ctx.logger` để có log JSON có cấu trúc. Nếu quen sử dụng `console`, có thể tương ứng: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Định dạng log

pino output JSON có cấu trúc, mỗi log chứa:

- `level`: Cấp độ log (số)
- `time`: Timestamp (mili giây)
- `msg`: Thông điệp log
- `module`: Cố định là `flow-engine`
- Các trường tùy chỉnh khác (truyền qua object)

## Lưu ý

- Log là JSON có cấu trúc, tiện cho thu thập, tìm kiếm và phân tích
- Child logger được tạo qua `child()` cũng khuyến nghị cách viết `level(msg, meta)`
- Một số môi trường runtime (như workflow) có thể sử dụng cách output log khác

## Liên quan

- [pino](https://github.com/pinojs/pino) — Thư viện log nền tảng
