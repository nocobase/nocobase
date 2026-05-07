---
title: "ctx.requireAsync()"
description: "ctx.requireAsync() tải động module UMD/AMD theo URL, phù hợp khi RunJS cần thư viện bên thứ ba, ESM dùng importAsync."
keywords: "ctx.requireAsync,UMD,AMD,tải động,importAsync,RunJS,NocoBase"
---

# ctx.requireAsync()

Tải bất đồng bộ script **UMD/AMD** hoặc gắn vào global theo URL, cũng có thể tải **CSS**. Phù hợp với các kịch bản RunJS cần sử dụng các thư viện UMD/AMD như ECharts, Chart.js, FullCalendar (bản UMD), plugin jQuery; khi truyền địa chỉ `.css` sẽ tải và inject style. Nếu thư viện cũng cung cấp phiên bản ESM, ưu tiên sử dụng [ctx.importAsync()](./import-async.md).

## Kịch bản áp dụng

Tất cả các kịch bản trong RunJS cần tải script UMD/AMD/global hoặc CSS theo nhu cầu đều có thể sử dụng, như JSBlock, JSField, JSItem, JSColumn, luồng sự kiện, JSAction, v.v. Sử dụng điển hình: chart ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugin jQuery, v.v.

## Định nghĩa kiểu

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `url` | `string` | Địa chỉ script hoặc CSS. Hỗ trợ **rút gọn** `<tên gói>@<phiên bản>/<đường dẫn file>` (khi parse qua ESM CDN sẽ thêm `?raw` để lấy file UMD gốc) hoặc **URL đầy đủ**. Khi truyền `.css` sẽ tải và inject style. |

## Giá trị trả về

- Object thư viện sau khi tải (giá trị module đầu tiên của callback UMD/AMD). Nhiều thư viện UMD sẽ gắn vào `window` (như `window.echarts`), giá trị trả về có thể là `undefined`, khi sử dụng thực tế tham khảo tài liệu thư viện để truy cập biến global.
- Khi truyền `.css` trả về kết quả của `loadCSS`.

## Giải thích về định dạng URL

- **Đường dẫn rút gọn**: như `echarts@5/dist/echarts.min.js`, dưới ESM CDN mặc định (esm.sh) sẽ yêu cầu `https://esm.sh/echarts@5/dist/echarts.min.js?raw`, `?raw` dùng để lấy file UMD gốc thay vì wrapper ESM.
- **URL đầy đủ**: Có thể viết trực tiếp địa chỉ CDN bất kỳ, như `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: Truyền URL kết thúc bằng `.css` sẽ tải và inject vào page.

## Khác biệt với ctx.importAsync()

- **ctx.requireAsync()**: Tải script **UMD/AMD/global**, phù hợp với các thư viện UMD như ECharts, Chart.js, FullCalendar (UMD), plugin jQuery; sau khi tải thư viện thường gắn vào `window`, giá trị trả về có thể là object thư viện hoặc `undefined`.
- **ctx.importAsync()**: Tải **module ESM**, trả về namespace module. Nếu thư viện cũng cung cấp ESM, ưu tiên dùng `ctx.importAsync()` để có ngữ nghĩa module và Tree-shaking tốt hơn.

## Ví dụ

### Cách dùng cơ bản

```javascript
// 简写路径（经 ESM CDN 解析为 ...?raw）
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// 完整 URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// 加载 CSS 并注入页面
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Chart ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('销售概览') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Bar chart Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('数量'), data: [12, 19, 3] }],
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

- **Hình thức giá trị trả về**: Thư viện UMD có cách export khác nhau, giá trị trả về có thể là object thư viện hoặc `undefined`; nếu là `undefined`, có thể tham khảo tài liệu thư viện để truy cập từ `window`.
- **Phụ thuộc mạng**: Cần truy cập CDN, môi trường nội bộ có thể trỏ đến service tự host qua **ESM_CDN_BASE_URL**.
- **Lựa chọn với importAsync**: Khi thư viện cung cấp cả ESM và UMD, ưu tiên dùng `ctx.importAsync()`.

## Liên quan

- [ctx.importAsync()](./import-async.md) - Tải module ESM, phù hợp với Vue, dayjs (ESM), v.v.
- [ctx.render()](./render.md) - Render chart, v.v. vào container
- [ctx.libs](./libs.md) - React, antd, dayjs, v.v. có sẵn, không cần tải bất đồng bộ
