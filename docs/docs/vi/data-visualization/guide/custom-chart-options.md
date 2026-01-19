:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cấu hình biểu đồ tùy chỉnh

Ở chế độ tùy chỉnh, bạn có thể cấu hình biểu đồ bằng cách viết mã JS trong trình chỉnh sửa. Dựa trên `ctx.data`, bạn sẽ trả về một đối tượng `option` hoàn chỉnh của ECharts. Chế độ này phù hợp cho việc kết hợp nhiều chuỗi dữ liệu, tạo các gợi ý phức tạp và kiểu dáng động. Về lý thuyết, nó hỗ trợ đầy đủ tất cả các tính năng và loại biểu đồ của ECharts.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Ngữ cảnh dữ liệu
- `ctx.data.objects`: Mảng các đối tượng (mỗi đối tượng là một hàng dữ liệu)
- `ctx.data.rows`: Mảng hai chiều (bao gồm tiêu đề cột)
- `ctx.data.columns`: Mảng hai chiều được nhóm theo cột

**Cách sử dụng đề xuất:**
Bạn nên tập trung dữ liệu vào `dataset.source`. Để biết chi tiết cách sử dụng, vui lòng tham khảo tài liệu ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Trục](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Ví dụ](https://echarts.apache.org/examples/en/index.html)


Hãy cùng xem một ví dụ đơn giản nhất:

## Ví dụ 1: Biểu đồ cột số lượng đơn hàng theo tháng

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```


## Ví dụ 2: Biểu đồ xu hướng doanh số

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**Khuyến nghị:**
- Giữ phong cách hàm thuần túy: chỉ tạo `option` từ `ctx.data` và tránh các tác dụng phụ.
- Việc điều chỉnh tên cột truy vấn có thể ảnh hưởng đến việc lập chỉ mục; hãy chuẩn hóa tên và xác nhận trong "Xem dữ liệu" trước khi sửa đổi mã.
- Đối với tập dữ liệu lớn, tránh thực hiện các phép tính đồng bộ phức tạp trong JS; hãy tổng hợp dữ liệu trong giai đoạn truy vấn khi cần thiết.


## Các ví dụ khác

Để xem thêm các ví dụ sử dụng, bạn có thể tham khảo [ứng dụng Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) của NocoBase.

Bạn cũng có thể xem các [ví dụ](https://echarts.apache.org/examples/en/index.html) chính thức của ECharts để chọn hiệu ứng biểu đồ mong muốn, sau đó tham khảo và sao chép mã cấu hình JS. 
 

## Xem trước và Lưu

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Nhấp vào "Xem trước" ở phía bên phải hoặc phía dưới để làm mới biểu đồ và xác thực nội dung cấu hình JS.
- Nhấp vào "Lưu" để lưu nội dung cấu hình JS hiện tại vào cơ sở dữ liệu.
- Nhấp vào "Hủy" để quay lại trạng thái đã lưu gần nhất.