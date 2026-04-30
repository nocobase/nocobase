---
title: "JSField Field JS"
description: "JSField Field JS: nhúng logic JavaScript tùy chỉnh trong Field Form, hỗ trợ React, ngữ cảnh ctx."
keywords: "JSField,Field JS,Field tùy chỉnh,JavaScript,Interface Builder,NocoBase"
---

# JS Field

## Giới thiệu

JS Field được dùng để render nội dung tùy chỉnh bằng JavaScript ở vị trí Field, thường gặp trong Block Chi tiết, mục chỉ đọc của Form, hoặc "mục tùy chỉnh khác" trong cột Table. Phù hợp để hiển thị cá nhân hóa, tổ hợp thông tin phái sinh, huy hiệu trạng thái, render văn bản phong phú hoặc biểu đồ, v.v.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Loại

- Loại chỉ đọc: Dùng để hiển thị không thể chỉnh sửa, đọc `ctx.value` để render output.
- Loại có thể chỉnh sửa: Dùng cho tương tác nhập tùy chỉnh, cung cấp `ctx.getValue()`/`ctx.setValue(v)` và sự kiện container `js-field:value-change`, thuận tiện đồng bộ hai chiều với giá trị Form.

## Trường hợp sử dụng

- Loại chỉ đọc
  - Block Chi tiết: Hiển thị kết quả tính toán, huy hiệu trạng thái, đoạn văn bản phong phú, biểu đồ, v.v. dạng chỉ đọc;
  - Block Table: Làm "cột tùy chỉnh khác > JS Field" để hiển thị chỉ đọc (nếu cần cột không gắn với Field, vui lòng dùng JS Column);

- Loại có thể chỉnh sửa
  - Block Form (CreateForm/EditForm): Dùng cho điều khiển nhập tùy chỉnh hoặc nhập tổ hợp, theo xác thực và gửi của Form;
  - Trường hợp phù hợp: Component nhập của thư viện bên ngoài, trình chỉnh sửa văn bản phong phú/mã, component động phức tạp, v.v.;

## API ngữ cảnh runtime

Mã runtime của JS Field có thể trực tiếp sử dụng các khả năng ngữ cảnh sau:

- `ctx.element`: Container DOM của Field (ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.value`: Giá trị Field hiện tại (chỉ đọc);
- `ctx.record`: Đối tượng bản ghi hiện tại (chỉ đọc);
- `ctx.collection`: Thông tin meta của collection mà Field thuộc về (chỉ đọc);
- `ctx.requireAsync(url)`: Tải bất đồng bộ thư viện AMD/UMD theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.openView(options)`: Mở view đã được cấu hình (Popup/Drawer/Trang);
- `ctx.i18n.t()` / `ctx.t()`: Quốc tế hóa;
- `ctx.onRefReady(ctx.ref, cb)`: Render sau khi container sẵn sàng;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện thông dụng có sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho render JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Render React element, chuỗi HTML hoặc node DOM vào container mặc định `ctx.element`; render lặp lại sẽ tái sử dụng Root, và ghi đè nội dung hiện có của container.

Đặc trưng cho loại có thể chỉnh sửa (JSEditableField):

- `ctx.getValue()`: Lấy giá trị Form hiện tại (ưu tiên sử dụng trạng thái Form, sau đó fallback về props của Field).
- `ctx.setValue(v)`: Cài đặt giá trị Form và props của Field, duy trì đồng bộ hai chiều.
- Sự kiện container `js-field:value-change`: Kích hoạt khi giá trị bên ngoài thay đổi, thuận tiện cho script cập nhật hiển thị nhập.

## Trình chỉnh sửa và Snippets

Trình chỉnh sửa script của JS Field hỗ trợ tô sáng cú pháp, gợi ý lỗi và snippets có sẵn.

- `Snippets`: Mở danh sách snippets có sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp.
- `Run`: Chạy trực tiếp mã hiện tại, log chạy được xuất ra panel `Logs` ở dưới, hỗ trợ `console.log/info/warn/error` và định vị tô sáng lỗi.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Có thể kết hợp với AI Employee để tạo mã:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Cách sử dụng phổ biến

### 1) Render cơ bản (đọc giá trị Field)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Sử dụng JSX để render component React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Tải thư viện bên thứ ba (AMD/UMD hoặc ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Nhấp để mở Popup/Drawer (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Xem Chi tiết</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Nhập có thể chỉnh sửa (JSEditableFieldModel)

```js
// Render một input đơn giản bằng JSX và đồng bộ giá trị Form
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Đồng bộ về input khi giá trị bên ngoài thay đổi (tùy chọn)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Lưu ý

- Nên sử dụng CDN đáng tin cậy khi tải thư viện bên ngoài, và xử lý fallback cho các trường hợp thất bại (ví dụ `if (!lib) return;`).
- Selector nên ưu tiên sử dụng `class` hoặc `[name=...]`, tránh sử dụng `id` cố định, để ngăn chặn `id` trùng lặp trong nhiều Block/Popup.
- Dọn dẹp sự kiện: Field có thể được render lại nhiều lần do thay đổi dữ liệu hoặc chuyển view, trước khi gắn sự kiện nên dọn dẹp hoặc loại bỏ trùng lặp, để tránh kích hoạt trùng lặp. Có thể "remove trước rồi add".
