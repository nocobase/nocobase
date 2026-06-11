---
title: "Local Storage"
description: "Local Storage engine lưu file vào ổ cứng máy chủ, cấu hình đường dẫn lưu trữ, URL truy cập, phù hợp cho triển khai một máy."
keywords: "Local Storage,Local Storage,Lưu trữ file,Ổ cứng máy chủ,NocoBase"
---

# Local Storage

File được upload sẽ được lưu trong thư mục ổ cứng local của máy chủ, phù hợp cho các tình huống mà tổng số file upload do hệ thống quản lý ít hoặc thử nghiệm.

## Tham số cấu hình

![Ví dụ cấu hình Storage Engine](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số chuyên dụng của Local Storage engine, các tham số chung vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung-của-engine).
:::

### Đường dẫn

Đồng thời biểu thị đường dẫn tương đối lưu trữ file trên máy chủ và đường dẫn truy cập URL. Ví dụ: "`user/avatar`" (không cần "`/`" ở đầu và cuối), đại diện cho:

1. Đường dẫn tương đối lưu trữ trên máy chủ khi upload file: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Tiền tố URL khi truy cập: `http://localhost:13000/storage/uploads/user/avatar`.
