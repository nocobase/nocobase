:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/t).
:::

# ctx.t()

Một hàm phím tắt i18n được sử dụng trong RunJS để dịch văn bản dựa trên cài đặt ngôn ngữ của ngữ cảnh hiện tại. Phù hợp để quốc tế hóa các nội dung nội dòng như nút bấm, tiêu đề và thông báo.

## Phạm vi áp dụng

`ctx.t()` có thể được sử dụng trong tất cả các môi trường thực thi của RunJS.

## Định nghĩa kiểu

```ts
t(key: string, options?: Record<string, any>): string
```

## Tham số

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `key` | `string` | Key dịch hoặc mẫu có chứa trình giữ chỗ (ví dụ: `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Tùy chọn. Các biến nội suy (ví dụ: `{ name: 'John', count: 5 }`), hoặc các tùy chọn i18n (ví dụ: `defaultValue`, `ns`). |

## Giá trị trả về

- Trả về chuỗi đã được dịch; nếu key không có bản dịch tương ứng và không cung cấp `defaultValue`, nó có thể trả về chính key đó hoặc chuỗi sau khi đã nội suy.

## Namespace (ns)

**Namespace mặc định cho môi trường RunJS là `runjs`**. Khi không chỉ định `ns`, `ctx.t(key)` sẽ tìm kiếm key trong namespace `runjs`.

```ts
// Mặc định lấy key từ namespace runjs
ctx.t('Submit'); // Tương đương với ctx.t('Submit', { ns: 'runjs' })

// Lấy key từ namespace được chỉ định
ctx.t('Submit', { ns: 'myModule' });

// Tìm kiếm lần lượt từ nhiều namespace (ưu tiên runjs, sau đó đến common)
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

- **Plugin Bản địa hóa**: Để dịch văn bản, trước tiên bạn cần kích hoạt plugin Bản địa hóa. Các từ khóa thiếu bản dịch sẽ tự động được trích xuất vào danh sách quản lý bản địa hóa để thuận tiện cho việc bảo trì và dịch thuật tập trung.
- Hỗ trợ nội suy kiểu i18next: Sử dụng `{{tên_biến}}` trong key và truyền biến cùng tên vào `options` để thay thế.
- Ngôn ngữ được quyết định bởi ngữ cảnh hiện tại (ví dụ: `ctx.i18n.language`, locale của người dùng).

## Liên quan

- [ctx.i18n](./i18n.md): Đọc hoặc chuyển đổi ngôn ngữ