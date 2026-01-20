---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Gọi luồng công việc

## Giới thiệu

Dùng để gọi các luồng công việc khác từ bên trong một luồng công việc. Bạn có thể sử dụng các biến từ luồng công việc hiện tại làm đầu vào cho luồng công việc con, và sử dụng đầu ra của luồng công việc con làm biến trong luồng công việc hiện tại để dùng ở các nút tiếp theo.

Quy trình gọi luồng công việc được minh họa như hình dưới đây:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Bằng cách gọi luồng công việc, bạn có thể tái sử dụng các logic quy trình chung, ví dụ như gửi email, SMS, v.v., hoặc chia một luồng công việc phức tạp thành nhiều luồng công việc con để dễ quản lý và bảo trì hơn.

Về bản chất, một luồng công việc không phân biệt liệu nó có phải là luồng công việc con hay không. Bất kỳ luồng công việc nào cũng có thể được gọi làm luồng công việc con bởi các luồng công việc khác, và nó cũng có thể gọi các luồng công việc khác. Tất cả các luồng công việc đều bình đẳng, chỉ tồn tại mối quan hệ gọi và được gọi.

Tương tự, việc sử dụng tính năng gọi luồng công việc diễn ra ở hai vị trí:

- Trong luồng công việc chính: Với vai trò là bên gọi, bạn gọi các luồng công việc khác thông qua nút "Gọi luồng công việc".
- Trong luồng công việc con: Với vai trò là bên được gọi, bạn lưu các biến cần xuất từ luồng công việc hiện tại thông qua nút "Đầu ra luồng công việc". Các biến này có thể được sử dụng bởi các nút tiếp theo trong luồng công việc đã gọi nó.

## Tạo nút

Trong giao diện cấu hình luồng công việc, bạn nhấp vào nút dấu cộng (“+”) trong luồng công việc để thêm nút "Gọi luồng công việc":

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Cấu hình nút

### Chọn luồng công việc

Chọn luồng công việc bạn muốn gọi. Bạn có thể sử dụng hộp tìm kiếm để tìm nhanh chóng:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Mẹo}
* Các luồng công việc chưa được kích hoạt cũng có thể được gọi làm luồng công việc con.
* Khi luồng công việc hiện tại ở chế độ đồng bộ, nó chỉ có thể gọi các luồng công việc con cũng ở chế độ đồng bộ.
:::

### Cấu hình biến kích hoạt của luồng công việc

Sau khi chọn luồng công việc, bạn cần cấu hình các biến kích hoạt làm dữ liệu đầu vào để kích hoạt luồng công việc con. Bạn có thể chọn trực tiếp dữ liệu tĩnh hoặc chọn các biến từ luồng công việc hiện tại:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Các loại trình kích hoạt khác nhau yêu cầu các biến khác nhau, bạn có thể hoàn tất cấu hình trên biểu mẫu tùy theo nhu cầu.

## Nút Đầu ra luồng công việc

Tham khảo nội dung của nút [Đầu ra luồng công việc](./output.md) để cấu hình các biến đầu ra của luồng công việc con.

## Sử dụng đầu ra luồng công việc

Trở lại luồng công việc chính, tại các nút khác bên dưới nút Gọi luồng công việc, khi bạn muốn sử dụng giá trị đầu ra của luồng công việc con, bạn có thể chọn kết quả của nút Gọi luồng công việc. Nếu luồng công việc con xuất ra một giá trị đơn giản, như chuỗi, số, giá trị logic, ngày (ngày ở định dạng chuỗi UTC), v.v., bạn có thể sử dụng trực tiếp; nếu đó là một đối tượng phức tạp (ví dụ: một đối tượng từ một bộ sưu tập), bạn cần ánh xạ nó thông qua nút phân tích cú pháp JSON trước khi có thể sử dụng các thuộc tính của nó, nếu không, bạn chỉ có thể sử dụng nó như một đối tượng hoàn chỉnh.

Nếu luồng công việc con không cấu hình nút Đầu ra luồng công việc, hoặc không có giá trị đầu ra, thì khi sử dụng kết quả của nút Gọi luồng công việc trong luồng công việc chính, bạn sẽ chỉ nhận được một giá trị rỗng (`null`).