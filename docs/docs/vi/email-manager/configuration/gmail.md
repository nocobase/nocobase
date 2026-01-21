---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Cấu hình Google

### Điều kiện tiên quyết

Để người dùng có thể kết nối tài khoản Google Mail của họ với NocoBase, NocoBase phải được triển khai trên một máy chủ có khả năng truy cập các dịch vụ của Google, vì hệ thống backend sẽ gọi API của Google.
    
### Đăng ký tài khoản

1. Mở https://console.cloud.google.com/welcome để truy cập Google Cloud.
2. Lần đầu truy cập, quý vị cần đồng ý với các điều khoản và điều kiện liên quan.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Tạo ứng dụng

1. Nhấp vào "Select a project" ở phía trên cùng.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Nhấp vào nút "NEW PROJECT" trong cửa sổ bật lên.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Điền thông tin dự án.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Sau khi dự án được tạo, hãy chọn dự án đó.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Bật Gmail API

1. Nhấp vào nút "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Truy cập bảng điều khiển APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Tìm kiếm "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Nhấp vào nút "ENABLE" để bật Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Cấu hình màn hình đồng ý OAuth

1. Nhấp vào menu "OAuth consent screen" ở bên trái.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Chọn "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Điền thông tin dự án (thông tin này sẽ hiển thị trên trang ủy quyền) và nhấp lưu.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Điền thông tin liên hệ nhà phát triển (Developer contact information) và nhấp tiếp tục.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Nhấp tiếp tục.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Thêm người dùng thử nghiệm để kiểm tra trước khi ứng dụng được phát hành.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Nhấp tiếp tục.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Xem lại thông tin tổng quan và quay lại bảng điều khiển.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Tạo thông tin xác thực (Credentials)

1. Nhấp vào menu "Credentials" ở bên trái.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Nhấp vào nút "CREATE CREDENTIALS" và chọn "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Chọn "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Điền thông tin ứng dụng.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Nhập tên miền triển khai cuối cùng của dự án (ví dụ ở đây là địa chỉ thử nghiệm của NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Thêm URI chuyển hướng được ủy quyền. URI này phải là `tên miền + "/admin/settings/mail/oauth2"`. Ví dụ: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Nhấp tạo để xem thông tin OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Sao chép Client ID và Client secret rồi dán vào trang cấu hình email.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Nhấp lưu để hoàn tất cấu hình.

### Phát hành ứng dụng

Sau khi hoàn tất quy trình trên và kiểm tra các tính năng như đăng nhập ủy quyền của người dùng thử nghiệm, gửi email, quý vị có thể phát hành ứng dụng.

1. Nhấp vào menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Nhấp vào nút "EDIT APP", sau đó nhấp vào nút "SAVE AND CONTINUE" ở phía dưới.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Nhấp vào nút "ADD OR REMOVE SCOPES" để chọn phạm vi quyền của người dùng.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Tìm kiếm "Gmail API", sau đó chọn "Gmail API" (xác nhận giá trị Scope là Gmail API với "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Nhấp vào nút "UPDATE" ở phía dưới để lưu.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Nhấp vào nút "SAVE AND CONTINUE" ở cuối mỗi trang, và cuối cùng nhấp vào nút "BACK TO DASHBOARD" để quay lại trang bảng điều khiển.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Nhấp vào nút "PUBLISH APP". Một trang xác nhận phát hành sẽ xuất hiện, liệt kê các thông tin cần thiết để phát hành. Sau đó, nhấp vào nút "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Quay lại trang bảng điều khiển, quý vị sẽ thấy trạng thái phát hành là "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Nhấp vào nút "PREPARE FOR VERIFICATION", điền các thông tin bắt buộc và nhấp vào nút "SAVE AND CONTINUE" (dữ liệu trong hình chỉ mang tính chất minh họa).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Tiếp tục điền các thông tin cần thiết (dữ liệu trong hình chỉ mang tính chất minh họa).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Nhấp vào nút "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Nhấp vào nút "SUBMIT FOR VERIFICATION" để gửi yêu cầu xác minh.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Chờ kết quả phê duyệt.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Trong trường hợp yêu cầu phê duyệt chưa được thông qua, người dùng có thể nhấp vào liên kết không an toàn (unsafe link) để ủy quyền và đăng nhập.

![](https://static-docs.nocobase.com/mail-1735633689645.png)