---
pkg: '@nocobase/plugin-user-data-sync'
title: "Đồng bộ dữ liệu người dùng qua HTTP API"
description: "Đồng bộ dữ liệu người dùng NocoBase qua HTTP API: POST /api/userData:push, định dạng UserData/DepartmentData, API key, Bearer token."
keywords: "HTTP API,đồng bộ dữ liệu người dùng,userData:push,API key,Bearer token,NocoBase"
---

# Đồng bộ dữ liệu người dùng qua HTTP API

## Lấy API key

Tham khảo [API keys](/auth-verification/api-keys), cần đảm bảo vai trò được gán cho API key có quyền đồng bộ dữ liệu người dùng.

## Mô tả API

### Ví dụ

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # request body xem mô tả chi tiết bên dưới
```

### Endpoint

```bash
POST /api/userData:push
```

### Định dạng dữ liệu người dùng

#### UserData

| Tên tham số | Kiểu                               | Mô tả                                                                     |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `dataType` | `'user' \| 'department'`           | Bắt buộc, loại dữ liệu được đẩy, đẩy dữ liệu người dùng điền `user`                              |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Tùy chọn, sẽ dựa trên field được cung cấp và giá trị field tương ứng trong dữ liệu đẩy để truy vấn người dùng đã có trong hệ thống nhằm khớp |
| `records`  | `UserRecord[]`                     | Bắt buộc, mảng các bản ghi dữ liệu người dùng                                                   |

#### UserRecord

| Tên tham số      | Kiểu       | Mô tả                                                                                 |
| ------------- | ---------- | ------------------------------------------------------------------------------------ |
| `uid`         | `string`   | Bắt buộc, định danh duy nhất của dữ liệu người dùng nguồn, dùng để liên kết dữ liệu gốc nguồn và người dùng hệ thống. Không thay đổi đối với cùng một người dùng. |
| `nickname`    | `string`   | Tùy chọn, nickname người dùng                                                                       |
| `username`    | `string`   | Tùy chọn, username                                                                         |
| `email`       | `string`   | Tùy chọn, email người dùng                                                                       |
| `phone`       | `string`   | Tùy chọn, số điện thoại                                                                         |
| `departments` | `string[]` | Tùy chọn, mảng uid phòng ban mà người dùng thuộc về                                                          |
| `isDeleted`   | `boolean`  | Tùy chọn, bản ghi có bị xóa hay không                                                                   |
| `<field>`     | `any`      | Tùy chọn, dữ liệu các field tự tạo khác trong bảng người dùng                                                     |

### Định dạng dữ liệu phòng ban

:::info
Điều kiện đẩy dữ liệu phòng ban là phải cài đặt và kích hoạt plugin [Phòng ban](../../departments).
:::

#### DepartmentData

| Tên tham số     | Kiểu                     | Mô tả                                              |
| ---------- | ------------------------ | ------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Bắt buộc, loại dữ liệu được đẩy, đẩy dữ liệu phòng ban điền `department` |
| `records`  | `DepartmentRecord[]`     | Bắt buộc, mảng các bản ghi dữ liệu phòng ban                            |

#### DepartmentRecord

| Tên tham số      | Kiểu      | Mô tả                                                                                 |
| ----------- | --------- | ------------------------------------------------------------------------------------ |
| `uid`       | `string`  | Bắt buộc, định danh duy nhất của dữ liệu phòng ban nguồn, dùng để liên kết dữ liệu gốc nguồn và phòng ban hệ thống. Không thay đổi đối với cùng một phòng ban. |
| `title`     | `string`  | Bắt buộc, tiêu đề phòng ban                                                                       |
| `parentUid` | `string`  | Tùy chọn, uid phòng ban cấp trên                                                                   |
| `isDeleted` | `boolean` | Tùy chọn, bản ghi có bị xóa hay không                                                                   |
| `<field>`   | `any`     | Tùy chọn, dữ liệu các field tự tạo khác trong bảng phòng ban                                                     |

:::info

1. Đẩy dữ liệu nhiều lần là idempotent.
2. Nếu khi đẩy phòng ban, phòng ban cha chưa được tạo, sẽ không thể liên kết được. Bạn có thể đẩy lại dữ liệu.
3. Nếu khi đẩy người dùng, phòng ban chưa được tạo, sẽ không thể liên kết được phòng ban thuộc về. Bạn có thể đẩy lại dữ liệu người dùng sau khi đã đẩy dữ liệu phòng ban.
   :::
