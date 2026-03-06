:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Giới thiệu

JS Item được sử dụng cho "mục tùy chỉnh" trong biểu mẫu (không ràng buộc trường). Bạn có thể sử dụng JavaScript/JSX để hiển thị bất kỳ nội dung nào (gợi ý, thống kê, xem trước, nút bấm, v.v.) và tương tác với biểu mẫu, ngữ cảnh bản ghi, phù hợp cho các kịch bản như xem trước thời gian thực, thông báo hướng dẫn, các thành phần tương tác nhỏ, v.v.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API Ngữ cảnh Thời gian chạy (Thường dùng)

- `ctx.element`: Container DOM (ElementProxy) của mục hiện tại, hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.form`: Instance AntD Form, có thể `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, v.v.;
- `ctx.blockModel`: Model của khối biểu mẫu hiện tại, có thể lắng nghe `formValuesChange` để thực hiện liên kết;
- `ctx.record` / `ctx.collection`: Bản ghi hiện tại và thông tin meta của **bộ sưu tập** (có sẵn trong một số kịch bản);
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.openView(viewUid, options)`: Mở chế độ xem đã cấu hình (ngăn kéo/hộp thoại/trang);
- `ctx.message` / `ctx.notification`: Gợi ý và thông báo toàn cục;
- `ctx.t()` / `ctx.i18n.t()`: Quốc tế hóa;
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi container đã sẵn sàng;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện phổ biến tích hợp sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho hiển thị JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị phần tử React/HTML/DOM vào container mặc định `ctx.element`; việc hiển thị nhiều lần sẽ tái sử dụng Root và ghi đè nội dung hiện có của container.

## Trình chỉnh sửa và Đoạn mã

- `Snippets`: Mở danh sách đoạn mã tích hợp sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã hiện tại và xuất nhật ký chạy ra bảng `Logs` ở phía dưới; hỗ trợ `console.log/info/warn/error` và định vị lỗi được làm nổi bật.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Có thể kết hợp với Nhân viên AI để tạo/chỉnh sửa script: [Nhân viên AI · Nathan: Kỹ sư Frontend](/ai-employees/features/built-in-employee)

## Cách dùng phổ biến (Ví dụ tinh gọn)

### 1) Xem trước thời gian thực (Đọc giá trị biểu mẫu)

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

### 2) Mở chế độ xem (Ngăn kéo)

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

### 3) Tải thư viện bên ngoài và hiển thị

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Lưu ý

- Việc tải thư viện bên ngoài nên sử dụng CDN đáng tin cậy, cần chuẩn bị phương án dự phòng cho kịch bản thất bại (ví dụ: `if (!lib) return;`).
- Bộ chọn nên ưu tiên sử dụng `class` hoặc `[name=...]`, tránh sử dụng `id` cố định để ngăn chặn trùng lặp `id` trong nhiều khối/cửa sổ bật lên.
- Dọn dẹp sự kiện: Thay đổi giá trị biểu mẫu thường xuyên sẽ kích hoạt hiển thị nhiều lần, nên dọn dẹp hoặc loại bỏ trùng lặp trước khi ràng buộc sự kiện (ví dụ: `remove` trước rồi mới `add`, hoặc `{ once: true }`, hoặc sử dụng `dataset` để đánh dấu chống trùng lặp).

## Tài liệu liên quan

- [Biến và Ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [Chế độ xem và Cửa sổ bật lên](/interface-builder/actions/types/view)