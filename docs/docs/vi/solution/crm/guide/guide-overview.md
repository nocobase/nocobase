---
title: "Giới thiệu hệ thống và Dashboard"
description: "Tổng quan hệ thống CRM 2.0: cấu trúc menu, đa ngôn ngữ và theme, Dashboard phân tích dữ liệu Analytics, workspace Overview."
keywords: "Giới thiệu CRM,Dashboard,Phân tích dữ liệu,KPI,NocoBase CRM"
---

# Giới thiệu hệ thống và Dashboard

> Chương này tập trung giới thiệu hai Dashboard—Analytics (Phân tích dữ liệu) và Overview (Workspace hằng ngày).

## Tổng quan hệ thống

CRM 2.0 là hệ thống quản lý bán hàng đầy đủ, bao phủ toàn bộ quy trình từ thu thập Lead đến giao Đơn hàng. Sau khi đăng nhập, thanh menu trên cùng chính là điểm vào điều hướng chính của bạn.


### Đa ngôn ngữ và Theme

Hệ thống hỗ trợ chuyển đổi đa ngôn ngữ (góc trên bên phải), tất cả JS Block và biểu đồ đều đã thích ứng đa ngôn ngữ.

Về theme, cả sáng và tối đều được hỗ trợ, nhưng hiện tại **khuyến nghị dùng sáng + chế độ compact**, mật độ thông tin cao hơn, một số vấn đề hiển thị ở theme tối sẽ được sửa sau.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Trung tâm phân tích dữ liệu

Analytics là trang đầu tiên trong thanh menu, cũng là giao diện đầu tiên bạn thấy mỗi khi mở hệ thống.

### Bộ lọc toàn cục

Trên đầu trang có một thanh lọc, gồm hai điều kiện lọc **Khoảng thời gian** và **Người phụ trách (Owner)**. Sau khi lọc, tất cả thẻ KPI và biểu đồ trên trang sẽ làm mới liên động.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)


### Thẻ KPI

Bên dưới thanh lọc là 4 thẻ KPI:

| Thẻ | Ý nghĩa | Hành động khi nhấn |
|------|------|---------|
| **Tổng doanh thu** | Tổng số tiền doanh thu tích lũy | Popup: biểu đồ tròn trạng thái thanh toán + xu hướng doanh thu theo tháng |
| **Lead mới** | Số Lead mới trong kỳ | Chuyển đến trang Lead, tự động lọc trạng thái "New" |
| **Tỷ lệ chuyển đổi** | Tỷ lệ Lead đến chốt đơn | Popup: biểu đồ tròn phân phối các giai đoạn + biểu đồ cột số tiền |
| **Chu kỳ chốt đơn trung bình** | Số ngày trung bình từ tạo đến chốt đơn | Popup: phân phối chu kỳ + xu hướng thắng đơn theo tháng |

Mỗi thẻ đều **có thể nhấn để drill-through**—popup sẽ hiển thị biểu đồ phân tích chi tiết hơn. Nếu có khả năng tùy biến, có thể tiếp tục drill xuống (doanh nghiệp → phòng ban → cá nhân).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[Sau khi chuyển trang dữ liệu bị ít đi?]
Khi nhấn từ KPI để chuyển đến trang danh sách, URL sẽ kèm tham số lọc (như `?status=new`). Nếu thấy dữ liệu danh sách bị ít đi, đó là vì tham số này vẫn đang có hiệu lực. Quay lại Dashboard rồi vào lại trang danh sách là sẽ khôi phục được dữ liệu đầy đủ.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)


### Vùng biểu đồ

Bên dưới KPI là 5 biểu đồ cốt lõi:

| Biểu đồ | Loại | Mô tả | Hành động khi nhấn |
|------|------|------|---------|
| **Phân phối giai đoạn Cơ hội** | Biểu đồ cột | Số lượng, số tiền, xác suất có trọng số của các giai đoạn | Popup: drill-through 3 chiều theo Khách hàng/Người phụ trách/Tháng |
| **Phễu bán hàng** | Biểu đồ phễu | Lead → Opportunity → Quotation → Order chuyển đổi | Nhấn để chuyển đến trang thực thể tương ứng |
| **Xu hướng bán hàng theo tháng** | Cột + đường | Doanh thu, số Đơn hàng, giá trung bình theo tháng | Chuyển đến trang Orders (kèm tham số tháng) |
| **Xu hướng tăng trưởng Khách hàng** | Cột + đường | Khách hàng mới, Khách hàng tích lũy theo tháng | Chuyển đến trang Customers |
| **Phân phối ngành** | Biểu đồ tròn | Khách hàng phân phối theo ngành | Chuyển đến trang Customers |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Phễu bán hàng

Hiển thị tỷ lệ chuyển đổi của pipeline đầy đủ Lead → Opportunity → Quotation → Order. Mỗi tầng đều có thể nhấn, chuyển đến trang danh sách của thực thể tương ứng (như nhấn tầng Opportunity → chuyển đến danh sách Cơ hội).

#### Xu hướng bán hàng theo tháng

Biểu đồ cột hiển thị doanh thu mỗi tháng, đường biểu đồ chồng lên số lượng Đơn hàng và giá trị Đơn hàng trung bình. Nhấn vào cột của tháng nào → chuyển đến trang Orders và tự động kèm tham số lọc thời gian của tháng đó (như `?month=2026-02`), trực tiếp xem chi tiết Đơn hàng tháng đó.

#### Xu hướng tăng trưởng Khách hàng

Biểu đồ cột hiển thị số Khách hàng mới mỗi tháng, đường biểu đồ hiển thị tổng số Khách hàng tích lũy. Nhấn vào cột của tháng nào → chuyển đến trang Customers và lọc Khách hàng mới của tháng đó.

#### Phân phối ngành

Biểu đồ tròn hiển thị Khách hàng phân phối theo ngành và số tiền Đơn hàng liên quan. Nhấn vào quạt của ngành nào → chuyển đến trang Customers và lọc Khách hàng ngành đó.

### Drill-through giai đoạn Cơ hội

Nhấn vào cột giai đoạn nào trong phân phối giai đoạn Cơ hội, sẽ hiển thị popup phân tích sâu của giai đoạn đó:

- **Xu hướng theo tháng**: Biến động hằng tháng của Cơ hội ở giai đoạn đó
- **Theo người phụ trách**: Ai đang theo dõi các Cơ hội này
- **Theo Khách hàng**: Cơ hội của Khách hàng nào đang ở giai đoạn đó
- **Tổng hợp dưới cùng**: Tích chọn Khách hàng để xem số tiền tích lũy

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)


Mỗi giai đoạn (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) có nội dung drill-through khác nhau, phản ánh trọng tâm của từng giai đoạn.

Câu hỏi cốt lõi mà biểu đồ này trả lời là: **Phễu mất nhiều nhất ở giai đoạn nào?** Nếu giai đoạn Proposal tồn đọng nhiều Cơ hội nhưng ít chuyển sang Negotiation, có nghĩa là khâu báo giá có thể có vấn đề.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Cấu hình biểu đồ (nâng cao)

Phía sau mỗi biểu đồ có ba chiều cấu hình:

1. **Nguồn dữ liệu SQL**: Quyết định biểu đồ hiển thị dữ liệu gì, có thể chạy query trong SQL builder để xác minh
2. **Style biểu đồ**: Cấu hình JSON ở vùng tùy chỉnh, kiểm soát giao diện biểu đồ
3. **Sự kiện**: Hành động khi nhấn (popup OpenView / chuyển trang)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)


### Liên động lọc

Khi sửa bất kỳ điều kiện nào trên thanh lọc trên cùng, **tất cả thẻ KPI và biểu đồ trên trang đồng thời làm mới**, không cần cài đặt từng cái. Cách dùng điển hình:

- **Xem hiệu suất của một người**: Owner chọn "Trần Văn A" → toàn bộ dữ liệu trang chuyển sang Lead, Cơ hội, Đơn hàng do Trần Văn A phụ trách
- **So sánh khoảng thời gian**: Ngày từ "Tháng này" chuyển sang "Quý này" → phạm vi biểu đồ xu hướng đồng bộ thay đổi

Liên động giữa thanh lọc và biểu đồ được hiện thực hóa qua **flow sự kiện trang**—trước khi render inject biến form, SQL của biểu đồ tham chiếu giá trị lọc qua biến.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)
:::note
Template SQL hiện chỉ hỗ trợ cú pháp `if` để phán đoán điều kiện. Khuyến nghị tham khảo template có sẵn trong hệ thống để viết, hoặc nhờ AI hỗ trợ sửa.
:::

---

## Overview — Workspace hằng ngày

Overview là Dashboard thứ hai, thiên về thao tác hằng ngày hơn là phân tích dữ liệu. Vấn đề cốt lõi mà nó giải quyết là: **Hôm nay nên làm gì? Lead nào đáng theo dõi?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)


### Lead điểm cao

Tự động lọc Lead có AI điểm ≥ 75 và trạng thái New / Working (Top 5), mỗi cái hiển thị:

- **Đồng hồ AI điểm**: Đồng hồ tròn hiển thị trực quan chất lượng Lead (xanh lá = điểm cao = đáng ưu tiên theo dõi)
- **AI gợi ý bước tiếp theo**: Hành động theo dõi do hệ thống tự động gợi ý dựa trên đặc điểm Lead (ví dụ "Schedule a demo")
- **Thông tin cơ bản Lead**: Tên, công ty, nguồn, thời gian tạo

Nhấn tên Lead có thể chuyển đến chi tiết, nhấn "Xem tất cả" chuyển đến trang danh sách Lead. Mỗi sáng đi làm liếc qua bảng này, là biết hôm nay nên ưu tiên liên hệ ai.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Tác vụ hôm nay

Danh sách hoạt động trong ngày (họp, gọi điện, tác vụ, v.v.), hỗ trợ:

- **Hoàn thành một cú nhấn**: Nhấn "Done" để đánh dấu tác vụ hoàn thành, sau khi hoàn thành sẽ chuyển xám
- **Nhắc nhở quá hạn**: Tác vụ quá hạn chưa hoàn thành sẽ được highlight đỏ
- **Xem chi tiết**: Nhấn tên tác vụ để vào chi tiết
- **Tạo tác vụ mới**: Tạo bản ghi hoạt động mới trực tiếp ở đây

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Lịch hoạt động

View lịch FullCalendar, phân biệt màu theo loại hoạt động (họp/gọi điện/tác vụ/email/note). Hỗ trợ chuyển đổi tháng/tuần/ngày, có thể kéo thả đổi ngày, nhấn để xem chi tiết.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Các Dashboard khác (More Charts)

Trong menu còn có ba Dashboard khác cho các Vai trò khác nhau dùng, chỉ mang tính tham khảo, có thể giữ hoặc ẩn theo nhu cầu:

| Dashboard | Người dùng mục tiêu | Đặc điểm |
|--------|---------|------|
| **SalesManager** | Quản lý bán hàng | Xếp hạng đội, biểu đồ phân tán rủi ro, mục tiêu tháng |
| **SalesRep** | Nhân viên bán hàng | Dữ liệu tự động lọc theo người dùng hiện tại, chỉ xem hiệu suất của mình |
| **Executive** | Điều hành | Dự báo doanh thu, sức khỏe Khách hàng, xu hướng Win/Loss |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Dashboard không cần dùng có thể ẩn trong menu, không ảnh hưởng đến tính năng hệ thống.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## KPI Drill-through

Bạn có thể đã nhận ra, hầu hết các con số, biểu đồ giới thiệu ở trên đều "có thể nhấn". Đây là mô hình tương tác cốt lõi nhất trong CRM—**KPI Drill-through**: nhấn vào một con số tổng hợp → xem dữ liệu chi tiết phía sau con số đó.

Drill-through có hai dạng:

| Dạng | Tình huống áp dụng | Ví dụ |
|------|---------|------|
| **Drill-through popup** | Phân tích so sánh đa chiều | Nhấn "Tổng doanh thu" → popup hiển thị biểu đồ tròn + xu hướng |
| **Chuyển trang** | Xem và thao tác bản ghi chi tiết | Nhấn "Lead mới" → chuyển đến danh sách Leads |

**Ví dụ thao tác**: Trong biểu đồ "Xu hướng bán hàng theo tháng" của Analytics, bạn phát hiện cột doanh thu tháng 2 thấp rõ rệt → nhấn vào cột đó → hệ thống chuyển đến trang Orders và tự động kèm `tháng = 2026-02` → bạn trực tiếp thấy toàn bộ chi tiết Đơn hàng tháng 2, có thể tiếp tục điều tra nguyên nhân.

> Dashboard không chỉ để "xem", nó là trung tâm điều hướng của toàn hệ thống. Mỗi con số đều là một điểm vào, dẫn bạn từ vĩ mô đến vi mô, từng tầng tìm ra gốc rễ vấn đề.

---

Sau khi hiểu toàn cảnh hệ thống và Dashboard, tiếp theo đi vào quy trình nghiệp vụ cốt lõi—bắt đầu từ [Quản lý Lead](./guide-leads).

## Trang liên quan

- [Hướng dẫn sử dụng CRM](./index.md)
- [Quản lý Lead](./guide-leads)
- [AI Employee](./guide-ai)
