---
title: "Khách hàng, Người liên hệ và Email"
description: "Chế độ xem 360 Khách hàng CRM, điểm sức khỏe AI, gộp Khách hàng, quản lý vai trò Người liên hệ, gửi nhận email với hỗ trợ AI, ghi nhận hoạt động."
keywords: "Quản lý Khách hàng,Người liên hệ,Email,Điểm sức khỏe,Gộp Khách hàng,NocoBase CRM"
---

# Khách hàng, Người liên hệ và Email

> Khách hàng, Người liên hệ và Email là ba module liên kết chặt chẽ với nhau — Khách hàng là chủ thể, Người liên hệ là đối tượng giao tiếp, Email là bản ghi giao tiếp. Chương này giới thiệu thống nhất.

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## Quản lý Khách hàng

Từ menu phía trên, vào trang **Khách hàng**, gồm hai tab: Danh sách Khách hàng và Công cụ gộp Khách hàng.

### Danh sách Khách hàng

Phía trên danh sách có các nút lọc:

| Điều kiện lọc | Mô tả |
|---------|------|
| **All** | Tất cả Khách hàng |
| **Active** | Khách hàng đang hoạt động |
| **Potential** | Khách hàng tiềm năng, chưa thành giao dịch |
| **Dormant** | Khách hàng ngủ đông, lâu không tương tác |
| **Key Accounts** | Khách hàng lớn/trọng điểm |
| **New This Month** | Mới thêm trong tháng này |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Các cột chính**:

- **Điểm sức khỏe AI**: Thanh tiến trình hình tròn 0–100 điểm (🟢 70–100 khỏe / 🟡 40–69 cảnh báo / 🔴 0–39 nguy hiểm)
- **Hoạt động gần đây**: Thời gian tương đối + mã màu, càng lâu không liên hệ màu càng đậm

### Chi tiết Khách hàng

Nhấn vào tên Khách hàng để mở popup chi tiết, gồm **3 tab**:

| Tab | Nội dung |
|-------|------|
| **Chi tiết** | Hồ sơ Khách hàng, thẻ thống kê, Người liên hệ, Cơ hội, bình luận |
| **Email** | Email qua lại với tất cả Người liên hệ của Khách hàng này, 5 nút AI |
| **Lịch sử thay đổi** | Audit log cấp trường |

**Tab Chi tiết** sử dụng bố cục hai cột 2/3 trái + 1/3 phải:

- **Cột trái**: Avatar Khách hàng (tô màu theo cấp độ: Normal=xám, Important=hổ phách, VIP=vàng), tóm tắt 4 cột (cấp độ/quy mô/khu vực/loại), thẻ thống kê (tổng giá trị giao dịch / số Cơ hội đang hoạt động / số lần tương tác trong tháng, truy vấn API thời gian thực), danh sách Người liên hệ, danh sách Cơ hội, khu vực bình luận
- **Cột phải**: Hồ sơ AI thông minh (nhãn AI, biểu đồ vòng điểm sức khỏe, rủi ro chảy máu, thời gian liên hệ tốt nhất, chiến lược giao tiếp)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### Điểm sức khỏe AI

Điểm sức khỏe được tính tự động dựa trên các yếu tố sau: tần suất tương tác, mức độ hoạt động Cơ hội, tình hình Đơn hàng, mức độ phủ Người liên hệ.

Khuyến nghị sử dụng:

1. Hằng ngày mở danh sách Khách hàng, sắp xếp theo điểm sức khỏe
2. Ưu tiên quan tâm Khách hàng đỏ (Critical) — có thể đang chảy máu
3. Khách hàng vàng (Warning) — sắp xếp theo dõi nhẹ
4. Khách hàng xanh (Healthy) — duy trì theo nhịp bình thường

### Gộp Khách hàng

Khi xuất hiện bản ghi Khách hàng trùng lặp, hãy dùng công cụ gộp để dọn dẹp:

1. **Khởi tạo gộp**: Tích chọn nhiều Khách hàng trong danh sách → Nhấn nút "Customer Merge"
2. **Vào công cụ gộp**: Chuyển sang tab thứ hai, xem danh sách yêu cầu gộp (Pending / Merged / Cancelled)
3. **Thực hiện gộp**: Chọn bản ghi chính (Master) → So sánh khác biệt từng trường → Xem trước → Xác nhận. Workflow nền tự động di chuyển toàn bộ dữ liệu liên quan (Cơ hội, Người liên hệ, hoạt động, bình luận, Đơn hàng, Báo giá, chia sẻ) và vô hiệu hóa Khách hàng được gộp

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Hãy kiểm tra kỹ trước khi gộp]
Gộp Khách hàng là thao tác không thể hoàn tác. Trước khi thực hiện, hãy xác nhận kỹ việc lựa chọn bản ghi chính và lựa chọn giá trị từng trường.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Quản lý Người liên hệ

Từ menu phía trên, vào trang **Cài đặt → Người liên hệ**.

### Thông tin Người liên hệ

| Trường | Mô tả |
|------|------|
| Name | Tên Người liên hệ |
| Company | Công ty trực thuộc (liên kết bản ghi Khách hàng) |
| Email | Địa chỉ email (dùng để tự động liên kết email) |
| Phone | Số điện thoại |
| Role | Nhãn vai trò |
| Level | Cấp độ Người liên hệ |
| Primary Contact | Có phải là Người liên hệ chính của Khách hàng này không |

### Nhãn vai trò

| Vai trò | Ý nghĩa |
|------|------|
| Decision Maker | Người ra quyết định |
| Influencer | Người ảnh hưởng |
| Technical | Người phụ trách kỹ thuật |
| Procurement | Người phụ trách thu mua |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### Gửi email từ Người liên hệ

Mở trang chi tiết Người liên hệ, tương tự các trang quản lý dữ liệu khác, gồm các tab chi tiết, email, bản ghi trường...

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### Liên kết Email với CRM

Email được tự động liên kết với Khách hàng, Người liên hệ và Cơ hội:

- Tab "Email" trong chi tiết Khách hàng → Email qua lại với tất cả Người liên hệ của Khách hàng này
- Chi tiết Người liên hệ → Lịch sử email đầy đủ của Người liên hệ này
- Chi tiết Cơ hội → Bản ghi giao tiếp liên quan

Việc liên kết được thực hiện qua view, tự động khớp dựa trên địa chỉ email của Người liên hệ.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### Hỗ trợ AI cho Email

Trang email cung cấp 6 tình huống hỗ trợ AI:

| Tình huống | Chức năng |
|------|------|
| **Soạn đề xuất** | AI sinh email đề xuất dựa trên ngữ cảnh Khách hàng và Cơ hội |
| **Email theo dõi** | AI sinh email theo dõi với giọng điệu phù hợp |
| **Phân tích email** | AI phân tích cảm xúc và điểm chính của email |
| **Tóm tắt email** | AI tóm tắt luồng email |
| **Ngữ cảnh Khách hàng** | AI tổng hợp thông tin nền của Khách hàng |
| **Tóm tắt cấp cao** | AI trích xuất thông tin chính từ luồng email tạo bản tóm tắt |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Ghi nhận hoạt động

Từ menu phía trên, vào trang **Cài đặt → Hoạt động**. Đây là nhật ký trung tâm của tất cả các tương tác Khách hàng.

| Loại hoạt động | Mô tả |
|---------|------|
| Meeting | Họp |
| Call | Cuộc gọi |
| Email | Email |
| Visit | Thăm |
| Note | Ghi chú |
| Task | Nhiệm vụ |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Bản ghi hoạt động cũng sẽ xuất hiện trong chế độ xem lịch của Dashboard Overview.

---

## Trang liên quan

- [Hướng dẫn CRM](./index.md)
- [Quản lý Lead](./guide-leads) — Sau khi Lead chuyển đổi sẽ tự động tạo Khách hàng và Người liên hệ
- [Quản lý Cơ hội](./guide-opportunities) — Cơ hội liên kết với Khách hàng
- [AI Employee](./guide-ai)
