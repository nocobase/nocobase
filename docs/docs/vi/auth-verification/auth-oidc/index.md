---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: OIDC

## Giới thiệu

Plugin Xác thực: OIDC tuân thủ tiêu chuẩn giao thức OIDC (Open ConnectID), sử dụng luồng cấp quyền bằng mã (Authorization Code Flow), cho phép người dùng đăng nhập vào NocoBase bằng tài khoản do nhà cung cấp dịch vụ xác thực danh tính bên thứ ba (IdP) cung cấp.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Thêm xác thực OIDC

Truy cập trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202411130004459.png)

Thêm - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Cấu hình

### Cấu hình cơ bản

![](https://static-docs.nocobase.com/202411130006341.png)

| Cấu hình                                           | Mô tả                                                                                                                                                                    | Phiên bản      |
| :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Sign up automatically when the user does not exist | Tự động tạo người dùng mới nếu không tìm thấy người dùng hiện có phù hợp.                                                                                                 | -              |
| Issuer                                             | Issuer do IdP cung cấp, thường kết thúc bằng `/.well-known/openid-configuration`.                                                                                         | -              |
| Client ID                                          | ID máy khách                                                                                                                                                            | -              |
| Client Secret                                      | Mã bí mật máy khách                                                                                                                                                     | -              |
| scope                                              | Tùy chọn, mặc định là `openid email profile`.                                                                                                                            | -              |
| id_token signed response algorithm                 | Thuật toán ký `id_token`, mặc định là `RS256`.                                                                                                                           | -              |
| Enable RP-initiated logout                         | Bật tính năng đăng xuất do RP khởi tạo. Khi người dùng đăng xuất, phiên đăng nhập IdP cũng sẽ được đăng xuất. URL chuyển hướng sau đăng xuất của IdP nên được điền theo [Cách sử dụng](#cách-sử-dụng). | `v1.3.44-beta` |

### Ánh xạ trường

![](https://static-docs.nocobase.com/92d63c8f4082b50d9f475674cb5650.png)

| Cấu hình                        | Mô tả                                                                                                                                                                |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Ánh xạ trường. Các trường có thể ánh xạ trong NocoBase hiện bao gồm biệt danh, email và số điện thoại. Biệt danh mặc định sử dụng `openid`.                            |
| Use this field to bind the user | Trường dùng để khớp và liên kết với người dùng hiện có. Có thể chọn email hoặc tên người dùng, mặc định là email. Yêu cầu thông tin người dùng do IdP cung cấp phải chứa trường `email` hoặc `username`. |

### Cấu hình nâng cao

![](https://static-docs.nocobase.com/202411130013306.png)

| Cấu hình                                                          | Mô tả