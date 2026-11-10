---
title: "ctx.exit()"
description: "Cả hai lệnh đều kết thúc bước hiện tại và bỏ qua các luồng tuần tự còn lại trong cùng sự kiện. Các luồng đang chạy song song vẫn tiếp tục."
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

> `ctx.exit()` / `ctx.exitAll()` — Cả hai lệnh đều kết thúc bước hiện tại và bỏ qua các luồng tuần tự còn lại trong cùng sự kiện. Các luồng đang chạy song song vẫn tiếp tục.

## Định nghĩa kiểu

```ts
exit(): never;
```

Gọi `ctx.exit()` sẽ ném `FlowExitAllException` nội bộ, được engine luồng sự kiện bắt và dừng thực thi luồng sự kiện hiện tại. Một khi đã gọi, các câu lệnh còn lại trong code JS hiện tại sẽ không được thực thi.

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
- Trong code nghiệp vụ thường không cần bắt `FlowExitAllException`, để engine luồng sự kiện xử lý

## Liên quan

- [ctx.exitAll()](./exit-all.md)
- [ctx.message](./message.md): Tin nhắn thông báo
- [ctx.modal](./modal.md): Popup xác nhận
