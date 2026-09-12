---
title: "Thiết kế chi tiết hệ thống CRM 2.0"
description: "Thiết kế chi tiết hệ thống CRM 2.0: kiến trúc dạng module, các thực thể cốt lõi và mô hình dữ liệu, cấu trúc bảng Lead/Cơ hội/Khách hàng/Báo giá/Đơn hàng, cấu hình pipeline bán hàng, Workflow và hỗ trợ AI."
keywords: "Thiết kế CRM,Mô hình dữ liệu,Phễu bán hàng,Giai đoạn Cơ hội,Kiến trúc dạng module,NocoBase"
---

# Thiết kế chi tiết hệ thống CRM 2.0


## 1. Tổng quan hệ thống và triết lý thiết kế

### 1.1 Định vị hệ thống

Hệ thống này là **nền tảng quản lý bán hàng CRM 2.0** được xây dựng trên nền tảng no-code NocoBase. Mục tiêu cốt lõi là:

```
Để bán hàng tập trung vào việc xây dựng quan hệ khách hàng, không phải nhập liệu và phân tích lặp lại
```

Hệ thống tự động xử lý các tác vụ thường xuyên thông qua Workflow, đồng thời nhờ AI hỗ trợ hoàn thành chấm điểm Lead, phân tích Cơ hội, giúp đội bán hàng nâng cao hiệu quả.

### 1.2 Triết lý thiết kế

#### Triết lý 1: Phễu bán hàng đầy đủ

**Quy trình bán hàng end-to-end:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Tại sao thiết kế như vậy?**

| Cách truyền thống | CRM tích hợp |
|---------|-----------|
| Dùng nhiều hệ thống cho các giai đoạn khác nhau | Một hệ thống bao phủ toàn bộ vòng đời |
| Truyền dữ liệu thủ công giữa các hệ thống | Tự động luân chuyển và chuyển đổi dữ liệu |
| View Khách hàng không nhất quán | View Khách hàng 360 độ thống nhất |
| Phân tích dữ liệu phân tán | Phân tích pipeline bán hàng end-to-end |

#### Triết lý 2: Pipeline bán hàng có thể cấu hình
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)


Các ngành khác nhau có thể tùy chỉnh giai đoạn pipeline bán hàng mà không cần sửa code.

#### Triết lý 3: Thiết kế dạng module

- Module cốt lõi (Khách hàng + Cơ hội) bắt buộc, các module khác có thể bật theo nhu cầu
- Vô hiệu hóa module không cần sửa code, cấu hình qua giao diện NocoBase là được
- Mỗi module được thiết kế độc lập, giảm độ ghép cặp

---

## 2. Kiến trúc module và tùy biến

### 2.1 Tổng quan module

Hệ thống CRM áp dụng thiết kế **kiến trúc dạng module**—mỗi module có thể bật hoặc tắt độc lập theo nhu cầu nghiệp vụ.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Quan hệ phụ thuộc giữa các module

| Module | Có bắt buộc | Phụ thuộc | Điều kiện vô hiệu |
|-----|---------|--------|---------|
| **Quản lý Khách hàng** | ✅ Có | - | Không thể vô hiệu (cốt lõi) |
| **Quản lý Cơ hội** | ✅ Có | Quản lý Khách hàng | Không thể vô hiệu (cốt lõi) |
| **Quản lý Lead** | Tùy chọn | - | Không cần thu thập Lead |
| **Quản lý Báo giá** | Tùy chọn | Cơ hội, Sản phẩm | Giao dịch đơn giản không cần báo giá chính thức |
| **Quản lý Đơn hàng** | Tùy chọn | Cơ hội (hoặc Báo giá) | Không cần theo dõi Đơn hàng/thanh toán |
| **Quản lý Sản phẩm** | Tùy chọn | - | Không cần danh mục Sản phẩm |
| **Tích hợp Email** | Tùy chọn | Khách hàng, Liên hệ | Dùng hệ thống Email bên ngoài |

### 2.3 Phiên bản đã cấu hình sẵn

| Phiên bản | Module bao gồm | Tình huống dùng | Số lượng bảng dữ liệu |
|-----|---------|---------|-----------|
| **Bản nhẹ** | Khách hàng + Cơ hội | Theo dõi giao dịch đơn giản | 6 |
| **Bản tiêu chuẩn** | Bản nhẹ + Lead + Báo giá + Đơn hàng + Sản phẩm | Chu kỳ bán hàng đầy đủ | 15 |
| **Bản doanh nghiệp** | Bản tiêu chuẩn + Tích hợp Email | Tính năng đầy đủ kèm Email | 17 |

### 2.4 Ánh xạ Module - Bảng dữ liệu

#### Bảng dữ liệu module cốt lõi (luôn bắt buộc)

| Bảng dữ liệu | Module | Mô tả |
|-------|------|------|
| nb_crm_customers | Quản lý Khách hàng | Bản ghi Khách hàng/công ty |
| nb_crm_contacts | Quản lý Khách hàng | Liên hệ |
| nb_crm_customer_shares | Quản lý Khách hàng | Quyền chia sẻ Khách hàng |
| nb_crm_opportunities | Quản lý Cơ hội | Cơ hội bán hàng |
| nb_crm_opportunity_stages | Quản lý Cơ hội | Cấu hình giai đoạn |
| nb_crm_opportunity_users | Quản lý Cơ hội | Cộng tác viên Cơ hội |
| nb_crm_activities | Quản lý hoạt động | Bản ghi hoạt động |
| nb_crm_comments | Quản lý hoạt động | Comment/ghi chú |
| nb_crm_tags | Cốt lõi | Tag chung |
| nb_cbo_currencies | Dữ liệu cơ bản | Từ điển tiền tệ |
| nb_cbo_regions | Dữ liệu cơ bản | Từ điển quốc gia/khu vực |

### 2.5 Cách vô hiệu hóa module

Trong trang quản trị NocoBase chỉ cần ẩn điểm vào menu của module đó là được, không cần sửa code hoặc xóa bảng dữ liệu.

---

## 3. Thực thể cốt lõi và mô hình dữ liệu

### 3.1 Tổng quan quan hệ thực thể
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Chi tiết bảng dữ liệu cốt lõi

#### 3.2.1 Bảng Lead (nb_crm_leads)

Quản lý Lead áp dụng workflow 4 giai đoạn đơn giản hóa.

**Quy trình giai đoạn:**
```
Mới → Đang theo dõi → Đã xác nhận → Chuyển đổi thành Khách hàng/Cơ hội
         ↓          ↓
       Không đạt   Không đạt
```

**Trường chính:**

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| lead_no | VARCHAR | Số Lead (tự sinh) |
| name | VARCHAR | Tên Liên hệ |
| company | VARCHAR | Tên công ty |
| title | VARCHAR | Chức danh |
| email | VARCHAR | Email |
| phone | VARCHAR | Điện thoại |
| mobile_phone | VARCHAR | Di động |
| website | TEXT | Website |
| address | TEXT | Địa chỉ |
| source | VARCHAR | Nguồn Lead: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Ngành |
| annual_revenue | VARCHAR | Quy mô doanh thu năm |
| number_of_employees | VARCHAR | Quy mô số nhân viên |
| status | VARCHAR | Trạng thái: new/working/qualified/unqualified |
| rating | VARCHAR | Đánh giá: hot/warm/cold |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| ai_score | INTEGER | AI chấm điểm chất lượng 0-100 |
| ai_convert_prob | DECIMAL | AI xác suất chuyển đổi |
| ai_best_contact_time | VARCHAR | AI gợi ý thời gian liên hệ |
| ai_tags | JSONB | Tag do AI sinh |
| ai_scored_at | TIMESTAMP | Thời gian AI chấm điểm |
| ai_next_best_action | TEXT | AI gợi ý hành động tốt nhất tiếp theo |
| ai_nba_generated_at | TIMESTAMP | Thời gian AI sinh gợi ý |
| is_converted | BOOLEAN | Đánh dấu đã chuyển đổi |
| converted_at | TIMESTAMP | Thời gian chuyển đổi |
| converted_customer_id | BIGINT | ID Khách hàng được chuyển đổi |
| converted_contact_id | BIGINT | ID Liên hệ được chuyển đổi |
| converted_opportunity_id | BIGINT | ID Cơ hội được chuyển đổi |
| lost_reason | TEXT | Lý do thua |
| disqualification_reason | TEXT | Lý do không đạt |
| description | TEXT | Mô tả |

#### 3.2.2 Bảng Khách hàng (nb_crm_customers)

Quản lý Khách hàng/công ty hỗ trợ nghiệp vụ xuất khẩu.

**Trường chính:**

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| name | VARCHAR | Tên Khách hàng (bắt buộc) |
| account_number | VARCHAR | Mã Khách hàng (tự sinh, duy nhất) |
| phone | VARCHAR | Điện thoại |
| website | TEXT | Website |
| address | TEXT | Địa chỉ |
| industry | VARCHAR | Ngành |
| type | VARCHAR | Loại: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Quy mô số nhân viên |
| annual_revenue | VARCHAR | Quy mô doanh thu năm |
| level | VARCHAR | Cấp độ: normal/important/vip |
| status | VARCHAR | Trạng thái: potential/active/dormant/churned |
| country | VARCHAR | Quốc gia |
| region_id | BIGINT | Khu vực (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Tiền tệ ưu tiên: CNY/USD/EUR |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| parent_id | BIGINT | Công ty mẹ (FK → self) |
| source_lead_id | BIGINT | ID Lead nguồn |
| ai_health_score | INTEGER | AI điểm sức khỏe 0-100 |
| ai_health_grade | VARCHAR | AI cấp độ sức khỏe: A/B/C/D |
| ai_churn_risk | DECIMAL | AI rủi ro mất khách 0-100% |
| ai_churn_risk_level | VARCHAR | AI cấp độ rủi ro mất khách: low/medium/high |
| ai_health_dimensions | JSONB | AI điểm các chiều sức khỏe |
| ai_recommendations | JSONB | AI danh sách đề xuất |
| ai_health_assessed_at | TIMESTAMP | Thời gian AI đánh giá sức khỏe |
| ai_tags | JSONB | Tag do AI sinh |
| ai_best_contact_time | VARCHAR | AI gợi ý thời gian liên hệ |
| ai_next_best_action | TEXT | AI gợi ý hành động tốt nhất tiếp theo |
| ai_nba_generated_at | TIMESTAMP | Thời gian AI sinh gợi ý |
| description | TEXT | Mô tả |
| is_deleted | BOOLEAN | Đánh dấu xóa mềm |

#### 3.2.3 Bảng Cơ hội (nb_crm_opportunities)

Quản lý Cơ hội bán hàng với các giai đoạn pipeline có thể cấu hình.

**Trường chính:**

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| opportunity_no | VARCHAR | Số Cơ hội (tự sinh, duy nhất) |
| name | VARCHAR | Tên Cơ hội (bắt buộc) |
| amount | DECIMAL | Số tiền dự kiến |
| currency | VARCHAR | Tiền tệ |
| exchange_rate | DECIMAL | Tỷ giá |
| amount_usd | DECIMAL | Số tiền tương đương USD |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Liên hệ chính (FK) |
| stage | VARCHAR | Mã giai đoạn (FK → stages.code) |
| stage_sort | INTEGER | Sắp xếp giai đoạn (dư thừa, tiện sắp xếp) |
| stage_entered_at | TIMESTAMP | Thời gian vào giai đoạn hiện tại |
| days_in_stage | INTEGER | Số ngày ở giai đoạn hiện tại |
| win_probability | DECIMAL | Tỷ lệ thắng thủ công |
| ai_win_probability | DECIMAL | AI dự đoán tỷ lệ thắng |
| ai_analyzed_at | TIMESTAMP | Thời gian AI phân tích |
| ai_confidence | DECIMAL | AI mức độ tin cậy dự đoán |
| ai_trend | VARCHAR | AI dự đoán xu hướng: up/stable/down |
| ai_risk_factors | JSONB | AI nhận diện yếu tố rủi ro |
| ai_recommendations | JSONB | AI danh sách đề xuất |
| ai_predicted_close | DATE | AI dự đoán ngày chốt |
| ai_next_best_action | TEXT | AI gợi ý hành động tốt nhất tiếp theo |
| ai_nba_generated_at | TIMESTAMP | Thời gian AI sinh gợi ý |
| expected_close_date | DATE | Ngày chốt dự kiến |
| actual_close_date | DATE | Ngày chốt thực tế |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| last_activity_at | TIMESTAMP | Thời gian hoạt động cuối |
| stagnant_days | INTEGER | Số ngày không hoạt động |
| loss_reason | TEXT | Lý do thua đơn |
| competitor_id | BIGINT | Đối thủ cạnh tranh (FK) |
| lead_source | VARCHAR | Nguồn Lead |
| campaign_id | BIGINT | ID chiến dịch marketing |
| expected_revenue | DECIMAL | Doanh thu dự kiến = amount × probability |
| description | TEXT | Mô tả |

#### 3.2.4 Bảng Báo giá (nb_crm_quotations)

Quản lý báo giá hỗ trợ đa tiền tệ và quy trình duyệt.

**Quy trình trạng thái:**
```
Nháp → Chờ duyệt → Đã duyệt → Đã gửi → Đã chấp nhận/Đã từ chối/Đã hết hạn
           ↓
       Bị bác → Sửa → Nháp
```

**Trường chính:**

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| quotation_no | VARCHAR | Số phiếu báo giá (tự sinh, duy nhất) |
| name | VARCHAR | Tên phiếu báo giá |
| version | INTEGER | Số phiên bản |
| opportunity_id | BIGINT | Cơ hội (FK, bắt buộc) |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Liên hệ (FK) |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| currency_id | BIGINT | Tiền tệ (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Tỷ giá |
| subtotal | DECIMAL | Tổng phụ |
| discount_rate | DECIMAL | Tỷ lệ chiết khấu |
| discount_amount | DECIMAL | Số tiền chiết khấu |
| shipping_handling | DECIMAL | Phí vận chuyển/xử lý |
| tax_rate | DECIMAL | Thuế suất |
| tax_amount | DECIMAL | Số thuế |
| total_amount | DECIMAL | Tổng cộng |
| total_amount_usd | DECIMAL | Số tiền tương đương USD |
| status | VARCHAR | Trạng thái: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Thời gian nộp |
| approved_by | BIGINT | Người duyệt (FK → users) |
| approved_at | TIMESTAMP | Thời gian duyệt |
| rejected_at | TIMESTAMP | Thời gian bác |
| sent_at | TIMESTAMP | Thời gian gửi |
| customer_response_at | TIMESTAMP | Thời gian Khách hàng phản hồi |
| expired_at | TIMESTAMP | Thời gian hết hạn |
| valid_until | DATE | Hiệu lực đến |
| payment_terms | TEXT | Điều khoản thanh toán |
| terms_condition | TEXT | Điều khoản và điều kiện |
| address | TEXT | Địa chỉ giao hàng |
| description | TEXT | Mô tả |

#### 3.2.5 Bảng Đơn hàng (nb_crm_orders)

Quản lý Đơn hàng kèm theo dõi thu hồi công nợ.

**Trường chính:**

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_no | VARCHAR | Số Đơn hàng (tự sinh, duy nhất) |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Liên hệ (FK) |
| opportunity_id | BIGINT | Cơ hội (FK) |
| quotation_id | BIGINT | Báo giá (FK) |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| currency | VARCHAR | Tiền tệ |
| exchange_rate | DECIMAL | Tỷ giá |
| order_amount | DECIMAL | Số tiền Đơn hàng |
| paid_amount | DECIMAL | Số tiền đã thanh toán |
| unpaid_amount | DECIMAL | Số tiền chưa thanh toán |
| status | VARCHAR | Trạng thái: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Trạng thái thanh toán: unpaid/partial/paid |
| order_date | DATE | Ngày đặt hàng |
| delivery_date | DATE | Ngày giao dự kiến |
| actual_delivery_date | DATE | Ngày giao thực tế |
| shipping_address | TEXT | Địa chỉ giao hàng |
| logistics_company | VARCHAR | Công ty vận chuyển |
| tracking_no | VARCHAR | Mã vận đơn |
| terms_condition | TEXT | Điều khoản và điều kiện |
| description | TEXT | Mô tả |

### 3.3 Tổng hợp bảng dữ liệu

#### Bảng nghiệp vụ CRM

| STT | Tên bảng | Mô tả | Loại |
|-----|------|------|------|
| 1 | nb_crm_leads | Quản lý Lead | Nghiệp vụ |
| 2 | nb_crm_customers | Khách hàng/công ty | Nghiệp vụ |
| 3 | nb_crm_contacts | Liên hệ | Nghiệp vụ |
| 4 | nb_crm_opportunities | Cơ hội bán hàng | Nghiệp vụ |
| 5 | nb_crm_opportunity_stages | Cấu hình giai đoạn | Cấu hình |
| 6 | nb_crm_opportunity_users | Cộng tác viên Cơ hội (đội bán hàng) | Liên kết |
| 7 | nb_crm_quotations | Phiếu báo giá | Nghiệp vụ |
| 8 | nb_crm_quotation_items | Chi tiết báo giá | Nghiệp vụ |
| 9 | nb_crm_quotation_approvals | Bản ghi duyệt | Nghiệp vụ |
| 10 | nb_crm_orders | Đơn hàng | Nghiệp vụ |
| 11 | nb_crm_order_items | Chi tiết Đơn hàng | Nghiệp vụ |
| 12 | nb_crm_payments | Bản ghi thu hồi công nợ | Nghiệp vụ |
| 13 | nb_crm_products | Danh mục Sản phẩm | Nghiệp vụ |
| 14 | nb_crm_product_categories | Phân loại Sản phẩm | Cấu hình |
| 15 | nb_crm_price_tiers | Định giá theo bậc | Cấu hình |
| 16 | nb_crm_activities | Bản ghi hoạt động | Nghiệp vụ |
| 17 | nb_crm_comments | Comment/ghi chú | Nghiệp vụ |
| 18 | nb_crm_competitors | Đối thủ cạnh tranh | Nghiệp vụ |
| 19 | nb_crm_tags | Tag | Cấu hình |
| 20 | nb_crm_lead_tags | Liên kết Lead-Tag | Liên kết |
| 21 | nb_crm_contact_tags | Liên kết Liên hệ-Tag | Liên kết |
| 22 | nb_crm_customer_shares | Quyền chia sẻ Khách hàng | Liên kết |
| 23 | nb_crm_exchange_rates | Lịch sử tỷ giá | Cấu hình |

#### Bảng dữ liệu cơ bản (module chung)

| STT | Tên bảng | Mô tả | Loại |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Từ điển tiền tệ | Cấu hình |
| 2 | nb_cbo_regions | Từ điển quốc gia/khu vực | Cấu hình |

### 3.4 Bảng phụ trợ

#### 3.4.1 Bảng Comment (nb_crm_comments)

Bảng comment/ghi chú dùng chung, có thể liên kết đến nhiều loại đối tượng nghiệp vụ.

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| content | TEXT | Nội dung comment |
| lead_id | BIGINT | Lead liên kết (FK) |
| customer_id | BIGINT | Khách hàng liên kết (FK) |
| opportunity_id | BIGINT | Cơ hội liên kết (FK) |
| order_id | BIGINT | Đơn hàng liên kết (FK) |

#### 3.4.2 Bảng chia sẻ Khách hàng (nb_crm_customer_shares)

Hiện thực hóa cộng tác đa người và chia sẻ quyền của Khách hàng.

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| customer_id | BIGINT | Khách hàng (FK, bắt buộc) |
| shared_with_user_id | BIGINT | User được chia sẻ (FK, bắt buộc) |
| shared_by_user_id | BIGINT | User khởi tạo chia sẻ (FK) |
| permission_level | VARCHAR | Cấp độ quyền: read/write/full |
| shared_at | TIMESTAMP | Thời gian chia sẻ |

#### 3.4.3 Bảng Cộng tác viên Cơ hội (nb_crm_opportunity_users)

Hỗ trợ cộng tác đội bán hàng cho Cơ hội.

| Trường | Kiểu | Mô tả |
|-----|------|------|
| opportunity_id | BIGINT | Cơ hội (FK, khóa chính kép) |
| user_id | BIGINT | User (FK, khóa chính kép) |
| role | VARCHAR | Vai trò: owner/collaborator/viewer |

#### 3.4.4 Bảng Khu vực (nb_cbo_regions)

Từ điển dữ liệu cơ bản quốc gia/khu vực.

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| code_alpha2 | VARCHAR | Mã 2 chữ ISO 3166-1 (duy nhất) |
| code_alpha3 | VARCHAR | Mã 3 chữ ISO 3166-1 (duy nhất) |
| code_numeric | VARCHAR | Mã số ISO 3166-1 |
| name | VARCHAR | Tên quốc gia/khu vực |
| is_active | BOOLEAN | Có kích hoạt |
| sort_order | INTEGER | Thứ tự sắp xếp |

---

## 4. Vòng đời Lead

Quản lý Lead áp dụng workflow 4 giai đoạn đơn giản hóa, khi tạo Lead mới có thể tự động kích hoạt AI chấm điểm thông qua workflow, hỗ trợ bán hàng nhanh chóng nhận diện Lead chất lượng cao.

### 4.1 Định nghĩa trạng thái

| Trạng thái | Tên | Mô tả |
|-----|------|------|
| new | Mới | Vừa tạo, chờ liên hệ |
| working | Đang theo dõi | Đang theo dõi tích cực |
| qualified | Đã xác nhận | Sẵn sàng chuyển đổi |
| unqualified | Không đạt | Không phù hợp |

### 4.2 Sơ đồ luồng trạng thái

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Quy trình chuyển đổi Lead

Giao diện chuyển đổi đồng thời cung cấp ba lựa chọn, người dùng có thể chọn tạo hoặc liên kết:

- **Khách hàng**: Tạo Khách hàng mới hoặc liên kết Khách hàng hiện có
- **Liên hệ**: Tạo Liên hệ mới (liên kết đến Khách hàng)
- **Cơ hội**: Bắt buộc tạo Cơ hội
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Bản ghi sau chuyển đổi:**
- `converted_customer_id`: ID Khách hàng được liên kết
- `converted_contact_id`: ID Liên hệ được liên kết
- `converted_opportunity_id`: ID Cơ hội được tạo

---

## 5. Vòng đời Cơ hội

Quản lý Cơ hội áp dụng các giai đoạn pipeline bán hàng có thể cấu hình. Khi giai đoạn Cơ hội thay đổi có thể tự động kích hoạt AI dự đoán tỷ lệ thắng, giúp bán hàng nhận diện rủi ro và cơ hội.

### 5.1 Giai đoạn có thể cấu hình

Giai đoạn được lưu trong bảng `nb_crm_opportunity_stages`, có thể tùy chỉnh:

| Mã | Tên | Thứ tự | Tỷ lệ thắng mặc định |
|-----|------|------|---------|
| prospecting | Tiếp xúc ban đầu | 1 | 10% |
| analysis | Phân tích nhu cầu | 2 | 30% |
| proposal | Đề xuất phương án | 3 | 60% |
| negotiation | Đàm phán thương mại | 4 | 80% |
| won | Thắng đơn | 5 | 100% |
| lost | Thua đơn | 6 | 0% |

### 5.2 Quy trình pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)


### 5.3 Phát hiện ngừng trệ

Cơ hội không có hoạt động sẽ được đánh dấu:

| Số ngày không hoạt động | Hành động |
|-----------|------|
| 7 ngày | Cảnh báo vàng |
| 14 ngày | Nhắc nhở cam đến người phụ trách |
| 30 ngày | Nhắc nhở đỏ đến quản lý |

```sql
-- Tính số ngày ngừng trệ
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Xử lý thắng/thua đơn

**Khi thắng đơn:**
1. Cập nhật giai đoạn thành 'won'
2. Ghi lại ngày chốt thực tế
3. Cập nhật trạng thái Khách hàng thành 'active'
4. Kích hoạt tạo Đơn hàng (nếu báo giá được chấp nhận)

**Khi thua đơn:**
1. Cập nhật giai đoạn thành 'lost'
2. Ghi lại lý do thua đơn
3. Ghi lại ID đối thủ cạnh tranh (nếu thua cho đối thủ)
4. Thông báo cho quản lý

---

## 6. Vòng đời Báo giá

### 6.1 Định nghĩa trạng thái

| Trạng thái | Tên | Mô tả |
|-----|------|------|
| draft | Nháp | Đang chuẩn bị |
| pending_approval | Chờ duyệt | Đang chờ duyệt |
| approved | Đã duyệt | Có thể gửi |
| sent | Đã gửi | Đã gửi cho Khách hàng |
| accepted | Đã chấp nhận | Khách hàng đã chấp nhận |
| rejected | Đã từ chối | Khách hàng đã từ chối |
| expired | Đã hết hạn | Quá hạn hiệu lực |

### 6.2 Quy tắc duyệt (đang hoàn thiện)

Quy trình duyệt được kích hoạt dựa trên các điều kiện sau:

| Điều kiện | Cấp duyệt |
|------|---------|
| Chiết khấu > 10% | Quản lý bán hàng |
| Chiết khấu > 20% | Giám đốc bán hàng |
| Số tiền > $100K | Tài chính + Tổng giám đốc |


### 6.3 Hỗ trợ đa tiền tệ

#### Triết lý thiết kế

Sử dụng **USD làm tiền tệ cơ sở thống nhất** cho mọi báo cáo và phân tích. Mỗi bản ghi số tiền lưu:
- Tiền tệ và số tiền gốc (Khách hàng nhìn thấy)
- Tỷ giá tại thời điểm giao dịch
- Số tiền tương đương USD (dùng để so sánh nội bộ)

#### Bảng từ điển tiền tệ (nb_cbo_currencies)

Cấu hình tiền tệ áp dụng bảng dữ liệu cơ bản chung, hỗ trợ quản lý động. Trường `current_rate` lưu tỷ giá hiện tại, được đồng bộ cập nhật từ bản ghi mới nhất của `nb_crm_exchange_rates` thông qua tác vụ định kỳ.

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| code | VARCHAR | Mã tiền tệ (duy nhất): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Tên tiền tệ |
| symbol | VARCHAR | Ký hiệu tiền tệ |
| decimal_places | INTEGER | Số chữ số thập phân |
| current_rate | DECIMAL | Tỷ giá hiện tại với USD (đồng bộ định kỳ từ bảng lịch sử tỷ giá) |
| is_active | BOOLEAN | Có kích hoạt |
| sort_order | INTEGER | Thứ tự sắp xếp |

#### Bảng lịch sử tỷ giá (nb_crm_exchange_rates)

Ghi lại dữ liệu tỷ giá lịch sử, tác vụ định kỳ sẽ đồng bộ tỷ giá mới nhất sang `nb_cbo_currencies.current_rate`.

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| currency_code | VARCHAR | Mã tiền tệ (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Tỷ giá với USD |
| effective_date | DATE | Ngày hiệu lực |
| source | VARCHAR | Nguồn tỷ giá: manual/api |
| createdAt | TIMESTAMP | Thời gian tạo |

> **Lưu ý**: Phiếu báo giá liên kết với bảng `nb_cbo_currencies` qua khóa ngoại `currency_id`, tỷ giá được lấy trực tiếp từ trường `current_rate`. Cơ hội và Đơn hàng dùng trường `currency` VARCHAR để lưu mã tiền tệ.

#### Mẫu trường số tiền

Các bảng có chứa số tiền tuân theo mẫu này:

| Trường | Kiểu | Mô tả |
|-----|------|------|
| currency | VARCHAR | Tiền tệ giao dịch |
| amount | DECIMAL | Số tiền tiền tệ gốc |
| exchange_rate | DECIMAL | Tỷ giá với USD tại thời điểm giao dịch |
| amount_usd | DECIMAL | Tương đương USD (tính toán) |

**Áp dụng cho:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Tích hợp Workflow
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)


**Logic lấy tỷ giá:**
1. Khi có thao tác nghiệp vụ, lấy trực tiếp tỷ giá từ `nb_cbo_currencies.current_rate`
2. Giao dịch USD: tỷ giá = 1.0, không cần tra cứu
3. `current_rate` được đồng bộ từ bản ghi mới nhất của `nb_crm_exchange_rates` thông qua tác vụ định kỳ

### 6.4 Quản lý phiên bản

Khi báo giá bị từ chối hoặc hết hạn, có thể sao chép thành phiên bản mới:

```
QT-20260119-001 v1 → Đã từ chối
QT-20260119-001 v2 → Đã gửi
QT-20260119-001 v3 → Đã chấp nhận
```

---

## 7. Vòng đời Đơn hàng

### 7.1 Tổng quan Đơn hàng

Đơn hàng được tạo khi báo giá được chấp nhận, đại diện cho cam kết kinh doanh đã được xác nhận.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)


### 7.2 Định nghĩa trạng thái Đơn hàng

| Trạng thái | Mã | Mô tả | Hành động cho phép |
|-----|------|------|---------|
| Nháp | `draft` | Đơn hàng đã tạo, chưa xác nhận | Sửa, xác nhận, hủy |
| Đã xác nhận | `confirmed` | Đơn hàng đã xác nhận, chờ thực hiện | Bắt đầu thực hiện, hủy |
| Đang xử lý | `in_progress` | Đơn hàng đang xử lý/sản xuất | Cập nhật tiến độ, gửi hàng, hủy (cần duyệt) |
| Đã gửi | `shipped` | Sản phẩm đã gửi cho Khách hàng | Đánh dấu đã giao |
| Đã giao | `delivered` | Khách hàng đã nhận hàng | Hoàn thành Đơn hàng |
| Đã hoàn thành | `completed` | Đơn hàng hoàn thành đầy đủ | Không có |
| Đã hủy | `cancelled` | Đơn hàng đã hủy | Không có |

### 7.3 Mô hình dữ liệu Đơn hàng

#### nb_crm_orders

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_no | VARCHAR | Số Đơn hàng (tự sinh, duy nhất) |
| customer_id | BIGINT | Khách hàng (FK) |
| contact_id | BIGINT | Liên hệ (FK) |
| opportunity_id | BIGINT | Cơ hội (FK) |
| quotation_id | BIGINT | Báo giá (FK) |
| owner_id | BIGINT | Người phụ trách (FK → users) |
| status | VARCHAR | Trạng thái Đơn hàng |
| payment_status | VARCHAR | Trạng thái thanh toán: unpaid/partial/paid |
| order_date | DATE | Ngày đặt hàng |
| delivery_date | DATE | Ngày giao dự kiến |
| actual_delivery_date | DATE | Ngày giao thực tế |
| currency | VARCHAR | Tiền tệ Đơn hàng |
| exchange_rate | DECIMAL | Tỷ giá với USD |
| order_amount | DECIMAL | Tổng số tiền Đơn hàng |
| paid_amount | DECIMAL | Số tiền đã thanh toán |
| unpaid_amount | DECIMAL | Số tiền chưa thanh toán |
| shipping_address | TEXT | Địa chỉ giao hàng |
| logistics_company | VARCHAR | Công ty vận chuyển |
| tracking_no | VARCHAR | Mã vận đơn |
| terms_condition | TEXT | Điều khoản và điều kiện |
| description | TEXT | Mô tả |

#### nb_crm_order_items

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_id | FK | Đơn hàng cha |
| product_id | FK | Tham chiếu Sản phẩm |
| product_name | VARCHAR | Snapshot tên Sản phẩm |
| quantity | INT | Số lượng đặt |
| unit_price | DECIMAL | Đơn giá |
| discount_percent | DECIMAL | Phần trăm chiết khấu |
| line_total | DECIMAL | Tổng dòng |
| notes | TEXT | Ghi chú dòng |

### 7.4 Theo dõi thu hồi công nợ

#### nb_crm_payments

| Trường | Kiểu | Mô tả |
|-----|------|------|
| id | BIGINT | Khóa chính |
| order_id | BIGINT | Đơn hàng liên kết (FK, bắt buộc) |
| customer_id | BIGINT | Khách hàng (FK) |
| payment_no | VARCHAR | Số phiếu thanh toán (tự sinh, duy nhất) |
| amount | DECIMAL | Số tiền thanh toán (bắt buộc) |
| currency | VARCHAR | Tiền tệ thanh toán |
| payment_method | VARCHAR | Phương thức thanh toán: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Ngày thanh toán |
| bank_account | VARCHAR | Tài khoản ngân hàng |
| bank_name | VARCHAR | Tên ngân hàng |
| notes | TEXT | Ghi chú thanh toán |

---

## 8. Vòng đời Khách hàng

### 8.1 Tổng quan Khách hàng

Khách hàng được tạo khi Lead chuyển đổi hoặc Cơ hội thắng đơn. Hệ thống theo dõi vòng đời đầy đủ từ thu hút khách đến người ủng hộ.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)


### 8.2 Định nghĩa trạng thái Khách hàng

| Trạng thái | Mã | Sức khỏe | Mô tả |
|-----|------|--------|------|
| Tiềm năng | `prospect` | Không | Lead đã chuyển đổi, chưa có Đơn hàng |
| Hoạt động | `active` | ≥70 | Khách hàng trả phí, tương tác tốt |
| Tăng trưởng | `growing` | ≥80 | Khách hàng có cơ hội mở rộng |
| Rủi ro | `at_risk` | <50 | Khách hàng có dấu hiệu mất khách |
| Mất khách | `churned` | Không | Khách hàng không còn hoạt động |
| Lấy lại | `win_back` | Không | Khách hàng cũ đang được kích hoạt lại |
| Người ủng hộ | `advocate` | ≥90 | Hài lòng cao, cung cấp giới thiệu |

### 8.3 Chấm điểm sức khỏe Khách hàng

Tính sức khỏe Khách hàng dựa trên nhiều yếu tố:

| Yếu tố | Trọng số | Chỉ số đo lường |
|-----|------|---------|
| Mức độ gần đây của mua hàng | 25% | Số ngày kể từ Đơn hàng cuối |
| Tần suất mua hàng | 20% | Số Đơn hàng mỗi giai đoạn |
| Giá trị tiền tệ | 20% | Tổng và trung bình giá trị Đơn hàng |
| Mức độ tương tác | 15% | Tỷ lệ mở email, tham gia họp |
| Sức khỏe hỗ trợ | 10% | Số lượng và tỷ lệ giải quyết Ticket |
| Sử dụng Sản phẩm | 10% | Chỉ số sử dụng tích cực (nếu áp dụng) |

**Ngưỡng sức khỏe:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Phân nhóm Khách hàng

#### Phân nhóm tự động

| Phân nhóm | Điều kiện | Hành động đề xuất |
|-----|------|---------|
| VIP | Giá trị vòng đời > $100K | Phục vụ cao cấp, sponsor cấp cao |
| Doanh nghiệp | Quy mô công ty > 500 người | Account manager riêng |
| Vừa | Quy mô công ty 50-500 người | Thăm hỏi định kỳ, hỗ trợ quy mô |
| Khởi nghiệp | Quy mô công ty < 50 người | Tài nguyên tự phục vụ, cộng đồng |
| Ngủ đông | 90+ ngày không hoạt động | Marketing kích hoạt lại |

---

## 9. Tích hợp Email

### 9.1 Tổng quan

NocoBase cung cấp Plugin tích hợp Email tích hợp sẵn, hỗ trợ Gmail và Outlook. Sau khi Email được đồng bộ vào hệ thống, có thể tự động kích hoạt AI phân tích cảm xúc và ý định email thông qua Workflow, hỗ trợ bán hàng nhanh chóng hiểu thái độ Khách hàng.

### 9.2 Đồng bộ Email

**Hộp thư hỗ trợ:**
- Gmail (qua OAuth 2.0)
- Outlook/Microsoft 365 (qua OAuth 2.0)

**Hành vi đồng bộ:**
- Đồng bộ hai chiều email gửi và nhận
- Tự động liên kết email với bản ghi CRM (Lead, Liên hệ, Cơ hội)
- File đính kèm lưu trong hệ thống file của NocoBase

### 9.3 Liên kết Email-CRM (đang hoàn thiện)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Template Email

Bán hàng có thể sử dụng template cài sẵn:

| Loại template | Ví dụ |
|---------|------|
| Tiếp xúc lần đầu | Email lạnh, giới thiệu nhiệt tình, theo dõi sự kiện |
| Theo dõi | Theo dõi cuộc họp, theo dõi phương án, nhắc khi không phản hồi |
| Báo giá | Báo giá đính kèm, sửa đổi báo giá, báo giá sắp hết hạn |
| Đơn hàng | Xác nhận Đơn hàng, thông báo gửi hàng, xác nhận đã giao |
| Thành công Khách hàng | Chào mừng, thăm hỏi, yêu cầu đánh giá |

---

## 10. Năng lực hỗ trợ AI

### 10.1 Đội ngũ AI Employee

Hệ thống CRM tích hợp NocoBase AI Plugin, tái sử dụng các AI Employee tích hợp sẵn sau, và cấu hình tác vụ chuyên biệt cho tình huống CRM:

| ID | Tên | Vị trí tích hợp sẵn | Năng lực mở rộng CRM |
|----|------|---------|-------------|
| viz | Viz | Nhà phân tích dữ liệu | Phân tích dữ liệu bán hàng, dự báo pipeline |
| dara | Dara | Chuyên gia biểu đồ | Trực quan hóa dữ liệu, phát triển biểu đồ báo cáo, thiết kế Dashboard |
| ellis | Ellis | Biên tập | Soạn trả lời email, tóm tắt giao tiếp, soạn email thương mại |
| lexi | Lexi | Phiên dịch | Giao tiếp Khách hàng đa ngôn ngữ, dịch nội dung |
| orin | Orin | Người tổ chức | Ưu tiên hằng ngày, gợi ý bước tiếp theo, kế hoạch theo dõi |

### 10.2 Danh sách tác vụ AI

Năng lực AI chia làm hai loại, độc lập với nhau:

#### Một, AI Employee (Block frontend kích hoạt)

Thông qua Block AI Employee ở frontend, người dùng tương tác trực tiếp với AI qua hội thoại để nhận phân tích và gợi ý.

| Employee | Tác vụ | Mô tả |
|------|------|------|
| Viz | Phân tích dữ liệu bán hàng | Phân tích xu hướng pipeline, tỷ lệ chuyển đổi |
| Viz | Dự báo pipeline | Dự báo doanh thu dựa trên pipeline có trọng số |
| Dara | Sinh biểu đồ | Sinh biểu đồ báo cáo bán hàng |
| Dara | Thiết kế Dashboard | Thiết kế bố cục Dashboard dữ liệu |
| Ellis | Soạn trả lời | Sinh trả lời email chuyên nghiệp |
| Ellis | Tóm tắt giao tiếp | Tóm tắt thread email |
| Ellis | Soạn email thương mại | Email mời họp, theo dõi, cảm ơn, v.v. |
| Orin | Ưu tiên hằng ngày | Sinh danh sách tác vụ ưu tiên trong ngày |
| Orin | Gợi ý bước tiếp theo | Gợi ý hành động tiếp theo cho mỗi Cơ hội |
| Lexi | Dịch nội dung | Dịch tài liệu marketing, phương án, email |

#### Hai, Workflow LLM Node (backend tự động thực thi)

LLM Node được nhúng trong Workflow, kích hoạt tự động qua sự kiện bảng dữ liệu, sự kiện thao tác, tác vụ định kỳ, không liên quan đến AI Employee.

| Tác vụ | Cách kích hoạt | Mô tả | Trường ghi vào |
|------|---------|------|---------|
| Chấm điểm Lead | Sự kiện bảng dữ liệu (tạo/cập nhật) | Đánh giá chất lượng Lead | ai_score, ai_convert_prob |
| Dự đoán tỷ lệ thắng | Sự kiện bảng dữ liệu (đổi giai đoạn) | Dự đoán khả năng thành công của Cơ hội | ai_win_probability, ai_risk_factors |

> **Lưu ý**: Workflow LLM Node sử dụng prompt và Schema xuất JSON có cấu trúc, sau khi parse ghi vào trường dữ liệu nghiệp vụ, không cần người dùng can thiệp.

### 10.3 Trường AI trong cơ sở dữ liệu

| Bảng | Trường AI | Mô tả |
|----|--------|------|
| nb_crm_leads | ai_score | AI điểm 0-100 |
| | ai_convert_prob | Xác suất chuyển đổi |
| | ai_best_contact_time | Thời gian liên hệ tốt nhất |
| | ai_tags | Tag do AI sinh (JSONB) |
| | ai_scored_at | Thời gian chấm điểm |
| | ai_next_best_action | Gợi ý hành động tốt nhất tiếp theo |
| | ai_nba_generated_at | Thời gian sinh gợi ý |
| nb_crm_opportunities | ai_win_probability | AI dự đoán tỷ lệ thắng |
| | ai_analyzed_at | Thời gian phân tích |
| | ai_confidence | Mức độ tin cậy dự đoán |
| | ai_trend | Xu hướng: up/stable/down |
| | ai_risk_factors | Yếu tố rủi ro (JSONB) |
| | ai_recommendations | Danh sách đề xuất (JSONB) |
| | ai_predicted_close | Ngày chốt dự đoán |
| | ai_next_best_action | Gợi ý hành động tốt nhất tiếp theo |
| | ai_nba_generated_at | Thời gian sinh gợi ý |
| nb_crm_customers | ai_health_score | Điểm sức khỏe 0-100 |
| | ai_health_grade | Cấp độ sức khỏe: A/B/C/D |
| | ai_churn_risk | Rủi ro mất khách 0-100% |
| | ai_churn_risk_level | Cấp độ rủi ro mất khách: low/medium/high |
| | ai_health_dimensions | Điểm các chiều (JSONB) |
| | ai_recommendations | Danh sách đề xuất (JSONB) |
| | ai_health_assessed_at | Thời gian đánh giá sức khỏe |
| | ai_tags | Tag do AI sinh (JSONB) |
| | ai_best_contact_time | Thời gian liên hệ tốt nhất |
| | ai_next_best_action | Gợi ý hành động tốt nhất tiếp theo |
| | ai_nba_generated_at | Thời gian sinh gợi ý |

---

## 11. Engine Workflow

### 11.1 Workflow đã hiện thực

| Tên Workflow | Loại kích hoạt | Trạng thái | Mô tả |
|-----------|---------|------|------|
| Leads Created | Sự kiện bảng dữ liệu | Bật | Kích hoạt khi tạo Lead |
| CRM Overall Analytics | Sự kiện AI Employee | Bật | Phân tích dữ liệu tổng thể CRM |
| Lead Conversion | Sự kiện sau thao tác | Bật | Quy trình chuyển đổi Lead |
| Lead Assignment | Sự kiện bảng dữ liệu | Bật | Tự động gán Lead |
| Lead Scoring | Sự kiện bảng dữ liệu | Tắt | Chấm điểm Lead (đang hoàn thiện) |
| Follow-up Reminder | Tác vụ định kỳ | Tắt | Nhắc nhở theo dõi (đang hoàn thiện) |

### 11.2 Workflow chờ hiện thực

| Workflow | Loại kích hoạt | Mô tả |
|-------|---------|------|
| Đẩy giai đoạn Cơ hội | Sự kiện bảng dữ liệu | Khi đổi giai đoạn cập nhật tỷ lệ thắng, ghi thời gian |
| Phát hiện Cơ hội ngừng trệ | Tác vụ định kỳ | Phát hiện Cơ hội không hoạt động, gửi nhắc nhở |
| Duyệt báo giá | Sự kiện sau thao tác | Quy trình duyệt nhiều cấp |
| Tạo Đơn hàng | Sự kiện sau thao tác | Tự động tạo Đơn hàng sau khi báo giá được chấp nhận |

---

## 12. Thiết kế menu và giao diện

### 12.1 Cấu trúc backend

| Menu | Loại | Mô tả |
|------|------|------|
| **Dashboards** | Group | Dashboard |
| - Dashboard | Page | Dashboard mặc định |
| - SalesManager | Page | View Quản lý bán hàng |
| - SalesRep | Page | View Nhân viên bán hàng |
| - Executive | Page | View điều hành |
| **Leads** | Page | Quản lý Lead |
| **Customers** | Page | Quản lý Khách hàng |
| **Opportunities** | Page | Quản lý Cơ hội |
| - Table | Tab | Danh sách Cơ hội |
| **Products** | Page | Quản lý Sản phẩm |
| - Categories | Tab | Phân loại Sản phẩm |
| **Orders** | Page | Quản lý Đơn hàng |
| **Settings** | Group | Cài đặt |
| - Stage Settings | Page | Cấu hình giai đoạn Cơ hội |
| - Exchange Rate | Page | Cài đặt tỷ giá |
| - Activity | Page | Bản ghi hoạt động |
| - Emails | Page | Quản lý email |
| - Contacts | Page | Quản lý Liên hệ |
| - Data Analysis | Page | Phân tích dữ liệu |

### 12.2 View Dashboard

#### View Quản lý bán hàng

| Component | Loại | Dữ liệu |
|-----|------|------|
| Giá trị pipeline | Thẻ KPI | Tổng pipeline các giai đoạn |
| Bảng xếp hạng đội | Bảng | Xếp hạng hiệu suất rep |
| Cảnh báo rủi ro | Danh sách cảnh báo | Cơ hội rủi ro cao |
| Xu hướng tỷ lệ thắng | Biểu đồ đường | Tỷ lệ thắng theo tháng |
| Giao dịch ngừng trệ | Danh sách | Giao dịch cần chú ý |

#### View Nhân viên bán hàng

| Component | Loại | Dữ liệu |
|-----|------|------|
| Tiến độ chỉ tiêu của tôi | Thanh tiến độ | Thực tế tháng vs chỉ tiêu |
| Cơ hội cần xử lý | Thẻ KPI | Số Cơ hội cần xử lý của tôi |
| Sắp đóng tuần này | Danh sách | Giao dịch sắp đóng |
| Hoạt động quá hạn | Cảnh báo | Tác vụ quá hạn |
| Thao tác nhanh | Nút | Ghi nhận hoạt động, tạo Cơ hội |

#### View điều hành

| Component | Loại | Dữ liệu |
|-----|------|------|
| Doanh thu năm | Thẻ KPI | Doanh thu từ đầu năm đến nay |
| Giá trị pipeline | Thẻ KPI | Tổng pipeline |
| Tỷ lệ thắng | Thẻ KPI | Tỷ lệ thắng tổng thể |
| Sức khỏe Khách hàng | Biểu đồ phân phối | Phân phối điểm sức khỏe |
| Dự báo | Biểu đồ | Dự báo doanh thu theo tháng |


---

*Phiên bản tài liệu: v2.0 | Ngày cập nhật: 2026-02-06*
