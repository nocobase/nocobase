---
title: "Xác thực Field"
description: "Quy tắc xác thực Field: quy tắc cấu hình và quy tắc xác thực dựa trên Joi, hỗ trợ các kiểu chuỗi, số, ngày với độ dài tối thiểu/tối đa, bắt buộc, v.v."
keywords: "xác thực Field,validation Field,Joi,quy tắc xác thực,quy tắc cấu hình,NocoBase"
---

# Xác thực Field
Để đảm bảo tính chính xác, an toàn và nhất quán của Collection, NocoBase cung cấp chức năng xác thực Field. Chức năng này chủ yếu được chia thành hai phần: quy tắc cấu hình và quy tắc xác thực.

## Quy tắc cấu hình
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Field hệ thống của NocoBase tích hợp quy tắc của [Joi](https://joi.dev/api/), hỗ trợ như sau:

### Kiểu chuỗi
Kiểu chuỗi của Joi tương ứng với các loại Field NocoBase bao gồm: Văn bản một dòng, Văn bản nhiều dòng, Số điện thoại, Email, URL, Mật khẩu, UUID.
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
Kiểu số của Joi tương ứng với các loại Field NocoBase bao gồm: Số nguyên, Số, Phần trăm.
#### Quy tắc chung
- Lớn hơn
- Nhỏ hơn
- Giá trị tối đa
- Giá trị tối thiểu
- Bội số nguyên

#### Số nguyên
Ngoài quy tắc chung, Field số nguyên còn hỗ trợ thêm [xác thực số nguyên](https://joi.dev/api/?v=17.13.3#numberinteger) và [xác thực số nguyên không an toàn](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Số và Phần trăm
Ngoài quy tắc chung, Field số và phần trăm còn hỗ trợ thêm [xác thực độ chính xác](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Kiểu ngày
Kiểu ngày của Joi tương ứng với các loại Field NocoBase bao gồm: Ngày (có múi giờ), Ngày (không có múi giờ), Chỉ ngày, Unix Timestamp.

Các quy tắc xác thực được hỗ trợ:
- Lớn hơn
- Nhỏ hơn
- Giá trị tối đa
- Giá trị tối thiểu
- Xác thực định dạng timestamp
- Bắt buộc

### Field quan hệ
Field quan hệ chỉ hỗ trợ xác thực bắt buộc. Cần lưu ý rằng xác thực bắt buộc của Field quan hệ tạm thời không được áp dụng trong các tình huống sub-form hoặc sub-table.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Áp dụng quy tắc xác thực
Sau khi cấu hình quy tắc Field, các quy tắc xác thực tương ứng sẽ được kích hoạt khi thêm hoặc sửa dữ liệu.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Khi Field được dùng trong Form, quy tắc xác thực Field cũng sẽ hiển thị trong cài đặt xác thực của Field. Các quy tắc này nằm dưới **Quy tắc xác thực Field phía server** và chỉ đọc tại đây. Nếu cần thay đổi, hãy chỉnh sửa Field trong Data Source → Cấu hình Collection.

Bạn vẫn có thể thêm quy tắc bổ sung cho Field Form hiện tại dưới **Quy tắc xác thực phía client**. Các quy tắc này chỉ áp dụng cho component Field hiện tại. Kết quả xác thực cuối cùng sẽ kết hợp **Quy tắc xác thực Field phía server** và **Quy tắc xác thực phía client**.

Quy tắc xác thực cũng áp dụng cho component sub-table và sub-form:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Cần lưu ý rằng trong các tình huống sub-form hoặc sub-table, xác thực bắt buộc của Field quan hệ tạm thời không có hiệu lực.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Sự khác biệt giữa quy tắc xác thực Field phía server và phía client
Quy tắc xác thực Field phía server và quy tắc xác thực phía client được cấu hình ở các vị trí khác nhau và có phạm vi áp dụng khác nhau.

### Sự khác biệt về cách cấu hình
- **Quy tắc xác thực Field phía server**: Thiết lập quy tắc Field trong Data Source → Cấu hình Collection. Đây là quy tắc cơ sở của Field
- **Quy tắc xác thực phía client**: Cấu hình quy tắc bổ sung trong cài đặt Field của Form. Các quy tắc này chỉ ảnh hưởng đến component Field hiện tại
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Sự khác biệt về thời điểm kích hoạt xác thực
- **Quy tắc xác thực Field phía server**: Kích hoạt xác thực frontend khi Field được dùng trong Form, đồng thời xác thực trước khi dữ liệu được ghi. Các quy tắc này cũng áp dụng cho những tình huống tạo hoặc cập nhật dữ liệu, như workflow và nhập dữ liệu
- **Quy tắc xác thực phía client**: Chỉ kích hoạt xác thực frontend trong Field Form hiện tại
- **Hiển thị quy tắc**: Quy tắc xác thực Field phía server được hiển thị dưới dạng quy tắc kế thừa và chỉ đọc. Quy tắc xác thực phía client được hiển thị riêng và có thể chỉnh sửa tại đó
- **Thông báo lỗi**: Quy tắc xác thực phía client hỗ trợ thông báo lỗi tùy chỉnh, trong khi quy tắc xác thực Field phía server tạm thời không hỗ trợ thông báo lỗi tùy chỉnh
