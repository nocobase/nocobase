---
title: "Chế độ hiển thị"
description: "Cấu hình Field: cài đặt chế độ hiển thị Field, hỗ trợ chuyển đổi giữa các chế độ có thể chỉnh sửa, chỉ đọc, ẩn."
keywords: "chế độ hiển thị,pattern,chỉ đọc,có thể chỉnh sửa,Interface Builder,NocoBase"
---

# Chế độ hiển thị

## Giới thiệu

Khác với Block, component Field có ba chế độ hiển thị (chỉ Field trong Form mới hỗ trợ), khi chuyển đổi các chế độ hiển thị khác nhau sẽ tương ứng với các tùy chọn cấu hình Field khác nhau.

- Có thể chỉnh sửa;
- Chỉ đọc (không thể chỉnh sửa);
- Chỉ đọc (chế độ đọc);

### Chế độ hiển thị của Field thông thường

![20251028220145](https://static-docs.nocobase.com/20251028220145.png)

- Trạng thái vô hiệu hóa

![20251028220211](https://static-docs.nocobase.com/20251028220211.png)

- Trạng thái đọc

![20251028220250](https://static-docs.nocobase.com/20251028220250.png)

### Chế độ hiển thị của Field quan hệ

**Chế độ hiển thị của Field quan hệ** quyết định cách Field này được hiển thị trên giao diện và quyết định loại component Field có thể chọn.

Ở **trạng thái có thể chỉnh sửa**, Field quan hệ hỗ trợ nhiều dạng component, bạn có thể chọn các component Field quan hệ khác nhau theo nhu cầu nghiệp vụ để hiển thị hoặc chọn dữ liệu liên kết.

#### Component Field quan hệ ở trạng thái có thể chỉnh sửa

![20251028220447](https://static-docs.nocobase.com/20251028220447.png)

Ở trạng thái này, bạn có thể linh hoạt chọn cách hiển thị phù hợp để xử lý dữ liệu hiệu quả hơn.

#### Component Field quan hệ ở trạng thái đọc

Khi chuyển sang **trạng thái đọc**, hệ thống sẽ tự động sử dụng **component Field tiêu đề** mặc định để hiển thị dữ liệu liên kết. Phù hợp với trường hợp chỉ cần xem dữ liệu mà không sửa đổi.

![20251028220854](https://static-docs.nocobase.com/20251028220854.gif)


![20251028221451](https://static-docs.nocobase.com/20251028221451.png)
