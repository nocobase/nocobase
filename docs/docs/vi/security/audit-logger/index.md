---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nhật ký Kiểm toán

## Giới thiệu

Nhật ký kiểm toán dùng để ghi lại và theo dõi các hoạt động của người dùng và lịch sử thao tác tài nguyên trong hệ thống.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Mô tả Tham số

| Tham số                           | Mô tả                                                                                                                              |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Tài nguyên**                    | Loại tài nguyên mục tiêu của thao tác                                                                                              |
| **Hành động**                     | Loại thao tác được thực hiện                                                                                                       |
| **Người dùng**                    | Người dùng thực hiện thao tác                                                                                                      |
| **Vai trò**                       | Vai trò của người dùng khi thực hiện thao tác                                                                                      |
| **Nguồn dữ liệu**                 | Nguồn dữ liệu                                                                                                                      |
| **Bộ sưu tập mục tiêu**           | Bộ sưu tập mục tiêu                                                                                                                |
| **Mã định danh duy nhất của bản ghi mục tiêu** | Mã định danh duy nhất của bộ sưu tập mục tiêu                                                                              |
| **Bộ sưu tập nguồn**              | Bộ sưu tập nguồn của trường liên kết                                                                                              |
| **Mã định danh duy nhất của bản ghi nguồn** | Mã định danh duy nhất của bộ sưu tập nguồn                                                                                 |
| **Trạng thái**                    | Mã trạng thái HTTP của phản hồi yêu cầu thao tác                                                                                  |
| **Thời gian tạo**                 | Thời gian thực hiện thao tác                                                                                                       |
| **UUID**                          | Mã định danh duy nhất của thao tác, nhất quán với Request ID của yêu cầu thao tác, có thể dùng để truy xuất nhật ký ứng dụng |
| **IP**                            | Địa chỉ IP của người dùng                                                                                                          |
| **UA**                            | Thông tin UA của người dùng                                                                                                       |
| **Metadata**                      | Các metadata như tham số, nội dung yêu cầu và nội dung phản hồi của yêu cầu thao tác                                              |

## Mô tả Tài nguyên Kiểm toán

Hiện tại, các thao tác tài nguyên sau sẽ được ghi vào nhật ký kiểm toán:

### Ứng dụng Chính

| Thao tác           | Mô tả                |
| :----------------- | :------------------- |
| `` `app:resart` `` | Khởi động lại ứng dụng |
| `` `app:clearCache` `` | Xóa bộ nhớ đệm ứng dụng |

### Trình quản lý Plugin

| Thao tác         | Mô tả        |
| :--------------- | :----------- |
| `` `pm:add` ``     | Thêm plugin  |
| `` `pm:update` ``  | Cập nhật plugin |
| `` `pm:enable` ``  | Bật plugin   |
| `` `pm:disable` `` | Tắt plugin   |
| `` `pm:remove` ``  | Xóa plugin   |

### Xác thực Người dùng

| Thao tác                  | Mô tả          |
| :------------------------ | :------------- |
| `` `auth:signIn` ``         | Đăng nhập      |
| `` `auth:signUp` ``         | Đăng ký        |
| `` `auth:signOut` ``        | Đăng xuất      |
| `` `auth:changePassword` `` | Thay đổi mật khẩu |

### Người dùng

| Thao tác                  | Mô tả        |
| :------------------------ | :----------- |
| `` `users:updateProfile` `` | Cập nhật hồ sơ |

### Cấu hình UI

| Thao tác                       | Mô tả          |
| :----------------------------- | :------------- |
| `` `uiSchemas:insertAdjacent` `` | Chèn UI Schema |
| `` `uiSchemas:patch` ``          | Sửa đổi UI Schema |
| `` `uiSchemas:remove` ``         | Xóa UI Schema  |

### Thao tác trên Bộ sưu tập

| Thao tác             | Mô tả                     |
| :------------------- | :------------------------ |
| `` `create` ``         | Tạo bản ghi               |
| `` `update` ``         | Cập nhật bản ghi          |
| `` `destroy` ``        | Xóa bản ghi               |
| `` `updateOrCreate` `` | Cập nhật hoặc tạo bản ghi |
| `` `firstOrCreate` ``  | Truy vấn hoặc tạo bản ghi |
| `` `move` ``           | Di chuyển bản ghi         |
| `` `set` ``            | Đặt bản ghi trường liên kết |
| `` `add` ``            | Thêm bản ghi trường liên kết |
| `` `remove` ``         | Xóa bản ghi trường liên kết |
| `` `export` ``         | Xuất bản ghi              |
| `` `import` ``         | Nhập bản ghi              |

## Thêm các Tài nguyên Kiểm toán khác

Nếu bạn đã mở rộng các thao tác tài nguyên khác thông qua các plugin và muốn ghi lại các hành vi thao tác tài nguyên này vào nhật ký kiểm toán, vui lòng tham khảo [API](/api/server/audit-manager.md).