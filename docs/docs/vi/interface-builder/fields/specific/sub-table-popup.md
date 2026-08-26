---
title: "Sub-Table (chỉnh sửa qua Popup)"
description: "Field Sub-Table: chế độ chỉnh sửa qua Popup, nhấp để mở Popup chỉnh sửa dữ liệu liên kết một-nhiều."
keywords: "Sub-Table,chỉnh sửa qua Popup,SubTable,một-nhiều,Interface Builder,NocoBase"
---

# Sub-Table (chỉnh sửa qua Popup)

## Giới thiệu

Sub-Table (chỉnh sửa qua Popup) được dùng để quản lý dữ liệu liên kết đến nhiều (như một-nhiều, nhiều-nhiều) trong Form. Table chỉ hiển thị các bản ghi đã liên kết, việc thêm mới/chỉnh sửa được thực hiện trong Popup, dữ liệu sẽ được lưu vào kho thống nhất khi gửi Form chính.

## Hướng dẫn sử dụng

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

Trường hợp áp dụng:

- Field liên kết: o2m / m2m / mbm
- Mục đích điển hình: Chi tiết đơn hàng, danh sách mục con, tag/thành viên liên kết, v.v.

## Tùy chọn cấu hình Field

### Cho phép chọn dữ liệu hiện có (mặc định: bật)

Hỗ trợ chọn liên kết từ dữ liệu hiện có.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Component Field

[Component Field](/interface-builder/fields/association-field): chuyển sang component Field quan hệ khác, như Select dropdown, Data Picker, v.v.

### Cho phép giải tỏa liên kết dữ liệu hiện có (mặc định: bật)

> Kiểm soát dữ liệu đã liên kết trong Form chỉnh sửa có cho phép giải tỏa liên kết với dữ liệu hiện có hay không, dữ liệu thêm mới luôn được phép xóa.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Cho phép thêm mới (mặc định: bật)

Kiểm soát có hiển thị nút thêm hay không. Khi bạn không có quyền create cho Table mục tiêu hiện tại, nút sẽ bị vô hiệu hóa và hiển thị thông báo không có quyền.

### Cho phép chỉnh sửa nhanh (mặc định: tắt)

Sau khi bật, khi di chuột vào ô sẽ xuất hiện biểu tượng chỉnh sửa, có thể chỉnh sửa nhanh nội dung ô.

Hỗ trợ bật chỉnh sửa nhanh cho tất cả Field trên component Field quan hệ.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Cũng hỗ trợ bật chỉnh sửa nhanh cho từng Field cột.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Kích thước phân trang (mặc định: 10)

Cài đặt số bản ghi hiển thị trên mỗi Trang của Sub-Table.

## Giải thích hành vi

- Khi chọn bản ghi hiện có sẽ loại bỏ trùng lặp theo khóa chính, tránh liên kết trùng lặp cùng một bản ghi
- Bản ghi thêm mới sẽ được điền trực tiếp vào Sub-Table, mặc định chuyển đến Trang chứa bản ghi mới thêm
- Chỉnh sửa nội dòng chỉ sửa đổi dữ liệu hàng hiện tại
- Xóa chỉ giải tỏa liên kết trong Form hiện tại, không xóa dữ liệu nguồn
- Dữ liệu được lưu vào kho thống nhất khi gửi Form chính
