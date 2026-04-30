# Sử dụng API Keys để lấy dữ liệu

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Các bạn thân mến, chào mừng đến với hướng dẫn này.
Trong tài liệu này, tôi sẽ hướng dẫn bạn từng bước cách sử dụng API Key trong NocoBase để lấy dữ liệu, lấy "Danh sách công việc" làm ví dụ, giúp bạn hiểu chi tiết của từng bước. Vui lòng đọc kỹ nội dung dưới đây và làm theo các bước.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Hiểu khái niệm về API Key

Trước khi bắt đầu, chúng ta cần làm rõ: API Key là gì? Nó giống như một tấm vé vào cửa, dùng để xác nhận liệu yêu cầu API có đến từ người dùng hợp lệ hay không. Khi bạn truy cập hệ thống NocoBase qua trang web, ứng dụng di động hoặc script chạy ngầm, "chìa khóa bí mật" này sẽ giúp hệ thống nhanh chóng xác minh danh tính của bạn.

Trong HTTP request header, chúng ta sẽ thấy định dạng như sau:

```txt
Authorization: Bearer {API Key}
```

"Bearer" ở đây cho biết theo sau là API Key đã được xác minh, từ đó có thể nhanh chóng xác nhận quyền của người yêu cầu.

Trong ứng dụng thực tế, API Key thường được sử dụng trong các tình huống sau:

1. **Truy cập từ ứng dụng client**: Khi người dùng gọi API qua trình duyệt hoặc ứng dụng di động, hệ thống sẽ sử dụng API Key để xác minh danh tính người dùng, đảm bảo chỉ người dùng được ủy quyền mới có thể lấy dữ liệu.
2. **Thực hiện tác vụ tự động**: Khi tác vụ định kỳ ngầm hoặc script cập nhật dữ liệu hoặc ghi log, sẽ sử dụng API Key để đảm bảo tính bảo mật và hợp pháp của yêu cầu.
3. **Phát triển và kiểm thử**: Trong quá trình debug và test, các nhà phát triển sử dụng API Key để mô phỏng yêu cầu thực tế, đảm bảo interface phản hồi chính xác.

Tóm lại, API Key không chỉ giúp chúng ta xác nhận danh tính của người yêu cầu, mà còn có thể giám sát tình hình gọi, giới hạn tần suất yêu cầu và ngăn chặn các mối đe dọa bảo mật tiềm ẩn, từ đó bảo vệ sự ổn định của NocoBase.

## 2 Tạo API Key trong NocoBase

### 2.1 Bật Plugin [API Key](https://docs-cn.nocobase.com/handbook/api-keys)

Trước tiên, hãy đảm bảo đã bật Plugin "Authentication: API Keys" tích hợp sẵn của NocoBase. Sau khi bật, trung tâm thiết lập hệ thống sẽ thêm trang cấu hình [API Key](https://docs-cn.nocobase.com/handbook/api-keys).

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Tạo bảng bản ghi công việc dùng để kiểm thử

Để dễ dàng kiểm thử, chúng ta tạo trước một bảng tên là `Bảng bản ghi công việc (todos)`, các Field bao gồm:

- `id`
- `Tiêu đề (title)`
- `Đã hoàn thành (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Sau đó nhập ngẫu nhiên vài nội dung công việc vào bảng này, ví dụ:

- Ăn cơm
- Ngủ
- Chơi game

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Tạo và liên kết Role

Vì API Key được liên kết với Role người dùng, hệ thống sẽ phán đoán quyền của yêu cầu dựa trên Role. Do đó, trước khi tạo API Key, chúng ta cần tạo trước một Role và phân quyền tương ứng.
Khuyến nghị tạo một Role kiểm thử tên "Role API Công việc", phân quyền tất cả các quyền của bảng bản ghi công việc cho Role này.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Nếu khi tạo API Key không thể chọn "Role API Hệ thống Công việc", có thể là do người dùng hiện tại chưa có Role này. Lúc này, vui lòng phân Role này cho người dùng hiện tại trước:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Sau khi phân Role, làm mới trang, vào trang quản lý API Key, nhấn "Thêm API Key", bạn sẽ thấy "Role API Hệ thống Công việc" đã xuất hiện.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Để quản lý chính xác hơn, chúng ta cũng có thể tạo một "Người dùng API Công việc" chuyên dụng để đăng nhập hệ thống, kiểm thử quyền, quản lý API Key, chỉ cần phân Role "Role API Công việc" riêng cho người dùng này.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Tạo API Key và lưu

Sau khi nhấn submit, hệ thống sẽ hiện thông báo, cho biết API Key đã được tạo thành công và hiển thị key đó trong popup. Vui lòng sao chép và lưu lại key này, vì lý do bảo mật, hệ thống sẽ không hiển thị lại sau này.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Ví dụ, bạn có thể nhận được API Key như sau:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Lưu ý

- Thời gian hiệu lực của API Key phụ thuộc vào thời gian bạn chọn khi đăng ký.
- Logic tạo và xác minh API Key liên quan chặt chẽ với `APP_KEY` trong biến môi trường, vui lòng không tùy ý sửa đổi, nếu không tất cả API Key trong hệ thống sẽ mất hiệu lực.

## 3 Kiểm thử tính hợp lệ của API Key

### 3.1 Sử dụng Plugin [API Documentation](https://docs-cn.nocobase.com/handbook/api-doc)

Mở Plugin API Documentation, bạn có thể xem phương thức yêu cầu, địa chỉ, tham số và thông tin request header của mỗi API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Hiểu các interface CRUD cơ bản

Sau đây là các ví dụ API cơ bản mà NocoBase cung cấp:

- **Truy vấn danh sách (interface list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Request header:
  - Authorization: Bearer <API Key>

  ```
- **Thêm bản ghi (interface create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Request header:
  - Authorization: Bearer <API Key>

  Request body (định dạng JSON), ví dụ:
      {
          "title": "123"
      }
  ```
- **Sửa bản ghi (interface update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Request header:
  - Authorization: Bearer <API Key>

  Request body (định dạng JSON), ví dụ:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Xóa bản ghi (interface delete):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Request header:
  - Authorization: Bearer <API Key>
  ```

Trong đó, `{baseURL}` là địa chỉ hệ thống NocoBase của bạn, `{collectionName}` là tên bảng dữ liệu. Ví dụ, khi kiểm thử cục bộ, địa chỉ là `localhost:13000`, tên bảng là `todos`, địa chỉ yêu cầu là:

```txt
http://localhost:13000/todos:list
```

### 3.3 Sử dụng Postman để kiểm thử (lấy interface List làm ví dụ)

Mở Postman, tạo một yêu cầu GET mới, nhập địa chỉ yêu cầu trên và thêm `Authorization` vào request header với giá trị là API Key của bạn:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
Sau khi gửi yêu cầu, nếu mọi thứ bình thường, bạn sẽ nhận được phản hồi tương tự như sau:

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

Nếu API Key không được ủy quyền chính xác, bạn có thể thấy thông báo lỗi như sau:

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

Khi gặp tình huống này, vui lòng kiểm tra cài đặt quyền Role, tình trạng liên kết API Key và định dạng key có chính xác không.

### 3.4 Sao chép code yêu cầu trong Postman

Sau khi kiểm thử thành công, bạn có thể sao chép code yêu cầu của interface List. Ví dụ, đoạn code curl sau đây được sao chép từ Postman:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Hiển thị danh sách công việc trong [Block iframe](https://docs-cn.nocobase.com/handbook/block-iframe)

Để mọi người cảm nhận trực quan hơn hiệu quả của yêu cầu API, chúng ta có thể hiển thị danh sách công việc lấy từ NocoBase qua một trang HTML đơn giản. Vui lòng tham khảo code ví dụ dưới đây:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

Đoạn code trên sẽ hiển thị một "Todo List" đơn giản trong Block iframe, sau khi trang tải xong, nó sẽ gọi API để lấy bản ghi công việc và hiển thị kết quả dưới dạng JSON được định dạng trên trang.

Đồng thời, qua animation dưới đây, bạn có thể thấy hiệu ứng động của toàn bộ yêu cầu:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Tóm tắt

Qua các bước trên, chúng ta đã giải thích chi tiết cách tạo và sử dụng API Key trong NocoBase. Từ việc bật Plugin, tạo bảng dữ liệu, liên kết Role, đến kiểm thử interface và hiển thị dữ liệu trong Block iframe, mỗi bước đều rất quan trọng. Cuối cùng, chúng ta đã thực hiện một trang danh sách công việc đơn giản với sự trợ giúp của DeepSeek. Mọi người có thể sửa đổi và mở rộng code phù hợp với nhu cầu của mình.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[Code của trang ví dụ này](https://forum.nocobase.com/t/api-api-key/3314) đã được cung cấp trong bài đăng cộng đồng, mời mọi người tham khảo và thảo luận. Hy vọng tài liệu này có thể cung cấp hướng dẫn rõ ràng cho bạn, học vui vẻ, thao tác thuận lợi!
