---
pkg: '@nocobase/plugin-file-previewer-office'
title: "Preview file Office"
description: "Plugin preview Office: dựa trên Microsoft Office Web Viewer để preview Word, Excel, PowerPoint, ODT trực tuyến, hỗ trợ định dạng docx/xlsx/pptx, không cần tải xuống."
keywords: "Preview Office,Preview Word,Preview Excel,Preview PowerPoint,docx,xlsx,pptx,Office Web Viewer,NocoBase"
---
# Preview file Office <Badge>v1.8.11+</Badge>

Plugin preview file Office dùng để preview các file định dạng Office trong ứng dụng NocoBase, như Word, Excel, PowerPoint, v.v.  
Nó dựa trên dịch vụ trực tuyến công khai do Microsoft cung cấp, có thể nhúng các file truy cập được qua URL công khai vào giao diện preview, người dùng có thể xem các file này trong trình duyệt mà không cần tải xuống hoặc sử dụng ứng dụng Office.

## Hướng dẫn sử dụng

Mặc định plugin này ở trạng thái **chưa kích hoạt**. Sau khi kích hoạt trong trình quản lý plugin là có thể sử dụng, không cần cấu hình thêm.

![Giao diện kích hoạt plugin](https://static-docs.nocobase.com/20250731140048.png)

Sau khi upload file Office (Word / Excel / PowerPoint) thành công vào file field trong bảng dữ liệu, click vào icon hoặc liên kết file tương ứng, bạn có thể xem nội dung file trong giao diện preview popup hoặc nhúng.

![Ví dụ thao tác preview](https://static-docs.nocobase.com/20250731143231.png)

## Nguyên lý hoạt động

Preview nhúng của plugin này dựa trên dịch vụ trực tuyến công khai của Microsoft (Office Web Viewer), quy trình chính:

- Frontend tạo URL có thể truy cập công khai cho file người dùng đã upload (bao gồm S3 signed URL);
- Plugin tải preview file trong iframe sử dụng địa chỉ sau:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL file công khai>
  ```

- Dịch vụ Microsoft sẽ yêu cầu nội dung file từ URL đó, render và trả về trang có thể xem.

## Lưu ý

- Vì plugin này phụ thuộc vào dịch vụ trực tuyến của Microsoft, cần đảm bảo kết nối mạng hoạt động bình thường và có thể truy cập các dịch vụ liên quan của Microsoft.
- Microsoft sẽ truy cập URL file mà bạn cung cấp, nội dung file sẽ được cache ngắn hạn trên server của họ để render trang preview, do đó có một mức rủi ro về quyền riêng tư. Nếu bạn lo ngại về điều này, khuyến nghị không sử dụng plugin này để cung cấp tính năng preview[^1].
- File cần preview phải có URL truy cập công khai. Thông thường, các file upload lên NocoBase sẽ tự động sinh ra liên kết công khai có thể truy cập (bao gồm cả URL có chữ ký do plugin S3-Pro tạo), nhưng nếu file được thiết lập quyền truy cập hoặc lưu trữ trong môi trường mạng nội bộ, sẽ không thể preview[^2].
- Dịch vụ này không hỗ trợ xác thực đăng nhập hoặc tài nguyên lưu trữ riêng tư. Ví dụ, các file chỉ truy cập được trong mạng nội bộ hoặc cần đăng nhập mới truy cập được sẽ không thể sử dụng tính năng preview này.
- Sau khi nội dung file được dịch vụ Microsoft lấy, có thể được cache trong thời gian ngắn, ngay cả khi file gốc đã bị xóa, nội dung preview vẫn có thể truy cập trong một khoảng thời gian.
- Có giới hạn đề xuất về kích thước file: file Word và PowerPoint khuyến nghị không quá 10MB, file Excel khuyến nghị không quá 5MB để đảm bảo tính ổn định của preview[^3].
- Hiện tại dịch vụ này chưa có giấy phép sử dụng thương mại chính thức rõ ràng, vui lòng tự đánh giá rủi ro khi sử dụng[^4].

## Định dạng file được hỗ trợ

Plugin chỉ hỗ trợ preview các định dạng file Office sau, dựa trên loại MIME của file hoặc phần mở rộng file:

- Tài liệu Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) hoặc `application/msword` (`.doc`)
- Bảng tính Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) hoặc `application/vnd.ms-excel` (`.xls`)
- Bài thuyết trình PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) hoặc `application/vnd.ms-powerpoint` (`.ppt`)
- Văn bản OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Các file ở định dạng khác sẽ không sử dụng tính năng preview của plugin này.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)
