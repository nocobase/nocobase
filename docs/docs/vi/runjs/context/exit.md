:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/exit).
:::

# ctx.exit()

Chấm dứt việc thực thi luồng sự kiện hiện tại, các bước tiếp theo sẽ không được chạy. Thường được sử dụng khi các điều kiện nghiệp vụ không được đáp ứng, người dùng hủy bỏ hoặc xảy ra lỗi không thể phục hồi.

## Các kịch bản áp dụng

`ctx.exit()` thường được sử dụng trong các ngữ cảnh có thể thực thi JS sau đây:

| Kịch bản | Mô tả |
|------|------|
| **Luồng sự kiện** | Trong các luồng sự kiện được kích hoạt bởi việc gửi biểu mẫu, nhấp vào nút, v.v., chấm dứt các bước tiếp theo khi điều kiện không được đáp ứng. |
| **Quy tắc liên kết** | Trong liên kết trường, liên kết bộ lọc, v.v., chấm dứt luồng sự kiện hiện tại khi xác thực thất bại hoặc cần bỏ qua việc thực thi. |
| **Sự kiện thao tác** | Trong các thao tác tùy chỉnh (ví dụ: xác nhận xóa, xác thực trước khi lưu), thoát khi người dùng hủy hoặc xác thực không thông qua. |

> Khác biệt với `ctx.exitAll()`: `ctx.exit()` chỉ chấm dứt luồng sự kiện hiện tại, các luồng sự kiện khác trong cùng một sự kiện không bị ảnh hưởng; `ctx.exitAll()` sẽ chấm dứt luồng sự kiện hiện tại và các luồng sự kiện tiếp theo chưa được thực thi trong cùng một sự kiện.

## Định nghĩa kiểu

```ts
exit(): never;
```

Việc gọi `ctx.exit()` sẽ ném ra một `FlowExitException` nội bộ, được công cụ luồng sự kiện bắt và dừng thực thi luồng sự kiện hiện tại. Sau khi được gọi, các câu lệnh còn lại trong mã JS hiện tại sẽ không được thực thi.

## So sánh với ctx.exitAll()

| Phương thức | Phạm vi tác động |
|------|----------|
| `ctx.exit()` | Chỉ chấm dứt luồng sự kiện hiện tại, các luồng sự kiện tiếp theo không bị ảnh hưởng. |
| `ctx.exitAll()` | Chấm dứt luồng sự kiện hiện tại và dừng các luồng sự kiện tiếp theo được thiết lập để **thực thi tuần tự** trong cùng một sự kiện. |

## Ví dụ

### Thoát khi người dùng hủy

```ts
// Trong cửa sổ xác nhận, nếu người dùng nhấp vào hủy thì chấm dứt luồng sự kiện
if (!confirmed) {
  ctx.message.info('Đã hủy thao tác');
  ctx.exit();
}
```

### Thoát khi xác thực tham số thất bại

```ts
// Thông báo và chấm dứt khi xác thực không thông qua
if (!params.value || params.value.length < 3) {
  ctx.message.error('Tham số không hợp lệ, độ dài tối thiểu là 3');
  ctx.exit();
}
```

### Thoát khi điều kiện nghiệp vụ không được đáp ứng

```ts
// Chấm dứt khi điều kiện không được đáp ứng, các bước tiếp theo sẽ không thực hiện
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Chỉ trạng thái bản nháp mới có thể gửi' });
  ctx.exit();
}
```

### Lựa chọn giữa ctx.exit() và ctx.exitAll()

```ts
// Chỉ luồng sự kiện hiện tại cần thoát → Sử dụng ctx.exit()
if (!params.valid) {
  ctx.message.error('Tham số không hợp lệ');
  ctx.exit();  // Các luồng sự kiện khác không bị ảnh hưởng
}

// Cần chấm dứt tất cả các luồng sự kiện tiếp theo trong sự kiện hiện tại → Sử dụng ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Không đủ quyền hạn' });
  ctx.exitAll();  // Luồng sự kiện chính và các luồng sự kiện tiếp theo trong cùng sự kiện đều bị chấm dứt
}
```

### Thoát dựa trên lựa chọn của người dùng sau khi xác nhận qua modal

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Xác nhận xóa',
  content: 'Sau khi xóa sẽ không thể khôi phục, bạn có muốn tiếp tục？',
});
if (!ok) {
  ctx.message.info('Đã hủy');
  ctx.exit();
}
```

## Lưu ý

- Sau khi gọi `ctx.exit()`, mã tiếp theo trong JS hiện tại sẽ không được thực thi; khuyến nghị giải thích lý do cho người dùng thông qua `ctx.message`, `ctx.notification` hoặc cửa sổ bật lên trước khi gọi.
- Thông thường không cần bắt `FlowExitException` trong mã nghiệp vụ, hãy để công cụ luồng sự kiện xử lý.
- Nếu cần chấm dứt tất cả các luồng sự kiện tiếp theo trong sự kiện hiện tại, hãy sử dụng `ctx.exitAll()`.

## Liên quan

- [ctx.exitAll()](./exit-all.md): Chấm dứt luồng sự kiện hiện tại và các luồng sự kiện tiếp theo trong cùng sự kiện.
- [ctx.message](./message.md): Thông báo tin nhắn.
- [ctx.modal](./modal.md): Cửa sổ xác nhận.