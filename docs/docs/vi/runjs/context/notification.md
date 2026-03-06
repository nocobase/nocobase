:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/notification).
:::

# ctx.notification

Dựa trên Ant Design Notification, API thông báo toàn cục này được sử dụng để hiển thị các bảng thông báo ở **góc trên bên phải** của trang. So với `ctx.message`, thông báo có thể bao gồm tiêu đề và mô tả, phù hợp cho các nội dung cần hiển thị trong thời gian dài hơn hoặc cần người dùng lưu ý.

## Các trường hợp sử dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / Sự kiện thao tác** | Thông báo hoàn thành nhiệm vụ, kết quả thao tác hàng loạt, hoàn thành xuất dữ liệu, v.v. |
| **Luồng sự kiện** | Cảnh báo cấp hệ thống sau khi các quy trình không đồng bộ kết thúc. |
| **Nội dung cần hiển thị lâu hơn** | Thông báo đầy đủ với tiêu đề, mô tả và các nút thao tác. |

## Định nghĩa kiểu dữ liệu

```ts
notification: NotificationInstance;
```

`NotificationInstance` là giao diện notification của Ant Design, cung cấp các phương thức sau.

## Các phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `open(config)` | Mở thông báo với cấu hình tùy chỉnh |
| `success(config)` | Hiển thị thông báo loại thành công |
| `info(config)` | Hiển thị thông báo loại thông tin |
| `warning(config)` | Hiển thị thông báo loại cảnh báo |
| `error(config)` | Hiển thị thông báo loại lỗi |
| `destroy(key?)` | Đóng thông báo có key được chỉ định; nếu không truyền key, tất cả thông báo sẽ bị đóng |

**Tham số cấu hình** (Nhất quán với [Ant Design notification](https://ant.design/components/notification)):

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `message` | `ReactNode` | Tiêu đề thông báo |
| `description` | `ReactNode` | Mô tả thông báo |
| `duration` | `number` | Thời gian tự động đóng (giây). Mặc định là 4.5 giây; đặt thành 0 để không tự động đóng |
| `key` | `string` | Định danh duy nhất của thông báo, dùng cho `destroy(key)` để đóng thông báo cụ thể |
| `onClose` | `() => void` | Hàm callback khi thông báo đóng |
| `placement` | `string` | Vị trí: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Ví dụ

### Cách dùng cơ bản

```ts
ctx.notification.open({
  message: 'Thao tác thành công',
  description: 'Dữ liệu đã được lưu vào máy chủ.',
});
```

### Gọi nhanh theo loại

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Tùy chỉnh thời gian hiển thị và key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Không tự động đóng
});

// Đóng thủ công sau khi nhiệm vụ hoàn thành
ctx.notification.destroy('task-123');
```

### Đóng tất cả thông báo

```ts
ctx.notification.destroy();
```

## Khác biệt so với ctx.message

| Đặc tính | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Vị trí** | Giữa phía trên trang | Góc trên bên phải (có thể cấu hình) |
| **Cấu trúc** | Gợi ý nhẹ một dòng | Có thể bao gồm tiêu đề + mô tả |
| **Mục đích** | Phản hồi tạm thời, tự động biến mất | Thông báo đầy đủ hơn, có thể hiển thị lâu |
| **Kịch bản điển hình** | Thao tác thành công, lỗi xác thực, sao chép thành công | Hoàn thành nhiệm vụ, tin nhắn hệ thống, nội dung dài cần người dùng chú ý |

## Liên quan

- [ctx.message](./message.md) - Gợi ý nhẹ phía trên, phù hợp để phản hồi nhanh
- [ctx.modal](./modal.md) - Xác nhận hộp thoại, tương tác dạng chặn
- [ctx.t()](./t.md) - Đa ngôn ngữ, thường dùng kết hợp với notification