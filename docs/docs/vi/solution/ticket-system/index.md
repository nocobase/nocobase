:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/solution/ticket-system/index).
:::

# Giới thiệu giải pháp Hệ thống hỗ trợ (Ticketing)

> **Lưu ý**: Phiên bản hiện tại là bản xem trước sớm (early preview), các tính năng vẫn đang được hoàn thiện và chúng tôi đang liên tục cải tiến. Mọi phản hồi và góp ý đều được hoan nghênh!

## 1. Bối cảnh (Why)

### Các vấn đề về ngành nghề / vị trí / quản lý cần giải quyết

Doanh nghiệp trong quá trình vận hành hàng ngày phải đối mặt với nhiều loại yêu cầu dịch vụ: sửa chữa thiết bị, hỗ trợ IT, khiếu nại khách hàng, tư vấn đề xuất, v.v. Những yêu cầu này đến từ nhiều nguồn phân tán (hệ thống CRM, kỹ sư hiện trường, email, biểu mẫu công khai, v.v.), có quy trình xử lý khác nhau và thiếu cơ chế theo dõi, quản lý thống nhất.

**Ví dụ về các kịch bản nghiệp vụ điển hình:**

- **Sửa chữa thiết bị**: Đội ngũ hậu mãi xử lý yêu cầu bảo trì thiết bị, cần ghi lại các thông tin đặc thù như số sê-ri thiết bị, mã lỗi, linh kiện thay thế.
- **Hỗ trợ IT**: Bộ phận IT xử lý các yêu cầu của nhân viên nội bộ như đặt lại mật khẩu, cài đặt phần mềm, lỗi mạng.
- **Khiếu nại khách hàng**: Đội ngũ chăm sóc khách hàng xử lý khiếu nại từ nhiều kênh, một số khách hàng đang bức xúc cần được ưu tiên xử lý trước.
- **Khách hàng tự phục vụ**: Khách hàng cuối mong muốn có thể gửi yêu cầu dịch vụ một cách thuận tiện và theo dõi được tiến độ xử lý.

### Chân dung người dùng mục tiêu

| Khía cạnh | Mô tả |
|-----------|-------|
| Quy mô doanh nghiệp | Doanh nghiệp vừa và nhỏ đến doanh nghiệp lớn, có lượng nhu cầu dịch vụ khách hàng nhất định |
| Cơ cấu vai trò | Đội ngũ chăm sóc khách hàng, hỗ trợ IT, đội ngũ hậu mãi, nhân viên quản lý vận hành |
| Mức độ trưởng thành số | Từ sơ cấp đến trung cấp, đang tìm cách nâng cấp từ quản lý bằng Excel/Email lên quản lý hệ thống hóa |

### Nỗi đau của các giải pháp phổ biến hiện nay

- **Chi phí cao / Tùy chỉnh chậm**: Các hệ thống ticketing SaaS có giá thành cao, chu kỳ phát triển tùy biến dài.
- **Hệ thống rời rạc, ốc đảo dữ liệu**: Các loại dữ liệu nghiệp vụ phân tán ở các hệ thống khác nhau, khó phân tích và đưa ra quyết định thống nhất.
- **Nghiệp vụ thay đổi nhanh, hệ thống khó thích ứng**: Khi nhu cầu nghiệp vụ thay đổi, hệ thống khó có thể điều chỉnh nhanh chóng.
- **Phản hồi dịch vụ chậm**: Yêu cầu luân chuyển giữa các hệ thống khác nhau dẫn đến việc phân phối không kịp thời.
- **Quy trình không minh bạch**: Khách hàng không thể theo dõi tiến độ ticket, việc hỏi thăm thường xuyên làm tăng áp lực cho nhân viên hỗ trợ.
- **Khó đảm bảo chất lượng**: Thiếu giám sát SLA, các trường hợp quá hạn hoặc đánh giá kém không được cảnh báo kịp thời.

---

## 2. Đối chiếu sản phẩm và giải pháp (Benchmark)

### Các sản phẩm phổ biến trên thị trường

- **SaaS**: Như Salesforce, Zendesk, Odoo, v.v.
- **Hệ thống tùy chỉnh / Hệ thống nội bộ**

### Các tiêu chí đối chiếu

- Độ phủ tính năng
- Tính linh hoạt
- Khả năng mở rộng
- Cách thức sử dụng AI

### Điểm khác biệt của giải pháp NocoBase

**Ưu thế cấp nền tảng:**

- **Ưu tiên cấu hình**: Từ bảng dữ liệu tầng dưới đến loại hình nghiệp vụ, SLA, định tuyến kỹ năng, v.v., đều được quản lý thông qua cấu hình.
- **Xây dựng nhanh bằng low-code**: Nhanh hơn tự phát triển, linh hoạt hơn SaaS.

**Những điều hệ thống truyền thống không làm được hoặc chi phí cực cao:**

- **Tích hợp AI nguyên bản**: Nhờ vào các plugin AI của NocoBase, thực hiện phân loại thông minh, hỗ trợ điền biểu mẫu, đề xuất kiến thức.
- **Mọi thiết kế đều có thể được người dùng sao chép**: Người dùng có thể tự mở rộng dựa trên các mẫu có sẵn.
- **Kiến trúc dữ liệu hình chữ T**: Bảng chính + Bảng phụ nghiệp vụ, khi thêm loại nghiệp vụ mới chỉ cần thêm bảng phụ.

---

## 3. Nguyên tắc thiết kế (Principles)

- **Chi phí nhận thức thấp**
- **Nghiệp vụ đi trước công nghệ**
- **Có thể tiến hóa, không phải hoàn thiện một lần duy nhất**
- **Cấu hình ưu tiên, mã nguồn dự phòng**
- **Con người và AI cộng tác, không phải AI thay thế con người**
- **Mọi thiết kế đều phải có khả năng được người dùng sao chép**

---

## 4. Tổng quan giải pháp (Solution Overview)

### Giới thiệu tổng quát

Trung tâm điều phối ticket đa năng được xây dựng trên nền tảng low-code NocoBase, giúp đạt được:

- **Cổng vào thống nhất**: Tiếp nhận đa nguồn, xử lý chuẩn hóa.
- **Phân phối thông minh**: AI hỗ trợ phân loại, phân phối cân bằng tải.
- **Nghiệp vụ đa hình**: Bảng chính cốt lõi + Bảng phụ nghiệp vụ, mở rộng linh hoạt.
- **Phản hồi khép kín**: Giám sát SLA, đánh giá của khách hàng, xử lý khép kín các đánh giá kém.

### Quy trình xử lý ticket

```
Tiếp nhận đa nguồn → Tiền xử lý/Phân tích AI → Phân phối thông minh → Thực thi thủ công → Vòng lặp phản hồi
        ↓                    ↓                        ↓                    ↓                  ↓
 Kiểm tra trùng lặp     Nhận diện ý định         Khớp kỹ năng         Luân chuyển trạng thái  Đánh giá hài lòng
                        Phân tích cảm xúc        Cân bằng tải         Giám sát SLA            Theo dõi đánh giá kém
                        Tự động phản hồi         Quản lý hàng đợi     Trao đổi bình luận      Lưu trữ dữ liệu
```

### Danh sách các mô-đun cốt lõi

| Mô-đun | Mô tả |
|--------|-------|
| Tiếp nhận ticket | Biểu mẫu công khai, cổng thông tin khách hàng, nhân viên nhập thay, API/Webhook, phân tích email |
| Quản lý ticket | CRUD ticket, luân chuyển trạng thái, phân phối/chuyển giao, trao đổi bình luận, nhật ký thao tác |
| Mở rộng nghiệp vụ | Các bảng phụ nghiệp vụ như sửa chữa thiết bị, hỗ trợ IT, khiếu nại khách hàng, v.v. |
| Quản lý SLA | Cấu hình SLA, cảnh báo quá hạn, nâng cấp xử lý khi quá hạn |
| Quản lý khách hàng | Bảng chính khách hàng, quản lý người liên hệ, cổng thông tin khách hàng |
| Hệ thống đánh giá | Chấm điểm đa chiều, nhãn nhanh, NPS, cảnh báo đánh giá kém |
| Hỗ trợ AI | Phân loại ý định, phân tích cảm xúc, đề xuất kiến thức, hỗ trợ phản hồi, trau chuốt văn phong |

### Hiển thị giao diện cốt lõi

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Nhân viên AI (AI Employee)

### Các loại hình và kịch bản AI Employee

- **Trợ lý chăm sóc khách hàng**, **Trợ lý bán hàng**, **Nhân viên phân tích dữ liệu**, **Nhân viên kiểm duyệt**
- Hỗ trợ con người, không phải thay thế con người

### Định lượng giá trị của AI Employee

Trong giải pháp này, AI Employee có thể:

| Khía cạnh giá trị | Hiệu quả cụ thể |
|-------------------|-----------------|
| Nâng cao hiệu suất | Tự động phân loại giảm hơn 50% thời gian phân loại thủ công; đề xuất kiến thức giúp giải quyết vấn đề nhanh hơn |
| Giảm chi phí | Tự động trả lời các câu hỏi đơn giản, giảm khối lượng công việc cho nhân viên hỗ trợ |
| Tiếp thêm năng lực | Cảnh báo cảm xúc giúp nhân viên chuẩn bị trước; trau chuốt phản hồi nâng cao chất lượng giao tiếp |
| Tăng sự hài lòng | Phản hồi nhanh hơn, phân phối chính xác hơn, trả lời chuyên nghiệp hơn |

---

## 6. Điểm nổi bật (Highlights)

### 1. Kiến trúc dữ liệu hình chữ T

- Tất cả ticket dùng chung bảng chính, thống nhất logic luân chuyển.
- Bảng phụ nghiệp vụ chứa các trường đặc thù, mở rộng linh hoạt.
- Thêm loại nghiệp vụ mới chỉ cần thêm bảng phụ, không ảnh hưởng đến quy trình chính.

### 2. Vòng đời ticket hoàn chỉnh

- Tạo mới → Phân phối → Xử lý → Tạm dừng → Giải quyết → Đóng.
- Hỗ trợ các kịch bản phức tạp như chuyển giao, trả lại, mở lại.
- Tính toán thời gian SLA chính xác đến từng lần tạm dừng.

### 3. Tiếp nhận thống nhất đa kênh

- Biểu mẫu công khai, cổng thông tin khách hàng, API, email, nhân viên nhập thay.
- Kiểm tra tính lũy đẳng (idempotency) để ngăn chặn tạo trùng lặp.

### 4. Tích hợp AI nguyên bản

- Không chỉ là "thêm một nút AI", mà là lồng ghép vào từng khâu.
- Nhận diện ý định, phân tích cảm xúc, đề xuất kiến thức, trau chuốt phản hồi.

---

## 7. Lộ trình phát triển (Roadmap - Cập nhật liên tục)

- **Nhúng hệ thống**: Hỗ trợ nhúng mô-đun ticket vào các hệ thống nghiệp vụ khác nhau như ERP, CRM.
- **Liên kết ticket**: Tiếp nhận ticket và gọi lại trạng thái (callback) giữa các hệ thống thượng nguồn và hạ nguồn, thực hiện cộng tác ticket xuyên hệ thống.
- **Tự động hóa AI**: AI Employee được nhúng vào luồng công việc, hỗ trợ chạy tự động ở chế độ nền, thực hiện xử lý không cần người trực.
- **Hỗ trợ đa khách thuê (Multi-tenancy)**: Mở rộng theo chiều ngang thông qua đa không gian/đa ứng dụng, có thể phân phối cho các đội ngũ hỗ trợ khác nhau vận hành độc lập.
- **Cơ sở tri thức RAG**: Tự động vector hóa toàn bộ dữ liệu về ticket, khách hàng, sản phẩm, v.v., để thực hiện truy xuất thông minh và đề xuất kiến thức.
- **Hỗ trợ đa ngôn ngữ**: Giao diện và nội dung hỗ trợ chuyển đổi đa ngôn ngữ, đáp ứng nhu cầu cộng tác của đội ngũ đa quốc gia/khu vực.