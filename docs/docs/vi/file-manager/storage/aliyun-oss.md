---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Aliyun OSS"
description: "Cấu hình storage engine Aliyun OSS tích hợp sẵn của NocoBase: Region, AccessKey, Bucket, timeout, dùng cho Aliyun Object Storage."
keywords: "Aliyun OSS,Aliyun,AccessKey,Bucket,Object Storage,Cấu hình OSS,NocoBase"
---

# Storage engine: Aliyun OSS

Storage engine dựa trên Aliyun OSS, cần chuẩn bị tài khoản và quyền liên quan trước khi sử dụng.


:::warning Lưu ý

Engine này không hỗ trợ truy cập riêng tư. Sau khi file được upload, NocoBase tạo URL có thể truy cập trực tiếp, và bất kỳ ai có URL đó đều có thể truy cập file.

Ngay cả khi bucket OSS được cấu hình riêng tư, engine Aliyun OSS tích hợp sẵn cũng không tạo URL ký tạm thời để truy cập file. Nếu cần truy cập riêng tư, hãy dùng [S3 Pro](./s3-pro.md). Nếu đã có file lịch sử, hãy xem [Di chuyển sang S3 Pro](./migrate-to-s3-pro.md).

:::

## Tham số cấu hình

![Ví dụ cấu hình storage engine Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số dành riêng cho storage engine Aliyun OSS. Đối với các tham số chung, vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung).
:::

### Base URL

Điền prefix URL truy cập file, chẳng hạn custom domain đã liên kết với bucket hiện tại: `https://oss.example.com`. Khi truy cập PDF qua domain mặc định của Aliyun OSS, trình duyệt có thể tải file xuống. Nên liên kết custom domain trước. Xem [Các vấn đề thường gặp](#các-vấn-đề-thường-gặp) bên dưới để biết chi tiết.

### Region

Điền Region của OSS, ví dụ: `oss-cn-hangzhou`.

:::info{title=Mẹo}
Có thể xem thông tin Region của Bucket tại [Aliyun OSS Console](https://oss.console.aliyun.com/), chỉ cần lấy phần tiền tố Region (không cần tên miền đầy đủ).
:::

### AccessKey ID

Điền ID của khóa truy cập được ủy quyền của Aliyun.

### AccessKey Secret

Điền Secret của khóa truy cập được ủy quyền của Aliyun.

### Bucket

Điền tên Bucket của OSS.

### Timeout

Điền thời gian timeout khi upload lên Aliyun OSS, đơn vị mili giây, mặc định là `60000` ms (tức 60 giây).

## Các vấn đề thường gặp

### PDF bị download thay vì được preview

NocoBase preview PDF khác origin trong iframe. Trình duyệt truy cập trực tiếp URL file trên OSS, vì vậy response header của OSS quyết định file được hiển thị hay download.

Nếu PDF bị download từ iframe, hãy kiểm tra request file trong panel Network của developer tools. Response có vấn đề thường có dạng:

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` xác định đúng loại file, nhưng `Content-Disposition: attachment` yêu cầu trình duyệt tải file xuống. Domain mặc định của Aliyun OSS buộc download trong một số trường hợp. Xem tài liệu chính thức: [Cấu hình PDF để preview thay vì download](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded).

Nên cấu hình như sau:

1. Làm theo [Truy cập tài nguyên OSS qua custom domain](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names) để liên kết domain với bucket
2. Cấu hình DNS và chứng chỉ HTTPS, sau đó xác nhận custom domain có thể truy cập trực tiếp file
3. Cấu hình URL truy cập cho storage engine NocoBase đang sử dụng

Đối với bước 3:

- Với engine **Aliyun OSS** tích hợp sẵn, đặt **Base URL** thành custom domain đã liên kết, chẳng hạn `https://oss.example.com`
- Với [S3 Pro](./s3-pro.md) kết nối tới Aliyun OSS, upload endpoint có thể tiếp tục dùng endpoint OSS theo Region; đặt access endpoint thành custom domain và đặt `Full access URL style` thành `Ignore`

Upload một PDF mới để kiểm tra cấu hình. Nếu record file cũ lưu URL đầy đủ, hãy xác nhận URL trả về frontend đã chuyển sang custom domain.

:::tip Kiểm tra response header

Preview PDF khác origin trong iframe không cần CORS. Việc PDF có hiển thị inline hay không chủ yếu phụ thuộc vào `Content-Type` và `Content-Disposition`. Đây là vấn đề khác với yêu cầu CORS của nút download bên dưới.

:::

### Hình ảnh preview bình thường nhưng nút download báo lỗi CORS

Hình ảnh thường được preview bằng `<img>`, còn PDF khác origin được preview bằng iframe. Cả hai đều có thể hiển thị resource mà không cần CORS response header. Tuy nhiên, nút download đọc file bằng `fetch` rồi tạo Blob. Request này chịu sự kiểm soát của same-origin policy trong trình duyệt.

Lỗi sau có nghĩa là OSS không trả về `Access-Control-Allow-Origin` cho site NocoBase hiện tại:

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Làm theo hướng dẫn chính thức [Cấu hình CORS](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing) và tạo rule cho bucket. Đối với download từ component preview, có thể dùng các giá trị sau:

| Cấu hình | Giá trị đề xuất |
| --- | --- |
| Allowed Origins | Origin đầy đủ của NocoBase, chẳng hạn `https://example.com` |
| Allowed Methods | `GET`, `HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`, `Content-Disposition` |
| MaxAgeSeconds | `600` |

Nếu S3 Pro cũng upload file trực tiếp từ trình duyệt, hãy thêm các method như `PUT` và `POST` theo request upload thực tế trong panel Network, hoặc tạo rule upload riêng.

Sau khi lưu rule, hãy request lại file với origin của site NocoBase. Response ít nhất phải chứa:

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

Trình duyệt có thể đã cache response dùng để preview hình ảnh. Request đó không có header `Origin`, và response trong cache có thể không chứa `Access-Control-Allow-Origin`. Nếu download vẫn thất bại sau khi cấu hình CORS, hãy xóa cache của file hoặc bật **Disable cache** trong developer tools rồi thử lại.

### Kiểm tra response header

Dùng `curl` để mô phỏng request khác origin từ site NocoBase. Thay origin, URL file và tham số signature trong ví dụ bằng giá trị thực tế:

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

Kiểm tra các kết quả sau:

- Preview PDF trả về `Content-Type: application/pdf` và không có `Content-Disposition: attachment`
- Download khác origin trả về `Access-Control-Allow-Origin` khớp với site NocoBase
- URL file thực tế dùng custom domain thay vì domain mặc định `*.oss-cn-*.aliyuncs.com`

Request không có header `Origin` mà không nhận được CORS response header là bình thường. Khi kiểm tra CORS, hãy giữ header `Origin` trong ví dụ.

## Liên kết liên quan

- [Preview file](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [Di chuyển sang S3 Pro](./migrate-to-s3-pro.md)
- [Storage engine](./index.md)
