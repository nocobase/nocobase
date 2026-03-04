:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/ai-employees/features/llm-service).
:::

# Cấu hình dịch vụ LLM

Trước khi sử dụng Nhân viên AI, bạn cần cấu hình các dịch vụ LLM khả dụng.

Hiện tại hệ thống hỗ trợ OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi và các mô hình cục bộ Ollama.

## Tạo dịch vụ mới

Truy cập vào `Cài đặt hệ thống -> Nhân viên AI -> LLM service`.

1. Nhấn vào `Add New` để mở cửa sổ tạo mới.
2. Chọn `Provider` (Nhà cung cấp).
3. Điền `Title`, `API Key` và `Base URL` (tùy chọn).
4. Cấu hình `Enabled Models`:
   - `Recommended models`: Sử dụng các mô hình được đề xuất chính thức.
   - `Select models`: Chọn từ danh sách trả về của Provider.
   - `Manual input`: Nhập thủ công ID mô hình và tên hiển thị.
5. Nhấn `Submit` để lưu.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Kích hoạt và sắp xếp dịch vụ

Trong danh sách dịch vụ LLM, bạn có thể trực tiếp:

- Sử dụng công tắc `Enabled` để bật hoặc tắt dịch vụ.
- Kéo và thả để sắp xếp thứ tự dịch vụ (ảnh hưởng đến thứ tự hiển thị của mô hình).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Kiểm tra tính khả dụng

Sử dụng `Test flight` ở phía dưới cửa sổ cấu hình dịch vụ để kiểm tra tính khả dụng của dịch vụ và mô hình.

Khuyến nghị nên kiểm tra trước khi đưa vào sử dụng thực tế.