:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tùy chọn biểu đồ

Cấu hình cách biểu đồ được hiển thị. Hỗ trợ hai chế độ: Basic (trực quan) và Custom (JS tùy chỉnh). Chế độ Basic lý tưởng cho việc ánh xạ nhanh và các thuộc tính phổ biến; chế độ Custom phù hợp với các tình huống phức tạp và tùy chỉnh nâng cao.

## Bố cục bảng điều khiển

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Mẹo: Để cấu hình nội dung hiện tại dễ dàng hơn, quý vị có thể thu gọn các bảng điều khiển khác trước.

Thanh thao tác ở trên cùng
Lựa chọn chế độ:
- Basic: Cấu hình trực quan, chọn loại và hoàn tất ánh xạ trường, điều chỉnh trực tiếp các thuộc tính phổ biến bằng công tắc.
- Custom: Viết mã JS trong trình chỉnh sửa và trả về một đối tượng `option` của ECharts.

## Chế độ Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Chọn loại biểu đồ
- Hỗ trợ: biểu đồ đường, biểu đồ vùng, biểu đồ cột, biểu đồ thanh, biểu đồ tròn, biểu đồ vành khuyên, biểu đồ phễu, biểu đồ phân tán, v.v.
- Các trường yêu cầu có thể khác nhau tùy theo loại biểu đồ. Trước tiên, hãy xác nhận tên cột và loại dữ liệu trong mục “Truy vấn dữ liệu → Xem dữ liệu”.

### Ánh xạ trường
- Biểu đồ đường/vùng/cột/thanh:
  - `xField`: Chiều (ví dụ: ngày, danh mục, khu vực)
  - `yField`: Đo lường (giá trị số đã tổng hợp)
  - `seriesField` (tùy chọn): Nhóm chuỗi (dùng cho nhiều đường/nhiều nhóm cột)
- Biểu đồ tròn/vành khuyên:
  - `Category`: Chiều phân loại
  - `Value`: Đo lường
- Biểu đồ phễu:
  - `Category`: Giai đoạn/phân loại
  - `Value`: Giá trị (thường là số lượng hoặc tỷ lệ phần trăm)
- Biểu đồ phân tán:
  - `xField`, `yField`: Hai đo lường hoặc chiều, dùng cho trục tọa độ

> Để biết thêm các tùy chọn biểu đồ, quý vị có thể tham khảo tài liệu ECharts: [Trục tọa độ](https://echarts.apache.org/handbook/en/concepts/axis) và [Ví dụ](https://echarts.apache.org/examples/en/index.html)

**Lưu ý:**
- Sau khi thay đổi chiều hoặc đo lường, hãy kiểm tra lại ánh xạ để tránh biểu đồ trống hoặc sai lệch.
- Biểu đồ tròn/vành khuyên và biểu đồ phễu phải cung cấp tổ hợp “phân loại + giá trị”.

### Các thuộc tính phổ biến

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Xếp chồng, làm mượt (biểu đồ đường/vùng)
- Hiển thị nhãn, chú giải công cụ (tooltip), chú giải (legend)
- Xoay nhãn trục tọa độ, đường phân cách
- Bán kính và bán kính trong của biểu đồ tròn/vành khuyên, cách sắp xếp biểu đồ phễu

**Khuyến nghị:**
- Sử dụng biểu đồ đường/vùng cho chuỗi thời gian và bật làm mượt ở mức độ vừa phải; sử dụng biểu đồ cột/thanh để so sánh các danh mục lớn.
- Khi dữ liệu dày đặc, không cần bật tất cả các nhãn để tránh che khuất.

## Chế độ Custom

Dùng để trả về một đối tượng `option` hoàn chỉnh của ECharts, phù hợp cho các tùy chỉnh nâng cao như hợp nhất nhiều chuỗi, chú giải công cụ phức tạp và kiểu động.
Cách dùng được khuyến nghị: tập trung dữ liệu vào `dataset.source`. Để biết chi tiết, vui lòng tham khảo tài liệu ECharts: [Tập dữ liệu](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Ngữ cảnh dữ liệu
- `ctx.data.objects`: Mảng đối tượng (mỗi hàng là một bản ghi, được khuyến nghị)
- `ctx.data.rows`: Mảng hai chiều (bao gồm tiêu đề bảng)
- `ctx.data.columns`: Mảng hai chiều được nhóm theo cột

### Ví dụ: Biểu đồ đường đơn hàng theo tháng
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

### Xem trước và Lưu
- Trong chế độ Custom, sau khi chỉnh sửa xong, quý vị có thể nhấp vào nút **Xem trước** ở bên phải để cập nhật bản xem trước biểu đồ.
- Ở phía dưới, nhấp vào “Lưu” để áp dụng và lưu cấu hình; nhấp vào “Hủy” để hoàn tác tất cả các thay đổi cấu hình trong lần này.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Để biết thêm thông tin về các tùy chọn biểu đồ, vui lòng xem mục [Cách dùng nâng cao — Cấu hình biểu đồ tùy chỉnh](#).