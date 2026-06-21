---
title: "Phạm vi dữ liệu"
description: "Cấu hình Block: cài đặt phạm vi dữ liệu, hỗ trợ điều kiện lọc, lọc theo quyền, kiểm soát phạm vi dữ liệu hiển thị của Block."
keywords: "phạm vi dữ liệu,lọc dữ liệu,lọc theo quyền,cấu hình Block,Interface Builder,NocoBase"
---

# Cài đặt phạm vi dữ liệu

## Giới thiệu

Cài đặt phạm vi dữ liệu là định nghĩa điều kiện lọc mặc định cho Block dữ liệu, bạn có thể điều chỉnh phạm vi dữ liệu linh hoạt theo nhu cầu nghiệp vụ, nhưng bất kể thực hiện thao tác lọc nào, hệ thống đều sẽ tự động áp dụng điều kiện lọc mặc định này, đảm bảo dữ liệu luôn phù hợp với giới hạn phạm vi đã chỉ định.

## Hướng dẫn sử dụng

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

Field lọc hỗ trợ chọn Field của Table này, Field của Table quan hệ.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Toán tử

Các loại Field khác nhau hỗ trợ các toán tử khác nhau, ví dụ Field văn bản hỗ trợ các toán tử bằng, không bằng, chứa, v.v., Field số hỗ trợ các toán tử lớn hơn, nhỏ hơn, v.v., Field ngày tháng hỗ trợ các toán tử trong phạm vi, trước ngày cụ thể, v.v.

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Giá trị tĩnh

Ví dụ: Lọc dữ liệu theo "Trạng thái" đơn hàng.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Giá trị biến

Ví dụ: Lọc dữ liệu đơn hàng của người dùng hiện tại.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

Xem thêm về biến tại [Biến](/interface-builder/variables)
