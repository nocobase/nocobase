:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cơ sở dữ liệu vector

## Giới thiệu

Trong một cơ sở tri thức, cơ sở dữ liệu vector lưu trữ các tài liệu cơ sở tri thức đã được vector hóa. Các tài liệu đã được vector hóa đóng vai trò như một chỉ mục cho các tài liệu đó.

Khi tính năng truy xuất RAG được bật trong cuộc hội thoại của nhân viên AI, tin nhắn của người dùng sẽ được vector hóa. Sau đó, hệ thống truy xuất các đoạn tài liệu cơ sở tri thức từ cơ sở dữ liệu vector để tìm và khớp các đoạn văn bản và nội dung gốc có liên quan.

Hiện tại, plugin cơ sở tri thức AI chỉ hỗ trợ tích hợp sẵn cơ sở dữ liệu vector PGVector, đây là một plugin của cơ sở dữ liệu PostgreSQL.

## Quản lý cơ sở dữ liệu vector

Để quản lý cơ sở dữ liệu vector, hãy truy cập trang cấu hình plugin nhân viên AI, nhấp vào tab `Vector store`, và chọn `Vector database`.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Nhấp vào nút `Add new` ở góc trên bên phải để thêm kết nối cơ sở dữ liệu vector `PGVector` mới:

- Trong ô nhập liệu `Name`, nhập tên kết nối.
- Trong ô nhập liệu `Host`, nhập địa chỉ IP của cơ sở dữ liệu vector.
- Trong ô nhập liệu `Port`, nhập số cổng của cơ sở dữ liệu vector.
- Trong ô nhập liệu `Username`, nhập tên người dùng của cơ sở dữ liệu vector.
- Trong ô nhập liệu `Password`, nhập mật khẩu của cơ sở dữ liệu vector.
- Trong ô nhập liệu `Database`, nhập tên cơ sở dữ liệu.
- Trong ô nhập liệu `Table name`, nhập tên bảng, được sử dụng khi tạo bảng mới để lưu trữ dữ liệu vector.

Sau khi nhập tất cả thông tin cần thiết, nhấp vào nút `Test` để kiểm tra xem dịch vụ cơ sở dữ liệu vector có khả dụng hay không, sau đó nhấp vào nút `Submit` để lưu thông tin kết nối.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)