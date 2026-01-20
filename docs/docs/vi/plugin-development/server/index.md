:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

Phát triển plugin phía máy chủ của NocoBase cung cấp nhiều chức năng và khả năng, giúp nhà phát triển tùy chỉnh và mở rộng các tính năng cốt lõi của NocoBase. Dưới đây là các khả năng chính và các chương liên quan trong quá trình phát triển plugin phía máy chủ của NocoBase:

| Chức năng                  | Mô tả                                           | Chương liên quan                                      |
|---------------------------|------------------------------------------------|-----------------------------------------------|
| **Lớp Plugin**               | Tạo và quản lý các plugin phía máy chủ, mở rộng chức năng cốt lõi             | [plugin.md](plugin.md)                       |
| **Thao tác cơ sở dữ liệu**             | Cung cấp các giao diện để thao tác với cơ sở dữ liệu, hỗ trợ các hoạt động CRUD và quản lý giao dịch | [database.md](database.md)                    |
| **Bộ sưu tập tùy chỉnh**           | Tùy chỉnh cấu trúc bảng cơ sở dữ liệu (bộ sưu tập) theo nhu cầu kinh doanh để quản lý mô hình dữ liệu linh hoạt | [collections.md](collections.md)              |
| **Xử lý tương thích dữ liệu khi nâng cấp plugin** | Đảm bảo việc nâng cấp plugin không ảnh hưởng đến dữ liệu hiện có bằng cách thực hiện di chuyển và xử lý tương thích dữ liệu | [migration.md](migration.md)                  |
| **Quản lý nguồn dữ liệu bên ngoài**         | Tích hợp và quản lý các nguồn dữ liệu bên ngoài để cho phép tương tác dữ liệu             | [data-source-manager.md](data-source-manager.md) |
| **API tùy chỉnh**             | Mở rộng quản lý tài nguyên API bằng cách viết các giao diện (API) tùy chỉnh               | [resource-manager.md](resource-manager.md)    |
| **Quản lý quyền API**           | Tùy chỉnh quyền API để kiểm soát truy cập chi tiết             | [acl.md](acl.md)                              |
| **Chặn và lọc yêu cầu/phản hồi API** | Thêm các bộ chặn (interceptor) hoặc middleware cho yêu cầu và phản hồi để xử lý các tác vụ như ghi nhật ký, xác thực, v.v. | [context.md](context.md) và [middleware.md](middleware.md) |
| **Lắng nghe sự kiện**               | Lắng nghe các sự kiện hệ thống (ví dụ: từ ứng dụng hoặc cơ sở dữ liệu) và kích hoạt các trình xử lý tương ứng       | [event.md](event.md)                          |
| **Quản lý bộ nhớ đệm**               | Quản lý bộ nhớ đệm để cải thiện hiệu suất ứng dụng và tốc độ phản hồi               | [cache.md](cache.md)                          |
| **Tác vụ định kỳ**               | Tạo và quản lý các tác vụ định kỳ, chẳng hạn như dọn dẹp định kỳ, đồng bộ hóa dữ liệu, v.v.     | [cron-job-manager.md](cron-job-manager.md)    |
| **Hỗ trợ đa ngôn ngữ**             | Tích hợp hỗ trợ đa ngôn ngữ để triển khai quốc tế hóa và bản địa hóa             | [i18n.md](i18n.md)                            |
| **Xuất nhật ký**               | Tùy chỉnh định dạng và phương thức xuất nhật ký để nâng cao khả năng gỡ lỗi và giám sát   | [logger.md](logger.md)                        |
| **Lệnh tùy chỉnh**             | Mở rộng NocoBase CLI bằng cách thêm các lệnh tùy chỉnh               | [command.md](command.md)                      |
| **Viết trường hợp kiểm thử**           | Viết và chạy các trường hợp kiểm thử để đảm bảo tính ổn định và độ chính xác chức năng của plugin | [test.md](test.md)                            |