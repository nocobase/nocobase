---
title: "JSAction Action JS"
description: "JSAction Action JS: nút Action tùy chỉnh, thực thi logic JavaScript, hỗ trợ liên kết ctx, Form, Block."
keywords: "JSAction,Action JS,Action tùy chỉnh,JavaScript,Interface Builder,NocoBase"
---

# JS Action

## Giới thiệu

JS Action được dùng để thực thi JavaScript khi nhấp nút bấm, tùy chỉnh bất kỳ hành vi nghiệp vụ nào. Có thể được dùng ở các vị trí như thanh công cụ Form, thanh công cụ Table (cấp collection), hàng Table (cấp bản ghi), v.v., để thực hiện các Action như xác thực, gợi ý, gọi API, mở Popup/Drawer, làm mới dữ liệu.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API ngữ cảnh runtime (thường dùng)

- `ctx.api.request(options)`: Gửi yêu cầu HTTP;
- `ctx.openView(viewUid, options)`: Mở view đã được cấu hình (Drawer/hộp thoại/Trang);
- `ctx.message` / `ctx.notification`: Gợi ý và thông báo toàn cục;
- `ctx.t()` / `ctx.i18n.t()`: Quốc tế hóa;
- `ctx.resource`: Tài nguyên dữ liệu của ngữ cảnh cấp collection (như thanh công cụ Table, có `getSelectedRows()`, `refresh()`, v.v.);
- `ctx.record`: Bản ghi hàng hiện tại của ngữ cảnh cấp bản ghi (như nút hàng Table);
- `ctx.form`: Instance AntD Form của ngữ cảnh cấp Form (như nút thanh công cụ Form);
- `ctx.collection`: Thông tin meta của collection hiện tại;
- Trình chỉnh sửa mã hỗ trợ snippets `Snippets` và `Run` chạy trước (xem bên dưới).


- `ctx.requireAsync(url)`: Tải bất đồng bộ thư viện AMD/UMD theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện thông dụng có sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho render JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học.

> Các biến thực sự có sẵn sẽ khác nhau tùy thuộc vào vị trí của nút bấm, ở trên là tổng quan về các khả năng thường gặp.

## Trình chỉnh sửa và Snippets

- `Snippets`: Mở danh sách snippets có sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp.
- `Run`: Chạy trực tiếp mã hiện tại, và xuất log chạy ra panel `Logs` ở dưới; hỗ trợ `console.log/info/warn/error` và định vị tô sáng lỗi.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Có thể kết hợp với AI Employee để tạo/chỉnh sửa script: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Cách sử dụng phổ biến (ví dụ ngắn gọn)

### 1) Yêu cầu API và gợi ý

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Nút collection: Xác thực lựa chọn và xử lý

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Thực thi logic nghiệp vụ…
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

### 4) Mở view (Drawer/hộp thoại)

```js
const popupUid = ctx.model.uid + '-open'; // Bind to current button to keep stable
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Làm mới dữ liệu sau khi gửi

```js
// Làm mới chung: ưu tiên tài nguyên Table/danh sách, sau đó tài nguyên Block chứa Form
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Lưu ý

- Hành vi idempotent: Tránh nhiều lần gửi do nhấp lặp lại, có thể thêm switch trạng thái hoặc vô hiệu hóa nút bấm trong logic.
- Xử lý lỗi: Thêm try/catch cho các cuộc gọi API và đưa ra gợi ý người dùng.
- Liên kết view: Khi mở Popup/Drawer thông qua `ctx.openView`, nên truyền tham số rõ ràng, nếu cần làm mới chủ động tài nguyên cha sau khi gửi thành công.

## Tài liệu liên quan

- [Biến và ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [View và Popup](/interface-builder/actions/types/view)
