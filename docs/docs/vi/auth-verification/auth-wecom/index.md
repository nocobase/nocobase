---
pkg: '@nocobase/plugin-auth-wecom'
title: "Xác thực: WeCom"
description: "Đăng nhập WeCom NocoBase: hỗ trợ OAuth của ứng dụng tự xây trong WeCom, cấu hình Company ID, AgentId, Secret, authorized callback domain, automatic login."
keywords: "WeCom,đăng nhập WeCom,OAuth,ứng dụng tự xây,AgentId,NocoBase"
---

# Xác thực: WeCom

## Giới thiệu

Plugin **WeCom** hỗ trợ người dùng đăng nhập NocoBase bằng tài khoản WeCom.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Tạo và cấu hình ứng dụng tự xây WeCom

Vào WeCom Admin Console, tạo ứng dụng tự xây WeCom.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Click vào ứng dụng để vào trang chi tiết, kéo xuống và click "WeCom Authorized Login".

![](https://static-docs.nocobase.com/202406272104655.png)

Đặt authorized callback domain thành domain ứng dụng NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Quay lại trang chi tiết ứng dụng, click "Web Authorization và JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Cài đặt và xác minh callback domain có thể dùng làm tính năng OAuth2.0 Web authorization của ứng dụng.

![](https://static-docs.nocobase.com/202406272107899.png)

Trên trang chi tiết ứng dụng, click "Trusted Enterprise IPs".

![](https://static-docs.nocobase.com/202406272108834.png)

Cấu hình IP ứng dụng NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Lấy key từ WeCom Admin Console

Trong WeCom Admin Console - My Enterprise, copy "Company ID".

![](https://static-docs.nocobase.com/202406272111637.png)

Trong WeCom Admin Console - App Management, vào trang chi tiết ứng dụng vừa tạo ở bước trước, copy AgentId và Secret

![](https://static-docs.nocobase.com/202406272122322.png)

## Thêm xác thực WeCom trên NocoBase

Vào trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202406272115044.png)

Thêm - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Cấu hình

![](https://static-docs.nocobase.com/202412041459250.png)

| Mục cấu hình | Mô tả | Yêu cầu phiên bản |
| ------------ | ----- | ----------------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | Khi không match được người dùng hiện có bằng số điện thoại, có tự động tạo người dùng mới hay không. | - |
| Company ID | Company ID, lấy từ WeCom Admin Console. | - |
| AgentId | Lấy từ cấu hình ứng dụng tự xây trong WeCom Admin Console. | - |
| Secret | Lấy từ cấu hình ứng dụng tự xây trong WeCom Admin Console. | - |
| Origin | Domain ứng dụng hiện tại. | - |
| Workbench application redirect link | Đường dẫn ứng dụng để chuyển đến sau khi đăng nhập thành công. | `v1.4.0` |
| Automatic login | Tự động đăng nhập khi mở link ứng dụng trong trình duyệt WeCom. Khi cấu hình nhiều WeCom authenticator, chỉ một cái có thể bật tùy chọn này. | `v1.4.0` |
| Workbench application homepage link | Link trang chủ ứng dụng workbench. | - |

## Cấu hình trang chủ ứng dụng WeCom

:::info
Phiên bản từ `v1.4.0` trở lên, khi bật tùy chọn "Automatic login", link trang chủ ứng dụng có thể được rút gọn thành: `https://<url>/<path>`, ví dụ `https://example.nocobase.com/admin`.

Cũng có thể cấu hình riêng cho mobile và desktop, ví dụ `https://example.nocobase.com/m` và `https://example.nocobase.com/admin`.
:::

Vào WeCom Admin Console, điền link trang chủ ứng dụng workbench đã copy vào ô địa chỉ trang chủ ứng dụng tương ứng.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Đăng nhập

Truy cập trang đăng nhập, click nút bên dưới form đăng nhập để bắt đầu đăng nhập bên thứ ba.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Do giới hạn quyền của WeCom với thông tin nhạy cảm như số điện thoại, việc cấp quyền chỉ có thể hoàn tất trong WeCom client. Khi đăng nhập WeCom lần đầu, hãy tham khảo các bước dưới đây để hoàn tất việc cấp quyền lần đầu trong WeCom client.
:::

## Đăng nhập lần đầu

Từ WeCom client vào Workbench, kéo xuống dưới cùng, click ứng dụng để vào trang chủ ứng dụng đã điền ở trên là có thể hoàn tất việc cấp quyền đăng nhập lần đầu. Sau đó bạn có thể sử dụng đăng nhập WeCom trong ứng dụng NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />
