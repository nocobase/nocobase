---
pkg: '@nocobase/plugin-file-manager'
title: "Preview file"
description: "File field hỗ trợ click vào thumbnail để preview, có sẵn các định dạng được trình duyệt hỗ trợ như hình ảnh, PDF, video, có thể mở rộng plugin Office để preview Word/Excel/PPT."
keywords: "Preview file,Preview,thumbnail,Office preview,PDF preview,image preview,NocoBase"
---

# Preview file

Trong các giao diện có chứa file field (bao gồm cả field attachment), bạn có thể click vào thumbnail hoặc icon của file để preview. Tính năng preview tích hợp sẵn hỗ trợ nhiều loại file, bao gồm hình ảnh, PDF và hầu hết các loại file được trình duyệt hỗ trợ tự nhiên.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Đối với các loại file không hỗ trợ preview tự nhiên, có thể cài đặt hoặc mở rộng plugin preview file tương ứng để thực hiện tính năng preview. Ví dụ, sau khi cài đặt plugin preview file Office, bạn có thể preview các file Word, Excel và PowerPoint.

Hiện tại NocoBase cung cấp các plugin preview file:

- [Plugin preview file Office](./ms-office.md)

## Cơ chế preview PDF

NocoBase chọn phương thức preview dựa trên việc URL của file PDF có cùng origin với trang hiện tại hay không:

| URL file | Storage thường gặp | Phương thức preview | Yêu cầu CORS |
| --- | --- | --- | --- |
| Cùng origin với NocoBase | Storage cục bộ | NocoBase đọc file và render bằng PDF.js tích hợp sẵn | Không liên quan đến CORS khác origin |
| Khác origin | Storage bên thứ ba như OSS, S3, COS hoặc CDN | Trình duyệt mở URL trong iframe | Bản thân preview bằng iframe không cần CORS |

:::tip Tiêu chí xác định

Phương thức preview phụ thuộc vào origin của URL file, không phụ thuộc trực tiếp vào tên storage engine. Storage cục bộ được cung cấp qua một domain file riêng sẽ được xử lý như khác origin. Storage bên thứ ba được truy cập qua proxy NocoBase cùng origin sẽ được xử lý như cùng origin.

:::

### Storage cục bộ hoặc URL cùng origin

URL của storage cục bộ thường bắt đầu bằng `/storage/uploads/` và có cùng origin với trang NocoBase. Khi preview, NocoBase đọc dữ liệu PDF rồi dùng PDF.js tích hợp sẵn để render trang và văn bản.

Phương thức này không phụ thuộc vào PDF reader tích hợp trong trình duyệt. Ngay cả khi response dùng `Content-Disposition: attachment` vì lý do bảo mật, NocoBase vẫn có thể đọc và render file trong component preview. URL file phải truy cập được bằng phiên đăng nhập hiện tại.

### Storage bên thứ ba hoặc URL khác origin

OSS, S3, COS và CDN thường sử dụng domain riêng. NocoBase đặt URL PDF trong iframe, vì vậy kết quả phụ thuộc vào trình duyệt và response header của dịch vụ storage.

Để mở PDF trong iframe, dịch vụ storage thường phải trả về `Content-Type: application/pdf` và không được buộc download bằng `Content-Disposition: attachment`. Nếu response yêu cầu download, trình duyệt sẽ tải file trực tiếp và NocoBase không thể ghi đè hành vi này ở frontend.

Việc tải PDF khác origin trong iframe không cần CORS. Tuy nhiên, nút download đọc file bằng `fetch` rồi tạo Blob. Vì vậy, download khác origin vẫn yêu cầu dịch vụ storage cho phép request CORS từ site NocoBase.

### Lưu ý với Aliyun OSS

Trong một số trường hợp, domain mặc định của Aliyun OSS buộc download bằng cách trả về `Content-Disposition: attachment` và `x-oss-force-download: true`. Hình ảnh vẫn có thể preview bình thường, còn PDF trong iframe sẽ bị download.

Thông thường có thể xử lý bằng cách liên kết custom domain với bucket và cấu hình NocoBase truy cập file qua domain đó. Xem [Các vấn đề thường gặp với Aliyun OSS](../storage/aliyun-oss.md#các-vấn-đề-thường-gặp) để biết cách cấu hình và kiểm tra.

### Ranh giới bảo mật của preview khác origin

Một số trình duyệt hoặc PDF reader có thể hỗ trợ script, form hoặc nội dung tương tác khác bên trong file PDF. Nếu file được preview đến từ nguồn không đáng tin cậy, hãy chú ý đến ranh giới bảo mật của việc thực thi script.

Chúng tôi khuyến nghị tách domain truy cập file khỏi domain của site NocoBase và domain API. Ví dụ, hãy phục vụ file từ OSS, S3, COS hoặc CDN qua một domain riêng, thay vì dùng chung origin với frontend hoặc API của NocoBase.

Nếu domain file khác với domain API, và API không bật CORS cho domain file, các script chạy trong môi trường preview PDF thường sẽ bị giới hạn bởi same-origin policy của trình duyệt. Chúng không thể đọc trực tiếp trang NocoBase, storage của trình duyệt hoặc response từ API.

## Liên kết liên quan

- [Plugin preview file Office](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
