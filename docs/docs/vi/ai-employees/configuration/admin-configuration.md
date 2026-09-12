---
pkg: "@nocobase/plugin-ai"
title: "Hướng dẫn cấu hình Quản trị viên cho Nhân viên AI"
description: "Cấu hình Nhân viên AI trong 5 bước: dịch vụ mô hình, tạo nhân viên, cấu hình Skills, Knowledge Base, xác minh hiệu quả; cấu hình tác vụ cấp trang và cấp Block; thực hành tốt nhất và câu hỏi thường gặp."
keywords: "Cấu hình Nhân viên AI,Hướng dẫn Quản trị viên,Dịch vụ LLM,Cấu hình tác vụ,Cấu hình Skills,NocoBase"
---

# Nhân viên AI · Hướng dẫn cấu hình Quản trị viên

> Tài liệu này giúp bạn nhanh chóng hiểu cách cấu hình và quản lý Nhân viên AI, từ dịch vụ mô hình đến triển khai tác vụ, từng bước hướng dẫn bạn đi qua toàn bộ quy trình.


## I. Trước khi bắt đầu

### 1. Yêu cầu hệ thống

Trước khi cấu hình, vui lòng đảm bảo môi trường của bạn đáp ứng các điều kiện sau:

* Đã cài đặt **NocoBase 2.0 hoặc phiên bản cao hơn**
* Đã kích hoạt **Plugin Nhân viên AI**
* Có ít nhất một **dịch vụ LLM** khả dụng (như OpenAI, Claude, DeepSeek, GLM, v.v.)


### 2. Hiểu thiết kế hai lớp của Nhân viên AI

Nhân viên AI được chia thành hai lớp: **"Định nghĩa vai trò"** và **"Tùy chỉnh tác vụ"**.

| Lớp | Mô tả | Đặc điểm | Tác dụng |
| -------- | ------------ | ---------- | ------- |
| **Định nghĩa vai trò** | Persona cơ bản và năng lực cốt lõi của nhân viên | Ổn định không đổi, giống như "sơ yếu lý lịch" | Đảm bảo tính nhất quán của vai trò |
| **Tùy chỉnh tác vụ** | Cấu hình cho các kịch bản nghiệp vụ khác nhau | Linh hoạt điều chỉnh | Thích ứng tác vụ cụ thể |

**Hiểu đơn giản:**

> "Định nghĩa vai trò" quyết định nhân viên này là ai,
> "Tùy chỉnh tác vụ" quyết định anh ta cần làm gì hiện tại.

Lợi ích của thiết kế này là:

* Vai trò không thay đổi, nhưng có thể đảm nhiệm các kịch bản khác nhau
* Nâng cấp hoặc thay thế tác vụ không ảnh hưởng đến chính nhân viên
* Bối cảnh và tác vụ độc lập với nhau, bảo trì dễ dàng hơn


## II. Quy trình cấu hình (Hoàn thành trong 5 bước)

### Bước 1: Cấu hình dịch vụ mô hình

Dịch vụ mô hình tương đương với bộ não của Nhân viên AI, phải được thiết lập trước.

> Mẹo: Hướng dẫn cấu hình chi tiết xem tại: [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service)

**Đường dẫn:**
`Cài đặt hệ thống → Nhân viên AI → LLM service`

![Vào trang cấu hình](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Nhấp **Thêm**, điền các thông tin sau:

| Mục | Mô tả | Lưu ý |
| ------ | -------------------------- | --------- |
| Provider | Như OpenAI, Claude, Gemini, Kimi, v.v. | Dịch vụ tương thích với cùng đặc tả |
| API Key | Khóa do nhà cung cấp dịch vụ cung cấp | Giữ bí mật và thay đổi định kỳ |
| Base URL | API Endpoint (tùy chọn) | Cần sửa đổi khi sử dụng proxy |
| Enabled Models | Mô hình khuyến nghị / Chọn mô hình / Nhập mô hình thủ công | Quyết định phạm vi mô hình có thể chuyển đổi trong phiên hội thoại |

![Tạo dịch vụ mô hình lớn](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Sau khi cấu hình, vui lòng sử dụng `Test flight` để **kiểm tra kết nối**.
Nếu thất bại, vui lòng kiểm tra mạng, khóa hoặc tên mô hình.

![Kiểm tra kết nối](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Bước 2: Tạo Nhân viên AI

> Mẹo: Hướng dẫn chi tiết xem tại: [Tạo Nhân viên AI](/ai-employees/features/new-ai-employees)

Đường dẫn: `Quản lý Nhân viên AI → Tạo nhân viên`

Điền thông tin cơ bản:

| Field | Bắt buộc | Ví dụ |
| ----- | -- | -------------- |
| Tên | ✓ | viz, dex, cole |
| Biệt danh | ✓ | Viz, Dex, Cole |
| Trạng thái kích hoạt | ✓ | Bật |
| Giới thiệu | - | "Chuyên gia phân tích dữ liệu" |
| Prompt chính | ✓ | Xem hướng dẫn Prompt engineering |
| Lời chào | - | "Xin chào, tôi là Viz…" |

![Cấu hình thông tin cơ bản](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Giai đoạn tạo nhân viên chủ yếu hoàn thành cấu hình vai trò và Skills. Mô hình sử dụng thực tế có thể chọn trong phiên hội thoại thông qua `Model Switcher`.

**Khuyến nghị viết Prompt:**

* Nói rõ vai trò, ngữ điệu và trách nhiệm của nhân viên
* Sử dụng các từ như "phải", "tuyệt đối không" để nhấn mạnh quy tắc
* Cố gắng bao gồm ví dụ, tránh giải thích trừu tượng
* Kiểm soát trong khoảng 500–1000 ký tự

> Prompt càng rõ ràng, AI càng hoạt động ổn định.
> Có thể tham khảo [Hướng dẫn Prompt engineering](./prompt-engineering-guide.md).


### Bước 3: Cấu hình Skills

Skills quyết định nhân viên có thể "làm gì".

> Mẹo: Hướng dẫn chi tiết xem tại: [Skills](/ai-employees/features/tools)

| Loại | Phạm vi năng lực | Ví dụ | Cấp độ rủi ro |
| ---- | ------- | --------- | ------ |
| Front-end | Tương tác trang | Đọc dữ liệu Block, điền form | Thấp |
| Mô hình dữ liệu | Truy vấn và phân tích dữ liệu | Thống kê tổng hợp | Trung bình |
| Workflow | Thực thi quy trình nghiệp vụ | Công cụ tùy chỉnh | Phụ thuộc vào Workflow |
| Khác | Mở rộng bên ngoài | Tìm kiếm trên web, thao tác tệp | Tùy tình huống |

**Khuyến nghị cấu hình:**

* 3–5 Skills cho mỗi nhân viên là phù hợp nhất
* Không khuyến nghị chọn tất cả, dễ gây nhầm lẫn
* Các thao tác quan trọng khuyến nghị sử dụng quyền `Ask`, không phải `Allow`

![Cấu hình Skills](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Bước 4: Cấu hình Knowledge Base (Tùy chọn)

Nếu Nhân viên AI của bạn cần ghi nhớ hoặc tham chiếu lượng lớn tài liệu, như sách hướng dẫn sản phẩm, FAQ, v.v., bạn có thể cấu hình Knowledge Base.

> Mẹo: Hướng dẫn chi tiết xem tại:
> - [Tổng quan Knowledge Base AI](/ai-employees/knowledge-base/index)
> - [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database)
> - [Cấu hình Knowledge Base](/ai-employees/knowledge-base/knowledge-base)
> - [RAG - Tăng cường truy xuất tạo sinh](/ai-employees/knowledge-base/rag)

Điều này cần cài đặt thêm Plugin cơ sở dữ liệu vector.

![Cấu hình Knowledge Base](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Kịch bản phù hợp:**

* Để AI hiểu kiến thức doanh nghiệp
* Hỗ trợ hỏi đáp tài liệu và truy xuất
* Đào tạo trợ lý chuyên ngành


### Bước 5: Xác minh hiệu quả

Sau khi hoàn thành, bạn sẽ thấy avatar của nhân viên mới ở góc dưới bên phải trang.

![Xác minh cấu hình](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Vui lòng kiểm tra từng mục:

* Biểu tượng có hiển thị bình thường không
* Có thể trò chuyện cơ bản không
* Skills có thể được gọi đúng không

Nếu tất cả đều thông qua, có nghĩa là cấu hình đã thành công.


## III. Cấu hình tác vụ: Để AI thực sự đi làm

Phía trước đã hoàn thành "tạo nhân viên",
tiếp theo cần để họ "đi làm việc".

Tác vụ AI định nghĩa hành vi của nhân viên trong các trang hoặc Block cụ thể.

> Mẹo: Hướng dẫn chi tiết xem tại: [Tác vụ](/ai-employees/features/task)


### 1. Tác vụ cấp trang

Phù hợp với phạm vi toàn bộ trang, ví dụ "phân tích dữ liệu trang này".

**Lối vào cấu hình:**
`Cài đặt trang → Nhân viên AI → Thêm tác vụ`

| Field | Mô tả | Ví dụ |
| ---- | -------- | --------- |
| Tiêu đề | Tên tác vụ | Phân tích chuyển đổi giai đoạn |
| Bối cảnh | Ngữ cảnh trang hiện tại | Trang danh sách Leads |
| Tin nhắn mặc định | Hội thoại đặt sẵn | "Vui lòng phân tích xu hướng tháng này" |
| Block mặc định | Tự động liên kết bảng dữ liệu | Bảng leads |
| Skills | Công cụ khả dụng | Truy vấn dữ liệu, tạo biểu đồ |

![Cấu hình tác vụ cấp trang](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Hỗ trợ đa tác vụ:**
Cùng một Nhân viên AI có thể cấu hình nhiều tác vụ, hiển thị dưới dạng tùy chọn cho người dùng chọn:

![Hỗ trợ đa tác vụ](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Khuyến nghị:

* Một tác vụ tập trung vào một mục tiêu
* Tên rõ ràng dễ hiểu
* Số lượng tác vụ kiểm soát trong 5–7

### 2. Tác vụ cấp Block

Phù hợp để thao tác một Block cụ thể, như "dịch form hiện tại".

**Cách cấu hình:**

1. Mở cấu hình thao tác Block
2. Thêm "Nhân viên AI"

![Nút thêm Nhân viên AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Liên kết với nhân viên mục tiêu là được

![Chọn Nhân viên AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Cấu hình tác vụ cấp Block](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Mục so sánh | Cấp trang | Cấp Block |
| ---- | ---- | --------- |
| Phạm vi dữ liệu | Toàn bộ trang | Block hiện tại |
| Độ chi tiết | Phân tích toàn cục | Xử lý chi tiết |
| Mục đích điển hình | Phân tích xu hướng | Dịch form, trích xuất Field |


## IV. Thực hành tốt nhất

### 1. Khuyến nghị cấu hình

| Mục | Khuyến nghị | Lý do |
| ---------- | ----------- | -------- |
| Số lượng Skills | 3–5 | Độ chính xác cao, phản hồi nhanh |
| Chế độ quyền (Ask / Allow) | Sửa đổi dữ liệu khuyến nghị Ask | Ngăn thao tác sai |
| Độ dài Prompt | 500–1000 ký tự | Cân bằng tốc độ và chất lượng |
| Mục tiêu tác vụ | Đơn nhất rõ ràng | Tránh AI bối rối |
| Workflow | Đóng gói tác vụ phức tạp trước khi sử dụng | Tỷ lệ thành công cao hơn |


### 2. Khuyến nghị thực chiến

**Từ nhỏ đến lớn, tối ưu dần dần:**

1. Tạo nhân viên cơ bản trước (như Viz, Dex)
2. Bật 1–2 Skills cốt lõi để kiểm tra
3. Xác nhận có thể thực thi tác vụ bình thường
4. Sau đó dần dần mở rộng nhiều Skills và tác vụ hơn

**Quy trình tối ưu liên tục:**

1. Phiên bản đầu chạy được
2. Thu thập phản hồi sử dụng
3. Tối ưu Prompt và cấu hình tác vụ
4. Kiểm tra và lặp cải tiến


## V. Câu hỏi thường gặp

### 1. Giai đoạn cấu hình

**Q: Lưu thất bại thì làm sao?**
A: Kiểm tra xem đã điền tất cả các mục bắt buộc chưa, đặc biệt là dịch vụ mô hình và Prompt.

**Q: Nên chọn mô hình nào?**

* Loại mã nguồn → Claude, GPT-4
* Loại phân tích → Claude, DeepSeek
* Nhạy cảm về chi phí → Qwen, GLM
* Văn bản dài → Gemini, Claude


### 2. Giai đoạn sử dụng

**Q: AI phản hồi quá chậm?**

* Giảm số lượng Skills
* Tối ưu Prompt
* Kiểm tra độ trễ dịch vụ mô hình
* Có thể cân nhắc đổi mô hình

**Q: Tác vụ thực thi không chính xác?**

* Prompt không đủ rõ ràng
* Quá nhiều Skills gây nhầm lẫn
* Chia nhỏ tác vụ, thêm ví dụ

**Q: Khi nào chọn Ask / Allow?**

* Tác vụ loại truy vấn có thể sử dụng `Allow`
* Tác vụ loại sửa đổi dữ liệu khuyến nghị sử dụng `Ask`

**Q: Làm thế nào để AI xử lý form cụ thể?**

A: Nếu là cấu hình cấp trang, cần chọn Block thủ công.

![Chọn Block thủ công](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Nếu là cấu hình tác vụ cấp Block, sẽ tự động liên kết ngữ cảnh dữ liệu.


## VI. Đọc tiếp theo

Để Nhân viên AI mạnh hơn, có thể đọc tiếp các tài liệu sau:

**Liên quan đến cấu hình:**

* [Hướng dẫn Prompt engineering](./prompt-engineering-guide.md) - Kỹ thuật và thực hành tốt nhất để viết Prompt chất lượng cao
* [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service) - Hướng dẫn cấu hình chi tiết dịch vụ mô hình lớn
* [Tạo Nhân viên AI](/ai-employees/features/new-ai-employees) - Tạo và cấu hình cơ bản Nhân viên AI
* [Cộng tác với Nhân viên AI](/ai-employees/features/collaborate) - Cách trò chuyện hiệu quả với Nhân viên AI

**Tính năng nâng cao:**

* [Skills](/ai-employees/features/tools) - Tìm hiểu sâu về cấu hình và sử dụng các loại Skills
* [Tác vụ](/ai-employees/features/task) - Kỹ thuật nâng cao trong cấu hình tác vụ
* [Chọn Block](/ai-employees/features/pick-block) - Cách chỉ định Block dữ liệu cho Nhân viên AI
* Nguồn dữ liệu - Vui lòng tham khảo tài liệu cấu hình nguồn dữ liệu của Plugin tương ứng
* [Tìm kiếm trên web](/ai-employees/features/web-search) - Cấu hình năng lực tìm kiếm trên web cho Nhân viên AI

**Knowledge Base và RAG:**

* [Tổng quan Knowledge Base AI](/ai-employees/knowledge-base/index) - Giới thiệu tính năng Knowledge Base
* [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database) - Cấu hình cơ sở dữ liệu vector
* [Knowledge Base](/ai-employees/knowledge-base/knowledge-base) - Cách tạo và quản lý Knowledge Base
* [RAG - Tăng cường truy xuất tạo sinh](/ai-employees/knowledge-base/rag) - Ứng dụng công nghệ RAG

**Tích hợp Workflow:**

* [Node LLM - Hội thoại văn bản](/ai-employees/workflow/nodes/llm/chat) - Sử dụng hội thoại văn bản trong Workflow
* [Node LLM - Hội thoại đa phương thức](/ai-employees/workflow/nodes/llm/multimodal-chat) - Xử lý đầu vào đa phương thức như hình ảnh, tệp
* [Node LLM - Đầu ra có cấu trúc](/ai-employees/workflow/nodes/llm/structured-output) - Lấy phản hồi AI có cấu trúc


## Lời kết

Điều quan trọng nhất khi cấu hình Nhân viên AI là: **chạy thông trước, tối ưu sau**.
Hãy để nhân viên đầu tiên triển khai thành công trước, sau đó dần dần mở rộng và tinh chỉnh.

Hướng khắc phục có thể theo thứ tự:

1. Dịch vụ mô hình có kết nối được không
2. Số lượng Skills có quá nhiều không
3. Prompt có rõ ràng không
4. Mục tiêu tác vụ có rõ ràng không

Chỉ cần tiến hành từng bước, bạn có thể xây dựng một đội ngũ AI thực sự hiệu quả.
