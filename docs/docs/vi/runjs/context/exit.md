---
title: "ctx.exit()"
description: "ctx.exit() thoát Flow hoặc luồng sự kiện hiện tại, có thể kèm giá trị trả về, dùng cho rẽ nhánh điều kiện, kết thúc sớm."
keywords: "ctx.exit,thoát Flow,luồng sự kiện,rẽ nhánh điều kiện,RunJS,NocoBase"
---

# ctx.exit()

Kết thúc thực thi luồng sự kiện hiện tại, các bước tiếp theo sẽ không chạy. Thường dùng khi điều kiện nghiệp vụ không thỏa mãn, người dùng hủy hoặc xảy ra lỗi không thể khôi phục.

## Kịch bản áp dụng

`ctx.exit()` thường được sử dụng trong các ngữ cảnh có thể thực thi JS sau:

| Kịch bản | Mô tả |
|------|------|
| **Luồng sự kiện** | Trong luồng sự kiện được kích hoạt bởi submit form, click button, v.v., dừng các bước tiếp theo khi điều kiện không thỏa mãn |
| **Quy tắc liên kết** | Liên kết field, liên kết filter, v.v., kết thúc luồng sự kiện hiện tại khi validate thất bại hoặc cần bỏ qua thực thi |
| **Sự kiện action** | Trong action tùy chỉnh (như xác nhận xóa, validate trước khi lưu), thoát khi người dùng hủy hoặc validate không qua |

> Khác biệt với `ctx.exitAll()`: `ctx.exit()` chỉ kết thúc luồng sự kiện hiện tại, các luồng sự kiện khác cùng sự kiện không bị ảnh hưởng; `ctx.exitAll()` sẽ kết thúc luồng sự kiện hiện tại và các luồng sự kiện tiếp theo chưa thực thi cùng sự kiện.

## Định nghĩa kiểu

```ts
exit(): never;
```

Gọi `ctx.exit()` sẽ ném `FlowExitException` nội bộ, được engine luồng sự kiện bắt và dừng thực thi luồng sự kiện hiện tại. Một khi đã gọi, các câu lệnh còn lại trong code JS hiện tại sẽ không được thực thi.

## So sánh với ctx.exitAll()

| Phương thức | Phạm vi tác dụng |
|------|----------|
| `ctx.exit()` | Chỉ kết thúc luồng sự kiện hiện tại, các luồng sự kiện tiếp theo không bị ảnh hưởng |
| `ctx.exitAll()` | Kết thúc luồng sự kiện hiện tại, và dừng các luồng sự kiện **thực thi tuần tự** tiếp theo cùng sự kiện |

## Ví dụ

### Thoát khi người dùng hủy

```ts
// 确认弹窗中，用户点击取消则终止事件流
if (!confirmed) {
  ctx.message.info('已取消操作');
  ctx.exit();
}
```

### Thoát khi validate tham số thất bại

```ts
// 校验不通过时提示并终止
if (!params.value || params.value.length < 3) {
  ctx.message.error('参数无效，长度至少为 3');
  ctx.exit();
}
```

### Thoát khi điều kiện nghiệp vụ không thỏa mãn

```ts
// 条件不满足时终止，后续步骤不会执行
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: '仅草稿状态可提交' });
  ctx.exit();
}
```

### Lựa chọn giữa ctx.exitAll()

```ts
// 仅当前事件流需退出 → 使用 ctx.exit()
if (!params.valid) {
  ctx.message.error('参数无效');
  ctx.exit();  // 其他事件流不受影响
}

// 需终止当前事件下的全部后续事件流 → 使用 ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: '权限不足' });
  ctx.exitAll();  // 主事件流及同事件下后续事件流一并终止
}
```

### Thoát theo lựa chọn người dùng sau khi xác nhận popup

```ts
const ok = await ctx.modal?.confirm?.({
  title: '确认删除',
  content: '删除后不可恢复，是否继续？',
});
if (!ok) {
  ctx.message.info('已取消');
  ctx.exit();
}
```

## Lưu ý

- Sau khi gọi `ctx.exit()`, code tiếp theo trong JS hiện tại sẽ không được thực thi; khuyến nghị thông báo lý do cho người dùng qua `ctx.message`, `ctx.notification` hoặc popup trước khi gọi
- Trong code nghiệp vụ thường không cần bắt `FlowExitException`, để engine luồng sự kiện xử lý
- Nếu cần kết thúc tất cả luồng sự kiện tiếp theo cùng sự kiện hiện tại, sử dụng `ctx.exitAll()`

## Liên quan

- [ctx.exitAll()](./exit-all.md): Kết thúc luồng sự kiện hiện tại và luồng sự kiện tiếp theo cùng sự kiện
- [ctx.message](./message.md): Tin nhắn thông báo
- [ctx.modal](./modal.md): Popup xác nhận
