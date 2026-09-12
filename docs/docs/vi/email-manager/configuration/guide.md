---
pkg: "@nocobase/plugin-email-manager"
title: "Quy trình cấu hình Email"
description: "Quy trình cấu hình: lấy Client ID/Secret từ nhà cung cấp, redirect URI, cấu hình nhà cung cấp Email, đăng nhập ủy quyền OAuth, tích hợp Email, đồng bộ dữ liệu."
keywords: "Cấu hình Email,Client ID,Client Secret,OAuth,NocoBase"
---
# Quy trình cấu hình

## Tổng quan
Sau khi bật plugin Email, quản trị viên cần hoàn thành cấu hình liên quan thì người dùng thông thường mới có thể tích hợp tài khoản Email vào NocoBase (hiện tại chỉ hỗ trợ đăng nhập ủy quyền cho tài khoản Outlook và Gmail, không hỗ trợ tích hợp trực tiếp tài khoản Microsoft và tài khoản Google).

Cốt lõi của cấu hình nằm ở thiết lập xác thực gọi API của nhà cung cấp dịch vụ Email. Quản trị viên cần hoàn thành các bước sau để đảm bảo tính năng plugin hoạt động bình thường:

1. **Lấy thông tin xác thực từ nhà cung cấp**  
   - Đăng nhập vào console nhà phát triển của nhà cung cấp dịch vụ Email (như Google Cloud Console hoặc Microsoft Azure Portal).  
   - Tạo ứng dụng hoặc dự án mới, kích hoạt dịch vụ API Email tương ứng.  
   - Lấy Client ID và Client Secret.  
   - Cấu hình redirect URI, đảm bảo khớp với địa chỉ callback của plugin NocoBase.

2. **Cấu hình nhà cung cấp dịch vụ Email**  
   - Vào trang cấu hình của plugin Email.  
   - Điền thông tin xác thực API (Client ID, Client Secret, v.v.) cần thiết, đảm bảo việc kết nối ủy quyền với nhà cung cấp dịch vụ Email hoạt động bình thường.

3. **Đăng nhập ủy quyền**  
   - Người dùng đăng nhập tài khoản Email thông qua giao thức OAuth.  
   - Plugin sẽ tự động tạo và lưu trữ token ủy quyền của người dùng để dùng cho các lần gọi API và thao tác Email sau này.

4. **Tích hợp Email**  
   - Sau khi người dùng ủy quyền thành công, tài khoản Email của họ sẽ được tích hợp vào NocoBase.  
   - Plugin sẽ đồng bộ dữ liệu Email của người dùng và cung cấp các tính năng quản lý, gửi nhận Email.

5. **Sử dụng tính năng Email**  
   - Người dùng có thể trực tiếp xem, quản lý và gửi Email trong nền tảng.  
   - Mọi thao tác đều được thực hiện thông qua việc gọi API của nhà cung cấp dịch vụ Email, đảm bảo đồng bộ thời gian thực và truyền tải hiệu quả.  

Thông qua quy trình trên, plugin Email của NocoBase có thể cung cấp dịch vụ quản lý Email hiệu quả và an toàn cho người dùng. Nếu gặp vấn đề trong quá trình cấu hình, vui lòng tham khảo tài liệu liên quan hoặc liên hệ đội ngũ hỗ trợ kỹ thuật.

## Cấu hình plugin

### Kích hoạt plugin Email

1. Vào trang quản lý plugin
2. Tìm plugin "Email manager" và kích hoạt

### Cấu hình nhà cung cấp Email

Sau khi plugin Email được kích hoạt, có thể cấu hình nhà cung cấp Email. Click **Cài đặt** > **Cấu hình Email** ở phía trên để vào trang cấu hình.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Trong mỗi nhà cung cấp đều cần điền Client Id và Client Secret. Phía dưới sẽ giới thiệu chi tiết cách lấy hai tham số này.


  

