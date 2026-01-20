---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Nguồn dữ liệu REST API

## Giới thiệu

`Plugin` này giúp bạn tích hợp dữ liệu từ các `nguồn dữ liệu` REST API.

## Cài đặt

Đây là một `plugin` thương mại, bạn cần tải lên và kích hoạt thông qua trình quản lý `plugin`.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Thêm nguồn REST API

Sau khi kích hoạt `plugin`, hãy chọn REST API từ menu thả xuống **Thêm mới** trong phần quản lý `nguồn dữ liệu`.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Cấu hình nguồn REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Thêm `bộ sưu tập`

Trong NocoBase, một tài nguyên RESTful được ánh xạ tới một `bộ sưu tập`, ví dụ như tài nguyên Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Các điểm cuối API này được ánh xạ trong NocoBase như sau:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Để có hướng dẫn toàn diện về các thông số kỹ thuật thiết kế API của NocoBase, hãy tham khảo tài liệu API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Kiểm tra chương "NocoBase API - Core" để biết thông tin chi tiết.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Cấu hình `bộ sưu tập` cho `nguồn dữ liệu` REST API bao gồm các mục sau:

### List

Ánh xạ giao diện để xem danh sách tài nguyên.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

Ánh xạ giao diện để xem chi tiết tài nguyên.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

Ánh xạ giao diện để tạo tài nguyên.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

Ánh xạ giao diện để cập nhật tài nguyên.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

Ánh xạ giao diện để xóa tài nguyên.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Bạn bắt buộc phải cấu hình cả hai giao diện List và Get.

## Gỡ lỗi API

### Tích hợp tham số yêu cầu

Ví dụ: Cấu hình tham số phân trang cho API List. Nếu API của bên thứ ba không hỗ trợ phân trang gốc, NocoBase sẽ phân trang dựa trên dữ liệu danh sách đã truy xuất.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Xin lưu ý rằng chỉ các biến đã được thêm vào giao diện mới có hiệu lực.

| Tên tham số API bên thứ ba | Tham số NocoBase            |
| -------------------------- | --------------------------- |
| page                       | {{request.params.page}}     |
| limit                      | {{request.params.pageSize}} |

Bạn có thể nhấp vào **Try it out** để gỡ lỗi và xem phản hồi.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Chuyển đổi định dạng phản hồi

Định dạng phản hồi của API bên thứ ba có thể không theo chuẩn NocoBase, và cần được chuyển đổi trước khi có thể hiển thị chính xác trên giao diện người dùng.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Điều chỉnh các quy tắc chuyển đổi dựa trên định dạng phản hồi của API bên thứ ba để đảm bảo đầu ra tuân thủ tiêu chuẩn NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Mô tả quy trình gỡ lỗi

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Biến

`Nguồn dữ liệu` REST API hỗ trợ ba loại biến để tích hợp API:

- Biến tùy chỉnh của `nguồn dữ liệu`
- Biến yêu cầu NocoBase
- Biến phản hồi của bên thứ ba

### Biến tùy chỉnh của `nguồn dữ liệu`

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Yêu cầu NocoBase

- `Params`: Tham số truy vấn URL (Search Params), khác nhau tùy thuộc vào giao diện.
- `Headers`: Tiêu đề yêu cầu tùy chỉnh, chủ yếu cung cấp thông tin X- cụ thể từ NocoBase.
- `Body`: Nội dung yêu cầu.
- `Token`: API token cho yêu cầu NocoBase hiện tại.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Phản hồi của bên thứ ba

Hiện tại, chỉ có nội dung phản hồi (`Body`) là khả dụng.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Dưới đây là các biến khả dụng cho từng giao diện:

### List

| Tham số                 | Mô tả                                                      |
| ----------------------- | ---------------------------------------------------------- |
| `request.params.page`     | Trang hiện tại                                             |
| `request.params.pageSize` | Số lượng mục trên mỗi trang                                |
| `request.params.filter`   | Tiêu chí lọc (phải tuân thủ định dạng Filter của NocoBase) |
| `request.params.sort`     | Tiêu chí sắp xếp (phải tuân thủ định dạng Sort của NocoBase) |
| `request.params.appends`  | Các trường cần tải theo yêu cầu, thường dùng cho các trường liên kết |
| `request.params.fields`   | Các trường cần bao gồm (danh sách trắng)                   |
| `request.params.except`   | Các trường cần loại trừ (danh sách đen)                    |

### Get

| Tham số                   | Mô tả                                                      |
| ------------------------- | ---------------------------------------------------------- |
| `request.params.filterByTk` | Bắt buộc, thường là ID của bản ghi hiện tại                |
| `request.params.filter`     | Tiêu chí lọc (phải tuân thủ định dạng Filter của NocoBase) |
| `request.params.appends`    | Các trường cần tải theo yêu cầu, thường dùng cho các trường liên kết |
| `request.params.fields`     | Các trường cần bao gồm (danh sách trắng)                   |
| `request.params.except`     | Các trường cần loại trừ (danh sách đen)                    |

### Create

| Tham số                  | Mô tả                     |
| ------------------------ | ------------------------- |
| `request.params.whiteList` | Danh sách trắng           |
| `request.params.blacklist` | Danh sách đen             |
| `request.body`             | Dữ liệu khởi tạo để tạo mới |

### Update

| Tham số                   | Mô tả                                                      |
| ------------------------- | ---------------------------------------------------------- |
| `request.params.filterByTk` | Bắt buộc, thường là ID của bản ghi hiện tại                |
| `request.params.filter`     | Tiêu chí lọc (phải tuân thủ định dạng Filter của NocoBase) |
| `request.params.whiteList`  | Danh sách trắng                                            |
| `request.params.blacklist`  | Danh sách đen                                              |
| `request.body`              | Dữ liệu để cập nhật                                        |

### Destroy

| Tham số                   | Mô tả                                                      |
| ------------------------- | ---------------------------------------------------------- |
| `request.params.filterByTk` | Bắt buộc, thường là ID của bản ghi hiện tại                |
| `request.params.filter`     | Tiêu chí lọc (phải tuân thủ định dạng Filter của NocoBase) |

## Cấu hình trường

Siêu dữ liệu trường (`Fields`) được trích xuất từ dữ liệu giao diện CRUD của tài nguyên đã thích ứng để làm các trường của `bộ sưu tập`.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Trích xuất siêu dữ liệu trường.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Các trường và bản xem trước.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Chỉnh sửa các trường (tương tự như các `nguồn dữ liệu` khác).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Thêm khối `nguồn dữ liệu` REST API

Sau khi `bộ sưu tập` được cấu hình, bạn có thể thêm các khối vào giao diện.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)