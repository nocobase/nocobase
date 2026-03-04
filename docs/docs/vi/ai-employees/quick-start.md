:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/ai-employees/quick-start).
:::

# Bắt đầu nhanh

Hãy cùng hoàn tất cấu hình tối thiểu cho nhân viên AI trong 5 phút.

## Cài đặt plugin

Nhân viên AI là một plugin tích hợp sẵn của NocoBase (`@nocobase/plugin-ai`), không cần cài đặt riêng biệt.

## Cấu hình mô hình

Bạn có thể cấu hình dịch vụ LLM thông qua một trong hai lối vào sau:

1. Lối vào quản trị: `Thiết lập hệ thống -> Nhân viên AI -> Dịch vụ LLM`.
2. Lối vào nhanh ở giao diện người dùng: Trong bảng điều khiển trò chuyện AI, sử dụng `Model Switcher` để chọn mô hình, sau đó nhấp vào lối vào nhanh "Thêm dịch vụ LLM" để chuyển hướng trực tiếp.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Thông thường bạn cần xác nhận:
1. Chọn Nhà cung cấp (Provider).
2. Điền API Key.
3. Cấu hình `Mô hình đã bật` (Enabled Models), mặc định có thể sử dụng Recommend.

## Bật nhân viên tích hợp sẵn

Các nhân viên AI tích hợp sẵn được bật theo mặc định, thông thường không cần phải bật thủ công từng cái.

Nếu bạn cần điều chỉnh phạm vi sử dụng (bật/tắt một nhân viên cụ thể), bạn có thể thay đổi công tắc `Đã bật` (Enabled) trong trang danh sách `Thiết lập hệ thống -> Nhân viên AI`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Bắt đầu cộng tác

Tại trang ứng dụng, di chuột vào lối vào nhanh ở góc dưới bên phải và chọn nhân viên AI.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Nhấp để mở hộp thoại trò chuyện AI:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Bạn cũng có thể:  
* Thêm khối (block)
* Thêm tệp đính kèm
* Bật tìm kiếm web
* Chuyển đổi nhân viên AI
* Chọn mô hình

Chúng cũng có thể tự động lấy cấu trúc trang làm ngữ cảnh, ví dụ như Dex trên một khối biểu mẫu sẽ tự động lấy cấu trúc các trường của biểu mẫu và gọi các kỹ năng phù hợp để thao tác trên trang.

## Tác vụ nhanh

Bạn có thể thiết lập sẵn các tác vụ thường dùng cho mỗi nhân viên AI tại vị trí hiện tại, giúp bắt đầu công việc chỉ với một cú nhấp chuột, vừa nhanh chóng vừa tiện lợi.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Danh sách nhân viên tích hợp sẵn

NocoBase cung cấp sẵn nhiều nhân viên AI cho các tình huống khác nhau.

Bạn chỉ cần:

1. Cấu hình dịch vụ LLM.
2. Điều chỉnh trạng thái bật của nhân viên theo nhu cầu (mặc định đã bật).
3. Chọn mô hình trong cuộc hội thoại và bắt đầu cộng tác.

| Tên nhân viên | Định hướng vai trò | Năng lực cốt lõi |
| :--- | :--- | :--- |
| **Cole** | Trợ lý NocoBase | Hỏi đáp cách sử dụng sản phẩm, truy xuất tài liệu |
| **Ellis** | Chuyên gia Email | Soạn thảo email, tạo tóm tắt, gợi ý phản hồi |
| **Dex** | Chuyên gia sắp xếp dữ liệu | Dịch trường dữ liệu, định dạng, trích xuất thông tin |
| **Viz** | Nhà phân tích thông tin chuyên sâu | Thông tin chuyên sâu về dữ liệu, phân tích xu hướng, giải thích các chỉ số chính |
| **Lexi** | Trợ lý dịch thuật | Dịch đa ngôn ngữ, hỗ trợ giao tiếp |
| **Vera** | Nhà phân tích nghiên cứu | Tìm kiếm mạng, tổng hợp thông tin, nghiên cứu chuyên sâu |
| **Dara** | Chuyên gia trực quan hóa dữ liệu | Cấu hình biểu đồ, tạo báo cáo trực quan |
| **Orin** | Chuyên gia mô hình hóa dữ liệu | Hỗ trợ thiết kế cấu trúc bộ sưu tập, gợi ý trường dữ liệu |
| **Nathan** | Kỹ sư Frontend | Hỗ trợ viết các đoạn mã frontend, điều chỉnh kiểu dáng (style) |

**Ghi chú**

Một số nhân viên AI tích hợp sẵn sẽ không xuất hiện trong danh sách ở góc dưới bên phải, chúng có các kịch bản công việc riêng biệt:

- Orin: Trang mô hình hóa dữ liệu.
- Dara: Khối cấu hình biểu đồ.
- Nathan: JS Block và các trình chỉnh sửa mã tương tự.