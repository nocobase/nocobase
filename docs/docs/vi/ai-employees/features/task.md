:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/ai-employees/features/task).
:::

# Nhiệm vụ nhanh

Để giúp nhân viên AI bắt đầu công việc hiệu quả hơn, chúng ta có thể liên kết nhân viên AI với các khối (block) ngữ cảnh và thiết lập sẵn một số nhiệm vụ thường dùng.

Điều này cho phép người dùng bắt đầu xử lý nhiệm vụ chỉ với một cú nhấp chuột, mà không cần phải **Chọn khối** và **Nhập lệnh** mỗi lần.

## Liên kết nhân viên AI với khối

Sau khi vào chế độ chỉnh sửa giao diện (UI), đối với các khối hỗ trợ `Actions`, hãy chọn menu `AI employees` trong mục `Actions`, sau đó chọn một nhân viên AI. Nhân viên AI đó sẽ được liên kết với khối hiện tại.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Sau khi hoàn tất liên kết, mỗi khi truy cập trang, khu vực Actions của khối sẽ hiển thị nhân viên AI đã được liên kết với khối đó.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Thiết lập nhiệm vụ

Sau khi vào chế độ chỉnh sửa giao diện, di chuột qua biểu tượng nhân viên AI được liên kết với khối, một nút menu sẽ xuất hiện, chọn `Edit tasks` để vào trang thiết lập nhiệm vụ.

Tại trang thiết lập nhiệm vụ, bạn có thể thêm nhiều nhiệm vụ cho nhân viên AI hiện tại.

Mỗi tab đại diện cho một nhiệm vụ độc lập, nhấn dấu "+" bên cạnh để thêm nhiệm vụ mới.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Biểu mẫu thiết lập nhiệm vụ:

- Nhập tiêu đề nhiệm vụ vào ô `Title`, mô tả ngắn gọn nội dung nhiệm vụ. Tiêu đề này sẽ xuất hiện trong danh sách nhiệm vụ của nhân viên AI.
- Nhập nội dung chính của nhiệm vụ vào ô `Background`. Nội dung này sẽ được sử dụng làm lời nhắc hệ thống (system prompt) khi trò chuyện với nhân viên AI.
- Nhập tin nhắn mặc định của người dùng vào ô `Default user message`. Tin nhắn này sẽ tự động được điền vào ô nhập liệu của người dùng sau khi chọn nhiệm vụ.
- Trong mục `Work context`, chọn thông tin ngữ cảnh ứng dụng mặc định để gửi cho nhân viên AI. Thao tác này tương tự như thao tác trong bảng hội thoại.
- Trong khung chọn `Skills`, các kỹ năng mà nhân viên AI hiện có sẽ được hiển thị. Bạn có thể bỏ chọn một kỹ năng để nhân viên AI không sử dụng kỹ năng đó khi thực hiện nhiệm vụ này.
- Hộp kiểm `Send default user message automatically` dùng để cấu hình việc có tự động gửi tin nhắn mặc định của người dùng ngay sau khi nhấp thực hiện nhiệm vụ hay không.


## Danh sách nhiệm vụ

Sau khi thiết lập xong nhiệm vụ cho nhân viên AI, các nhiệm vụ này sẽ hiển thị trong cửa sổ giới thiệu nhân viên AI và trong tin nhắn chào hỏi trước khi bắt đầu hội thoại. Người dùng chỉ cần nhấp vào để thực hiện nhiệm vụ.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)