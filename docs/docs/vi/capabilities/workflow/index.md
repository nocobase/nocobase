---
title: 'Tổng quan Workflow'
description: 'Định nghĩa quy trình nhiều bước, chờ con người, kết quả từ bên ngoài hoặc thời hạn, và theo dõi việc thực thi.'
---

# Tổng quan Workflow

**Workflow định nghĩa và thực thi một quy trình nghiệp vụ bằng cách kết nối các thao tác, điều kiện thực thi và quy tắc chuyển trạng thái.** Workflow kiểm soát trình tự các bước, điều kiện cần để đi tiếp và cách xử lý việc chờ, hết thời gian và lỗi thực thi.

Ví dụ, phân công tài xế, nhận đơn vận chuyển và xác nhận giao hàng đều có thao tác và điều kiện riêng. Workflow đẩy đơn hàng đi tiếp theo các quy tắc này và giữ lại tiến độ cùng lịch sử xử lý.

## Các năng lực sẵn có

| Năng lực                                                 | Cung cấp gì                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Định nghĩa quy trình và kiểm soát thao tác](./definition.md)   | Giai đoạn, thao tác, điều kiện và nhánh, đầu vào bắt buộc, và bảo vệ chống bỏ bước hoặc cập nhật xung đột. |
| [Chờ, hết thời gian và thực thi tin cậy](./execution.md) | Chờ con người hoặc kết quả từ bên ngoài, xử lý thời hạn, thử lại khi thất bại và tránh xử lý cùng một yêu cầu hai lần.      |
| [Tiến độ và lịch sử xử lý](./progress.md)           | Hiển thị giai đoạn hiện tại, các đường đã đi qua, người thực hiện, thời điểm và thông tin đã nộp.                                  |

Các trang sau dùng đơn vận chuyển của Northstar để minh họa kiểm soát thao tác và lịch sử, sau đó dùng việc xuất báo cáo ở chế độ nền để minh họa việc chờ và kết quả thực thi.

## Khi nào dùng Workflow

Dùng Workflow cho các nghiệp vụ có nhiều giai đoạn, khoảng thời gian chờ hoặc thao tác tiếp theo sau khi thất bại. Giao hàng, xuất hóa đơn, xuất dữ liệu, gia hạn và phiếu xử lý sự cố là những ví dụ điển hình.

Dùng [Thông báo](../notification.md) để gửi tin nhắn sau khi dữ liệu thay đổi, và [Tác vụ định kỳ](../scheduler.md) cho tác vụ chạy vào thời điểm cố định. Workflow kết nối các thao tác này quanh một bản ghi nghiệp vụ và tiếp tục cho đến khi quy trình kết thúc.

Xác nhận hoặc từ chối đơn giản có thể là thao tác của Workflow. Dùng [Phê duyệt](../approval/index.md) cho quyết định nhiều cấp, duyệt đồng thuận, thêm người duyệt và phân công lại.

## Xây dựng và thay đổi quy trình

Mô tả giai đoạn, điều kiện, khoảng thời gian chờ và cách xử lý lỗi cho Agent, Agent sẽ phát triển quy trình vào ứng dụng. Các trang quy trình có thể được thiết kế tự do theo nhu cầu nghiệp vụ.
