---
pkg: '@nocobase/plugin-action-duplicate'
title: "Action nhân bản"
description: "Action nhân bản: nhân bản bản ghi hiện tại, tạo bản ghi mới và điền dữ liệu giống nhau."
keywords: "Action nhân bản,Duplicate,nhân bản bản ghi,Interface Builder,NocoBase"
---
# Nhân bản

## Giới thiệu

Action nhân bản cho phép bạn nhanh chóng tạo bản ghi mới dựa trên dữ liệu hiện có. Hỗ trợ hai cách nhân bản: **Nhân bản trực tiếp** và **Nhân bản vào Form và tiếp tục điền**.

## Cài đặt

Plugin có sẵn, không cần cài đặt riêng.

## Chế độ nhân bản

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Nhân bản trực tiếp

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Mặc định thực thi theo cách "Nhân bản trực tiếp";
- **Field mẫu**: Chỉ định Field cần nhân bản, có thể chọn tất cả, bắt buộc.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Sau khi hoàn thành cấu hình, nhấp nút là có thể nhân bản dữ liệu.

### Nhân bản vào Form và tiếp tục điền

Field mẫu được cấu hình sẽ được điền vào Form làm **giá trị mặc định**, bạn có thể sửa đổi dựa trên giá trị Field mẫu rồi gửi để hoàn thành nhân bản.


![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Cấu hình Field mẫu**: Chỉ các Field được đánh dấu mới được mang ra và làm giá trị mặc định.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Đồng bộ Field Form

- Tự động phân tích các Field đã được cấu hình của Block Form hiện tại làm Field mẫu;
- Nếu sau đó sửa đổi Field Block Form (như điều chỉnh component Field quan hệ), cần mở lại cấu hình mẫu và nhấp **Đồng bộ Field Form**, đảm bảo tính nhất quán.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Dữ liệu mẫu sẽ được điền làm giá trị mặc định Form, bạn có thể sửa đổi rồi gửi để hoàn thành nhân bản.


### Bổ sung

#### Nhân bản, Tham chiếu, Tải trước

Các Field khác nhau (kiểu quan hệ) có logic xử lý khác nhau: **Nhân bản / Tham chiếu / Tải trước**. **Component Field** của Field quan hệ cũng ảnh hưởng đến logic xử lý:

- Select / Record picker: Dùng cho **Tham chiếu**
- Sub-form / Sub-table: Dùng cho **Nhân bản**

**Nhân bản**

- Field thông thường là nhân bản;
- hasOne / hasMany chỉ có thể là nhân bản (loại quan hệ này không nên sử dụng các component Field kiểu chọn như Select dropdown, Popup picker, mà nên sử dụng các component Field như Sub-Form, Sub-Table);
- Thay đổi component của hasOne / hasMany **sẽ không** thay đổi logic xử lý (vẫn là nhân bản);
- Field quan hệ được nhân bản, tất cả Field con đều có thể chọn.

**Tham chiếu**

- belongsTo / belongsToMany là tham chiếu;
- Nếu điều chỉnh component Field từ "Select dropdown" sang "Sub-Form", quan hệ sẽ chuyển từ **tham chiếu thành nhân bản** (sau khi chuyển thành nhân bản, tất cả Field con đều có thể chọn).

**Tải trước**

- Field quan hệ dưới Field tham chiếu là tải trước;
- Field tải trước có thể chuyển thành tham chiếu hoặc nhân bản sau khi thay đổi component.

#### Chọn tất cả

- Sẽ đánh dấu tất cả các **Field nhân bản** và **Field tham chiếu**.

#### Bản ghi được chọn làm mẫu dữ liệu sẽ lọc các Field sau

- Khóa chính của dữ liệu quan hệ nhân bản sẽ bị lọc; tham chiếu và tải trước không lọc khóa chính;
- Khóa ngoại;
- Field không cho phép trùng lặp;
- Field sắp xếp;
- Field mã tự động;
- Mật khẩu;
- Người tạo, ngày tạo;
- Người cập nhật cuối, ngày cập nhật cuối.

#### Đồng bộ Field Form

- Tự động phân tích các Field đã được cấu hình trong Block Form hiện tại làm Field mẫu;
- Nếu sau đó sửa đổi Field Block Form (như điều chỉnh component Field quan hệ), cần đồng bộ lại, đảm bảo tính nhất quán.
