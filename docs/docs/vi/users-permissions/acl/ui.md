---
pkg: '@nocobase/plugin-acl'
title: "Ứng dụng quyền trong UI"
description: "Quyền NocoBase thể hiện trong UI: hiển thị Block dữ liệu, quyền xem thao tác, cấu hình quyền toàn cục và riêng biệt, hiển thị/ẩn các phần tử giao diện."
keywords: "Quyền UI,hiển thị Block dữ liệu,quyền thao tác,quyền giao diện,ACL,NocoBase"
---

# Ứng dụng trong UI

## Quyền của Block dữ liệu

Việc Block dữ liệu của bảng dữ liệu có hiển thị hay không được điều khiển bởi quyền xem (cấu hình riêng có ưu tiên cao hơn cấu hình toàn cục)

Như hình bên dưới: Trong quyền toàn cục admin có tất cả các quyền, bảng đơn hàng cấu hình quyền riêng (không hiển thị)

Cấu hình quyền toàn cục như sau:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Cấu hình quyền riêng cho bảng đơn hàng như sau:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

Trên UI thể hiện là tất cả các Block của bảng đơn hàng đều không hiển thị

Quy trình cấu hình hoàn chỉnh như sau

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Quyền field

Xem: Điều khiển hiển thị field ở cấp field, ví dụ điều khiển một số field của bảng đơn hàng có hiển thị với một vai trò nhất định

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Trên UI thể hiện là Block của bảng đơn hàng chỉ hiển thị các field đã được cấu hình quyền. Các field hệ thống (Id, CreateAt, Last updated at) ngay cả khi không cấu hình cũng có quyền xem

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- Chỉnh sửa: Điều khiển field có thể chỉnh sửa lưu (cập nhật) hay không

Như hình cấu hình quyền chỉnh sửa các field của bảng đơn hàng (Số lượng và sản phẩm liên kết có quyền chỉnh sửa)

![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

Trên UI thể hiện là Block form thao tác chỉnh sửa của Block bảng đơn hàng chỉ hiển thị các field có quyền chỉnh sửa

![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

Quy trình cấu hình hoàn chỉnh như sau:

![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- Thêm: Điều khiển field có thể thêm (tạo) hay không

Như hình cấu hình quyền thêm các field của bảng đơn hàng (mã đơn hàng, số lượng, sản phẩm, vận đơn có quyền thêm)

![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

Trên UI thể hiện là Block form thao tác thêm của Block bảng đơn hàng chỉ hiển thị các field có quyền thêm

![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- Xuất: Điều khiển field có thể xuất hay không
- Nhập: Điều khiển field có hỗ trợ nhập hay không

## Quyền thao tác

Cấu hình riêng có ưu tiên cao nhất, có cấu hình riêng thì theo cấu hình riêng, không có thì theo quyền cấu hình toàn cục

- Thêm, điều khiển nút thao tác thêm trong Block có hiển thị hay không

Như hình bảng đơn hàng cấu hình quyền thao tác riêng, cho phép thêm

![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

Trên UI thể hiện là nút thêm trong khu vực thao tác của Block bảng đơn hàng được hiển thị

![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- Xem

Điều khiển Block dữ liệu có hiển thị hay không

Như hình cấu hình quyền toàn cục như sau (không có quyền xem)

![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

Cấu hình quyền riêng cho bảng đơn hàng như sau

![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

Trên UI thể hiện là: Tất cả các Block của bảng dữ liệu khác đều không hiển thị, Block của bảng đơn hàng hiển thị.

Quy trình cấu hình ví dụ hoàn chỉnh như sau

![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- Chỉnh sửa

Điều khiển nút thao tác chỉnh sửa trong Block có hiển thị hay không

![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

Bằng cách thiết lập phạm vi dữ liệu, bạn có thể điều khiển sâu hơn quyền thao tác

Như hình thiết lập trong bảng dữ liệu đơn hàng người dùng chỉ có thể chỉnh sửa dữ liệu của riêng mình

![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- Xóa

Điều khiển hiển thị nút thao tác xóa trong Block

![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- Xuất

Điều khiển hiển thị nút thao tác xuất trong Block

- Nhập

Điều khiển hiển thị nút thao tác nhập trong Block

## Quyền quan hệ

### Khi là field

- Quyền của field quan hệ được điều khiển bởi quyền field của bảng nguồn, điều khiển toàn bộ component field quan hệ có hiển thị hay không

Như hình field quan hệ "Khách hàng" trong bảng đơn hàng chỉ có quyền xem và nhập, xuất

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Trên UI thể hiện là field quan hệ khách hàng không hiển thị trong Block thao tác thêm và chỉnh sửa của Block bảng đơn hàng

Quy trình cấu hình ví dụ hoàn chỉnh như sau

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Quyền của field bên trong component field quan hệ (như sub-table/sub-form) được quyết định bởi quyền của bảng dữ liệu đích

Khi component field quan hệ là sub-form:

Như hình bên dưới field quan hệ "Khách hàng" trong bảng đơn hàng, field quan hệ "Khách hàng" trong đơn hàng có tất cả các quyền, trong khi bảng khách hàng được thiết lập quyền riêng là chỉ đọc

Cấu hình quyền riêng cho bảng đơn hàng như sau, field quan hệ "Khách hàng" có tất cả các quyền field

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Cấu hình quyền riêng cho bảng khách hàng như sau, các field trong bảng khách hàng chỉ có quyền xem

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Trên UI thể hiện là: Trong Block bảng đơn hàng field quan hệ khách hàng hiển thị, và khi chuyển sang sub-form (các field trong sub-form hiển thị trong chi tiết, không hiển thị trong thao tác tạo mới và chỉnh sửa)

Quy trình cấu hình ví dụ hoàn chỉnh như sau

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Điều khiển sâu hơn quyền field bên trong sub-form: các field cụ thể có quyền

Như hình cấu hình quyền field riêng cho bảng khách hàng (Tên khách hàng không hiển thị không thể chỉnh sửa)

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Quy trình cấu hình ví dụ hoàn chỉnh như sau

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Khi component field quan hệ là sub-table thì tình huống tương tự như sub-form:

Như hình trong bảng đơn hàng có field quan hệ "Vận đơn", field quan hệ "Vận đơn" trong đơn hàng có tất cả các quyền, trong khi bảng vận đơn được thiết lập quyền riêng là chỉ đọc

Trên UI thể hiện là: Field quan hệ này hiển thị, và khi chuyển sang sub-table (các field trong sub-table hiển thị trong thao tác xem, không hiển thị trong thao tác tạo mới và chỉnh sửa)

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Điều khiển sâu hơn quyền field bên trong sub-table: các field cụ thể có quyền

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Khi là Block

- Block quan hệ được điều khiển bởi quyền bảng đích của field quan hệ tương ứng, không liên quan đến quyền field quan hệ

Như hình Block quan hệ "Khách hàng" có hiển thị hay không được điều khiển bởi quyền của bảng khách hàng

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Field bên trong Block quan hệ được điều khiển bởi quyền field trong bảng đích

Như hình thiết lập một số field cụ thể có quyền xem cho bảng khách hàng

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)
