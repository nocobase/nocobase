:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Kho lưu trữ vector

## Giới thiệu

Trong các cơ sở tri thức, khi lưu tài liệu, chúng ta cần vector hóa tài liệu; khi truy xuất tài liệu, chúng ta cần vector hóa các từ khóa tìm kiếm. Cả hai quá trình này đều yêu cầu sử dụng một `Embedding model` để xử lý vector hóa văn bản gốc.

Trong plugin Cơ sở tri thức AI, kho lưu trữ vector là sự kết hợp giữa một `Embedding model` và một cơ sở dữ liệu vector.

## Quản lý kho lưu trữ vector

Truy cập trang cấu hình plugin Nhân viên AI, nhấp vào tab `Vector store` và chọn `Vector store` để vào trang quản lý kho lưu trữ vector.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Nhấp vào nút `Add new` ở góc trên bên phải để thêm kho lưu trữ vector mới:

- Trong ô nhập liệu `Name`, nhập tên kho lưu trữ vector;
- Trong `Vector store`, chọn cơ sở dữ liệu vector đã được cấu hình. Tham khảo: [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database);
- Trong `LLM service`, chọn dịch vụ LLM đã được cấu hình. Tham khảo: [Quản lý dịch vụ LLM](/ai-employees/quick-start/llm-service);
- Trong ô nhập liệu `Embedding model`, nhập tên mô hình `Embedding` muốn sử dụng;

Nhấp vào nút `Submit` để lưu thông tin kho lưu trữ vector.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)