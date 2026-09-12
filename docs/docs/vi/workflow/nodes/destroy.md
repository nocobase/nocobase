---
title: "Node Workflow - Xóa dữ liệu"
description: "Node xóa dữ liệu: xóa bản ghi bảng dữ liệu theo điều kiện, hỗ trợ xóa hàng loạt, trả về số dòng đã xóa."
keywords: "workflow,xóa dữ liệu,Destroy,thao tác bảng dữ liệu,xóa hàng loạt,NocoBase"
---

# Xóa dữ liệu

Được dùng để xóa dữ liệu thỏa mãn điều kiện của một bảng dữ liệu nào đó.

Cách sử dụng cơ bản của Node xóa tương tự Node cập nhật, chỉ khác là Node xóa không cần gán giá trị trường, chỉ cần chọn bảng dữ liệu và điều kiện lọc. Kết quả của Node xóa sẽ trả về số dòng dữ liệu xóa thành công, chỉ có thể xem trong lịch sử thực thi, không thể được dùng làm biến trong các Node tiếp theo.

:::info{title=Lưu ý}
Hiện Node xóa không hỗ trợ xóa từng cái một, đều là xóa hàng loạt, vì vậy sẽ không kích hoạt các sự kiện xóa cho từng dữ liệu.
:::

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Xóa dữ liệu":

![Tạo Node xóa dữ liệu](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Cấu hình Node

![Node xóa_cấu hình Node](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Bảng dữ liệu

Chọn bảng dữ liệu cần xóa dữ liệu.

### Điều kiện lọc

Tương tự điều kiện lọc khi truy vấn bảng dữ liệu thông thường, có thể sử dụng biến ngữ cảnh của quy trình.

## Ví dụ

Ví dụ định kỳ dọn dẹp dữ liệu đơn hàng lịch sử không hợp lệ đã hủy, có thể sử dụng Node xóa để triển khai:

![Node xóa_ví dụ_cấu hình Node](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Workflow sẽ được kích hoạt định kỳ và thực thi xóa tất cả dữ liệu đơn hàng lịch sử không hợp lệ đã hủy.
