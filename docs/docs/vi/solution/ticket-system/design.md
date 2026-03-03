:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/solution/ticket-system/design).
:::

# Thiết kế chi tiết giải pháp công đơn (Ticket)

> **Phiên bản**: v2.0-beta

> **Ngày cập nhật**: 05-01-2026

> **Trạng thái**: Bản xem trước

## 1. Tổng quan hệ thống và Triết lý thiết kế

### 1.1 Định vị hệ thống

Hệ thống này là một **nền tảng quản lý công đơn thông minh được hỗ trợ bởi AI**, được xây dựng trên nền tảng mã thấp (low-code) NocoBase. Mục tiêu cốt lõi là:

```
Giúp nhân viên hỗ trợ tập trung vào việc giải quyết vấn đề, thay vì các thao tác quy trình rườm rà
```

### 1.2 Triết lý thiết kế

#### Triết lý 1: Kiến trúc dữ liệu hình chữ T

**Kiến trúc hình chữ T là gì?**

Mô hình này mượn ý tưởng từ khái niệm "nhân tài hình chữ T" — Chiều ngang rộng + Chiều dọc sâu:

- **Chiều ngang (Bảng chính)**: Bao quát các năng lực chung cho tất cả các loại nghiệp vụ — các trường cốt lõi như mã số, trạng thái, người xử lý, SLA, v.v.
- **Chiều dọc (Bảng mở rộng)**: Các trường chuyên biệt đi sâu vào từng nghiệp vụ cụ thể — sửa chữa thiết bị có số sê-ri, khiếu nại có phương án bồi thường.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**Tại sao lại thiết kế như vậy?**

| Phương án truyền thống | Kiến trúc hình chữ T |
|----------|---------|
| Mỗi loại nghiệp vụ một bảng, các trường bị lặp lại | Quản lý thống nhất các trường chung, mở rộng trường nghiệp vụ theo nhu cầu |
| Báo cáo thống kê cần hợp nhất nhiều bảng | Một bảng chính có thể thống kê trực tiếp tất cả công đơn |
| Thay đổi quy trình phải sửa nhiều nơi | Quy trình cốt lõi chỉ cần sửa một nơi |
| Thêm loại nghiệp vụ mới phải tạo bảng mới | Chỉ cần thêm bảng mở rộng, quy trình chính không đổi |

#### Triết lý 2: Đội ngũ nhân viên AI

Không chỉ là "tính năng AI", mà là "nhân viên AI". Mỗi AI có vai trò, tính cách và trách nhiệm rõ ràng:

| Nhân viên AI | Vị trí | Trách nhiệm cốt lõi | Kịch bản kích hoạt |
|--------|------|----------|----------|
| **Sam** | Trưởng bộ phận hỗ trợ | Phân luồng công đơn, đánh giá mức độ ưu tiên, quyết định nâng cấp | Tự động khi tạo công đơn |
| **Grace** | Chuyên gia thành công khách hàng | Tạo câu trả lời, điều chỉnh giọng điệu, xử lý khiếu nại | Khi nhân viên nhấn "AI phản hồi" |
| **Max** | Trợ lý kiến thức | Tìm kiếm trường hợp tương tự, đề xuất kiến thức, tổng hợp giải pháp | Tự động tại trang chi tiết công đơn |
| **Lexi** | Thông dịch viên | Dịch đa ngôn ngữ, dịch bình luận | Tự động khi phát hiện ngôn ngữ nước ngoài |

**Tại sao sử dụng mô hình "Nhân viên AI"?**

- **Trách nhiệm rõ ràng**: Sam quản lý phân luồng, Grace quản lý phản hồi, không bị chồng chéo.
- **Dễ hiểu**: Nói với người dùng "Để Sam phân tích một chút" sẽ thân thiện hơn là "Gọi API phân loại".
- **Có khả năng mở rộng**: Thêm năng lực AI mới tương đương với việc tuyển dụng nhân viên mới.

#### Triết lý 3: Tự tuần hoàn kiến thức

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Điều này tạo thành một vòng lặp khép kín giữa **Tích lũy kiến thức - Ứng dụng kiến thức**.

---

## 2. Thực thể cốt lõi và Mô hình dữ liệu

### 2.1 Tổng quan quan hệ thực thể

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Chi tiết các bảng cốt lõi

#### 2.2.1 Bảng chính công đơn (nb_tts_tickets)

Đây là hạt nhân của hệ thống, sử dụng thiết kế "bảng rộng", đưa tất cả các trường thường dùng vào bảng chính.

**Thông tin cơ bản**

| Trường | Kiểu dữ liệu | Mô tả | Ví dụ |
|------|------|------|------|
| id | BIGINT | Khóa chính | 1001 |
| ticket_no | VARCHAR | Mã công đơn | TKT-20251229-0001 |
| title | VARCHAR | Tiêu đề | Kết nối mạng chậm |
| description | TEXT | Mô tả vấn đề | Từ sáng nay mạng văn phòng... |
| biz_type | VARCHAR | Loại nghiệp vụ | it_support |
| priority | VARCHAR | Mức độ ưu tiên | P1 |
| status | VARCHAR | Trạng thái | processing |

**Truy xuất nguồn gốc**

| Trường | Kiểu dữ liệu | Mô tả | Ví dụ |
|------|------|------|------|
| source_system | VARCHAR | Hệ thống nguồn | crm / email / iot |
| source_channel | VARCHAR | Kênh nguồn | web / phone / wechat |
| external_ref_id | VARCHAR | ID tham chiếu bên ngoài | CRM-2024-0001 |

**Thông tin liên hệ**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| customer_id | BIGINT | ID khách hàng |
| contact_name | VARCHAR | Tên người liên hệ |
| contact_phone | VARCHAR | Số điện thoại liên hệ |
| contact_email | VARCHAR | Email liên hệ |
| contact_company | VARCHAR | Tên công ty |

**Thông tin người xử lý**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| assignee_id | BIGINT | ID người xử lý |
| assignee_department_id | BIGINT | ID bộ phận xử lý |
| transfer_count | INT | Số lần chuyển giao |

**Các mốc thời gian**

| Trường | Kiểu dữ liệu | Mô tả | Thời điểm kích hoạt |
|------|------|------|----------|
| submitted_at | TIMESTAMP | Thời gian gửi | Khi tạo công đơn |
| assigned_at | TIMESTAMP | Thời gian phân bổ | Khi chỉ định người xử lý |
| first_response_at | TIMESTAMP | Thời gian phản hồi đầu tiên | Khi phản hồi khách hàng lần đầu |
| resolved_at | TIMESTAMP | Thời gian giải quyết | Khi trạng thái chuyển sang resolved |
| closed_at | TIMESTAMP | Thời gian đóng | Khi trạng thái chuyển sang closed |

**Liên quan đến SLA**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| sla_config_id | BIGINT | ID cấu hình SLA |
| sla_response_due | TIMESTAMP | Hạn chót phản hồi |
| sla_resolve_due | TIMESTAMP | Hạn chót giải quyết |
| sla_paused_at | TIMESTAMP | Thời gian bắt đầu tạm dừng SLA |
| sla_paused_duration | INT | Tổng thời gian tạm dừng (phút) |
| is_sla_response_breached | BOOLEAN | Phản hồi có vi phạm không |
| is_sla_resolve_breached | BOOLEAN | Giải quyết có vi phạm không |

**Kết quả phân tích AI**

| Trường | Kiểu dữ liệu | Mô tả | Do ai điền |
|------|------|------|----------|
| ai_category_code | VARCHAR | Phân loại do AI nhận diện | Sam |
| ai_sentiment | VARCHAR | Phân tích cảm xúc | Sam |
| ai_urgency | VARCHAR | Mức độ khẩn cấp | Sam |
| ai_keywords | JSONB | Từ khóa | Sam |
| ai_reasoning | TEXT | Quá trình suy luận | Sam |
| ai_suggested_reply | TEXT | Gợi ý phản hồi | Sam/Grace |
| ai_confidence_score | NUMERIC | Điểm tin cậy | Sam |
| ai_analysis | JSONB | Kết quả phân tích đầy đủ | Sam |

**Hỗ trợ đa ngôn ngữ**

| Trường | Kiểu dữ liệu | Mô tả | Do ai điền |
|------|------|------|----------|
| source_language_code | VARCHAR | Ngôn ngữ gốc | Sam/Lexi |
| target_language_code | VARCHAR | Ngôn ngữ đích | Mặc định hệ thống EN |
| is_translated | BOOLEAN | Đã dịch chưa | Lexi |
| description_translated | TEXT | Mô tả sau khi dịch | Lexi |

#### 2.2.2 Bảng mở rộng nghiệp vụ

**Sửa chữa thiết bị (nb_tts_biz_repair)**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID công đơn liên kết |
| equipment_model | VARCHAR | Model thiết bị |
| serial_number | VARCHAR | Số sê-ri |
| fault_code | VARCHAR | Mã lỗi |
| spare_parts | JSONB | Danh sách linh kiện thay thế |
| maintenance_type | VARCHAR | Loại bảo trì |

**Hỗ trợ IT (nb_tts_biz_it_support)**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID công đơn liên kết |
| asset_number | VARCHAR | Mã tài sản |
| os_version | VARCHAR | Phiên bản hệ điều hành |
| software_name | VARCHAR | Phần mềm liên quan |
| remote_address | VARCHAR | Địa chỉ từ xa |
| error_code | VARCHAR | Mã lỗi |

**Khiếu nại khách hàng (nb_tts_biz_complaint)**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID công đơn liên kết |
| related_order_no | VARCHAR | Mã đơn hàng liên quan |
| complaint_level | VARCHAR | Cấp độ khiếu nại |
| compensation_amount | DECIMAL | Số tiền bồi thường |
| compensation_type | VARCHAR | Hình thức bồi thường |
| root_cause | TEXT | Nguyên nhân gốc rễ |

#### 2.2.3 Bảng bình luận (nb_tts_ticket_comments)

**Các trường cốt lõi**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| id | BIGINT | Khóa chính |
| ticket_id | BIGINT | ID công đơn |
| parent_id | BIGINT | ID bình luận cha (hỗ trợ dạng cây) |
| content | TEXT | Nội dung bình luận |
| direction | VARCHAR | Hướng: inbound (khách hàng)/outbound (nhân viên) |
| is_internal | BOOLEAN | Có phải ghi chú nội bộ không |
| is_first_response | BOOLEAN | Có phải phản hồi đầu tiên không |

**Các trường kiểm duyệt AI (dùng cho outbound)**

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| source_language_code | VARCHAR | Ngôn ngữ nguồn |
| content_translated | TEXT | Nội dung dịch |
| is_translated | BOOLEAN | Đã dịch chưa |
| is_ai_blocked | BOOLEAN | Có bị AI chặn không |
| ai_block_reason | VARCHAR | Lý do chặn |
| ai_block_detail | TEXT | Giải thích chi tiết |
| ai_quality_score | NUMERIC | Điểm chất lượng |
| ai_suggestions | TEXT | Gợi ý cải thiện |

#### 2.2.4 Bảng đánh giá (nb_tts_ratings)

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID công đơn (duy nhất) |
| overall_rating | INT | Mức độ hài lòng tổng thể (1-5) |
| response_rating | INT | Tốc độ phản hồi (1-5) |
| professionalism_rating | INT | Mức độ chuyên nghiệp (1-5) |
| resolution_rating | INT | Giải quyết vấn đề (1-5) |
| nps_score | INT | Điểm NPS (0-10) |
| tags | JSONB | Nhãn nhanh |
| comment | TEXT | Đánh giá bằng văn bản |

#### 2.2.5 Bảng bài viết kiến thức (nb_tts_qa_articles)

| Trường | Kiểu dữ liệu | Mô tả |
|------|------|------|
| article_no | VARCHAR | Mã bài viết KB-T0001 |
| title | VARCHAR | Tiêu đề |
| content | TEXT | Nội dung (Markdown) |
| summary | TEXT | Tóm tắt |
| category_code | VARCHAR | Mã danh mục |
| keywords | JSONB | Từ khóa |
| source_type | VARCHAR | Nguồn: ticket/faq/manual |
| source_ticket_id | BIGINT | ID công đơn nguồn |
| ai_generated | BOOLEAN | Có phải do AI tạo không |
| ai_quality_score | NUMERIC | Điểm chất lượng |
| status | VARCHAR | Trạng thái: draft/published/archived |
| view_count | INT | Số lượt xem |
| helpful_count | INT | Số lượt đánh giá hữu ích |

### 2.3 Danh sách các bảng dữ liệu

| STT | Tên bảng | Mô tả | Loại bản ghi |
|------|------|------|----------|
| 1 | nb_tts_tickets | Bảng chính công đơn | Dữ liệu nghiệp vụ |
| 2 | nb_tts_biz_repair | Mở rộng sửa chữa thiết bị | Dữ liệu nghiệp vụ |
| 3 | nb_tts_biz_it_support | Mở rộng hỗ trợ IT | Dữ liệu nghiệp vụ |
| 4 | nb_tts_biz_complaint | Mở rộng khiếu nại khách hàng | Dữ liệu nghiệp vụ |
| 5 | nb_tts_customers | Bảng chính khách hàng | Dữ liệu nghiệp vụ |
| 6 | nb_tts_customer_contacts | Người liên hệ khách hàng | Dữ liệu nghiệp vụ |
| 7 | nb_tts_ticket_comments | Bình luận công đơn | Dữ liệu nghiệp vụ |
| 8 | nb_tts_ratings | Đánh giá mức độ hài lòng | Dữ liệu nghiệp vụ |
| 9 | nb_tts_qa_articles | Bài viết kiến thức | Dữ liệu kiến thức |
| 10 | nb_tts_qa_article_relations | Liên kết bài viết | Dữ liệu kiến thức |
| 11 | nb_tts_faqs | Câu hỏi thường gặp | Dữ liệu kiến thức |
| 12 | nb_tts_tickets_categories | Phân loại công đơn | Dữ liệu cấu hình |
| 13 | nb_tts_sla_configs | Cấu hình SLA | Dữ liệu cấu hình |
| 14 | nb_tts_skill_configs | Cấu hình kỹ năng | Dữ liệu cấu hình |
| 15 | nb_tts_business_types | Loại nghiệp vụ | Dữ liệu cấu hình |

---

## 3. Vòng đời công đơn

### 3.1 Định nghĩa trạng thái

| Trạng thái | Tên tiếng Việt | Mô tả | Tính giờ SLA | Màu sắc |
|------|------|------|---------|------|
| new | Mới | Vừa tạo, chờ phân bổ | Bắt đầu | 🔵 Xanh dương |
| assigned | Đã phân bổ | Đã chỉ định người xử lý, chờ tiếp nhận | Tiếp tục | 🔷 Xanh lơ |
| processing | Đang xử lý | Đang trong quá trình giải quyết | Tiếp tục | 🟠 Cam |
| pending | Tạm dừng | Chờ phản hồi từ khách hàng | **Tạm dừng** | ⚫ Xám |
| transferred | Đã chuyển giao | Chuyển cho người khác xử lý | Tiếp tục | 🟣 Tím |
| resolved | Đã giải quyết | Chờ khách hàng xác nhận | Dừng | 🟢 Xanh lá |
| closed | Đã đóng | Công đơn kết thúc | Dừng | ⚫ Xám |
| cancelled | Đã hủy | Công đơn bị hủy | Dừng | ⚫ Xám |

### 3.2 Sơ đồ chuyển đổi trạng thái

**Quy trình chính (Từ trái sang phải)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Quy trình nhánh**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**Máy trạng thái đầy đủ**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Quy tắc chuyển đổi trạng thái quan trọng

| Từ | Đến | Điều kiện kích hoạt | Hành động hệ thống |
|----|----|---------|---------|
| new | assigned | Chỉ định người xử lý | Ghi lại assigned_at |
| assigned | processing | Người xử lý nhấn "Tiếp nhận" | Không |
| processing | pending | Nhấn "Tạm dừng" | Ghi lại sla_paused_at |
| pending | processing | Khách hàng phản hồi / Khôi phục thủ công | Tính toán thời gian tạm dừng, xóa paused_at |
| processing | resolved | Nhấn "Giải quyết" | Ghi lại resolved_at |
| resolved | closed | Khách hàng xác nhận / Quá hạn 3 ngày | Ghi lại closed_at |
| * | cancelled | Hủy công đơn | Không |


---

## 4. Quản lý cấp độ dịch vụ SLA

### 4.1 Cấu hình Mức độ ưu tiên và SLA

| Mức độ ưu tiên | Tên | Thời gian phản hồi | Thời gian giải quyết | Ngưỡng cảnh báo | Kịch bản điển hình |
|--------|------|----------|----------|----------|----------|
| P0 | Khẩn cấp | 15 phút | 2 giờ | 80% | Hệ thống sập, dây chuyền sản xuất dừng |
| P1 | Cao | 1 giờ | 8 giờ | 80% | Lỗi tính năng quan trọng |
| P2 | Trung bình | 4 giờ | 24 giờ | 80% | Vấn đề thông thường |
| P3 | Thấp | 8 giờ | 72 giờ | 80% | Tư vấn, góp ý |

### 4.2 Logic tính toán SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Khi tạo công đơn

```
Hạn chót phản hồi = Thời gian gửi + Thời hạn phản hồi (phút)
Hạn chót giải quyết = Thời gian gửi + Thời hạn giải quyết (phút)
```

#### Khi tạm dừng (pending)

```
Thời gian bắt đầu tạm dừng SLA = Thời gian hiện tại
```

#### Khi khôi phục (từ pending quay lại processing)

```
-- Tính toán thời gian tạm dừng lần này
Thời gian tạm dừng lần này = Thời gian hiện tại - Thời gian bắt đầu tạm dừng SLA

-- Cộng dồn vào tổng thời gian tạm dừng
Tổng thời gian tạm dừng = Tổng thời gian tạm dừng + Thời gian tạm dừng lần này

-- Gia hạn thời gian hạn chót (thời gian tạm dừng không tính vào SLA)
Hạn chót phản hồi = Hạn chót phản hồi + Thời gian tạm dừng lần này
Hạn chót giải quyết = Hạn chót giải quyết + Thời gian tạm dừng lần này

-- Xóa thời gian bắt đầu tạm dừng
Thời gian bắt đầu tạm dừng SLA = Trống
```

#### Xác định vi phạm SLA

```
-- Xác định vi phạm phản hồi
Phản hồi có vi phạm = (Thời gian phản hồi đầu tiên trống VÀ Thời gian hiện tại > Hạn chót phản hồi)
                    HOẶC (Thời gian phản hồi đầu tiên > Hạn chót phản hồi)

-- Xác định vi phạm giải quyết
Giải quyết có vi phạm = (Thời gian giải quyết trống VÀ Thời gian hiện tại > Hạn chót giải quyết)
                    HOẶC (Thời gian giải quyết > Hạn chót giải quyết)
```

### 4.3 Cơ chế cảnh báo SLA

| Cấp độ cảnh báo | Điều kiện | Đối tượng thông báo | Phương thức |
|----------|------|----------|----------|
| Cảnh báo vàng | Thời gian còn lại < 20% | Người xử lý | Thông báo nội bộ |
| Cảnh báo đỏ | Đã quá hạn | Người xử lý + Quản lý | Thông báo nội bộ + Email |
| Cảnh báo nâng cấp | Quá hạn 1 giờ | Trưởng bộ phận | Email + SMS |

### 4.4 Chỉ số bảng điều khiển SLA

| Chỉ số | Công thức tính | Ngưỡng an toàn |
|------|----------|----------|
| Tỷ lệ đạt chuẩn phản hồi | Số công đơn không vi phạm / Tổng số công đơn | > 95% |
| Tỷ lệ đạt chuẩn giải quyết | Số công đơn giải quyết không vi phạm / Số công đơn đã giải quyết | > 90% |
| Thời gian phản hồi trung bình | TỔNG(Thời gian phản hồi) / Số công đơn | < 50% mức SLA |
| Thời gian giải quyết trung bình | TỔNG(Thời gian giải quyết) / Số công đơn | < 80% mức SLA |

---

## 5. Năng lực AI và Hệ thống nhân viên

### 5.1 Đội ngũ nhân viên AI

Hệ thống cấu hình 8 nhân viên AI, chia thành hai loại:

**Nhân viên mới (Chuyên dụng cho hệ thống công đơn)**

| ID | Tên | Vị trí | Năng lực cốt lõi |
|----|------|------|----------|
| sam | Sam | Trưởng bộ phận hỗ trợ | Phân luồng công đơn, đánh giá mức độ ưu tiên, quyết định nâng cấp, nhận diện rủi ro SLA |
| grace | Grace | Chuyên gia thành công khách hàng | Tạo phản hồi chuyên nghiệp, điều chỉnh giọng điệu, xử lý khiếu nại, khôi phục sự hài lòng |
| max | Max | Trợ lý kiến thức | Tìm kiếm trường hợp tương tự, đề xuất kiến thức, tổng hợp giải pháp |

**Nhân viên dùng chung (Năng lực tổng quát)**

| ID | Tên | Vị trí | Năng lực cốt lõi |
|----|------|------|----------|
| dex | Dex | Chuyên viên xử lý dữ liệu | Trích xuất công đơn từ email, chuyển cuộc gọi thành công đơn, làm sạch dữ liệu hàng loạt |
| ellis | Ellis | Chuyên gia Email | Phân tích cảm xúc email, tóm tắt luồng trao đổi, dự thảo phản hồi |
| lexi | Lexi | Thông dịch viên | Dịch công đơn, dịch phản hồi, dịch hội thoại thời gian thực |
| cole | Cole | Chuyên gia NocoBase | Hướng dẫn sử dụng hệ thống, hỗ trợ cấu hình luồng công việc |
| vera | Vera | Chuyên viên phân tích nghiên cứu | Nghiên cứu giải pháp kỹ thuật, kiểm chứng thông tin sản phẩm |

### 5.2 Danh sách nhiệm vụ AI

Mỗi nhân viên AI được cấu hình 4 nhiệm vụ cụ thể:

#### Nhiệm vụ của Sam

| ID nhiệm vụ | Tên | Cách thức kích hoạt | Mô tả |
|--------|------|----------|------|
| SAM-01 | Phân tích và phân luồng công đơn | Luồng công việc tự động | Tự động phân tích khi có công đơn mới |
| SAM-02 | Đánh giá lại mức độ ưu tiên | Tương tác giao diện | Điều chỉnh mức độ ưu tiên dựa trên thông tin mới |
| SAM-03 | Quyết định nâng cấp | Giao diện/Luồng công việc | Phán đoán xem có cần nâng cấp xử lý không |
| SAM-04 | Đánh giá rủi ro SLA | Luồng công việc tự động | Nhận diện rủi ro quá hạn |

#### Nhiệm vụ của Grace

| ID nhiệm vụ | Tên | Cách thức kích hoạt | Mô tả |
|--------|------|----------|------|
| GRACE-01 | Tạo phản hồi chuyên nghiệp | Tương tác giao diện | Tạo phản hồi dựa trên ngữ cảnh |
| GRACE-02 | Điều chỉnh giọng điệu phản hồi | Tương tác giao diện | Tối ưu hóa giọng điệu của phản hồi có sẵn |
| GRACE-03 | Xử lý giảm cấp khiếu nại | Giao diện/Luồng công việc | Xoa dịu khiếu nại của khách hàng |
| GRACE-04 | Khôi phục sự hài lòng | Giao diện/Luồng công việc | Theo dõi sau những trải nghiệm tiêu cực |

#### Nhiệm vụ của Max

| ID nhiệm vụ | Tên | Cách thức kích hoạt | Mô tả |
|--------|------|----------|------|
| MAX-01 | Tìm kiếm trường hợp tương tự | Giao diện/Luồng công việc | Tìm kiếm các công đơn tương tự trong lịch sử |
| MAX-02 | Đề xuất bài viết kiến thức | Giao diện/Luồng công việc | Đề xuất các bài viết kiến thức liên quan |
| MAX-03 | Tổng hợp giải pháp | Tương tác giao diện | Tổng hợp giải pháp từ nhiều nguồn |
| MAX-04 | Hướng dẫn khắc phục sự cố | Tương tác giao diện | Tạo quy trình kiểm tra hệ thống |

#### Nhiệm vụ của Lexi

| ID nhiệm vụ | Tên | Cách thức kích hoạt | Mô tả |
|--------|------|----------|------|
| LEXI-01 | Dịch công đơn | Luồng công việc tự động | Dịch nội dung công đơn |
| LEXI-02 | Dịch phản hồi | Tương tác giao diện | Dịch phản hồi của nhân viên hỗ trợ |
| LEXI-03 | Dịch hàng loạt | Luồng công việc tự động | Xử lý dịch thuật hàng loạt |
| LEXI-04 | Dịch hội thoại thời gian thực | Tương tác giao diện | Dịch hội thoại trực tiếp |

### 5.3 Nhân viên AI và Vòng đời công đơn

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 Ví dụ phản hồi của AI

#### SAM-01 Phản hồi phân tích công đơn

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "đăng nhập thất bại", "quá hạn", "quyết toán cuối tháng"],
  "confidence": 0.92,
  "reasoning": "Công đơn này mô tả vấn đề đăng nhập hệ thống ERP, ảnh hưởng đến việc quyết toán cuối tháng của bộ phận tài chính, mức độ khẩn cấp cao",
  "suggested_reply": "Kính thưa quý khách, cảm ơn quý khách đã phản hồi vấn đề này...",
  "source_language_code": "vi",
  "is_translated": true,
  "description_translated": "Hello, our ERP system cannot login..."
}
```

#### GRACE-01 Phản hồi tạo câu trả lời

```
Kính gửi ông Trương,

Cảm ơn ông đã liên hệ với chúng tôi để phản hồi về vấn đề đăng nhập ERP. Tôi hoàn toàn hiểu rằng vấn đề này đang ảnh hưởng đến công tác quyết toán cuối tháng của quý công ty,
chúng tôi đã đưa vấn đề này vào danh sách ưu tiên xử lý cao nhất.

Tình hình hiện tại:
- Đội ngũ kỹ thuật đang kiểm tra kết nối máy chủ
- Dự kiến sẽ cập nhật tiến độ cho ông trong vòng 30 phút tới

Trong thời gian này, ông có thể thử:
1. Truy cập qua địa chỉ dự phòng: https://erp-backup.company.com
2. Nếu có nhu cầu xuất báo cáo khẩn cấp, vui lòng liên hệ để chúng tôi hỗ trợ xuất dữ liệu

Nếu có bất kỳ câu hỏi nào khác, xin vui lòng liên hệ với tôi.

Trân trọng,
Đội ngũ hỗ trợ kỹ thuật
```

### 5.5 Tường lửa EQ của AI

Việc kiểm duyệt chất lượng phản hồi do Grace phụ trách sẽ ngăn chặn các vấn đề sau:

| Loại vấn đề | Ví dụ nội dung gốc | Gợi ý của AI |
|----------|----------|--------|
| Giọng điệu phủ định | "Không được, cái này không nằm trong phạm vi bảo hành" | "Lỗi này tạm thời không được bảo hành miễn phí, chúng tôi có thể cung cấp phương án sửa chữa có tính phí" |
| Đổ lỗi cho khách hàng | "Do anh tự làm hỏng đấy chứ" | "Qua kiểm tra, lỗi này thuộc về hư hỏng ngoài ý muốn" |
| Đùn đẩy trách nhiệm | "Đây không phải lỗi của chúng tôi" | "Để tôi giúp anh kiểm tra thêm nguyên nhân gây ra vấn đề" |
| Diễn đạt thờ ơ | "Không biết" | "Để tôi giúp anh tra cứu thêm thông tin liên quan" |
| Thông tin nhạy cảm | "Mật khẩu của anh là abc123" | [Chặn] Chứa thông tin nhạy cảm, không cho phép gửi |

---

## 6. Hệ thống kho kiến thức

### 6.1 Nguồn kiến thức

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Quy trình chuyển đổi công đơn thành kiến thức

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Các tiêu chí đánh giá**:
- **Tính phổ biến**: Đây có phải là vấn đề thường gặp không?
- **Tính đầy đủ**: Giải pháp có rõ ràng và hoàn chỉnh không?
- **Tính tái sử dụng**: Các bước thực hiện có thể áp dụng lại được không?

### 6.3 Cơ chế đề xuất kiến thức

Khi nhân viên hỗ trợ mở chi tiết công đơn, Max sẽ tự động đề xuất các kiến thức liên quan:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Kiến thức đề xuất                           [Mở rộng/Thu gọn] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Hướng dẫn chẩn đoán lỗi hệ thống servo CNC     Độ khớp: 94% │
│ │ Bao gồm: Giải mã mã báo động, các bước kiểm tra bộ điều khiển servo │
│ │ [Xem] [Áp dụng vào phản hồi] [Đánh dấu hữu ích]           │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Sổ tay bảo trì dòng XYZ-CNC3000                Độ khớp: 87% │
│ │ Bao gồm: Các lỗi thường gặp, kế hoạch bảo trì phòng ngừa    │
│ │ [Xem] [Áp dụng vào phản hồi] [Đánh dấu hữu ích]           │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Công cụ luồng công việc (Workflow Engine)

### 7.1 Phân loại luồng công việc

| Mã số | Phân loại | Mô tả | Cách thức kích hoạt |
|------|------|------|----------|
| WF-T | Luồng công đơn | Quản lý vòng đời công đơn | Sự kiện biểu mẫu |
| WF-S | Luồng SLA | Tính toán và cảnh báo SLA | Sự kiện biểu mẫu/Định kỳ |
| WF-C | Luồng bình luận | Xử lý và dịch bình luận | Sự kiện biểu mẫu |
| WF-R | Luồng đánh giá | Mời đánh giá và thống kê | Sự kiện biểu mẫu/Định kỳ |
| WF-N | Luồng thông báo | Gửi thông báo | Dựa trên sự kiện |
| WF-AI | Luồng AI | Phân tích và tạo nội dung AI | Sự kiện biểu mẫu |

### 7.2 Các luồng công việc cốt lõi

#### WF-T01: Quy trình tạo công đơn

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Phân tích công đơn bằng AI

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Dịch và kiểm duyệt bình luận

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Tạo kiến thức

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Nhiệm vụ định kỳ

| Nhiệm vụ | Tần suất thực hiện | Mô tả |
|------|----------|------|
| Kiểm tra cảnh báo SLA | Mỗi 5 phút | Kiểm tra các công đơn sắp quá hạn |
| Tự động đóng công đơn | Hàng ngày | Tự động đóng các công đơn ở trạng thái resolved sau 3 ngày |
| Gửi lời mời đánh giá | Hàng ngày | Gửi lời mời đánh giá sau 24 giờ kể từ khi đóng công đơn |
| Cập nhật dữ liệu thống kê | Mỗi giờ | Cập nhật thống kê công đơn của khách hàng |

---

## 8. Thiết kế Menu và Giao diện

### 8.1 Trang quản trị (Backend)

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Cổng thông tin khách hàng (Customer Portal)

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Thiết kế bảng điều khiển (Dashboard)

#### Chế độ xem cho lãnh đạo

| Thành phần | Loại | Mô tả dữ liệu |
|------|------|----------|
| Tỷ lệ đạt chuẩn SLA | Đồng hồ đo | Tỷ lệ đạt chuẩn phản hồi/giải quyết trong tháng |
| Xu hướng hài lòng | Biểu đồ đường | Thay đổi mức độ hài lòng trong 30 ngày qua |
| Xu hướng lượng công đơn | Biểu đồ cột | Lượng công đơn trong 30 ngày qua |
| Phân bổ loại nghiệp vụ | Biểu đồ tròn | Tỷ trọng của từng loại nghiệp vụ |

#### Chế độ xem cho quản lý

| Thành phần | Loại | Mô tả dữ liệu |
|------|------|----------|
| Cảnh báo quá hạn | Danh sách | Các công đơn sắp quá hạn hoặc đã quá hạn |
| Khối lượng công việc nhân viên | Biểu đồ cột | Số lượng công đơn của từng thành viên trong đội |
| Phân bổ tồn đọng | Biểu đồ chồng | Số lượng công đơn theo từng trạng thái |
| Hiệu suất xử lý | Biểu đồ nhiệt | Phân bổ thời gian xử lý trung bình |

#### Chế độ xem cho nhân viên hỗ trợ

| Thành phần | Loại | Mô tả dữ liệu |
|------|------|----------|
| Việc cần làm của tôi | Thẻ số | Số lượng công đơn đang chờ xử lý |
| Phân bổ mức độ ưu tiên | Biểu đồ tròn | Phân bổ P0/P1/P2/P3 |
| Thống kê hôm nay | Thẻ chỉ số | Số lượng đã xử lý/giải quyết trong ngày |
| Đếm ngược SLA | Danh sách | 5 công đơn khẩn cấp nhất |

---

## Phụ lục

### A. Cấu hình loại nghiệp vụ

| Mã loại | Tên | Biểu tượng | Bảng mở rộng liên kết |
|----------|------|------|------------|
| repair | Sửa chữa thiết bị | 🔧 | nb_tts_biz_repair |
| it_support | Hỗ trợ IT | 💻 | nb_tts_biz_it_support |
| complaint | Khiếu nại khách hàng | 📢 | nb_tts_biz_complaint |
| consultation | Tư vấn góp ý | ❓ | Không |
| other | Khác | 📝 | Không |

### B. Mã phân loại

| Mã | Tên | Mô tả |
|------|------|------|
| CONVEYOR | Hệ thống băng tải | Vấn đề hệ thống băng tải |
| PACKAGING | Máy đóng gói | Vấn đề máy đóng gói |
| WELDING | Thiết bị hàn | Vấn đề thiết bị hàn |
| COMPRESSOR | Máy nén khí | Vấn đề máy nén khí |
| COLD_STORE | Kho lạnh | Vấn đề kho lạnh |
| CENTRAL_AC | Điều hòa trung tâm | Vấn đề điều hòa trung tâm |
| FORKLIFT | Xe nâng | Vấn đề xe nâng |
| COMPUTER | Máy tính | Vấn đề phần cứng máy tính |
| PRINTER | Máy in | Vấn đề máy in |
| PROJECTOR | Máy chiếu | Vấn đề máy chiếu |
| INTERNET | Mạng | Vấn đề kết nối mạng |
| EMAIL | Email | Vấn đề hệ thống email |
| ACCESS | Quyền truy cập | Vấn đề quyền tài khoản |
| PROD_INQ | Tư vấn sản phẩm | Tư vấn về sản phẩm |
| COMPLAINT | Khiếu nại chung | Khiếu nại thông thường |
| DELAY | Chậm trễ logistics | Khiếu nại về chậm trễ giao hàng |
| DAMAGE | Hư hỏng bao bì | Khiếu nại về hư hỏng bao bì |
| QUANTITY | Thiếu hụt số lượng | Khiếu nại về thiếu hụt số lượng |
| SVC_ATTITUDE | Thái độ phục vụ | Khiếu nại về thái độ phục vụ |
| PROD_QUALITY | Chất lượng sản phẩm | Khiếu nại về chất lượng sản phẩm |
| TRAINING | Đào tạo | Yêu cầu đào tạo |
| RETURN | Trả hàng | Yêu cầu trả hàng |

---

*Phiên bản tài liệu: 2.0 | Cập nhật lần cuối: 05-01-2026*