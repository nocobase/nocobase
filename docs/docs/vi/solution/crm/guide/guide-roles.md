---
title: "Vai trò và Quyền hạn"
description: "Mô tả hệ thống Vai trò của hệ thống CRM: mỗi vị trí có thể xem những trang nào, có thể thao tác những dữ liệu nào."
keywords: "Quyền vai trò,Quyền dữ liệu,Quyền menu,Vai trò bộ phận,NocoBase CRM"
---

# Vai trò và Quyền hạn

> Sau khi đăng nhập CRM, những người ở các vị trí khác nhau sẽ thấy menu và có thể thao tác trên dữ liệu khác nhau. Chương này giúp bạn trả lời một câu hỏi: **"Tôi có thể thấy gì, và có thể làm gì?"**

## Tôi là Vai trò gì?

Vai trò đến từ hai cách:
1. **Vai trò cá nhân** — Vai trò mà quản trị viên gán trực tiếp cho bạn, đi cùng bạn
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Vai trò bộ phận** — Bộ phận của bạn gắn với Vai trò, gia nhập bộ phận sẽ tự động kế thừa

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Cả hai cộng dồn có hiệu lực. Ví dụ bạn có Vai trò "Sales Rep" cá nhân, lại được thêm vào bộ phận Marketing, vậy bạn đồng thời có quyền của cả hai Vai trò bán hàng và marketing.

![cn_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles.png)

> \* **Sales Manager** và **Executive** không gắn bộ phận, do quản trị viên trực tiếp gán cho cá nhân.

---

## Mỗi Vai trò có thể thấy những trang nào

Sau khi đăng nhập, thanh menu chỉ hiển thị các trang bạn có quyền truy cập:

![cn_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_1.png)

> ¹ Sales Rep chỉ thấy SalesRep dashboard cá nhân, không thấy SalesManager và Executive view.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## Tôi có thể thao tác những dữ liệu nào?

### Logic cốt lõi của quyền dữ liệu

![cn_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_2.png)

### Quyền dữ liệu của Sales Rep

Đây là Vai trò có nhiều người dùng nhất, nhấn mạnh:

![cn_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_3.png)

**Tại sao Lead lại được toàn nhân viên xem?**
- Bạn cần thấy Lead "chưa phân công" để chủ động nhận
- Khi kiểm tra trùng lặp cần xem dữ liệu toàn diện, tránh nhập trùng
- Lead của người khác bạn chỉ có thể xem, không thể chỉnh sửa

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**Tại sao Khách hàng chỉ xem của mình?**
- Khách hàng là tài sản cốt lõi, có quy thuộc rõ ràng
- Tránh thấy thông tin liên hệ Khách hàng của người khác
- Khi cần chuyển giao, hãy nhờ quản lý của bạn thao tác

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Người liên hệ đi theo Khách hàng**

Phạm vi Người liên hệ bạn có thể thấy:
1. Người liên hệ bạn trực tiếp phụ trách
2. **Tất cả** Người liên hệ thuộc Khách hàng bạn phụ trách (kể cả do người khác tạo)

> Ví dụ: Bạn phụ trách Khách hàng "Huawei", thì tất cả Người liên hệ thuộc Huawei bạn đều có thể thấy, bất kể là ai nhập vào.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Quyền dữ liệu của các Vai trò khác

| Vai trò | Dữ liệu có thể quản lý hoàn toàn | Dữ liệu khác |
|------|-----------------|---------|
| Sales Manager | Toàn bộ dữ liệu CRM | — |
| Executive | — | Toàn bộ chỉ đọc + xuất |
| Finance | Đơn hàng, Thanh toán, Tỷ giá, Báo giá | Còn lại chỉ đọc |
| Marketing | Lead, Nhãn Lead, Template phân tích dữ liệu | Còn lại chỉ đọc |
| Customer Success Manager | Khách hàng, Người liên hệ, Hoạt động, Bình luận, Gộp Khách hàng | Còn lại chỉ đọc |
| Technical Support | Hoạt động, Bình luận (chỉ do mình tạo) | Người liên hệ có thể xem của mình phụ trách |
| Product | Sản phẩm, Phân loại, Giá theo bậc | Còn lại chỉ đọc |

---

## Kiểm tra trùng lặp: Giải quyết vấn đề "không thấy được"

Vì dữ liệu Khách hàng đã được phân quyền theo quy thuộc, bạn không thấy được Khách hàng của Sales khác. Nhưng trước khi nhập Lead hoặc Khách hàng mới, bạn cần xác nhận **đã có ai đang theo dõi chưa**.

![cn_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_4.png)

Trang kiểm tra trùng lặp hỗ trợ ba kiểu tìm kiếm:

- **Kiểm tra trùng Lead**: Nhập tên, công ty, email hoặc di động
- **Kiểm tra trùng Khách hàng**: Nhập tên công ty hoặc điện thoại
- **Kiểm tra trùng Người liên hệ**: Nhập tên, email hoặc di động

Kết quả kiểm tra sẽ hiển thị **người phụ trách là ai**. Nếu đã tồn tại, hãy liên hệ trực tiếp với đồng nghiệp tương ứng để phối hợp, tránh đụng đơn.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## Câu hỏi thường gặp

**Q: Tôi không thấy được một trang nào đó thì sao?**

Nghĩa là Vai trò của bạn không có quyền truy cập trang đó. Nếu nghiệp vụ cần, hãy liên hệ quản trị viên để điều chỉnh.

**Q: Tôi có thể thấy dữ liệu nhưng không có nút chỉnh sửa/xóa?**

Bạn chỉ có quyền xem dữ liệu đó. Thông thường là vì nó không thuộc bạn phụ trách (owner không phải bạn). Các nút thao tác không có quyền sẽ ẩn trực tiếp, không hiển thị.

**Q: Tôi mới gia nhập một bộ phận, quyền khi nào có hiệu lực?**

Có hiệu lực ngay lập tức. Làm mới trang là có thể thấy menu mới.

**Q: Một người có thể có nhiều Vai trò không?**

Có. Vai trò cá nhân + Vai trò bộ phận sẽ cộng dồn. Ví dụ bạn cá nhân được gán "Sales Rep", lại gia nhập bộ phận Marketing, vậy bạn đồng thời có quyền của cả hai Vai trò.

## Tài liệu liên quan

- [Giới thiệu hệ thống và Dashboard](./guide-overview) — Cách sử dụng từng dashboard
- [Quản lý Lead](./guide-leads) — Quy trình toàn diện về Lead
- [Quản lý Khách hàng](./guide-customers-emails) — Chế độ xem 360 Khách hàng
