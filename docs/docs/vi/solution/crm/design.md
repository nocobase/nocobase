:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/solution/crm/design).
:::

# Thiết kế chi tiết hệ thống CRM 2.0


## 1. Tổng quan hệ thống và triết lý thiết kế

### 1.1 Định vị hệ thống

Hệ thống này là một **nền tảng quản lý bán hàng CRM 2.0** được xây dựng trên nền tảng không mã (no-code) NocoBase. Mục tiêu cốt lõi là:

```
Để nhân viên bán hàng tập trung vào việc xây dựng mối quan hệ với khách hàng, thay vì nhập dữ liệu và phân tích lặp đi lặp lại.
```

Hệ thống xử lý các tác vụ thông thường thông qua tự động hóa luồng công việc và sử dụng AI để hỗ trợ hoàn thành các công việc như chấm điểm đầu mối, phân tích cơ hội kinh doanh, giúp đội ngũ bán hàng nâng cao hiệu suất.

### 1.2 Triết lý thiết kế

#### Triết lý 1: Phễu bán hàng hoàn chỉnh

**Quy trình bán hàng đầu-cuối (End-to-end):**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Tại sao lại thiết kế như vậy?**

| Phương thức truyền thống | CRM tích hợp |
|---------|-----------|
| Sử dụng nhiều hệ thống cho các giai đoạn khác nhau | Một hệ thống duy nhất bao phủ toàn bộ vòng đời |
| Truyền dữ liệu thủ công giữa các hệ thống | Luân chuyển và chuyển đổi dữ liệu tự động |
| Chế độ xem khách hàng không nhất quán | Chế độ xem khách hàng 360 độ thống nhất |
| Phân tích dữ liệu phân tán | Phân tích quy trình bán hàng đầu-cuối |

#### Triết lý 2: Quy trình bán hàng có thể cấu hình
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Các ngành nghề khác nhau có thể tùy chỉnh các giai đoạn của quy trình bán hàng mà không cần sửa đổi mã nguồn.

#### Triết lý 3: Thiết kế mô-đun

- Các mô-đun cốt lõi (Khách hàng + Cơ hội kinh doanh) là bắt buộc, các mô-đun khác có thể được bật theo nhu cầu.
- Việc vô hiệu hóa mô-đun không cần sửa mã, chỉ cần cấu hình thông qua giao diện NocoBase.
- Mỗi mô-đun được thiết kế độc lập để giảm thiểu sự phụ thuộc lẫn nhau.

---

## 2. Kiến trúc mô-đun và tùy chỉnh

### 2.1 Tổng quan mô-đun

Hệ thống CRM áp dụng thiết kế **kiến trúc mô-đun** — mỗi mô-đun có thể được bật hoặc tắt độc lập tùy theo nhu cầu kinh doanh.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Quan hệ phụ thuộc mô-đun

| Mô-đun | Bắt buộc | Phụ thuộc | Điều kiện vô hiệu hóa |
|-----|---------|--------|---------|
| **Quản lý khách hàng** | ✅ Có | - | Không thể vô hiệu hóa (Cốt lõi) |
| **Quản lý cơ hội kinh doanh** | ✅ Có | Quản lý khách hàng | Không thể vô hiệu hóa (Cốt lõi) |
| **Quản lý đầu mối** | Tùy chọn | - | Khi không cần thu thập đầu mối |
| **Quản lý báo giá** | Tùy chọn | Cơ hội, Sản phẩm | Giao dịch đơn giản không cần báo giá chính thức |
| **Quản lý đơn hàng** | Tùy chọn | Cơ hội (hoặc Báo giá) | Khi không cần theo dõi đơn hàng/thanh toán |
| **Quản lý sản phẩm** | Tùy chọn | - | Khi không cần danh mục sản phẩm |
| **Tích hợp Email** | Tùy chọn | Khách hàng, Liên hệ | Khi sử dụng hệ thống email bên ngoài |

### 2.3 Các phiên bản cấu hình sẵn

| Phiên bản | Mô-đun bao gồm | Ngữ cảnh sử dụng | Số lượng bộ sưu tập |
|-----|---------|---------|-----------|
| **Bản rút gọn (Lite)** | Khách hàng + Cơ hội | Theo dõi giao dịch đơn giản | 6 |
| **Bản tiêu chuẩn (Standard)** | Bản rút gọn + Đầu mối + Báo giá + Đơn hàng + Sản phẩm | Chu kỳ bán hàng đầy đủ | 15 |
| **Bản doanh nghiệp (Enterprise)** | Bản tiêu chuẩn + Tích hợp Email | Đầy đủ tính năng bao gồm email | 17 |

### 2.4 Ánh xạ Mô-đun - Bộ sưu tập

#### Bộ sưu tập mô-đun cốt lõi (Luôn bắt buộc)

| Bộ sưu tập | Mô-đun | Mô tả |
|-------|------|------|
| nb_crm_customers | Quản lý khách hàng | Hồ sơ khách hàng/công ty |
| nb_crm_contacts | Quản lý khách hàng | Người liên hệ |
| nb_crm_customer_shares | Quản lý khách hàng | Quyền chia sẻ khách hàng |
| nb_crm_opportunities | Quản lý cơ hội kinh doanh | Cơ hội bán hàng |
| nb_crm_opportunity_stages | Quản lý cơ hội kinh doanh | Cấu hình giai đoạn |
| nb_crm_opportunity_users | Quản lý cơ hội kinh doanh | Người cộng tác cơ hội |
| nb_crm_activities | Quản lý hoạt động | Bản ghi hoạt động |
| nb_crm_comments | Quản lý hoạt động | Bình luận/Ghi chú |
| nb_crm_tags | Cốt lõi | Nhãn chia sẻ |
| nb_cbo_currencies | Dữ liệu nền tảng | Từ điển tiền tệ |
| nb_cbo_regions | Dữ liệu nền tảng | Từ điển quốc gia/khu vực |

### 2.5 Cách vô hiệu hóa mô-đun

Chỉ cần ẩn lối vào menu của mô-đun đó trong trang quản trị NocoBase, không cần sửa mã hoặc xóa bộ sưu tập dữ liệu.

---

## 3. Thực thể cốt lõi và mô hình dữ liệu

### 3.1 Tổng quan quan hệ thực thể
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Chi tiết các bộ sưu tập cốt lõi

#### 3.2.1 Bảng đầu mối (nb_crm_leads)

Quản lý đầu mối sử dụng luồng công việc 4 giai đoạn đơn giản.

**Quy trình giai đoạn:**
```
Mới → Đang xử lý → Đã xác minh → Chuyển đổi thành Khách hàng/Cơ hội
         ↓              ↓
    Không đạt chuẩn   Không đạt chuẩn
```

**Các trường quan trọng:**

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| lead_no | VARCHAR | Số đầu mối (Tự động tạo) |
| name | VARCHAR | Tên người liên hệ |
| company | VARCHAR | Tên công ty |
| title | VARCHAR | Chức vụ |
| email | VARCHAR | Email |
| phone | VARCHAR | Điện thoại |
| mobile_phone | VARCHAR | Di động |
| website | TEXT | Website |
| address | TEXT | Địa chỉ |
| source | VARCHAR | Nguồn đầu mối: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Ngành nghề |
| annual_revenue | VARCHAR | Quy mô doanh thu hàng năm |
| number_of_employees | VARCHAR | Quy mô số lượng nhân viên |
| status | VARCHAR | Trạng thái: new/working/qualified/unqualified |
| rating | VARCHAR | Đánh giá: hot/warm/cold |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| ai_score | INTEGER | Điểm chất lượng AI 0-100 |
| ai_convert_prob | DECIMAL | Xác suất chuyển đổi AI |
| ai_best_contact_time | VARCHAR | Thời gian liên hệ tốt nhất do AI đề xuất |
| ai_tags | JSONB | Nhãn do AI tạo |
| ai_scored_at | TIMESTAMP | Thời gian AI chấm điểm |
| ai_next_best_action | TEXT | Đề xuất hành động tốt nhất tiếp theo của AI |
| ai_nba_generated_at | TIMESTAMP | Thời gian tạo đề xuất AI |
| is_converted | BOOLEAN | Đánh dấu đã chuyển đổi |
| converted_at | TIMESTAMP | Thời gian chuyển đổi |
| converted_customer_id | BIGINT | ID khách hàng được chuyển đổi |
| converted_contact_id | BIGINT | ID người liên hệ được chuyển đổi |
| converted_opportunity_id | BIGINT | ID cơ hội được chuyển đổi |
| lost_reason | TEXT | Lý do thất bại |
| disqualification_reason | TEXT | Lý do không đạt chuẩn |
| description | TEXT | Mô tả |

#### 3.2.2 Bảng khách hàng (nb_crm_customers)

Hỗ trợ quản lý khách hàng/công ty cho kinh doanh quốc tế.

**Các trường quan trọng:**

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| name | VARCHAR | Tên khách hàng (Bắt buộc) |
| account_number | VARCHAR | Mã khách hàng (Tự động tạo, duy nhất) |
| phone | VARCHAR | Điện thoại |
| website | TEXT | Website |
| address | TEXT | Địa chỉ |
| industry | VARCHAR | Ngành nghề |
| type | VARCHAR | Loại: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Quy mô số lượng nhân viên |
| annual_revenue | VARCHAR | Quy mô doanh thu hàng năm |
| level | VARCHAR | Cấp độ: normal/important/vip |
| status | VARCHAR | Trạng thái: potential/active/dormant/churned |
| country | VARCHAR | Quốc gia |
| region_id | BIGINT | Khu vực (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Tiền tệ ưu tiên: CNY/USD/EUR |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| parent_id | BIGINT | Công ty mẹ (FK → self) |
| source_lead_id | BIGINT | ID đầu mối nguồn |
| ai_health_score | INTEGER | Điểm sức khỏe AI 0-100 |
| ai_health_grade | VARCHAR | Xếp hạng sức khỏe AI: A/B/C/D |
| ai_churn_risk | DECIMAL | Rủi ro rời bỏ AI 0-100% |
| ai_churn_risk_level | VARCHAR | Mức độ rủi ro rời bỏ AI: low/medium/high |
| ai_health_dimensions | JSONB | Điểm các chiều sức khỏe AI |
| ai_recommendations | JSONB | Danh sách đề xuất AI |
| ai_health_assessed_at | TIMESTAMP | Thời gian đánh giá sức khỏe AI |
| ai_tags | JSONB | Nhãn do AI tạo |
| ai_best_contact_time | VARCHAR | Thời gian liên hệ tốt nhất do AI đề xuất |
| ai_next_best_action | TEXT | Đề xuất hành động tốt nhất tiếp theo của AI |
| ai_nba_generated_at | TIMESTAMP | Thời gian tạo đề xuất AI |
| description | TEXT | Mô tả |
| is_deleted | BOOLEAN | Đánh dấu xóa mềm |

#### 3.2.3 Bảng cơ hội kinh doanh (nb_crm_opportunities)

Quản lý cơ hội bán hàng với các giai đoạn quy trình có thể cấu hình.

**Các trường quan trọng:**

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| opportunity_no | VARCHAR | Mã cơ hội (Tự động tạo, duy nhất) |
| name | VARCHAR | Tên cơ hội (Bắt buộc) |
| amount | DECIMAL | Số tiền dự kiến |
| currency | VARCHAR | Tiền tệ |
| exchange_rate | DECIMAL | Tỷ giá hối đoái |
| amount_usd | DECIMAL | Số tiền tương đương USD |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Người liên hệ chính (FK) |
| stage | VARCHAR | Mã giai đoạn (FK → stages.code) |
| stage_sort | INTEGER | Thứ tự giai đoạn (Dư thừa để dễ sắp xếp) |
| stage_entered_at | TIMESTAMP | Thời gian vào giai đoạn hiện tại |
| days_in_stage | INTEGER | Số ngày ở giai đoạn hiện tại |
| win_probability | DECIMAL | Tỷ lệ thắng thủ công |
| ai_win_probability | DECIMAL | Tỷ lệ thắng dự đoán bởi AI |
| ai_analyzed_at | TIMESTAMP | Thời gian AI phân tích |
| ai_confidence | DECIMAL | Độ tin cậy dự đoán của AI |
| ai_trend | VARCHAR | Xu hướng dự đoán AI: up/stable/down |
| ai_risk_factors | JSONB | Các yếu tố rủi ro AI nhận diện |
| ai_recommendations | JSONB | Danh sách đề xuất AI |
| ai_predicted_close | DATE | Ngày đóng dự kiến bởi AI |
| ai_next_best_action | TEXT | Đề xuất hành động tốt nhất tiếp theo của AI |
| ai_nba_generated_at | TIMESTAMP | Thời gian tạo đề xuất AI |
| expected_close_date | DATE | Ngày đóng dự kiến |
| actual_close_date | DATE | Ngày đóng thực tế |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| last_activity_at | TIMESTAMP | Thời gian hoạt động cuối cùng |
| stagnant_days | INTEGER | Số ngày không có hoạt động |
| loss_reason | TEXT | Lý do thất bại |
| competitor_id | BIGINT | Đối thủ cạnh tranh (FK) |
| lead_source | VARCHAR | Nguồn đầu mối |
| campaign_id | BIGINT | ID chiến dịch marketing |
| expected_revenue | DECIMAL | Doanh thu dự kiến = amount × probability |
| description | TEXT | Mô tả |

#### 3.2.4 Bảng báo giá (nb_crm_quotations)

Quản lý báo giá hỗ trợ đa tiền tệ và luồng phê duyệt.

**Quy trình trạng thái:**
```
Nháp → Chờ phê duyệt → Đã phê duyệt → Đã gửi → Đã chấp nhận/Đã từ chối/Đã hết hạn
              ↓
          Bị từ chối → Sửa đổi → Nháp
```

**Các trường quan trọng:**

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| quotation_no | VARCHAR | Số báo giá (Tự động tạo, duy nhất) |
| name | VARCHAR | Tên báo giá |
| version | INTEGER | Số phiên bản |
| opportunity_id | BIGINT | Cơ hội (FK, Bắt buộc) |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Người liên hệ (FK) |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| currency_id | BIGINT | Tiền tệ (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Tỷ giá hối đoái |
| subtotal | DECIMAL | Tạm tính |
| discount_rate | DECIMAL | Tỷ lệ chiết khấu |
| discount_amount | DECIMAL | Số tiền chiết khấu |
| shipping_handling | DECIMAL | Phí vận chuyển/xử lý |
| tax_rate | DECIMAL | Thuế suất |
| tax_amount | DECIMAL | Tiền thuế |
| total_amount | DECIMAL | Tổng số tiền |
| total_amount_usd | DECIMAL | Số tiền tương đương USD |
| status | VARCHAR | Trạng thái: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Thời gian nộp |
| approved_by | BIGINT | Người phê duyệt (FK → users) |
| approved_at | TIMESTAMP | Thời gian phê duyệt |
| rejected_at | TIMESTAMP | Thời gian bác bỏ |
| sent_at | TIMESTAMP | Thời gian gửi |
| customer_response_at | TIMESTAMP | Thời gian khách hàng phản hồi |
| expired_at | TIMESTAMP | Thời gian hết hạn |
| valid_until | DATE | Có hiệu lực đến |
| payment_terms | TEXT | Điều khoản thanh toán |
| terms_condition | TEXT | Điều khoản và điều kiện |
| address | TEXT | Địa chỉ giao hàng |
| description | TEXT | Mô tả |

#### 3.2.5 Bảng đơn hàng (nb_crm_orders)

Quản lý đơn hàng bao gồm theo dõi thanh toán.

**Các trường quan trọng:**

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_no | VARCHAR | Số đơn hàng (Tự động tạo, duy nhất) |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Người liên hệ (FK) |
| opportunity_id | BIGINT | Cơ hội (FK) |
| quotation_id | BIGINT | Báo giá (FK) |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| currency | VARCHAR | Tiền tệ |
| exchange_rate | DECIMAL | Tỷ giá hối đoái |
| order_amount | DECIMAL | Giá trị đơn hàng |
| paid_amount | DECIMAL | Số tiền đã thanh toán |
| unpaid_amount | DECIMAL | Số tiền chưa thanh toán |
| status | VARCHAR | Trạng thái: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Trạng thái thanh toán: unpaid/partial/paid |
| order_date | DATE | Ngày đặt hàng |
| delivery_date | DATE | Ngày giao hàng dự kiến |
| actual_delivery_date | DATE | Ngày giao hàng thực tế |
| shipping_address | TEXT | Địa chỉ giao hàng |
| logistics_company | VARCHAR | Công ty vận chuyển |
| tracking_no | VARCHAR | Mã vận đơn |
| terms_condition | TEXT | Điều khoản và điều kiện |
| description | TEXT | Mô tả |

### 3.3 Tổng hợp các bộ sưu tập

#### Bộ sưu tập nghiệp vụ CRM

| STT | Tên bộ sưu tập | Mô tả | Loại |
|-----|------|------|------|
| 1 | nb_crm_leads | Quản lý đầu mối | Nghiệp vụ |
| 2 | nb_crm_customers | Khách hàng/Công ty | Nghiệp vụ |
| 3 | nb_crm_contacts | Người liên hệ | Nghiệp vụ |
| 4 | nb_crm_opportunities | Cơ hội bán hàng | Nghiệp vụ |
| 5 | nb_crm_opportunity_stages | Cấu hình giai đoạn | Cấu hình |
| 6 | nb_crm_opportunity_users | Người cộng tác cơ hội (Đội ngũ bán hàng) | Liên kết |
| 7 | nb_crm_quotations | Báo giá | Nghiệp vụ |
| 8 | nb_crm_quotation_items | Chi tiết báo giá | Nghiệp vụ |
| 9 | nb_crm_quotation_approvals | Bản ghi phê duyệt | Nghiệp vụ |
| 10 | nb_crm_orders | Đơn hàng | Nghiệp vụ |
| 11 | nb_crm_order_items | Chi tiết đơn hàng | Nghiệp vụ |
| 12 | nb_crm_payments | Bản ghi thu tiền | Nghiệp vụ |
| 13 | nb_crm_products | Danh mục sản phẩm | Nghiệp vụ |
| 14 | nb_crm_product_categories | Phân loại sản phẩm | Cấu hình |
| 15 | nb_crm_price_tiers | Định giá theo cấp bậc | Cấu hình |
| 16 | nb_crm_activities | Bản ghi hoạt động | Nghiệp vụ |
| 17 | nb_crm_comments | Bình luận/Ghi chú | Nghiệp vụ |
| 18 | nb_crm_competitors | Đối thủ cạnh tranh | Nghiệp vụ |
| 19 | nb_crm_tags | Nhãn | Cấu hình |
| 20 | nb_crm_lead_tags | Liên kết Đầu mối-Nhãn | Liên kết |
| 21 | nb_crm_contact_tags | Liên kết Người liên hệ-Nhãn | Liên kết |
| 22 | nb_crm_customer_shares | Quyền chia sẻ khách hàng | Liên kết |
| 23 | nb_crm_exchange_rates | Lịch sử tỷ giá | Cấu hình |

#### Bộ sưu tập dữ liệu nền tảng (Mô-đun dùng chung)

| STT | Tên bộ sưu tập | Mô tả | Loại |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Từ điển tiền tệ | Cấu hình |
| 2 | nb_cbo_regions | Từ điển quốc gia/khu vực | Cấu hình |

### 3.4 Các bộ sưu tập phụ trợ

#### 3.4.1 Bảng bình luận (nb_crm_comments)

Bảng bình luận/ghi chú chung, có thể liên kết với nhiều loại đối tượng nghiệp vụ.

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| content | TEXT | Nội dung bình luận |
| lead_id | BIGINT | Liên kết đầu mối (FK) |
| customer_id | BIGINT | Liên kết khách hàng (FK) |
| opportunity_id | BIGINT | Liên kết cơ hội (FK) |
| order_id | BIGINT | Liên kết đơn hàng (FK) |

#### 3.4.2 Bảng chia sẻ khách hàng (nb_crm_customer_shares)

Thực hiện cộng tác nhiều người và chia sẻ quyền hạn đối với khách hàng.

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| customer_id | BIGINT | Khách hàng (FK, Bắt buộc) |
| shared_with_user_id | BIGINT | Người dùng được chia sẻ (FK, Bắt buộc) |
| shared_by_user_id | BIGINT | Người khởi tạo chia sẻ (FK) |
| permission_level | VARCHAR | Cấp độ quyền: read/write/full |
| shared_at | TIMESTAMP | Thời gian chia sẻ |

#### 3.4.3 Bảng người cộng tác cơ hội (nb_crm_opportunity_users)

Hỗ trợ đội ngũ bán hàng cộng tác trên các cơ hội kinh doanh.

| Trường | Loại | Mô tả |
|-----|------|------|
| opportunity_id | BIGINT | Cơ hội (FK, Khóa chính hỗn hợp) |
| user_id | BIGINT | Người dùng (FK, Khóa chính hỗn hợp) |
| role | VARCHAR | Vai trò: owner/collaborator/viewer |

#### 3.4.4 Bảng khu vực (nb_cbo_regions)

Từ điển dữ liệu nền tảng quốc gia/khu vực.

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| code_alpha2 | VARCHAR | Mã 2 chữ cái ISO 3166-1 (Duy nhất) |
| code_alpha3 | VARCHAR | Mã 3 chữ cái ISO 3166-1 (Duy nhất) |
| code_numeric | VARCHAR | Mã số ISO 3166-1 |
| name | VARCHAR | Tên quốc gia/khu vực |
| is_active | BOOLEAN | Có kích hoạt không |
| sort_order | INTEGER | Thứ tự sắp xếp |

---

## 4. Vòng đời đầu mối

Quản lý đầu mối sử dụng luồng công việc 4 giai đoạn đơn giản. Khi đầu mối mới được tạo, luồng công việc có thể tự động kích hoạt chấm điểm AI để hỗ trợ nhân viên bán hàng nhanh chóng nhận diện các đầu mối chất lượng cao.

### 4.1 Định nghĩa trạng thái

| Trạng thái | Tên | Mô tả |
|-----|------|------|
| new | Mới | Vừa được tạo, chờ liên hệ |
| working | Đang xử lý | Đang tích cực theo dõi |
| qualified | Đã xác minh | Sẵn sàng chuyển đổi |
| unqualified | Không đạt chuẩn | Không phù hợp |

### 4.2 Sơ đồ luồng trạng thái

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Quy trình chuyển đổi đầu mối

Giao diện chuyển đổi cung cấp đồng thời ba tùy chọn, người dùng có thể chọn tạo mới hoặc liên kết:

- **Khách hàng**: Tạo khách hàng mới HOẶC liên kết khách hàng hiện có
- **Người liên hệ**: Tạo người liên hệ mới (liên kết với khách hàng)
- **Cơ hội kinh doanh**: Bắt buộc phải tạo cơ hội kinh doanh
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Bản ghi sau chuyển đổi:**
- `converted_customer_id`: ID khách hàng liên kết
- `converted_contact_id`: ID người liên hệ liên kết
- `converted_opportunity_id`: ID cơ hội kinh doanh được tạo

---

## 5. Vòng đời cơ hội kinh doanh

Quản lý cơ hội kinh doanh sử dụng các giai đoạn quy trình bán hàng có thể cấu hình. Khi giai đoạn cơ hội thay đổi, hệ thống có thể tự động kích hoạt dự đoán tỷ lệ thắng của AI, giúp nhân viên bán hàng nhận diện rủi ro và cơ hội.

### 5.1 Các giai đoạn có thể cấu hình

Các giai đoạn được lưu trữ trong bảng `nb_crm_opportunity_stages`, có thể tùy chỉnh:

| Mã | Tên | Thứ tự | Tỷ lệ thắng mặc định |
|-----|------|------|---------|
| prospecting | Tiếp cận ban đầu | 1 | 10% |
| analysis | Phân tích nhu cầu | 2 | 30% |
| proposal | Đề xuất giải pháp | 3 | 60% |
| negotiation | Đàm phán thương mại | 4 | 80% |
| won | Thắng đơn hàng | 5 | 100% |
| lost | Thất bại | 6 | 0% |

### 5.2 Quy trình bán hàng
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Phát hiện đình trệ

Các cơ hội không có hoạt động sẽ được đánh dấu:

| Số ngày không hoạt động | Hành động |
|-----------|------|
| 7 ngày | Cảnh báo màu vàng |
| 14 ngày | Nhắc nhở màu cam cho người phụ trách |
| 30 ngày | Nhắc nhở màu đỏ cho quản lý |

```sql
-- Tính toán số ngày đình trệ
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Xử lý Thắng/Thua đơn hàng

**Khi thắng đơn:**
1. Cập nhật giai đoạn thành 'won'
2. Ghi lại ngày đóng thực tế
3. Cập nhật trạng thái khách hàng thành 'active'
4. Kích hoạt tạo đơn hàng (nếu báo giá được chấp nhận)

**Khi thua đơn:**
1. Cập nhật giai đoạn thành 'lost'
2. Ghi lại lý do thất bại
3. Ghi lại ID đối thủ cạnh tranh (nếu thua đối thủ)
4. Thông báo cho quản lý

---

## 6. Vòng đời báo giá

### 6.1 Định nghĩa trạng thái

| Trạng thái | Tên | Mô tả |
|-----|------|------|
| draft | Nháp | Đang chuẩn bị |
| pending_approval | Chờ phê duyệt | Đang chờ phê duyệt |
| approved | Đã phê duyệt | Có thể gửi đi |
| sent | Đã gửi | Đã gửi cho khách hàng |
| accepted | Đã chấp nhận | Khách hàng đã chấp nhận |
| rejected | Đã từ chối | Khách hàng đã từ chối |
| expired | Đã hết hạn | Vượt quá thời gian hiệu lực |

### 6.2 Quy tắc phê duyệt (Đang hoàn thiện)

Luồng phê duyệt được kích hoạt dựa trên các điều kiện sau:

| Điều kiện | Cấp phê duyệt |
|------|---------|
| Chiết khấu > 10% | Quản lý bán hàng |
| Chiết khấu > 20% | Giám đốc bán hàng |
| Số tiền > $100K | Tài chính + Tổng giám đốc |

### 6.3 Hỗ trợ đa tiền tệ

#### Triết lý thiết kế

Sử dụng **USD làm tiền tệ cơ sở thống nhất** cho tất cả các báo cáo và phân tích. Mỗi bản ghi số tiền lưu trữ:
- Tiền tệ và số tiền gốc (khách hàng nhìn thấy)
- Tỷ giá hối đoái tại thời điểm giao dịch
- Số tiền tương đương USD (dùng cho so sánh nội bộ)

#### Bảng từ điển tiền tệ (nb_cbo_currencies)

Cấu hình tiền tệ sử dụng bảng dữ liệu nền tảng chung, hỗ trợ quản lý động. Trường `current_rate` lưu trữ tỷ giá hiện tại, được cập nhật bởi tác vụ định kỳ từ bản ghi ngày gần nhất trong `nb_crm_exchange_rates`.

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| code | VARCHAR | Mã tiền tệ (Duy nhất): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Tên tiền tệ |
| symbol | VARCHAR | Ký hiệu tiền tệ |
| decimal_places | INTEGER | Số chữ số thập phân |
| current_rate | DECIMAL | Tỷ giá hiện tại so với USD (Đồng bộ định kỳ từ lịch sử tỷ giá) |
| is_active | BOOLEAN | Có kích hoạt không |
| sort_order | INTEGER | Thứ tự sắp xếp |

#### Bảng lịch sử tỷ giá (nb_crm_exchange_rates)

Ghi lại dữ liệu tỷ giá lịch sử, tác vụ định kỳ sẽ đồng bộ tỷ giá mới nhất vào `nb_cbo_currencies.current_rate`.

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| currency_code | VARCHAR | Mã tiền tệ (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Tỷ giá so với USD |
| effective_date | DATE | Ngày có hiệu lực |
| source | VARCHAR | Nguồn tỷ giá: manual/api |
| createdAt | TIMESTAMP | Thời gian tạo |

> **Lưu ý**: Báo giá liên kết với bảng `nb_cbo_currencies` qua khóa ngoại `currency_id`, tỷ giá được lấy trực tiếp từ trường `current_rate`. Cơ hội và đơn hàng sử dụng trường VARCHAR `currency` để lưu mã tiền tệ.

#### Mô hình trường số tiền

Các bảng chứa số tiền tuân theo mô hình này:

| Trường | Loại | Mô tả |
|-----|------|------|
| currency | VARCHAR | Tiền tệ giao dịch |
| amount | DECIMAL | Số tiền nguyên tệ |
| exchange_rate | DECIMAL | Tỷ giá so với USD tại thời điểm giao dịch |
| amount_usd | DECIMAL | Tương đương USD (Tính toán) |

**Áp dụng cho:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Tích hợp luồng công việc
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logic lấy tỷ giá:**
1. Khi thực hiện nghiệp vụ, lấy tỷ giá trực tiếp từ `nb_cbo_currencies.current_rate`
2. Giao dịch USD: Tỷ giá = 1.0, không cần tra cứu
3. `current_rate` được đồng bộ bởi tác vụ định kỳ từ bản ghi mới nhất của `nb_crm_exchange_rates`

### 6.4 Quản lý phiên bản

Khi báo giá bị từ chối hoặc hết hạn, có thể sao chép thành phiên bản mới:

```
QT-20260119-001 v1 → Đã từ chối
QT-20260119-001 v2 → Đã gửi
QT-20260119-001 v3 → Đã chấp nhận
```

---

## 7. Vòng đời đơn hàng

### 7.1 Tổng quan đơn hàng

Đơn hàng được tạo khi báo giá được chấp nhận, đại diện cho một cam kết kinh doanh đã xác nhận.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Định nghĩa trạng thái đơn hàng

| Trạng thái | Mã | Mô tả | Thao tác cho phép |
|-----|------|------|---------|
| Nháp | `draft` | Đơn hàng đã tạo, chưa xác nhận | Sửa, Xác nhận, Hủy |
| Đã xác nhận | `confirmed` | Đơn hàng đã xác nhận, chờ thực hiện | Bắt đầu thực hiện, Hủy |
| Đang xử lý | `in_progress` | Đơn hàng đang được xử lý/sản xuất | Cập nhật tiến độ, Giao hàng, Hủy (cần phê duyệt) |
| Đã giao hàng | `shipped` | Sản phẩm đã được gửi đi | Đánh dấu đã nhận |
| Đã nhận hàng | `delivered` | Khách hàng đã nhận được hàng | Hoàn thành đơn hàng |
| Đã hoàn thành | `completed` | Đơn hàng đã hoàn tất hoàn toàn | Không |
| Đã hủy | `cancelled` | Đơn hàng đã bị hủy | Không |

### 7.3 Mô hình dữ liệu đơn hàng

#### nb_crm_orders

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_no | VARCHAR | Số đơn hàng (Tự động tạo, duy nhất) |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Người liên hệ (FK) |
| opportunity_id | BIGINT | Cơ hội (FK) |
| quotation_id | BIGINT | Báo giá (FK) |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| status | VARCHAR | Trạng thái đơn hàng |
| payment_status | VARCHAR | Trạng thái thanh toán: unpaid/partial/paid |
| order_date | DATE | Ngày đặt hàng |
| delivery_date | DATE | Ngày giao hàng dự kiến |
| actual_delivery_date | DATE | Ngày giao hàng thực tế |
| currency | VARCHAR | Tiền tệ đơn hàng |
| exchange_rate | DECIMAL | Tỷ giá so với USD |
| order_amount | DECIMAL | Tổng giá trị đơn hàng |
| paid_amount | DECIMAL | Số tiền đã thanh toán |
| unpaid_amount | DECIMAL | Số tiền chưa thanh toán |
| shipping_address | TEXT | Địa chỉ giao hàng |
| logistics_company | VARCHAR | Công ty vận chuyển |
| tracking_no | VARCHAR | Mã vận đơn |
| terms_condition | TEXT | Điều khoản và điều kiện |
| description | TEXT | Mô tả |

#### nb_crm_order_items

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_id | FK | Đơn hàng cha |
| product_id | FK | Tham chiếu sản phẩm |
| product_name | VARCHAR | Ảnh chụp tên sản phẩm |
| quantity | INT | Số lượng đặt hàng |
| unit_price | DECIMAL | Đơn giá |
| discount_percent | DECIMAL | Phần trăm chiết khấu |
| line_total | DECIMAL | Tổng cộng dòng |
| notes | TEXT | Ghi chú dòng |

### 7.4 Theo dõi thu tiền

#### nb_crm_payments

| Trường | Loại | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_id | BIGINT | Đơn hàng liên kết (FK, Bắt buộc) |
| customer_id | BIGINT | Khách hàng (FK) |
| payment_no | VARCHAR | Số thanh toán (Tự động tạo, duy nhất) |
| amount | DECIMAL | Số tiền thanh toán (Bắt buộc) |
| currency | VARCHAR | Tiền tệ thanh toán |
| payment_method | VARCHAR | Phương thức: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Ngày thanh toán |
| bank_account | VARCHAR | Số tài khoản ngân hàng |
| bank_name | VARCHAR | Tên ngân hàng |
| notes | TEXT | Ghi chú thanh toán |

---

## 8. Vòng đời khách hàng

### 8.1 Tổng quan khách hàng

Khách hàng được tạo khi chuyển đổi đầu mối hoặc khi thắng đơn hàng từ cơ hội. Hệ thống theo dõi toàn bộ vòng đời từ khi có được khách hàng đến khi họ trở thành người ủng hộ.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Định nghĩa trạng thái khách hàng

| Trạng thái | Mã | Sức khỏe | Mô tả |
|-----|------|--------|------|
| Tiềm năng | `prospect` | Không | Đầu mối đã chuyển đổi, chưa có đơn hàng |
| Hoạt động | `active` | ≥70 | Khách hàng trả phí, tương tác tốt |
| Tăng trưởng | `growing` | ≥80 | Khách hàng có cơ hội mở rộng |
| Rủi ro | `at_risk` | <50 | Khách hàng có dấu hiệu rời bỏ |
| Rời bỏ | `churned` | Không | Không còn hoạt động |
| Thu hồi | `win_back` | Không | Khách hàng cũ đang được kích hoạt lại |
| Người ủng hộ | `advocate` | ≥90 | Độ hài lòng cao, cung cấp giới thiệu |

### 8.3 Chấm điểm sức khỏe khách hàng

Sức khỏe khách hàng được tính toán dựa trên nhiều yếu tố:

| Yếu tố | Trọng số | Chỉ số đo lường |
|-----|------|---------|
| Thời gian mua gần nhất | 25% | Số ngày kể từ đơn hàng cuối |
| Tần suất mua hàng | 20% | Số lượng đơn hàng mỗi giai đoạn |
| Giá trị tiền tệ | 20% | Tổng giá trị và giá trị đơn hàng trung bình |
| Mức độ tương tác | 15% | Tỷ lệ mở email, tham gia họp |
| Sức khỏe hỗ trợ | 10% | Số lượng phiếu hỗ trợ và tỷ lệ giải quyết |
| Sử dụng sản phẩm | 10% | Chỉ số sử dụng tích cực (nếu có) |

**Ngưỡng sức khỏe:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Phân khúc khách hàng

#### Phân khúc tự động

| Phân khúc | Điều kiện | Hành động đề xuất |
|-----|------|---------|
| VIP | Giá trị vòng đời > $100K | Dịch vụ đặc biệt, sự bảo trợ của lãnh đạo |
| Doanh nghiệp | Quy mô công ty > 500 người | Quản lý tài khoản chuyên trách |
| Tầm trung | Quy mô công ty 50-500 người | Thăm hỏi định kỳ, hỗ trợ theo quy mô |
| Khởi nghiệp | Quy mô công ty < 50 người | Tài nguyên tự phục vụ, cộng đồng |
| Ngủ đông | 90+ ngày không hoạt động | Marketing tái kích hoạt |

---

## 9. Tích hợp Email

### 9.1 Tổng quan

NocoBase cung cấp plugin tích hợp email tích hợp sẵn, hỗ trợ Gmail và Outlook. Sau khi email được đồng bộ vào hệ thống, luồng công việc có thể tự động kích hoạt AI để phân tích cảm xúc và ý định của email, giúp nhân viên bán hàng nhanh chóng hiểu được thái độ của khách hàng.

### 9.2 Đồng bộ Email

**Các hòm thư hỗ trợ:**
- Gmail (qua OAuth 2.0)
- Outlook/Microsoft 365 (qua OAuth 2.0)

**Hành vi đồng bộ:**
- Đồng bộ hai chiều email gửi và nhận
- Tự động liên kết email với các bản ghi CRM (Đầu mối, Liên hệ, Cơ hội)
- Tệp đính kèm được lưu trữ trong hệ thống tệp của NocoBase

### 9.3 Liên kết Email-CRM (Đang hoàn thiện)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Mẫu Email

Nhân viên bán hàng có thể sử dụng các mẫu có sẵn:

| Loại mẫu | Ví dụ |
|---------|------|
| Tiếp cận lần đầu | Email lạnh, Giới thiệu nồng nhiệt, Theo dõi sự kiện |
| Theo dõi | Theo dõi sau họp, Theo dõi giải pháp, Nhắc nhở khi không phản hồi |
| Báo giá | Báo giá đính kèm, Sửa đổi báo giá, Báo giá sắp hết hạn |
| Đơn hàng | Xác nhận đơn hàng, Thông báo giao hàng, Xác nhận đã nhận |
| Thành công khách hàng | Chào mừng, Thăm hỏi, Yêu cầu đánh giá |

---

## 10. Khả năng hỗ trợ của AI

### 10.1 Đội ngũ nhân viên AI

Hệ thống CRM tích hợp plugin AI của NocoBase, tái sử dụng các nhân viên AI tích hợp sẵn sau đây và cấu hình các nhiệm vụ chuyên biệt cho ngữ cảnh CRM:

| ID | Tên | Chức danh tích hợp | Khả năng mở rộng CRM |
|----|------|---------|-------------|
| viz | Viz | Chuyên gia phân tích dữ liệu | Phân tích dữ liệu bán hàng, dự báo quy trình |
| dara | Dara | Chuyên gia biểu đồ | Trực quan hóa dữ liệu, phát triển báo cáo, thiết kế dashboard |
| ellis | Ellis | Biên tập viên | Soạn thảo phản hồi email, tóm tắt giao tiếp, soạn thảo email kinh doanh |
| lexi | Lexi | Thông dịch viên | Giao tiếp khách hàng đa ngôn ngữ, dịch nội dung |
| orin | Orin | Người tổ chức | Ưu tiên hàng ngày, đề xuất bước tiếp theo, kế hoạch theo dõi |

### 10.2 Danh sách nhiệm vụ AI

Khả năng AI được chia thành hai loại, độc lập với nhau:

#### I. Nhân viên AI (Kích hoạt từ khối giao diện người dùng)

Thông qua khối nhân viên AI ở giao diện người dùng, người dùng tương tác trực tiếp với AI để nhận phân tích và đề xuất.

| Nhân viên | Nhiệm vụ | Mô tả |
|------|------|------|
| Viz | Phân tích dữ liệu bán hàng | Phân tích xu hướng quy trình, tỷ lệ chuyển đổi |
| Viz | Dự báo quy trình | Dự báo doanh thu dựa trên quy trình có trọng số |
| Dara | Tạo biểu đồ | Tạo các biểu đồ báo cáo bán hàng |
| Dara | Thiết kế dashboard | Thiết kế bố cục dashboard dữ liệu |
| Ellis | Soạn thảo phản hồi | Tạo các phản hồi email chuyên nghiệp |
| Ellis | Tóm tắt giao tiếp | Tóm tắt các chuỗi email |
| Ellis | Soạn thảo email kinh doanh | Email mời họp, theo dõi, cảm ơn, v.v. |
| Orin | Ưu tiên hàng ngày | Tạo danh sách nhiệm vụ ưu tiên trong ngày |
| Orin | Đề xuất bước tiếp theo | Đề xuất hành động tiếp theo cho mỗi cơ hội |
| Lexi | Dịch nội dung | Dịch tài liệu marketing, giải pháp, email |

#### II. Nút LLM trong luồng công việc (Tự động thực thi ở hậu đài)

Các nút LLM được lồng trong luồng công việc, tự động kích hoạt qua sự kiện bộ sưu tập, sự kiện thao tác, tác vụ định kỳ, v.v., không liên quan đến nhân viên AI.

| Nhiệm vụ | Cách kích hoạt | Mô tả | Trường ghi vào |
|------|---------|------|---------|
| Chấm điểm đầu mối | Sự kiện bộ sưu tập (Tạo/Cập nhật) | Đánh giá chất lượng đầu mối | ai_score, ai_convert_prob |
| Dự đoán tỷ lệ thắng | Sự kiện bộ sưu tập (Thay đổi giai đoạn) | Dự đoán khả năng thành công của cơ hội | ai_win_probability, ai_risk_factors |

> **Lưu ý**: Các nút LLM trong luồng công việc sử dụng câu lệnh (prompt) và Schema để xuất ra JSON có cấu trúc, sau khi phân tích sẽ ghi vào các trường dữ liệu nghiệp vụ mà không cần người dùng can thiệp.

### 10.3 Các trường AI trong cơ sở dữ liệu

| Bảng | Trường AI | Mô tả |
|----|--------|------|
| nb_crm_leads | ai_score | Điểm AI 0-100 |
| | ai_convert_prob | Xác suất chuyển đổi |
| | ai_best_contact_time | Thời gian liên hệ tốt nhất |
| | ai_tags | Nhãn do AI tạo (JSONB) |
| | ai_scored_at | Thời gian chấm điểm |
| | ai_next_best_action | Đề xuất hành động tốt nhất tiếp theo |
| | ai_nba_generated_at | Thời gian tạo đề xuất |
| nb_crm_opportunities | ai_win_probability | Tỷ lệ thắng dự đoán bởi AI |
| | ai_analyzed_at | Thời gian phân tích |
| | ai_confidence | Độ tin cậy dự đoán |
| | ai_trend | Xu hướng: up/stable/down |
| | ai_risk_factors | Các yếu tố rủi ro (JSONB) |
| | ai_recommendations | Danh sách đề xuất (JSONB) |
| | ai_predicted_close | Ngày đóng dự kiến bởi AI |
| | ai_next_best_action | Đề xuất hành động tốt nhất tiếp theo |
| | ai_nba_generated_at | Thời gian tạo đề xuất |
| nb_crm_customers | ai_health_score | Điểm sức khỏe 0-100 |
| | ai_health_grade | Xếp hạng sức khỏe: A/B/C/D |
| | ai_churn_risk | Rủi ro rời bỏ 0-100% |
| | ai_churn_risk_level | Mức độ rủi ro rời bỏ: low/medium/high |
| | ai_health_dimensions | Điểm các chiều (JSONB) |
| | ai_recommendations | Danh sách đề xuất (JSONB) |
| | ai_health_assessed_at | Thời gian đánh giá sức khỏe |
| | ai_tags | Nhãn do AI tạo (JSONB) |
| | ai_best_contact_time | Thời gian liên hệ tốt nhất |
| | ai_next_best_action | Đề xuất hành động tốt nhất tiếp theo |
| | ai_nba_generated_at | Thời gian tạo đề xuất |

---

## 11. Công cụ luồng công việc

### 11.1 Các luồng công việc đã thực hiện

| Tên luồng công việc | Loại kích hoạt | Trạng thái | Giải thích |
|-----------|---------|------|------|
| Leads Created | Sự kiện bộ sưu tập | Bật | Kích hoạt khi đầu mối được tạo |
| CRM Overall Analytics | Sự kiện nhân viên AI | Bật | Phân tích dữ liệu CRM tổng thể |
| Lead Conversion | Sự kiện sau thao tác | Bật | Quy trình chuyển đổi đầu mối |
| Lead Assignment | Sự kiện bộ sưu tập | Bật | Tự động phân bổ đầu mối |
| Lead Scoring | Sự kiện bộ sưu tập | Tắt | Chấm điểm đầu mối (Đang hoàn thiện) |
| Follow-up Reminder | Tác vụ định kỳ | Tắt | Nhắc nhở theo dõi (Đang hoàn thiện) |

### 11.2 Các luồng công việc chờ thực hiện

| Luồng công việc | Loại kích hoạt | Giải thích |
|-------|---------|------|
| Thúc đẩy giai đoạn cơ hội | Sự kiện bộ sưu tập | Cập nhật tỷ lệ thắng, ghi lại thời gian khi đổi giai đoạn |
| Phát hiện đình trệ cơ hội | Tác vụ định kỳ | Phát hiện cơ hội không hoạt động, gửi nhắc nhở |
| Phê duyệt báo giá | Sự kiện sau thao tác | Quy trình phê duyệt nhiều cấp |
| Tạo đơn hàng | Sự kiện sau thao tác | Tự động tạo đơn hàng sau khi báo giá được chấp nhận |

---

## 12. Thiết kế menu và giao diện

### 12.1 Cấu trúc quản trị hậu đài

| Menu | Loại | Giải thích |
|------|------|------|
| **Dashboards** | Nhóm | Các bảng điều khiển |
| - Dashboard | Trang | Dashboard mặc định |
| - SalesManager | Trang | Chế độ xem cho Quản lý bán hàng |
| - SalesRep | Trang | Chế độ xem cho Nhân viên bán hàng |
| - Executive | Trang | Chế độ xem cho Ban lãnh đạo |
| **Leads** | Trang | Quản lý đầu mối |
| **Customers** | Trang | Quản lý khách hàng |
| **Opportunities** | Trang | Quản lý cơ hội kinh doanh |
| - Table | Tab | Danh sách cơ hội |
| **Products** | Trang | Quản lý sản phẩm |
| - Categories | Tab | Phân loại sản phẩm |
| **Orders** | Trang | Quản lý đơn hàng |
| **Settings** | Nhóm | Cài đặt |
| - Stage Settings | Trang | Cấu hình giai đoạn cơ hội |
| - Exchange Rate | Trang | Cài đặt tỷ giá |
| - Activity | Trang | Bản ghi hoạt động |
| - Emails | Trang | Quản lý email |
| - Contacts | Trang | Quản lý người liên hệ |
| - Data Analysis | Trang | Phân tích dữ liệu |

### 12.2 Các chế độ xem Dashboard

#### Chế độ xem Quản lý bán hàng

| Thành phần | Loại | Dữ liệu |
|-----|------|------|
| Giá trị quy trình | Thẻ KPI | Tổng giá trị quy trình theo từng giai đoạn |
| Bảng xếp hạng đội ngũ | Bảng | Xếp hạng hiệu suất của nhân viên |
| Cảnh báo rủi ro | Danh sách cảnh báo | Các cơ hội có rủi ro cao |
| Xu hướng tỷ lệ thắng | Biểu đồ đường | Tỷ lệ thắng hàng tháng |
| Giao dịch đình trệ | Danh sách | Các giao dịch cần chú ý |

#### Chế độ xem Nhân viên bán hàng

| Thành phần | Loại | Dữ liệu |
|-----|------|------|
| Tiến độ chỉ tiêu của tôi | Thanh tiến độ | Thực tế so với chỉ tiêu hàng tháng |
| Cơ hội chờ xử lý | Thẻ KPI | Số lượng cơ hội chờ xử lý của tôi |
| Sắp đóng trong tuần | Danh sách | Các giao dịch dự kiến đóng sớm |
| Hoạt động quá hạn | Cảnh báo | Các nhiệm vụ đã hết hạn |
| Thao tác nhanh | Nút | Ghi lại hoạt động, Tạo cơ hội |

#### Chế độ xem Ban lãnh đạo

| Thành phần | Loại | Dữ liệu |
|-----|------|------|
| Doanh thu năm | Thẻ KPI | Doanh thu từ đầu năm đến nay |
| Giá trị quy trình | Thẻ KPI | Tổng giá trị quy trình bán hàng |
| Tỷ lệ thắng | Thẻ KPI | Tỷ lệ thắng tổng thể |
| Sức khỏe khách hàng | Biểu đồ phân bổ | Phân bổ điểm sức khỏe khách hàng |
| Dự báo | Biểu đồ | Dự báo doanh thu hàng tháng |

---

*Phiên bản tài liệu: v2.0 | Ngày cập nhật: 06-02-2026*