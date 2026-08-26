---
title: "Giới thiệu giải pháp Ticket NocoBase"
description: "Nền tảng Ticket thông minh AI-driven dựa trên NocoBase low-code: tiếp nhận đa nguồn, phân loại hỗ trợ AI, phân công thông minh, giám sát SLA, vòng lặp đánh giá Khách hàng khép kín, hỗ trợ các kịch bản như sửa chữa thiết bị, hỗ trợ IT, khiếu nại Khách hàng."
keywords: "Ticket NocoBase,Hệ thống Ticket,Ticket,Ticket dịch vụ Khách hàng,SLA,Ticket AI,NocoBase"
---

# Giới thiệu giải pháp Ticket

> **Mẹo**: Phiên bản hiện tại là bản preview giai đoạn đầu, các tính năng chưa hoàn thiện, chúng tôi đang liên tục cải tiến. Hoan nghênh phản hồi và góp ý!

## 1. Bối cảnh (Why)

### Giải quyết vấn đề ngành / vị trí / quản lý nào

Trong hoạt động hằng ngày, doanh nghiệp đối mặt với nhiều loại yêu cầu dịch vụ: sửa chữa thiết bị, hỗ trợ IT, khiếu nại Khách hàng, tư vấn... Các yêu cầu này có nguồn phân tán (hệ thống CRM, kỹ sư hiện trường, email, form công khai...), quy trình xử lý khác nhau, thiếu cơ chế theo dõi và quản lý thống nhất.

**Ví dụ kịch bản nghiệp vụ điển hình:**

- **Sửa chữa thiết bị**: Đội after-sales xử lý báo hỏng thiết bị, cần ghi nhận thông tin chuyên biệt như serial number thiết bị, mã lỗi, linh kiện thay thế
- **Hỗ trợ IT**: Bộ phận IT xử lý các yêu cầu nội bộ của nhân viên như đặt lại mật khẩu, cài đặt phần mềm, sự cố mạng
- **Khiếu nại Khách hàng**: Đội dịch vụ Khách hàng xử lý khiếu nại đa kênh, một số Khách hàng cảm xúc kích động cần ưu tiên
- **Tự phục vụ Khách hàng**: Khách hàng cuối muốn dễ dàng gửi yêu cầu dịch vụ và biết tiến độ xử lý

### Chân dung người dùng mục tiêu

| Yếu tố | Mô tả |
|------|------|
| Quy mô doanh nghiệp | Doanh nghiệp vừa và nhỏ đến vừa và lớn, có lượng nhu cầu dịch vụ Khách hàng nhất định |
| Cấu trúc vai trò | Đội dịch vụ Khách hàng, hỗ trợ IT, đội after-sales, quản lý vận hành |
| Mức độ trưởng thành số hóa | Sơ cấp đến trung cấp, đang tìm kiếm nâng cấp từ quản lý Excel/email lên quản lý hệ thống hóa |

### Điểm đau của các giải pháp chủ lưu hiện tại

- **Chi phí cao / Tùy chỉnh chậm**: Hệ thống Ticket SaaS đắt, chu kỳ phát triển tùy chỉnh dài
- **Hệ thống rời rạc, đảo dữ liệu**: Các loại dữ liệu nghiệp vụ phân tán ở các hệ thống khác nhau, khó phân tích và quyết định thống nhất
- **Nghiệp vụ thay đổi nhanh, hệ thống khó tiến hóa**: Khi nhu cầu nghiệp vụ thay đổi, hệ thống khó điều chỉnh nhanh
- **Phản hồi dịch vụ chậm**: Yêu cầu lưu chuyển giữa các hệ thống khác nhau, không thể phân công kịp thời
- **Quá trình thiếu minh bạch**: Khách hàng không thể theo dõi tiến độ Ticket, hỏi thường xuyên tăng áp lực cho dịch vụ Khách hàng
- **Khó đảm bảo chất lượng**: Thiếu giám sát SLA, quá hạn và đánh giá xấu không thể cảnh báo kịp thời

---

## 2. Tham khảo Sản phẩm và đối chuẩn giải pháp (Benchmark)

### Sản phẩm chủ lưu trên thị trường

- **SaaS**: Như Salesforce, Zendesk, Odoo...
- **Hệ thống tùy chỉnh / nội bộ**

### Tiêu chí đối chuẩn

- Phạm vi tính năng
- Linh hoạt
- Khả năng mở rộng
- Cách sử dụng AI

### Điểm khác biệt của giải pháp NocoBase

**Ưu điểm cấp nền tảng:**

- **Cấu hình ưu tiên**: Từ bảng dữ liệu cấp thấp đến loại nghiệp vụ, SLA, định tuyến kỹ năng... đều được quản lý qua cấu hình
- **Xây dựng nhanh bằng low-code**: Nhanh hơn tự phát triển, linh hoạt hơn SaaS

**Những gì hệ thống truyền thống không thể làm hoặc có chi phí cực cao:**

- **Tích hợp AI native**: Nhờ Plugin AI của NocoBase, thực hiện phân loại thông minh, hỗ trợ điền form, đề xuất tri thức
- **Tất cả thiết kế đều có thể được người dùng sao chép**: Người dùng có thể tự mở rộng dựa trên Template
- **Kiến trúc dữ liệu chữ T**: Bảng chính + bảng phụ nghiệp vụ, thêm loại nghiệp vụ mới chỉ cần thêm bảng phụ

---

## 3. Nguyên tắc thiết kế (Principles)

- **Chi phí nhận thức thấp**
- **Nghiệp vụ trước công nghệ**
- **Có thể tiến hóa, chứ không phải hoàn thành một lần**
- **Cấu hình ưu tiên, code làm hậu phương**
- **Con người và AI hợp tác, chứ không phải AI thay thế con người**
- **Tất cả thiết kế đều có thể được người dùng sao chép**

---

## 4. Tổng quan giải pháp (Solution Overview)

### Giới thiệu tóm lược

Nền tảng Ticket trung tâm tổng quát được xây dựng dựa trên nền tảng low-code NocoBase, hiện thực:

- **Lối vào thống nhất**: Tiếp nhận đa nguồn, xử lý chuẩn hóa
- **Phân phối thông minh**: Phân loại hỗ trợ AI, phân công cân bằng tải
- **Đa hình thái nghiệp vụ**: Bảng chính cốt lõi + bảng phụ nghiệp vụ, mở rộng linh hoạt
- **Phản hồi vòng kín**: Giám sát SLA, đánh giá Khách hàng, vòng kín đánh giá xấu

### Quy trình xử lý Ticket

```
Tiếp nhận đa nguồn → Tiền xử lý/Phân tích AI → Phân công thông minh → Thực thi thủ công → Phản hồi vòng kín
        ↓                  ↓                       ↓                   ↓                    ↓
   Kiểm tra trùng     Nhận diện ý định        Khớp kỹ năng      Chuyển trạng thái   Đánh giá hài lòng
                      Phân tích cảm xúc       Cân bằng tải      Giám sát SLA        Theo dõi đánh giá xấu
                      Tự động trả lời         Quản lý hàng đợi  Trao đổi bình luận  Lưu trữ dữ liệu
```

### Danh sách module cốt lõi

| Module | Mô tả |
|------|------|
| Tiếp nhận Ticket | Form công khai, cổng Khách hàng, đại diện dịch vụ Khách hàng nhập, API/Webhook, phân tích email |
| Quản lý Ticket | CRUD Ticket, chuyển trạng thái, phân công/chuyển giao, trao đổi bình luận, log thao tác |
| Mở rộng nghiệp vụ | Sửa chữa thiết bị, hỗ trợ IT, khiếu nại Khách hàng... bảng phụ nghiệp vụ |
| Quản lý SLA | Cấu hình SLA, cảnh báo quá hạn, leo thang quá hạn |
| Quản lý Khách hàng | Bảng Khách hàng chính, quản lý Người liên hệ, cổng Khách hàng |
| Hệ thống đánh giá | Chấm điểm đa chiều, nhãn nhanh, NPS, cảnh báo đánh giá xấu |
| Hỗ trợ AI | Phân loại ý định, phân tích cảm xúc, đề xuất tri thức, hỗ trợ trả lời, tinh chỉnh giọng điệu |

### Hiển thị giao diện cốt lõi

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. AI Employee

### Loại AI Employee và kịch bản

- **Trợ lý dịch vụ Khách hàng**, **Trợ lý bán hàng**, **Nhà phân tích dữ liệu**, **Người kiểm duyệt**
- Hỗ trợ con người, không phải thay thế

### Định lượng giá trị AI Employee

Trong giải pháp này, AI Employee có thể:

| Yếu tố giá trị | Hiệu quả cụ thể |
|----------|----------|
| Tăng hiệu quả | Phân loại tự động giảm 50%+ thời gian phân loại thủ công; đề xuất tri thức tăng tốc giải quyết vấn đề |
| Giảm chi phí | Câu hỏi đơn giản tự động trả lời, giảm khối lượng công việc của dịch vụ Khách hàng thủ công |
| Trao quyền cho nhân viên con người | Cảnh báo cảm xúc giúp dịch vụ Khách hàng chuẩn bị trước; tinh chỉnh trả lời nâng cao chất lượng giao tiếp |
| Tăng sự hài lòng của Khách hàng | Phản hồi nhanh hơn, phân công chính xác hơn, trả lời chuyên nghiệp hơn |

---

## 6. Điểm nổi bật (Highlights)

### 1. Kiến trúc dữ liệu chữ T

- Tất cả Ticket chia sẻ bảng chính, logic luân chuyển thống nhất
- Bảng phụ nghiệp vụ chứa các trường đặc thù, mở rộng linh hoạt
- Thêm loại nghiệp vụ mới chỉ cần thêm bảng phụ, không ảnh hưởng quy trình chính

### 2. Vòng đời Ticket đầy đủ

- Mới → Phân công → Xử lý → Treo → Đã giải quyết → Đã đóng
- Hỗ trợ các kịch bản phức tạp như chuyển giao, trả lại, mở lại
- Đếm SLA chính xác đến tạm dừng khi treo

### 3. Tiếp nhận thống nhất đa kênh

- Form công khai, cổng Khách hàng, API, email, đại diện dịch vụ Khách hàng nhập
- Kiểm tra idempotency tránh tạo trùng

### 4. Tích hợp AI native

- Không phải "thêm một nút AI", mà tích hợp vào từng khâu
- Nhận diện ý định, phân tích cảm xúc, đề xuất tri thức, tinh chỉnh trả lời

---

## 7. Roadmap (cập nhật liên tục)

- **Nhúng hệ thống**: Hỗ trợ nhúng module Ticket vào các hệ thống nghiệp vụ khác nhau như ERP, CRM
- **Liên kết Ticket**: Tiếp nhận và callback trạng thái Ticket của hệ thống thượng/hạ nguồn, hiện thực phối hợp Ticket xuyên hệ thống
- **Tự động hóa AI**: AI Employee được nhúng vào Workflow, hỗ trợ chạy tự động ở backend, hiện thực xử lý không người trực
- **Hỗ trợ multi-tenant**: Mở rộng theo chiều ngang qua nhiều space/nhiều ứng dụng, có thể phân phối cho các đội dịch vụ Khách hàng khác nhau vận hành độc lập
- **Knowledge base RAG**: Tự động vector hóa toàn bộ dữ liệu Ticket, Khách hàng, Sản phẩm..., hiện thực truy xuất thông minh và đề xuất tri thức
- **Hỗ trợ đa ngôn ngữ**: Giao diện và nội dung hỗ trợ chuyển đổi đa ngôn ngữ, đáp ứng nhu cầu hợp tác đội ngũ xuyên quốc gia/khu vực

