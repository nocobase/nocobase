:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/actions/types/js-action).
:::

# JS Action

## Giới thiệu

JS Action được sử dụng để thực thi JavaScript khi nhấp vào nút, tùy chỉnh mọi hành vi nghiệp vụ. Có thể được sử dụng tại các vị trí như thanh công cụ biểu mẫu, thanh công cụ bảng (cấp độ bộ sưu tập), hàng của bảng (cấp độ bản ghi), v.v., để thực hiện các thao tác như xác thực, thông báo, gọi API, mở cửa sổ bật lên/ngăn kéo, làm mới dữ liệu, v.v.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API Ngữ cảnh Thời gian chạy (Thường dùng)

- `ctx.api.request(options)`: Gửi yêu cầu HTTP;
- `ctx.openView(viewUid, options)`: Mở chế độ xem đã cấu hình (ngăn kéo/hộp thoại/trang);
- `ctx.message` / `ctx.notification`: Thông báo và cảnh báo toàn cục;
- `ctx.t()` / `ctx.i18n.t()`: Quốc tế hóa;
- `ctx.resource`: Tài nguyên dữ liệu của ngữ cảnh cấp độ bộ sưu tập (như thanh công cụ bảng, bao gồm `getSelectedRows()`, `refresh()`, v.v.);
- `ctx.record`: Bản ghi hàng hiện tại của ngữ cảnh cấp độ bản ghi (như nút hàng của bảng);
- `ctx.form`: Thực thể AntD Form của ngữ cảnh cấp độ biểu mẫu (như nút thanh công cụ biểu mẫu);
- `ctx.collection`: Thông tin siêu dữ liệu của bộ sưu tập hiện tại;
- Trình chỉnh sửa mã hỗ trợ các đoạn mã `Snippets` và chạy thử `Run` (xem bên dưới).


- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL;
- `ctx.importAsync(url)`: Nhập động module ESM theo URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện phổ biến tích hợp sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, được sử dụng để render JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học.

> Các biến thực tế có sẵn sẽ khác nhau tùy thuộc vào vị trí của nút, trên đây là tổng quan về các khả năng phổ biến.

## Trình chỉnh sửa và Đoạn mã

- `Snippets`: Mở danh sách các đoạn mã tích hợp sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã hiện tại và xuất nhật ký chạy ra bảng `Logs` ở phía dưới; hỗ trợ `console.log/info/warn/error` và định vị lỗi được làm nổi bật.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Có thể kết hợp với nhân viên AI để tạo/sửa đổi script: [Nhân viên AI · Nathan: Kỹ sư Frontend](/ai-employees/features/built-in-employee)

## Cách dùng phổ biến (Ví dụ tinh gọn)

### 1) Yêu cầu API và thông báo

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Nút bộ sưu tập: Xác thực lựa chọn và xử lý

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Thực hiện logic nghiệp vụ…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Nút bản ghi: Đọc bản ghi hàng hiện tại

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Mở chế độ xem (Ngăn kéo/Hộp thoại)

```js
const popupUid = ctx.model.uid + '-open'; // Gắn vào nút hiện tại để duy trì ổn định
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Làm mới dữ liệu sau khi gửi

```js
// Làm mới chung: Ưu tiên tài nguyên bảng/danh sách, sau đó là tài nguyên của khối chứa biểu mẫu
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Lưu ý

- Tính lũy đẳng của hành vi: Tránh việc gửi nhiều lần do nhấp chuột lặp lại, có thể thêm công tắc trạng thái hoặc vô hiệu hóa nút trong logic.
- Xử lý lỗi: Thêm try/catch cho các cuộc gọi API và đưa ra thông báo cho người dùng.
- Liên kết chế độ xem: Khi mở cửa sổ bật lên/ngăn kéo thông qua `ctx.openView`, nên truyền tham số một cách rõ ràng, nếu cần thiết hãy chủ động làm mới tài nguyên cha sau khi gửi thành công.

## Tài liệu liên quan

- [Biến và Ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [Chế độ xem và Cửa sổ bật lên](/interface-builder/actions/types/view)