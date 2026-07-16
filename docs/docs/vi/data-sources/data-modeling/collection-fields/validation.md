---
title: "Xác thực trường"
description: "Quy tắc xác thực trường: các quy tắc cấu hình và xác thực dựa trên Joi, hỗ trợ độ dài tối thiểu/tối đa, bắt buộc đối với các kiểu như chuỗi, số, ngày tháng."
keywords: "xác thực trường, kiểm tra trường,Joi,quy tắc xác thực,quy tắc cấu hình,NocoBase"
---

# Xác thực trường
Để đảm bảo tính chính xác, an toàn và nhất quán của dữ liệu, NocoBase cung cấp tính năng xác thực trường. Tính năng này chủ yếu gồm hai phần: quy tắc cấu hình và quy tắc xác thực.

## Quy tắc cấu hình
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Các trường hệ thống NocoBase tích hợp các quy tắc của [Joi](https://joi.dev/api/), với các trường hợp được hỗ trợ như sau:

### Kiểu chuỗi
Các kiểu trường NocoBase tương ứng với kiểu chuỗi Joi bao gồm: văn bản một dòng, văn bản nhiều dòng, số điện thoại, email, URL, mật khẩu, UUID.
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
Các kiểu trường NocoBase tương ứng với kiểu số Joi bao gồm: số nguyên, số, phần trăm.
#### Quy tắc chung
- Lớn hơn
- Nhỏ hơn
- Giá trị tối đa
- Giá trị tối thiểu
- Bội số nguyên

#### Số nguyên
Ngoài các quy tắc chung, trường số nguyên còn hỗ trợ [xác thực số nguyên](https://joi.dev/api/?v=17.13.3#numberinteger) và [xác thực số nguyên không an toàn](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Số và phần trăm
Ngoài các quy tắc chung, trường số và phần trăm còn hỗ trợ [xác thực độ chính xác](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Kiểu ngày tháng
Các kiểu trường NocoBase tương ứng với kiểu ngày tháng Joi bao gồm: ngày tháng (có múi giờ), ngày tháng (không có múi giờ), chỉ ngày tháng, dấu thời gian Unix.

Các quy tắc xác thực được hỗ trợ:
- Lớn hơn
- Nhỏ hơn
- Giá trị tối đa
- Giá trị tối thiểu
- Xác thực định dạng dấu thời gian
- Bắt buộc

### Trường quan hệ
Trường quan hệ chỉ hỗ trợ xác thực bắt buộc. Lưu ý rằng xác thực bắt buộc đối với trường quan hệ hiện chưa được hỗ trợ trong ngữ cảnh biểu mẫu con hoặc bảng con.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Áp dụng quy tắc xác thực
Sau khi cấu hình quy tắc cho trường, các quy tắc xác thực tương ứng sẽ được kích hoạt khi thêm hoặc chỉnh sửa dữ liệu.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Khi trường được sử dụng trong biểu mẫu, các quy tắc xác thực trường cũng sẽ hiển thị trong phần cài đặt xác thực của trường. Các quy tắc này sẽ xuất hiện dưới mục 「Quy tắc xác thực trường phía máy chủ」 và chỉ được hiển thị ở chế độ chỉ đọc tại đây. Nếu cần chỉnh sửa các quy tắc này, hãy quay lại 「Cấu hình nguồn dữ liệu / bảng dữ liệu」 để chỉnh sửa trường.

Bạn vẫn có thể thêm các quy tắc bổ sung cho trường biểu mẫu hiện tại trong mục 「Quy tắc xác thực phía máy khách」. Các quy tắc này chỉ ảnh hưởng đến thành phần trường hiện tại. Các quy tắc xác thực có hiệu lực cuối cùng sẽ được hợp nhất từ 「Quy tắc xác thực trường phía máy chủ」 và 「Quy tắc xác thực phía máy khách」.

Quy tắc xác thực cũng áp dụng cho các thành phần bảng con và biểu mẫu con:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Lưu ý rằng trong ngữ cảnh biểu mẫu con hoặc bảng con, xác thực bắt buộc đối với trường quan hệ hiện chưa có hiệu lực.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Sự khác biệt giữa quy tắc xác thực trường phía máy chủ và quy tắc xác thực phía máy khách
Quy tắc xác thực trường phía máy chủ và quy tắc xác thực phía máy khách được cấu hình ở các vị trí khác nhau, đồng thời phạm vi tác động cũng khác nhau.

### Khác biệt về cách cấu hình
- **Quy tắc xác thực trường phía máy chủ**: Thiết lập quy tắc trường trong 「Cấu hình nguồn dữ liệu / bảng dữ liệu」. Các quy tắc này là quy tắc cơ bản của trường
- **Quy tắc xác thực phía máy khách**: Thêm các quy tắc bổ sung trong phần cài đặt của trường biểu mẫu. Các quy tắc này chỉ ảnh hưởng đến thành phần trường hiện tại
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Khác biệt về thời điểm kích hoạt xác thực
- **Quy tắc xác thực trường phía máy chủ**: Khi trường được sử dụng trong biểu mẫu, xác thực phía trước sẽ được kích hoạt; trước khi ghi dữ liệu cũng sẽ thực hiện xác thực. Các quy tắc này cũng được áp dụng trong các trường hợp thêm hoặc chỉnh sửa dữ liệu như quy trình làm việc và nhập dữ liệu
- **Quy tắc xác thực phía máy khách**: Chỉ kích hoạt xác thực phía trước trong trường biểu mẫu hiện tại
- **Hiển thị quy tắc**: Quy tắc xác thực trường phía máy chủ sẽ được hiển thị ở chế độ chỉ đọc dưới dạng quy tắc kế thừa. Quy tắc xác thực phía máy khách sẽ được hiển thị riêng và có thể chỉnh sửa tại đây
- **Thông báo lỗi**: Quy tắc xác thực phía máy khách hỗ trợ tùy chỉnh thông báo lỗi, còn quy tắc xác thực trường phía máy chủ hiện chưa hỗ trợ tùy chỉnh thông báo lỗi
