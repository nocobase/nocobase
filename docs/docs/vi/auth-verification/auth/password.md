---
pkg: '@nocobase/plugin-auth'
title: "Xác thực mật khẩu"
description: "Xác thực mật khẩu NocoBase: cho phép đăng ký, cài đặt form đăng ký, quên mật khẩu (đặt lại bằng email), cấu hình quản trị viên và quy trình sử dụng của người dùng."
keywords: "xác thực mật khẩu,đăng ký người dùng,quên mật khẩu,đặt lại bằng email,đặt lại mật khẩu,NocoBase"
---

# Xác thực mật khẩu

## Giao diện cấu hình

![](https://static-docs.nocobase.com/202411131505095.png)

## Có cho phép đăng ký không

Khi cho phép đăng ký, trang đăng nhập sẽ hiển thị link tạo tài khoản và có thể chuyển sang trang đăng ký

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Trang đăng ký

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Khi không cho phép đăng ký, trang đăng nhập sẽ không hiển thị link tạo tài khoản

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Khi không cho phép đăng ký, không thể truy cập trang đăng ký

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Cài đặt form đăng ký<Badge>v1.4.0-beta.7+</Badge>

Hỗ trợ cài đặt những field nào trong bảng users sẽ hiển thị trong form đăng ký và có bắt buộc hay không. Cần đặt ít nhất một trong tên người dùng hoặc email là hiển thị và bắt buộc.

![](https://static-docs.nocobase.com/202411262133669.png)

Trang đăng ký

![](https://static-docs.nocobase.com/202411262135801.png)

## Quên mật khẩu<Badge>v1.8.0+</Badge>

Tính năng quên mật khẩu cho phép người dùng đặt lại mật khẩu thông qua kiểm tra email khi quên mật khẩu.

### Cấu hình quản trị viên

1. **Bật tính năng quên mật khẩu**

   Trong tab "Cài đặt" > "Xác thực người dùng" > "Quên mật khẩu", tick chọn checkbox "Bật tính năng quên mật khẩu".

   ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2. **Cấu hình kênh thông báo**

   Chọn một kênh thông báo email (hiện chỉ hỗ trợ email). Nếu chưa có kênh thông báo nào khả dụng, bạn cần thêm trước.

   ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3. **Cấu hình email đặt lại mật khẩu**

   Tùy chỉnh chủ đề và nội dung email, hỗ trợ định dạng HTML hoặc text thuần. Có thể sử dụng các biến sau:
   - Người dùng hiện tại (Current user)
   - Cài đặt hệ thống (System settings)
   - Link đặt lại mật khẩu (Reset password link)
   - Thời hạn link đặt lại (phút) (Reset link expiration (minutes))

   ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4. **Cài đặt thời hạn link đặt lại**

   Cài đặt thời gian hiệu lực của link đặt lại (phút), mặc định là 120 phút.

   ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Quy trình sử dụng của người dùng

1. **Yêu cầu đặt lại mật khẩu**

   Trên trang đăng nhập, click link "Quên mật khẩu" (cần quản trị viên bật trước tính năng quên mật khẩu) để vào trang quên mật khẩu.

   ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

   Nhập email đăng ký và click nút "Gửi email đặt lại".

   ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2. **Đặt lại mật khẩu**

   Người dùng sẽ nhận được email chứa link đặt lại. Sau khi click link, đặt mật khẩu mới trên trang được mở.

   ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

   Sau khi đặt xong, người dùng có thể đăng nhập hệ thống bằng mật khẩu mới.

### Lưu ý

- Link đặt lại có giới hạn thời gian, mặc định có hiệu lực trong 120 phút sau khi tạo (có thể được quản trị viên cấu hình)
- Link chỉ sử dụng được một lần, hết hiệu lực ngay sau khi sử dụng
- Nếu người dùng không nhận được email đặt lại, hãy kiểm tra địa chỉ email có chính xác không, hoặc xem trong thư mục thư rác
- Quản trị viên cần đảm bảo cấu hình mail server chính xác để email đặt lại có thể gửi thành công
