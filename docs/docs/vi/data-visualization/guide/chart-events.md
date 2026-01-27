:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sự kiện tương tác tùy chỉnh

Viết mã JS trong trình chỉnh sửa sự kiện và đăng ký các tương tác thông qua thể hiện ECharts `chart` để kích hoạt liên kết. Ví dụ, bạn có thể điều hướng đến một trang mới hoặc mở hộp thoại chi tiết (drill-down).

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Đăng ký và Hủy đăng ký sự kiện
- Đăng ký: `chart.on(eventName, handler)`
- Hủy đăng ký: `chart.off(eventName, handler)` hoặc `chart.off(eventName)` để xóa các sự kiện cùng tên.

**Lưu ý:**
Vì lý do an toàn, chúng tôi đặc biệt khuyến nghị bạn nên hủy đăng ký một sự kiện trước khi đăng ký lại!

## Cấu trúc dữ liệu của tham số `params` trong hàm handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Các trường thường dùng bao gồm `params.data` và `params.name`.

## Ví dụ: Nhấp để đánh dấu lựa chọn
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Đánh dấu điểm dữ liệu hiện tại
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Hủy đánh dấu các điểm khác
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Ví dụ: Nhấp để điều hướng trang
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Cách 1: Điều hướng nội bộ ứng dụng, không buộc làm mới trang, mang lại trải nghiệm tốt hơn (khuyến nghị), chỉ cần đường dẫn tương đối
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Cách 2: Điều hướng đến trang bên ngoài, yêu cầu liên kết đầy đủ
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Cách 3: Mở trang bên ngoài trong một tab mới, yêu cầu liên kết đầy đủ
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Ví dụ: Nhấp để mở hộp thoại chi tiết (phân tích drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // đăng ký các biến ngữ cảnh cho hộp thoại mới
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Trong hộp thoại vừa mở, bạn có thể sử dụng các biến ngữ cảnh của biểu đồ thông qua `ctx.view.inputArgs.XXX`.

## Xem trước và Lưu
- Nhấp vào "Xem trước" để tải và thực thi mã sự kiện.
- Nhấp vào "Lưu" để lưu cấu hình sự kiện hiện tại.
- Nhấp vào "Hủy" để quay lại trạng thái đã lưu gần nhất.

**Khuyến nghị:**
- Luôn sử dụng `chart.off('event')` trước khi liên kết để tránh việc thực thi trùng lặp hoặc tăng mức sử dụng bộ nhớ.
- Trong các hàm xử lý sự kiện, hãy cố gắng sử dụng các thao tác nhẹ (ví dụ: `dispatchAction`, `setOption`) để tránh làm tắc nghẽn quá trình hiển thị.
- Xác thực với các tùy chọn biểu đồ và truy vấn dữ liệu để đảm bảo rằng các trường được xử lý trong sự kiện nhất quán với dữ liệu hiện tại.