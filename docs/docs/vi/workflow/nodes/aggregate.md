---
pkg: '@nocobase/plugin-workflow-aggregate'
title: "Node Workflow - Truy vấn tổng hợp"
description: "Node truy vấn tổng hợp: thực thi hàm tổng hợp thống kê trên bảng dữ liệu, trả về kết quả thống kê cho các Node tiếp theo sử dụng, thường được dùng cho báo cáo."
keywords: "workflow,truy vấn tổng hợp,Aggregate,thống kê,báo cáo,NocoBase"
---

# Truy vấn tổng hợp

## Giới thiệu

Được dùng để truy vấn hàm tổng hợp đối với dữ liệu thỏa mãn điều kiện của một bảng dữ liệu nào đó và trả về kết quả thống kê tương ứng. Thường được dùng để xử lý dữ liệu thống kê liên quan đến báo cáo.

Về mặt triển khai, Node dựa trên hàm tổng hợp của cơ sở dữ liệu, hiện chỉ hỗ trợ thống kê cho một trường đơn của một bảng dữ liệu, giá trị kết quả thống kê sẽ được lưu trong kết quả của Node để các Node khác sau này sử dụng.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Truy vấn tổng hợp":

![Tạo Node truy vấn tổng hợp](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Cấu hình Node

![Node truy vấn tổng hợp_cấu hình Node](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Hàm tổng hợp

Hỗ trợ 5 hàm tổng hợp trong SQL gồm `COUNT`, `SUM`, `AVG`, `MIN` và `MAX`, chọn một trong số đó để truy vấn tổng hợp dữ liệu.

### Loại đích

Mục tiêu của truy vấn tổng hợp có thể được chọn qua hai chế độ, một là trực tiếp chọn bảng dữ liệu đích và một trường trong đó, hai là thông qua đối tượng dữ liệu đã có trong ngữ cảnh quy trình, chọn bảng dữ liệu quan hệ một - nhiều và trường của nó để truy vấn tổng hợp.

### Loại trùng

Tức `DISTINCT` trong SQL, trường loại trùng giống với trường bảng dữ liệu được chọn, tạm thời chưa hỗ trợ chọn hai trường khác nhau.

### Điều kiện lọc

Tương tự điều kiện lọc khi truy vấn bảng dữ liệu thông thường, có thể sử dụng biến ngữ cảnh của quy trình.

## Ví dụ

Mục tiêu tổng hợp là "Dữ liệu bảng dữ liệu" tương đối dễ hiểu, ở đây lấy ví dụ "Thống kê tổng số bài viết của danh mục bài viết sau khi thêm bài viết mới" để giới thiệu cách dùng mục tiêu tổng hợp là "Dữ liệu bảng dữ liệu liên kết".

Đầu tiên, tạo hai bảng dữ liệu: "Bài viết" và "Danh mục", trong đó bài viết có một trường quan hệ nhiều - một chỉ đến bảng danh mục, đồng thời tạo trường quan hệ ngược danh mục một - nhiều bài viết:

| Tên trường   | Loại           |
| -------- | -------------- |
| Tiêu đề     | Văn bản một dòng       |
| Danh mục thuộc về | Nhiều - một (Danh mục) |

| Tên trường   | Loại           |
| -------- | -------------- |
| Tên danh mục | Văn bản một dòng       |
| Bài viết bao gồm | Một - nhiều (Bài viết) |

Tiếp theo tạo một Workflow được kích hoạt bởi sự kiện bảng dữ liệu, chọn kích hoạt sau khi thêm dữ liệu vào bảng bài viết.

Sau đó thêm Node truy vấn tổng hợp với cấu hình như sau:

![Node truy vấn tổng hợp_ví dụ_cấu hình Node](https://static-docs.nocobase.com/542272e638c6c0a567373d1b37ddda78.png)

Như vậy sau khi Workflow được kích hoạt, Node truy vấn tổng hợp sẽ thống kê số lượng tất cả bài viết trong danh mục của bài viết được thêm và lưu làm kết quả của Node.

:::info{title=Mẹo}
Trong đó nếu cần sử dụng dữ liệu quan hệ của Trigger sự kiện bảng dữ liệu, cần cấu hình các trường liên quan của "Preload dữ liệu liên kết" trong Trigger, nếu không sẽ không thể chọn.
:::
