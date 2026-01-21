:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nâng cao

## Giới thiệu

Các mô hình ngôn ngữ lớn (LLM) thường có dữ liệu không được cập nhật kịp thời, thiếu thông tin mới nhất. Vì vậy, các nền tảng dịch vụ LLM trực tuyến thường cung cấp tính năng tìm kiếm trên web, cho phép AI sử dụng công cụ để tìm kiếm thông tin trước khi phản hồi, sau đó dựa trên kết quả tìm kiếm để đưa ra câu trả lời.

Tính năng tìm kiếm trên web của các nền tảng dịch vụ LLM trực tuyến đã được tích hợp cho nhân viên AI. Bạn có thể bật tính năng này trong cấu hình mô hình nhân viên AI và trong các cuộc trò chuyện.

## Bật tính năng tìm kiếm trên web

Truy cập trang cấu hình **plugin** nhân viên AI, nhấp vào tab `AI employees` để vào trang quản lý nhân viên AI.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Chọn nhân viên AI mà bạn muốn bật tính năng tìm kiếm trên web, nhấp vào nút `Edit` để vào trang chỉnh sửa nhân viên AI.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Trong tab `Model settings`, bật công tắc `Web Search`, sau đó nhấp vào nút `Submit` để lưu các thay đổi.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Sử dụng tính năng tìm kiếm trên web trong cuộc trò chuyện

Sau khi nhân viên AI đã bật tính năng tìm kiếm trên web, một biểu tượng "Web" sẽ xuất hiện trong hộp nhập liệu cuộc trò chuyện. Tính năng tìm kiếm trên web được bật theo mặc định, bạn có thể nhấp vào biểu tượng để tắt.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Khi tính năng tìm kiếm trên web được bật, phản hồi của nhân viên AI sẽ hiển thị kết quả tìm kiếm trên web.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Sự khác biệt về công cụ tìm kiếm trên web giữa các nền tảng

Hiện tại, tính năng tìm kiếm trên web của nhân viên AI phụ thuộc vào nền tảng dịch vụ LLM trực tuyến, do đó trải nghiệm sử dụng có thể khác nhau. Dưới đây là những khác biệt cụ thể:

| Nền tảng  | Tìm kiếm trên web | Công cụ | Phản hồi theo thời gian thực với các thuật ngữ tìm kiếm | Trả về liên kết ngoài làm tham chiếu trong câu trả lời |
| --------- | -------- | ----- | ------------------------------------ | -------------------------------------------------- |
| OpenAI    | ✅        | ✅     | ✅                                    | ✅                                                  |
| Gemini    | ✅        | ❌     | ❌                                    | ✅                                                  |
| Dashscope | ✅        | ✅     | ❌                                    | ❌                                                  |
| Deepseek  | ❌        | ❌     | ❌                                    | ❌                                                  |