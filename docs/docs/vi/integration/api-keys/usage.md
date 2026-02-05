:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sử dụng API Key trong NocoBase

Hướng dẫn này sẽ trình bày cách sử dụng API Key trong NocoBase để truy xuất dữ liệu thông qua một ví dụ thực tế về "Việc cần làm". Hãy làm theo các bước hướng dẫn dưới đây để hiểu rõ toàn bộ quy trình làm việc.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Tìm hiểu về API Key

API Key là một mã thông báo bảo mật dùng để xác thực các yêu cầu API từ người dùng được ủy quyền. Nó đóng vai trò là thông tin xác thực, giúp xác minh danh tính của người gửi yêu cầu khi truy cập hệ thống NocoBase thông qua các ứng dụng web, ứng dụng di động hoặc script backend.

Định dạng trong tiêu đề yêu cầu HTTP:

```txt
Authorization: Bearer {API Key}
```

Tiền tố "Bearer" cho biết chuỗi theo sau là một API Key đã được xác thực, dùng để xác minh quyền của người gửi yêu cầu.

### Các trường hợp sử dụng phổ biến

API Key thường được sử dụng trong các trường hợp sau:

1.  **Truy cập ứng dụng khách** (Client Application Access): Trình duyệt web và ứng dụng di động sử dụng API Key để xác thực danh tính người dùng, đảm bảo chỉ những người dùng được ủy quyền mới có thể truy cập dữ liệu.
2.  **Thực thi tác vụ tự động** (Automated Task Execution): Các tiến trình nền và tác vụ theo lịch trình sử dụng API Key để thực hiện an toàn các thao tác cập nhật, đồng bộ hóa dữ liệu và ghi nhật ký.
3.  **Phát triển và kiểm thử** (Development and Testing): Các nhà phát triển sử dụng API Key trong quá trình gỡ lỗi và kiểm thử để mô phỏng các yêu cầu đã được xác thực và xác minh phản hồi API.

API Key mang lại nhiều lợi ích bảo mật: xác minh danh tính, giám sát việc sử dụng, giới hạn tốc độ yêu cầu và phòng ngừa mối đe dọa, đảm bảo NocoBase hoạt động ổn định và an toàn.

## 2 Tạo API Key trong NocoBase

### 2.1 Kích hoạt plugin Xác thực: API Key

Đảm bảo rằng plugin tích hợp [Xác thực: API Key](/plugins/@nocobase/plugin-api-keys/) đã được kích hoạt. Sau khi kích hoạt, một trang cấu hình API Key mới sẽ xuất hiện trong cài đặt hệ thống.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Tạo một bộ sưu tập thử nghiệm

Để minh họa, hãy tạo một bộ sưu tập có tên `todos` với các trường sau:

-   `id`
-   `title`
-   `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Thêm một vài bản ghi mẫu vào bộ sưu tập:

-   eat food
-   sleep
-   play games

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Tạo và gán vai trò

API Key được liên kết với các vai trò người dùng, và hệ thống sẽ xác định quyền yêu cầu dựa trên vai trò được gán. Trước khi tạo API Key, bạn phải tạo vai trò và cấu hình các quyền phù hợp. Hãy tạo một vai trò có tên "Vai trò API Việc cần làm" và cấp cho nó quyền truy cập đầy đủ vào bộ sưu tập `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Nếu "Vai trò API Việc cần làm" không khả dụng khi tạo API Key, hãy đảm bảo rằng người dùng hiện tại đã được gán vai trò này:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Sau khi gán vai trò, hãy làm mới trang và điều hướng đến trang quản lý API Key. Nhấp vào "Thêm API Key" để xác minh rằng "Vai trò API Việc cần làm" xuất hiện trong phần chọn vai trò.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Để kiểm soát quyền truy cập tốt hơn, bạn có thể cân nhắc tạo một tài khoản người dùng chuyên dụng (ví dụ: "Người dùng API Việc cần làm") dành riêng cho việc quản lý và kiểm thử API Key. Gán "Vai trò API Việc cần làm" cho người dùng này.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Tạo và lưu API Key

Sau khi gửi biểu mẫu, hệ thống sẽ hiển thị thông báo xác nhận cùng với API Key mới được tạo. **Lưu ý quan trọng**: Hãy sao chép và lưu trữ khóa này một cách an toàn ngay lập tức, vì lý do bảo mật, khóa này sẽ không được hiển thị lại.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Ví dụ API Key:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Lưu ý quan trọng

-   Thời hạn hiệu lực của API Key được xác định bởi cài đặt hết hạn được cấu hình khi tạo.
-   Việc tạo và xác minh API Key phụ thuộc vào biến môi trường `APP_KEY`. **Tuyệt đối không sửa đổi biến này**, nếu không, tất cả các API Key hiện có trong hệ thống sẽ bị vô hiệu hóa.

## 3 Kiểm thử xác thực API Key

### 3.1 Sử dụng plugin Tài liệu API

Mở plugin [Tài liệu API](/plugins/@nocobase/plugin-api-doc/) để xem các phương thức yêu cầu, URL, tham số và tiêu đề yêu cầu cho từng điểm cuối API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Tìm hiểu các thao tác CRUD cơ bản

NocoBase cung cấp các API CRUD (Tạo, Đọc, Cập nhật, Xóa) tiêu chuẩn để thao tác dữ liệu:

-   **Truy vấn danh sách (API list):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Tiêu đề yêu cầu:
    - Authorization: Bearer <API Key>

    ```
-   **Tạo bản ghi mới (API create):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Tiêu đề yêu cầu:
    - Authorization: Bearer <API Key>

    Nội dung yêu cầu (định dạng JSON), ví dụ:
        {
            "title": "123"
        }
    ```
-   **Cập nhật bản ghi (API update):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Tiêu đề yêu cầu:
    - Authorization: Bearer <API Key>

    Nội dung yêu cầu (định dạng JSON), ví dụ:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Xóa bản ghi (API delete):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Tiêu đề yêu cầu:
    - Authorization: Bearer <API Key>
    ```

Trong đó:
-   `{baseURL}`: URL hệ thống NocoBase của bạn
-   `{collectionName}`: Tên bộ sưu tập

Ví dụ: Đối với một phiên bản cục bộ tại `localhost:13000` với bộ sưu tập tên `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Kiểm thử bằng Postman

Tạo một yêu cầu GET trong Postman với cấu hình như sau:
-   **URL**: Điểm cuối yêu cầu (ví dụ: `http://localhost:13000/api/todos:list`)
-   **Tiêu đề (Headers)**: Thêm tiêu đề `Authorization` với giá trị:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Phản hồi thành công:**

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

**Phản hồi lỗi (API Key không hợp lệ/hết hạn):**

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

**Khắc phục sự cố**: Nếu xác thực thất bại, hãy xác minh quyền của vai trò, liên kết API Key và định dạng mã thông báo.

### 3.4 Xuất mã yêu cầu

Postman cho phép bạn xuất yêu cầu dưới nhiều định dạng khác nhau. Ví dụ lệnh cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Sử dụng API Key trong khối JS

NocoBase 2.0 hỗ trợ viết mã JavaScript gốc trực tiếp trong các trang bằng cách sử dụng các khối JS. Ví dụ này minh họa cách truy xuất dữ liệu API bên ngoài bằng API Key.

### Tạo một khối JS

Trong trang NocoBase của bạn, hãy thêm một khối JS và sử dụng đoạn mã sau để truy xuất dữ liệu việc cần làm:

```javascript
// Truy xuất dữ liệu việc cần làm bằng API Key
async function fetchTodos() {
  try {
    // Hiển thị thông báo đang tải
    ctx.message.loading('Đang truy xuất dữ liệu...');

    // Tải thư viện axios cho các yêu cầu HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Không thể tải thư viện HTTP');
      return;
    }

    // API Key (thay thế bằng API Key thực tế của bạn)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Gửi yêu cầu API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Hiển thị kết quả
    console.log('Danh sách việc cần làm:', response.data);
    ctx.message.success(`Đã truy xuất thành công ${response.data.data.length} mục`);

    // Bạn có thể xử lý dữ liệu tại đây
    // Ví dụ: hiển thị trong bảng, cập nhật các trường biểu mẫu, v.v.

  } catch (error) {
    console.error('Lỗi khi truy xuất dữ liệu:', error);
    ctx.message.error('Không thể truy xuất dữ liệu: ' + error.message);
  }
}

// Thực thi hàm
fetchTodos();
```

### Các điểm chính

-   **ctx.requireAsync()**: Tải động các thư viện bên ngoài (như axios) cho các yêu cầu HTTP
-   **ctx.message**: Hiển thị thông báo cho người dùng (đang tải, thành công, thông báo lỗi)
-   **API Key Authentication**: Truyền API Key trong tiêu đề yêu cầu `Authorization` với tiền tố `Bearer`
-   **Xử lý phản hồi**: Xử lý dữ liệu trả về theo yêu cầu (hiển thị, chuyển đổi, v.v.)

## 5 Tóm tắt

Hướng dẫn này đã trình bày toàn bộ quy trình làm việc để sử dụng API Key trong NocoBase:

1.  **Thiết lập**: Kích hoạt plugin API Key và tạo một bộ sưu tập thử nghiệm
2.  **Cấu hình**: Tạo các vai trò với quyền phù hợp và tạo API Key
3.  **Kiểm thử**: Xác thực API Key bằng Postman và plugin Tài liệu API
4.  **Tích hợp**: Sử dụng API Key trong các khối JS

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Tài nguyên bổ sung:**
-   [Tài liệu plugin API Key](/plugins/@nocobase/plugin-api-keys/)
-   [Plugin Tài liệu API](/plugins/@nocobase/plugin-api-doc/)