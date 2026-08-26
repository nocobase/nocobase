---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Local Storage"
description: "Local Storage lưu file vào ổ cứng server, phù hợp cho các trường hợp quy mô nhỏ hoặc thử nghiệm, cấu hình đường dẫn, URL truy cập, giới hạn kích thước, v.v."
keywords: "Local Storage,ổ cứng server,đường dẫn lưu trữ,lưu trữ file,NocoBase"
---

# Storage engine: Local Storage

File được upload sẽ được lưu trong thư mục ổ cứng cục bộ của server, phù hợp với các tình huống tổng lượng file upload mà hệ thống quản lý ít hoặc thử nghiệm.

## Tham số cấu hình

![Ví dụ cấu hình storage engine file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số dành riêng cho Local Storage. Đối với các tham số chung, vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung).
:::

### Đường dẫn

Vừa biểu thị đường dẫn tương đối lưu file trên server vừa biểu thị đường dẫn URL truy cập. Ví dụ: "`user/avatar`" (không cần "`/`" ở đầu và cuối), đại diện cho:

1. Đường dẫn tương đối lưu trên server khi upload file: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Tiền tố địa chỉ URL khi truy cập: `http://localhost:13000/storage/uploads/user/avatar`.
