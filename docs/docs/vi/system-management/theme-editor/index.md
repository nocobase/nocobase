:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trình chỉnh sửa chủ đề

> Tính năng chủ đề hiện tại được triển khai dựa trên Ant Design 5.x. Chúng tôi khuyến nghị bạn nên tìm hiểu về các khái niệm liên quan đến [tùy chỉnh chủ đề](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98) trước khi đọc tài liệu này.

## Giới thiệu

Plugin Trình chỉnh sửa chủ đề được dùng để sửa đổi kiểu dáng của toàn bộ trang giao diện người dùng (frontend). Hiện tại, plugin này hỗ trợ chỉnh sửa các [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken) và [AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken) ở phạm vi toàn cục, đồng thời cho phép [chuyển đổi](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95) sang `Chế độ tối` và `Chế độ nhỏ gọn`. Trong tương lai, plugin có thể hỗ trợ tùy chỉnh chủ đề ở [cấp độ thành phần](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token).

## Hướng dẫn sử dụng

### Bật plugin Trình chỉnh sửa chủ đề

Đầu tiên, hãy cập nhật NocoBase lên phiên bản mới nhất (v0.11.1 trở lên). Sau đó, tìm kiếm thẻ `Trình chỉnh sửa chủ đề` trên trang Quản lý plugin. Nhấp vào nút `Bật` ở góc dưới bên phải của thẻ và chờ trang tải lại.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Truy cập trang cấu hình chủ đề

Sau khi bật plugin, hãy nhấp vào nút cài đặt ở góc dưới bên trái của thẻ để truy cập trang chỉnh sửa chủ đề. Theo mặc định, có bốn tùy chọn chủ đề: `Chủ đề mặc định`, `Chủ đề tối`, `Chủ đề nhỏ gọn` và `Chủ đề tối nhỏ gọn`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Thêm chủ đề mới

Nhấp vào nút `Thêm chủ đề mới` và chọn `Tạo một chủ đề hoàn toàn mới`. Trình chỉnh sửa chủ đề sẽ hiện ra ở phía bên phải trang, cho phép bạn chỉnh sửa các tùy chọn như `Màu sắc`, `Kích thước`, `Kiểu dáng`, v.v. Sau khi chỉnh sửa, hãy nhập tên chủ đề và nhấp vào lưu để hoàn tất việc tạo chủ đề.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Áp dụng chủ đề mới

Di chuyển chuột đến góc trên bên phải của trang, bạn sẽ thấy tùy chọn chuyển đổi chủ đề. Nhấp vào đó để chuyển sang các chủ đề khác, chẳng hạn như chủ đề vừa được thêm.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Chỉnh sửa chủ đề hiện có

Nhấp vào nút `Chỉnh sửa` ở góc dưới bên trái của thẻ. Trình chỉnh sửa chủ đề sẽ hiện ra ở phía bên phải trang (tương tự như khi thêm chủ đề mới). Sau khi chỉnh sửa, hãy nhấp vào lưu để hoàn tất việc sửa đổi chủ đề.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Cài đặt chủ đề người dùng có thể chọn

Các chủ đề mới được thêm vào mặc định cho phép người dùng chuyển đổi. Nếu bạn không muốn người dùng chuyển sang một chủ đề cụ thể, bạn có thể tắt công tắc `Người dùng có thể chọn` ở góc dưới bên phải của thẻ chủ đề. Khi đó, người dùng sẽ không thể chuyển sang chủ đề đó.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Đặt làm chủ đề mặc định

Ban đầu, chủ đề mặc định là `Chủ đề mặc định`. Nếu bạn muốn đặt một chủ đề cụ thể làm chủ đề mặc định, bạn có thể bật công tắc `Chủ đề mặc định` ở góc dưới bên phải của thẻ chủ đề đó. Điều này đảm bảo rằng khi người dùng mở trang lần đầu tiên, họ sẽ thấy chủ đề này. Lưu ý: Không thể xóa chủ đề mặc định.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Xóa chủ đề

Nhấp vào nút `Xóa` bên dưới thẻ, sau đó nhấp vào xác nhận trong hộp thoại bật lên để xóa chủ đề.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)