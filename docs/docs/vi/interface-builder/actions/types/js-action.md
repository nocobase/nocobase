:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# JS Action

## Giới thiệu

JS Action cho phép thực thi JavaScript khi nhấn nút, từ đó tùy chỉnh mọi hành vi nghiệp vụ. Bạn có thể sử dụng JS Action tại các vị trí như thanh công cụ biểu mẫu, thanh công cụ bảng (cấp độ bộ sưu tập), hàng của bảng (cấp độ bản ghi), nhằm thực hiện các thao tác như xác thực, hiển thị thông báo, gọi API, mở cửa sổ bật lên/ngăn kéo, hoặc làm mới dữ liệu.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API Ngữ cảnh Thời gian chạy (Thường dùng)

- `ctx.api.request(options)`: Gửi yêu cầu HTTP;
- `ctx.openView(viewUid, options)`: Mở một chế độ xem đã cấu hình (ngăn kéo/hộp thoại/trang);
- `ctx.message` / `ctx.notification`: Các thông báo và cảnh báo toàn cục;
- `ctx.t()` / `ctx.i18n.t()`: Hỗ trợ đa ngôn ngữ (Internationalization);
- `ctx.resource`: Tài nguyên dữ liệu trong ngữ cảnh cấp độ bộ sưu tập (ví dụ: thanh công cụ bảng, bao gồm `getSelectedRows()`, `refresh()`, v.v.);
- `ctx.record`: Bản ghi hàng hiện tại trong ngữ cảnh cấp độ bản ghi (ví dụ: nút trên hàng của bảng);
- `ctx.form`: Thể hiện AntD Form trong ngữ cảnh cấp độ biểu mẫu (ví dụ: nút trên thanh công cụ biểu mẫu);
- `ctx.collection`: Thông tin meta của bộ sưu tập hiện tại;
- Trình chỉnh sửa mã hỗ trợ các đoạn mã `Snippets` và `Run` để chạy thử (xem bên dưới).

- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL;
- `ctx.importAsync(url)`: Nhập module ESM động theo URL;

> Các biến thực tế có thể sử dụng sẽ khác nhau tùy thuộc vào vị trí của nút. Danh sách trên là tổng quan về các khả năng thường dùng.

## Trình chỉnh sửa và Đoạn mã

- `Snippets`: Mở danh sách các đoạn mã tích hợp, bạn có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại chỉ với một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã hiện tại và xuất nhật ký chạy ra bảng `Logs` ở phía dưới; hỗ trợ `console.log/info/warn/error` và làm nổi bật vị trí lỗi.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Bạn có thể kết hợp với nhân viên AI để tạo/sửa đổi script: [Nhân viên AI · Nathan: Kỹ sư Frontend](/ai-employees/built-in/ai-coding)

## Cách sử dụng phổ biến (Ví dụ đơn giản)

### 1) Yêu cầu API và Thông báo

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Yêu cầu đã hoàn tất'));
console.log(ctx.t('Dữ liệu phản hồi:'), resp?.data);
```

### 2) Nút bộ sưu tập: Xác thực lựa chọn và xử lý

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Vui lòng chọn bản ghi'));
  return;
}
// TODO: Thực hiện logic nghiệp vụ…
ctx.message.success(ctx.t('Đã chọn {n} mục', { n: rows.length }));
```

### 3) Nút bản ghi: Đọc bản ghi hàng hiện tại

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('Không có bản ghi'));
} else {
  ctx.message.success(ctx.t('ID bản ghi: {id}', { id: ctx.record.id }))
}
```

### 4) Mở chế độ xem (Ngăn kéo/Hộp thoại)

```js
const popupUid = ctx.model.uid + '-open'; // Gắn vào nút hiện tại để duy trì ổn định
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Chi tiết'), size: 'large' });
```

### 5) Làm mới dữ liệu sau khi gửi

```js
// Làm mới chung: Ưu tiên tài nguyên bảng/danh sách, sau đó là tài nguyên của khối chứa biểu mẫu
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Lưu ý

- **Tính bất biến của hành động**: Để tránh việc gửi nhiều lần do nhấp chuột lặp lại, bạn có thể thêm cờ trạng thái hoặc vô hiệu hóa nút trong logic của mình.
- **Xử lý lỗi**: Thêm khối `try/catch` cho các cuộc gọi API và cung cấp thông báo thân thiện cho người dùng.
- **Liên kết chế độ xem**: Khi mở cửa sổ bật lên/ngăn kéo bằng `ctx.openView`, nên truyền tham số một cách rõ ràng và, nếu cần, chủ động làm mới tài nguyên cha sau khi gửi thành công.

## Tài liệu liên quan

- [Biến và Ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [Chế độ xem và Cửa sổ bật lên](/interface-builder/actions/types/view)