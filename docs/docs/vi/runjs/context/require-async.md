:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/require-async).
:::

# ctx.requireAsync()

Tải bất đồng bộ các script **UMD/AMD** hoặc script gắn vào global thông qua URL, cũng có thể tải **CSS**. Phương thức này phù hợp cho các kịch bản RunJS cần sử dụng các thư viện UMD/AMD như ECharts, Chart.js, FullCalendar (phiên bản UMD), jQuery plugin, v.v.; truyền vào địa chỉ `.css` sẽ tải và chèn style vào trang. Nếu thư viện cung cấp cả phiên bản ESM, hãy ưu tiên sử dụng [ctx.importAsync()](./import-async.md).

## Scenarios sử dụng

Có thể sử dụng trong bất kỳ kịch bản RunJS nào cần tải script UMD/AMD/global hoặc CSS theo nhu cầu, chẳng hạn như JSBlock, JSField, JSItem, JSColumn, luồng công việc, JSAction, v.v. Các mục đích sử dụng điển hình: biểu đồ ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery plugin, v.v.

## Định nghĩa kiểu

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `url` | `string` | Địa chỉ script hoặc CSS. Hỗ trợ **viết tắt** `<tên gói>@<phiên bản>/<đường dẫn tệp>` (khi phân giải qua ESM CDN sẽ thêm `?raw` để lấy tệp UMD gốc) hoặc **URL đầy đủ**. Khi truyền vào `.css`, nó sẽ tải và chèn style. |

## Giá trị trả về

- Đối tượng thư viện đã tải (giá trị module đầu tiên của callback UMD/AMD). Nhiều thư viện UMD sẽ tự gắn vào `window` (ví dụ: `window.echarts`), khi đó giá trị trả về có thể là `undefined`, bạn chỉ cần truy cập biến toàn cục theo tài liệu của thư viện đó.
- Trả về kết quả của `loadCSS` khi truyền vào tệp `.css`.

## Mô tả định dạng URL

- **Đường dẫn viết tắt**: Ví dụ `echarts@5/dist/echarts.min.js`, dưới ESM CDN mặc định (esm.sh), nó sẽ yêu cầu `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Tham số `?raw` được dùng để lấy tệp UMD gốc thay vì bản đóng gói ESM.
- **URL đầy đủ**: Có thể sử dụng trực tiếp bất kỳ địa chỉ CDN nào, chẳng hạn như `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: Truyền vào URL kết thúc bằng `.css` sẽ tải và chèn style vào trang.

## Khác biệt với ctx.importAsync()

- **ctx.requireAsync()**: Tải script **UMD/AMD/global**, phù hợp với ECharts, Chart.js, FullCalendar (UMD), jQuery plugin, v.v. Sau khi tải, thư viện thường gắn vào `window`, giá trị trả về có thể là đối tượng thư viện hoặc `undefined`.
- **ctx.importAsync()**: Tải **module ESM**, trả về namespace của module. Nếu thư viện cung cấp cả ESM, hãy ưu tiên dùng `ctx.importAsync()` để có ngữ nghĩa module tốt hơn và hỗ trợ Tree-shaking.

## Ví dụ

### Cách dùng cơ bản

```javascript
// Đường dẫn viết tắt (được phân giải qua ESM CDN thành ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL đầy đủ
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Tải CSS và chèn vào trang
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Biểu đồ ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Thư viện ECharts chưa được tải');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Tổng quan doanh số') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Biểu đồ cột Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js chưa được tải');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Số lượng'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Lưu ý

- **Hình thức giá trị trả về**: Cách xuất (export) của các thư viện UMD rất đa dạng, giá trị trả về có thể là đối tượng thư viện hoặc `undefined`. Nếu là `undefined`, bạn có thể truy cập từ `window` theo tài liệu của thư viện.
- **Phụ thuộc mạng**: Cần có quyền truy cập CDN. Trong môi trường mạng nội bộ, bạn có thể cấu hình **ESM_CDN_BASE_URL** để trỏ đến dịch vụ CDN tự triển khai.
- **Lựa chọn với importAsync**: Khi thư viện cung cấp cả ESM và UMD, hãy ưu tiên sử dụng `ctx.importAsync()`.

## Liên quan

- [ctx.importAsync()](./import-async.md) - Tải module ESM, phù hợp cho Vue, dayjs (ESM), v.v.
- [ctx.render()](./render.md) - Hiển thị biểu đồ và các thành phần khác vào container.
- [ctx.libs](./libs.md) - Các thư viện tích hợp sẵn như React, antd, dayjs, v.v., không cần tải bất đồng bộ.