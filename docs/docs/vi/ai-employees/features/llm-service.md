---
pkg: '@nocobase/plugin-ai'
title: 'Cấu hình dịch vụ LLM'
description: 'Cấu hình dịch vụ LLM khả dụng cho Nhân viên AI, hỗ trợ OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, Ollama, tạo mới dịch vụ, kích hoạt sắp xếp và kiểm tra tính khả dụng.'
keywords: 'Dịch vụ LLM,OpenAI,Claude,Gemini,DeepSeek,Ollama,NocoBase AI'
---

# Cấu hình dịch vụ LLM

Trước khi sử dụng Nhân viên AI, bạn cần cấu hình dịch vụ LLM khả dụng.

Hiện tại hỗ trợ OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, cũng như mô hình cục bộ Ollama.

## Tạo dịch vụ mới

Vào `Cài đặt hệ thống -> Nhân viên AI -> LLM service`.

1. Nhấp `Add New` để mở hộp thoại tạo mới.
2. Chọn `Provider`.
3. Điền `Title`, `API Key`, `Base URL` (tùy chọn).
4. Cấu hình `Enabled Models`:
   - `Select models`: Chọn từ danh sách mô hình do API của nhà cung cấp dịch vụ phản hồi.
   - `Manual input`: Khi không thể lấy danh sách mô hình từ API của nhà cung cấp dịch vụ, bạn có thể nhập thủ công ID mô hình và tên hiển thị.
5. Nhấp `Submit` để lưu.

![20260425172809](https://static-docs.nocobase.com/20260425172809.png)

## Kích hoạt và sắp xếp dịch vụ

Trong danh sách dịch vụ LLM bạn có thể trực tiếp:

- Sử dụng công tắc `Enabled` để bật/tắt dịch vụ.
- Kéo thả để sắp xếp thứ tự dịch vụ (ảnh hưởng đến thứ tự hiển thị mô hình).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Kiểm tra tính khả dụng

Sử dụng `Test flight` ở cuối hộp thoại cấu hình dịch vụ để kiểm tra tính khả dụng của dịch vụ và mô hình.

Khuyến nghị kiểm tra trước rồi mới đưa vào sử dụng nghiệp vụ.
