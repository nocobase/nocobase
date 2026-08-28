---
title: "Lưu trữ cục bộ"
description: "Công cụ lưu trữ cục bộ sẽ lưu tệp vào ổ cứng của máy chủ, cho phép cấu hình đường dẫn lưu trữ và URL truy cập, phù hợp với việc triển khai độc lập."
keywords: "Lưu trữ cục bộ,Local Storage,Lưu trữ tệp,Ổ cứng máy chủ,NocoBase"
---

# Lưu trữ cục bộ

Tệp tải lên sẽ được lưu trong thư mục ổ cứng cục bộ của máy chủ, phù hợp với các trường hợp tổng số tệp tải lên do hệ thống quản lý ít hoặc mang tính thử nghiệm.

## Cấu hình tham số

![Ví dụ cấu hình công cụ lưu trữ tệp](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Gợi ý}
Chỉ giới thiệu các tham số dành riêng cho công cụ lưu trữ cục bộ; để biết các tham số chung, vui lòng tham khảo[Tham số chung của công cụ](./index.md#引擎通用参数).
:::

### Đường dẫn

Đồng thời biểu thị đường dẫn tương đối nơi tệp được lưu trữ trên máy chủ và đường dẫn truy cập URL. Ví dụ: “`user/avatar`” (không cần “`/`” ở đầu và cuối), tương ứng với:

1. Đường dẫn tương đối trên máy chủ nơi tệp được lưu khi tải lên: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Tiền tố địa chỉ URL khi truy cập: `http://localhost:13000/storage/uploads/user/avatar`.
