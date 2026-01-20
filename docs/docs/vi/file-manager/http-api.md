:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# HTTP API

Tải tệp lên cho cả trường đính kèm và các bộ sưu tập tệp đều được hỗ trợ thông qua HTTP API. Cách thức gọi sẽ khác nhau tùy thuộc vào công cụ lưu trữ được sử dụng bởi trường đính kèm hoặc bộ sưu tập tệp.

## Tải lên phía máy chủ

Đối với các công cụ lưu trữ mã nguồn mở tích hợp sẵn trong dự án như S3, OSS và COS, HTTP API được gọi tương tự như chức năng tải lên trên giao diện người dùng, và các tệp đều được tải lên thông qua máy chủ. Khi gọi API, quý vị cần truyền mã thông báo JWT dựa trên thông tin đăng nhập của người dùng thông qua tiêu đề yêu cầu `Authorization`; nếu không, quyền truy cập sẽ bị từ chối.

### Trường đính kèm

Thực hiện thao tác `create` trên tài nguyên `attachments` (bảng đính kèm), gửi yêu cầu POST và tải nội dung nhị phân lên thông qua trường `file`. Sau khi gọi, tệp sẽ được tải lên công cụ lưu trữ mặc định.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Nếu quý vị muốn tải tệp lên một công cụ lưu trữ khác, quý vị có thể sử dụng tham số `attachmentField` để chỉ định công cụ lưu trữ đã được cấu hình cho trường của bộ sưu tập (nếu chưa được cấu hình, tệp sẽ được tải lên công cụ lưu trữ mặc định).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Bộ sưu tập tệp

Khi tải lên một bộ sưu tập tệp, một bản ghi tệp sẽ tự động được tạo. Quý vị thực hiện thao tác `create` trên tài nguyên bộ sưu tập tệp, gửi yêu cầu POST và tải nội dung nhị phân lên thông qua trường `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Khi tải lên một bộ sưu tập tệp, không cần chỉ định công cụ lưu trữ; tệp sẽ được tải lên công cụ lưu trữ đã được cấu hình cho bộ sưu tập đó.

## Tải lên phía máy khách

Đối với các công cụ lưu trữ tương thích S3 được cung cấp thông qua plugin thương mại S3-Pro, việc tải lên bằng HTTP API cần được thực hiện qua nhiều bước.

### Trường đính kèm

1.  Lấy thông tin công cụ lưu trữ

    Thực hiện thao tác `getBasicInfo` trên bộ sưu tập `storages` (bảng lưu trữ), kèm theo tên công cụ lưu trữ (`storage name`), để yêu cầu thông tin cấu hình của công cụ lưu trữ.

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

2.  Lấy thông tin tiền ký (presigned) từ nhà cung cấp dịch vụ

    Thực hiện thao tác `createPresignedUrl` trên tài nguyên `fileStorageS3`, gửi yêu cầu POST và bao gồm thông tin liên quan đến tệp trong phần thân (body) để lấy thông tin tải lên tiền ký.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Lưu ý:
    >
    > * name: Tên tệp
    > * size: Kích thước tệp (tính bằng byte)
    > * type: Loại MIME của tệp. Quý vị có thể tham khảo: [Các loại MIME phổ biến](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID của công cụ lưu trữ (trường `id` được trả về ở bước đầu tiên)
    > * storageType: Loại công cụ lưu trữ (trường `type` được trả về ở bước đầu tiên)
    >
    > Ví dụ dữ liệu yêu cầu:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Cấu trúc dữ liệu của thông tin tiền ký nhận được như sau:

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

    Sử dụng `putUrl` được trả về để thực hiện yêu cầu `PUT` và tải tệp lên dưới dạng phần thân (body).

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Lưu ý:
    > * putUrl: Trường `putUrl` được trả về ở bước trước
    > * file_path: Đường dẫn cục bộ của tệp cần tải lên
    >
    > Ví dụ dữ liệu yêu cầu:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Tạo bản ghi tệp

    Sau khi tải lên thành công, quý vị thực hiện thao tác `create` trên tài nguyên `attachments` (bảng đính kèm) bằng cách gửi yêu cầu POST để tạo bản ghi tệp.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Mô tả dữ liệu phụ thuộc trong `data-raw`:
    > * title: Trường `fileInfo.title` được trả về ở bước trước
    > * filename: Trường `fileInfo.key` được trả về ở bước trước
    > * extname: Trường `fileInfo.extname` được trả về ở bước trước
    > * path: Mặc định là rỗng
    > * size: Trường `fileInfo.size` được trả về ở bước trước
    > * url: Mặc định là rỗng
    > * mimetype: Trường `fileInfo.mimetype` được trả về ở bước trước
    > * meta: Trường `fileInfo.meta` được trả về ở bước trước
    > * storageId: Trường `id` được trả về ở bước đầu tiên
    >
    > Ví dụ dữ liệu yêu cầu:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Bộ sưu tập tệp

Ba bước đầu tiên tương tự như khi tải lên trường đính kèm, nhưng ở bước thứ tư, quý vị cần tạo một bản ghi tệp bằng cách thực hiện thao tác `create` trên tài nguyên bộ sưu tập tệp, gửi yêu cầu POST và tải thông tin tệp lên thông qua phần thân (body).

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Mô tả dữ liệu phụ thuộc trong `data-raw`:
> * title: Trường `fileInfo.title` được trả về ở bước trước
> * filename: Trường `fileInfo.key` được trả về ở bước trước
> * extname: Trường `fileInfo.extname` được trả về ở bước trước
> * path: Mặc định là rỗng
> * size: Trường `fileInfo.size` được trả về ở bước trước
> * url: Mặc định là rỗng
> * mimetype: Trường `fileInfo.mimetype` được trả về ở bước trước
> * meta: Trường `fileInfo.meta` được trả về ở bước trước
> * storageId: Trường `id` được trả về ở bước đầu tiên
>
> Ví dụ dữ liệu yêu cầu:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```