---
title: "Node Workflow - Cập nhật dữ liệu"
description: "Node cập nhật dữ liệu: cập nhật bản ghi bảng dữ liệu theo điều kiện, hỗ trợ điều kiện lọc, chế độ cập nhật, gán biến."
keywords: "workflow,cập nhật dữ liệu,Update,thao tác bảng dữ liệu,điều kiện lọc,NocoBase"
---

# Cập nhật dữ liệu

Được dùng để cập nhật dữ liệu thỏa mãn điều kiện của một bảng dữ liệu nào đó.

Phần bảng dữ liệu và gán giá trị trường giống như Node thêm, sự khác biệt của Node cập nhật chủ yếu là thêm điều kiện lọc và cần chọn chế độ cập nhật. Ngoài ra, kết quả của Node cập nhật sẽ trả về số dòng dữ liệu cập nhật thành công, chỉ có thể xem trong lịch sử thực thi, không thể được dùng làm biến trong các Node tiếp theo.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Cập nhật dữ liệu":

![Cập nhật dữ liệu_thêm](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Cấu hình Node

![Node cập nhật_cấu hình Node](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Bảng dữ liệu

Chọn bảng dữ liệu cần cập nhật.

### Chế độ cập nhật

Chế độ cập nhật có hai chế độ:

* Cập nhật hàng loạt: sẽ không kích hoạt sự kiện bảng dữ liệu của từng dữ liệu được cập nhật nữa, hiệu suất tốt hơn, phù hợp với việc cập nhật lượng dữ liệu lớn.
* Cập nhật từng cái một: sẽ kích hoạt sự kiện bảng dữ liệu của từng dữ liệu được cập nhật, nhưng dưới lượng dữ liệu lớn sẽ có vấn đề về hiệu suất, cần sử dụng cẩn thận.

Thông thường tùy theo dữ liệu đích cần cập nhật và việc có cần kích hoạt các sự kiện Workflow khác hay không để chọn, nếu là cập nhật một dữ liệu theo khóa chính thì khuyến nghị sử dụng cập nhật từng cái một, nếu là cập nhật nhiều dữ liệu theo điều kiện thì khuyến nghị sử dụng cập nhật hàng loạt.

### Điều kiện lọc

Tương tự điều kiện lọc khi truy vấn bảng dữ liệu thông thường, có thể sử dụng biến ngữ cảnh của quy trình.

### Giá trị trường

Tương tự gán giá trị trường của Node thêm, có thể sử dụng biến của ngữ cảnh quy trình hoặc điền thủ công giá trị tĩnh.

Lưu ý: dữ liệu được Node cập nhật trong Workflow cập nhật sẽ không tự động xử lý dữ liệu "Người sửa cuối cùng", cần tự cấu hình giá trị của trường này theo tình huống.

## Ví dụ

Ví dụ khi thêm "Bài viết", cần tự động cập nhật trường "Số lượng bài viết" của bảng "Danh mục bài viết", có thể sử dụng Node cập nhật để triển khai:

![Node cập nhật_ví dụ_cấu hình Node](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Khi Workflow được kích hoạt, sẽ tự động cập nhật trường "Số lượng bài viết" của bảng "Danh mục bài viết" thành số lượng bài viết hiện tại + 1.
