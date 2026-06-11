---
pkg: '@nocobase/plugin-audit-logger'
title: "Audit log"
description: "Audit log: ghi lại lịch sử hoạt động của người dùng và thao tác tài nguyên, các tham số Resource, Action, User, Target, IP, UA, Metadata, theo dõi thao tác và audit tuân thủ."
keywords: "Audit log,audit thao tác,Resource Action,theo dõi thao tác,audit tuân thủ,bản ghi hoạt động người dùng,NocoBase"
---

# Audit log

## Giới thiệu

Audit log dùng để ghi lại và theo dõi lịch sử hoạt động của người dùng và thao tác tài nguyên trong hệ thống.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Mô tả tham số

| Tham số                  | Mô tả                                                             |
| --------------------- | ---------------------------------------------------------------- |
| **Resource**          | Loại tài nguyên đích của thao tác                                               |
| **Action**            | Loại thao tác được thực hiện                                                     |
| **User**              | Người dùng thực hiện thao tác                                                         |
| **Role**              | Vai trò khi người dùng thao tác                                                   |
| **Data source**       | Data source                                                           |
| **Target collection** | Bảng dữ liệu đích                                                       |
| **Target record UK**  | Định danh duy nhất của bảng dữ liệu đích                                               |
| **Source collection** | Bảng dữ liệu nguồn của field quan hệ                                                 |
| **Source record UK**  | Định danh duy nhất của bảng dữ liệu nguồn của field quan hệ                                         |
| **Status**            | HTTP status code của response cho yêu cầu thao tác                                       |
| **Created at**        | Thời gian thao tác                                                         |
| **UUID**              | Định danh duy nhất của thao tác, giống với Request ID của yêu cầu thao tác, có thể dùng để truy xuất log ứng dụng |
| **IP**                | Địa chỉ IP của người dùng                                                   |
| **UA**                | Thông tin UA của người dùng                                                   |
| **Metadata**          | Metadata bao gồm tham số yêu cầu thao tác, request body và nội dung response                         |

## Mô tả tài nguyên audit

Hiện tại các thao tác tài nguyên sau sẽ được ghi vào audit log:

### Ứng dụng chính

| Thao tác             | Mô tả         |
| ---------------- | ------------ |
| `app:resart`     | Khởi động lại ứng dụng     |
| `app:clearCache` | Xóa cache ứng dụng |

### Trình quản lý plugin

| Thao tác         | Mô tả     |
| ------------ | -------- |
| `pm:add`     | Thêm plugin |
| `pm:update`  | Cập nhật plugin |
| `pm:enable`  | Kích hoạt plugin |
| `pm:disable` | Vô hiệu hóa plugin |
| `pm:remove`  | Xóa plugin |

### Xác thực người dùng

| Thao tác                  | Mô tả     |
| --------------------- | -------- |
| `auth:signIn`         | Đăng nhập     |
| `auth:signUp`         | Đăng ký     |
| `auth:signOut`        | Đăng xuất     |
| `auth:changePassword` | Đổi mật khẩu |

### Người dùng

| Thao tác                  | Mô tả         |
| --------------------- | ------------ |
| `users:updateProfile` | Sửa hồ sơ cá nhân |

### Cấu hình UI

| Thao tác                       | Mô tả           |
| -------------------------- | -------------- |
| `uiSchemas:insertAdjacent` | Chèn UI Schema |
| `uiSchemas:patch`          | Sửa UI Schema |
| `uiSchemas:remove`         | Xóa UI Schema |

### Thao tác bảng dữ liệu

| Thao tác             | Mô tả             |
| ---------------- | ---------------- |
| `create`         | Tạo bản ghi         |
| `update`         | Cập nhật bản ghi         |
| `destroy`        | Xóa bản ghi         |
| `updateOrCreate` | Cập nhật hoặc tạo bản ghi   |
| `firstOrCreate`  | Truy vấn hoặc tạo bản ghi   |
| `move`           | Di chuyển bản ghi         |
| `set`            | Đặt bản ghi field quan hệ |
| `add`            | Thêm bản ghi field quan hệ |
| `remove`         | Xóa bản ghi field quan hệ |
| `export`         | Xuất bản ghi         |
| `import`         | Nhập bản ghi         |

## Thêm tài nguyên audit khác

Nếu bạn đã mở rộng các thao tác tài nguyên khác qua plugin và muốn ghi lại các hành vi thao tác tài nguyên này vào audit log, có thể tham khảo [API](/api/server/audit-manager.md).
