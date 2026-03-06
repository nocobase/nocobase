:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/ai-employees/configuration/admin-configuration).
:::

# Nhân viên AI · Hướng dẫn cấu hình quản trị viên

> Tài liệu này giúp bạn nhanh chóng hiểu cách cấu hình và quản lý nhân viên AI, dẫn dắt bạn từng bước qua toàn bộ quy trình từ dịch vụ mô hình đến khi nhận việc.


## I. Trước khi bắt đầu

### 1. Yêu cầu hệ thống

Trước khi cấu hình, vui lòng đảm bảo môi trường của bạn đáp ứng các điều kiện sau:

* Đã cài đặt **NocoBase 2.0 hoặc cao hơn**
* Đã bật **plugin Nhân viên AI**
* Có ít nhất một **dịch vụ mô hình ngôn ngữ lớn (LLM)** khả dụng (như OpenAI, Claude, DeepSeek, GLM, v.v.)


### 2. Tìm hiểu thiết kế hai lớp của nhân viên AI

Nhân viên AI được chia thành hai lớp: **"Định nghĩa vai trò"** và **"Tùy chỉnh nhiệm vụ"**.

| Cấp độ | Mô tả | Đặc điểm | Tác dụng |
| -------- | ------------ | ---------- | ------- |
| **Định nghĩa vai trò** | Nhân cách cơ bản và năng lực cốt lõi của nhân viên | Ổn định không đổi, giống như "sơ yếu lý lịch" | Đảm bảo tính nhất quán của vai trò |
| **Tùy chỉnh nhiệm vụ** | Cấu hình cho các kịch bản nghiệp vụ khác nhau | Điều chỉnh linh hoạt | Thích ứng với nhiệm vụ cụ thể |

**Hiểu một cách đơn giản:**

> "Định nghĩa vai trò" quyết định nhân viên này là ai,
> "Tùy chỉnh nhiệm vụ" quyết định họ phải làm gì ở hiện tại.

Lợi ích của thiết kế này là:

* Vai trò không đổi, nhưng có thể đảm nhiệm các kịch bản khác nhau
* Nâng cấp hoặc thay thế nhiệm vụ không ảnh hưởng đến bản thân nhân viên
* Bối cảnh và nhiệm vụ độc lập với nhau, bảo trì dễ dàng hơn


## II. Quy trình cấu hình (5 bước để hoàn tất)

### Bước 1: Cấu hình dịch vụ mô hình

Dịch vụ mô hình tương đương với bộ não của nhân viên AI, phải được thiết lập trước.

> 💡 Hướng dẫn cấu hình chi tiết vui lòng tham khảo: [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service)

**Đường dẫn:**
`Cài đặt hệ thống → Nhân viên AI → LLM service`

![Vào trang cấu hình](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Nhấp vào **Thêm**, điền các thông tin sau:

| Mục | Mô tả | Lưu ý |
| ------ | -------------------------- | --------- |
| Provider | Như OpenAI, Claude, Gemini, Kimi, v.v. | Tương thích với các dịch vụ cùng tiêu chuẩn |
| API Key | Khóa do nhà cung cấp dịch vụ cung cấp | Bảo mật và thay đổi định kỳ |
| Base URL | API Endpoint (tùy chọn) | Cần sửa đổi khi sử dụng proxy |
| Enabled Models | Mô hình đề xuất / Chọn mô hình / Nhập mô hình thủ công | Quyết định phạm vi mô hình có thể chuyển đổi trong hội thoại |

![Tạo dịch vụ mô hình lớn](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Sau khi cấu hình, vui lòng sử dụng `Test flight` để **kiểm tra kết nối**.
Nếu thất bại, vui lòng kiểm tra mạng, khóa hoặc tên mô hình.

![Kiểm tra kết nối](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Bước 2: Tạo nhân viên AI

> 💡 Hướng dẫn chi tiết vui lòng tham khảo: [Tạo nhân viên AI](/ai-employees/features/new-ai-employees)

Đường dẫn: `Quản lý nhân viên AI → Tạo nhân viên`

Điền thông tin cơ bản:

| Trường | Bắt buộc | Ví dụ |
| ----- | -- | -------------- |
| Tên | ✓ | viz, dex, cole |
| Biệt danh | ✓ | Viz, Dex, Cole |
| Trạng thái kích hoạt | ✓ | Bật |
| Giới thiệu | - | "Chuyên gia phân tích dữ liệu" |
| Lời nhắc chính | ✓ | Xem hướng dẫn kỹ thuật nhắc nhở |
| Lời chào | - | "Xin chào, tôi là Viz…" |

![Cấu hình thông tin cơ bản](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Giai đoạn tạo nhân viên chủ yếu hoàn thành cấu hình vai trò và kỹ năng. Mô hình sử dụng thực tế có thể được chọn thông qua `Model Switcher` trong hội thoại.

**Gợi ý viết lời nhắc:**

* Nói rõ vai trò, giọng điệu và trách nhiệm của nhân viên
* Sử dụng các từ "phải", "tuyệt đối không" để nhấn mạnh quy tắc
* Cố gắng bao gồm các ví dụ, tránh mô tả trừu tượng
* Kiểm soát trong khoảng 500–1000 ký tự

> Lời nhắc càng rõ ràng, biểu hiện của AI càng ổn định.
> Có thể tham khảo [Hướng dẫn kỹ thuật nhắc nhở](./prompt-engineering-guide.md).


### Bước 3: Cấu hình kỹ năng

Kỹ năng quyết định nhân viên có thể "làm gì".

> 💡 Hướng dẫn chi tiết vui lòng tham khảo: [Kỹ năng](/ai-employees/features/tool)

| Loại | Phạm vi năng lực | Ví dụ | Mức độ rủi ro |
| ---- | ------- | --------- | ------ |
| Giao diện | Tương tác trang | Đọc dữ liệu khối, điền biểu mẫu | Thấp |
| Mô hình dữ liệu | Truy vấn và phân tích dữ liệu | Thống kê tổng hợp | Trung bình |
| Luồng công việc | Thực hiện quy trình nghiệp vụ | Công cụ tùy chỉnh | Tùy thuộc vào luồng công việc |
| Khác | Mở rộng bên ngoài | Tìm kiếm mạng, thao tác tệp | Tùy tình huống |

**Gợi ý cấu hình:**

* Mỗi nhân viên có 3–5 kỹ năng là phù hợp nhất
* Không nên chọn tất cả, dễ gây hỗn loạn
* Các thao tác quan trọng nên sử dụng quyền `Ask`, thay vì `Allow`

![Cấu hình kỹ năng](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Bước 4: Cấu hình cơ sở tri thức (Tùy chọn)

Nếu nhân viên AI của bạn cần ghi nhớ hoặc tham chiếu lượng lớn tài liệu, như hướng dẫn sản phẩm, FAQ, v.v., bạn có thể cấu hình cơ sở tri thức.

> 💡 Hướng dẫn chi tiết vui lòng tham khảo:
> - [Tổng quan cơ sở tri thức AI](/ai-employees/knowledge-base/index)
> - [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database)
> - [Cấu hình cơ sở tri thức](/ai-employees/knowledge-base/knowledge-base)
> - [RAG Tạo sinh tăng cường truy xuất](/ai-employees/knowledge-base/rag)

Việc này yêu cầu cài đặt thêm plugin cơ sở dữ liệu vector.

![Cấu hình cơ sở tri thức](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Kịch bản áp dụng:**

* Để AI hiểu kiến thức doanh nghiệp
* Hỗ trợ hỏi đáp và truy xuất tài liệu
* Đào tạo trợ lý chuyên biệt cho lĩnh vực


### Bước 5: Xác minh hiệu quả

Sau khi hoàn tất, bạn sẽ thấy ảnh đại diện của nhân viên mới ở góc dưới bên phải trang.

![Xác minh cấu hình](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Vui lòng kiểm tra từng mục:

* ✅ Biểu tượng hiển thị bình thường không
* ✅ Có thể thực hiện đối thoại cơ bản không
* ✅ Kỹ năng có thể được gọi chính xác không

Nếu tất cả đều thông qua, nghĩa là cấu hình thành công 🎉


## III. Cấu hình nhiệm vụ: Để AI thực sự nhận việc

Phần trước đã hoàn thành việc "tạo nhân viên",
Tiếp theo là để họ "đi làm việc".

Nhiệm vụ AI định nghĩa hành vi của nhân viên trong một trang hoặc khối cụ thể.

> 💡 Hướng dẫn chi tiết vui lòng tham khảo: [Nhiệm vụ](/ai-employees/features/task)


### 1. Nhiệm vụ cấp trang

Áp dụng cho phạm vi toàn bộ trang, ví dụ như "phân tích dữ liệu trang này".

**Lối vào cấu hình:**
`Cài đặt trang → Nhân viên AI → Thêm nhiệm vụ`

| Trường | Mô tả | Ví dụ |
| ---- | -------- | --------- |
| Tiêu đề | Tên nhiệm vụ | Phân tích chuyển đổi giai đoạn |
| Bối cảnh | Ngữ cảnh của trang hiện tại | Trang danh sách Leads |
| Tin nhắn mặc định | Đối thoại thiết lập sẵn | "Vui lòng phân tích xu hướng tháng này" |
| Khối mặc định | Tự động liên kết bộ sưu tập | bảng leads |
| Kỹ năng | Công cụ khả dụng | Truy vấn dữ liệu, tạo biểu đồ |

![Cấu hình nhiệm vụ cấp trang](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Hỗ trợ đa nhiệm vụ:**
Cùng một nhân viên AI có thể cấu hình nhiều nhiệm vụ, hiển thị dưới dạng tùy chọn cho người dùng:

![Hỗ trợ đa nhiệm vụ](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Gợi ý:

* Một nhiệm vụ tập trung vào một mục tiêu
* Tên rõ ràng dễ hiểu
* Số lượng nhiệm vụ kiểm soát trong khoảng 5–7


### 2. Nhiệm vụ cấp khối

Phù hợp để thao tác trên một khối cụ thể, như "dịch biểu mẫu hiện tại".

**Cách cấu hình:**

1. Mở cấu hình thao tác khối
2. Thêm "Nhân viên AI"

![Nút thêm nhân viên AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Liên kết với nhân viên mục tiêu là xong

![Chọn nhân viên AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Cấu hình nhiệm vụ cấp khối](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Mục so sánh | Cấp trang | Cấp khối |
| ---- | ---- | --------- |
| Phạm vi dữ liệu | Toàn bộ trang | Khối hiện tại |
| Độ chi tiết | Phân tích tổng thể | Xử lý chi tiết |
| Công dụng điển hình | Phân tích xu hướng | Dịch biểu mẫu, trích xuất trường |


## IV. Thực tiễn tốt nhất

### 1. Gợi ý cấu hình

| Mục | Gợi ý | Lý do |
| ---------- | ----------- | -------- |
| Số lượng kỹ năng | 3–5 cái | Độ chính xác cao, phản hồi nhanh |
| Chế độ quyền (Ask / Allow) | Sửa đổi dữ liệu nên dùng Ask | Ngăn chặn thao tác sai |
| Độ dài lời nhắc | 500–1000 ký tự | Đảm bảo cả tốc độ và chất lượng |
| Mục tiêu nhiệm vụ | Đơn nhất và rõ ràng | Tránh làm AI bối rối |
| Luồng công việc | Sử dụng sau khi đóng gói nhiệm vụ phức tạp | Tỷ lệ thành công cao hơn |


### 2. Gợi ý thực chiến

**Từ nhỏ đến lớn, tối ưu hóa dần dần:**

1. Trước tiên tạo nhân viên cơ bản (như Viz, Dex)
2. Bật 1–2 kỹ năng cốt lõi để kiểm tra
3. Xác nhận có thể thực hiện nhiệm vụ bình thường
4. Sau đó dần dần mở rộng thêm kỹ năng và nhiệm vụ

**Quy trình tối ưu hóa liên tục:**

1. Bản đầu tiên có thể chạy được
2. Thu thập phản hồi sử dụng
3. Tối ưu hóa lời nhắc và cấu hình nhiệm vụ
4. Kiểm tra và cải tiến vòng lặp


## V. Giải đáp thắc mắc thường gặp

### 1. Giai đoạn cấu hình

**Q: Lưu thất bại phải làm sao?**
A: Kiểm tra xem đã điền đầy đủ các mục bắt buộc chưa, đặc biệt là dịch vụ mô hình và lời nhắc.

**Q: Nên chọn mô hình nào?**

* Loại mã nguồn → Claude, GPT-4
* Loại phân tích → Claude, DeepSeek
* Nhạy cảm về chi phí → Qwen, GLM
* Văn bản dài → Gemini, Claude


### 2. Giai đoạn sử dụng

**Q: AI phản hồi quá chậm?**

* Giảm số lượng kỹ năng
* Tối ưu hóa lời nhắc
* Kiểm tra độ trễ dịch vụ mô hình
* Có thể cân nhắc đổi mô hình

**Q: Thực hiện nhiệm vụ không chuẩn?**

* Lời nhắc chưa đủ rõ ràng
* Quá nhiều kỹ năng dẫn đến hỗn loạn
* Chia nhỏ nhiệm vụ, thêm ví dụ

**Q: Khi nào chọn Ask / Allow?**

* Nhiệm vụ loại truy vấn có thể dùng `Allow`
* Nhiệm vụ loại sửa đổi dữ liệu nên dùng `Ask`

**Q: Làm thế nào để AI xử lý biểu mẫu cụ thể?**

A: Nếu là cấu hình cấp trang, cần chọn khối thủ công.

![Chọn khối thủ công](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Nếu là cấu hình nhiệm vụ cấp khối, ngữ cảnh dữ liệu sẽ tự động được liên kết.


## VI. Đọc thêm

Muốn nhân viên AI mạnh mẽ hơn, có thể tiếp tục đọc các tài liệu sau:

**Liên quan đến cấu hình:**

* [Hướng dẫn kỹ thuật nhắc nhở](./prompt-engineering-guide.md) - Kỹ thuật và thực tiễn tốt nhất để viết lời nhắc chất lượng cao
* [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service) - Thuyết minh chi tiết cấu hình dịch vụ mô hình lớn
* [Tạo nhân viên AI](/ai-employees/features/new-ai-employees) - Tạo và cấu hình cơ bản nhân viên AI
* [Cộng tác với nhân viên AI](/ai-employees/features/collaborate) - Cách đối thoại hiệu quả với nhân viên AI

**Tính năng nâng cao:**

* [Kỹ năng](/ai-employees/features/tool) - Tìm hiểu sâu về cấu hình và sử dụng các loại kỹ năng
* [Nhiệm vụ](/ai-employees/features/task) - Kỹ thuật nâng cao trong cấu hình nhiệm vụ
* [Chọn khối](/ai-employees/features/pick-block) - Cách chỉ định khối dữ liệu cho nhân viên AI
* Nguồn dữ liệu - Vui lòng tham khảo tài liệu cấu hình nguồn dữ liệu của plugin tương ứng
* [Tìm kiếm mạng](/ai-employees/features/web-search) - Cấu hình khả năng tìm kiếm mạng cho nhân viên AI

**Cơ sở tri thức và RAG:**

* [Tổng quan cơ sở tri thức AI](/ai-employees/knowledge-base/index) - Giới thiệu tính năng cơ sở tri thức
* [Cơ sở dữ liệu vector](/ai-employees/knowledge-base/vector-database) - Cấu hình cơ sở dữ liệu vector
* [Cơ sở tri thức](/ai-employees/knowledge-base/knowledge-base) - Cách tạo và quản lý cơ sở tri thức
* [RAG Tạo sinh tăng cường truy xuất](/ai-employees/knowledge-base/rag) - Ứng dụng công nghệ RAG

**Tích hợp luồng công việc:**

* [Nút LLM - Đối thoại văn bản](/ai-employees/workflow/nodes/llm/chat) - Sử dụng đối thoại văn bản trong luồng công việc
* [Nút LLM - Đối thoại đa phương thức](/ai-employees/workflow/nodes/llm/multimodal-chat) - Xử lý đầu vào đa phương thức như hình ảnh, tệp tin
* [Nút LLM - Đầu ra có cấu trúc](/ai-employees/workflow/nodes/llm/structured-output) - Nhận phản hồi AI có cấu trúc


## Kết luận

Điều quan trọng nhất khi cấu hình nhân viên AI là: **Chạy thông trước, tối ưu sau**.
Hãy để nhân viên đầu tiên nhận việc thành công, sau đó mới dần dần mở rộng và tinh chỉnh.

Hướng khắc phục sự cố có thể theo thứ tự sau:

1. Dịch vụ mô hình có kết nối không
2. Số lượng kỹ năng có quá nhiều không
3. Lời nhắc có rõ ràng không
4. Mục tiêu nhiệm vụ có xác định không

Chỉ cần tiến hành từng bước, bạn sẽ xây dựng được một đội ngũ AI thực sự hiệu quả.