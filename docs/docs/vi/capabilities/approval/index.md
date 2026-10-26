---
title: 'Tổng quan phê duyệt'
---

# Tổng quan phê duyệt

**Phê duyệt tổ chức việc xem xét và ra quyết định cho các yêu cầu nghiệp vụ, xác định ai duyệt, theo thứ tự nào và thế nào thì được coi là phê duyệt.** Phê duyệt điều phối nhiều ý kiến, hỗ trợ thêm người duyệt, chuyển giao và trả lại, đồng thời ghi lại các quyết định và thay đổi trách nhiệm.

## Các năng lực sẵn có

| Năng lực                                             | Cung cấp gì                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [Nhiều giai đoạn và định tuyến theo điều kiện](./stages.md) | Người duyệt tuần tự và tuyến duyệt theo số tiền hoặc loại yêu cầu.                                 |
| [Duyệt đồng thuận và quy tắc thông qua](./joint-review.md)   | Quyết định kiểu tất cả, bất kỳ, người trả lời đầu tiên hoặc theo ngưỡng phiếu giữa nhiều người tham gia.                  |
| [Thêm người duyệt và chuyển giao](./handover.md)         | Thêm người duyệt hoặc giao tác vụ hiện tại cho một người đủ điều kiện.                                     |
| [Xử lý yêu cầu và tiến độ](./requests.md)         | Trả lại để chỉnh sửa, rút lại, nộp lại, sao gửi và xác nhận đã xem, tiến độ và lịch sử. |

Các yêu cầu vận chuyển đặc biệt của Northstar minh họa các năng lực này: người nộp đơn đề nghị chi phí phát sinh, bộ phận vận hành và tài chính duyệt theo chính sách, và những người khác tham gia khi cần.

## Thiết kế các trang

Các trang phê duyệt có thể được thiết kế tự do theo nhu cầu nghiệp vụ. Nhúng chúng vào chi tiết đơn hàng hoặc chi phí, hoặc cung cấp các danh sách Yêu cầu của tôi, Chờ duyệt, Đã duyệt và Sao gửi cho tôi. Xem trước tuyến duyệt dự kiến trước khi nộp và hiển thị người duyệt hiện tại cùng tiến độ sau khi nộp.

## Tích hợp phê duyệt

Phê duyệt dùng plugin Pro `@nocobase/app-plugin-approval`, cần có giấy phép và phiên bản tương thích. Hãy mô tả yêu cầu nghiệp vụ phê duyệt cho Agent để xây dựng trang yêu cầu, tác vụ và trang chi tiết. Giữ thông tin xác thực trong cấu hình phía server.

Dùng [Workflow](../workflow/index.md) cho việc xác nhận đơn giản bởi một người, và dùng năng lực phê duyệt cho luân chuyển nhiều giai đoạn, phối hợp quyết định và quản lý tác vụ.

:::tip Lưu ý quan trọng

Phê duyệt là một quyết định; thanh toán, giữ chỗ tài nguyên và cập nhật bản ghi chính thức là bước thực thi sau đó. Hãy hiển thị kết quả thực thi và xác định cách thử lại hoặc chuyển cho người xử lý khi thất bại, để trạng thái Đã phê duyệt không bị hiểu nhầm là đã thực thi thành công.

:::
