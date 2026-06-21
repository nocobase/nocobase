---
pkg: '@nocobase/plugin-password-policy'
title: "Chính sách mật khẩu"
description: "Chính sách mật khẩu: quy tắc mật khẩu (độ dài tối thiểu, độ phức tạp, số mật khẩu lịch sử), thời hạn mật khẩu, khóa khi đăng nhập thử, quản lý khóa người dùng, tính năng phiên bản chuyên nghiệp."
keywords: "chính sách mật khẩu,quy tắc mật khẩu,độ phức tạp mật khẩu,thời hạn mật khẩu,khóa người dùng,bảo mật đăng nhập,phiên bản chuyên nghiệp,NocoBase"
---

# Chính sách mật khẩu

## Giới thiệu

Đặt quy tắc mật khẩu, thời hạn mật khẩu và chính sách bảo mật đăng nhập mật khẩu cho tất cả người dùng, quản lý người dùng bị khóa.

## Quy tắc mật khẩu

![](https://static-docs.nocobase.com/202412281329313.png)

### Độ dài mật khẩu tối thiểu

Đặt yêu cầu độ dài tối thiểu của mật khẩu, độ dài tối đa là 64.

### Yêu cầu độ phức tạp mật khẩu

Hỗ trợ các tùy chọn sau:

- Phải chứa chữ cái và số
- Phải chứa chữ cái, số và ký tự đặc biệt
- Phải chứa số, chữ hoa và chữ thường
- Phải chứa số, chữ hoa, chữ thường và ký tự đặc biệt
- Phải chứa 3 trong các ký tự sau: số, chữ hoa, chữ thường và ký tự đặc biệt
- Không giới hạn

![](https://static-docs.nocobase.com/202412281331649.png)

### Mật khẩu không thể chứa username

Đặt mật khẩu có thể chứa username của người dùng hiện tại hay không.

### Số lượng mật khẩu lịch sử

Ghi nhớ số lượng mật khẩu gần đây nhất của người dùng, người dùng không thể sử dụng lại khi đổi mật khẩu. 0 đại diện cho không giới hạn, số lượng tối đa là 24.

## Cấu hình hết hạn mật khẩu

![](https://static-docs.nocobase.com/202412281335588.png)

### Thời hạn mật khẩu

Thời hạn của mật khẩu người dùng. Người dùng phải đổi mật khẩu trước khi mật khẩu hết hạn thì thời hạn mới được tính lại. Nếu không đổi mật khẩu trước khi hết hạn, sẽ không thể sử dụng mật khẩu cũ để đăng nhập, cần quản trị viên hỗ trợ đặt lại. Nếu đã cấu hình các phương thức đăng nhập khác, người dùng có thể sử dụng phương thức khác để đăng nhập.

### Kênh thông báo nhắc nhở mật khẩu hết hạn

Trong vòng 10 ngày trước khi mật khẩu của người dùng hết hạn, mỗi lần đăng nhập sẽ gửi nhắc nhở. Mặc định gửi đến kênh in-app message "Nhắc nhở mật khẩu hết hạn", có thể quản lý kênh trong Quản lý thông báo.

### Khuyến nghị cấu hình

Vì mật khẩu hết hạn có thể dẫn đến việc tài khoản không thể đăng nhập, bao gồm cả tài khoản quản trị viên, vui lòng đổi mật khẩu kịp thời và thiết lập nhiều tài khoản có thể đổi mật khẩu người dùng trong hệ thống.

## Bảo mật đăng nhập mật khẩu

Đặt giới hạn thử đăng nhập với mật khẩu không hợp lệ.

![](https://static-docs.nocobase.com/202412281339724.png)

### Số lần thử đăng nhập với mật khẩu không hợp lệ tối đa

Đặt số lần đăng nhập tối đa người dùng có thể thử trong khoảng thời gian quy định.

### Khoảng thời gian đăng nhập với mật khẩu không hợp lệ tối đa (giây)

Đặt khoảng thời gian tính số lần đăng nhập không hợp lệ tối đa của người dùng, đơn vị giây.

### Thời gian khóa (giây)

Đặt thời gian khóa người dùng sau khi vượt quá giới hạn đăng nhập với mật khẩu không hợp lệ (0 đại diện cho không giới hạn). Trong thời gian người dùng bị khóa, sẽ bị cấm truy cập hệ thống bằng bất kỳ phương thức xác thực nào, bao gồm cả API keys. Nếu cần chủ động mở khóa người dùng, có thể tham khảo [Khóa người dùng](./lockout.md).

### Tình huống

#### Không giới hạn

Không giới hạn số lần thử mật khẩu không hợp lệ của người dùng.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Giới hạn tần suất thử, không khóa người dùng

Ví dụ: Người dùng có thể thử đăng nhập tối đa 5 lần mỗi 5 phút.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Khóa người dùng sau khi vượt quá giới hạn

Ví dụ: Người dùng đăng nhập với mật khẩu không hợp lệ 5 lần liên tiếp trong 5 phút, khóa người dùng 2 giờ.

![](https://static-docs.nocobase.com/202412281344952.png)

### Khuyến nghị cấu hình

- Cấu hình số lần và khoảng thời gian đăng nhập với mật khẩu không hợp lệ thường được dùng để giới hạn các thử đăng nhập tần suất cao trong thời gian ngắn, ngăn chặn brute force.
- Việc khóa người dùng sau khi vượt quá giới hạn cần xem xét kết hợp với tình huống sử dụng thực tế. Cài đặt thời gian khóa có thể bị lợi dụng độc hại, kẻ tấn công có thể cố tình nhập sai mật khẩu nhiều lần đối với tài khoản mục tiêu, buộc tài khoản bị khóa, không thể sử dụng bình thường. Có thể kết hợp với hạn chế IP, hạn chế tần suất API và các phương pháp khác để phòng chống các loại tấn công này.
- Vì tài khoản bị khóa sẽ không thể vào hệ thống, bao gồm cả tài khoản quản trị viên, có thể thiết lập nhiều tài khoản có quyền mở khóa người dùng trong hệ thống.
