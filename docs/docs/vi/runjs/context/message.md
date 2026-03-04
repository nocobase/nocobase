:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/message).
:::

# ctx.message

API message toàn cục của Ant Design, được sử dụng để hiển thị các thông báo nhẹ tạm thời ở giữa phía trên cùng của trang. Thông báo sẽ tự động đóng sau một khoảng thời gian nhất định hoặc có thể được người dùng đóng thủ công.

## Các kịch bản sử dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Phản hồi thao tác, thông báo xác thực, sao chép thành công và các thông báo nhẹ khác |
| **Thao tác biểu mẫu / Luồng công việc** | Phản hồi cho việc gửi thành công, lưu thất bại, xác thực không vượt qua, v.v. |
| **Sự kiện thao tác (JSAction)** | Phản hồi tức thì cho các lần nhấp chuột, hoàn thành thao tác hàng loạt, v.v. |

## Định nghĩa kiểu

```ts
message: MessageInstance;
```

`MessageInstance` là giao diện message của Ant Design, cung cấp các phương thức sau.

## Các phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `success(content, duration?)` | Hiển thị thông báo thành công |
| `error(content, duration?)` | Hiển thị thông báo lỗi |
| `warning(content, duration?)` | Hiển thị thông báo cảnh báo |
| `info(content, duration?)` | Hiển thị thông báo thông tin |
| `loading(content, duration?)` | Hiển thị thông báo đang tải (cần đóng thủ công) |
| `open(config)` | Mở thông báo bằng cấu hình tùy chỉnh |
| `destroy()` | Đóng tất cả các thông báo đang hiển thị |

**Tham số:**

- `content` (`string` \| `ConfigOptions`): Nội dung thông báo hoặc đối tượng cấu hình
- `duration` (`number`, tùy chọn): Độ trễ tự động đóng (giây), mặc định là 3 giây; đặt thành 0 để không tự động đóng

**ConfigOptions** (khi `content` là một đối tượng):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Nội dung thông báo
  duration?: number;        // Độ trễ tự động đóng (giây)
  onClose?: () => void;    // Callback khi đóng
  icon?: React.ReactNode;  // Biểu tượng tùy chỉnh
}
```

## Ví dụ

### Cách dùng cơ bản

```ts
ctx.message.success('Thao tác thành công');
ctx.message.error('Thao tác thất bại');
ctx.message.warning('Vui lòng chọn dữ liệu trước');
ctx.message.info('Đang xử lý...');
```

### Kết hợp với ctx.t để đa ngôn ngữ hóa

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### loading và đóng thủ công

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Thực hiện thao tác bất đồng bộ
await saveData();
hide();  // Đóng loading thủ công
ctx.message.success(ctx.t('Saved'));
```

### Sử dụng open với cấu hình tùy chỉnh

```ts
ctx.message.open({
  type: 'success',
  content: 'Thông báo thành công tùy chỉnh',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Đóng tất cả thông báo

```ts
ctx.message.destroy();
```

## Sự khác biệt với ctx.notification

| Đặc tính | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Vị trí** | Giữa phía trên cùng của trang | Góc trên bên phải |
| **Mục đích** | Thông báo nhẹ tạm thời, tự động biến mất | Bảng thông báo, có thể kèm tiêu đề và mô tả, phù hợp để hiển thị trong thời gian dài hơn |
| **Kịch bản điển hình** | Phản hồi thao tác, thông báo xác thực, sao chép thành công | Thông báo hoàn thành nhiệm vụ, tin nhắn hệ thống, nội dung dài cần người dùng chú ý |

## Liên quan

- [ctx.notification](./notification.md) - Thông báo góc trên bên phải, phù hợp để hiển thị trong thời gian dài hơn
- [ctx.modal](./modal.md) - Cửa sổ xác nhận, tương tác dạng chặn (blocking)
- [ctx.t()](./t.md) - Đa ngôn ngữ hóa, thường được sử dụng kết hợp với message