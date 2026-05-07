---
title: "JSItem mục JS"
description: "JSItem mục JS: render mục Action tùy chỉnh trong thanh Action bằng JavaScript/JSX, hỗ trợ React, ctx, liên kết ngữ cảnh collection/bản ghi/Form."
keywords: "JSItem,JS Item,mục JS,mục Action tùy chỉnh,JavaScript,Interface Builder,NocoBase"
---

# JS Item

## Giới thiệu

JS Item được dùng để render một "mục Action tùy chỉnh" trong thanh Action. Bạn có thể trực tiếp viết JavaScript / JSX, xuất bất kỳ UI nào, ví dụ nút bấm, nhóm nút bấm, menu dropdown, văn bản gợi ý, tag trạng thái hoặc component tương tác nhỏ, và gọi API trong component, mở Popup, đọc bản ghi hiện tại hoặc làm mới dữ liệu Block.

Có thể được dùng ở các vị trí như thanh công cụ Form, thanh công cụ Table (cấp collection), Action hàng Table (cấp bản ghi), v.v., phù hợp với các trường hợp sau:

- Cần tùy chỉnh cấu trúc nút bấm, không chỉ gắn một sự kiện nhấp cho nút bấm;
- Cần kết hợp nhiều Action thành một nhóm nút bấm hoặc menu dropdown;
- Cần hiển thị trạng thái thời gian thực, thông tin thống kê hoặc nội dung giải thích trong thanh Action;
- Cần render nội dung khác nhau động theo bản ghi hiện tại, dữ liệu được chọn, giá trị Form.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Sự khác biệt với JS Action

- `JS Action`: Phù hợp hơn với "thực thi một đoạn script sau khi nhấp nút", trọng tâm là logic hành vi.
- `JS Item`: Phù hợp hơn với "tự render một mục Action", vừa kiểm soát giao diện vừa kiểm soát logic tương tác.

Nếu chỉ muốn bổ sung logic nhấp cho nút bấm hiện có, ưu tiên sử dụng `JS Action`; nếu muốn tùy chỉnh cấu trúc giao diện của mục Action hoặc render nhiều điều khiển, ưu tiên sử dụng `JS Item`.

## API ngữ cảnh runtime (thường dùng)

Runtime của JS Item sẽ inject các khả năng thường dùng, có thể trực tiếp sử dụng trong script:

- `ctx.render(vnode)`: Render React element, chuỗi HTML hoặc node DOM vào container mục Action hiện tại;
- `ctx.element`: Container DOM của mục Action hiện tại (ElementProxy);
- `ctx.api.request(options)`: Gửi yêu cầu HTTP;
- `ctx.openView(viewUid, options)`: Mở view đã được cấu hình (Drawer / hộp thoại / Trang);
- `ctx.message` / `ctx.notification`: Gợi ý và thông báo toàn cục;
- `ctx.t()` / `ctx.i18n.t()`: Quốc tế hóa;
- `ctx.resource`: Tài nguyên dữ liệu của ngữ cảnh cấp collection, ví dụ đọc bản ghi được chọn, làm mới danh sách;
- `ctx.record`: Bản ghi hàng hiện tại của ngữ cảnh cấp bản ghi;
- `ctx.form`: Instance AntD Form của ngữ cảnh cấp Form;
- `ctx.blockModel` / `ctx.collection`: Thông tin meta của Block và collection đang ở;
- `ctx.requireAsync(url)`: Tải bất đồng bộ thư viện AMD / UMD theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện thông dụng có sẵn, có thể trực tiếp dùng cho render JSX, xử lý thời gian, xử lý dữ liệu và tính toán toán học.

> Các biến thực sự có sẵn sẽ khác nhau tùy thuộc vào vị trí của mục Action. Ví dụ Action hàng Table thường có thể truy cập `ctx.record`, thanh công cụ Form thường có thể truy cập `ctx.form`, thanh công cụ Table thường có thể truy cập `ctx.resource`.

## Trình chỉnh sửa và Snippets

- `Snippets`: Mở danh sách snippets có sẵn, có thể tìm kiếm và chèn vào vị trí con trỏ hiện tại bằng một cú nhấp.
- `Run`: Chạy trực tiếp mã hiện tại, và xuất log chạy ra panel `Logs` ở dưới; hỗ trợ `console.log/info/warn/error` và định vị tô sáng lỗi.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Có thể kết hợp với AI Employee để tạo / chỉnh sửa script: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Cách sử dụng phổ biến (ví dụ ngắn gọn)

### 1) Render nút bấm thông thường

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Action collection: Kết hợp nút bấm và menu dropdown

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Action bản ghi: Mở view dựa trên hàng hiện tại

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Open a view as drawer and pass arguments at top-level
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Render nội dung trạng thái tùy chỉnh

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Lưu ý

- Nếu chỉ cần "thực thi logic sau khi nhấp", ưu tiên sử dụng `JS Action`, triển khai trực tiếp hơn.
- Thêm `try/catch` và gợi ý người dùng cho các cuộc gọi API, tránh các ngoại lệ thất bại âm thầm.
- Khi liên quan đến liên kết Table, danh sách, Popup, sau khi gửi thành công có thể chủ động làm mới dữ liệu thông qua `ctx.resource?.refresh?.()` hoặc tài nguyên Block đang ở.
- Khi sử dụng thư viện bên ngoài, nên tải qua CDN đáng tin cậy, và xử lý fallback cho việc tải thất bại.

## Tài liệu liên quan

- [Biến và ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [View và Popup](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
