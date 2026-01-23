:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# JS Block

## Giới thiệu

JS Block là một "block hiển thị tùy chỉnh" cực kỳ linh hoạt, cho phép bạn viết mã JavaScript trực tiếp để tạo giao diện, liên kết sự kiện, gọi API dữ liệu hoặc tích hợp các thư viện bên thứ ba. Nó phù hợp cho các trường hợp cần hiển thị tùy chỉnh, thử nghiệm tạm thời và mở rộng nhẹ mà các block có sẵn khó đáp ứng.

## API Ngữ cảnh Thực thi (Runtime Context)

Ngữ cảnh thực thi (runtime context) của JS Block đã được tích hợp sẵn các khả năng phổ biến, bạn có thể sử dụng trực tiếp:

- `ctx.element`: Bộ chứa DOM của block (đã được đóng gói an toàn dưới dạng ElementProxy), hỗ trợ `innerHTML`, `querySelector`, `addEventListener`, v.v.
- `ctx.requireAsync(url)`: Tải thư viện AMD/UMD bất đồng bộ theo URL.
- `ctx.importAsync(url)`: Nhập module ESM động theo URL.
- `ctx.openView`: Mở một view đã cấu hình (popup/ngăn kéo/trang).
- `ctx.useResource(...)` + `ctx.resource`: Truy cập dữ liệu dưới dạng tài nguyên.
- `ctx.i18n.t()` / `ctx.t()`: Khả năng quốc tế hóa tích hợp sẵn.
- `ctx.onRefReady(ctx.ref, cb)`: Hiển thị sau khi bộ chứa sẵn sàng để tránh các vấn đề về thời gian.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Các thư viện phổ biến tích hợp sẵn như React, ReactDOM, Ant Design, biểu tượng Ant Design và dayjs, dùng để hiển thị JSX và xử lý thời gian. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` vẫn được giữ lại để tương thích.)
- `ctx.render(vnode)`: Hiển thị một phần tử React, chuỗi HTML hoặc nút DOM vào bộ chứa mặc định `ctx.element`; nhiều lần gọi sẽ tái sử dụng cùng một React Root và ghi đè nội dung hiện có của bộ chứa.

## Thêm một Block

Bạn có thể thêm JS Block vào một trang hoặc một popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Trình chỉnh sửa và Đoạn mã (Snippets)

Trình chỉnh sửa script của JS Block hỗ trợ tô sáng cú pháp, gợi ý lỗi và các đoạn mã (Snippets) tích hợp sẵn, cho phép bạn nhanh chóng chèn các ví dụ phổ biến như: hiển thị biểu đồ, liên kết sự kiện nút, tải thư viện bên ngoài, hiển thị các thành phần React/Vue, dòng thời gian, thẻ thông tin, v.v.

- `Snippets`: Mở danh sách các đoạn mã tích hợp sẵn. Bạn có thể tìm kiếm và chèn đoạn mã đã chọn vào vị trí con trỏ hiện tại trong trình chỉnh sửa mã chỉ với một cú nhấp chuột.
- `Run`: Chạy trực tiếp mã trong trình chỉnh sửa hiện tại và xuất nhật ký thực thi ra bảng `Logs` ở phía dưới. Hỗ trợ hiển thị `console.log/info/warn/error`, các lỗi sẽ được tô sáng và có thể định vị đến hàng và cột cụ thể.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Ngoài ra, bạn có thể trực tiếp gọi AI nhân viên "Kỹ sư Frontend · Nathan" từ góc trên bên phải của trình chỉnh sửa. Nathan có thể giúp bạn viết hoặc sửa đổi script dựa trên ngữ cảnh hiện tại. Sau đó, bạn có thể "Apply to editor" chỉ với một cú nhấp chuột và chạy mã để xem kết quả. Chi tiết xem tại:

- [AI Nhân viên · Nathan: Kỹ sư Frontend](/ai-employees/built-in/ai-coding)

## Môi trường Thực thi và Bảo mật

- **Bộ chứa**: Hệ thống cung cấp một bộ chứa DOM an toàn `ctx.element` (ElementProxy) cho script, chỉ ảnh hưởng đến block hiện tại và không can thiệp vào các khu vực khác của trang.
- **Sandbox**: Script chạy trong một môi trường được kiểm soát. `window`/`document`/`navigator` sử dụng các đối tượng proxy an toàn, cho phép sử dụng các API phổ biến trong khi hạn chế các hành vi rủi ro.
- **Hiển thị lại**: Block sẽ tự động hiển thị lại khi bị ẩn và sau đó được hiển thị (để tránh thực thi lại script khởi tạo ban đầu).

## Các trường hợp sử dụng phổ biến (Ví dụ đơn giản)

### 1) Hiển thị React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Đã nhấp!'))}>
      {ctx.t('Nhấp')}
    </Button>
  </div>
);
```

### 2) Mẫu yêu cầu API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Yêu cầu đã hoàn tất'));
console.log(ctx.t('Dữ liệu phản hồi:'), resp?.data);
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

### 4) Mở một View (Ngăn kéo)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Ngăn kéo mẫu'), size: 'large' });
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

- Nên sử dụng các CDN đáng tin cậy để tải các thư viện bên ngoài.
- **Lời khuyên về cách sử dụng bộ chọn**: Ưu tiên sử dụng bộ chọn thuộc tính `class` hoặc `[name=...]`. Tránh sử dụng `id` cố định để ngăn ngừa xung đột về kiểu dáng hoặc sự kiện do trùng lặp `id` khi có nhiều block hoặc popup.
- **Dọn dẹp sự kiện**: Vì block có thể hiển thị lại nhiều lần, các trình lắng nghe sự kiện nên được dọn dẹp hoặc loại bỏ trùng lặp trước khi liên kết để tránh kích hoạt lặp lại. Bạn có thể sử dụng phương pháp "xóa rồi thêm", trình lắng nghe một lần, hoặc thêm cờ để ngăn chặn trùng lặp.

## Tài liệu liên quan

- [Biến và Ngữ cảnh](/interface-builder/variables)
- [Quy tắc Liên kết](/interface-builder/linkage-rule)
- [Views và Popups](/interface-builder/actions/types/view)