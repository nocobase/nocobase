---
title: "JSItem mục JS"
description: "JSItem mục JS: nhúng logic tùy chỉnh trong mục Sub-Table, hỗ trợ React, ctx, truy cập dữ liệu hàng."
keywords: "JSItem,mục JS,Sub-Table,logic tùy chỉnh,Interface Builder,NocoBase"
---

# JS Item

## Giới thiệu

JS Item được dùng cho "mục tùy chỉnh" (không gắn Field) trong Form. Bạn có thể dùng JavaScript/JSX để render nội dung bất kỳ (gợi ý, thống kê, xem trước, nút bấm, v.v.), và tương tác với ngữ cảnh Form, bản ghi, phù hợp với các trường hợp như xem trước thời gian thực, gợi ý hướng dẫn, component tương tác nhỏ, v.v.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API ngữ cảnh runtime (thường dùng)

- `ctx.element`: Container DOM của mục hiện tại (ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.form`: Instance AntD Form, có thể `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, v.v.;
- `ctx.blockModel`: Model của Block Form chứa nó, có thể lắng nghe `formValuesChange` để thực hiện liên kết;
- `ctx.record` / `ctx.collection`: Bản ghi hiện tại và thông tin meta collection (có sẵn trong một số trường hợp);
- `ctx.requireAsync(url)`: Tải bất đồng bộ thư viện AMD/UMD theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.openView(viewUid, options)`: Mở view đã được cấu hình (Drawer/hộp thoại/Trang);
- `ctx.message` / `ctx.notification`: Gợi ý và thông báo toàn cục;
- `ctx.t()` / `ctx.i18n.t()`: Quốc tế hóa;
- `ctx.onRefReady(ctx.ref, cb)`: Render sau khi container sẵn sàng;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện thông dụng có sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho render JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Render React element/HTML/DOM vào container mặc định `ctx.element`; render lặp lại sẽ tái sử dụng Root, và ghi đè nội dung hiện có của container.

## Trình chỉnh sửa và Snippets

- `Snippets`: Mở danh sách snippets có sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp.
- `Run`: Chạy trực tiếp mã hiện tại, và xuất log chạy ra panel `Logs` ở dưới; hỗ trợ `console.log/info/warn/error` và định vị tô sáng lỗi.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Có thể kết hợp với AI Employee để tạo/chỉnh sửa script: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Cách sử dụng phổ biến (ví dụ ngắn gọn)

### 1) Xem trước thời gian thực (đọc giá trị Form)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Mở view (Drawer)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Tải thư viện bên ngoài và render

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Lưu ý

- Nên sử dụng CDN đáng tin cậy khi tải thư viện bên ngoài, và xử lý fallback cho các trường hợp thất bại (ví dụ `if (!lib) return;`).
- Selector nên ưu tiên sử dụng `class` hoặc `[name=...]`, tránh sử dụng `id` cố định, để ngăn chặn `id` trùng lặp trong nhiều Block/Popup.
- Dọn dẹp sự kiện: Giá trị Form thay đổi thường xuyên sẽ kích hoạt nhiều lần render, trước khi gắn sự kiện nên dọn dẹp hoặc loại bỏ trùng lặp (như `remove` trước rồi `add`, hoặc `{ once: true }`, hoặc đánh dấu `dataset` để chống trùng lặp).

## Tài liệu liên quan

- [Biến và ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [View và Popup](/interface-builder/actions/types/view)
