---
title: "Thiết kế chi tiết giải pháp Ticket"
description: "Thiết kế chi tiết giải pháp Ticket v2.0: Kiến trúc dữ liệu chữ T (bảng chính + bảng phụ nghiệp vụ), Đội AI Employee (Sam/Grace/Max/Lexi), vòng lặp tri thức tự thân, cấu trúc bảng cốt lõi, Workflow."
keywords: "Thiết kế Ticket,Kiến trúc chữ T,Ticket AI,Bảng Ticket chính,Knowledge base,SLA,NocoBase"
---

# Thiết kế chi tiết giải pháp Ticket

> **Phiên bản**: v2.0-beta

> **Ngày cập nhật**: 2026-01-05

> **Trạng thái**: Bản preview

## 1. Tổng quan hệ thống và triết lý thiết kế

### 1.1 Định vị hệ thống

Hệ thống này là một bộ **Nền tảng quản lý Ticket thông minh AI-driven**, được xây dựng dựa trên nền tảng low-code NocoBase. Mục tiêu cốt lõi là:

```
Cho phép dịch vụ Khách hàng tập trung hơn vào giải quyết vấn đề, thay vì các thao tác quy trình rườm rà
```

### 1.2 Triết lý thiết kế

#### Triết lý một: Kiến trúc dữ liệu chữ T

**Kiến trúc chữ T là gì?**

Mượn ý tưởng "Nhân tài chữ T" - chiều rộng ngang + chiều sâu dọc:

- **Chiều ngang (bảng chính)**: Phủ năng lực chung cho tất cả các loại nghiệp vụ - mã, trạng thái, người xử lý, SLA... và các trường cốt lõi
- **Chiều dọc (bảng mở rộng)**: Đi sâu vào các trường chuyên biệt của nghiệp vụ cụ thể - sửa chữa thiết bị có serial number, khiếu nại có phương án bồi thường

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**Tại sao thiết kế như vậy?**

| Giải pháp truyền thống | Kiến trúc chữ T |
|----------|---------|
| Mỗi loại nghiệp vụ một bảng, các trường lặp lại | Quản lý thống nhất các trường chung, các trường nghiệp vụ mở rộng theo nhu cầu |
| Báo cáo thống kê cần gộp nhiều bảng | Một bảng chính trực tiếp thống kê tất cả Ticket |
| Thay đổi quy trình phải sửa nhiều nơi | Quy trình cốt lõi chỉ sửa một nơi |
| Thêm loại nghiệp vụ mới phải tạo bảng mới | Chỉ cần thêm bảng mở rộng, quy trình chính không đổi |

#### Triết lý hai: Đội AI Employee

Không phải "tính năng AI", mà là "AI Employee". Mỗi AI có vai trò, tính cách, trách nhiệm rõ ràng:

| AI Employee | Vị trí | Trách nhiệm cốt lõi | Kịch bản kích hoạt |
|--------|------|----------|----------|
| **Sam** | Trưởng service desk | Phân loại Ticket, đánh giá ưu tiên, quyết định leo thang | Tự động khi tạo Ticket |
| **Grace** | Chuyên gia thành công Khách hàng | Sinh trả lời, điều chỉnh giọng điệu, xử lý khiếu nại | Dịch vụ Khách hàng nhấn "AI trả lời" |
| **Max** | Trợ lý tri thức | Case tương tự, đề xuất tri thức, tổng hợp giải pháp | Tự động trên trang chi tiết Ticket |
| **Lexi** | Phiên dịch | Dịch đa ngôn ngữ, dịch bình luận | Tự động khi phát hiện ngoại ngữ |

**Tại sao dùng mô hình "AI Employee"?**

- **Trách nhiệm rõ ràng**: Sam quản phân loại, Grace quản trả lời, sẽ không lộn xộn
- **Dễ hiểu**: Nói với người dùng "Hãy để Sam phân tích một chút" thân thiện hơn "Gọi API phân loại"
- **Có thể mở rộng**: Thêm năng lực AI mới = Tuyển nhân viên mới

#### Triết lý ba: Vòng lặp tri thức tự thân

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Điều này tạo thành một vòng kín **tích lũy tri thức - ứng dụng tri thức**.

---

## 2. Thực thể cốt lõi và mô hình dữ liệu

### 2.1 Tổng quan quan hệ thực thể

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Chi tiết các bảng cốt lõi

#### 2.2.1 Bảng Ticket chính (nb_tts_tickets)

Đây là cốt lõi của hệ thống, sử dụng thiết kế "bảng rộng", đặt tất cả các trường thường dùng vào bảng chính.

**Thông tin cơ bản**

| Trường | Loại | Mô tả | Ví dụ |
|------|------|------|------|
| id | BIGINT | Khóa chính | 1001 |
| ticket_no | VARCHAR | Mã Ticket | TKT-20251229-0001 |
| title | VARCHAR | Tiêu đề | Kết nối mạng chậm |
| description | TEXT | Mô tả vấn đề | Sáng nay mạng văn phòng bắt đầu... |
| biz_type | VARCHAR | Loại nghiệp vụ | it_support |
| priority | VARCHAR | Ưu tiên | P1 |
| status | VARCHAR | Trạng thái | processing |

**Truy nguyên nguồn gốc**

| Trường | Loại | Mô tả | Ví dụ |
|------|------|------|------|
| source_system | VARCHAR | Hệ thống nguồn | crm / email / iot |
| source_channel | VARCHAR | Kênh nguồn | web / phone / wechat |
| external_ref_id | VARCHAR | ID tham chiếu bên ngoài | CRM-2024-0001 |

**Thông tin Người liên hệ**

| Trường | Loại | Mô tả |
|------|------|------|
| customer_id | BIGINT | ID Khách hàng |
| contact_name | VARCHAR | Tên Người liên hệ |
| contact_phone | VARCHAR | Điện thoại liên hệ |
| contact_email | VARCHAR | Email liên hệ |
| contact_company | VARCHAR | Tên công ty |

**Thông tin người xử lý**

| Trường | Loại | Mô tả |
|------|------|------|
| assignee_id | BIGINT | ID người xử lý |
| assignee_department_id | BIGINT | ID bộ phận xử lý |
| transfer_count | INT | Số lần chuyển giao |

**Mốc thời gian**

| Trường | Loại | Mô tả | Thời điểm kích hoạt |
|------|------|------|----------|
| submitted_at | TIMESTAMP | Thời gian gửi | Khi tạo Ticket |
| assigned_at | TIMESTAMP | Thời gian phân công | Khi chỉ định người xử lý |
| first_response_at | TIMESTAMP | Thời gian phản hồi đầu | Khi phản hồi Khách hàng lần đầu |
| resolved_at | TIMESTAMP | Thời gian giải quyết | Khi trạng thái đổi thành resolved |
| closed_at | TIMESTAMP | Thời gian đóng | Khi trạng thái đổi thành closed |

**Liên quan SLA**

| Trường | Loại | Mô tả |
|------|------|------|
| sla_config_id | BIGINT | ID cấu hình SLA |
| sla_response_due | TIMESTAMP | Thời gian deadline phản hồi |
| sla_resolve_due | TIMESTAMP | Thời gian deadline giải quyết |
| sla_paused_at | TIMESTAMP | Thời gian SLA tạm dừng bắt đầu |
| sla_paused_duration | INT | Tổng thời lượng tạm dừng (phút) |
| is_sla_response_breached | BOOLEAN | Phản hồi có vi phạm không |
| is_sla_resolve_breached | BOOLEAN | Giải quyết có vi phạm không |

**Kết quả phân tích AI**

| Trường | Loại | Mô tả | Do ai điền |
|------|------|------|----------|
| ai_category_code | VARCHAR | Phân loại AI nhận diện | Sam |
| ai_sentiment | VARCHAR | Phân tích cảm xúc | Sam |
| ai_urgency | VARCHAR | Mức độ khẩn cấp | Sam |
| ai_keywords | JSONB | Từ khóa | Sam |
| ai_reasoning | TEXT | Quá trình suy luận | Sam |
| ai_suggested_reply | TEXT | Trả lời được đề xuất | Sam/Grace |
| ai_confidence_score | NUMERIC | Độ tin cậy | Sam |
| ai_analysis | JSONB | Kết quả phân tích đầy đủ | Sam |

**Hỗ trợ đa ngôn ngữ**

| Trường | Loại | Mô tả | Do ai điền |
|------|------|------|----------|
| source_language_code | VARCHAR | Ngôn ngữ gốc | Sam/Lexi |
| target_language_code | VARCHAR | Ngôn ngữ đích | Hệ thống mặc định EN |
| is_translated | BOOLEAN | Đã dịch chưa | Lexi |
| description_translated | TEXT | Mô tả sau khi dịch | Lexi |

#### 2.2.2 Bảng mở rộng nghiệp vụ

**Sửa chữa thiết bị (nb_tts_biz_repair)**

| Trường | Loại | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID Ticket liên kết |
| equipment_model | VARCHAR | Model thiết bị |
| serial_number | VARCHAR | Serial number |
| fault_code | VARCHAR | Mã lỗi |
| spare_parts | JSONB | Danh sách linh kiện |
| maintenance_type | VARCHAR | Loại bảo trì |

**Hỗ trợ IT (nb_tts_biz_it_support)**

| Trường | Loại | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID Ticket liên kết |
| asset_number | VARCHAR | Mã tài sản |
| os_version | VARCHAR | Phiên bản hệ điều hành |
| software_name | VARCHAR | Phần mềm liên quan |
| remote_address | VARCHAR | Địa chỉ remote |
| error_code | VARCHAR | Mã lỗi |

**Khiếu nại Khách hàng (nb_tts_biz_complaint)**

| Trường | Loại | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID Ticket liên kết |
| related_order_no | VARCHAR | Mã Đơn hàng liên quan |
| complaint_level | VARCHAR | Cấp độ khiếu nại |
| compensation_amount | DECIMAL | Số tiền bồi thường |
| compensation_type | VARCHAR | Hình thức bồi thường |
| root_cause | TEXT | Nguyên nhân gốc rễ |

#### 2.2.3 Bảng bình luận (nb_tts_ticket_comments)

**Trường cốt lõi**

| Trường | Loại | Mô tả |
|------|------|------|
| id | BIGINT | Khóa chính |
| ticket_id | BIGINT | ID Ticket |
| parent_id | BIGINT | ID bình luận cha (hỗ trợ dạng cây) |
| content | TEXT | Nội dung bình luận |
| direction | VARCHAR | Hướng: inbound (Khách hàng)/outbound (dịch vụ Khách hàng) |
| is_internal | BOOLEAN | Có phải ghi chú nội bộ không |
| is_first_response | BOOLEAN | Có phải phản hồi đầu tiên không |

**Trường kiểm duyệt AI (cho outbound)**

| Trường | Loại | Mô tả |
|------|------|------|
| source_language_code | VARCHAR | Ngôn ngữ nguồn |
| content_translated | TEXT | Nội dung đã dịch |
| is_translated | BOOLEAN | Đã dịch chưa |
| is_ai_blocked | BOOLEAN | Có bị AI chặn không |
| ai_block_reason | VARCHAR | Lý do chặn |
| ai_block_detail | TEXT | Mô tả chi tiết |
| ai_quality_score | NUMERIC | Điểm chất lượng |
| ai_suggestions | TEXT | Đề xuất cải tiến |

#### 2.2.4 Bảng đánh giá (nb_tts_ratings)

| Trường | Loại | Mô tả |
|------|------|------|
| ticket_id | BIGINT | ID Ticket (duy nhất) |
| overall_rating | INT | Hài lòng tổng thể (1-5) |
| response_rating | INT | Tốc độ phản hồi (1-5) |
| professionalism_rating | INT | Mức độ chuyên nghiệp (1-5) |
| resolution_rating | INT | Giải quyết vấn đề (1-5) |
| nps_score | INT | Điểm NPS (0-10) |
| tags | JSONB | Nhãn nhanh |
| comment | TEXT | Đánh giá bằng chữ |

#### 2.2.5 Bảng bài viết tri thức (nb_tts_qa_articles)

| Trường | Loại | Mô tả |
|------|------|------|
| article_no | VARCHAR | Mã bài viết KB-T0001 |
| title | VARCHAR | Tiêu đề |
| content | TEXT | Nội dung (Markdown) |
| summary | TEXT | Tóm tắt |
| category_code | VARCHAR | Mã phân loại |
| keywords | JSONB | Từ khóa |
| source_type | VARCHAR | Nguồn: ticket/faq/manual |
| source_ticket_id | BIGINT | ID Ticket nguồn |
| ai_generated | BOOLEAN | Có do AI tạo không |
| ai_quality_score | NUMERIC | Điểm chất lượng |
| status | VARCHAR | Trạng thái: draft/published/archived |
| view_count | INT | Số lượt xem |
| helpful_count | INT | Số lượt hữu ích |

### 2.3 Danh sách bảng dữ liệu

| STT | Tên bảng | Mô tả | Loại bản ghi |
|------|------|------|----------|
| 1 | nb_tts_tickets | Bảng Ticket chính | Dữ liệu nghiệp vụ |
| 2 | nb_tts_biz_repair | Mở rộng sửa chữa thiết bị | Dữ liệu nghiệp vụ |
| 3 | nb_tts_biz_it_support | Mở rộng hỗ trợ IT | Dữ liệu nghiệp vụ |
| 4 | nb_tts_biz_complaint | Mở rộng khiếu nại Khách hàng | Dữ liệu nghiệp vụ |
| 5 | nb_tts_customers | Bảng Khách hàng chính | Dữ liệu nghiệp vụ |
| 6 | nb_tts_customer_contacts | Người liên hệ Khách hàng | Dữ liệu nghiệp vụ |
| 7 | nb_tts_ticket_comments | Bình luận Ticket | Dữ liệu nghiệp vụ |
| 8 | nb_tts_ratings | Đánh giá hài lòng | Dữ liệu nghiệp vụ |
| 9 | nb_tts_qa_articles | Bài viết tri thức | Dữ liệu tri thức |
| 10 | nb_tts_qa_article_relations | Liên kết bài viết | Dữ liệu tri thức |
| 11 | nb_tts_faqs | Câu hỏi thường gặp | Dữ liệu tri thức |
| 12 | nb_tts_tickets_categories | Phân loại Ticket | Dữ liệu cấu hình |
| 13 | nb_tts_sla_configs | Cấu hình SLA | Dữ liệu cấu hình |
| 14 | nb_tts_skill_configs | Cấu hình kỹ năng | Dữ liệu cấu hình |
| 15 | nb_tts_business_types | Loại nghiệp vụ | Dữ liệu cấu hình |

---

## 3. Vòng đời Ticket

### 3.1 Định nghĩa trạng thái

| Trạng thái | Tiếng Việt | Mô tả | Đếm SLA | Màu |
|------|------|------|---------|------|
| new | Mới tạo | Vừa tạo, chờ phân công | Bắt đầu | 🔵 Xanh dương |
| assigned | Đã phân công | Đã chỉ định người xử lý, chờ nhận | Tiếp tục | 🔷 Xanh lam |
| processing | Đang xử lý | Đang xử lý | Tiếp tục | 🟠 Cam |
| pending | Treo | Chờ phản hồi từ Khách hàng | **Tạm dừng** | ⚫ Xám |
| transferred | Đã chuyển giao | Chuyển cho người khác | Tiếp tục | 🟣 Tím |
| resolved | Đã giải quyết | Chờ Khách hàng xác nhận | Dừng | 🟢 Xanh lá |
| closed | Đã đóng | Ticket kết thúc | Dừng | ⚫ Xám |
| cancelled | Đã hủy | Ticket bị hủy | Dừng | ⚫ Xám |

### 3.2 Sơ đồ chuyển trạng thái

**Quy trình chính (từ trái sang phải)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Quy trình nhánh**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**Máy trạng thái đầy đủ**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Quy tắc chuyển trạng thái chính

| Từ | Đến | Điều kiện kích hoạt | Hành động hệ thống |
|----|----|---------|---------|
| new | assigned | Chỉ định người xử lý | Ghi assigned_at |
| assigned | processing | Người xử lý nhấn "Nhận" | Không |
| processing | pending | Nhấn "Treo" | Ghi sla_paused_at |
| pending | processing | Khách hàng phản hồi / khôi phục thủ công | Tính thời lượng tạm dừng, xóa paused_at |
| processing | resolved | Nhấn "Giải quyết" | Ghi resolved_at |
| resolved | closed | Khách hàng xác nhận / 3 ngày timeout | Ghi closed_at |
| * | cancelled | Hủy Ticket | Không |


---

## 4. Quản lý mức dịch vụ SLA

### 4.1 Cấu hình ưu tiên và SLA

| Ưu tiên | Tên | Thời gian phản hồi | Thời gian giải quyết | Ngưỡng cảnh báo | Kịch bản điển hình |
|--------|------|----------|----------|----------|----------|
| P0 | Khẩn cấp | 15 phút | 2 giờ | 80% | Hệ thống ngừng hoạt động, dây chuyền sản xuất dừng |
| P1 | Cao | 1 giờ | 8 giờ | 80% | Lỗi tính năng quan trọng |
| P2 | Trung | 4 giờ | 24 giờ | 80% | Vấn đề thường |
| P3 | Thấp | 8 giờ | 72 giờ | 80% | Tư vấn, đề xuất |

### 4.2 Logic tính SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Khi tạo Ticket

```
Thời gian deadline phản hồi = Thời gian gửi + Thời hạn phản hồi (phút)
Thời gian deadline giải quyết = Thời gian gửi + Thời hạn giải quyết (phút)
```

#### Khi treo (pending)

```
Thời gian SLA tạm dừng bắt đầu = Thời gian hiện tại
```

#### Khi khôi phục (từ pending về processing)

```
-- Tính thời lượng tạm dừng lần này
Thời lượng tạm dừng lần này = Thời gian hiện tại - Thời gian SLA tạm dừng bắt đầu

-- Cộng vào tổng thời lượng tạm dừng
Tổng thời lượng tạm dừng = Tổng thời lượng tạm dừng + Thời lượng tạm dừng lần này

-- Kéo dài thời gian deadline (thời gian tạm dừng không tính vào SLA)
Thời gian deadline phản hồi = Thời gian deadline phản hồi + Thời lượng tạm dừng lần này
Thời gian deadline giải quyết = Thời gian deadline giải quyết + Thời lượng tạm dừng lần này

-- Xóa thời gian tạm dừng bắt đầu
Thời gian SLA tạm dừng bắt đầu = Trống
```

#### Đánh giá vi phạm SLA

```
-- Đánh giá vi phạm phản hồi
Phản hồi có vi phạm = (Thời gian phản hồi đầu trống VÀ Thời gian hiện tại > Thời gian deadline phản hồi)
            HOẶC (Thời gian phản hồi đầu > Thời gian deadline phản hồi)

-- Đánh giá vi phạm giải quyết
Giải quyết có vi phạm = (Thời gian giải quyết trống VÀ Thời gian hiện tại > Thời gian deadline giải quyết)
            HOẶC (Thời gian giải quyết > Thời gian deadline giải quyết)
```

### 4.3 Cơ chế cảnh báo SLA

| Cấp cảnh báo | Điều kiện | Đối tượng nhận thông báo | Cách thông báo |
|----------|------|----------|----------|
| Cảnh báo vàng | Thời gian còn lại < 20% | Người xử lý | Tin nhắn trong hệ thống |
| Cảnh báo đỏ | Đã quá hạn | Người xử lý + quản lý | Tin nhắn trong hệ thống + email |
| Cảnh báo leo thang | Quá hạn 1 giờ | Quản lý bộ phận | Email + SMS |

### 4.4 Chỉ số dashboard SLA

| Chỉ số | Công thức tính | Ngưỡng khỏe |
|------|----------|----------|
| Tỷ lệ đạt phản hồi | Số Ticket không vi phạm / Tổng số Ticket | > 95% |
| Tỷ lệ đạt giải quyết | Số đã giải quyết không vi phạm / Số Ticket đã giải quyết | > 90% |
| Thời gian phản hồi trung bình | SUM(Thời gian phản hồi) / Số Ticket | < 50% SLA |
| Thời gian giải quyết trung bình | SUM(Thời gian giải quyết) / Số Ticket | < 80% SLA |

---

## 5. Năng lực AI và hệ thống Employee

### 5.1 Đội AI Employee

Hệ thống cấu hình 8 AI Employee, chia thành hai loại:

**Employee mới (chuyên dụng cho hệ thống Ticket)**

| ID | Tên | Vị trí | Năng lực cốt lõi |
|----|------|------|----------|
| sam | Sam | Trưởng service desk | Phân loại Ticket, đánh giá ưu tiên, quyết định leo thang, nhận diện rủi ro SLA |
| grace | Grace | Chuyên gia thành công Khách hàng | Sinh trả lời chuyên nghiệp, điều chỉnh giọng điệu, xử lý khiếu nại, khôi phục hài lòng |
| max | Max | Trợ lý tri thức | Tìm case tương tự, đề xuất tri thức, tổng hợp giải pháp |

**Employee dùng lại (năng lực chung)**

| ID | Tên | Vị trí | Năng lực cốt lõi |
|----|------|------|----------|
| dex | Dex | Người chỉnh lý dữ liệu | Trích xuất Ticket từ email, chuyển điện thoại thành Ticket, làm sạch dữ liệu hàng loạt |
| ellis | Ellis | Chuyên gia email | Phân tích cảm xúc email, tóm tắt thread, soạn trả lời |
| lexi | Lexi | Phiên dịch | Dịch Ticket, dịch trả lời, dịch hội thoại thời gian thực |
| cole | Cole | Chuyên gia NocoBase | Hướng dẫn sử dụng hệ thống, hỗ trợ cấu hình Workflow |
| vera | Vera | Nhà phân tích nghiên cứu | Nghiên cứu giải pháp kỹ thuật, kiểm tra thông tin Sản phẩm |

### 5.2 Danh sách nhiệm vụ AI

Mỗi AI Employee được cấu hình 4 nhiệm vụ cụ thể:

#### Nhiệm vụ của Sam

| ID nhiệm vụ | Tên | Cách kích hoạt | Mô tả |
|--------|------|----------|------|
| SAM-01 | Phân tích phân loại Ticket | Workflow tự động | Phân tích tự động khi tạo Ticket mới |
| SAM-02 | Đánh giá lại ưu tiên | Tương tác frontend | Điều chỉnh ưu tiên dựa trên thông tin mới |
| SAM-03 | Quyết định leo thang | Frontend/Workflow | Đánh giá có cần leo thang không |
| SAM-04 | Đánh giá rủi ro SLA | Workflow tự động | Nhận diện rủi ro quá hạn |

#### Nhiệm vụ của Grace

| ID nhiệm vụ | Tên | Cách kích hoạt | Mô tả |
|--------|------|----------|------|
| GRACE-01 | Sinh trả lời chuyên nghiệp | Tương tác frontend | Sinh trả lời dựa trên ngữ cảnh |
| GRACE-02 | Điều chỉnh giọng điệu trả lời | Tương tác frontend | Tối ưu giọng điệu của trả lời đã có |
| GRACE-03 | Hạ cấp khiếu nại | Frontend/Workflow | Hóa giải khiếu nại Khách hàng |
| GRACE-04 | Khôi phục hài lòng | Frontend/Workflow | Theo dõi sau trải nghiệm tiêu cực |

#### Nhiệm vụ của Max

| ID nhiệm vụ | Tên | Cách kích hoạt | Mô tả |
|--------|------|----------|------|
| MAX-01 | Tìm case tương tự | Frontend/Workflow | Tìm Ticket lịch sử tương tự |
| MAX-02 | Đề xuất bài viết tri thức | Frontend/Workflow | Đề xuất bài viết tri thức liên quan |
| MAX-03 | Tổng hợp giải pháp | Tương tác frontend | Tổng hợp giải pháp từ nhiều nguồn |
| MAX-04 | Hướng dẫn xử lý sự cố | Tương tác frontend | Tạo quy trình kiểm tra hệ thống |

#### Nhiệm vụ của Lexi

| ID nhiệm vụ | Tên | Cách kích hoạt | Mô tả |
|--------|------|----------|------|
| LEXI-01 | Dịch Ticket | Workflow tự động | Dịch nội dung Ticket |
| LEXI-02 | Dịch trả lời | Tương tác frontend | Dịch trả lời của dịch vụ Khách hàng |
| LEXI-03 | Dịch hàng loạt | Workflow tự động | Xử lý dịch hàng loạt |
| LEXI-04 | Dịch hội thoại thời gian thực | Tương tác frontend | Dịch hội thoại thời gian thực |

### 5.3 AI Employee và vòng đời Ticket

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 Ví dụ phản hồi AI

#### Phản hồi phân tích Ticket SAM-01

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "Đăng nhập thất bại", "Timeout", "Quyết toán cuối tháng"],
  "confidence": 0.92,
  "reasoning": "Ticket mô tả vấn đề đăng nhập hệ thống ERP, ảnh hưởng đến quyết toán cuối tháng của bộ phận tài chính, mức độ khẩn cấp cao",
  "suggested_reply": "Kính chào Khách hàng, cảm ơn bạn đã phản hồi vấn đề này...",
  "source_language_code": "vi",
  "is_translated": true,
  "description_translated": "Hello, our ERP system cannot login..."
}
```

#### Phản hồi sinh trả lời GRACE-01

```
Kính chào Anh Tuấn,

Cảm ơn anh đã liên hệ phản hồi vấn đề đăng nhập ERP. Tôi hoàn toàn hiểu vấn đề này
đang ảnh hưởng đến công tác quyết toán cuối tháng của quý công ty,
chúng tôi đã ưu tiên xử lý vấn đề này.

Tình hình hiện tại:
- Đội kỹ thuật đang kiểm tra vấn đề kết nối server
- Dự kiến cập nhật tiến độ trong vòng 30 phút

Trong thời gian này, anh có thể thử:
1. Truy cập qua địa chỉ dự phòng: https://erp-backup.company.com
2. Nếu cần báo cáo gấp, có thể liên hệ chúng tôi để hỗ trợ xuất

Nếu có câu hỏi khác, vui lòng liên hệ tôi bất cứ lúc nào.

Trân trọng
Đội hỗ trợ kỹ thuật
```

### 5.5 Tường lửa cảm xúc AI

Việc kiểm duyệt chất lượng trả lời do Grace phụ trách sẽ chặn các vấn đề sau:

| Loại vấn đề | Ví dụ nguyên văn | Đề xuất AI |
|----------|----------|--------|
| Giọng điệu phủ định | "Không được, đây không nằm trong phạm vi bảo hành" | "Lỗi này tạm thời không thể được bảo hành miễn phí, chúng tôi có thể cung cấp phương án sửa chữa có phí" |
| Đổ lỗi cho Khách hàng | "Anh tự làm hỏng đấy chứ" | "Sau khi xác minh, lỗi này thuộc về hư hỏng do tai nạn" |
| Thoái thác trách nhiệm | "Đây không phải vấn đề của chúng tôi" | "Để tôi giúp anh kiểm tra thêm nguyên nhân vấn đề" |
| Diễn đạt thờ ơ | "Không biết" | "Tôi sẽ giúp anh tra cứu thông tin liên quan" |
| Thông tin nhạy cảm | "Mật khẩu của bạn là abc123" | [Đã chặn] Chứa thông tin nhạy cảm, không cho phép gửi |

---

## 6. Hệ thống Knowledge base

### 6.1 Nguồn tri thức

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Quy trình chuyển Ticket thành tri thức

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Tiêu chí đánh giá**:
- **Tính tổng quát**: Đây có phải vấn đề thường gặp không?
- **Tính đầy đủ**: Giải pháp có rõ ràng đầy đủ không?
- **Tính lặp lại**: Các bước có thể tái sử dụng không?

### 6.3 Cơ chế đề xuất tri thức

Khi dịch vụ Khách hàng mở chi tiết Ticket, Max tự động đề xuất tri thức liên quan:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Tri thức được đề xuất                       [Mở rộng/Thu gọn]  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Hướng dẫn chẩn đoán lỗi hệ thống servo CNC    Độ khớp: 94%    │ │
│ │ Bao gồm: Giải mã code cảnh báo, các bước kiểm tra driver servo                  │ │
│ │ [Xem] [Áp dụng vào trả lời] [Đánh dấu hữu ích]                        │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Sổ tay bảo trì series XYZ-CNC3000        Độ khớp: 87%    │ │
│ │ Bao gồm: Lỗi thường gặp, kế hoạch bảo trì phòng ngừa                          │ │
│ │ [Xem] [Áp dụng vào trả lời] [Đánh dấu hữu ích]                        │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Engine Workflow

### 7.1 Phân loại Workflow

| Mã | Phân loại | Mô tả | Cách kích hoạt |
|------|------|------|----------|
| WF-T | Quy trình Ticket | Quản lý vòng đời Ticket | Sự kiện form |
| WF-S | Quy trình SLA | Tính SLA và cảnh báo | Sự kiện form/Định kỳ |
| WF-C | Quy trình bình luận | Xử lý và dịch bình luận | Sự kiện form |
| WF-R | Quy trình đánh giá | Mời đánh giá và thống kê | Sự kiện form/Định kỳ |
| WF-N | Quy trình thông báo | Gửi thông báo | Sự kiện điều khiển |
| WF-AI | Quy trình AI | Phân tích và sinh AI | Sự kiện form |

### 7.2 Workflow cốt lõi

#### WF-T01: Quy trình tạo Ticket

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Phân tích AI Ticket

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Dịch và kiểm duyệt bình luận

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Sinh tri thức

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Nhiệm vụ định kỳ

| Nhiệm vụ | Tần suất thực thi | Mô tả |
|------|----------|------|
| Kiểm tra cảnh báo SLA | 5 phút một lần | Kiểm tra các Ticket sắp quá hạn |
| Tự động đóng Ticket | Hằng ngày | Trạng thái resolved sau 3 ngày tự động đóng |
| Gửi mời đánh giá | Hằng ngày | Sau khi đóng 24 giờ gửi mời đánh giá |
| Cập nhật dữ liệu thống kê | Hằng giờ | Cập nhật thống kê Ticket Khách hàng |

---

## 8. Thiết kế menu và giao diện

### 8.1 Backend quản lý

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Cổng Khách hàng

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Thiết kế dashboard

#### Chế độ xem cấp cao

| Component | Loại | Mô tả dữ liệu |
|------|------|----------|
| Tỷ lệ đạt SLA | Đồng hồ đo | Tỷ lệ đạt phản hồi/giải quyết tháng này |
| Xu hướng hài lòng | Biểu đồ đường | Biến động hài lòng 30 ngày gần đây |
| Xu hướng số lượng Ticket | Biểu đồ cột | Số lượng Ticket 30 ngày gần đây |
| Phân bố loại nghiệp vụ | Biểu đồ tròn | Tỷ lệ từng loại nghiệp vụ |

#### Chế độ xem quản lý

| Component | Loại | Mô tả dữ liệu |
|------|------|----------|
| Cảnh báo quá hạn | Danh sách | Ticket sắp quá hạn/đã quá hạn |
| Khối lượng công việc nhân viên | Biểu đồ cột | Số Ticket của các thành viên trong nhóm |
| Phân bố tồn đọng | Biểu đồ chồng | Số lượng Ticket theo trạng thái |
| Hiệu suất xử lý | Bản đồ nhiệt | Phân bố thời gian xử lý trung bình |

#### Chế độ xem dịch vụ Khách hàng

| Component | Loại | Mô tả dữ liệu |
|------|------|----------|
| Việc cần làm của tôi | Thẻ số | Số Ticket cần xử lý |
| Phân bố ưu tiên | Biểu đồ tròn | Phân bố P0/P1/P2/P3 |
| Thống kê hôm nay | Thẻ chỉ số | Số lượng xử lý/giải quyết hôm nay |
| Đếm ngược SLA | Danh sách | 5 Ticket khẩn cấp nhất |

---

## Phụ lục

### A. Cấu hình loại nghiệp vụ

| Mã loại | Tên | Icon | Bảng mở rộng liên kết |
|----------|------|------|------------|
| repair | Sửa chữa thiết bị | 🔧 | nb_tts_biz_repair |
| it_support | Hỗ trợ IT | 💻 | nb_tts_biz_it_support |
| complaint | Khiếu nại Khách hàng | 📢 | nb_tts_biz_complaint |
| consultation | Tư vấn đề xuất | ❓ | Không |
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
| ACCESS | Quyền | Vấn đề quyền tài khoản |
| PROD_INQ | Tư vấn Sản phẩm | Tư vấn Sản phẩm |
| COMPLAINT | Khiếu nại chung | Khiếu nại chung |
| DELAY | Chậm trễ logistics | Khiếu nại chậm trễ logistics |
| DAMAGE | Hỏng đóng gói | Khiếu nại hỏng đóng gói |
| QUANTITY | Thiếu số lượng | Khiếu nại thiếu số lượng |
| SVC_ATTITUDE | Thái độ phục vụ | Khiếu nại thái độ phục vụ |
| PROD_QUALITY | Chất lượng Sản phẩm | Khiếu nại chất lượng Sản phẩm |
| TRAINING | Đào tạo | Yêu cầu đào tạo |
| RETURN | Trả hàng | Yêu cầu trả hàng |

---

*Phiên bản tài liệu: 2.0 | Cập nhật cuối: 2026-01-05*
