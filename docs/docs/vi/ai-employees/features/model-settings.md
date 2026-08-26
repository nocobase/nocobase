---
title: 'Cấu hình mô hình cho AI Employee'
description: 'Cấu hình mô hình cho AI Employee.'
keywords: 'AI Employee model settings,dedicated model,model scope,LLM service,NocoBase AI'
---

# Cấu hình mô hình cho AI Employee

Mặc định, AI Employee có thể dùng tất cả dịch vụ LLM và mô hình đã bật. Quản trị viên có thể bật cấu hình mô hình riêng cho từng employee và giới hạn phạm vi mô hình.

## Điều kiện tiên quyết

- Plugin **AI Employees** đã được bật.
- Đã cấu hình ít nhất một dịch vụ LLM.
- AI Employee mục tiêu đã được bật.

Để cấu hình dịch vụ LLM, xem [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service).

## Điểm vào

Vào `System Settings -> AI Employees -> AI employees`, mở employee cần cấu hình và chuyển sang `Model settings`.

![](https://static-docs.nocobase.com/202605121216415.png)

## Bật cấu hình mô hình riêng

Sau khi bật `Enable dedicated model configuration`, chọn các mô hình được phép trong `Models`.

- Bộ chọn mô hình trong chat chỉ hiển thị mô hình đã chọn.
- Shortcut task và node workflow chỉ có thể dùng mô hình đã chọn.

:::info{title=Mẹo}
Nếu cấu hình mô hình riêng bật nhưng chưa chọn mô hình, hệ thống không thể xác định mô hình khả dụng.
:::

## Tắt cấu hình mô hình riêng

Sau khi tắt, quy tắc mặc định được áp dụng lại:

- Có thể dùng tất cả mô hình LLM đã bật.
- Nếu không chọn thủ công, hệ thống dùng mô hình mặc định toàn cục.

## Quy tắc xác định mô hình

Khi chạy tác vụ, mô hình cuối cùng được xác định theo thứ tự sau:

1. Nếu cấu hình mô hình riêng được bật, trước tiên xác định trong phạm vi mô hình đã chọn.
2. Nếu request chỉ định mô hình và mô hình đó được phép, dùng mô hình đó.
3. Nếu mô hình được chỉ định không được phép, dùng mô hình được phép đầu tiên.
4. Nếu cấu hình mô hình riêng chưa bật, ưu tiên mô hình được request chỉ định.
5. Nếu không chỉ định mô hình, dùng mô hình mặc định toàn cục.

## Khuyến nghị

- Nếu không thể triển khai cục bộ, hãy chọn mô hình chuyên dịch thay vì mô hình chat thông thường.
- Có thể điều chỉnh concurrency theo năng lực mô hình để kiểm soát thông lượng, thời gian phản hồi và chi phí.

## FAQ

### Vì sao danh sách mô hình trống?

Thường do chưa cấu hình LLM hoặc chưa bật mô hình. Kiểm tra `Enabled Models`.

### Vì sao người dùng không thể chuyển sang mô hình khác?

Khi cấu hình riêng bật, chỉ phạm vi mô hình đã chọn khả dụng.

### Những mục nào bị ảnh hưởng?

Ảnh hưởng đến chat mới, shortcut task, node AI Employee trong workflow và task tích hợp plugin. Tin nhắn lịch sử không được tạo lại.
