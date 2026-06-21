---
pkg: '@nocobase/plugin-auth-oidc'
title: "Xác thực: OIDC"
description: "Xác thực OIDC SSO NocoBase: tuân theo giao thức OpenID Connect, Authorization Code Flow, hỗ trợ Google, Microsoft Entra ID và các IdP khác, cấu hình Issuer, Client ID, ánh xạ field."
keywords: "OIDC,OpenID Connect,SSO,đăng nhập một lần,Google,Microsoft Entra,NocoBase"
---

# Xác thực: OIDC

## Giới thiệu

Plugin Xác thực: OIDC tuân theo chuẩn giao thức OIDC (OpenID Connect), sử dụng Authorization Code Flow, cho phép người dùng đăng nhập NocoBase bằng tài khoản do nhà cung cấp xác thực danh tính bên thứ ba (IdP) cung cấp.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Thêm xác thực OIDC

Vào trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202411130004459.png)

Thêm - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Cấu hình

### Cấu hình cơ bản

![](https://static-docs.nocobase.com/202411130006341.png)

| Cấu hình | Mô tả | Phiên bản |
| -------- | ----- | --------- |
| Sign up automatically when the user does not exist | Khi không tìm thấy người dùng hiện có để match, có tự động tạo người dùng mới hay không. | - |
| Issuer | Issuer do IdP cung cấp, thường kết thúc bằng `/.well-known/openid-configuration`. | - |
| Client ID | Client ID | - |
| Client Secret | Client Secret | - |
| scope | Tùy chọn, mặc định là `openid email profile`. | - |
| id_token signed response algorithm | Phương thức ký id_token, mặc định là `RS256`. | - |
| Enable RP-initiated logout | Bật RP-initiated logout, khi người dùng đăng xuất sẽ đăng xuất trạng thái của IdP. Callback đăng xuất của IdP điền Post logout redirect URL từ phần [Sử dụng](#sử-dụng). | `v1.3.44-beta` |

### Ánh xạ field

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Cấu hình | Mô tả |
| -------- | ----- |
| Field Map | Ánh xạ field. Phía NocoBase hiện có thể ánh xạ các field nickname, email và số điện thoại. Nickname mặc định dùng `openid`. |
| Use this field to bind the user | Field dùng để match và gắn với người dùng hiện có, có thể chọn email hoặc username, mặc định là email. Cần thông tin người dùng do IdP mang theo phải có field `email` hoặc `username`. |

### Cấu hình nâng cao

![](https://static-docs.nocobase.com/202411130013306.png)

| Cấu hình | Mô tả | Phiên bản |
| -------- | ----- | --------- |
| HTTP | Địa chỉ callback NocoBase có dùng giao thức http hay không, mặc định `https`. | - |
| Port | Port của địa chỉ callback NocoBase, mặc định `443/80`. | - |
| State token | Dùng để kiểm tra nguồn request, ngăn chặn tấn công CSRF. Có thể điền giá trị cố định, **rất khuyến nghị để trống, hệ thống sẽ tự sinh giá trị ngẫu nhiên. Nếu muốn dùng giá trị cố định, bạn cần tự đánh giá môi trường sử dụng và rủi ro bảo mật.** | - |
| Pass parameters in the authorization code grant exchange | Khi dùng code đổi token, một số IdP có thể yêu cầu truyền Client ID hoặc Client Secret làm tham số, có thể tick chọn và điền tên tham số tương ứng. | - |
| Method to call the user info endpoint | HTTP method khi request API lấy thông tin người dùng. | - |
| Where to put the access token when calling the user info endpoint | Cách truyền access token khi request API lấy thông tin người dùng.<br/>- Header - Request header, mặc định.<br />- Body - Request body, dùng kết hợp với method `POST`.<br />- Query parameters - Tham số request, dùng kết hợp với method `GET`. | - |
| Skip SSL verification | Bỏ qua kiểm tra SSL khi request API IdP. **Tùy chọn này khiến hệ thống của bạn dễ bị tấn công man-in-the-middle, chỉ tick chọn khi bạn biết rõ mục đích của tùy chọn này. Cực kỳ không khuyến nghị sử dụng trong môi trường production.** | `v1.3.40-beta` |

### Sử dụng

![](https://static-docs.nocobase.com/202411130019570.png)

| Cấu hình | Mô tả |
| -------- | ----- |
| Redirect URL | Dùng để điền vào cấu hình callback URL của IdP. |
| Post logout redirect URL | Khi bật RP-initiated logout, dùng để điền vào cấu hình Post logout redirect URL của IdP. |

:::info
Khi test cục bộ, hãy dùng URL `127.0.0.1` thay vì `localhost`, vì phương thức đăng nhập OIDC cần ghi state vào cookie client để kiểm tra bảo mật. Nếu khi đăng nhập xuất hiện cửa sổ thoáng qua nhưng không đăng nhập thành công, hãy kiểm tra xem server có log state không khớp không và cookie request có chứa tham số state không. Tình huống này thường do state trong cookie client và state trong request không khớp.
:::

## Đăng nhập

Truy cập trang đăng nhập, click nút bên dưới form đăng nhập để bắt đầu đăng nhập bên thứ ba.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)
