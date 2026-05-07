---
title: "JSColumn cột Table JS"
description: "JSColumn cột Table JS: nhúng render và logic tùy chỉnh trong cột Table, hỗ trợ React, ctx, dữ liệu hàng."
keywords: "JSColumn,cột Table JS,cột tùy chỉnh,render Table,Interface Builder,NocoBase"
---

# JS Column

## Giới thiệu

JS Column được dùng cho "cột tùy chỉnh" trong Table, render nội dung ô của mỗi hàng thông qua JavaScript. Không liên kết với Field cụ thể, phù hợp với các trường hợp như cột phái sinh, hiển thị tổ hợp đa Field, huy hiệu trạng thái, Action nút bấm, tổng hợp dữ liệu từ xa, v.v.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API ngữ cảnh runtime

Mỗi ô của JS Column khi render có thể sử dụng các khả năng ngữ cảnh sau:

- `ctx.element`: Container DOM của ô hiện tại (ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.record`: Đối tượng bản ghi hàng hiện tại (chỉ đọc);
- `ctx.recordIndex`: Chỉ số hàng trong Trang hiện tại (bắt đầu từ 0, có thể bị ảnh hưởng bởi phân trang);
- `ctx.collection`: Thông tin meta của collection được Table liên kết (chỉ đọc);
- `ctx.requireAsync(url)`: Tải bất đồng bộ thư viện AMD/UMD theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.openView(options)`: Mở view đã được cấu hình (Popup/Drawer/Trang);
- `ctx.i18n.t()` / `ctx.t()`: Quốc tế hóa;
- `ctx.onRefReady(ctx.ref, cb)`: Render sau khi container sẵn sàng;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện thông dụng có sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho render JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Render React element/HTML/DOM vào container mặc định `ctx.element` (ô hiện tại), nhiều lần render sẽ tái sử dụng Root, và ghi đè nội dung hiện có của container.

## Trình chỉnh sửa và Snippets

Trình chỉnh sửa script của JS Column hỗ trợ tô sáng cú pháp, gợi ý lỗi và snippets có sẵn.

- `Snippets`: Mở danh sách snippets có sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp.
- `Run`: Chạy trực tiếp mã hiện tại, log chạy được xuất ra panel `Logs` ở dưới, hỗ trợ `console.log/info/warn/error` và định vị tô sáng lỗi.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Có thể kết hợp với AI Employee để tạo mã:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Cách sử dụng phổ biến

### 1) Render cơ bản (đọc bản ghi hàng hiện tại)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Sử dụng JSX để render component React

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

### 3) Mở Popup/Drawer trong ô (xem/chỉnh sửa)

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

- Nên sử dụng CDN đáng tin cậy khi tải thư viện bên ngoài, và xử lý fallback cho các trường hợp thất bại (ví dụ `if (!lib) return;`).
- Selector nên ưu tiên sử dụng `class` hoặc `[name=...]`, tránh sử dụng `id` cố định, để ngăn chặn `id` trùng lặp trong nhiều Block/Popup.
- Dọn dẹp sự kiện: Hàng Table có thể thay đổi động theo phân trang/làm mới, ô sẽ được render nhiều lần. Trước khi gắn sự kiện nên dọn dẹp hoặc loại bỏ trùng lặp, để tránh kích hoạt trùng lặp.
- Khuyến nghị về hiệu năng: Tránh tải thư viện lớn lặp lại trong mỗi ô; nên cache thư viện ở cấp trên (như thông qua biến toàn cục hoặc biến cấp Table) rồi tái sử dụng.
