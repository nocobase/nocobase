---
title: "Quản lý Lead"
description: "Hướng dẫn quản lý Lead trong CRM: tạo Lead, AI tự động chấm điểm, lọc thông minh, chuyển Lead thành Khách hàng và Cơ hội."
keywords: "Quản lý Lead,Lead,Chấm điểm AI,Chuyển đổi Lead,Phễu bán hàng,NocoBase CRM"
---

# Quản lý Lead

> Lead là điểm khởi đầu của quy trình bán hàng — mỗi lần tiếp cận đầu tiên với một khách hàng tiềm năng đều bắt đầu từ đây. Chương này sẽ hướng dẫn bạn đi qua trọn vòng đời của Lead: tạo, chấm điểm, lọc, theo dõi, chuyển đổi.

![cn_01-leads](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_01-leads.png)

## Tổng quan trang Lead

Trên menu phía trên, nhấn **Sales → Leads** để vào trang quản lý Lead.

![01-leads-2026-04-02-00-04-18](https://static-docs.nocobase.com/01-leads-2026-04-02-00-04-18.png)

Phía trên trang là một loạt **nút lọc thông minh**, giúp bạn nhanh chóng chuyển đổi giữa các chế độ xem:

Nhóm thứ nhất:

| Nút | Mô tả |
|------|------|
| All | Hiển thị tất cả Lead |
| New | Trạng thái mới tạo, chưa bắt đầu theo dõi |
| Working | Đang theo dõi |
| Qualified | Đã xác nhận là Lead đủ điều kiện |
| Unqualified | Đã đánh dấu là không đủ điều kiện |

Nhóm thứ hai:

| Nhãn | Ý nghĩa |
|------|------|
| 🔥 Hot | Lead có điểm AI ≥ 75 |
| Hôm nay | Lead được tạo hôm nay |
| Tuần này | Lead được tạo trong tuần này |
| Tháng này | Lead được tạo trong tháng này |
| Chưa phân công | Lead chưa được chỉ định Owner |
| Doanh nghiệp lớn | Lead có nguồn từ Khách hàng cấp doanh nghiệp |


![01-leads-2026-04-02-00-06-19](https://static-docs.nocobase.com/01-leads-2026-04-02-00-06-19.gif)


Bảng giúp bạn nắm được thông tin chính trong nháy mắt, gồm các cột phức hợp:

- **Vòng tròn điểm AI**: Đồng hồ tròn 0–100 điểm, đỏ (thấp) → vàng (trung) → xanh (cao), phản ánh trực quan chất lượng Lead
- **Cột phức hợp Tên + Công ty**: Tên và tên công ty được hợp nhất hiển thị, tiết kiệm không gian
- **Cột phức hợp Email + Điện thoại**: Thông tin liên hệ rõ ràng
- **Cột thời gian tương đối**: Hiển thị "3 giờ trước", "2 ngày trước"..., các Lead bị quá hạn sẽ được làm nổi bật màu đỏ để nhắc bạn theo dõi kịp thời

![01-leads-2026-04-02-00-07-04](https://static-docs.nocobase.com/01-leads-2026-04-02-00-07-04.gif)

## Tạo Lead

Nhấn nút **Add new** ở trên bảng để mở form tạo Lead mới.

![01-leads-2026-04-02-00-08-08](https://static-docs.nocobase.com/01-leads-2026-04-02-00-08-08.png)

Điền các thông tin sau:

| Trường | Mô tả | Bắt buộc |
|------|------|---------|
| Name | Tên Lead | ✅ |
| Company | Công ty đang làm việc | Khuyến nghị điền |
| Email | Địa chỉ email | Khuyến nghị điền |
| Phone | Số điện thoại | Khuyến nghị điền |
| Source | Nguồn Lead (như form web, hội chợ, giới thiệu...) | Khuyến nghị điền |
...

### Kiểm tra trùng lặp thời gian thực

Trong quá trình bạn điền form, hệ thống sẽ kiểm tra trùng lặp các trường tên, công ty, email, điện thoại, di động theo thời gian thực. Khi bạn nhập, nếu phát hiện bản ghi đã có khớp:

- **Cảnh báo vàng**: Phát hiện bản ghi tương tự, đề nghị bạn xác minh
- **Cảnh báo đỏ**: Phát hiện bản ghi trùng lặp hoàn toàn, mạnh mẽ đề nghị kiểm tra bản ghi đã có trước

![01-leads-2026-04-02-00-11-05](https://static-docs.nocobase.com/01-leads-2026-04-02-00-11-05.png)


Điều này giúp tránh hiệu quả việc cùng một người được nhập nhiều lần.

### Tự động điền form bằng AI

Nếu bạn có một đoạn văn bản từ danh thiếp hoặc bản ghi cuộc trò chuyện, không cần điền từng trường thủ công — nhấn nút AI, chọn "Tự động điền form", dán nội dung văn bản, AI sẽ tự động trích xuất tên, công ty, email, điện thoại... và điền vào form bằng một cú nhấn.

Sau khi điền xong, nhấn **Submit** để lưu.

![01-leads-2026-04-02-00-15-14](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-14.png)

### AI tự động chấm điểm

Sau khi lưu, hệ thống sẽ tự động kích hoạt **Workflow chấm điểm AI**. AI sẽ phân tích tổng hợp các thông tin của Lead và sinh ra các kết quả sau:

| Đầu ra AI | Mô tả |
|---------|------|
| Score | Điểm tổng hợp 0–100 |
| Conversion Probability | Dự đoán xác suất chuyển đổi |
| NBA (Hành động được đề xuất tiếp theo) | Đề xuất theo dõi từ AI, ví dụ "Đề nghị gọi điện trong vòng 24 giờ" |
| Tags | Nhãn được tạo tự động, như "Quan tâm cao", "Người ra quyết định"... |

![01-leads-2026-04-02-00-15-53](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-53.png)

> 💡 **Mẹo**: Điểm AI càng cao, chất lượng Lead càng tốt. Khuyến nghị ưu tiên theo dõi các Lead Hot (≥ 75 điểm), tập trung công sức vào những Khách hàng có khả năng chốt cao nhất.

## Lọc và tìm kiếm

Các nút lọc thông minh phía trên hỗ trợ **lọc thời gian thực** — nhấn là có hiệu lực ngay, không cần làm mới trang.

Một vài tình huống thường dùng:

- **Bắt đầu ngày làm việc**: Nhấn "Hôm nay" để xem các Lead mới đến hôm nay, rồi nhấn "Hot" để xem có Lead điểm cao nào cần theo dõi ngay không
- **Phân công Lead**: Nhấn "Chưa phân công" để tìm các Lead chưa có Owner, lần lượt phân công cho đồng nghiệp Sales
- **Lọc xem lại**: Nhấn "Unqualified" để xem lại các Lead bị đánh dấu không đủ điều kiện, kiểm tra xem có đánh giá sai không

> 💡 **Mẹo**: Hệ thống hỗ trợ lọc trực tiếp qua tham số URL. Ví dụ khi truy cập trang Lead với `?status=new`, trang sẽ tự động chọn nút lọc "New". Điều này rất tiện khi điều hướng từ trang khác.

## Chi tiết Lead

Nhấn vào bất kỳ Lead nào trong bảng để mở popup chi tiết. Popup gồm **3 tab**:

### Tab Chi tiết

Đây là tab có nhiều thông tin nhất, từ trên xuống dưới gồm:

![01-leads-2026-04-02-00-17-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-36.png)

**Chuyển giai đoạn và nút thao tác**

Khu vực phía trên gồm thanh tiến trình giai đoạn và các nút thao tác (Edit / Convert / Lost / Assign). Thanh tiến trình giai đoạn:

```
New → Working → Converted / Lost
```

Bạn có thể trực tiếp **nhấn vào giai đoạn tương ứng** để chuyển trạng thái Lead. Ví dụ khi bắt đầu theo dõi, nhấn "Working", khi xác nhận Lead đủ điều kiện, nhấn "Converted" để kích hoạt quy trình chuyển đổi.

![01-leads-2026-04-02-00-23-03](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-03.png)

Nếu đã có đối tượng mục tiêu (Khách hàng, người liên hệ, Cơ hội), bạn chỉ cần tìm và chọn. Nếu chưa có, nhấn nút tạo mới ở bên phải ô nhập, popup tạo mới sẽ mở ra và tự động điền nội dung liên kết với Lead.
![01-leads-2026-04-07-00-14-21](https://static-docs.nocobase.com/01-leads-2026-04-07-00-14-21.gif)


Nhấn "Lost" sẽ hiện hộp thoại để bạn điền lý do thua — tiện cho việc xem xét và phân tích sau này.

![01-leads-2026-04-02-00-23-25](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-25.png)


**Thẻ điểm AI**

Hiển thị chi tiết điểm AI, gồm:
- Vòng tròn AI Score (0–100)
- Conversion Probability (Xác suất chuyển đổi)
- Pipeline Days (Số ngày trong pipeline)
- NBA (Hành động được đề xuất tiếp theo)

**Khu vực huy hiệu**

Dùng huy hiệu màu để hiển thị các thuộc tính chính như Rating (Đánh giá), Status (Trạng thái), Source (Nguồn).

**Thông tin cơ bản và nút tắt hoạt động**

Thông tin công ty, thông tin liên lạc... và các trường cơ bản. Khu vực này còn có một nhóm nút tắt hoạt động: Log Call (Ghi cuộc gọi), Send Email (Gửi email), Schedule (Tạo lịch hẹn), thao tác xong sẽ tự động liên kết với Lead hiện tại.

**AI Insights**

Phân tích insight và đề xuất theo dõi do AI sinh ra.

**Khu vực bình luận**

Các thành viên trong nhóm có thể để lại bình luận thảo luận, tất cả bình luận sẽ tự động được di chuyển sang bản ghi Khách hàng mới được tạo sau khi Lead được chuyển đổi.

![01-leads-2026-04-02-00-24-10](https://static-docs.nocobase.com/01-leads-2026-04-02-00-24-10.png)

### Tab Email

Hiển thị tất cả email qua lại liên kết với Lead này, tiện cho việc xem lại lịch sử trao đổi. Hỗ trợ gửi email trực tiếp tại đây và có nút hỗ trợ AI.

![01-leads-2026-04-02-00-17-57](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-57.png)

### Tab Lịch sử thay đổi

Ghi lại tất cả các thay đổi trường của Lead này, chính xác đến "ai vào lúc nào đã đổi trường nào từ A sang B". Dùng để truy nguyên và xem lại.

![01-leads-2026-04-02-00-22-07](https://static-docs.nocobase.com/01-leads-2026-04-02-00-22-07.png)


## Chuyển đổi Lead

Đây là **thao tác cốt lõi nhất** trong quản lý Lead — chuyển một Lead đủ điều kiện thành Khách hàng, Người liên hệ và Cơ hội chỉ với một cú nhấn.

### Cách chuyển đổi

Trong popup chi tiết Lead, nhấn vào giai đoạn **Converted** trên component chuyển giai đoạn.

![01-leads-2026-04-02-00-26-01](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-01.png)

### Quy trình chuyển đổi

Hệ thống sẽ tự động kích hoạt **Workflow chuyển đổi Lead**, hoàn thành các thao tác sau cùng một lúc:

1. **Tạo Khách hàng (Customer)** — Tạo bản ghi Khách hàng mới với tên công ty của Lead, tên/ngành/quy mô/địa chỉ tự động điền từ Lead, kèm theo kiểm tra trùng lặp
2. **Tạo Người liên hệ (Contact)** — Tạo Người liên hệ với tên, email, điện thoại, chức vụ của Lead, và liên kết với Khách hàng
3. **Tạo Cơ hội (Opportunity)** — Tạo bản ghi Cơ hội mới, tên/nguồn/giá trị/giai đoạn tự động điền từ Lead, liên kết với Khách hàng
4. **Di chuyển bình luận** — Tất cả bình luận trên Lead được tự động sao chép sang bản ghi mới
5. **Cập nhật trạng thái Lead** — Trạng thái Lead được đánh dấu Qualified

### Hiệu quả sau khi chuyển đổi

Sau khi chuyển đổi xong, quay lại danh sách Lead, bạn sẽ thấy **cột phức hợp Tên + Công ty** của Lead này trở thành liên kết có thể nhấn:

- Nhấn vào Tên → Chuyển đến chi tiết Người liên hệ
- Nhấn vào Tên Công ty → Chuyển đến chi tiết Khách hàng

![01-leads-2026-04-02-00-26-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-36.png)

> 💡 **Mẹo**: Chuyển đổi là thao tác không thể hoàn tác. Trước khi chuyển đổi, hãy xác nhận thông tin Lead chính xác và đầy đủ, đặc biệt là tên công ty và thông tin liên hệ — chúng sẽ trực tiếp trở thành dữ liệu khởi tạo của Khách hàng và Người liên hệ.

## Phân công tự động

Khi một Lead chưa được chỉ định Owner, hệ thống sẽ tự động kích hoạt **Workflow phân công Lead**.

Logic phân công rất đơn giản: **tự động phân công cho nhân viên Sales đang có ít Lead nhất**, đảm bảo khối lượng công việc cân bằng trong nhóm.

Workflow này sẽ kiểm tra cả khi tạo và cập nhật Lead — nếu trường Owner trống, sẽ tự động phân công.

> 💡 **Mẹo**: Nếu bạn muốn chỉ định Owner thủ công, hãy chỉnh sửa trường Owner trực tiếp trong chi tiết. Phân công thủ công sẽ ghi đè kết quả phân công tự động.

---

Sau khi chuyển đổi Lead xong, Khách hàng và Cơ hội của bạn đã sẵn sàng. Tiếp theo, hãy xem [Cơ hội và Báo giá](./guide-opportunities) để tìm hiểu cách đẩy phễu bán hàng.

## Trang liên quan

- [Tổng quan hướng dẫn CRM](./index.md)
- [Cơ hội và Báo giá](./guide-opportunities)
- [Quản lý Khách hàng](./guide-customers-emails)
