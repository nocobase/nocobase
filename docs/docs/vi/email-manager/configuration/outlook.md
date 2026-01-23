---
pkg: "@nocobase/plugin-email-manager"
---

:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Cấu hình Microsoft

### Điều kiện tiên quyết
Để người dùng có thể kết nối hộp thư Outlook của họ với NocoBase, bạn cần triển khai NocoBase trên một máy chủ có khả năng truy cập các dịch vụ của Microsoft. Hệ thống backend sẽ gọi các API của Microsoft.

### Đăng ký tài khoản

1. Truy cập https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Đăng nhập vào tài khoản Microsoft của bạn.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Tạo Tenant

1. Truy cập https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount và đăng nhập vào tài khoản của bạn.
    
2. Điền thông tin cơ bản và lấy mã xác minh.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Điền các thông tin khác và tiếp tục.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Điền thông tin thẻ tín dụng (bạn có thể bỏ qua bước này).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Lấy Client ID

1. Nhấp vào menu trên cùng và chọn "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Chọn "App registrations" ở bên trái.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Nhấp vào "New registration" ở trên cùng.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Điền thông tin và gửi.

Tên có thể đặt tùy ý. Đối với loại tài khoản (account types), hãy chọn tùy chọn như trong hình bên dưới. Bạn có thể để trống Redirect URI ở bước này.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Lấy Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Ủy quyền API

1. Mở menu "API permissions" ở bên trái.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Nhấp vào nút "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Nhấp vào "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Tìm kiếm và thêm các quyền sau. Kết quả cuối cùng sẽ hiển thị như hình bên dưới.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (Mặc định)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Lấy Secret

1. Nhấp vào "Certificates & secrets" ở bên trái.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Nhấp vào nút "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Điền mô tả và thời gian hết hạn, sau đó nhấp vào Thêm.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Lấy Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Sao chép Client ID và Client secret rồi dán vào trang cấu hình email.

![](https://static-docs.nocobase.com/mail-1733818630710.png)