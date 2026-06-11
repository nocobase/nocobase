---
pkg: '@nocobase/plugin-file-manager'
title: "HTTP API upload file"
description: "Field attachment và bảng file hỗ trợ upload qua HTTP API, bao gồm upload từ server (S3/OSS/COS) và upload trực tiếp từ client (S3-Pro presigned URL), kèm ví dụ curl."
keywords: "HTTP API,upload file,attachments create,presigned URL,S3-Pro,upload từ server,upload từ client,NocoBase"
---

# HTTP API

Việc upload file vào field attachment và bảng file đều hỗ trợ thông qua HTTP API. Tùy theo storage engine mà attachment hoặc bảng file sử dụng, sẽ có các cách gọi khác nhau.

## Upload từ server

Đối với các storage engine open source tích hợp sẵn trong dự án như S3, OSS, COS, HTTP API gọi giống với chức năng upload trên giao diện người dùng, file đều được upload qua server. Khi gọi interface cần truyền JWT token dựa trên đăng nhập của người dùng qua header `Authorization`, nếu không sẽ bị từ chối truy cập.

### Field attachment

Thực hiện thao tác `create` đối với resource bảng attachment (`attachments`), gửi request dạng POST, và upload nội dung binary qua field `file`. Sau khi gọi, file sẽ được upload vào storage engine mặc định.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Nếu cần upload file vào storage engine khác, có thể chỉ định thông qua tham số `attachmentField` trỏ đến storage engine đã cấu hình của field thuộc bảng dữ liệu (nếu chưa cấu hình, sẽ upload vào storage engine mặc định).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Bảng file

Upload vào bảng file sẽ tự động sinh bản ghi file. Thực hiện thao tác `create` đối với resource bảng file, gửi request dạng POST, upload nội dung binary qua field `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Khi upload vào bảng file không cần chỉ định storage engine, file sẽ được upload vào storage engine đã cấu hình cho bảng đó.

## Upload từ client

Đối với storage engine tương thích S3 cung cấp bởi plugin thương mại S3-Pro, HTTP API upload cần chia thành nhiều bước để gọi.

### Field attachment

1.  Lấy thông tin storage engine

    Thực hiện thao tác `getBasicInfo` đối với bảng storage (`storages`), kèm theo định danh storage (storage name), yêu cầu thông tin cấu hình storage engine

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Ví dụ thông tin cấu hình storage engine trả về:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Lấy thông tin presigned của nhà cung cấp

    Thực hiện thao tác `createPresignedUrl` đối với resource `fileStorageS3`, gửi request dạng POST, kèm thông tin liên quan đến file trong body, lấy thông tin presigned upload

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Mô tả:
    > 
    > * name: tên file
    > * size: kích thước file (đơn vị bytes)
    > * type: loại MIME của file, có thể tham khảo: [Các loại MIME thông dụng](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: id của storage engine (field `id` trả về ở bước 1)
    > * storageType: loại storage engine (field `type` trả về ở bước 1)
    > 
    > Ví dụ dữ liệu request:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Cấu trúc dữ liệu thông tin presigned trả về như sau

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

3.  Upload file

    Sử dụng `putUrl` trả về để gửi request `PUT`, upload file dưới dạng body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Mô tả:
    > * putUrl: field `putUrl` trả về ở bước trước
    > * file_path: đường dẫn file local cần upload
    > 
    > Ví dụ dữ liệu request:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Tạo bản ghi file

    Sau khi upload thành công, thực hiện thao tác `create` đối với resource bảng attachment (`attachments`), gửi request dạng POST, tạo bản ghi file.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Mô tả các dữ liệu phụ thuộc trong data-raw:
    > * title: field `fileInfo.title` trả về ở bước trước
    > * filename: field `fileInfo.key` trả về ở bước trước
    > * extname: field `fileInfo.extname` trả về ở bước trước
    > * path: mặc định để trống
    > * size: field `fileInfo.size` trả về ở bước trước
    > * url: mặc định để trống
    > * mimetype: field `fileInfo.mimetype` trả về ở bước trước
    > * meta: field `fileInfo.meta` trả về ở bước trước
    > * storageId: field `id` trả về ở bước 1
    > 
    > Ví dụ dữ liệu request:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Bảng file

Ba bước đầu giống với upload field attachment, nhưng ở bước 4 cần tạo bản ghi file, thực hiện thao tác create đối với resource bảng file, gửi request dạng POST, và upload thông tin file qua body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Mô tả các dữ liệu phụ thuộc trong data-raw:
> * title: field `fileInfo.title` trả về ở bước trước
> * filename: field `fileInfo.key` trả về ở bước trước
> * extname: field `fileInfo.extname` trả về ở bước trước
> * path: mặc định để trống
> * size: field `fileInfo.size` trả về ở bước trước
> * url: mặc định để trống
> * mimetype: field `fileInfo.mimetype` trả về ở bước trước
> * meta: field `fileInfo.meta` trả về ở bước trước
> * storageId: field `id` trả về ở bước 1
> 
> Ví dụ dữ liệu request:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```
