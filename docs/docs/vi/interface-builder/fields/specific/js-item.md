:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# JS Item

## Giới thiệu

JS Item được dùng cho các "mục tùy chỉnh" (không liên kết với trường dữ liệu) trong biểu mẫu. Bạn có thể sử dụng JavaScript/JSX để hiển thị bất kỳ nội dung nào (như gợi ý, thống kê, xem trước, nút bấm, v.v.) và tương tác với biểu mẫu cũng như ngữ cảnh bản ghi. Nó phù hợp cho các trường hợp như xem trước theo thời gian thực, hướng dẫn, và các thành phần tương tác nhỏ.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API Ngữ cảnh Thời gian chạy (Thường dùng)

- `ctx.element`: Bộ chứa DOM (ElementProxy) của mục hiện tại, hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.
- `ctx.form`: Thể hiện AntD Form, cho phép các thao tác như `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, v.v.
- `ctx.blockModel`: Mô hình của khối biểu mẫu chứa nó, có thể lắng nghe sự kiện `formValuesChange` để thực hiện liên kết.
- `ctx.record` / `ctx.collection`: Bản ghi hiện tại và siêu thông tin của **bộ sưu tập** (có sẵn trong một số trường hợp).
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL.
- `ctx.importAsync(url)`: Nhập module ESM động theo URL.
- `ctx.openView(viewUid, options)`: Mở một chế độ xem đã cấu hình (ngăn kéo/hộp thoại/trang).
- `ctx.message` / `ctx.notification`: Thông báo và cảnh báo toàn cục.
- `ctx.t()` / `ctx.i18n.t()`: Hỗ trợ đa ngôn ngữ (Internationalization).
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi bộ chứa sẵn sàng.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Các thư viện chung tích hợp sẵn như React, ReactDOM, Ant Design, biểu tượng Ant Design và dayjs, được dùng để hiển thị JSX và xử lý thời gian. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị phần tử React/HTML/DOM vào bộ chứa mặc định `ctx.element`. Nhiều lần hiển thị sẽ tái sử dụng Root và ghi đè nội dung hiện có của bộ chứa.

## Trình chỉnh sửa và Đoạn mã

- `Snippets`: Mở danh sách các đoạn mã tích hợp sẵn, cho phép bạn tìm kiếm và chèn vào vị trí con trỏ hiện tại chỉ với một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã hiện tại và xuất nhật ký thực thi ra bảng `Logs` ở phía dưới. Nó hỗ trợ `console.log/info/warn/error` và làm nổi bật vị trí lỗi.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Có thể kết hợp với Nhân viên AI để tạo/chỉnh sửa script: [Nhân viên AI · Nathan: Kỹ sư Frontend](/ai-employees/built-in/ai-coding)

## Các trường hợp sử dụng phổ biến (Ví dụ đơn giản)

### 1) Xem trước theo thời gian thực (Đọc giá trị biểu mẫu)

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

### 2) Mở một chế độ xem (Ngăn kéo)

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

### 3) Tải và hiển thị thư viện bên ngoài

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Lưu ý

- Nên sử dụng CDN đáng tin cậy để tải các thư viện bên ngoài và chuẩn bị phương án dự phòng cho các trường hợp thất bại (ví dụ: `if (!lib) return;`).
- Nên ưu tiên sử dụng `class` hoặc `[name=...]` cho các bộ chọn và tránh sử dụng `id` cố định để ngăn chặn trùng lặp `id` trong nhiều khối/cửa sổ bật lên.
- Dọn dẹp sự kiện: Giá trị biểu mẫu thay đổi thường xuyên sẽ kích hoạt nhiều lần hiển thị. Trước khi liên kết sự kiện, bạn nên dọn dẹp hoặc loại bỏ trùng lặp (ví dụ: `remove` trước khi `add`, hoặc sử dụng `{ once: true }`, hoặc đánh dấu bằng `dataset` để tránh trùng lặp).

## Tài liệu liên quan

- [Biến và Ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [Chế độ xem và Cửa sổ bật lên](/interface-builder/actions/types/view)