---
title: "ctx.notification"
description: "ctx.notification là API thông báo, dùng cho thông báo nhắc nhở ở góc trên phải, hỗ trợ cấu hình duration, placement, v.v."
keywords: "ctx.notification,thông báo,nhắc nhở,duration,placement,RunJS,NocoBase"
---

# ctx.notification

API notification global dựa trên Ant Design Notification, dùng để hiển thị panel thông báo ở **góc trên bên phải** của page. So với `ctx.message`, notification có thể có tiêu đề và mô tả, phù hợp hiển thị thời gian dài hơn, nội dung cần người dùng chú ý.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / sự kiện action** | Thông báo task hoàn thành, kết quả thao tác hàng loạt, hoàn thành export, v.v. |
| **Luồng sự kiện** | Nhắc nhở cấp hệ thống sau khi luồng bất đồng bộ kết thúc |
| **Nội dung cần hiển thị thời gian dài** | Thông báo đầy đủ với tiêu đề, mô tả, button thao tác |

## Định nghĩa kiểu

```ts
notification: NotificationInstance;
```

`NotificationInstance` là interface notification của Ant Design, cung cấp các phương thức sau.

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `open(config)` | Mở notification với cấu hình tùy chỉnh |
| `success(config)` | Hiển thị notification kiểu thành công |
| `info(config)` | Hiển thị notification kiểu thông tin |
| `warning(config)` | Hiển thị notification kiểu cảnh báo |
| `error(config)` | Hiển thị notification kiểu lỗi |
| `destroy(key?)` | Đóng notification có key chỉ định, không truyền key thì đóng tất cả |

**Tham số cấu hình** (giống với [Ant Design notification](https://ant.design/components/notification-cn)):

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `message` | `ReactNode` | Tiêu đề notification |
| `description` | `ReactNode` | Mô tả notification |
| `duration` | `number` | Thời gian trễ tự động đóng (giây), mặc định 4.5 giây; đặt 0 nghĩa là không tự động đóng |
| `key` | `string` | Định danh duy nhất của notification, dùng cho `destroy(key)` để đóng notification chỉ định |
| `onClose` | `() => void` | Callback đóng |
| `placement` | `string` | Vị trí: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Ví dụ

### Cách dùng cơ bản

```ts
ctx.notification.open({
  message: '操作成功',
  description: '数据已保存到服务器。',
});
```

### Gọi tắt theo kiểu

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

### Tùy chỉnh thời gian và key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // 不自动关闭
});

// 任务完成后手动关闭
ctx.notification.destroy('task-123');
```

### Đóng tất cả notification

```ts
ctx.notification.destroy();
```

## Khác biệt với ctx.message

| Đặc điểm | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Vị trí** | Giữa trên cùng của page | Góc trên bên phải (có thể cấu hình) |
| **Cấu trúc** | Thông báo nhẹ một dòng | Có thể có tiêu đề + mô tả |
| **Mục đích** | Phản hồi tạm thời, tự biến mất | Thông báo đầy đủ hơn, có thể hiển thị thời gian dài |
| **Kịch bản điển hình** | Thao tác thành công, validate thất bại, copy thành công | Task hoàn thành, message hệ thống, nội dung dài cần người dùng chú ý |

## Liên quan

- [ctx.message](./message.md) - Thông báo nhẹ trên cùng, phù hợp phản hồi nhanh
- [ctx.modal](./modal.md) - Popup xác nhận, tương tác blocking
- [ctx.t()](./t.md) - i18n, thường được dùng kết hợp với notification
