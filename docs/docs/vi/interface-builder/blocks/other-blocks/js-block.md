:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Giới thiệu

JS Block là một “khối hiển thị tùy chỉnh” (custom rendering block) cực kỳ linh hoạt, hỗ trợ viết trực tiếp mã JavaScript để tạo giao diện, liên kết sự kiện, gọi API dữ liệu hoặc tích hợp các thư viện bên thứ ba. Khối này phù hợp cho các kịch bản hiển thị cá nhân hóa, thử nghiệm tạm thời và mở rộng nhẹ mà các khối tích hợp sẵn khó đáp ứng.

## API Ngữ cảnh Thực thi (Runtime Context)

Ngữ cảnh thực thi của JS Block đã được tích hợp sẵn các khả năng phổ biến, có thể sử dụng trực tiếp:

- `ctx.element`: Bộ chứa DOM của khối (đã được đóng gói an toàn, ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.;
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL;
- `ctx.importAsync(url)`: Nhập module ESM động theo URL;
- `ctx.openView`: Mở chế độ xem đã cấu hình (cửa sổ bật lên/ngăn kéo/trang);
- `ctx.useResource(...)` + `ctx.resource`: Truy cập dữ liệu dưới dạng tài nguyên;
- `ctx.i18n.t()` / `ctx.t()`: Khả năng quốc tế hóa tích hợp sẵn;
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi bộ chứa sẵn sàng, tránh vấn đề về thứ tự thời gian;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Tích hợp sẵn các thư viện phổ biến như React / ReactDOM / Ant Design / biểu tượng Ant Design / dayjs / lodash / math.js / formula.js, dùng để hiển thị JSX, xử lý thời gian, thao tác dữ liệu và tính toán toán học. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị phần tử React, chuỗi HTML hoặc nút DOM vào bộ chứa mặc định `ctx.element`; nhiều lần gọi sẽ tái sử dụng cùng một React Root và ghi đè nội dung hiện có của bộ chứa.

## Thêm khối

- Có thể thêm JS Block trong trang hoặc cửa sổ bật lên.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Trình chỉnh sửa và Đoạn mã (Snippets)

Trình chỉnh sửa script của JS Block hỗ trợ tô sáng cú pháp, gợi ý lỗi và các đoạn mã (Snippets) tích hợp sẵn, cho phép nhanh chóng chèn các ví dụ phổ biến như: hiển thị biểu đồ, liên kết sự kiện nút, tải thư viện bên ngoài, hiển thị thành phần React/Vue, dòng thời gian, thẻ thông tin, v.v.

- `Snippets`: Mở danh sách đoạn mã tích hợp sẵn, có thể tìm kiếm và chèn đoạn mã đã chọn vào vị trí con trỏ hiện tại trong vùng chỉnh sửa mã chỉ với một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã trong trình chỉnh sửa và xuất nhật ký chạy ra bảng `Logs` ở phía dưới. Hỗ trợ hiển thị `console.log/info/warn/error`, lỗi sẽ được tô sáng và có thể định vị đến hàng và cột cụ thể.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Ngoài ra, góc trên bên phải trình chỉnh sửa có thể gọi trực tiếp AI nhân viên “Kỹ sư Frontend · Nathan”, để Nathan giúp bạn viết hoặc sửa đổi script dựa trên ngữ cảnh hiện tại, sau đó nhấn “Apply to editor” để áp dụng vào trình chỉnh sửa rồi chạy để xem kết quả. Chi tiết xem tại:

- [AI nhân viên · Nathan: Kỹ sư Frontend](/ai-employees/features/built-in-employee)

## Môi trường thực thi và An toàn

- Bộ chứa (Container): Hệ thống cung cấp bộ chứa DOM an toàn `ctx.element` (ElementProxy) cho script, chỉ ảnh hưởng đến khối hiện tại, không can thiệp vào các khu vực khác của trang.
- Hộp cát (Sandbox): Script chạy trong môi trường được kiểm soát, `window`/`document`/`navigator` sử dụng các đối tượng proxy an toàn, các API phổ biến có thể sử dụng, các hành vi rủi ro bị hạn chế.
- Hiển thị lại (Re-rendering): Khối sẽ tự động hiển thị lại sau khi bị ẩn rồi hiển thị lại (để tránh thực thi lặp lại khi gắn kết lần đầu).

## Cách dùng phổ biến (Ví dụ tinh giản)

### 1) Hiển thị React (JSX)

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

### 3) Tải ECharts và hiển thị

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

### 4) Mở chế độ xem (Ngăn kéo)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Đọc tài nguyên và hiển thị JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Lưu ý

- Tải thư viện bên ngoài nên sử dụng CDN đáng tin cậy.
- Gợi ý sử dụng bộ chọn: Ưu tiên sử dụng bộ chọn thuộc tính `class` hoặc `[name=...]`; tránh sử dụng `id` cố định để không xảy ra trùng lặp `id` trong nhiều khối/cửa sổ bật lên dẫn đến xung đột kiểu dáng hoặc sự kiện.
- Dọn dẹp sự kiện: Khối có thể hiển thị lại nhiều lần, trước khi liên kết sự kiện nên dọn dẹp hoặc loại bỏ trùng lặp để tránh kích hoạt lặp lại. Có thể áp dụng phương pháp “xóa trước thêm sau”, hoặc trình lắng nghe một lần, hoặc thêm đánh dấu để chống lặp lại.

## Tài liệu liên quan

- [Biến và Ngữ cảnh](/interface-builder/variables)
- [Quy tắc liên kết](/interface-builder/linkage-rule)
- [Chế độ xem và Cửa sổ bật lên](/interface-builder/actions/types/view)