---
title: "ctx.modal"
description: "ctx.modal là API điều khiển popup, dùng để mở popup xác nhận, thông báo thông tin, popup tùy chỉnh."
keywords: "ctx.modal,popup,xác nhận,confirm,thông báo thông tin,RunJS,NocoBase"
---

# ctx.modal

API tắt dựa trên Ant Design Modal, dùng để chủ động mở modal trong RunJS (thông báo thông tin, popup xác nhận, v.v.). Được triển khai bởi `ctx.viewer` / hệ thống view.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField** | Hiển thị kết quả thao tác, thông báo lỗi hoặc xác nhận lần hai sau khi tương tác với người dùng |
| **Luồng sự kiện / sự kiện action** | Popup xác nhận trước khi submit, kết thúc các bước tiếp theo qua `ctx.exit()` khi người dùng hủy |
| **Quy tắc liên kết** | Popup thông báo cho người dùng khi validate thất bại |

> Lưu ý: `ctx.modal` khả dụng trong môi trường RunJS có ngữ cảnh view (như JSBlock trong page, luồng sự kiện, v.v.); trong backend hoặc ngữ cảnh không UI có thể không tồn tại, khi sử dụng khuyến nghị dùng optional chaining (`ctx.modal?.confirm?.()`).

## Định nghĩa kiểu

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // 用户点确定返回 true，取消返回 false
};
```

`ModalConfig` giống với cấu hình phương thức tĩnh `Modal` của Ant Design.

## Phương thức thường dùng

| Phương thức | Giá trị trả về | Mô tả |
|------|--------|------|
| `info(config)` | `Promise<void>` | Popup thông báo thông tin |
| `success(config)` | `Promise<void>` | Popup thông báo thành công |
| `error(config)` | `Promise<void>` | Popup thông báo lỗi |
| `warning(config)` | `Promise<void>` | Popup thông báo cảnh báo |
| `confirm(config)` | `Promise<boolean>` | Popup xác nhận, người dùng click ok trả về `true`, hủy trả về `false` |

## Tham số cấu hình

Giống với `Modal` của Ant Design, các trường thường dùng bao gồm:

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `title` | `ReactNode` | Tiêu đề |
| `content` | `ReactNode` | Nội dung |
| `okText` | `string` | Văn bản button xác nhận |
| `cancelText` | `string` | Văn bản button hủy (chỉ `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Thực thi khi click xác nhận |
| `onCancel` | `() => void` | Thực thi khi click hủy |

## Quan hệ với ctx.message, ctx.openView

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Thông báo nhẹ tạm thời** | `ctx.message`, tự biến mất |
| **Popup thông tin/thành công/lỗi/cảnh báo** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Xác nhận lần hai (cần lựa chọn của người dùng)** | `ctx.modal.confirm`, kết hợp `ctx.exit()` để điều khiển luồng |
| **Tương tác form, list phức tạp, v.v.** | `ctx.openView` mở view tùy chỉnh (page/drawer/popup) |

## Ví dụ

### Popup thông tin đơn giản

```ts
ctx.modal.info({
  title: '提示',
  content: '操作已完成',
});
```

### Popup xác nhận và điều khiển luồng

```ts
const confirmed = await ctx.modal.confirm({
  title: '确认删除',
  content: '确定要删除这条记录吗？',
  okText: '确定',
  cancelText: '取消',
});
if (!confirmed) {
  ctx.exit();  // 用户取消时终止后续步骤
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Popup xác nhận với onOk

```ts
await ctx.modal.confirm({
  title: '确认提交',
  content: '提交后将无法修改，确定继续？',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Thông báo lỗi

```ts
try {
  await someOperation();
  ctx.modal.success({ title: '成功', content: '操作已完成' });
} catch (e) {
  ctx.modal.error({ title: '错误', content: e.message });
}
```

## Liên quan

- [ctx.message](./message.md): Thông báo nhẹ tạm thời, tự biến mất
- [ctx.exit()](./exit.md): Khi người dùng hủy xác nhận, thường dùng `if (!confirmed) ctx.exit()` để kết thúc luồng
- [ctx.openView()](./open-view.md): Mở view tùy chỉnh, phù hợp tương tác phức tạp
