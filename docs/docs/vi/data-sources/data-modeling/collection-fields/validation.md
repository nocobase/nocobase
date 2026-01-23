:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Xác thực trường
Để đảm bảo tính chính xác, bảo mật và nhất quán của dữ liệu trong các bộ sưu tập, NocoBase cung cấp chức năng xác thực trường. Chức năng này bao gồm hai phần chính: cấu hình quy tắc và áp dụng quy tắc.

## Cấu hình quy tắc
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Các trường hệ thống của NocoBase tích hợp các quy tắc từ [Joi](https://joi.dev/api/), với sự hỗ trợ như sau:

### Kiểu chuỗi
Các kiểu chuỗi của Joi tương ứng với các kiểu trường NocoBase sau: Văn bản một dòng, Văn bản nhiều dòng, Số điện thoại, Email, URL, Mật khẩu và UUID.
#### Quy tắc chung
- Độ dài tối thiểu
- Độ dài tối đa
- Độ dài
- Biểu thức chính quy
- Bắt buộc

#### Email
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Xem thêm tùy chọn](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Xem thêm tùy chọn](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Xem thêm tùy chọn](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Kiểu số
Các kiểu số của Joi tương ứng với các kiểu trường NocoBase sau: Số nguyên, Số và Phần trăm.
#### Quy tắc chung
- Lớn hơn
- Nhỏ hơn
- Giá trị tối đa
- Giá trị tối thiểu
- Bội số

#### Số nguyên
Ngoài các quy tắc chung, các trường số nguyên còn hỗ trợ thêm [xác thực số nguyên](https://joi.dev/api/?v=17.13.3#numberinteger) và [xác thực số nguyên không an toàn](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Số và Phần trăm
Ngoài các quy tắc chung, các trường số và phần trăm còn hỗ trợ thêm [xác thực độ chính xác](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Kiểu ngày tháng
Các kiểu ngày tháng của Joi tương ứng với các kiểu trường NocoBase sau: Ngày tháng (có múi giờ), Ngày tháng (không có múi giờ), Chỉ ngày và Dấu thời gian Unix.

Các quy tắc xác thực được hỗ trợ:
- Lớn hơn
- Nhỏ hơn
- Giá trị tối đa
- Giá trị tối thiểu
- Định dạng dấu thời gian
- Bắt buộc

### Trường quan hệ
Các trường quan hệ chỉ hỗ trợ xác thực bắt buộc. Lưu ý rằng xác thực bắt buộc cho các trường quan hệ hiện chưa được hỗ trợ trong các tình huống biểu mẫu con hoặc bảng con.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Áp dụng quy tắc xác thực
Sau khi cấu hình các quy tắc cho trường, các quy tắc xác thực tương ứng sẽ được kích hoạt khi thêm hoặc sửa đổi dữ liệu.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Các quy tắc xác thực cũng áp dụng cho các thành phần bảng con và biểu mẫu con:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Lưu ý rằng trong các tình huống biểu mẫu con hoặc bảng con, xác thực bắt buộc cho các trường quan hệ hiện không có hiệu lực.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Sự khác biệt so với xác thực trường phía máy khách
Xác thực trường phía máy khách và phía máy chủ được áp dụng trong các tình huống khác nhau, với sự khác biệt đáng kể về cách triển khai và thời điểm kích hoạt quy tắc, do đó cần được quản lý riêng biệt.

### Khác biệt về phương thức cấu hình
- **Xác thực phía máy khách**: Cấu hình quy tắc trong các biểu mẫu chỉnh sửa (như hình dưới đây)
- **Xác thực trường phía máy chủ**: Đặt quy tắc trường trong cấu hình Nguồn dữ liệu → Bộ sưu tập
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Khác biệt về thời điểm kích hoạt xác thực
- **Xác thực phía máy khách**: Kích hoạt xác thực theo thời gian thực khi người dùng điền vào các trường và hiển thị thông báo lỗi ngay lập tức.
- **Xác thực trường phía máy chủ**: Sau khi dữ liệu được gửi, máy chủ sẽ thực hiện xác thực trước khi dữ liệu được lưu vào cơ sở dữ liệu, thông báo lỗi được trả về thông qua phản hồi API.
- **Phạm vi áp dụng**: Xác thực trường phía máy chủ không chỉ có hiệu lực khi gửi biểu mẫu mà còn được kích hoạt trong tất cả các tình huống liên quan đến việc thêm hoặc sửa đổi dữ liệu, chẳng hạn như luồng công việc và nhập dữ liệu.
- **Thông báo lỗi**: Xác thực phía máy khách hỗ trợ thông báo lỗi tùy chỉnh, trong khi xác thực phía máy chủ hiện chưa hỗ trợ thông báo lỗi tùy chỉnh.