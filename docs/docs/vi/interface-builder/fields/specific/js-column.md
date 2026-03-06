:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Giới thiệu

JS Column được sử dụng cho "cột tùy chỉnh" trong bảng, thông qua JavaScript để hiển thị nội dung ô của mỗi hàng. Không liên kết với trường cụ thể, phù hợp cho các kịch bản như cột phái sinh, hiển thị kết hợp liên trường, huy hiệu trạng thái, thao tác nút, tổng hợp dữ liệu từ xa, v.v.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API Ngữ cảnh Thời gian Chạy

Khi mỗi ô của JS Column hiển thị, có thể sử dụng các khả năng ngữ cảnh sau:

- `ctx.element`: Bộ chứa DOM của ô hiện tại (ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.record`: Đối tượng bản ghi hàng hiện tại (chỉ đọc);
- `ctx.recordIndex`: Chỉ mục hàng trong trang hiện tại (bắt đầu từ 0, có thể bị ảnh hưởng bởi phân trang);
- `ctx.collection`: Thông tin siêu dữ liệu của bộ sưu tập liên kết với bảng (chỉ đọc);
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL;
- `ctx.importAsync(url)`: Nhập động mô-đun ESM theo URL;
- `ctx.openView(options)`: Mở chế độ xem đã cấu hình (cửa sổ bật lên/ngăn kéo/trang);
- `ctx.i18n.t()` / `ctx.t()`: Quốc tế hóa;
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi bộ chứa sẵn sàng;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện phổ biến tích hợp sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho hiển thị JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị phần tử React/HTML/DOM vào bộ chứa mặc định `ctx.element` (ô hiện tại), việc hiển thị nhiều lần sẽ tái sử dụng Root và ghi đè nội dung hiện có của bộ chứa.

## Trình chỉnh sửa và Đoạn mã

Trình chỉnh sửa tập lệnh của JS Column hỗ trợ tô sáng cú pháp, gợi ý lỗi và các đoạn mã tích hợp sẵn (Snippets).

- `Snippets`: Mở danh sách đoạn mã tích hợp sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã hiện tại, nhật ký chạy được xuất ra bảng `Logs` ở phía dưới, hỗ trợ `console.log/info/warn/error` và định vị tô sáng lỗi.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Có thể kết hợp với Nhân viên AI để tạo mã:

- [Nhân viên AI · Nathan: Kỹ sư Frontend](/ai-employees/features/built-in-employee)

## Cách sử dụng phổ biến

### 1) Hiển thị cơ bản (Đọc bản ghi hàng hiện tại)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Sử dụng JSX để hiển thị thành phần React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Mở cửa sổ bật lên/ngăn kéo trong ô (Xem/Chỉnh sửa)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Xem</a>
);
```

### 4) Tải thư viện bên thứ ba (AMD/UMD hoặc ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Lưu ý

- Nên sử dụng CDN đáng tin cậy để tải thư viện bên ngoài và chuẩn bị phương án dự phòng cho các trường hợp thất bại (ví dụ: `if (!lib) return;`).
- Khuyến nghị ưu tiên sử dụng bộ chọn `class` hoặc `[name=...]`, tránh sử dụng `id` cố định để ngăn chặn việc lặp lại `id` trong nhiều khối/cửa sổ bật lên.
- Dọn dẹp sự kiện: Các hàng trong bảng có thể thay đổi động theo phân trang/làm mới, các ô sẽ được hiển thị nhiều lần. Nên dọn dẹp hoặc loại bỏ trùng lặp trước khi liên kết sự kiện để tránh kích hoạt lặp lại.
- Gợi ý hiệu suất: Tránh tải lặp lại các thư viện lớn trong mỗi ô; nên lưu thư viện vào bộ nhớ đệm ở lớp trên (ví dụ: thông qua biến toàn cục hoặc biến cấp bảng) sau đó tái sử dụng.