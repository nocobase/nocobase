:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Thêm bộ xác thực trong NocoBase

Đầu tiên, hãy thêm một bộ xác thực mới trong NocoBase: Cài đặt Plugin - Xác thực người dùng - Thêm - OIDC.

Sao chép URL gọi lại.

![](https://static-docs.nocobase.com/202412021504114.png)

## Đăng ký ứng dụng

Mở trung tâm quản lý Microsoft Entra và đăng ký một ứng dụng mới.

![](https://static-docs.nocobase.com/202412021506837.png)

Dán URL gọi lại mà bạn vừa sao chép vào đây.

![](https://static-docs.nocobase.com/202412021520696.png)

## Lấy và điền thông tin cần thiết

Nhấp vào ứng dụng bạn vừa đăng ký, sau đó sao chép **Application (client) ID** và **Directory (tenant) ID** từ trang tổng quan.

![](https://static-docs.nocobase.com/202412021522063.png)

Nhấp vào `Certificates & secrets`, tạo một khóa bí mật máy khách (Client secrets) mới và sao chép **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Dưới đây là bảng đối chiếu giữa thông tin Microsoft Entra và cấu hình bộ xác thực của NocoBase:

| Thông tin Microsoft Entra   | Cấu hình bộ xác thực NocoBase                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, thay thế `{tenant}` bằng Directory (tenant) ID tương ứng |