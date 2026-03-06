:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/modal).
:::

# ctx.modal

Dựa trên API nhanh của Ant Design Modal, được sử dụng để chủ động mở các hộp thoại (thông báo thông tin, xác nhận, v.v.) trong RunJS. Được thực hiện bởi `ctx.viewer` / hệ thống chế độ xem.

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField** | Hiển thị kết quả thao tác, thông báo lỗi hoặc xác nhận lại sau khi người dùng tương tác. |
| **Luồng sự kiện / Thao tác sự kiện** | Hiển thị hộp thoại xác nhận trước khi gửi; sử dụng `ctx.exit()` để chấm dứt các bước tiếp theo nếu người dùng hủy. |
| **Quy tắc liên kết** | Hiển thị thông báo cho người dùng khi xác thực thất bại. |

> Lưu ý: `ctx.modal` khả dụng trong môi trường RunJS có ngữ cảnh chế độ xem (như JSBlock trong trang, luồng sự kiện, v.v.); có thể không tồn tại trong môi trường backend hoặc ngữ cảnh không có giao diện người dùng (UI). Khuyến nghị sử dụng optional chaining (`ctx.modal?.confirm?.()`) khi gọi.

## Định nghĩa kiểu dữ liệu

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Trả về true nếu người dùng nhấn xác nhận, false nếu hủy
};
```

`ModalConfig` nhất quán với cấu hình các phương thức tĩnh của Ant Design `Modal`.

## Các phương thức thường dùng

| Phương thức | Giá trị trả về | Mô tả |
|------|--------|------|
| `info(config)` | `Promise<void>` | Hộp thoại thông báo thông tin |
| `success(config)` | `Promise<void>` | Hộp thoại thông báo thành công |
| `error(config)` | `Promise<void>` | Hộp thoại thông báo lỗi |
| `warning(config)` | `Promise<void>` | Hộp thoại cảnh báo |
| `confirm(config)` | `Promise<boolean>` | Hộp thoại xác nhận; trả về `true` nếu người dùng nhấn xác nhận và `false` nếu hủy |

## Tham số cấu hình

Nhất quán với Ant Design `Modal`, các trường thường dùng bao gồm:

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `title` | `ReactNode` | Tiêu đề |
| `content` | `ReactNode` | Nội dung |
| `okText` | `string` | Văn bản nút xác nhận |
| `cancelText` | `string` | Văn bản nút hủy (chỉ dành cho `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Thực thi khi nhấn xác nhận |
| `onCancel` | `() => void` | Thực thi khi nhấn hủy |

## Mối quan hệ với ctx.message và ctx.openView

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Thông báo tạm thời nhẹ nhàng** | `ctx.message`, tự động biến mất |
| **Hộp thoại Thông tin/Thành công/Lỗi/Cảnh báo** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Xác nhận lại (cần người dùng lựa chọn)** | `ctx.modal.confirm`, kết hợp với `ctx.exit()` để kiểm soát luồng |
| **Tương tác phức tạp như biểu mẫu, danh sách** | `ctx.openView` để mở chế độ xem tùy chỉnh (trang/ngăn kéo/hộp thoại) |

## Ví dụ

### Hộp thoại thông tin đơn giản

```ts
ctx.modal.info({
  title: 'Thông báo',
  content: 'Thao tác đã hoàn tất',
});
```

### Hộp thoại xác nhận và kiểm soát luồng

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Xác nhận xóa',
  content: 'Bạn có chắc chắn muốn xóa bản ghi này không?',
  okText: 'Xác nhận',
  cancelText: 'Hủy',
});
if (!confirmed) {
  ctx.exit();  // Chấm dứt các bước tiếp theo nếu người dùng hủy
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Hộp thoại xác nhận với onOk

```ts
await ctx.modal.confirm({
  title: 'Xác nhận gửi',
  content: 'Thông tin sẽ không thể sửa đổi sau khi gửi. Bạn có muốn tiếp tục?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Thông báo lỗi

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Thành công', content: 'Thao tác đã hoàn tất' });
} catch (e) {
  ctx.modal.error({ title: 'Lỗi', content: e.message });
}
```

## Liên quan

- [ctx.message](./message.md): Thông báo tạm thời nhẹ nhàng, tự động biến mất.
- [ctx.exit()](./exit.md): Thường dùng `if (!confirmed) ctx.exit()` để chấm dứt luồng khi người dùng hủy xác nhận.
- [ctx.openView()](./open-view.md): Mở chế độ xem tùy chỉnh, phù hợp cho các tương tác phức tạp.