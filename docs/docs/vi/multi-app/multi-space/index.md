---
pkg: "@nocobase/plugin-multi-space"
title: "Multi-space NocoBase"
description: "Plugin Multi-space: cô lập logic instance đơn, cô lập dữ liệu nhiều cửa hàng/nhiều tổ chức, field space, gán người dùng, chuyển đổi space, phân loại dữ liệu cũ, plugin phiên bản chuyên nghiệp."
keywords: "multi-space,Multi Space,cô lập space,nhiều cửa hàng,nhiều tổ chức,field space,cô lập dữ liệu,NocoBase"
---
# Multi-space

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## Giới thiệu

**Plugin Multi-space** cho phép thực hiện nhiều space dữ liệu độc lập thông qua cô lập logic trong một instance ứng dụng đơn.

#### Tình huống áp dụng
- **Nhiều cửa hàng hoặc nhà máy**: Quy trình nghiệp vụ và cấu hình hệ thống nhất quán cao, ví dụ quản lý kho, kế hoạch sản xuất, chiến lược bán hàng và template báo cáo thống nhất, nhưng cần đảm bảo dữ liệu của mỗi đơn vị nghiệp vụ không can thiệp lẫn nhau.
- **Quản lý nhiều tổ chức hoặc công ty con**: Tập đoàn có nhiều tổ chức hoặc công ty con cùng sử dụng nền tảng, nhưng mỗi thương hiệu có dữ liệu khách hàng, sản phẩm và đơn hàng độc lập.


## Cài đặt

Trong Trình quản lý plugin, tìm plugin **Multi-Space** và kích hoạt.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## Hướng dẫn sử dụng

### Quản lý multi-space

Sau khi kích hoạt plugin, vào trang cài đặt **"Người dùng và quyền"**, chuyển sang panel **Space** để quản lý space.

> Ở trạng thái ban đầu sẽ tồn tại một **Unassigned Space** tích hợp sẵn, chủ yếu dùng để xem dữ liệu cũ chưa được liên kết với space.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Tạo space

Click nút "Thêm space" để tạo space mới:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Gán người dùng

Sau khi chọn space đã tạo, có thể đặt người dùng thuộc space đó ở phía bên phải:

> **Mẹo:** Sau khi gán người dùng cho space, cần **refresh trang thủ công** thì danh sách chuyển đổi space ở góc trên bên phải mới được cập nhật để hiển thị space mới nhất.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Chuyển đổi và xem multi-space

Có thể chuyển đổi space hiện tại ở góc trên bên phải.
Khi click vào **icon mắt** bên phải (trạng thái highlight), có thể đồng thời xem dữ liệu của nhiều space.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Quản lý dữ liệu multi-space

1. Đối với các bảng dữ liệu **không chứa field space**, hệ thống sẽ không áp dụng bất kỳ logic liên quan đến space nào.
2. Đối với các bảng dữ liệu **chứa field space**, hệ thống sẽ tự động kích hoạt các quy tắc sau:
   1. Khi tạo dữ liệu, tự động liên kết với space đang được chọn;
   2. Khi truy vấn hoặc lọc dữ liệu, chỉ trả về dữ liệu trong space đang được chọn.

Sau khi bật plugin, khi tạo bảng dữ liệu (Collection) hệ thống sẽ tự động tạo sẵn một **field space**.
**Chỉ các bảng có field này mới được đưa vào logic quản lý space**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Đối với các bảng dữ liệu đã có, có thể thêm field space thủ công để kích hoạt quản lý space:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)


### Phân loại multi-space cho dữ liệu cũ

Đối với dữ liệu đã tồn tại trước khi kích hoạt plugin Multi-space (mặc định không bị ảnh hưởng bởi logic space), có thể phân loại space qua các bước sau:

#### 1. Thêm field space

Thêm field space thủ công cho bảng cũ:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Gán người dùng vào Unassigned Space

Liên kết người dùng quản lý dữ liệu cũ với tất cả các space, cần bao gồm **Unassigned Space** để xem dữ liệu chưa được phân vào space:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Chuyển đổi xem dữ liệu của tất cả các space

Chọn xem dữ liệu của tất cả các space ở phía trên:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Cấu hình trang phân bổ dữ liệu cũ

Tạo một trang mới để phân bổ dữ liệu cũ, hiển thị "field space" trong **trang danh sách** và **trang chỉnh sửa** để dễ dàng điều chỉnh space thuộc về thủ công.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Điều chỉnh field space thành có thể chỉnh sửa

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Phân bổ space dữ liệu thủ công

Thông qua trang trên, chỉnh sửa dữ liệu thủ công, dần dần phân bổ space đúng cho dữ liệu cũ (cũng có thể tự cấu hình bulk edit).
