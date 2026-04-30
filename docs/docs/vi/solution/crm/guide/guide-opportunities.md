---
title: "Cơ hội và Báo giá"
description: "Hướng dẫn quản lý Cơ hội trong CRM: chế độ xem Kanban, chuyển giai đoạn, tạo báo giá, hỗ trợ đa tiền tệ, quy trình phê duyệt."
keywords: "Quản lý Cơ hội,Phễu bán hàng,Kanban,Phê duyệt báo giá,Đa tiền tệ,NocoBase CRM"
---

# Cơ hội và Báo giá

> Cơ hội là trung tâm của toàn bộ quy trình bán hàng — nó đại diện cho một giao dịch có khả năng được chốt. Trong chương này, bạn sẽ học cách dùng Kanban để chuyển giai đoạn của Cơ hội, tạo báo giá, hoàn tất quy trình phê duyệt, và cuối cùng chuyển báo giá thành Đơn hàng chính thức.

![cn_02-opportunities](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_02-opportunities.png)

## Tổng quan trang Cơ hội

Từ menu bên trái, vào **Sales → Opportunities**, bạn sẽ thấy ở đầu trang có hai tab:

- **Pipeline Kanban**: Hiển thị tất cả Cơ hội theo từng giai đoạn dưới dạng bảng Kanban, phù hợp cho việc theo dõi hằng ngày và đẩy nhanh tiến trình.
- **Chế độ xem bảng**: Hiển thị Cơ hội dưới dạng danh sách, phù hợp để lọc hàng loạt và xuất dữ liệu.

Mặc định mở Pipeline Kanban — đây cũng là chế độ xem mà nhân viên bán hàng dùng nhiều nhất.

![02-opportunities-2026-04-07-00-56-47](https://static-docs.nocobase.com/02-opportunities-2026-04-07-00-56-47.png)

## Pipeline Kanban

### Thanh bộ lọc

Phía trên bảng Kanban có một loạt nút lọc giúp bạn nhanh chóng tập trung vào các phạm vi Cơ hội khác nhau:

| Nút | Tác dụng |
|------|------|
| **All Pipeline** | Hiển thị tất cả Cơ hội đang tiến hành |
| **My Deals** | Chỉ xem các Cơ hội được giao cho bạn |
| **Big Deals** | Các giao dịch lớn có giá trị ≥ $50K |
| **Closing Soon** | Cơ hội dự kiến đóng trong vòng 30 ngày |

Thanh bộ lọc cũng bao gồm **2 thẻ thống kê** — Open Deals (số Cơ hội đang tiến hành) và Pipeline Value (tổng giá trị pipeline), cùng với một **ô tìm kiếm thời gian thực**, nhập tên Cơ hội, tên Khách hàng hoặc người phụ trách để định vị nhanh.

:::tip
Các nút lọc này sử dụng khả năng liên kết khối chéo của NocoBase (`initResource` + `addFilterGroup`), có thể lọc dữ liệu trên Kanban theo thời gian thực mà không cần làm mới trang.
:::

![02-opportunities-2026-04-07-01-00-37](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-00-37.gif)

### Cột Kanban

Bảng Kanban được chia thành **6 cột**, tương ứng với 6 giai đoạn của Cơ hội:

```
Prospecting → Analysis → Proposal → Negotiation → Won → Lost
  Tiếp cận     Phân tích   Đề xuất     Thương lượng   Thắng   Thua
```

Tiêu đề mỗi cột hiển thị: tên giai đoạn, số lượng Cơ hội ở giai đoạn đó, tổng giá trị, và một nút "+" để thêm nhanh.

Mỗi thẻ sẽ hiển thị các thông tin sau:

- **Tên Cơ hội**: Ví dụ "Dự án ERP của Công ty công nghệ ABC"
- **Tên Khách hàng**: Công ty Khách hàng được liên kết
- **Giá trị dự kiến**: Ví dụ $50K
- **Tỷ lệ thắng**: Hiển thị bằng nhãn màu (xanh = xác suất cao, vàng = trung bình, đỏ = thấp)
- **Avatar người phụ trách**: Ai đang theo dõi Cơ hội này

### Kéo thả để chuyển giai đoạn

Cách thao tác trực quan nhất: **kéo thẻ trực tiếp từ một cột sang cột khác**, hệ thống sẽ tự động cập nhật giai đoạn của Cơ hội.

Ví dụ, khi bạn đã hoàn thành phân tích nhu cầu và chuẩn bị gửi đề xuất, hãy kéo thẻ từ Analysis sang Proposal.

![02-opportunities-2026-04-07-01-02-09](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-02-09.gif)

## Chế độ xem bảng

Chuyển sang tab chế độ xem bảng, bạn sẽ thấy một bảng dữ liệu tiêu chuẩn.

### Nút bộ lọc

Phía trên bảng cũng có một nhóm nút lọc, bao gồm:

- **All**: Tất cả Cơ hội
- **In Pipeline**: Cơ hội đang tiến hành (loại trừ đã thắng và thua)
- **Closing Soon**: Sắp đến hạn
- **Won**: Đã thắng
- **Lost**: Đã thua

Mỗi nút đều có **số liệu thống kê** kèm theo, giúp bạn nhìn ra phân bố Cơ hội theo từng trạng thái.

Phía dưới bảng có một **hàng tổng hợp**: hiển thị tổng giá trị các Cơ hội đã chọn/tất cả, cùng với nhãn phân bố giai đoạn, giúp bạn nắm được tình hình tổng thể nhanh chóng.

### Xem chi tiết

Nhấn vào bất kỳ hàng nào trong bảng, một popup chi tiết Cơ hội sẽ hiện ra — đây là giao diện chính để bạn quản lý từng Cơ hội.

![02-opportunities-2026-04-07-01-05-05](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-05.png)

## Chi tiết Cơ hội

Popup chi tiết Cơ hội là giao diện chứa nhiều thông tin nhất, từ trên xuống dưới gồm các module sau:

![02-opportunities-2026-04-07-01-05-42](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-42.png)


### Thanh tiến trình giai đoạn

Phía trên cùng của chi tiết có một **thanh giai đoạn tương tác** (Steps component), hiển thị rõ ràng giai đoạn hiện tại của Cơ hội.

Bạn có thể **nhấn trực tiếp vào một giai đoạn trên thanh** để chuyển Cơ hội. Khi bạn nhấn **Won** hoặc **Lost**, hệ thống sẽ hiển thị hộp thoại xác nhận, vì đây là hai thao tác trạng thái cuối, một khi xác nhận thì khó hoàn tác.

![02-opportunities-2026-04-07-01-06-54](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-06-54.gif)

### Chỉ số chính

Bên dưới thanh giai đoạn hiển thị bốn chỉ số cốt lõi:

| Chỉ số | Mô tả |
|------|------|
| **Giá trị dự kiến** | Giá trị thành giao dịch ước tính của Cơ hội này |
| **Ngày chốt dự kiến** | Khi nào dự định đóng |
| **Số ngày ở giai đoạn hiện tại** | Đã ở giai đoạn hiện tại bao lâu (dùng để nhận diện Cơ hội bị đình trệ) |
| **Tỷ lệ thắng AI** | Xác suất chốt được hệ thống tính toán dựa trên dữ liệu đa chiều |

### Phân tích rủi ro AI

Đây là một trong những tính năng nổi bật của CRM. Hệ thống sẽ tự động phân tích tình trạng sức khỏe của Cơ hội, hiển thị:

- **Vòng tròn tỷ lệ thắng**: Biểu đồ hình vòng trực quan thể hiện xác suất chốt
- **Danh sách yếu tố rủi ro**: Ví dụ "Đã hơn 14 ngày kể từ lần liên hệ Khách hàng cuối", "Đối thủ chào giá thấp hơn"...
- **Hành động được đề xuất**: Gợi ý bước tiếp theo từ AI, ví dụ "Sắp xếp một buổi demo Sản phẩm"


### Danh sách Báo giá
![02-opportunities-2026-04-07-01-16-19](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-16-19.png)
Phần giữa của chi tiết hiển thị **tất cả các Báo giá liên kết với Cơ hội này**, dưới dạng bảng con. Mỗi hàng hiển thị mã báo giá, giá trị, trạng thái... và trạng thái phê duyệt được biểu thị bằng nhãn trực quan (Bản nháp, Đang phê duyệt, Đã duyệt, Đã từ chối).

### Bình luận và Tệp đính kèm

Bên phải của chi tiết là khu vực bình luận và tệp đính kèm, các thành viên trong nhóm có thể trao đổi tiến độ và tải lên tệp liên quan tại đây.
![02-opportunities-2026-04-07-01-17-01](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-17-01.png)

## Tạo Báo giá

Sẵn sàng gửi báo giá cho Khách hàng? Quy trình thực hiện như sau:

**Bước 1**: Mở chi tiết Cơ hội, tìm khu vực danh sách Báo giá.

**Bước 2**: Nhấn nút **Add new** (Thêm mới), hệ thống sẽ hiển thị form Báo giá.

**Bước 3**: Điền thông tin cơ bản của Báo giá, bao gồm tên báo giá, thời hạn hiệu lực...

**Bước 4**: Trong **bảng con chi tiết Sản phẩm**, thêm các dòng báo giá:

| Trường | Mô tả |
|------|------|
| **Sản phẩm** | Chọn từ danh mục Sản phẩm |
| **Quy cách** | Chỉ đọc, tự động điền sau khi chọn Sản phẩm |
| **Đơn vị** | Chỉ đọc, tự động điền |
| **Số lượng** | Số lượng báo giá |
| **Giá niêm yết** | Chỉ đọc, giá niêm yết trong danh mục Sản phẩm |
| **Đơn giá** | Chỉ đọc, tự động khớp giá theo bậc dựa trên số lượng |
| **Tỷ lệ chiết khấu** | Chỉ đọc, chiết khấu trong giá theo bậc |
| **Giá trị dòng** | Tự động tính toán |

Hệ thống sẽ tự động hoàn thành chuỗi tính giá: tổng phụ → chiết khấu → thuế → phí vận chuyển → tổng giá trị → giá trị quy đổi USD. Trong form có một khối JS Block hiển thị quy tắc tự động điền và công thức tính.

**Bước 5**: Nếu Khách hàng giao dịch bằng tiền tệ ngoài USD, hãy chọn loại tiền tệ tương ứng. Hệ thống sẽ **khóa tỷ giá hiện tại** khi tạo, và tự động quy đổi sang giá trị USD, đảm bảo việc đối chiếu sau này không bị ảnh hưởng bởi biến động tỷ giá.

**Bước 6**: Sau khi xác nhận thông tin chính xác, nhấn submit để lưu Báo giá. Lúc này trạng thái Báo giá là **Draft (Bản nháp)**.

![02-opportunities-2026-04-07-01-09-11](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-11.gif)

## Quy trình phê duyệt Báo giá

Sau khi tạo Báo giá, nó sẽ không có hiệu lực ngay — cần qua quy trình phê duyệt để đảm bảo báo giá hợp lý, mức chiết khấu trong phạm vi được ủy quyền.

### Tổng quan quy trình phê duyệt

```
Draft (Bản nháp) → Pending Approval (Chờ phê duyệt) → Manager Review (Quản lý xem xét) → Approved / Rejected / Returned
```

![02-opportunities-2026-04-07-01-09-38](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-38.png)

### Gửi phê duyệt

**Bước 1**: Trong chi tiết Cơ hội, tìm Báo giá có trạng thái Draft, nhấn nút **Submit for Approval** (Gửi phê duyệt).

:::note
Nút này **chỉ hiển thị khi trạng thái Báo giá là Draft**. Báo giá đã gửi hoặc đã duyệt sẽ không hiển thị nút này.
:::

**Bước 2**: Hệ thống tự động cập nhật trạng thái Báo giá thành **Pending Approval**, và kích hoạt Workflow phê duyệt.

**Bước 3**: Quản lý phê duyệt được chỉ định sẽ nhận được thông báo nhiệm vụ phê duyệt trong hệ thống.

![02-opportunities-2026-04-07-01-12-20](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-12-20.png)

### Quản lý phê duyệt

Khi quản lý phê duyệt mở nhiệm vụ, sẽ thấy các nội dung sau:

**Thẻ phê duyệt**: Hiển thị thông tin chính của Báo giá — mã báo giá, tên, giá trị (tiền tệ gốc + USD quy đổi), trạng thái hiện tại.

**Chi tiết phê duyệt**: Hiển thị toàn bộ nội dung Báo giá ở chế độ chỉ đọc, bao gồm:
- Thông tin cơ bản (tên báo giá, thời hạn hiệu lực, tiền tệ)
- Liên kết Khách hàng và Cơ hội
- Bảng con chi tiết Sản phẩm (Sản phẩm, số lượng, đơn giá, chiết khấu, tổng phụ)
- Tổng giá trị
- Điều khoản và ghi chú

**Nút thao tác**: Quản lý phê duyệt có thể thực hiện các thao tác sau:

| Thao tác | Hiệu ứng |
|------|------|
| **Approve (Duyệt)** | Trạng thái Báo giá chuyển thành Approved |
| **Reject (Từ chối)** | Trạng thái Báo giá chuyển thành Rejected, cần nêu lý do |
| **Return (Trả lại)** | Báo giá được trả về cho người tạo để chỉnh sửa, trạng thái về lại Draft |
| **Add Approver (Thêm người duyệt)** | Thêm một người phê duyệt nữa |
| **Transfer (Chuyển duyệt)** | Chuyển nhiệm vụ phê duyệt cho người khác xử lý |

![02-opportunities-2026-04-07-01-13-04](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-04.png)

### Xử lý kết quả phê duyệt

- **Duyệt**: Trạng thái Báo giá chuyển thành Approved, có thể vào bước tiếp theo — chuyển thành Đơn hàng chính thức.
- **Từ chối / Trả lại**: Trạng thái Báo giá quay về Draft, người tạo có thể chỉnh sửa và gửi phê duyệt lại.

![02-opportunities-2026-04-07-01-13-25](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-25.png)

## Chuyển Báo giá thành Đơn hàng

Khi trạng thái Báo giá là **Approved (Đã duyệt)**, bạn sẽ thấy một nút **New Order** (Tạo Đơn hàng) trong khu vực thao tác Báo giá.

:::note
Nút này **chỉ hiển thị khi trạng thái Báo giá là Approved**. Báo giá ở trạng thái nháp hoặc đang phê duyệt sẽ không hiển thị nút này.
:::

Nhấn **New Order**, hệ thống sẽ tự động tạo bản nháp Đơn hàng dựa trên dữ liệu của Báo giá, bao gồm chi tiết Sản phẩm, giá trị, thông tin Khách hàng..., giúp tiết kiệm công sức nhập lại.

![02-opportunities-2026-04-07-01-14-41](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-14-41.png)

---

Sau khi Báo giá được phê duyệt, bạn có thể chuyển nó thành Đơn hàng chính thức. Tiếp theo, hãy xem [Quản lý Đơn hàng](./guide-products-orders) để tìm hiểu quy trình tiếp theo của Đơn hàng.

## Trang liên quan

- [Hướng dẫn sử dụng CRM](./index.md)
- [Quản lý Lead](./guide-leads)
- [Quản lý Đơn hàng](./guide-products-orders)
