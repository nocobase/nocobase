:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Đồng bộ dữ liệu người dùng qua HTTP API

## Lấy API Key

Tham khảo [API Key](/auth-verification/api-keys). Đảm bảo rằng vai trò được gán cho API Key có các quyền cần thiết để đồng bộ dữ liệu người dùng.

## Tổng quan về API

### Ví dụ

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Xem chi tiết phần thân yêu cầu bên dưới
```

### Endpoint

```bash
POST /api/userData:push
```

### Định dạng dữ liệu người dùng

#### UserData

| Tham số    | Kiểu                               | Mô tả                                                                     |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Bắt buộc. Kiểu dữ liệu được đẩy lên. Dùng `user` để đẩy dữ liệu người dùng. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Tùy chọn. Dùng để tìm và khớp với người dùng hiện có trong hệ thống dựa trên trường đã chỉ định. |
| `records`  | `UserRecord[]`                     | Bắt buộc. Mảng các bản ghi dữ liệu người dùng.                            |

#### UserRecord

| Tham số       | Kiểu       | Mô tả                                                                                 |
| ------------- | ---------- | ------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Bắt buộc. Mã định danh duy nhất cho dữ liệu người dùng nguồn, dùng để liên kết dữ liệu nguồn với người dùng trong hệ thống. Không thay đổi được đối với một người dùng. |
| `nickname`    | `string`   | Tùy chọn. Biệt danh của người dùng.                                                   |
| `username`    | `string`   | Tùy chọn. Tên người dùng.                                                             |
| `email`       | `string`   | Tùy chọn. Địa chỉ email của người dùng.                                               |
| `phone`       | `string`   | Tùy chọn. Số điện thoại của người dùng.                                               |
| `departments` | `string[]` | Tùy chọn. Mảng các UID của bộ phận mà người dùng thuộc về.                            |
| `isDeleted`   | `boolean`  | Tùy chọn. Cho biết bản ghi đã bị xóa hay chưa.                                        |
| `<field>`     | `any`      | Tùy chọn. Dữ liệu của các trường tùy chỉnh khác trong bảng người dùng.                |

### Định dạng dữ liệu bộ phận

:::info
Để đẩy dữ liệu bộ phận, cần cài đặt và bật [plugin Bộ phận](../../departments).
:::

#### DepartmentData

| Tham số    | Kiểu                     | Mô tả                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Bắt buộc. Kiểu dữ liệu được đẩy lên. Dùng `department` để đẩy dữ liệu bộ phận. |
| `records`  | `DepartmentRecord[]`     | Bắt buộc. Mảng các bản ghi dữ liệu bộ phận.                         |

#### DepartmentRecord

| Tham số     | Kiểu      | Mô tả                                                                                 |
| ----------- | --------- | ------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Bắt buộc. Mã định danh duy nhất cho dữ liệu bộ phận nguồn, dùng để liên kết dữ liệu nguồn với bộ phận trong hệ thống. Không thay đổi được đối với một bộ phận. |
| `title`     | `string`  | Bắt buộc. Tiêu đề của bộ phận.                                                        |
| `parentUid` | `string`  | Tùy chọn. UID của bộ phận cấp trên.                                                   |
| `isDeleted` | `boolean` | Tùy chọn. Cho biết bản ghi đã bị xóa hay chưa.                                        |
| `<field>`   | `any`     | Tùy chọn. Dữ liệu của các trường tùy chỉnh khác trong bảng bộ phận.                   |

:::info

1. Việc đẩy dữ liệu nhiều lần là một thao tác bất biến (idempotent).
2. Nếu bộ phận cấp trên chưa được tạo khi đẩy dữ liệu bộ phận, việc liên kết sẽ không thực hiện được. Bạn có thể đẩy lại dữ liệu sau khi bộ phận cấp trên đã được tạo.
3. Nếu bộ phận của người dùng chưa được tạo khi đẩy dữ liệu người dùng, người dùng sẽ không thể được liên kết với bộ phận đó. Bạn có thể đẩy lại dữ liệu người dùng sau khi dữ liệu bộ phận đã được đẩy.
:::