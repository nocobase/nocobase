---
pkg: '@nocobase/plugin-password-policy'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Chính sách mật khẩu

## Giới thiệu

Thiết lập các quy tắc mật khẩu, thời hạn hiệu lực mật khẩu và chính sách bảo mật đăng nhập mật khẩu cho tất cả người dùng, đồng thời quản lý các tài khoản người dùng bị khóa.

## Quy tắc mật khẩu

![](https://static-docs.nocobase.com/202412281329313.png)

### Độ dài mật khẩu tối thiểu

Thiết lập yêu cầu độ dài mật khẩu tối thiểu, với độ dài tối đa là 64 ký tự.

### Yêu cầu độ phức tạp của mật khẩu

Hỗ trợ các tùy chọn sau:

- Phải chứa cả chữ cái và số
- Phải chứa cả chữ cái, số và ký hiệu
- Phải chứa cả số, chữ cái viết hoa và chữ cái viết thường
- Phải chứa cả số, chữ cái viết hoa, chữ cái viết thường và ký hiệu
- Phải chứa ít nhất 3 trong số các loại ký tự sau: số, chữ cái viết hoa, chữ cái viết thường và ký tự đặc biệt
- Không giới hạn

![](https://static-docs.nocobase.com/202412281331649.png)

### Mật khẩu không được chứa tên người dùng

Thiết lập xem mật khẩu có được phép chứa tên người dùng hiện tại hay không.

### Số lượng mật khẩu đã dùng gần đây

Lưu lại số lượng mật khẩu mà người dùng đã sử dụng gần đây. Người dùng không thể sử dụng lại các mật khẩu này khi thay đổi mật khẩu. Giá trị 0 có nghĩa là không giới hạn, số lượng tối đa là 24.

## Cấu hình thời hạn mật khẩu

![](https://static-docs.nocobase.com/202412281335588.png)

### Thời hạn hiệu lực của mật khẩu

Thời hạn hiệu lực của mật khẩu người dùng. Người dùng phải thay đổi mật khẩu trước khi hết hạn để thời hạn hiệu lực được tính lại. Nếu không thay đổi mật khẩu trước khi hết hạn, người dùng sẽ không thể đăng nhập bằng mật khẩu cũ và cần quản trị viên hỗ trợ đặt lại. Nếu có cấu hình các phương thức đăng nhập khác, người dùng vẫn có thể sử dụng các phương thức đó để đăng nhập.

### Kênh thông báo nhắc nhở mật khẩu hết hạn

Trong vòng 10 ngày trước khi mật khẩu người dùng hết hạn, một thông báo nhắc nhở sẽ được gửi mỗi khi người dùng đăng nhập. Theo mặc định, thông báo sẽ được gửi qua kênh tin nhắn nội bộ "Nhắc nhở mật khẩu hết hạn", bạn có thể quản lý kênh này trong phần quản lý thông báo.

### Khuyến nghị cấu hình

Vì mật khẩu hết hạn có thể dẫn đến việc không thể đăng nhập vào tài khoản, bao gồm cả tài khoản quản trị viên, vui lòng thay đổi mật khẩu kịp thời và thiết lập nhiều tài khoản trong hệ thống có quyền sửa đổi mật khẩu người dùng.

## Bảo mật đăng nhập mật khẩu

Thiết lập giới hạn số lần thử đăng nhập bằng mật khẩu không hợp lệ.

![](https://static-docs.nocobase.com/202412281339724.png)

### Số lần thử đăng nhập bằng mật khẩu không hợp lệ tối đa

Thiết lập số lần đăng nhập tối đa mà người dùng có thể thử trong một khoảng thời gian quy định.

### Khoảng thời gian tối đa cho các lần thử đăng nhập bằng mật khẩu không hợp lệ (giây)

Thiết lập khoảng thời gian (tính bằng giây) để tính toán số lần đăng nhập không hợp lệ tối đa của người dùng.

### Thời gian khóa tài khoản (giây)

Thiết lập thời gian khóa tài khoản người dùng sau khi vượt quá giới hạn đăng nhập bằng mật khẩu không hợp lệ (0 có nghĩa là không giới hạn). Trong thời gian bị khóa, người dùng sẽ bị cấm truy cập hệ thống bằng bất kỳ phương thức xác thực nào, bao gồm cả API keys. Nếu cần mở khóa người dùng thủ công, vui lòng tham khảo [Khóa người dùng](./lockout.md).

### Các trường hợp sử dụng

#### Không giới hạn

Không giới hạn số lần người dùng thử mật khẩu không hợp lệ.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Giới hạn tần suất thử, không khóa người dùng

Ví dụ: Người dùng có thể thử đăng nhập tối đa 5 lần mỗi 5 phút.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Khóa người dùng sau khi vượt quá giới hạn

Ví dụ: Nếu người dùng thực hiện 5 lần đăng nhập bằng mật khẩu không hợp lệ liên tiếp trong vòng 5 phút, tài khoản người dùng sẽ bị khóa trong 2 giờ.

![](https://static-docs.nocobase.com/202412281344952.png)

### Khuyến nghị cấu hình

- Cấu hình số lần đăng nhập bằng mật khẩu không hợp lệ và khoảng thời gian thường được sử dụng để giới hạn các lần thử đăng nhập mật khẩu tần suất cao trong thời gian ngắn, nhằm ngăn chặn tấn công vét cạn (brute-force).
- Việc có nên khóa người dùng sau khi vượt quá giới hạn hay không cần được xem xét dựa trên các trường hợp sử dụng thực tế. Cài đặt thời gian khóa có thể bị lợi dụng một cách độc hại, khi kẻ tấn công có thể cố tình nhập sai mật khẩu nhiều lần cho một tài khoản mục tiêu, buộc tài khoản đó bị khóa và không thể sử dụng bình thường. Có thể kết hợp các biện pháp như giới hạn IP, giới hạn tần suất API để phòng ngừa loại tấn công này.
- Vì việc khóa tài khoản sẽ ngăn chặn truy cập vào hệ thống, bao gồm cả tài khoản quản trị viên, nên bạn có thể thiết lập nhiều tài khoản trong hệ thống có quyền mở khóa người dùng.