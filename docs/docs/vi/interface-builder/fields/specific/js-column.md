:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cột JS

## Giới thiệu

Cột JS được dùng cho các "cột tùy chỉnh" trong bảng, hiển thị nội dung ô của mỗi hàng bằng JavaScript. Cột này không liên kết với một trường cụ thể nào, phù hợp cho các tình huống như cột dẫn xuất, hiển thị kết hợp nhiều trường, huy hiệu trạng thái, nút hành động và tổng hợp dữ liệu từ xa.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API Ngữ cảnh Thời gian Chạy

Khi hiển thị mỗi ô, Cột JS cung cấp các API ngữ cảnh sau:

- `ctx.element`: Bộ chứa DOM của ô hiện tại (ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.
- `ctx.record`: Đối tượng bản ghi của hàng hiện tại (chỉ đọc).
- `ctx.recordIndex`: Chỉ mục hàng trong trang hiện tại (bắt đầu từ 0, có thể bị ảnh hưởng bởi phân trang).
- `ctx.collection`: Siêu dữ liệu của **bộ sưu tập** được liên kết với bảng (chỉ đọc).
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL.
- `ctx.importAsync(url)`: Nhập mô-đun ESM động theo URL.
- `ctx.openView(options)`: Mở một chế độ xem đã cấu hình (modal/drawer/trang).
- `ctx.i18n.t()` / `ctx.t()`: Quốc tế hóa.
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi bộ chứa sẵn sàng.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Các thư viện tích hợp sẵn như React, ReactDOM, Ant Design, biểu tượng Ant Design và dayjs, dùng cho hiển thị JSX và xử lý thời gian. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị phần tử React/HTML/DOM vào bộ chứa mặc định `ctx.element` (ô hiện tại). Nhiều lần hiển thị sẽ tái sử dụng Root và ghi đè nội dung hiện có của bộ chứa.

## Trình chỉnh sửa và Đoạn mã

Trình chỉnh sửa script của Cột JS hỗ trợ tô sáng cú pháp, gợi ý lỗi và các đoạn mã tích hợp sẵn (Snippets).

- `Snippets`: Mở danh sách các đoạn mã tích hợp sẵn, cho phép bạn tìm kiếm và chèn chúng vào vị trí con trỏ hiện tại chỉ với một cú nhấp.
- `Run`: Chạy trực tiếp mã hiện tại. Nhật ký thực thi sẽ được xuất ra bảng `Logs` ở phía dưới, hỗ trợ `console.log/info/warn/error` và tô sáng lỗi.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Bạn cũng có thể sử dụng Trợ lý AI để tạo mã:

- [Trợ lý AI · Nathan: Kỹ sư Frontend](/ai-employees/built-in/ai-coding)

## Cách sử dụng phổ biến

### 1) Hiển thị cơ bản (Đọc bản ghi hàng hiện tại)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Sử dụng JSX để hiển thị các thành phần React

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

### 3) Mở Modal/Drawer từ ô (Xem/Chỉnh sửa)

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

- Nên sử dụng CDN đáng tin cậy để tải các thư viện bên ngoài và chuẩn bị phương án dự phòng cho các trường hợp lỗi (ví dụ: `if (!lib) return;`).
- Nên ưu tiên sử dụng bộ chọn `class` hoặc `[name=...]` thay vì `id` cố định để tránh trùng lặp `id` trong nhiều khối hoặc modal.
- Dọn dẹp sự kiện: Các hàng trong bảng có thể thay đổi động theo phân trang/làm mới, khiến các ô được hiển thị nhiều lần. Bạn nên dọn dẹp hoặc loại bỏ các trình lắng nghe sự kiện trùng lặp trước khi liên kết chúng để tránh kích hoạt nhiều lần.
- Mẹo hiệu suất: Tránh tải lặp lại các thư viện lớn trong mỗi ô. Thay vào đó, hãy lưu trữ thư viện vào bộ nhớ đệm ở cấp cao hơn (ví dụ: sử dụng biến toàn cục hoặc biến cấp bảng) và tái sử dụng.