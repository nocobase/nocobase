---
title: "ctx.t()"
description: "ctx.t() là phương thức dịch i18n của RunJS, trả về văn bản theo ngôn ngữ hiện tại dựa trên key."
keywords: "ctx.t,i18n,dịch,văn bản đa ngôn ngữ,RunJS,NocoBase"
---

# ctx.t()

Hàm tắt i18n dùng để dịch văn bản trong RunJS, dựa trên cài đặt ngôn ngữ của ngữ cảnh hiện tại. Phù hợp với i18n cho các văn bản inline như button, tiêu đề, thông báo.

## Kịch bản áp dụng

Tất cả môi trường thực thi RunJS đều có thể sử dụng `ctx.t()`.

## Định nghĩa kiểu

```ts
t(key: string, options?: Record<string, any>): string
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `key` | `string` | Key dịch hoặc template chứa placeholder (như `Hello {{name}}`, `{{count}} rows`) |
| `options` | `object` | Tùy chọn. Biến nội suy (như `{ name: '张三', count: 5 }`), hoặc tùy chọn i18n (như `defaultValue`, `ns`) |

## Giá trị trả về

- Trả về string đã dịch; nếu key không có dịch tương ứng và không cung cấp `defaultValue`, có thể trả về key bản thân hoặc string đã nội suy.

## Namespace (ns)

**Namespace mặc định của môi trường RunJS là `runjs`**. Khi không chỉ định `ns`, `ctx.t(key)` sẽ tìm key từ namespace `runjs`.

```ts
// 默认从 runjs 命名空间取 key
ctx.t('Submit'); // 等价于 ctx.t('Submit', { ns: 'runjs' })

// 从指定命名空间取 key
ctx.t('Submit', { ns: 'myModule' });

// 从多个命名空间依次查找（先 runjs，再 common）
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Ví dụ

### Key đơn giản

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Với biến nội suy

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Văn bản động như thời gian tương đối

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Chỉ định namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Lưu ý

- **Plugin localization**: Nếu cần dịch văn bản, cần kích hoạt plugin localization trước. Các key thiếu dịch sẽ tự động được trích xuất vào danh sách quản lý localization, tiện cho việc bảo trì và dịch thống nhất.
- Hỗ trợ nội suy kiểu i18next: trong key dùng `{{tên biến}}`, truyền biến cùng tên trong `options` để thay thế.
- Ngôn ngữ được xác định bởi ngữ cảnh hiện tại (như `ctx.i18n.language`, locale của user).

## Liên quan

- [ctx.i18n](./i18n.md): Đọc hoặc chuyển đổi ngôn ngữ
