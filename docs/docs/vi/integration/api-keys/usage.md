---
title: "Hướng dẫn sử dụng API Key"
description: "Thực hành API Key: ví dụ todo list, tạo vai trò và key, kiểm thử Postman, interface CRUD, gọi từ JS Block, kèm Authorization Bearer và ví dụ curl."
keywords: "Sử dụng API Key,Kiểm thử Postman,Interface CRUD,Authorization Bearer,JS Block,Ví dụ todo,NocoBase"
---

# Sử dụng API Key trong NocoBase

Hướng dẫn này thông qua ví dụ "danh sách công việc" thực tế, minh họa cách sử dụng API Key trong NocoBase để lấy dữ liệu. Vui lòng làm theo hướng dẫn từng bước dưới đây để hiểu toàn bộ workflow.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Hiểu về API Key

API Key là một loại security token, dùng để xác thực các API request từ người dùng được ủy quyền. Nó đóng vai trò là thông tin xác thực, kiểm tra danh tính của bên gửi request khi truy cập hệ thống NocoBase qua web app, mobile app hoặc backend script.

Định dạng trong HTTP request header:

```txt
Authorization: Bearer {API Key}
```

Tiền tố "Bearer" cho biết phía sau là API Key đã được xác thực dùng để kiểm tra quyền của bên gửi request.

### Các kịch bản sử dụng phổ biến

API Key thường được sử dụng trong các kịch bản sau:

1. **Truy cập từ ứng dụng client**: Trình duyệt web và mobile app sử dụng API Key để xác thực danh tính người dùng, đảm bảo chỉ người dùng được ủy quyền mới có thể truy cập dữ liệu.
2. **Thực thi tác vụ tự động**: Tiến trình background và các tác vụ định kỳ sử dụng API Key để thực thi an toàn các thao tác cập nhật, đồng bộ dữ liệu và ghi log.
3. **Phát triển và kiểm thử**: Lập trình viên sử dụng API Key trong quá trình debug và test để giả lập các request đã được xác thực và xác minh response từ API.

API Key cung cấp nhiều ưu điểm bảo mật: xác thực danh tính, giám sát sử dụng, giới hạn tốc độ request và phòng ngừa mối đe dọa, đảm bảo NocoBase hoạt động ổn định và an toàn.

## 2 Tạo API Key trong NocoBase

### 2.1 Bật plugin Xác thực: API Key

Đảm bảo plugin tích hợp sẵn [Xác thực: API Key](/plugins/@nocobase/plugin-api-keys/index.md) đã được bật. Sau khi bật, một trang cấu hình API Key mới sẽ xuất hiện trong cài đặt hệ thống.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Tạo bảng dữ liệu thử nghiệm

Để minh họa, tạo một bảng dữ liệu tên là `todos`, bao gồm các trường sau:

- `id`
- `Tiêu đề (title)`
- `Đã hoàn thành (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Thêm một số bản ghi mẫu vào bảng dữ liệu:

- Ăn cơm
- Đi ngủ
- Chơi game

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Tạo và phân vai trò

API Key được liên kết với vai trò người dùng, hệ thống xác định quyền request dựa trên vai trò được phân. Trước khi tạo API Key, phải tạo vai trò và cấu hình quyền phù hợp. Tạo một vai trò tên là "Vai trò API Todo" và cấp cho nó quyền truy cập đầy đủ vào bảng `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Nếu khi tạo API Key, "Vai trò API Todo" không khả dụng, hãy đảm bảo người dùng hiện tại đã được phân vai trò này:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Sau khi phân vai trò, làm mới trang và điều hướng đến trang quản lý API Key. Nhấp "Thêm API Key" để xác minh "Vai trò API Todo" xuất hiện trong danh sách chọn vai trò.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Để kiểm soát truy cập tốt hơn, có thể cân nhắc tạo tài khoản người dùng riêng (ví dụ "Người dùng API Todo") chuyên dùng cho việc quản lý và kiểm thử API Key. Phân "Vai trò API Todo" cho người dùng này.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Tạo và lưu API Key

Sau khi gửi form, hệ thống sẽ hiển thị thông báo xác nhận và API Key vừa được tạo. **Lưu ý quan trọng**: Hãy sao chép và lưu trữ key này an toàn ngay lập tức, vì lý do bảo mật, key này sẽ không hiển thị lại lần nữa.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Ví dụ API Key:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Lưu ý quan trọng

- Thời gian hiệu lực của API Key được quyết định bởi cài đặt hết hạn được cấu hình lúc tạo.
- Việc tạo và xác thực API Key phụ thuộc vào biến môi trường `APP_KEY`. **Đừng chỉnh sửa biến này**, nếu không sẽ làm mất hiệu lực tất cả API Key hiện có trong hệ thống.

## 3 Kiểm thử xác thực API Key

### 3.1 Sử dụng plugin tài liệu API

Mở plugin [Tài liệu API](/plugins/@nocobase/plugin-api-doc/index.md) để xem method, URL, tham số và header của từng endpoint API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Hiểu các thao tác CRUD cơ bản

NocoBase cung cấp API CRUD chuẩn (Create, Read, Update, Delete) để thao tác dữ liệu:

- **Truy vấn danh sách (interface list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Header:
  - Authorization: Bearer <API Key>

  ```
- **Thêm bản ghi (interface create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Header:
  - Authorization: Bearer <API Key>

  Body (định dạng JSON), ví dụ:
      {
          "title": "123"
      }
  ```
- **Sửa bản ghi (interface update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Header:
  - Authorization: Bearer <API Key>

  Body (định dạng JSON), ví dụ:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Xóa bản ghi (interface delete):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Header:
  - Authorization: Bearer <API Key>
  ```

Trong đó:
- `{baseURL}`: URL hệ thống NocoBase
- `{collectionName}`: Tên bảng dữ liệu

Ví dụ: instance cục bộ `localhost:13000`, tên bảng dữ liệu `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Kiểm thử bằng Postman

Tạo GET request trong Postman với cấu hình sau:
- **URL**: Endpoint request (ví dụ `http://localhost:13000/api/todos:list`)
- **Headers**: Thêm header `Authorization` với giá trị:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Response thành công:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Response lỗi (API Key không hợp lệ/hết hạn):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Khắc phục sự cố**: Nếu xác thực thất bại, vui lòng kiểm tra quyền vai trò, liên kết API Key và định dạng token.

### 3.4 Xuất mã request

Postman cho phép xuất request theo nhiều định dạng. Ví dụ lệnh cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Sử dụng API Key trong JS Block

NocoBase 2.0 hỗ trợ viết trực tiếp mã JavaScript thuần trong trang bằng JS Block. Ví dụ này minh họa cách dùng API Key để lấy dữ liệu từ API bên ngoài.

### Tạo JS Block

Thêm JS Block vào trang NocoBase, dùng đoạn code sau để lấy dữ liệu todo:

```javascript
// Sử dụng API Key để lấy dữ liệu todo
async function fetchTodos() {
  try {
    // Hiển thị thông báo loading
    ctx.message.loading('Đang lấy dữ liệu...');

    // Tải thư viện axios để thực hiện HTTP request
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Tải thư viện HTTP thất bại');
      return;
    }

    // API Key (thay bằng API Key thực tế của bạn)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Gửi API request
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Hiển thị kết quả
    console.log('Danh sách todo:', response.data);
    ctx.message.success(`Đã lấy thành công ${response.data.data.length} bản ghi`);

    // Bạn có thể xử lý dữ liệu tại đây
    // Ví dụ: hiển thị vào table, cập nhật trường form, v.v.

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    ctx.message.error('Lấy dữ liệu thất bại: ' + error.message);
  }
}

// Thực thi function
fetchTodos();
```

### Các điểm chính

- **ctx.requireAsync()**: Tải động thư viện bên ngoài (như axios) để thực hiện HTTP request
- **ctx.message**: Hiển thị thông báo cho người dùng (loading, success, error)
- **Xác thực API Key**: Truyền API Key trong header `Authorization` với tiền tố `Bearer`
- **Xử lý response**: Xử lý dữ liệu trả về theo nhu cầu (hiển thị, chuyển đổi, v.v.)

## 5 Tổng kết

Hướng dẫn này đã bao quát toàn bộ workflow sử dụng API Key trong NocoBase:

1. **Cài đặt**: Bật plugin API Key và tạo bảng dữ liệu thử nghiệm
2. **Cấu hình**: Tạo vai trò có quyền phù hợp và tạo API Key
3. **Kiểm thử**: Dùng Postman và plugin tài liệu API để xác minh xác thực API Key
4. **Tích hợp**: Sử dụng API Key trong JS Block

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)


**Tài nguyên khác:**
- [Tài liệu plugin API Key](/plugins/@nocobase/plugin-api-keys/index.md)
- [Plugin tài liệu API](/plugins/@nocobase/plugin-api-doc/index.md)
