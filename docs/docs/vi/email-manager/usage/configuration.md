---
pkg: "@nocobase/plugin-email-manager"
---

:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Cấu hình Khối

## Khối Tin nhắn Email

### Thêm Khối

Trên trang cấu hình, nhấp vào nút **Tạo khối**, sau đó chọn khối **Tin nhắn Email (Tất cả)** hoặc **Tin nhắn Email (Cá nhân)** để thêm khối tin nhắn email.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Cấu hình Trường

Nhấp vào nút **Trường** của khối để chọn các trường cần hiển thị. Để biết chi tiết, vui lòng tham khảo phương pháp cấu hình trường cho bảng.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Cấu hình Lọc Dữ liệu

Nhấp vào biểu tượng cấu hình ở bên phải bảng và chọn **Phạm vi dữ liệu** để thiết lập phạm vi dữ liệu lọc email.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Bạn có thể lọc email có cùng hậu tố thông qua các biến:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Khối Chi tiết Email

Đầu tiên, hãy bật tính năng **Bật nhấp để mở** trên một trường trong khối tin nhắn email:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Thêm khối **Chi tiết Email** vào cửa sổ bật lên:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Bạn có thể xem nội dung chi tiết của email:
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Bạn có thể tự cấu hình các nút cần thiết ở phía dưới.

## Khối Gửi Email

Có hai cách để tạo biểu mẫu gửi email:

1. Thêm nút **Gửi email** ở đầu bảng:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Thêm khối **Gửi email**:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Cả hai cách đều có thể tạo một biểu mẫu gửi email hoàn chỉnh:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Mỗi trường trong biểu mẫu email đều nhất quán với một biểu mẫu thông thường và có thể được cấu hình với **Giá trị mặc định** hoặc **Quy tắc liên kết**, v.v.

> Các biểu mẫu trả lời và chuyển tiếp email ở cuối chi tiết email mặc định mang theo một số xử lý dữ liệu, có thể được sửa đổi thông qua **Luồng sự kiện**.