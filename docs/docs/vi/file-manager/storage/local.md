---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Local Storage"
description: "Local Storage lưu file vào ổ cứng server, phù hợp cho các trường hợp quy mô nhỏ hoặc thử nghiệm, cấu hình đường dẫn, URL truy cập, giới hạn kích thước, v.v."
keywords: "Local Storage,ổ cứng server,đường dẫn lưu trữ,lưu trữ file,NocoBase"
---

# Storage engine: Local Storage

File được upload sẽ được lưu trong thư mục ổ cứng cục bộ của server, phù hợp với các tình huống tổng lượng file upload mà hệ thống quản lý ít hoặc thử nghiệm.


:::warning Lưu ý

Hãy dùng stable URL `/files/` cho file cục bộ khi có thể để NocoBase kiểm tra bản ghi file và quyền xem của role hiện tại. URL cũ `/storage/uploads/` không áp dụng quyền ở cấp bản ghi, nhưng Docker, Nginx tích hợp và cấu hình Nginx do NocoBase CLI tạo mặc định giới hạn chúng cho người dùng đã đăng nhập.

Nếu cần lưu hợp đồng, giấy tờ định danh, tài liệu nội bộ hoặc các file không nên công khai, hãy dùng [S3 Pro](./s3-pro). Nếu đã có file lịch sử, hãy xem [Di chuyển sang S3 Pro](./migrate-to-s3-pro.md).

Nếu Nginx tùy chỉnh phục vụ file upload cục bộ qua `alias`, location `/storage/uploads/` phải dùng `auth_request` để gọi endpoint xác thực của NocoBase. Nếu không, kiểm tra đăng nhập mặc định sẽ bị bỏ qua. Đồng thời thiết lập `X-Content-Type-Options: nosniff` và trả về các file active content như `html`, `svg`, `xhtml` và `pdf` dưới dạng attachment. Xem [Proxy ngược Nginx](../../nocobase-cli/production/reverse-proxy/nginx.md) để biết ví dụ đầy đủ và cấu hình sub-app, cùng [hướng dẫn bảo mật: lưu trữ file](../../security/guide.md#lưu-trữ-file) để biết các rủi ro liên quan.

Nếu integration hiện có phụ thuộc vào truy cập ẩn danh tới URL cũ, hãy đặt `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` rồi khởi động lại ứng dụng. Công tắc tương thích này chỉ ảnh hưởng `/storage/uploads/` và không thay đổi quyền cấp bản ghi cho `/files/`.

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
