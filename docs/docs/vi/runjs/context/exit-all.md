:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/exit-all).
:::

# ctx.exitAll()

Chấm dứt luồng sự kiện hiện tại và tất cả các luồng sự kiện tiếp theo được kích hoạt trong cùng một lần điều phối sự kiện. Thường được sử dụng khi cần dừng ngay lập tức tất cả các luồng sự kiện dưới sự kiện hiện tại do lỗi toàn cục hoặc yêu cầu xác thực quyền truy cập.

## Scenarios áp dụng

`ctx.exitAll()` thường được sử dụng trong các ngữ cảnh có thể thực thi JS, và khi cần **đồng thời dừng luồng sự kiện hiện tại cũng như các luồng sự kiện tiếp theo do sự kiện đó kích hoạt**:

| Scenario | Mô tả |
|------|------|
| **Luồng sự kiện** | Xác thực luồng sự kiện chính thất bại (ví dụ: không đủ quyền), cần dừng luồng chính và các luồng tiếp theo chưa thực thi trong cùng một sự kiện. |
| **Quy tắc liên kết** | Khi xác thực liên kết không thành công, cần chấm dứt liên kết hiện tại và các liên kết tiếp theo được kích hoạt bởi cùng một sự kiện. |
| **Sự kiện thao tác** | Kiểm tra tiền điều kiện thao tác thất bại (ví dụ: kiểm tra quyền trước khi xóa), cần ngăn chặn thao tác chính và các bước tiếp theo. |

> Khác biệt với `ctx.exit()`: `ctx.exit()` chỉ chấm dứt luồng sự kiện hiện tại; `ctx.exitAll()` sẽ chấm dứt luồng sự kiện hiện tại và các luồng sự kiện tiếp theo **chưa thực thi** trong cùng một lần điều phối sự kiện.

## Định nghĩa kiểu

```ts
exitAll(): never;
```

Việc gọi `ctx.exitAll()` sẽ ném ra một ngoại lệ nội bộ `FlowExitAllException`, ngoại lệ này được engine luồng sự kiện bắt để dừng thực thể luồng sự kiện hiện tại và các luồng sự kiện tiếp theo dưới cùng một sự kiện. Sau khi được gọi, các câu lệnh còn lại trong mã JS hiện tại sẽ không được thực thi.

## So sánh với ctx.exit()

| Phương thức | Phạm vi tác động |
|------|----------|
| `ctx.exit()` | Chỉ chấm dứt luồng sự kiện hiện tại, các luồng sự kiện tiếp theo không bị ảnh hưởng. |
| `ctx.exitAll()` | Chấm dứt luồng sự kiện hiện tại và dừng các luồng sự kiện tiếp theo được thực thi **tuần tự** (sequential) trong cùng một sự kiện. |

## Giải thích chế độ thực thi

- **Thực thi tuần tự (sequential)**: Các luồng sự kiện trong cùng một sự kiện được thực hiện theo thứ tự; nếu bất kỳ luồng sự kiện nào gọi `ctx.exitAll()`, các luồng sự kiện phía sau sẽ không được thực thi.
- **Thực thi song song (parallel)**: Các luồng sự kiện trong cùng một sự kiện được thực hiện song song; việc gọi `ctx.exitAll()` trong một luồng sự kiện sẽ không làm gián đoạn các luồng sự kiện khác đang chạy đồng thời (do chúng độc lập với nhau).

## Ví dụ

### Chấm dứt tất cả luồng sự kiện khi xác thực quyền thất bại

```ts
// Khi không đủ quyền, dừng luồng sự kiện chính và các luồng tiếp theo
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Không có quyền thao tác' });
  ctx.exitAll();
}
```

### Chấm dứt khi xác thực tiền điều kiện toàn cục không đạt

```ts
// Ví dụ: Trước khi xóa, nếu phát hiện dữ liệu liên quan không thể xóa, cần ngăn chặn luồng chính và các thao tác sau đó
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Tồn tại dữ liệu liên quan, không thể xóa');
  ctx.exitAll();
}
```

### Lựa chọn giữa ctx.exit() và ctx.exitAll()

```ts
// Chỉ luồng sự kiện hiện tại cần thoát → Sử dụng ctx.exit()
if (!params.valid) {
  ctx.message.error('Tham số không hợp lệ');
  ctx.exit();  // Các luồng sự kiện tiếp theo không bị ảnh hưởng
}

// Cần chấm dứt tất cả các luồng sự kiện tiếp theo của sự kiện hiện tại → Sử dụng ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Không đủ quyền hạn' });
  ctx.exitAll();  // Luồng chính và các luồng tiếp theo trong cùng sự kiện đều bị chấm dứt
}
```

### Hiển thị thông báo trước khi chấm dứt

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Vui lòng sửa các lỗi trong biểu mẫu trước');
  ctx.exitAll();
}
```

## Lưu ý

- Sau khi gọi `ctx.exitAll()`, mã JS phía sau sẽ không được thực thi; khuyến nghị nên giải thích lý do cho người dùng thông qua `ctx.message`, `ctx.notification` hoặc hộp thoại xác nhận trước khi gọi.
- Trong mã nghiệp vụ thông thường không cần bắt `FlowExitAllException`, hãy để engine luồng sự kiện tự xử lý.
- Nếu chỉ muốn dừng luồng sự kiện hiện tại mà không ảnh hưởng đến các luồng tiếp theo, hãy sử dụng `ctx.exit()`.
- Trong chế độ song song, `ctx.exitAll()` chỉ chấm dứt luồng sự kiện hiện tại và không làm gián đoạn các luồng sự kiện khác đang chạy đồng thời.

## Liên quan

- [ctx.exit()](./exit.md): Chỉ chấm dứt luồng sự kiện hiện tại
- [ctx.message](./message.md): Thông báo tin nhắn
- [ctx.modal](./modal.md): Hộp thoại xác nhận