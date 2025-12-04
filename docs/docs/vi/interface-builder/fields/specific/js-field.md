:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# JS Field

## Giới thiệu

JS Field được dùng để tùy chỉnh hiển thị nội dung tại vị trí trường bằng JavaScript. Nó thường được sử dụng trong các khối chi tiết, các mục chỉ đọc của biểu mẫu, hoặc dưới dạng "Mục tùy chỉnh khác" trong các cột bảng. JS Field phù hợp để hiển thị cá nhân hóa, kết hợp thông tin phái sinh, hiển thị huy hiệu trạng thái, văn bản đa dạng thức hoặc biểu đồ.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Loại

- **Chỉ đọc**: Dùng để hiển thị không thể chỉnh sửa, đọc `ctx.value` để hiển thị đầu ra.
- **Có thể chỉnh sửa**: Dùng cho các tương tác nhập liệu tùy chỉnh. Nó cung cấp `ctx.getValue()`/`ctx.setValue(v)` và sự kiện vùng chứa `js-field:value-change` để tạo điều kiện đồng bộ hai chiều với các giá trị biểu mẫu.

## Trường hợp sử dụng

- **Chỉ đọc**
  - **Khối chi tiết**: Hiển thị nội dung chỉ đọc như kết quả tính toán, huy hiệu trạng thái, đoạn văn bản đa dạng thức, biểu đồ, v.v.
  - **Khối bảng**: Được sử dụng làm "Cột tùy chỉnh khác > JS Field" để hiển thị chỉ đọc (nếu bạn cần một cột không liên kết với trường, vui lòng sử dụng JS Column).

- **Có thể chỉnh sửa**
  - **Khối biểu mẫu (CreateForm/EditForm)**: Dùng cho các điều khiển nhập liệu tùy chỉnh hoặc nhập liệu tổng hợp, được xác thực và gửi cùng với biểu mẫu.
  - **Phù hợp cho các trường hợp**: Các thành phần nhập liệu từ thư viện bên ngoài, trình chỉnh sửa văn bản đa dạng thức/mã, các thành phần động phức tạp, v.v.

## API ngữ cảnh thời gian chạy

Mã thời gian chạy của JS Field có thể trực tiếp sử dụng các khả năng ngữ cảnh sau:

- `ctx.element`: Vùng chứa DOM của trường (ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.
- `ctx.value`: Giá trị trường hiện tại (chỉ đọc).
- `ctx.record`: Đối tượng bản ghi hiện tại (chỉ đọc).
- `ctx.collection`: Siêu dữ liệu của bộ sưu tập mà trường thuộc về (chỉ đọc).
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD không đồng bộ theo URL.
- `ctx.importAsync(url)`: Nhập mô-đun ESM động theo URL.
- `ctx.openView(options)`: Mở một chế độ xem đã cấu hình (cửa sổ bật lên/ngăn kéo/trang).
- `ctx.i18n.t()` / `ctx.t()`: Quốc tế hóa.
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi vùng chứa sẵn sàng.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Các thư viện chung tích hợp sẵn như React, ReactDOM, Ant Design, biểu tượng Ant Design và dayjs, dùng để hiển thị JSX và xử lý thời gian. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị một phần tử React, chuỗi HTML hoặc nút DOM vào vùng chứa mặc định `ctx.element`; việc hiển thị lặp lại sẽ tái sử dụng Root và ghi đè nội dung hiện có của vùng chứa.

Đặc trưng của loại có thể chỉnh sửa (JSEditableField):

- `ctx.getValue()`: Lấy giá trị biểu mẫu hiện tại (ưu tiên trạng thái biểu mẫu, sau đó quay lại các thuộc tính trường).
- `ctx.setValue(v)`: Đặt giá trị biểu mẫu và các thuộc tính trường, duy trì đồng bộ hai chiều.
- Sự kiện vùng chứa `js-field:value-change`: Được kích hoạt khi giá trị bên ngoài thay đổi, giúp script dễ dàng cập nhật hiển thị nhập liệu.

## Trình chỉnh sửa và Đoạn mã

Trình chỉnh sửa script của JS Field hỗ trợ tô sáng cú pháp, gợi ý lỗi và các đoạn mã tích hợp sẵn (Snippets).

- `Snippets`: Mở danh sách các đoạn mã tích hợp sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại chỉ với một cú nhấp chuột.
- `Run`: Trực tiếp thực thi mã hiện tại. Nhật ký thực thi được xuất ra bảng `Logs` ở phía dưới, hỗ trợ `console.log/info/warn/error` và tô sáng lỗi để dễ dàng định vị.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Bạn cũng có thể tạo mã với AI Employee:

- [AI Employee · Nathan: Kỹ sư Frontend](/ai-employees/built-in/ai-coding)

## Cách sử dụng phổ biến

### 1) Hiển thị cơ bản (Đọc giá trị trường)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Sử dụng JSX để hiển thị một thành phần React

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

### 4) Nhấp để mở cửa sổ bật lên/ngăn kéo (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Xem chi tiết</a>`;
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

### 5) Nhập liệu có thể chỉnh sửa (JSEditableFieldModel)

```js
// Hiển thị một input đơn giản bằng JSX và đồng bộ giá trị biểu mẫu
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

// Đồng bộ input khi giá trị bên ngoài thay đổi (tùy chọn)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Lưu ý

- Nên sử dụng CDN đáng tin cậy để tải các thư viện bên ngoài và chuẩn bị phương án dự phòng cho các trường hợp thất bại (ví dụ: `if (!lib) return;`).
- Nên ưu tiên sử dụng `class` hoặc `[name=...]` cho các bộ chọn và tránh sử dụng `id` cố định để ngăn chặn trùng lặp `id` trong nhiều khối hoặc cửa sổ bật lên.
- Dọn dẹp sự kiện: Một trường có thể được hiển thị lại nhiều lần do thay đổi dữ liệu hoặc chuyển đổi chế độ xem. Trước khi liên kết một sự kiện, bạn nên dọn dẹp hoặc loại bỏ trùng lặp để tránh kích hoạt lặp lại. Có thể "xóa trước rồi thêm sau".