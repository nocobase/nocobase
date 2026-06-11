---
title: "Block Tree Filter"
description: "Block Tree Filter: hiển thị điều kiện lọc dưới dạng cây, lọc phân cấp Block dữ liệu, phù hợp với các trường hợp lọc liên kết của dữ liệu cây."
keywords: "Tree Filter, TreeFilter, lọc cây, lọc phân cấp, làm mới liên kết, Interface Builder, NocoBase"
---

# Tree Filter

## Giới thiệu

Block Tree Filter cung cấp khả năng lọc dữ liệu thông qua cấu trúc cây, phù hợp với các trường hợp dữ liệu có quan hệ phân cấp, ví dụ danh mục sản phẩm, cấu trúc tổ chức, v.v.
Bạn có thể chọn các node ở các cấp khác nhau để lọc liên kết Block dữ liệu liên quan.

## Cách sử dụng

Block Tree Filter cần được sử dụng kết hợp với Block dữ liệu để cung cấp khả năng lọc cho nó.

Các bước cấu hình như sau:

1. Bật chế độ cấu hình, thêm Block "Tree Filter" và một Block dữ liệu (như "Block Table") vào Trang.
2. Cấu hình Block Tree Filter, chọn Table dữ liệu cây (như Table danh mục sản phẩm).
3. Cài đặt quan hệ kết nối giữa Block Tree Filter và Block dữ liệu.
4. Sau khi cấu hình hoàn thành, nhấp vào node cây để lọc Block dữ liệu.

## Thêm Block

Ở chế độ cấu hình, nhấp nút "Thêm Block" của Trang, chọn "Cây" trong danh mục "Block lọc" để hoàn thành thêm.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_02_35_PM.png)

## Tùy chọn cấu hình Block

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_12_PM%20(1).png)

### Kết nối Block dữ liệu

Block Tree Filter phải được kết nối với Block dữ liệu mới có hiệu lực.
Thông qua tùy chọn cấu hình "Kết nối Block dữ liệu", có thể thiết lập quan hệ liên kết giữa Tree Filter và Block Table, danh sách, biểu đồ, v.v. trong Trang, từ đó thực hiện chức năng lọc.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_14_PM.png)

### Field tiêu đề

Dùng để chỉ định Field hiển thị của node cây (tức là tên node).

### Tìm kiếm

Sau khi bật, hỗ trợ tìm kiếm nhanh và định vị node cây bằng từ khóa, nâng cao hiệu quả tìm kiếm.

### Mở rộng tất cả

Kiểm soát có mở rộng tất cả các node cây mặc định khi Trang tải lần đầu hay không.

### Lọc node con

Sau khi bật, khi chọn một node nào đó, sẽ đồng thời bao gồm dữ liệu của tất cả các node con của nó để lọc.
Phù hợp với các trường hợp cần xem tất cả dữ liệu cấp con theo phân loại cấp cha.
