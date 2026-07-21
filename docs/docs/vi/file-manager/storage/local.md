---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Local Storage"
description: "Local Storage lưu file vào ổ cứng server, phù hợp cho các trường hợp quy mô nhỏ hoặc thử nghiệm, cấu hình đường dẫn, URL truy cập, giới hạn kích thước, v.v."
keywords: "Local Storage,ổ cứng server,đường dẫn lưu trữ,lưu trữ file,NocoBase"
---

# Storage engine: Local Storage

File được upload sẽ được lưu trong thư mục ổ cứng cục bộ của server, phù hợp với các tình huống tổng lượng file upload mà hệ thống quản lý ít hoặc thử nghiệm.


:::warning Lưu ý

Local Storage không hỗ trợ truy cập riêng tư. Sau khi file được upload, NocoBase tạo URL có thể truy cập trực tiếp, và bất kỳ ai có URL đó đều có thể truy cập file.

Nếu cần lưu hợp đồng, giấy tờ định danh, tài liệu nội bộ hoặc các file không nên công khai, hãy dùng [S3 Pro](./s3-pro). Nếu đã có file lịch sử, hãy xem [Di chuyển sang S3 Pro](./migrate-to-s3-pro.md).

Nếu bạn không dùng Docker hoặc cấu hình nginx chính thức, mà truy cập file upload cục bộ thông qua proxy tùy chỉnh, hãy đảm bảo path `/storage/uploads/` thiết lập `X-Content-Type-Options: nosniff` và trả về các file active content như `html`, `svg`, `xhtml` và `pdf` dưới dạng attachment. Xem chi tiết tại [hướng dẫn bảo mật: lưu trữ file](../../security/guide.md).

:::

## Tham số cấu hình

![Ví dụ cấu hình storage engine file](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số dành riêng cho Local Storage. Đối với các tham số chung, vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung).
:::

### Đường dẫn

Vừa biểu thị đường dẫn tương đối lưu file trên server vừa biểu thị đường dẫn URL truy cập. Ví dụ: "`user/avatar`" (không cần "`/`" ở đầu và cuối), đại diện cho:

1. Đường dẫn tương đối lưu trên server khi upload file: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Tiền tố địa chỉ URL khi truy cập: `http://localhost:13000/storage/uploads/user/avatar`.
