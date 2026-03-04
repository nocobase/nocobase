---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/file-manager/file-preview/ms-office).
:::

# Xem trước tệp Office <Badge>v1.8.11+</Badge>

Plugin Xem trước tệp Office được sử dụng để xem trước các tệp định dạng Office trong ứng dụng NocoBase, chẳng hạn như Word, Excel, PowerPoint, v.v.  
Plugin này dựa trên dịch vụ trực tuyến công cộng do Microsoft cung cấp, cho phép nhúng các tệp có thể truy cập qua URL công khai vào giao diện xem trước, giúp người dùng có thể xem các tệp này trực tiếp trên trình duyệt mà không cần tải xuống hoặc sử dụng các ứng dụng Office.

## Hướng dẫn sử dụng

Theo mặc định, plugin này ở trạng thái **chưa kích hoạt**. Sau khi kích hoạt trong trình quản lý plugin, bạn có thể sử dụng ngay mà không cần cấu hình thêm.

![Giao diện kích hoạt plugin](https://static-docs.nocobase.com/20250731140048.png)

Sau khi tải lên tệp Office (Word / Excel / PowerPoint) thành công vào trường tệp của một bộ sưu tập, hãy nhấp vào biểu tượng tệp hoặc liên kết tương ứng để xem nội dung tệp trong giao diện xem trước dạng cửa sổ bật lên hoặc nhúng.

![Ví dụ thao tác xem trước](https://static-docs.nocobase.com/20250731143231.png)

## Nguyên lý thực hiện

Việc xem trước được nhúng bởi plugin này phụ thuộc vào dịch vụ trực tuyến công cộng của Microsoft (Office Web Viewer), quy trình chính như sau:

- Frontend tạo URL có thể truy cập công khai cho tệp người dùng đã tải lên (bao gồm cả URL có chữ ký của S3);
- Plugin tải bản xem trước tệp trong một iframe bằng địa chỉ sau:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL tệp công khai>
  ```

- Dịch vụ của Microsoft sẽ gửi yêu cầu lấy nội dung tệp từ URL đó, thực hiện kết xuất (render) và trả về trang có thể xem được.

## Lưu ý

- Vì plugin này phụ thuộc vào dịch vụ trực tuyến của Microsoft, hãy đảm bảo kết nối mạng bình thường và có thể truy cập các dịch vụ liên quan của Microsoft.
- Microsoft sẽ truy cập URL tệp bạn cung cấp và nội dung tệp sẽ được lưu bộ nhớ đệm (cache) tạm thời trên máy chủ của họ để kết xuất trang xem trước. Do đó, có một rủi ro nhất định về quyền riêng tư. Nếu bạn lo ngại về điều này, chúng tôi khuyên bạn không nên sử dụng tính năng xem trước do plugin này cung cấp[^1].
- Tệp cần xem trước phải là một URL có thể truy cập công khai. Thông thường, các tệp được tải lên NocoBase sẽ tự động tạo các liên kết công khai có thể truy cập (bao gồm cả URL có chữ ký do plugin S3-Pro tạo ra), nhưng nếu tệp được thiết lập quyền truy cập hoặc được lưu trữ trong môi trường mạng nội bộ, tệp đó sẽ không thể xem trước được[^2].
- Dịch vụ này không hỗ trợ xác thực đăng nhập hoặc các tài nguyên trong bộ nhớ lưu trữ riêng tư. Ví dụ: các tệp chỉ có thể truy cập trong mạng nội bộ hoặc yêu cầu đăng nhập sẽ không thể sử dụng chức năng xem trước này.
- Sau khi nội dung tệp được dịch vụ của Microsoft thu thập, nó có thể được lưu bộ nhớ đệm trong một thời gian ngắn. Ngay cả khi tệp gốc bị xóa, nội dung xem trước vẫn có thể truy cập được trong một khoảng thời gian.
- Có các giới hạn khuyến nghị về kích thước tệp: Tệp Word và PowerPoint không nên vượt quá 10MB, và tệp Excel không nên vượt quá 5MB để đảm bảo tính ổn định khi xem trước[^3].
- Hiện tại dịch vụ này không có mô tả rõ ràng chính thức về giấy phép sử dụng thương mại. Vui lòng tự đánh giá rủi ro khi sử dụng[^4].

## Các định dạng tệp được hỗ trợ

Plugin chỉ hỗ trợ xem trước các định dạng tệp Office sau đây, dựa trên loại MIME hoặc phần mở rộng của tệp:

- Tài liệu Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) hoặc `application/msword` (`.doc`)
- Bảng tính Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) hoặc `application/vnd.ms-excel` (`.xls`)
- Bản trình chiếu PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) hoặc `application/vnd.ms-powerpoint` (`.ppt`)
- Văn bản OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Các định dạng tệp khác sẽ không kích hoạt chức năng xem trước của plugin này.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)