---
title: "HTTP API trình quản lý tệp"
description: "Tải tệp lên qua HTTP API cho trường tệp đính kèm và bảng tệp, hỗ trợ tải lên phía máy chủ (S3/OSS/COS), tải lên trực tiếp từ phía máy khách, xác thực JWT và chỉ định công cụ lưu trữ."
keywords: "HTTP API tải tệp lên,attachments create,tải lên phía máy chủ,tải lên trực tiếp từ phía máy khách,NocoBase"
---

# HTTP API

Việc tải tệp lên cho cả trường tệp đính kèm và bảng tệp đều hỗ trợ xử lý thông qua HTTP API. Tùy theo công cụ lưu trữ được sử dụng bởi tệp đính kèm hoặc bảng tệp mà cách gọi sẽ khác nhau.

## Tải lên phía máy chủ

Đối với các công cụ lưu trữ mã nguồn mở được tích hợp trong dự án như S3, OSS, COS, HTTP API sử dụng cùng cách gọi với chức năng tải lên trên giao diện người dùng; tất cả tệp đều được tải lên thông qua máy chủ. Khi gọi API, cần truyền JWT dựa trên thông tin đăng nhập của người dùng qua tiêu đề yêu cầu `Authorization`, nếu không yêu cầu sẽ bị từ chối truy cập.

### Trường tệp đính kèm

Gửi yêu cầu đến tài nguyên bảng tệp đính kèm (`attachments`), thực hiện thao tác `create` bằng phương thức POST và tải nội dung nhị phân qua trường `file`. Sau khi gọi, tệp sẽ được tải lên công cụ lưu trữ mặc định.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Nếu cần tải tệp lên một công cụ lưu trữ khác, có thể chỉ định công cụ lưu trữ đã được cấu hình cho trường của bảng dữ liệu tương ứng thông qua tham số `attachmentField` (nếu chưa được cấu hình, tệp sẽ được tải lên công cụ lưu trữ mặc định).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Bảng tệp

Khi tải lên bảng tệp, bản ghi tệp sẽ được tự động tạo. Gửi yêu cầu đến tài nguyên bảng tệp, thực hiện thao tác `create` bằng phương thức POST và tải nội dung nhị phân qua trường `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Khi tải lên bảng tệp, không cần chỉ định công cụ lưu trữ; tệp sẽ được tải lên công cụ lưu trữ đã cấu hình cho bảng đó.

## Tải lên từ phía máy khách

Đối với các công cụ lưu trữ tương thích với S3 được cung cấp bởi plugin thương mại S3-Pro, việc tải lên qua HTTP API cần được thực hiện qua một số bước gọi.

### Trường tệp đính kèm

1.  Lấy thông tin công cụ lưu trữ

    Gửi yêu cầu đến bảng lưu trữ (`storages`), thực hiện thao tác `getBasicInfo` đồng thời truyền mã định danh không gian lưu trữ (storage name) để lấy thông tin cấu hình của công cụ lưu trữ.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Ví dụ về thông tin cấu hình công cụ lưu trữ được trả về:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Lấy thông tin chữ ký trước của nhà cung cấp dịch vụ

    Gửi yêu cầu đến tài nguyên `fileStorageS3`, thực hiện thao tác `createPresignedUrl` bằng phương thức POST, đồng thời truyền thông tin liên quan đến tệp trong body để lấy thông tin tải lên có chữ ký trước.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Giải thích:
    >
    > * name: Tên tệp
    > * size: Kích thước tệp (tính bằng bytes)
    > * type: Loại MIME của tệp, có thể tham khảo: [Các loại MIME phổ biến](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID của công cụ lưu trữ (trường `id` được trả về trong bước đầu tiên)
    > * storageType: Loại công cụ lưu trữ (trường `type` được trả về trong bước đầu tiên)
    >
    > Dữ liệu yêu cầu mẫu:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Cấu trúc dữ liệu của thông tin chữ ký trước nhận được như sau:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Tải tệp lên

    Sử dụng `putUrl` được trả về để thực hiện yêu cầu `PUT` và tải tệp lên trong body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Giải thích:
    > * putUrl: Trường `putUrl` được trả về ở bước trước
    > * file_path: Đường dẫn đến tệp cục bộ cần tải lên
    >
    > Dữ liệu yêu cầu mẫu:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Tạo bản ghi tệp

    Sau khi tải lên thành công, gửi yêu cầu đến tài nguyên bảng tệp đính kèm (`attachments`), thực hiện thao tác `create` bằng phương thức POST để tạo bản ghi tệp.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Mô tả dữ liệu phụ thuộc trong data-raw:
    > * title: Trường `fileInfo.title` được trả về ở bước trước
    > * filename: Trường `fileInfo.key` được trả về ở bước trước
    > * extname: Trường `fileInfo.extname` được trả về ở bước trước
    > * path: Mặc định để trống
    > * size: Trường `fileInfo.size` được trả về ở bước trước
    > * url: Mặc định để trống
    > * mimetype: Trường `fileInfo.mimetype` được trả về ở bước trước
    > * meta: Trường `fileInfo.meta` được trả về ở bước trước
    > * storageId: Trường `id` được trả về ở bước đầu tiên
    >
    > Dữ liệu yêu cầu mẫu:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Bảng tệp

Ba bước đầu tiên giống với quy trình tải lên trường tệp đính kèm, nhưng ở bước thứ tư cần tạo bản ghi tệp. Gửi yêu cầu đến tài nguyên bảng tệp, thực hiện thao tác create bằng phương thức POST và tải thông tin tệp lên qua body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Mô tả dữ liệu phụ thuộc trong data-raw:
> * title: Trường `fileInfo.title` được trả về ở bước trước
> * filename: Trường `fileInfo.key` được trả về ở bước trước
> * extname: Trường `fileInfo.extname` được trả về ở bước trước
> * path: Mặc định để trống
> * size: Trường `fileInfo.size` được trả về ở bước trước
> * url: Mặc định để trống
> * mimetype: Trường `fileInfo.mimetype` được trả về ở bước trước
> * meta: Trường `fileInfo.meta` được trả về ở bước trước
> * storageId: Trường `id` được trả về ở bước đầu tiên
>
> Dữ liệu yêu cầu mẫu:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```