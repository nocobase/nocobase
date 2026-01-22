---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: DingTalk

## Giới thiệu

Plugin Xác thực: DingTalk cho phép người dùng đăng nhập vào NocoBase bằng tài khoản DingTalk của họ.

## Kích hoạt Plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Đăng ký quyền API trong Bảng điều khiển nhà phát triển DingTalk

Tham khảo <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Nền tảng mở DingTalk - Triển khai đăng nhập vào trang web bên thứ ba</a> để tạo một ứng dụng.

Truy cập bảng điều khiển quản lý ứng dụng và bật "Thông tin số điện thoại cá nhân" và "Quyền đọc thông tin cá nhân trong danh bạ".

![](https://static-docs.nocobase.com/202406120006620.png)

## Lấy thông tin xác thực từ Bảng điều khiển nhà phát triển DingTalk

Sao chép Client ID và Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Thêm xác thực DingTalk trong NocoBase

Truy cập trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202406112348051.png)

Thêm - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Cấu hình

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - Tự động tạo người dùng mới nếu không tìm thấy người dùng hiện có khớp với số điện thoại.
- Client ID và Client Secret - Điền thông tin đã sao chép ở bước trước.
- Redirect URL - URL gọi lại, sao chép và chuyển sang bước tiếp theo.

## Cấu hình URL gọi lại trong Bảng điều khiển nhà phát triển DingTalk

Dán URL gọi lại đã sao chép vào Bảng điều khiển nhà phát triển DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Đăng nhập

Truy cập trang đăng nhập và nhấp vào nút bên dưới biểu mẫu đăng nhập để bắt đầu đăng nhập bằng bên thứ ba.

![](https://static-docs.nocobase.com/202406120014539.png)