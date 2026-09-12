---
title: "Nguồn dữ liệu REST API"
description: "Kết nối dữ liệu từ nguồn REST API, ánh xạ tài nguyên RESTful thành Collection, cấu hình ánh xạ các giao diện List/Get/Create/Update/Destroy và hỗ trợ các thao tác CRUD."
keywords: "Nguồn dữ liệu REST API,API bên ngoài,ánh xạ giao diện,ánh xạ Collection,NocoBase"
---

# Nguồn dữ liệu REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Giới thiệu

Dùng để kết nối dữ liệu từ nguồn REST API.

## Cài đặt

Plugin này là plugin thương mại. Vui lòng tham khảo [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide) để biết cách kích hoạt chi tiết.

## Thêm nguồn REST API

Sau khi kích hoạt plugin, chọn REST API trong menu thả xuống Add new của phần quản lý nguồn dữ liệu.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Cấu hình nguồn REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Thêm Collection

Tài nguyên RESTful chính là Collection của NocoBase, chẳng hạn như tài nguyên Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Cấu hình ánh xạ trong API NocoBase như sau:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Tham khảo tài liệu API để biết đầy đủ đặc tả thiết kế API của NocoBase.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Xem chương 「NocoBase API - Core」

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Cấu hình Collection của nguồn dữ liệu REST API như sau:

### List

Cấu hình ánh xạ giao diện để xem danh sách tài nguyên.

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Cấu hình ánh xạ giao diện để xem chi tiết tài nguyên.

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Cấu hình ánh xạ giao diện để tạo tài nguyên.

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Cấu hình ánh xạ giao diện để cập nhật tài nguyên.
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Cấu hình ánh xạ giao diện để xóa tài nguyên.

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Trong đó, List và Get là hai giao diện bắt buộc phải cấu hình.
## Gỡ lỗi API

### Kết nối tham số yêu cầu

Ví dụ: cấu hình tham số phân trang cho giao diện List (nếu API bên thứ ba không hỗ trợ phân trang thì sẽ phân trang dựa trên dữ liệu danh sách đã lấy được).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Lưu ý rằng chỉ các biến đã được thêm vào giao diện mới có hiệu lực.

| Tên tham số kết nối API bên thứ ba | Tham số NocoBase               |
| --------------------------------- | ------------------------------ |
| page                              | {{request.params.page}}        |
| limit                             | {{request.params.pageSize}}    |

Bạn có thể nhấp vào Try it out để gỡ lỗi và xem kết quả phản hồi.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Chuyển đổi định dạng phản hồi

Định dạng phản hồi của API bên thứ ba có thể không phải là định dạng tiêu chuẩn của NocoBase, cần chuyển đổi trước khi có thể hiển thị chính xác trên giao diện người dùng.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Điều chỉnh quy tắc chuyển đổi theo định dạng phản hồi của API bên thứ ba để phù hợp với tiêu chuẩn đầu ra của NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Mô tả quy trình gỡ lỗi

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Chuyển đổi thông tin lỗi

Khi API bên thứ ba xảy ra lỗi, định dạng thông tin lỗi trong phản hồi có thể không phải là định dạng tiêu chuẩn của NocoBase, cần chuyển đổi trước khi có thể hiển thị chính xác trên giao diện người dùng.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Khi chưa cấu hình chuyển đổi thông tin lỗi, hệ thống mặc định chuyển đổi thành thông tin lỗi bao gồm mã trạng thái HTTP.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Sau khi cấu hình chuyển đổi thông tin lỗi, thông tin sẽ phù hợp với tiêu chuẩn đầu ra của NocoBase và giao diện người dùng có thể hiển thị chính xác thông tin lỗi của API bên thứ ba.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Biến

Nguồn dữ liệu REST API cung cấp ba loại biến để kết nối với các giao diện.

- Biến tùy chỉnh của nguồn dữ liệu
- Yêu cầu NocoBase
- Phản hồi bên thứ ba

### Biến tùy chỉnh của nguồn dữ liệu

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Yêu cầu NocoBase

- Params: tham số truy vấn URL (Search Params), Params của mỗi giao diện có thể khác nhau;
- Headers: phần thân yêu cầu, chủ yếu cung cấp một số thông tin X- tùy chỉnh của NocoBase;
- Body: Body của yêu cầu;
- Token: API token của yêu cầu NocoBase hiện tại.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Phản hồi bên thứ ba

Hiện tại chỉ cung cấp Body của phản hồi.

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Các biến có thể sử dụng khi kết nối với từng giao diện như sau:

### List

| Tham số                 | Mô tả                                                     |
| ----------------------- | --------------------------------------------------------- |
| request.params.page     | Số trang hiện tại                                         |
| request.params.pageSize | Số lượng mỗi trang                                        |
| request.params.filter   | Điều kiện lọc (phải phù hợp với định dạng Filter của NocoBase) |
| request.params.sort     | Quy tắc sắp xếp (phải phù hợp với định dạng Sort của NocoBase) |
| request.params.appends  | Các trường tải theo nhu cầu, thường dùng để tải theo nhu cầu các trường quan hệ |
| request.params.fields   | Các trường mà giao diện chỉ xuất ra (danh sách trắng)     |
| request.params.except   | Các trường cần loại trừ (danh sách đen)                   |

### Get

| Tham số                   | Mô tả                                                     |
| ------------------------- | --------------------------------------------------------- |
| request.params.filterByTk | Bắt buộc, thường là ID của dữ liệu hiện tại               |
| request.params.filter     | Điều kiện lọc (phải phù hợp với định dạng Filter của NocoBase) |
| request.params.appends    | Các trường tải theo nhu cầu, thường dùng để tải theo nhu cầu các trường quan hệ |
| request.params.fields     | Các trường mà giao diện chỉ xuất ra (danh sách trắng)     |
| request.params.except     | Các trường cần loại trừ (danh sách đen)                   |

### Create

| Tham số                  | Mô tả                 |
| ------------------------ | --------------------- |
| request.params.whiteList | Danh sách trắng        |
| request.params.blacklist | Danh sách đen          |
| request.body             | Dữ liệu khởi tạo để tạo |

### Update

| Tham số                   | Mô tả                                                     |
| ------------------------- | --------------------------------------------------------- |
| request.params.filterByTk | Bắt buộc, thường là ID của dữ liệu hiện tại               |
| request.params.filter     | Điều kiện lọc (phải phù hợp với định dạng Filter của NocoBase) |
| request.params.whiteList  | Danh sách trắng                                            |
| request.params.blacklist  | Danh sách đen                                              |
| request.body              | Dữ liệu cần cập nhật                                       |

### Destroy

| Tham số                   | Mô tả                                                     |
| ------------------------- | --------------------------------------------------------- |
| request.params.filterByTk | Bắt buộc, thường là ID của dữ liệu hiện tại               |
| request.params.filter     | Điều kiện lọc (phải phù hợp với định dạng Filter của NocoBase) |

## Cấu hình trường

Trích xuất siêu dữ liệu trường (Fields) từ dữ liệu của các giao diện CRUD của tài nguyên đã kết nối để làm các trường của collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Trích xuất siêu dữ liệu trường.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Trường và bản xem trước.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Chỉnh sửa trường (tương tự như cách thực hiện với các nguồn dữ liệu khác).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Thêm block nguồn dữ liệu REST API

Sau khi cấu hình Collection, bạn có thể thêm block trên giao diện.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
