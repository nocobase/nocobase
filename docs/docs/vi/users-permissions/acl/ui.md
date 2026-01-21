---
pkg: '@nocobase/plugin-acl'
---

:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Ứng dụng trong Giao diện người dùng

## Quyền của khối dữ liệu

Khả năng hiển thị của các khối dữ liệu trong một **bộ sưu tập** được kiểm soát bởi quyền thao tác xem. Các cấu hình riêng lẻ sẽ có ưu tiên cao hơn cài đặt toàn cục.

Ví dụ, trong cài đặt quyền toàn cục, vai trò "admin" có toàn quyền truy cập. Tuy nhiên, **bộ sưu tập** Đơn hàng có thể được cấu hình quyền riêng lẻ, khiến nó không hiển thị.

Cấu hình quyền toàn cục:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Cấu hình quyền riêng lẻ cho **bộ sưu tập** Đơn hàng:

![](https://static-docs.nocobase.com/a88c7a41247001c1610bf402a4a2c1.png)

Trên giao diện người dùng, tất cả các khối trong **bộ sưu tập** Đơn hàng đều không hiển thị.

Quy trình cấu hình hoàn chỉnh như sau:

![](https://static-docs.nocobase.com/b283c004ffe0a746fddbffcf4f27b1df.gif)

## Quyền của trường

**Xem**: Quyền này kiểm soát khả năng hiển thị của các trường ở cấp độ trường, cho phép bạn xác định trường nào hiển thị với các vai trò cụ thể trong **bộ sưu tập** Đơn hàng.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Trên giao diện người dùng, chỉ những trường có quyền được cấu hình mới hiển thị trong khối của **bộ sưu tập** Đơn hàng. Các trường hệ thống (Id, CreatedAt, LastUpdatedAt) vẫn có quyền xem ngay cả khi không được cấu hình cụ thể.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Chỉnh sửa**: Kiểm soát xem các trường có thể được chỉnh sửa và lưu (cập nhật) hay không.

  Như hình minh họa, cấu hình quyền chỉnh sửa cho các trường của **bộ sưu tập** Đơn hàng (số lượng và các mặt hàng liên quan có quyền chỉnh sửa):

  ![](https://static-docs.nocobase.com/6531ca4124887547b5719e2146ba93.png)

  Trên giao diện người dùng, trong khối biểu mẫu thao tác chỉnh sửa của khối **bộ sưu tập** Đơn hàng, chỉ hiển thị các trường có quyền chỉnh sửa.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Quy trình cấu hình hoàn chỉnh như sau:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Thêm**: Xác định xem các trường có thể được thêm (tạo mới) hay không.

  Như hình minh họa, cấu hình quyền thêm cho các trường của **bộ sưu tập** Đơn hàng (mã đơn hàng, số lượng, sản phẩm và vận đơn có quyền thêm):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  Trên giao diện người dùng, trong khối biểu mẫu thao tác thêm của khối **bộ sưu tập** Đơn hàng, chỉ hiển thị các trường có quyền thêm.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Xuất**: Kiểm soát xem các trường có thể được xuất hay không.
- **Nhập**: Kiểm soát xem các trường có hỗ trợ nhập hay không.

## Quyền thao tác

Các quyền được cấu hình riêng lẻ có ưu tiên cao nhất. Nếu có cấu hình quyền cụ thể, chúng sẽ ghi đè lên cài đặt toàn cục; nếu không, cài đặt toàn cục sẽ được áp dụng.

- **Thêm**: Kiểm soát xem nút thao tác thêm có hiển thị trong một khối hay không.

  Như hình minh họa, cấu hình quyền thao tác riêng lẻ cho **bộ sưu tập** Đơn hàng để cho phép thêm:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Khi thao tác thêm được cho phép, nút thêm sẽ hiển thị trong khu vực thao tác của khối **bộ sưu tập** Đơn hàng trên giao diện người dùng.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Xem**: Xác định xem khối dữ liệu có hiển thị hay không.

  Cấu hình quyền toàn cục như sau (không có quyền xem):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Cấu hình quyền riêng lẻ cho **bộ sưu tập** Đơn hàng như sau:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  Trên giao diện người dùng, các khối dữ liệu của tất cả các **bộ sưu tập** khác đều ẩn, nhưng khối của **bộ sưu tập** Đơn hàng thì hiển thị.

  Quy trình cấu hình ví dụ hoàn chỉnh như sau:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Chỉnh sửa**: Kiểm soát xem nút thao tác chỉnh sửa có hiển thị trong một khối hay không.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Bạn có thể tinh chỉnh thêm quyền thao tác bằng cách thiết lập phạm vi dữ liệu.

  Ví dụ, thiết lập **bộ sưu tập** Đơn hàng để người dùng chỉ có thể chỉnh sửa dữ liệu của chính họ:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Xóa**: Kiểm soát xem nút thao tác xóa có hiển thị trong một khối hay không.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Xuất**: Kiểm soát xem nút thao tác xuất có hiển thị trong một khối hay không.

- **Nhập**: Kiểm soát xem nút thao tác nhập có hiển thị trong một khối hay không.

## Quyền liên kết

### Khi là một trường

- Quyền của một trường liên kết được kiểm soát bởi quyền trường của **bộ sưu tập** nguồn. Điều này kiểm soát liệu toàn bộ thành phần trường liên kết có hiển thị hay không.

Ví dụ, trong **bộ sưu tập** Đơn hàng, trường liên kết "Khách hàng" chỉ có quyền xem, nhập và xuất.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Trên giao diện người dùng, điều này có nghĩa là trường liên kết "Khách hàng" sẽ không hiển thị trong các khối thao tác thêm và chỉnh sửa của **bộ sưu tập** Đơn hàng.

Quy trình cấu hình ví dụ hoàn chỉnh như sau:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Quyền đối với các trường bên trong thành phần trường liên kết (chẳng hạn như bảng con hoặc biểu mẫu con) được xác định bởi quyền của **bộ sưu tập** đích.

Khi thành phần trường liên kết là một biểu mẫu con:

Như hình minh họa bên dưới, trường liên kết "Khách hàng" trong **bộ sưu tập** Đơn hàng có tất cả các quyền, trong khi **bộ sưu tập** Khách hàng được đặt chỉ đọc.

Cấu hình quyền riêng lẻ cho **bộ sưu tập** Đơn hàng, trong đó trường liên kết "Khách hàng" có tất cả các quyền trường:

![](https://static-docs.nocobase.com/3a3ab972f14a7b3a35361219d67fa40.png)

Cấu hình quyền riêng lẻ cho **bộ sưu tập** Khách hàng, trong đó các trường chỉ có quyền xem:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Trên giao diện người dùng, trường liên kết "Khách hàng" hiển thị trong khối **bộ sưu tập** Đơn hàng. Tuy nhiên, khi chuyển sang biểu mẫu con, các trường bên trong biểu mẫu con hiển thị trong chế độ xem chi tiết nhưng không hiển thị trong các thao tác thêm và chỉnh sửa.

Quy trình cấu hình ví dụ hoàn chỉnh như sau:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Để kiểm soát thêm quyền đối với các trường bên trong biểu mẫu con, bạn có thể cấp quyền cho từng trường riêng lẻ.

Như hình minh họa, **bộ sưu tập** Khách hàng được cấu hình với quyền trường riêng lẻ (Tên khách hàng không hiển thị và không thể chỉnh sửa).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Quy trình cấu hình ví dụ hoàn chỉnh như sau:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Khi thành phần trường liên kết là một bảng con, tình huống tương tự như với biểu mẫu con:

Như hình minh họa, trường liên kết "Vận đơn" trong **bộ sưu tập** Đơn hàng có tất cả các quyền, trong khi **bộ sưu tập** Vận đơn được đặt chỉ đọc.

Trên giao diện người dùng, trường liên kết này hiển thị. Tuy nhiên, khi chuyển sang bảng con, các trường bên trong bảng con hiển thị trong thao tác xem nhưng không hiển thị trong các thao tác thêm và chỉnh sửa.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Để kiểm soát thêm quyền đối với các trường bên trong bảng con, bạn có thể cấp quyền cho từng trường riêng lẻ:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Khi là một khối

- Khả năng hiển thị của một khối liên kết được kiểm soát bởi quyền của **bộ sưu tập** đích của trường liên kết tương ứng, và không phụ thuộc vào quyền của trường liên kết đó.

Ví dụ, việc khối liên kết "Khách hàng" có hiển thị hay không được kiểm soát bởi quyền của **bộ sưu tập** Khách hàng.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Các trường bên trong một khối liên kết được kiểm soát bởi quyền trường trong **bộ sưu tập** đích.

Như hình minh họa, bạn có thể thiết lập quyền xem cho từng trường riêng lẻ trong **bộ sưu tập** Khách hàng.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)