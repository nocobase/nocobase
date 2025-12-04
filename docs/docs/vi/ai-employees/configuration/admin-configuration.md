:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nhân viên AI · Hướng dẫn cấu hình quản trị



# Nhân viên AI · Hướng dẫn cấu hình quản trị

> Tài liệu này sẽ giúp bạn nhanh chóng nắm bắt cách cấu hình và quản lý Nhân viên AI, hướng dẫn từng bước toàn bộ quy trình từ dịch vụ mô hình đến phân công nhiệm vụ.

## I. Trước khi bắt đầu

### 1. Yêu cầu hệ thống

Trước khi cấu hình, vui lòng đảm bảo môi trường của bạn đáp ứng các điều kiện sau:

* Đã cài đặt **NocoBase 2.0 trở lên**
* Đã bật **plugin Nhân viên AI**
* Có ít nhất một **dịch vụ mô hình ngôn ngữ lớn** khả dụng (ví dụ: OpenAI, Claude, DeepSeek, GLM, v.v.)

### 2. Tìm hiểu thiết kế hai lớp của Nhân viên AI

Nhân viên AI được chia thành hai lớp: **"Định nghĩa vai trò"** và **"Tùy chỉnh nhiệm vụ"**.

| Lớp       | Mô tả           | Đặc điểm         | Chức năng      |
| -------- | ------------ | ---------- | ------- |
| **Định nghĩa vai trò** | Tính cách cơ bản và năng lực cốt lõi của nhân viên | Ổn định và không thay đổi, giống như "sơ yếu lý lịch" | Đảm bảo tính nhất quán của vai trò |
| **Tùy chỉnh nhiệm vụ** | Cấu hình cho các kịch bản nghiệp vụ khác nhau  | Linh hoạt và có thể điều chỉnh       | Thích ứng với các nhiệm vụ cụ thể  |

**Để dễ hiểu hơn:**

> "Định nghĩa vai trò" quyết định nhân viên này là ai,
> "Tùy chỉnh nhiệm vụ" quyết định họ sẽ làm gì vào lúc này.

Lợi ích của thiết kế này là:

* Vai trò không thay đổi, nhưng có thể đảm nhiệm các kịch bản khác nhau
* Nâng cấp hoặc thay thế nhiệm vụ không ảnh hưởng đến bản thân nhân viên
* Bối cảnh và nhiệm vụ độc lập với nhau, giúp việc bảo trì dễ dàng hơn

## II. Quy trình cấu hình (hoàn thành trong 5 bước)

### Bước 1: Cấu hình dịch vụ mô hình

Dịch vụ mô hình giống như bộ não của Nhân viên AI và cần được thiết lập trước tiên.

> 💡 Để biết hướng dẫn cấu hình chi tiết, vui lòng tham khảo: [Cấu hình dịch vụ LLM](/ai-employees/quick-start/llm-service)

**Đường dẫn:**
`Cài đặt hệ thống → Nhân viên AI → Dịch vụ mô hình`

![Vào trang cấu hình](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Nhấp vào **Thêm**, và điền các thông tin sau:

| Mục     | Mô tả                         | Lưu ý      |
| ------ | -------------------------- | --------- |
| Loại giao diện   | Ví dụ: OpenAI, Claude, v.v.          | Tương thích với các dịch vụ cùng tiêu chuẩn |
| Khóa API | Khóa được nhà cung cấp dịch vụ cung cấp                   | Giữ bí mật và thay đổi định kỳ   |
| Địa chỉ dịch vụ   | API Endpoint               | Cần sửa đổi khi sử dụng proxy  |
| Tên mô hình   | Tên mô hình cụ thể (ví dụ: gpt-4, claude-opus) | Ảnh hưởng đến khả năng và chi phí   |

![Tạo dịch vụ mô hình lớn](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Sau khi cấu hình, vui lòng **kiểm tra kết nối**.
Nếu thất bại, vui lòng kiểm tra mạng, khóa API hoặc tên mô hình của bạn.

![Kiểm tra kết nối](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Bước 2: Tạo Nhân viên AI

> 💡 Để biết hướng dẫn chi tiết, vui lòng tham khảo: [Tạo Nhân viên AI](/ai-employees/quick-start/ai-employees)

Đường dẫn: `Quản lý Nhân viên AI → Tạo nhân viên`

Điền thông tin cơ bản:

| Trường    | Bắt buộc | Ví dụ             |
| ----- | -- | -------------- |
| Tên    | ✓  | viz, dex, cole |
| Biệt danh    | ✓  | Viz, Dex, Cole |
| Trạng thái kích hoạt  | ✓  | Bật             |
| Giới thiệu    | -  | "Chuyên gia phân tích dữ liệu"       |
| Lời nhắc chính | ✓  | Xem Hướng dẫn kỹ thuật nhắc nhở       |
| Lời chào   | -  | "Xin chào, tôi là Viz…"   |

![Cấu hình thông tin cơ bản](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Sau đó, liên kết **dịch vụ mô hình** mà bạn vừa cấu hình.

![Liên kết dịch vụ mô hình lớn](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Gợi ý viết lời nhắc:**

* Nêu rõ vai trò, giọng điệu và trách nhiệm của nhân viên
* Sử dụng các từ như "phải", "tuyệt đối không" để nhấn mạnh các quy tắc
* Cố gắng bao gồm ví dụ, tránh mô tả trừu tượng
* Giới hạn trong khoảng 500–1000 ký tự

> Lời nhắc càng rõ ràng, hiệu suất của AI càng ổn định.
> Bạn có thể tham khảo [Hướng dẫn kỹ thuật nhắc nhở](./prompt-engineering-guide.md).

### Bước 3: Cấu hình kỹ năng

Kỹ năng quyết định nhân viên có thể "làm gì".

> 💡 Để biết hướng dẫn chi tiết, vui lòng tham khảo: [Kỹ năng](/ai-employees/advanced/skill)

| Loại   | Phạm vi khả năng    | Ví dụ        | Mức độ rủi ro   |
| ---- | ------- | --------- | ------ |
| Giao diện người dùng   | Tương tác trang    | Đọc dữ liệu khối, điền biểu mẫu | Thấp      |
| Mô hình dữ liệu | Truy vấn và phân tích dữ liệu | Thống kê tổng hợp      | Trung bình      |
| Luồng công việc  | Thực hiện quy trình nghiệp vụ  | Công cụ tùy chỉnh     | Tùy thuộc vào luồng công việc |
| Khác   | Mở rộng bên ngoài    | Tìm kiếm trên web, thao tác tệp | Tùy tình huống  |

**Gợi ý cấu hình:**

* 3–5 kỹ năng cho mỗi nhân viên là phù hợp nhất
* Không nên chọn tất cả, dễ gây nhầm lẫn
* Tắt tự động sử dụng (Auto usage) trước các thao tác quan trọng

![Cấu hình kỹ năng](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Bước 4: Cấu hình cơ sở tri thức (Tùy chọn)

Nếu Nhân viên AI của bạn cần ghi nhớ hoặc tham chiếu một lượng lớn tài liệu, ví dụ như hướng dẫn sản phẩm, FAQ, v.v., bạn có thể cấu hình cơ sở tri thức.

> 💡 Để biết hướng dẫn chi tiết, vui lòng tham khảo:
> - [Tổng quan về cơ sở tri thức AI](/ai-employees/knowledge-base/index)
> - [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database)
> - [Cấu hình cơ sở tri thức](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Tạo sinh tăng cường truy xuất)](/ai-employees/knowledge-base/rag)

Điều này yêu cầu cài đặt thêm plugin cơ sở dữ liệu vector.

![Cấu hình cơ sở tri thức](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Các trường hợp áp dụng:**

* Giúp AI hiểu kiến thức doanh nghiệp
* Hỗ trợ hỏi đáp và truy xuất tài liệu
* Đào tạo trợ lý chuyên biệt theo lĩnh vực

### Bước 5: Xác minh hiệu quả

Sau khi hoàn tất, bạn sẽ thấy ảnh đại diện của nhân viên mới ở góc dưới bên phải trang.

![Xác minh cấu hình](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Vui lòng kiểm tra từng mục:

* ✅ Biểu tượng có hiển thị bình thường không?
* ✅ Có thể thực hiện cuộc trò chuyện cơ bản không?
* ✅ Các kỹ năng có được gọi đúng cách không?

Nếu tất cả đều đạt, cấu hình đã thành công 🎉

## III. Cấu hình nhiệm vụ: Để AI thực sự bắt đầu làm việc

Những gì chúng ta đã hoàn thành trước đó là "tạo nhân viên",
Tiếp theo là để họ "đi làm việc".

Nhiệm vụ AI định nghĩa hành vi của nhân viên trên một trang hoặc khối cụ thể.

> 💡 Để biết hướng dẫn chi tiết, vui lòng tham khảo: [Nhiệm vụ](/ai-employees/advanced/task)

### 1. Nhiệm vụ cấp trang

Áp dụng cho toàn bộ phạm vi trang, ví dụ như "Phân tích dữ liệu trên trang này".

**Điểm vào cấu hình:**
`Cài đặt trang → Nhân viên AI → Thêm nhiệm vụ`

| Trường   | Mô tả       | Ví dụ        |
| ---- | -------- | --------- |
| Tiêu đề   | Tên nhiệm vụ     | Phân tích chuyển đổi giai đoạn    |
| Bối cảnh   | Ngữ cảnh của trang hiện tại | Trang danh sách Leads |
| Tin nhắn mặc định | Cuộc hội thoại cài đặt sẵn     | "Vui lòng phân tích xu hướng tháng này" |
| Khối mặc định | Tự động liên kết với bộ sưu tập  | bảng leads  |
| Kỹ năng   | Công cụ khả dụng     | Truy vấn dữ liệu, tạo biểu đồ |

![Cấu hình nhiệm vụ cấp trang](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Hỗ trợ đa nhiệm vụ:**
Một Nhân viên AI có thể được cấu hình với nhiều nhiệm vụ, được hiển thị dưới dạng tùy chọn để người dùng lựa chọn:

![Hỗ trợ đa nhiệm vụ](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Gợi ý:

* Một nhiệm vụ nên tập trung vào một mục tiêu
* Tên phải rõ ràng và dễ hiểu
* Giới hạn số lượng nhiệm vụ trong khoảng 5–7

### 2. Nhiệm vụ cấp khối

Phù hợp để thao tác trên một khối cụ thể, ví dụ như "Dịch biểu mẫu hiện tại".

**Phương pháp cấu hình:**

1. Mở cấu hình thao tác khối
2. Thêm "Nhân viên AI"

![Nút thêm Nhân viên AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Chỉ cần liên kết nhân viên mục tiêu

![Chọn Nhân viên AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Cấu hình nhiệm vụ cấp khối](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| So sánh  | Cấp trang  | Cấp khối       |
| ---- | ---- | --------- |
| Phạm vi dữ liệu | Toàn bộ trang | Khối hiện tại      |
| Mức độ chi tiết   | Phân tích tổng thể | Xử lý chi tiết      |
| Công dụng điển hình | Phân tích xu hướng | Dịch biểu mẫu, trích xuất trường |

## IV. Các phương pháp hay nhất

### 1. Gợi ý cấu hình

| Mục         | Gợi ý          | Lý do       |
| ---------- | ----------- | -------- |
| Số lượng kỹ năng       | 3–5       | Độ chính xác cao, phản hồi nhanh  |
| Tự động sử dụng (Auto usage) | Cẩn trọng khi bật        | Ngăn ngừa thao tác sai    |
| Độ dài lời nhắc      | 500–1000 ký tự | Cân bằng giữa tốc độ và chất lượng  |
| Mục tiêu nhiệm vụ       | Đơn lẻ và rõ ràng        | Tránh làm AI bối rối |
| Luồng công việc        | Sử dụng sau khi đóng gói các nhiệm vụ phức tạp   | Tỷ lệ thành công cao hơn    |

### 2. Gợi ý thực hành

**Bắt đầu từ nhỏ, tối ưu hóa dần dần:**

1. Đầu tiên, tạo các nhân viên cơ bản (ví dụ: Viz, Dex)
2. Bật 1–2 kỹ năng cốt lõi để kiểm tra
3. Xác nhận rằng nhiệm vụ có thể được thực hiện bình thường
4. Sau đó, dần dần mở rộng thêm kỹ năng và nhiệm vụ

**Quy trình tối ưu hóa liên tục:**

1. Phiên bản ban đầu hoạt động
2. Thu thập phản hồi từ người dùng
3. Tối ưu hóa lời nhắc và cấu hình nhiệm vụ
4. Kiểm tra và lặp lại để cải thiện

## V. Câu hỏi thường gặp

### 1. Giai đoạn cấu hình

**Hỏi: Nếu lưu thất bại thì sao?**
Đ: Kiểm tra xem tất cả các trường bắt buộc đã được điền đầy đủ chưa, đặc biệt là dịch vụ mô hình và lời nhắc.

**Hỏi: Nên chọn mô hình nào?**

* Liên quan đến mã → Claude, GPT-4
* Liên quan đến phân tích → Claude, DeepSeek
* Nhạy cảm về chi phí → Qwen, GLM
* Văn bản dài → Gemini, Claude

### 2. Giai đoạn sử dụng

**Hỏi: AI phản hồi quá chậm?**

* Giảm số lượng kỹ năng
* Tối ưu hóa lời nhắc
* Kiểm tra độ trễ của dịch vụ mô hình
* Có thể cân nhắc đổi mô hình

**Hỏi: Nhiệm vụ thực hiện không chính xác?**

* Lời nhắc chưa đủ rõ ràng
* Quá nhiều kỹ năng gây nhầm lẫn
* Chia nhỏ nhiệm vụ, thêm ví dụ

**Hỏi: Khi nào nên bật Tự động sử dụng (Auto usage)?**

* Có thể bật cho các nhiệm vụ loại truy vấn
* Nên tắt cho các nhiệm vụ loại sửa đổi dữ liệu

**Hỏi: Làm thế nào để AI xử lý một biểu mẫu cụ thể?**

Đ: Nếu là cấu hình cấp trang, bạn cần chọn khối thủ công.

![Chọn khối thủ công](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Nếu là cấu hình nhiệm vụ cấp khối, ngữ cảnh dữ liệu sẽ được tự động liên kết.

## VI. Đọc thêm

Để Nhân viên AI của bạn mạnh mẽ hơn, bạn có thể tiếp tục đọc các tài liệu sau:

**Liên quan đến cấu hình:**

* [Hướng dẫn kỹ thuật nhắc nhở](./prompt-engineering-guide.md) - Các kỹ thuật và phương pháp hay nhất để viết lời nhắc chất lượng cao
* [Cấu hình dịch vụ LLM](/ai-employees/quick-start/llm-service) - Hướng dẫn cấu hình chi tiết cho các dịch vụ mô hình lớn
* [Tạo Nhân viên AI](/ai-employees/quick-start/ai-employees) - Tạo và cấu hình cơ bản cho Nhân viên AI
* [Cộng tác với Nhân viên AI](/ai-employees/quick-start/collaborate) - Cách trò chuyện hiệu quả với Nhân viên AI

**Tính năng nâng cao:**

* [Kỹ năng](/ai-employees/advanced/skill) - Hiểu sâu về cấu hình và cách sử dụng các loại kỹ năng
* [Nhiệm vụ](/ai-employees/advanced/task) - Các kỹ thuật nâng cao để cấu hình nhiệm vụ
* [Chọn khối](/ai-employees/advanced/pick-block) - Cách chỉ định các khối dữ liệu cho Nhân viên AI
* [Nguồn dữ liệu](/ai-employees/advanced/datasource) - Cấu hình và quản lý nguồn dữ liệu
* [Tìm kiếm trên web](/ai-employees/advanced/web-search) - Cấu hình khả năng tìm kiếm trên web cho Nhân viên AI

**Cơ sở tri thức và RAG:**

* [Tổng quan về cơ sở tri thức AI](/ai-employees/knowledge-base/index) - Giới thiệu tính năng cơ sở tri thức
* [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database) - Cấu hình cơ sở dữ liệu vector
* [Cơ sở tri thức](/ai-employees/knowledge-base/knowledge-base) - Cách tạo và quản lý cơ sở tri thức
* [RAG (Tạo sinh tăng cường truy xuất)](/ai-employees/knowledge-base/rag) - Ứng dụng công nghệ RAG

**Tích hợp luồng công việc:**

* [Nút LLM - Trò chuyện văn bản](/ai-employees/workflow/nodes/llm/chat) - Sử dụng trò chuyện văn bản trong luồng công việc
* [Nút LLM - Trò chuyện đa phương thức](/ai-employees/workflow/nodes/llm/multimodal-chat) - Xử lý đầu vào đa phương thức như hình ảnh, tệp
* [Nút LLM - Đầu ra có cấu trúc](/ai-employees/workflow/nodes/llm/structured-output) - Nhận phản hồi AI có cấu trúc

## Lời kết

Điều quan trọng nhất khi cấu hình Nhân viên AI là: **trước tiên hãy làm cho nó hoạt động, sau đó tối ưu hóa**.
Trước tiên, hãy để nhân viên đầu tiên của bạn bắt đầu công việc thành công, sau đó dần dần mở rộng và tinh chỉnh.

Bạn có thể khắc phục sự cố theo thứ tự sau:

1. Dịch vụ mô hình có được kết nối không?
2. Số lượng kỹ năng có quá nhiều không?
3. Lời nhắc có rõ ràng không?
4. Mục tiêu nhiệm vụ có được xác định rõ ràng không?

Chỉ cần bạn tiến hành từng bước, bạn có thể xây dựng một đội ngũ AI thực sự hiệu quả.