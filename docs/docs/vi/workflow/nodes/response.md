---
pkg: "@nocobase/plugin-workflow-response-message"
---

:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Phản hồi HTTP

## Giới thiệu

Nút này chỉ được hỗ trợ trong các luồng công việc Webhook đồng bộ và dùng để gửi phản hồi về cho hệ thống bên thứ ba. Ví dụ, trong quá trình xử lý phản hồi thanh toán, nếu quy trình nghiệp vụ gặp phải kết quả không mong muốn (như lỗi hoặc thất bại), bạn có thể sử dụng nút phản hồi để gửi thông báo lỗi về hệ thống bên thứ ba, giúp một số hệ thống bên thứ ba có thể thử lại sau dựa trên trạng thái.

Ngoài ra, việc thực thi nút phản hồi sẽ chấm dứt quá trình thực thi của luồng công việc, và các nút tiếp theo sẽ không được thực hiện. Nếu toàn bộ luồng công việc không được cấu hình nút phản hồi, hệ thống sẽ tự động phản hồi dựa trên trạng thái thực thi của luồng: trả về `200` khi thực thi thành công và `500` khi thực thi thất bại.

## Tạo nút Phản hồi

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Phản hồi”:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Cấu hình Phản hồi

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Bạn có thể sử dụng các biến từ ngữ cảnh của luồng công việc trong phần thân phản hồi.