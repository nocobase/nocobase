---
pkg: '@nocobase/plugin-app-supervisor'
title: 'SSO ứng dụng'
description: 'SSO ứng dụng trong multi-app: tự động đăng nhập vào ứng dụng con từ ứng dụng chính hoặc app switcher, hỗ trợ mapping username và tự động signup.'
keywords: 'multi-app,SSO ứng dụng,tự động đăng nhập,app switcher,ứng dụng con,NocoBase'
---

# SSO ứng dụng

SSO ứng dụng giúp đơn giản hóa quy trình đăng nhập khi người dùng vào ứng dụng con trong multi-app.

Sau khi bật, khi người dùng vào ứng dụng con từ entry của ứng dụng chính hoặc chuyển giữa các ứng dụng con, hệ thống sẽ thử tự động đăng nhập vào ứng dụng con đích bằng người dùng hiện tại. Người dùng không cần nhập tài khoản và mật khẩu lặp lại ở từng ứng dụng con.

## Tình huống sử dụng

SSO ứng dụng phù hợp với các tình huống sau:

- Ứng dụng chính là entry thống nhất để vào các ứng dụng con nghiệp vụ
- Một hệ thống được tách thành nhiều ứng dụng con nhưng trải nghiệm đăng nhập cần liên tục
- Người dùng thường xuyên chuyển giữa nhiều ứng dụng con
- Tài khoản người dùng giữa các ứng dụng con được mapping bằng cùng username

## Bật SSO ứng dụng

Vào "App Supervisor", tạo hoặc chỉnh sửa ứng dụng con, rồi bật "App SSO" trong "Authentication configuration".

Sau khi bật, ứng dụng con có thể kích hoạt đăng nhập tự động thông qua entry ứng dụng chính hoặc app switcher.

> Sau khi thay đổi cấu hình xác thực, thường cần khởi động lại ứng dụng con để có hiệu lực.

![](https://static-docs.nocobase.com/202605271406542.png)

## Tự động signup người dùng

Nếu người dùng tương ứng chưa tồn tại trong ứng dụng con đích, bạn có thể bật "Automatically sign up when user does not exist".

Sau khi bật, khi người dùng lần đầu vào ứng dụng con qua SSO, hệ thống sẽ tạo người dùng cơ bản trong ứng dụng con dựa trên thông tin người dùng ở ứng dụng chính.

Mapping người dùng chủ yếu dựa trên username:

- Nếu username giống nhau ở ứng dụng chính và ứng dụng con, người dùng tương ứng trong ứng dụng con sẽ được đăng nhập
- Nếu username chưa tồn tại trong ứng dụng con, người dùng chỉ được tạo khi bật tự động signup
- Nếu chưa bật tự động signup, quản trị viên cần tạo trước người dùng trong ứng dụng con

Role và quyền sau khi tạo do cấu hình người dùng và quyền của chính ứng dụng con quyết định.

## Entry kích hoạt đăng nhập tự động

SSO ứng dụng chủ yếu được kích hoạt bởi:

- Vào ứng dụng con từ entry ứng dụng của ứng dụng chính
- Vào từ app switcher ở góc trái trên
- Chuyển từ một ứng dụng con sang ứng dụng con khác

Truy cập trực tiếp trang đăng nhập hoặc địa chỉ riêng của ứng dụng con sẽ không bắt buộc dùng trạng thái đăng nhập của ứng dụng chính. Điều này giữ lại phương thức đăng nhập riêng của ứng dụng con.

## Câu hỏi thường gặp

### Đã bật nhưng vẫn không tự động đăng nhập?

Hãy kiểm tra:

- Ứng dụng con đã bật App SSO chưa
- Ứng dụng con đã được khởi động lại chưa
- Người dùng có vào từ entry ứng dụng chính hoặc app switcher không
- Trong ứng dụng con có người dùng cùng username không
- Nếu người dùng chưa tồn tại, tự động signup đã bật chưa

### Vì sao truy cập trực tiếp ứng dụng con không tự động đăng nhập?

Đây là hành vi mong đợi. Khi truy cập trực tiếp, ứng dụng con có thể cần dùng phương thức đăng nhập riêng.
