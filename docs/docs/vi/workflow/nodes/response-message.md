---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Thông báo phản hồi

## Giới thiệu

Nút thông báo phản hồi được dùng để gửi các thông báo tùy chỉnh từ luồng công việc đến máy khách (client) đã thực hiện thao tác, trong các loại luồng công việc cụ thể.

:::info{title=Lưu ý}
Hiện tại, nút này hỗ trợ sử dụng trong chế độ đồng bộ của các loại luồng công việc "Sự kiện trước thao tác" và "Sự kiện thao tác tùy chỉnh".
:::

## Tạo nút

Trong các loại luồng công việc được hỗ trợ, quý vị có thể thêm nút "Thông báo phản hồi" vào bất kỳ vị trí nào trong luồng công việc. Hãy nhấp vào nút dấu cộng ("+") trong luồng công việc để thêm nút này:

![Thêm nút](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Thông báo phản hồi sẽ tồn tại dưới dạng một mảng trong suốt quá trình xử lý yêu cầu. Khi bất kỳ nút thông báo phản hồi nào được thực thi trong luồng công việc, nội dung thông báo mới sẽ được thêm vào mảng. Khi máy chủ gửi phản hồi, tất cả các thông báo sẽ được gửi đến máy khách (client) cùng một lúc.

## Cấu hình nút

Nội dung thông báo là một chuỗi mẫu (template string) mà quý vị có thể chèn các biến vào. Quý vị có thể tùy ý sắp xếp nội dung mẫu này trong cấu hình nút:

![Cấu hình nút](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Khi luồng công việc thực thi đến nút này, mẫu sẽ được phân tích cú pháp và tạo ra kết quả nội dung thông báo. Trong cấu hình trên, biến "Biến cục bộ / Lặp qua tất cả sản phẩm / Đối tượng lặp / Sản phẩm / Tiêu đề" sẽ được thay thế bằng một giá trị cụ thể trong luồng công việc thực tế, ví dụ:

```
Sản phẩm “iPhone 14 pro” không đủ hàng tồn kho
```

![Nội dung thông báo](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Cấu hình luồng công việc

Trạng thái của thông báo phản hồi phụ thuộc vào trạng thái thành công hay thất bại của quá trình thực thi luồng công việc. Việc thực thi thất bại của bất kỳ nút nào cũng sẽ khiến toàn bộ luồng công việc thất bại. Trong trường hợp này, nội dung thông báo sẽ được trả về máy khách (client) với trạng thái thất bại và hiển thị thông báo.

Nếu quý vị cần chủ động định nghĩa trạng thái thất bại trong luồng công việc, quý vị có thể sử dụng "Nút kết thúc" và cấu hình nó ở trạng thái thất bại. Khi nút này được thực thi, luồng công việc sẽ thoát với trạng thái thất bại, và thông báo sẽ được trả về máy khách (client) với trạng thái thất bại.

Nếu toàn bộ luồng công việc không tạo ra trạng thái thất bại và thực thi thành công đến cuối, nội dung thông báo sẽ được trả về máy khách (client) với trạng thái thành công.

:::info{title=Lưu ý}
Nếu nhiều nút thông báo phản hồi được định nghĩa trong luồng công việc, các nút đã thực thi sẽ thêm nội dung thông báo vào một mảng. Khi cuối cùng trả về máy khách (client), tất cả nội dung thông báo sẽ được trả về và hiển thị cùng lúc.
:::

## Trường hợp sử dụng

### Luồng công việc "Sự kiện trước thao tác"

Việc sử dụng thông báo phản hồi trong luồng công việc "Sự kiện trước thao tác" cho phép gửi phản hồi thông báo tương ứng đến máy khách (client) sau khi luồng công việc kết thúc. Để biết thêm chi tiết, vui lòng tham khảo [Sự kiện trước thao tác](../triggers/pre-action.md).

### Luồng công việc "Sự kiện thao tác tùy chỉnh"

Việc sử dụng thông báo phản hồi trong "Sự kiện thao tác tùy chỉnh" ở chế độ đồng bộ cho phép gửi phản hồi thông báo tương ứng đến máy khách (client) sau khi luồng công việc kết thúc. Để biết thêm chi tiết, vui lòng tham khảo [Sự kiện thao tác tùy chỉnh](../triggers/custom-action.md).