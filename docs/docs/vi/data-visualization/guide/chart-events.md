---
title: "Sự kiện Tương tác Tùy chỉnh"
description: "Đăng ký sự kiện tương tác ECharts qua chart.on: highlight khi click, chuyển trang, drill-down phân tích, mở popup, hỗ trợ tham số params và dispatchAction."
keywords: "sự kiện tương tác biểu đồ,chart.on,highlight click,chuyển trang,drill-down,dispatchAction,NocoBase"
---

# Sự kiện Tương tác Tùy chỉnh

Trong event editor viết JS, đăng ký các hành vi tương tác qua instance `chart` của ECharts để thực hiện liên kết. Ví dụ chuyển sang trang mới, mở popup drill-down phân tích, v.v.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Đăng ký và hủy đăng ký sự kiện
- Đăng ký: `chart.on(eventName, handler)`
- Hủy đăng ký: `chart.off(eventName, handler)` hoặc `chart.off(eventName)` để xóa các sự kiện cùng tên

**Lưu ý:**
Vì lý do bảo mật, khuyến nghị mạnh mẽ hãy hủy đăng ký trước khi đăng ký sự kiện!


## Cấu trúc dữ liệu params truyền vào hàm handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Các giá trị thường dùng có `params.data`, `params.name`, v.v.


## Ví dụ: Highlight khi click
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Highlight điểm dữ liệu hiện tại
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Hủy highlight các điểm khác
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Ví dụ: Click chuyển trang
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Cách 1: Chuyển nội bộ trong ứng dụng, không bắt buộc refresh trang, trải nghiệm tốt hơn (khuyến nghị), chỉ cần đường dẫn tương đối path
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Cách 2: Chuyển sang trang ngoài, cần liên kết đầy đủ
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Cách 3: Mở trang ngoài trong tab mới, cần liên kết đầy đủ
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Ví dụ: Click hiển thị popup chi tiết (Drill-down phân tích)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // Đăng ký biến context để popup mới sử dụng
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Trong popup mới mở, sử dụng biến context được khai báo trong biểu đồ `ctx.view.inputArgs.XXX`


## Preview và Lưu
- Click "Preview" để load và thực thi code sự kiện.
- Click "Lưu" sẽ lưu nội dung cấu hình sự kiện hiện tại.
- Click "Hủy" để quay về trạng thái lưu lần trước.

**Khuyến nghị:**
- Trước mỗi lần binding hãy `chart.off('event')` trước, tránh nhiều lần binding dẫn đến thực thi lặp hoặc tăng bộ nhớ.
- Trong sự kiện cố gắng sử dụng các thao tác nhẹ (`dispatchAction`, `setOption`), tránh chặn render.
- Phối hợp với tùy chọn biểu đồ và truy vấn dữ liệu để xác minh, đảm bảo các field xử lý sự kiện nhất quán với dữ liệu hiện tại.
