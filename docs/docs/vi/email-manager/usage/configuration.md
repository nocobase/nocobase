---
pkg: "@nocobase/plugin-email-manager"
title: "Cấu hình Email Block"
description: "Block bảng Email: thêm block, cấu hình field, phạm vi dữ liệu (tất cả/người dùng hiện tại), lọc theo địa chỉ Email hoặc đuôi Email."
keywords: "Email block,bảng Email,phạm vi dữ liệu,lọc Email,NocoBase"
---
# Cấu hình Block

## Block Email message

### Thêm block

Trong trang cấu hình, click nút **Tạo block**, chọn block **Email Table** để thêm block Email message.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_56_PM.png)

### Cấu hình field

Click nút **Field** của block để chọn các field cần hiển thị, các thao tác chi tiết có thể tham khảo cấu hình field của bảng.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM.png)

### Đặt phạm vi dữ liệu
Cấu hình phía bên phải block có thể chọn phạm vi dữ liệu: Tất cả Email hoặc Email của người dùng đang đăng nhập.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM%20(1).png)

### Lọc dữ liệu theo địa chỉ Email

Click nút cấu hình bên phải block Email message, chọn **Phạm vi dữ liệu**, thiết lập phạm vi dữ liệu để lọc Email.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Cấu hình điều kiện lọc, chọn field địa chỉ Email cần lọc, click **OK** để lưu.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_26_PM.png)

Block Email message sẽ hiển thị các Email phù hợp với điều kiện lọc.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_29_PM.png)

> Lọc theo địa chỉ Email không phân biệt chữ hoa chữ thường.

### Lọc dữ liệu theo đuôi Email

Trong bảng nghiệp vụ, tạo field để lưu trữ đuôi Email (kiểu JSON) để sau này lọc Email message.

![](https://static-docs.nocobase.com/email-manager/data-source-manager-main-NocoBase-12-02-2025_04_36_PM.png)

Duy trì thông tin đuôi Email.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_38_PM.png)

Click nút cấu hình bên phải block Email message, chọn **Phạm vi dữ liệu**, thiết lập phạm vi dữ liệu để lọc Email.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Cấu hình điều kiện lọc, chọn field đuôi Email cần lọc, click **OK** để lưu.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_41_PM.png)

Bảng Email message sẽ hiển thị các Email phù hợp với điều kiện lọc.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_48_PM.png)

## Block chi tiết Email

Đầu tiên bật tính năng **Bật click để mở** trong field của block Email message.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_01_PM.png)

Trong popup, thêm block **Chi tiết Email**.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_02_PM.png)

Có thể xem nội dung chi tiết của Email.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_03_PM.png)

Phía dưới có thể tùy chỉnh cấu hình các nút cần thiết.

> Nếu Email hiện tại ở trạng thái nháp, mặc định sẽ hiển thị form chỉnh sửa nháp.

## Block gửi Email

Có hai cách để tạo form gửi Email:

1. Thêm nút **Gửi Email** ở phía trên bảng:  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_04_PM.png)

2. Thêm block **Gửi Email**:  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM.png)

Cả hai cách đều có thể tạo ra form gửi Email hoàn chỉnh.

![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM%20(1).png)

Mỗi field của form Email giống như form thông thường, có thể cấu hình **Giá trị mặc định** hoặc **Quy tắc liên kết**, v.v.
