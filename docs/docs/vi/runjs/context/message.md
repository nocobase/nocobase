---
title: "ctx.message"
description: "ctx.message là API tin nhắn thông báo, dùng cho các thông báo nhẹ như success, error, warning, info."
keywords: "ctx.message,tin nhắn thông báo,success,error,warning,info,RunJS,NocoBase"
---

# ctx.message

API message global của Ant Design, dùng để hiển thị thông báo nhẹ tạm thời ở giữa trên cùng của page. Tin nhắn sẽ tự động đóng sau một khoảng thời gian nhất định, cũng có thể đóng thủ công bởi người dùng.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Phản hồi thao tác, thông báo validate, copy thành công và các thông báo nhẹ khác |
| **Thao tác form / luồng sự kiện** | Phản hồi như submit thành công, lưu thất bại, validate không qua |
| **Sự kiện action (JSAction)** | Phản hồi tức thì sau khi click, hoàn thành thao tác hàng loạt |

## Định nghĩa kiểu

```ts
message: MessageInstance;
```

`MessageInstance` là interface message của Ant Design, cung cấp các phương thức sau.

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `success(content, duration?)` | Hiển thị thông báo thành công |
| `error(content, duration?)` | Hiển thị thông báo lỗi |
| `warning(content, duration?)` | Hiển thị thông báo cảnh báo |
| `info(content, duration?)` | Hiển thị thông báo thông tin |
| `loading(content, duration?)` | Hiển thị thông báo loading (cần đóng thủ công) |
| `open(config)` | Mở message với cấu hình tùy chỉnh |
| `destroy()` | Đóng tất cả message đang hiển thị |

**Tham số:**

- `content` (`string` \| `ConfigOptions`): Nội dung tin nhắn hoặc object cấu hình
- `duration` (`number`, tùy chọn): Thời gian trễ tự động đóng (giây), mặc định 3 giây; đặt 0 nghĩa là không tự động đóng

**ConfigOptions** (khi `content` là object):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // 消息内容
  duration?: number;        // 自动关闭延迟（秒）
  onClose?: () => void;    // 关闭回调
  icon?: React.ReactNode;  // 自定义图标
}
```

## Ví dụ

### Cách dùng cơ bản

```ts
ctx.message.success('操作成功');
ctx.message.error('操作失败');
ctx.message.warning('请先选择数据');
ctx.message.info('正在处理...');
```

### Kết hợp với ctx.t cho i18n

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### loading và đóng thủ công

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// 执行异步操作
await saveData();
hide();  // 手动关闭 loading
ctx.message.success(ctx.t('Saved'));
```

### Dùng open với cấu hình tùy chỉnh

```ts
ctx.message.open({
  type: 'success',
  content: '自定义成功提示',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Đóng tất cả message

```ts
ctx.message.destroy();
```

## Khác biệt với ctx.notification

| Đặc điểm | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Vị trí** | Giữa trên cùng của page | Góc trên bên phải |
| **Mục đích** | Thông báo nhẹ tạm thời, tự biến mất | Panel thông báo, có thể có tiêu đề và mô tả, phù hợp hiển thị thời gian dài hơn |
| **Kịch bản điển hình** | Phản hồi thao tác, thông báo validate, copy thành công | Thông báo task hoàn thành, message hệ thống, nội dung dài cần người dùng chú ý |

## Liên quan

- [ctx.notification](./notification.md) - Thông báo góc trên bên phải, phù hợp hiển thị thời gian dài hơn
- [ctx.modal](./modal.md) - Popup xác nhận, tương tác blocking
- [ctx.t()](./t.md) - i18n, thường được dùng kết hợp với message
