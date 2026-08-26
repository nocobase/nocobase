---
title: "Node Workflow - Truy vấn dữ liệu"
description: "Node truy vấn dữ liệu: truy vấn một hoặc nhiều dữ liệu theo điều kiện, kết quả được dùng làm biến cho các Node tiếp theo."
keywords: "workflow,truy vấn dữ liệu,Query,thao tác bảng dữ liệu,biến,NocoBase"
---

# Truy vấn dữ liệu

Được dùng để truy vấn dữ liệu thỏa mãn điều kiện của một bảng dữ liệu nào đó và lấy bản ghi dữ liệu.

Có thể cấu hình truy vấn một dữ liệu hoặc nhiều dữ liệu, kết quả truy vấn có thể được dùng làm biến trong các Node tiếp theo. Khi truy vấn nhiều dữ liệu, kết quả truy vấn là một mảng. Khi kết quả truy vấn rỗng, có thể chọn tiếp tục thực thi các Node tiếp theo hay không.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Truy vấn dữ liệu":

![Truy vấn dữ liệu_thêm](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Cấu hình Node

![Node truy vấn_cấu hình Node](https://static-docs.nocobase.com/20240520131324.png)

### Bảng dữ liệu

Chọn bảng dữ liệu cần truy vấn.

### Loại kết quả

Loại kết quả chia thành hai loại "Một dữ liệu" và "Nhiều dòng dữ liệu":

- Một dữ liệu: kết quả là một đối tượng, chỉ là bản ghi khớp đầu tiên hoặc giá trị rỗng.
- Nhiều dữ liệu: kết quả sẽ là một mảng chứa các bản ghi thỏa mãn điều kiện, không có bản ghi khớp thì là mảng rỗng. Có thể qua Node vòng lặp để xử lý từng cái một.

### Điều kiện lọc

Tương tự điều kiện lọc khi truy vấn bảng dữ liệu thông thường, có thể sử dụng biến ngữ cảnh của quy trình.

### Sắp xếp

Khi truy vấn một hoặc nhiều dữ liệu đều có thể qua quy tắc sắp xếp để điều khiển kết quả cần thiết. Ví dụ truy vấn dữ liệu mới nhất, có thể qua trường "Thời gian tạo" sắp xếp giảm dần.

### Phân trang

Khi tập kết quả có thể rất lớn, có thể sử dụng phân trang để điều khiển số lượng kết quả truy vấn. Ví dụ truy vấn 10 dữ liệu mới nhất, có thể qua trường "Thời gian tạo" sắp xếp giảm dần, sau đó đặt phân trang là 1 trang 10 dữ liệu.

### Xử lý khi kết quả rỗng

Ở chế độ kết quả một dữ liệu, nếu không có dữ liệu thỏa mãn điều kiện thì kết quả truy vấn sẽ là `null`, ở chế độ nhiều dữ liệu là mảng rỗng (`[]`). Có thể tùy theo nhu cầu chọn "Khi kết quả truy vấn rỗng, thoát quy trình", sau khi chọn, nếu kết quả truy vấn rỗng thì sẽ không thực thi các Node tiếp theo, thoát sớm với trạng thái thất bại.
