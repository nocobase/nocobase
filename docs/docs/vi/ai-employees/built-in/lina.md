---
title: 'Lina: Kỹ sư bản địa hóa'
description: 'Tài liệu AI Employee của NocoBase.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina: Kỹ sư bản địa hóa

## Vai trò

Lina: Kỹ sư bản địa hóa tập trung vào kịch bản tích hợp sẵn này của NocoBase và giúp hoàn thành tác vụ liên quan hiệu quả hơn.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Mẹo}
Lina chuyên cho kịch bản bản địa hóa và không dùng Skills hoặc Tools chung.
:::

## Kịch bản

- Dịch hàng loạt từ vựng hệ thống và plugin.
- Dịch nội dung collection, field và menu.
- Chỉ dịch các từ vựng được chọn trong bảng.

## Điều kiện tiên quyết

Trước khi dùng Lina, hãy hoàn tất cấu hình sau:

- Bật plugin **Quản lý bản địa hóa**.
- Cấu hình dịch vụ LLM khả dụng và gán mô hình mặc định cho Lina. Xem [Cấu hình mô hình cho AI Employee](/ai-employees/features/model-settings) và [Khuyến nghị chọn mô hình](#khuyến-nghị-chọn-mô-hình).
- Bật ngôn ngữ đích trong cài đặt hệ thống.
- Đồng bộ các từ vựng cần dịch trên trang Quản lý bản địa hóa.

:::info{title=Mẹo}
Lina tạo tác vụ dịch cho locale hiện tại.
:::

## Cấu hình prompt

Mở hộp thoại chỉnh sửa Lina từ `System Settings -> AI Employees -> AI employees`, rồi điều chỉnh prompt trong `Role setting`. Prompt thường dùng để định nghĩa thông tin lĩnh vực nghiệp vụ, quy tắc thuật ngữ và ràng buộc đầu ra. Không nên viết quá dài, nếu không có thể không phù hợp với các mô hình dịch chuyên dụng.

![](https://static-docs.nocobase.com/202605191351816.png)

Ví dụ prompt mặc định:

```text
# Role
You are Lina, a professional localization translator for NocoBase.

# Task
Translate NocoBase localization text into the requested target language.

# Translation requirements
1. Keep the translation faithful, concise, and natural for product UI.
2. Use consistent NocoBase and software terminology.
3. Preserve placeholders, variables, HTML tags, ICU syntax, line breaks, and code-like tokens.
4. Return only the translated text. Do not explain, quote, or use Markdown.
5. If the text should not be translated, return it unchanged.
```

Bản dịch tham chiếu và văn bản cần dịch không cần viết vào prompt của Lina. Khi tạo tác vụ, hệ thống sẽ tự động ghép chúng dựa trên nội dung mục, ngôn ngữ đích và cấu hình ngôn ngữ tham chiếu trong hộp thoại xác nhận.

## Cách sử dụng

Trên trang Quản lý bản địa hóa, click avatar của Lina và chọn phạm vi tác vụ dịch bằng AI.

### Dịch tăng dần

Chỉ dịch các từ vựng chưa có bản dịch trong ngôn ngữ hiện tại.

Đối với từ vựng tích hợp, nếu bản dịch đã tồn tại trong gói ngôn ngữ hệ thống hoặc plugin của ngôn ngữ đích, từ vựng đó được xem là đã có bản dịch ngay cả khi chưa có record tương ứng trong bảng bản dịch bản địa hóa, và sẽ không được tính vào dịch tăng dần.

### Dịch mục đã chọn

Trước tiên chọn các từ vựng trong bảng, rồi chỉ dịch nội dung đã chọn.

Nếu chưa chọn từ vựng nào, hệ thống sẽ yêu cầu chọn bản ghi trước.

### Dịch toàn bộ

Dịch tất cả từ vựng đủ điều kiện trong ngôn ngữ hiện tại.

:::warning{title=Lưu ý}
Dịch toàn bộ có thể ghi đè bản dịch hiện có. Hãy xác nhận ngôn ngữ đích, số lượng từ vựng và dịch vụ mô hình trước khi bắt đầu.
:::

## Xác nhận tác vụ

Trước khi tạo tác vụ, hệ thống hiển thị hộp thoại xác nhận gồm:

- Mô tả tác vụ.
- Số lượng từ vựng cần dịch.
- Provider sẽ sử dụng.
- Mô hình sẽ sử dụng.
- Cấu hình ngôn ngữ bản dịch tham chiếu.

Dịch toàn bộ và dịch tăng dần cũng cho phép chọn phạm vi dịch trong hộp thoại xác nhận:

- **Tất cả**: xử lý tất cả từ vựng phù hợp với điều kiện tác vụ hiện tại.
- **Từ vựng tích hợp**: từ vựng hệ thống và plugin.
- **Từ vựng tùy chỉnh**: tên route, tên collection và field, cùng nội dung UI.

Dịch mục đã chọn chỉ xử lý các record đã được chọn trong bảng, nên không hiển thị phạm vi dịch. Tùy chọn này cũng chỉ hiển thị một cấu hình ngôn ngữ tham chiếu chung, không tách riêng từ vựng tích hợp và từ vựng tùy chỉnh.

Nếu số lượng từ vựng cần dịch là 0, hệ thống sẽ nhắc người dùng và không tạo tác vụ chạy nền. Sau khi xác nhận, hệ thống tạo tác vụ chạy nền. Có thể xem tiến độ trong async tasks. Khi hoàn tất, bản dịch được ghi vào ngôn ngữ tương ứng.

![](https://static-docs.nocobase.com/202605191341968.png)

## Bản dịch tham chiếu

Các từ vựng ngắn như tên field, nút và trạng thái dùng bản dịch tham chiếu để tăng tính nhất quán.

- Từ vựng tích hợp dùng bản dịch tiếng Trung làm tham chiếu mặc định và tiếng Nhật làm tham chiếu dự phòng.
- Từ vựng tùy chỉnh dùng ngôn ngữ mặc định của hệ thống làm tham chiếu mặc định và tiếng Trung làm tham chiếu dự phòng.
- Người dùng có thể điều chỉnh ngôn ngữ mặc định và ngôn ngữ dự phòng trong hộp thoại xác nhận tác vụ.
- Hệ thống ưu tiên dùng bản dịch tham chiếu trong ngôn ngữ mặc định. Nếu không có, hệ thống sẽ thử ngôn ngữ dự phòng.

Khi có tham chiếu, Lina dùng prompt có ngữ nghĩa tương tự:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Khuyến nghị chọn mô hình

Dịch bản địa hóa thường xử lý nhiều từ vựng. Nếu có thể, ưu tiên dùng mô hình nhỏ chuyên dịch triển khai cục bộ vì mô hình online thường có giới hạn tần suất, concurrency hoặc token.

Nếu không thể triển khai cục bộ, hãy chọn mô hình chuyên dịch thay vì mô hình chat thông thường. Mô hình dịch thường phù hợp hơn với mục ngắn, văn bản UI và dịch hàng loạt. Lina sẽ ghép prompt của employee, bản dịch tham chiếu và văn bản cần dịch thành prompt gửi cho mô hình. Người dùng có thể điều chỉnh prompt của Lina để kiểm soát phong cách và quy tắc dịch.

Có thể điều chỉnh concurrency theo năng lực mô hình để kiểm soát thông lượng, thời gian phản hồi và chi phí.

Để xem thực hành đầy đủ với mô hình nhỏ chuyên dịch được triển khai cục bộ, xem [Dùng Lina và HY-MT1.5-1.8B cục bộ để dịch từ vựng bản địa hóa](/ai-employees/scenarios/localization-hy-mt).

:::info{title=Mẹo}
Concurrency được điều khiển bằng `AI_LOCALIZATION_CONCURRENCY`. Mặc định `10`, phạm vi `1` đến `20`; ngoài phạm vi sẽ dùng mặc định.
:::

## Tiến độ và xử lý lỗi

Tác vụ dịch của Lina chạy nền dưới dạng async task và ghi kết quả theo từng từ vựng.

![](https://static-docs.nocobase.com/202605121235761.png)

Nếu một từ vựng dịch lỗi, lỗi sẽ được ghi lại và tác vụ dừng để tránh kết quả không kiểm soát.

- Plugin AI hoặc Async Task Manager chưa được bật.
- Lina chưa được cấu hình mô hình khả dụng.
- Dịch vụ mô hình không khả dụng hoặc timeout.

Kiểm tra chi tiết async task và log server: provider, mô hình, ngôn ngữ đích, ID từ vựng và thời gian gọi.

## Kiểm tra trước khi phát hành

Sau khi dịch bằng AI xong, kiểm tra trước khi phát hành:

- Từ vựng ngắn như menu, nút và tên field phù hợp ngữ cảnh sản phẩm.
- Biến, placeholder và tag HTML được giữ nguyên.
- Thuật ngữ nghiệp vụ nhất quán.
- Phát hành sau khi kiểm tra.
