---
title: "File Manager HTTP API"
description: "Field attachment và file collection upload file thông qua HTTP API, upload phía server (S3/OSS/COS), upload trực tiếp phía client, hỗ trợ JWT authentication và chỉ định storage engine."
keywords: "HTTP API upload file,attachments create,Server-side upload,Client-side upload,NocoBase"
---

# HTTP API

Việc upload file của field attachment và file collection đều hỗ trợ xử lý thông qua HTTP API. Tùy theo storage engine được sử dụng bởi attachment hoặc file collection, có các cách gọi khác nhau.

## Upload phía server

Đối với các open-source storage engine được tích hợp sẵn trong dự án như S3, OSS, COS, HTTP API gọi giống với chức năng upload trên giao diện người dùng, file đều được upload qua server. Khi gọi API cần truyền JWT token dựa trên login của user thông qua header `Authorization`, nếu không sẽ bị từ chối truy cập.

### Field Attachment

Thông qua việc gọi action `create` trên resource bảng attachments (`attachments`), gửi request dạng POST, và upload nội dung binary thông qua field `file`. Sau khi gọi, file sẽ được upload vào storage engine mặc định.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Nếu cần upload file vào storage engine khác, có thể chỉ định storage engine đã được cấu hình trong field của Collection thuộc về thông qua tham số `attachmentField` (nếu chưa cấu hình, sẽ upload vào storage engine mặc định).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### File Collection

Việc upload vào file collection sẽ tự động sinh bản ghi file, thông qua việc gọi action `create` trên resource file collection, gửi request dạng POST, và upload nội dung binary thông qua field `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Việc upload vào file collection không cần chỉ định storage engine, file sẽ được upload vào storage engine được cấu hình của bảng đó.

## Upload phía client

Đối với storage engine tương thích S3 được cung cấp bởi commercial plugin S3-Pro, việc upload qua HTTP API cần được gọi qua nhiều bước.

### Field Attachment

1.  Lấy thông tin storage engine

    Gọi action `getBasicInfo` trên bảng storages (`storages`), đồng thời mang theo storage space identifier (storage name), request thông tin cấu hình storage engine

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Ví dụ thông tin cấu hình storage engine được trả về:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Lấy thông tin pre-signed của nhà cung cấp dịch vụ

    Gọi action `createPresignedUrl` trên resource `fileStorageS3`, gửi request dạng POST, và mang theo thông tin liên quan đến file trong body, lấy thông tin upload pre-signed

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
    > * name: Tên file
    > * size: Kích thước file (đơn vị bytes)
    > * type: Kiểu MIME của file, có thể tham khảo: [Các kiểu MIME thông dụng](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: id của storage engine (field `id` được trả về ở bước 1)
    > * storageType: Kiểu storage engine (field `type` được trả về ở bước 1)
    > 
    > Ví dụ dữ liệu request:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Cấu trúc dữ liệu thông tin pre-signed lấy được như sau

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

    Sử dụng `putUrl` được trả về để gửi request `PUT`, upload file dưới dạng body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Mô tả:
    > * putUrl: Field `putUrl` được trả về ở bước trước
    > * file_path: Đường dẫn local của file cần upload
    > 
    > Ví dụ dữ liệu request:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Tạo bản ghi file

    Sau khi upload thành công, thông qua việc gọi action `create` trên resource bảng attachments (`attachments`), gửi request dạng POST, tạo bản ghi file.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Mô tả các dữ liệu phụ thuộc trong data-raw:
    > * title: Field `fileInfo.title` được trả về ở bước trước
    > * filename: Field `fileInfo.key` được trả về ở bước trước
    > * extname: Field `fileInfo.extname` được trả về ở bước trước
    > * path: Mặc định trống
    > * size: Field `fileInfo.size` được trả về ở bước trước
    > * url: Mặc định trống
    > * mimetype: Field `fileInfo.mimetype` được trả về ở bước trước
    > * meta: Field `fileInfo.meta` được trả về ở bước trước
    > * storageId: Field `id` được trả về ở bước 1
    > 
    > Ví dụ dữ liệu request:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### File Collection

Ba bước đầu tương tự upload field attachment, nhưng ở bước 4 cần tạo bản ghi file, thông qua việc gọi action create trên resource file collection, gửi request dạng POST, và upload thông tin file thông qua body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Mô tả các dữ liệu phụ thuộc trong data-raw:
> * title: Field `fileInfo.title` được trả về ở bước trước
> * filename: Field `fileInfo.key` được trả về ở bước trước
> * extname: Field `fileInfo.extname` được trả về ở bước trước
> * path: Mặc định trống
> * size: Field `fileInfo.size` được trả về ở bước trước
> * url: Mặc định trống
> * mimetype: Field `fileInfo.mimetype` được trả về ở bước trước
> * meta: Field `fileInfo.meta` được trả về ở bước trước
> * storageId: Field `id` được trả về ở bước 1
> 
> Ví dụ dữ liệu request:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```
