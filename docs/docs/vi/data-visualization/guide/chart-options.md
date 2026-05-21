---
title: "Tùy chọn Biểu đồ"
description: "Cấu hình hiển thị biểu đồ: chế độ Basic trực quan và chế độ Custom JS, ánh xạ field xField/yField/seriesField, lựa chọn loại biểu đồ như line, bar, pie."
keywords: "tùy chọn biểu đồ,Basic mode,Custom mode,ECharts,ánh xạ field,xField,yField,NocoBase"
---

# Tùy chọn Biểu đồ

Cấu hình cách hiển thị biểu đồ, hỗ trợ hai chế độ: Basic (trực quan) và Custom (tùy chỉnh JS). Basic phù hợp cho ánh xạ nhanh và các thuộc tính thông dụng; Custom phù hợp cho các tình huống phức tạp và tùy chỉnh nâng cao.


## Cấu trúc panel

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tips: Để cấu hình nội dung hiện tại thuận tiện hơn, có thể thu gọn các panel khác trước.

Phía trên cùng là thanh thao tác
Lựa chọn chế độ
- Basic: Cấu hình trực quan, chọn loại và hoàn thành ánh xạ field, các thuộc tính chuyển đổi thông dụng được điều chỉnh trực tiếp.
- Custom: Viết JS trong editor, trả về `option` ECharts.

## Chế độ Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Chọn loại biểu đồ
- Hỗ trợ: line chart, area chart, bar chart, column chart, pie chart, doughnut chart, funnel chart, scatter chart, v.v.
- Các field yêu cầu của các loại biểu đồ khác nhau có thể khác nhau, hãy xác nhận tên cột và kiểu trong "Truy vấn dữ liệu → Xem dữ liệu" trước.

### Ánh xạ field
- line/area/bar/column:
  - `xField`: Dimension (như ngày, danh mục, khu vực)
  - `yField`: Measure (giá trị số sau khi tổng hợp)
  - `seriesField` (Tùy chọn): Nhóm series (dùng cho nhiều đường/nhiều cột)
- pie/doughnut:
  - `Category`: Dimension phân loại
  - `Value`: Measure
- funnel:
  - `Category`: Giai đoạn/phân loại
  - `Value`: Giá trị (thường là số lượng hoặc tỷ lệ)
- scatter:
  - `xField`, `yField`: Hai measure hoặc dimension, dùng cho trục tọa độ


> Để xem thêm cấu hình tùy chọn biểu đồ, vui lòng tham khảo tài liệu Echarts [Trục tọa độ](https://echarts.apache.org/handbook/en/concepts/axis) và [Ví dụ](https://echarts.apache.org/examples/en/index.html)


**Lưu ý:**
- Sau khi thay đổi dimension hoặc measure, hãy xác nhận lại ánh xạ để tránh xuất hiện biểu đồ rỗng hoặc lệch.
- pie/doughnut, funnel bắt buộc phải cung cấp tổ hợp "phân loại + giá trị".

### Thuộc tính thông dụng

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Stack, smooth (line/area)
- Hiển thị label, tooltip, legend
- Xoay axis label, đường phân cách
- Bán kính và bán kính trong của pie/doughnut, cách sắp xếp funnel


**Khuyến nghị:**
- Time series sử dụng line/area và bật smooth vừa phải; so sánh các loại lớn sử dụng bar/column.
- Khi dữ liệu dày đặc không cần bật tất cả các label, tránh che khuất.

## Chế độ Custom

Dùng để trả về `option` ECharts đầy đủ, phù hợp cho việc hợp nhất nhiều series, tooltip phức tạp, style động và các tùy chỉnh nâng cao khác.
Cách sử dụng khuyến nghị: Tập trung dữ liệu thống nhất vào `dataset.resource`, để biết cách sử dụng chi tiết, vui lòng tham khảo tài liệu Echarts [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Context dữ liệu
- `ctx.data.objects`: Mảng object (mỗi hàng bản ghi, khuyến nghị)
- `ctx.data.rows`: Mảng hai chiều (kèm header)
- `ctx.data.columns`: Mảng hai chiều theo cột


### Ví dụ: Line chart đơn hàng theo tháng
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Preview và Lưu
- Trong chế độ Custom sau khi sửa xong, có thể click nút Preview ở bên phải để cập nhật preview biểu đồ.
- Click "Lưu" ở phía dưới để cấu hình có hiệu lực và lưu lại; click "Hủy" để hoàn tác tất cả các thay đổi cấu hình lần này.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Để biết thêm về tùy chọn biểu đồ, vui lòng xem Cách sử dụng nâng cao - Cấu hình biểu đồ tùy chỉnh.
