---
pkg: "@nocobase/plugin-email-manager"
title: "Cấu hình Gmail"
description: "Tích hợp Email Gmail: đăng ký Google Cloud, tạo dự án, kích hoạt Gmail API, OAuth client, Client ID/Secret, cấu hình callback URL."
keywords: "Cấu hình Gmail,Google Cloud,OAuth client,Gmail API,Client ID,NocoBase"
---

# Cấu hình Google

### Điều kiện tiên quyết

Để người dùng có thể tích hợp Email Google vào NocoBase, phải triển khai trên server hỗ trợ truy cập dịch vụ Google, backend sẽ gọi Google API
    
### Đăng ký tài khoản

1. Mở https://console.cloud.google.com/welcome để vào Google Cloud  
2. Lần đầu vào cần đồng ý các điều khoản liên quan
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Tạo App

1. Click "Select a project" ở phía trên
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Click nút "NEW PROJECT" trong popup

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Điền thông tin dự án
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Sau khi dự án được tạo xong, chọn dự án

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Kích hoạt Gmail API

1. Click nút "APIs & Services"

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Vào panel APIs & Services

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Tìm kiếm **mail**

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Click nút **ENABLE** để kích hoạt Gmail API

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Cấu hình OAuth consent screen

1. Click menu "OAuth consent screen" bên trái

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Chọn **External**

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Điền thông tin dự án (dùng để hiển thị trên trang ủy quyền sau này) click lưu

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Điền Developer contact information, click tiếp tục

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Click tiếp tục

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Thêm test user, dùng để test trước khi App phát hành

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Click tiếp tục

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Xem thông tin tổng quan, quay lại bảng điều khiển

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Tạo Credentials

1. Click menu **Credentials** bên trái

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Click nút "CREATE CREDENTIALS", chọn "OAuth client ID"

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Chọn "Web application"

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Điền thông tin ứng dụng

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Điền tên miền cuối cùng nơi dự án sẽ được triển khai (ở đây ví dụ là địa chỉ test của NocoBase)

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Thêm địa chỉ callback ủy quyền, phải là `tên miền + "/admin/settings/mail/oauth2"`, ví dụ: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Click Create, có thể xem thông tin OAuth

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Lần lượt sao chép nội dung Client ID và Client Secret điền vào trang cấu hình Email

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Click lưu, hoàn tất cấu hình  

### Phát hành ứng dụng

Sau khi quy trình trên hoàn tất, cùng với việc test user đăng nhập ủy quyền, gửi Email và các tính năng khác đã được test xong thì tiến hành phát hành

1. Click menu "OAuth consent screen"

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Click nút "EDIT APP", sau đó click nút "SAVE AND CONTINUE" ở phía dưới

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Click nút "ADD OR REMOVE SCOPES", tích chọn phạm vi quyền người dùng

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Nhập "Gmail API" để tìm kiếm, sau đó tích chọn "Gmail API" (xác nhận giá trị Scope là "https://mail.google.com/" của Gmail API)

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Click nút **UPDATE** ở phía dưới để lưu

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Click nút "SAVE AND CONTINUE" ở phía dưới mỗi trang, cuối cùng click nút "BACK TO DASHBOARD" để quay lại trang bảng điều khiển

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Sau khi click nút **PUBLISH APP** sẽ xuất hiện trang xác nhận phát hành, liệt kê các thông tin cần cung cấp khi phát hành. Sau đó click nút **CONFIRM**

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Quay lại trang console, có thể thấy trạng thái phát hành là "In production"

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Click nút "PREPARE FOR VERIFICATION", điền các thông tin bắt buộc liên quan, click nút "SAVE AND CONTINUE" (dữ liệu trong hình chỉ là ví dụ)

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Tiếp tục điền các thông tin cần thiết liên quan (dữ liệu trong hình chỉ là ví dụ)

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Click nút "SAVE AND CONTINUE"

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Click nút "SUBMIT FOR VERIFICATION", gửi Verification

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Chờ kết quả phê duyệt

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Trong trường hợp phê duyệt chưa thông qua, người dùng có thể click vào liên kết unsafe để đăng nhập ủy quyền

![](https://static-docs.nocobase.com/mail-1735633689645.png)
