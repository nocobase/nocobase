---
title: 'Tài liệu tham khảo cho lập trình viên'
---

# Tài liệu tham khảo cho lập trình viên

Dành cho lập trình viên xem xét hoặc mở rộng mã được tạo. Người dùng nghiệp vụ có thể bắt đầu với [Định nghĩa quy trình và kiểm soát thao tác](./definition.md).

## Vì sao kết quả xử lý và kết quả thông báo tách biệt

Khi tài xế nộp bằng chứng giao hàng, hãy lưu giai đoạn đơn hàng, bằng chứng và lịch sử cùng lúc để đơn đã giao không bao giờ mất bằng chứng. Thông báo cho nhân viên quản lý khách hàng hoặc gọi hệ thống bên ngoài sau khi đã lưu các bản ghi này. Giữ lại và thử lại các công việc bên ngoài bị lỗi mà không hoàn tác việc giao hàng.

Lập trình viên chọn điểm mở rộng dựa trên các yêu cầu nghiệp vụ này: kiểm tra đầu vào và điều kiện trước khi ghi, lưu dữ liệu nghiệp vụ liên quan cùng với thao tác, và theo dõi các thông báo hoặc lời gọi ra bên ngoài tiếp theo như công việc có thể thử lại. Các sự kiện chỉ dùng để làm mới trang không đảm bảo gửi tin cậy.

## Bảng và trao đổi có sẵn

Bổ sung trạng thái, thời điểm vào giai đoạn, phiên bản, lịch sử và nơi lưu effect run. Ánh xạ dữ liệu hiện có vào các giai đoạn và chặn việc ghi trạng thái trực tiếp trong biểu mẫu, chức năng nhập và API.

Các trường mặc định là `status`, `statusChangedAt` và `lifecycleVersion`, có thể cấu hình tên. Ứng dụng hoặc plugin sở hữu cung cấp migration.

Các trao đổi lặp lại trong một giai đoạn nên nằm trong bản ghi riêng. Kết thúc trao đổi và đẩy bản ghi nghiệp vụ đi tiếp một cách nhất quán; phản hồi đến muộn không được mở lại các trao đổi đã kết thúc.

## API và tích hợp

Các plugin khác có thể thêm điều kiện bằng `addGuard()` và giữ lại hàm gỡ bỏ của nó. Việc tạo có các guard riêng. Đăng ký sự kiện dùng để cập nhật UI hoặc chỉ mục; công việc cần tin cậy dùng effect.

| Lối vào                         | Mục đích                                 |
| ----------------------------- | --------------------------------------- |
| `@nocobase/lifecycle`         | Định nghĩa, runtime, lưu trữ, sơ đồ |
| `@nocobase/lifecycle/jobs`    | Effect, thời hạn, khôi phục            |
| `@nocobase/lifecycle/react`   | Chế độ xem bản ghi và thao tác                |
| `@nocobase/lifecycle/testing` | Lưu trữ trong bộ nhớ và đồng hồ có thể điều chỉnh    |

Dùng các phương thức tạo và xử lý, tính khả dụng, chế độ xem, mô tả và lịch sử. Ứng dụng sở hữu các route HTTP nghiệp vụ đã xác thực và phân quyền; thư viện không cung cấp route nào.

Các thao tác chỉ dành cho hệ thống dùng `manual: false`. Chuyển các lỗi về điều kiện, đầu vào, trạng thái và phiên bản thành phản hồi trong ứng dụng mà không ghi đè công việc đồng thời.

## Giới hạn

Không cung cấp trình thiết kế kéo thả, giai đoạn lồng nhau hay nhánh song song tổng quát. Hãy phối hợp các bản ghi con cho công việc nghiệp vụ song song. Phân quyền vẫn tách biệt; các quyết định phức tạp của con người dùng phê duyệt.
