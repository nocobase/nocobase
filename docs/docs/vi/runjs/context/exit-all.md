---
title: "ctx.exitAll()"
description: "ctx.exitAll() thoát tất cả Flow lồng nhau, dùng để kết thúc thực thi một lần khi lồng sâu."
keywords: "ctx.exitAll,thoát Flow,Flow lồng nhau,kết thúc thực thi,RunJS,NocoBase"
---

# ctx.exitAll()

Kết thúc luồng sự kiện hiện tại và tất cả các luồng sự kiện tiếp theo được kích hoạt trong cùng một lần điều phối sự kiện. Thường dùng khi cần dừng ngay lập tức tất cả luồng sự kiện cùng sự kiện do lỗi toàn cục hoặc validate quyền.

## Kịch bản áp dụng

`ctx.exitAll()` thường được sử dụng trong các ngữ cảnh có thể thực thi JS sau, và khi cần **đồng thời dừng luồng sự kiện hiện tại và luồng sự kiện tiếp theo được kích hoạt bởi sự kiện đó**:

| Kịch bản | Mô tả |
|------|------|
| **Luồng sự kiện** | Validate luồng sự kiện chính thất bại (như không đủ quyền), cần dừng luồng sự kiện chính và luồng sự kiện tiếp theo cùng sự kiện chưa thực thi |
| **Quy tắc liên kết** | Khi validate liên kết không qua, cần kết thúc liên kết hiện tại và liên kết tiếp theo được kích hoạt cùng sự kiện |
| **Sự kiện action** | Validate trước action thất bại (như kiểm tra quyền trước khi xóa), cần ngăn action chính và các bước tiếp theo |

> Khác biệt với `ctx.exit()`: `ctx.exit()` chỉ kết thúc luồng sự kiện hiện tại; `ctx.exitAll()` sẽ kết thúc các luồng sự kiện tiếp theo **chưa thực thi** trong điều phối sự kiện hiện tại.

## Định nghĩa kiểu

```ts
exitAll(): never;
```

Gọi `ctx.exitAll()` sẽ ném `FlowExitAllException` nội bộ, được engine luồng sự kiện bắt và dừng instance luồng sự kiện hiện tại và các luồng sự kiện tiếp theo cùng sự kiện. Một khi đã gọi, các câu lệnh còn lại trong code JS hiện tại sẽ không được thực thi.

## So sánh với ctx.exit()

| Phương thức | Phạm vi tác dụng |
|------|----------|
| `ctx.exit()` | Chỉ kết thúc luồng sự kiện hiện tại, các luồng sự kiện tiếp theo không bị ảnh hưởng |
| `ctx.exitAll()` | Kết thúc luồng sự kiện hiện tại, và dừng các luồng sự kiện **thực thi tuần tự** tiếp theo cùng sự kiện |

## Giải thích về chế độ thực thi

- **Thực thi tuần tự (sequential)**: Các luồng sự kiện cùng sự kiện thực thi theo thứ tự; sau khi bất kỳ luồng sự kiện nào gọi `ctx.exitAll()`, các luồng sự kiện tiếp theo sẽ không thực thi nữa
- **Thực thi song song (parallel)**: Các luồng sự kiện cùng sự kiện thực thi song song; khi một luồng sự kiện gọi `ctx.exitAll()` sẽ không gián đoạn các luồng sự kiện khác đang chạy đồng thời (mỗi cái độc lập)

## Ví dụ

### Kết thúc tất cả luồng sự kiện khi validate quyền thất bại

```ts
// 权限不足时，中止主事件流及后续事件流
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: '无操作权限' });
  ctx.exitAll();
}
```

### Kết thúc khi validate trước toàn cục không qua

```ts
// 如：删除前发现关联数据不可删，需阻止主事件流及后续操作
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('存在关联数据，无法删除');
  ctx.exitAll();
}
```

### Lựa chọn với ctx.exit()

```ts
// 仅当前事件流需退出 → 使用 ctx.exit()
if (!params.valid) {
  ctx.message.error('参数无效');
  ctx.exit();  // 后续事件流不受影响
}

// 需终止当前事件下的全部后续事件流 → 使用 ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: '权限不足' });
  ctx.exitAll();  // 主事件流及同事件下后续事件流一并终止
}
```

### Thông báo trước rồi kết thúc

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('请先修正表单中的错误');
  ctx.exitAll();
}
```

## Lưu ý

- Sau khi gọi `ctx.exitAll()`, code tiếp theo trong JS hiện tại sẽ không được thực thi; khuyến nghị thông báo lý do cho người dùng qua `ctx.message`, `ctx.notification` hoặc popup trước khi gọi
- Trong code nghiệp vụ thường không cần bắt `FlowExitAllException`, để engine luồng sự kiện xử lý
- Nếu chỉ cần dừng luồng sự kiện hiện tại mà không ảnh hưởng đến luồng sự kiện tiếp theo, sử dụng `ctx.exit()`
- Trong chế độ song song, `ctx.exitAll()` chỉ kết thúc luồng sự kiện hiện tại, không ngắt các luồng sự kiện đang chạy đồng thời

## Liên quan

- [ctx.exit()](./exit.md): Chỉ kết thúc luồng sự kiện hiện tại
- [ctx.message](./message.md): Tin nhắn thông báo
- [ctx.modal](./modal.md): Popup xác nhận
