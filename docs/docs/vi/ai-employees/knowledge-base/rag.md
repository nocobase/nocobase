:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Truy xuất RAG

## Giới thiệu

Sau khi cấu hình cơ sở tri thức, bạn có thể bật tính năng RAG trong cài đặt nhân viên AI.

Khi RAG được bật, nhân viên AI sẽ sử dụng truy xuất RAG để lấy tài liệu từ cơ sở tri thức dựa trên tin nhắn của người dùng và phản hồi dựa trên các tài liệu đã truy xuất khi người dùng trò chuyện với họ.

## Bật RAG

Truy cập trang cấu hình plugin nhân viên AI, nhấp vào tab `AI employees` để vào trang quản lý nhân viên AI.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Chọn nhân viên AI mà bạn muốn bật RAG, nhấp vào nút `Edit` để vào trang chỉnh sửa nhân viên AI.

Trong tab `Knowledge base`, bật công tắc `Enable`.

- Trong `Knowledge Base Prompt`, nhập lời nhắc để tham chiếu cơ sở tri thức. `{knowledgeBaseData}` là một chỗ dành sẵn cố định và không được sửa đổi;
- Trong `Knowledge Base`, chọn cơ sở tri thức đã cấu hình. Tham khảo: [Cơ sở tri thức](/ai-employees/knowledge-base/knowledge-base);
- Trong ô nhập `Top K`, nhập số lượng tài liệu cần truy xuất, mặc định là 3;
- Trong ô nhập `Score`, nhập ngưỡng liên quan của tài liệu khi truy xuất;

Nhấp vào nút `Submit` để lưu cài đặt nhân viên AI.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)