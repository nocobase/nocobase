---
pkg: '@nocobase/plugin-verification'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: SMS

## Giới thiệu

Mã xác thực SMS là một loại xác thực được tích hợp sẵn, dùng để tạo và gửi mật khẩu dùng một lần (OTP) đến người dùng qua tin nhắn SMS.

## Thêm trình xác thực SMS

Truy cập trang quản lý xác thực.

![](https://static-docs.nocobase.com/202502271726791.png)

Thêm - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Cấu hình quản trị viên

![](https://static-docs.nocobase.com/202502271727711.png)

Hiện tại, các nhà cung cấp dịch vụ SMS được hỗ trợ bao gồm:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Khi cấu hình mẫu tin nhắn SMS trong bảng điều khiển quản trị của nhà cung cấp dịch vụ, bạn cần dành một tham số cho mã xác thực.

- Ví dụ cấu hình Aliyun: `Mã xác thực của bạn là: ${code}`

- Ví dụ cấu hình Tencent Cloud: `Mã xác thực của bạn là: {1}`

Các nhà phát triển cũng có thể mở rộng hỗ trợ cho các nhà cung cấp dịch vụ SMS khác dưới dạng plugin. Tham khảo: [Mở rộng nhà cung cấp dịch vụ SMS](./dev/sms-type)

## Liên kết người dùng

Sau khi thêm trình xác thực, người dùng có thể liên kết số điện thoại trong phần quản lý xác thực cá nhân của họ.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Sau khi liên kết thành công, có thể thực hiện xác thực danh tính trong bất kỳ tình huống xác thực nào đã liên kết trình xác thực này.

![](https://static-docs.nocobase.com/202502271739607.png)

## Hủy liên kết người dùng

Để hủy liên kết số điện thoại, cần phải xác thực thông qua phương thức xác thực đã liên kết.

![](https://static-docs.nocobase.com/202502282103205.png)