---
title: "Cấu hình Biểu đồ Tùy chỉnh"
description: "Chế độ Custom viết JS để trả về option ECharts, dựa trên ctx.data hỗ trợ dataset, hợp nhất nhiều series, tooltip phức tạp và style động, đầy đủ khả năng ECharts."
keywords: "biểu đồ tùy chỉnh,Custom mode,ECharts option,ctx.data,dataset,NocoBase"
---

# Cấu hình Biểu đồ Tùy chỉnh

Cấu hình biểu đồ ở chế độ tùy chỉnh, có thể viết JS trong code editor, dựa trên `ctx.data` để trả về `option` ECharts đầy đủ, phù hợp cho việc hợp nhất nhiều series, tooltip phức tạp và style động. Về lý thuyết có thể hỗ trợ đầy đủ các tính năng và tất cả các loại biểu đồ của Echarts.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Context dữ liệu
- `ctx.data.objects`: Mảng object (mỗi hàng bản ghi)
- `ctx.data.rows`: Mảng hai chiều (kèm header)
- `ctx.data.columns`: Mảng hai chiều theo cột

**Cách sử dụng khuyến nghị:**
Tập trung dữ liệu thống nhất vào `dataset.resource`, để biết cách sử dụng chi tiết, vui lòng tham khảo tài liệu Echarts

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Trục tọa độ](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Ví dụ](https://echarts.apache.org/examples/en/index.html)


Trước tiên hãy xem một ví dụ đơn giản nhất:

## Ví dụ 1: Bar chart số lượng đơn hàng theo tháng

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
- Giữ phong cách hàm thuần túy, chỉ tạo `option` dựa trên `ctx.data`, tránh các side effect.
- Việc thay đổi tên cột truy vấn sẽ ảnh hưởng đến chỉ số, hãy đặt tên thống nhất và xác nhận trong "Xem dữ liệu" trước khi sửa code.
- Khi dữ liệu lớn, tránh thực hiện các tính toán đồng bộ phức tạp trong JS, khi cần thiết hãy tổng hợp ở giai đoạn truy vấn.


## Thêm ví dụ

Để xem thêm các ví dụ sử dụng, có thể tham khảo [ứng dụng Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) của Nocobase

Cũng có thể xem [Ví dụ chính thức](https://echarts.apache.org/examples/en/index.html) của Echarts để chọn hiệu quả biểu đồ bạn muốn, tham khảo và sao chép code cấu hình JS.
 

## Preview và Lưu

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Click "Preview" ở bên phải hoặc "Preview" ở phía dưới để refresh biểu đồ và xác minh nội dung cấu hình JS.
- Click "Lưu" sẽ lưu nội dung cấu hình JS hiện tại vào database.
- Click "Hủy" sẽ quay về trạng thái lưu lần trước.
