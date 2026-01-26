:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# HTTP API

Tải tệp lên cho cả trường đính kèm và các bộ sưu tập tệp đều có thể được xử lý thông qua HTTP API. Phương thức gọi API sẽ khác nhau tùy thuộc vào công cụ lưu trữ mà trường đính kèm hoặc bộ sưu tập tệp sử dụng.

## Tải lên phía máy chủ

Đối với các công cụ lưu trữ mã nguồn mở tích hợp sẵn như S3, OSS và COS, việc gọi HTTP API tương tự như khi sử dụng tính năng tải lên qua giao diện người dùng, trong đó các tệp được tải lên thông qua máy chủ. Các lệnh gọi API yêu cầu truyền mã thông báo JWT dựa trên thông tin đăng nhập của người dùng trong tiêu đề yêu cầu `Authorization`; nếu không, quyền truy cập sẽ bị từ chối.

### Trường đính kèm

Bạn thực hiện thao tác `create` trên tài nguyên `attachments` (bảng đính kèm) bằng cách gửi yêu cầu POST và tải lên nội dung nhị phân thông qua trường `file`. Sau khi gọi, tệp sẽ được tải lên công cụ lưu trữ mặc định.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Để tải tệp lên một công cụ lưu trữ khác, bạn có thể sử dụng tham số `attachmentField` để chỉ định công cụ lưu trữ đã được cấu hình cho trường của bộ sưu tập. Nếu không được cấu hình, tệp sẽ được tải lên công cụ lưu trữ mặc định.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Bộ sưu tập tệp

Khi tải lên một bộ sưu tập tệp, một bản ghi tệp sẽ tự động được tạo. Bạn thực hiện thao tác `create` trên tài nguyên bộ sưu tập tệp bằng cách gửi yêu cầu POST và tải lên nội dung nhị phân thông qua trường `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Khi tải lên một bộ sưu tập tệp, bạn không cần chỉ định công cụ lưu trữ; tệp sẽ được tải lên công cụ lưu trữ đã được cấu hình cho bộ sưu tập đó.

## Tải lên phía máy khách

Đối với các công cụ lưu trữ tương thích S3 được cung cấp thông qua plugin thương mại S3-Pro, việc tải lên bằng HTTP API yêu cầu thực hiện qua nhiều bước.

### Trường đính kèm

1.  Lấy thông tin công cụ lưu trữ

    Bạn thực hiện thao tác `getBasicInfo` trên bộ sưu tập `storages` (bảng lưu trữ), đồng thời truyền theo tên công cụ lưu trữ (`storage name`), để yêu cầu thông tin cấu hình của công cụ lưu trữ.

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

2.  Lấy thông tin URL đã ký trước từ nhà cung cấp dịch vụ

    Bạn thực hiện thao tác `createPresignedUrl` trên tài nguyên `fileStorageS3` bằng cách gửi yêu cầu POST, truyền thông tin liên quan đến tệp trong phần body, để lấy thông tin tải lên đã ký trước.

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
    > * `name`: Tên tệp
    > * `size`: Kích thước tệp (tính bằng byte)
    > * `type`: Loại MIME của tệp. Bạn có thể tham khảo: [Các loại MIME phổ biến](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * `storageId`: ID của công cụ lưu trữ (trường `id` được trả về ở bước 1)
    > * `storageType`: Loại công cụ lưu trữ (trường `type` được trả về ở bước 1)
    >
    > Ví dụ dữ liệu yêu cầu:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Cấu trúc dữ liệu của thông tin đã ký trước nhận được như sau:

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

    Sử dụng `putUrl` được trả về để thực hiện yêu cầu `PUT`, tải tệp lên dưới dạng body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Lưu ý:
    > * `putUrl`: Trường `putUrl` được trả về ở bước trước.
    > * `file_path`: Đường dẫn cục bộ của tệp cần tải lên.
    >
    > Ví dụ dữ liệu yêu cầu:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Tạo bản ghi tệp

    Sau khi tải lên thành công, bạn tạo bản ghi tệp bằng cách thực hiện thao tác `create` trên tài nguyên `attachments` (bảng đính kèm) với yêu cầu POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Giải thích dữ liệu phụ thuộc trong `data-raw`:
    > * `title`: Trường `fileInfo.title` được trả về ở bước trước.
    > * `filename`: Trường `fileInfo.key` được trả về ở bước trước.
    > * `extname`: Trường `fileInfo.extname` được trả về ở bước trước.
    > * `path`: Mặc định là trống.
    > * `size`: Trường `fileInfo.size` được trả về ở bước trước.
    > * `url`: Mặc định là trống.
    > * `mimetype`: Trường `fileInfo.mimetype` được trả về ở bước trước.
    > * `meta`: Trường `fileInfo.meta` được trả về ở bước trước.
    > * `storageId`: Trường `id` được trả về ở bước 1.
    >
    > Ví dụ dữ liệu yêu cầu:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Bộ sưu tập tệp

Ba bước đầu tiên tương tự như khi tải lên trường đính kèm. Tuy nhiên, ở bước thứ tư, bạn cần tạo bản ghi tệp bằng cách thực hiện thao tác `create` trên tài nguyên bộ sưu tập tệp với yêu cầu POST, tải thông tin tệp lên trong phần body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Giải thích dữ liệu phụ thuộc trong `data-raw`:
> * `title`: Trường `fileInfo.title` được trả về ở bước trước.
> * `filename`: Trường `fileInfo.key` được trả về ở bước trước.
> * `extname`: Trường `fileInfo.extname` được trả về ở bước trước.
> * `path`: Mặc định là trống.
> * `size`: Trường `fileInfo.size` được trả về ở bước trước.
> * `url`: Mặc định là trống.
> * `mimetype`: Trường `fileInfo.mimetype` được trả về ở bước trước.
> * `meta`: Trường `fileInfo.meta` được trả về ở bước trước.
> * `storageId`: Trường `id` được trả về ở bước 1.
>
> Ví dụ dữ liệu yêu cầu:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```