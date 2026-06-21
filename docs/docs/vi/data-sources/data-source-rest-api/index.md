---
title: "Data Source REST API"
description: "Tích hợp dữ liệu từ nguồn REST API, ánh xạ các tài nguyên RESTful thành Collection, cấu hình ánh xạ API List/Get/Create/Update/Destroy, hỗ trợ thao tác CRUD."
keywords: "Data Source REST API,External API,API mapping,Collection mapping,NocoBase"
---

# Data Source REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Giới thiệu

Dùng để tích hợp dữ liệu từ nguồn REST API.

## Cài đặt

Plugin này là plugin thương mại, để biết chi tiết cách kích hoạt vui lòng tham khảo: [Hướng dẫn kích hoạt plugin thương mại](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Thêm nguồn REST API

Sau khi kích hoạt plugin, chọn REST API trong dropdown menu Add new của Data Source Manager.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Cấu hình nguồn REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Thêm Collection

Tài nguyên RESTful chính là Collection của NocoBase, ví dụ tài nguyên Users

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Khi ánh xạ vào API NocoBase sẽ được cấu hình như sau

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Quy chuẩn thiết kế API NocoBase đầy đủ tham khảo tài liệu API

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Xem chương "NocoBase API - Core"

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Cấu hình Collection của Data Source REST API như sau

### List

Cấu hình ánh xạ API xem danh sách tài nguyên

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Cấu hình ánh xạ API xem chi tiết tài nguyên

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Cấu hình ánh xạ API tạo tài nguyên

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Cấu hình ánh xạ API cập nhật tài nguyên
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Cấu hình ánh xạ API xóa tài nguyên

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Trong đó List và Get là hai API bắt buộc phải cấu hình.
## Debug API

### Mapping tham số request

Ví dụ: Cấu hình tham số phân trang cho API List (nếu third-party API không hỗ trợ phân trang, thì sẽ phân trang dựa trên dữ liệu danh sách lấy được).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Lưu ý, chỉ có các biến đã được thêm vào trong API mới có hiệu lực.

| Tên tham số tích hợp third-party API | Tham số NocoBase            |
| --------------------- | --------------------------- |
| page                  | {{request.params.page}}     |
| limit                 | {{request.params.pageSize}} |

Bạn có thể nhấn Try it out để debug, xem kết quả response.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Chuyển đổi format response

Format response của third-party API có thể không phải là chuẩn NocoBase, cần được chuyển đổi mới có thể hiển thị đúng ở frontend.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Điều chỉnh quy tắc chuyển đổi theo format response của third-party API, sao cho phù hợp với chuẩn output của NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Mô tả quy trình debug

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Chuyển đổi thông tin lỗi

Khi third-party API xảy ra lỗi, format thông tin lỗi response có thể không phải chuẩn NocoBase, cần được chuyển đổi mới có thể hiển thị đúng ở frontend.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Khi không cấu hình chuyển đổi thông tin lỗi, mặc định sẽ chuyển đổi thành thông tin lỗi chứa http status code.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Sau khi cấu hình chuyển đổi thông tin lỗi, để phù hợp với chuẩn output của NocoBase, frontend có thể hiển thị đúng thông tin lỗi của third-party API.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Biến (Variables)

Data Source REST API cung cấp ba loại biến dùng để tích hợp API

- Biến tùy chỉnh của Data Source
- NocoBase request
- Third-party response

### Biến tùy chỉnh của Data Source

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase request

- Params: URL query parameters (Search Params), Params của mỗi API có sự khác nhau;
- Headers: Request body, chủ yếu cung cấp một số thông tin X- tùy chỉnh của NocoBase;
- Body: Body của request;
- Token: API token của request NocoBase hiện tại.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Third-party response

Hiện tại chỉ cung cấp Body của response

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Các biến có thể sử dụng khi tích hợp với mỗi API như sau:

### List

| Tham số                 | Mô tả                                        |
| ----------------------- | -------------------------------------------- |
| request.params.page     | Số trang hiện tại                            |
| request.params.pageSize | Số lượng mỗi trang                           |
| request.params.filter   | Điều kiện lọc (cần phù hợp với format Filter của NocoBase) |
| request.params.sort     | Quy tắc sắp xếp (cần phù hợp với format Sort của NocoBase) |
| request.params.appends  | Field load theo nhu cầu, thường dùng cho việc load theo nhu cầu của field quan hệ |
| request.params.fields   | API chỉ output các field nào (whitelist)     |
| request.params.except   | Loại trừ các field nào (blacklist)           |

### Get

| Tham số                   | Mô tả                                        |
| ------------------------- | -------------------------------------------- |
| request.params.filterByTk | Bắt buộc, thường là ID của dữ liệu hiện tại  |
| request.params.filter     | Điều kiện lọc (cần phù hợp với format Filter của NocoBase) |
| request.params.appends    | Field load theo nhu cầu, thường dùng cho việc load theo nhu cầu của field quan hệ |
| request.params.fields     | API chỉ output các field nào (whitelist)     |
| request.params.except     | Loại trừ các field nào (blacklist)           |

### Create

| Tham số                  | Mô tả               |
| ------------------------ | ------------------- |
| request.params.whiteList | Whitelist           |
| request.params.blacklist | Blacklist           |
| request.body             | Dữ liệu khởi tạo khi tạo |

### Update

| Tham số                   | Mô tả                                        |
| ------------------------- | -------------------------------------------- |
| request.params.filterByTk | Bắt buộc, thường là ID của dữ liệu hiện tại  |
| request.params.filter     | Điều kiện lọc (cần phù hợp với format Filter của NocoBase) |
| request.params.whiteList  | Whitelist                                    |
| request.params.blacklist  | Blacklist                                    |
| request.body              | Dữ liệu cập nhật                             |

### Destroy

| Tham số                   | Mô tả                                        |
| ------------------------- | -------------------------------------------- |
| request.params.filterByTk | Bắt buộc, thường là ID của dữ liệu hiện tại  |
| request.params.filter     | Điều kiện lọc (cần phù hợp với format Filter của NocoBase) |

## Cấu hình Field

Từ dữ liệu của API CRUD của tài nguyên đã được adapt, trích xuất metadata của field (Fields) làm field của Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Trích xuất metadata của field.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Field và preview.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Chỉnh sửa field (tương tự cách của các Data Source khác).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Thêm block Data Source REST API

Sau khi cấu hình Collection xong, bạn có thể vào giao diện để thêm block.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
