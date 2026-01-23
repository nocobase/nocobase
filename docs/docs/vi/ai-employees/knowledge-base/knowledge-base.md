:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cơ sở tri thức

## Giới thiệu

Cơ sở tri thức là nền tảng của việc truy xuất RAG. Nó tổ chức các tài liệu theo danh mục và xây dựng chỉ mục. Khi một nhân viên AI trả lời câu hỏi, nó sẽ ưu tiên tìm kiếm câu trả lời từ cơ sở tri thức.

## Quản lý Cơ sở tri thức

Truy cập trang cấu hình **plugin** nhân viên AI, nhấp vào tab `Knowledge base` để vào trang quản lý cơ sở tri thức.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Nhấp vào nút `Add new` ở góc trên bên phải để thêm cơ sở tri thức `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Nhập thông tin cần thiết cho cơ sở tri thức mới:

- Trong ô nhập `Name`, nhập tên cơ sở tri thức;
- Trong `File storage`, chọn vị trí lưu trữ tệp;
- Trong `Vector store`, chọn kho lưu trữ vector, tham khảo [Kho lưu trữ vector](/ai-employees/knowledge-base/vector-store);
- Trong ô nhập `Description`, nhập mô tả cơ sở tri thức;

Nhấp vào nút `Submit` để tạo cơ sở tri thức.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Quản lý Tài liệu Cơ sở tri thức

Sau khi tạo cơ sở tri thức, trên trang danh sách cơ sở tri thức, nhấp vào cơ sở tri thức vừa tạo để vào trang quản lý tài liệu cơ sở tri thức.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Nhấp vào nút `Upload` để tải tài liệu lên. Sau khi tài liệu được tải lên, quá trình vector hóa sẽ tự động bắt đầu. Vui lòng đợi `Status` (Trạng thái) chuyển từ `Pending` (Đang chờ) sang `Success` (Thành công).

Hiện tại, cơ sở tri thức hỗ trợ các loại tài liệu sau: txt, pdf, doc, docx, ppt, pptx; riêng pdf chỉ hỗ trợ văn bản thuần túy.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Các loại Cơ sở tri thức

### Cơ sở tri thức Local

Cơ sở tri thức Local là loại cơ sở tri thức được lưu trữ cục bộ trong NocoBase. Các tài liệu và dữ liệu vector của chúng đều được NocoBase lưu trữ cục bộ.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Cơ sở tri thức Readonly

Cơ sở tri thức Readonly là cơ sở tri thức chỉ đọc. Các tài liệu và dữ liệu vector được duy trì bên ngoài. NocoBase chỉ tạo kết nối đến cơ sở dữ liệu vector (hiện tại chỉ hỗ trợ PGVector).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Cơ sở tri thức External

Cơ sở tri thức External là cơ sở tri thức bên ngoài, nơi các tài liệu và dữ liệu vector được duy trì bên ngoài. Việc truy xuất cơ sở dữ liệu vector cần được các nhà phát triển mở rộng, cho phép sử dụng các cơ sở dữ liệu vector hiện không được NocoBase hỗ trợ.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)