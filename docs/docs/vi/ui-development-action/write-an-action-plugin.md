:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Giới thiệu về luồng công việc NocoBase



## Luồng công việc là gì?

Tính năng luồng công việc của NocoBase cho phép bạn tự động hóa nhiều quy trình nghiệp vụ khác nhau. Với giao diện kéo và thả, bạn có thể dễ dàng định nghĩa một chuỗi các thao tác, ví dụ như cập nhật dữ liệu, gửi thông báo hoặc tích hợp với các hệ thống khác.

### Các thành phần của một luồng công việc

Một luồng công việc điển hình bao gồm các phần sau:

- **Bộ kích hoạt (Trigger)**: Sự kiện khởi động luồng công việc. Ví dụ, khi một bản ghi mới được tạo trong `bộ sưu tập` "Đơn hàng".
- **Hành động (Action)**: Nhiệm vụ cụ thể mà luồng công việc thực hiện. Ví dụ, gửi email hoặc cập nhật dữ liệu trong `bộ sưu tập` "Kho hàng".
- **Điều kiện (Condition)**: Một phán đoán logic quyết định đường đi của luồng công việc. Ví dụ, nếu số tiền đơn hàng vượt quá 1000, thì gửi yêu cầu phê duyệt.

### Cách tạo một luồng công việc

1.  **Điều hướng đến trang luồng công việc**: Trong bảng điều khiển quản trị NocoBase, nhấp vào "Luồng công việc" trên thanh điều hướng bên trái.
2.  **Tạo luồng công việc mới**: Nhấp vào nút "Tạo luồng công việc mới".
3.  **Cấu hình bộ kích hoạt**: Chọn một bộ kích hoạt, ví dụ như "Dữ liệu bộ sưu tập được tạo".
4.  **Thêm hành động và điều kiện**: Kéo và thả các hành động và điều kiện mong muốn vào canvas.
5.  **Lưu và kích hoạt**: Sau khi cấu hình hoàn tất, lưu và kích hoạt luồng công việc của bạn.

### Ví dụ: Luồng công việc xử lý đơn hàng

Giả sử bạn có một `bộ sưu tập` "Đơn hàng". Khi một đơn hàng mới được tạo, bạn muốn:

1.  Kiểm tra số tiền đơn hàng.
2.  Nếu số tiền vượt quá 500, gửi email cho quản lý để phê duyệt.
3.  Ngược lại, tự động đặt trạng thái đơn hàng là "Đã xử lý".

Luồng công việc này có thể dễ dàng triển khai với NocoBase.

```yaml
workflow:
  name: Xử lý đơn hàng
  description: Tự động hóa quy trình phê duyệt và xử lý đơn hàng
  trigger:
    type: collection_data_created
    collection: orders
  steps:
    - type: condition
      expression: order.amount > 500
      then:
        - type: action
          name: send_email_to_manager
          template: order_approval_email
      else:
        - type: action
          name: update_order_status
          collection: orders
          record: "{{ order.id }}"
          data:
            status: processed
```

[Tìm hiểu thêm về `bộ sưu tập`](https://docs.nocobase.com/collections)
[Xem `plugin` luồng công việc](https://docs.nocobase.com/plugins/workflow)