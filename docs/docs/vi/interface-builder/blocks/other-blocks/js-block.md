---
title: "JSBlock Block JS"
description: "JSBlock Block JS: thực thi JavaScript tùy chỉnh trong Block độc lập, hỗ trợ React, ctx, render động, model JS của FlowEngine."
keywords: "JSBlock,Block JS,Block JavaScript,Block tùy chỉnh,FlowEngine,Interface Builder,NocoBase"
---

# Block JS Block

## Giới thiệu

JS Block là một "Block render tùy chỉnh" rất linh hoạt, hỗ trợ trực tiếp viết script JavaScript để tạo giao diện, gắn sự kiện, gọi API dữ liệu hoặc tích hợp thư viện bên thứ ba. Phù hợp với các trường hợp visualization cá nhân hóa khó được Block có sẵn bao phủ, thử nghiệm tạm thời và mở rộng nhẹ.

## API ngữ cảnh runtime

Ngữ cảnh runtime của JS Block đã được inject các khả năng thường dùng, có thể trực tiếp sử dụng:

- `ctx.element`: Container DOM của Block (đã được đóng gói an toàn, ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.requireAsync(url)`: Tải bất đồng bộ thư viện AMD/UMD theo URL;
- `ctx.importAsync(url)`: Import động module ESM theo URL;
- `ctx.openView`: Mở view đã được cấu hình (Popup/Drawer/Trang);
- `ctx.useResource(...)` + `ctx.resource`: Truy cập dữ liệu theo cách tài nguyên;
- `ctx.i18n.t()` / `ctx.t()`: Khả năng quốc tế hóa có sẵn;
- `ctx.onRefReady(ctx.ref, cb)`: Render sau khi container sẵn sàng, tránh vấn đề thời gian;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Các thư viện thông dụng có sẵn như React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, dùng cho render JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Render React element, chuỗi HTML hoặc node DOM vào container mặc định `ctx.element`; gọi nhiều lần sẽ tái sử dụng cùng React Root, và ghi đè nội dung hiện có của container.

## Thêm Block

- Có thể thêm JS Block trong Trang hoặc Popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Trình chỉnh sửa và Snippets

Trình chỉnh sửa script của JS Block hỗ trợ tô sáng cú pháp, gợi ý lỗi và snippets có sẵn, có thể nhanh chóng chèn các ví dụ phổ biến, như: render biểu đồ, gắn sự kiện nút bấm, tải thư viện bên ngoài, render component React/Vue, dòng thời gian, thẻ thông tin, v.v.

- `Snippets`: Mở danh sách snippets có sẵn, có thể tìm kiếm và chèn snippet được chọn vào vị trí con trỏ hiện tại của vùng chỉnh sửa mã bằng một cú nhấp.
- `Run`: Chạy trực tiếp mã trong trình chỉnh sửa hiện tại, và xuất log chạy ra panel `Logs` ở dưới. Hỗ trợ hiển thị `console.log/info/warn/error`, lỗi sẽ được tô sáng và có thể định vị đến hàng cột cụ thể.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Và ở góc trên bên phải của trình chỉnh sửa có thể trực tiếp gọi AI Employee "Frontend Engineer · Nathan", để anh ấy giúp bạn viết hoặc chỉnh sửa script dựa trên ngữ cảnh hiện tại, "Apply to editor" một lần để áp dụng vào trình chỉnh sửa rồi chạy xem hiệu ứng. Xem chi tiết:

- [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Môi trường runtime và bảo mật

- Container: Hệ thống cung cấp container DOM an toàn `ctx.element` (ElementProxy) cho script, chỉ ảnh hưởng đến Block hiện tại, không can thiệp vào các khu vực khác của Trang.
- Sandbox: Script chạy trong môi trường được kiểm soát, `window`/`document`/`navigator` sử dụng các đối tượng proxy an toàn, các API thông dụng có sẵn, hành vi nguy hiểm bị giới hạn.
- Render lại: Block sau khi bị ẩn rồi hiển thị lại sẽ tự động render lại (tránh thực thi trùng lặp khi mount lần đầu).

## Cách sử dụng phổ biến (ví dụ ngắn gọn)

### 1) Render React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Mẫu yêu cầu API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Tải ECharts và render

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Mở view (Drawer)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Đọc tài nguyên và render JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Lưu ý

- Nên sử dụng CDN đáng tin cậy khi tải thư viện bên ngoài.
- Khuyến nghị về việc sử dụng selector: Ưu tiên sử dụng `class` hoặc selector thuộc tính `[name=...]`; tránh sử dụng `id` cố định, để tránh xuất hiện `id` trùng lặp trong nhiều Block/Popup gây xung đột kiểu hoặc sự kiện.
- Dọn dẹp sự kiện: Block có thể được render lại nhiều lần, trước khi gắn sự kiện nên dọn dẹp hoặc loại bỏ trùng lặp, để tránh kích hoạt trùng lặp. Có thể áp dụng cách "remove trước rồi add", hoặc listener một lần, hoặc thêm đánh dấu chống trùng lặp.

## Tài liệu liên quan

- [Biến và ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [View và Popup](/interface-builder/actions/types/view)
