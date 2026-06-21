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

Quy tắc xác thực cũng áp dụng cho component sub-table và sub-form:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Cần lưu ý rằng trong các tình huống sub-form hoặc sub-table, xác thực bắt buộc của Field quan hệ tạm thời không có hiệu lực.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Sự khác biệt với xác thực Field phía client
Xác thực Field phía server và phía client phù hợp với các tình huống ứng dụng khác nhau, hai loại có sự khác biệt rõ rệt về cách triển khai và thời điểm kích hoạt quy tắc, do đó cần được quản lý riêng biệt.

### Sự khác biệt về cách cấu hình
- **Xác thực phía client**: Cấu hình quy tắc trong form chỉnh sửa (như hình bên dưới)
- **Xác thực Field phía server**: Thiết lập quy tắc Field trong cấu hình Data Source → Collection
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Sự khác biệt về thời điểm kích hoạt xác thực
- **Xác thực phía client**: Kích hoạt xác thực theo thời gian thực khi bạn nhập Field, hiển thị thông báo lỗi ngay lập tức
- **Xác thực Field phía server**: Sau khi gửi dữ liệu, server sẽ xác thực trước khi lưu vào database, thông báo lỗi được trả về qua phản hồi API
- **Phạm vi áp dụng**: Xác thực Field phía server ngoài việc có hiệu lực khi gửi form, còn được kích hoạt trong workflow, nhập dữ liệu và tất cả các tình huống liên quan đến thêm hoặc sửa dữ liệu
- **Thông báo lỗi**: Xác thực phía client hỗ trợ thông báo lỗi tùy chỉnh, xác thực phía server tạm thời không hỗ trợ thông báo lỗi tùy chỉnh
