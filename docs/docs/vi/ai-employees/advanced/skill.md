:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nâng cao

## Giới thiệu

Các mô hình ngôn ngữ lớn (LLM) phổ biến đều có khả năng sử dụng công cụ. Plugin AI nhân viên tích hợp sẵn một số công cụ thông dụng để các LLM sử dụng.

Các kỹ năng được thiết lập trên trang cài đặt AI nhân viên chính là những công cụ mà LLM có thể sử dụng.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Thiết lập kỹ năng

Truy cập trang cấu hình plugin AI nhân viên, nhấp vào tab `AI employees` để vào trang quản lý AI nhân viên.

Chọn AI nhân viên bạn muốn thiết lập kỹ năng, nhấp vào nút `Edit` để vào trang chỉnh sửa AI nhân viên.

Trong tab `Skills`, nhấp vào nút `Add Skill` để thêm kỹ năng cho AI nhân viên hiện tại.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Giới thiệu kỹ năng

### Frontend

Nhóm Frontend cho phép AI nhân viên tương tác với các thành phần giao diện người dùng (frontend).

- Kỹ năng `Form filler` cho phép AI nhân viên điền dữ liệu biểu mẫu đã tạo vào biểu mẫu do người dùng chỉ định.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Nhóm kỹ năng Data modeling cung cấp cho AI nhân viên khả năng gọi các API nội bộ của NocoBase để thực hiện mô hình hóa dữ liệu.

- `Intent Router` (Bộ định tuyến ý định) định tuyến các ý định, xác định xem người dùng muốn sửa đổi cấu trúc **bộ sưu tập** hay tạo một cấu trúc **bộ sưu tập** mới.
- `Get collection names` lấy tên của tất cả các **bộ sưu tập** hiện có trong hệ thống.
- `Get collection metadata` lấy thông tin cấu trúc của một **bộ sưu tập** được chỉ định.
- `Define collections` cho phép AI nhân viên tạo các **bộ sưu tập** trong hệ thống.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` cung cấp cho AI nhân viên khả năng thực thi các **luồng công việc**. Các **luồng công việc** được cấu hình với `Trigger type` là `AI employee event` trong **plugin** **luồng công việc** sẽ được cung cấp ở đây dưới dạng kỹ năng để AI nhân viên sử dụng.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Các kỹ năng trong nhóm Code Editor chủ yếu cho phép AI nhân viên tương tác với trình chỉnh sửa mã.

- `Get code snippet list` lấy danh sách các đoạn mã được cài đặt sẵn.
- `Get code snippet content` lấy nội dung của một đoạn mã được chỉ định.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Khác

- `Chart generator` cung cấp cho AI nhân viên khả năng tạo biểu đồ và xuất chúng trực tiếp trong cuộc trò chuyện.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)