---
pkg: "@nocobase/plugin-ai"
title: "Hướng dẫn Prompt engineering cho Nhân viên AI"
description: "Viết Prompt chất lượng cao cho Nhân viên AI: công thức vàng 9 yếu tố, ví dụ thực chiến với Viz, thẻ XML, mô-đun hóa tái sử dụng, quy tắc MUST/ALWAYS/NEVER, tối ưu lặp 5 bước."
keywords: "Prompt engineering,System Prompt,Role setting,AI Prompt,NocoBase"
---

# Nhân viên AI · Hướng dẫn Prompt engineering

> Từ "viết thế nào" đến "viết tốt", hướng dẫn này dạy bạn viết Prompt chất lượng cao theo cách đơn giản, ổn định, có thể tái sử dụng.

## 1. Tại sao Prompt rất quan trọng

Prompt chính là "bản mô tả công việc" của Nhân viên AI, trực tiếp quyết định phong cách, ranh giới và chất lượng đầu ra của nó.

**Ví dụ so sánh:**

Prompt không rõ ràng:

```
Bạn là một trợ lý phân tích dữ liệu, giúp người dùng phân tích dữ liệu.
```

Prompt rõ ràng có thể kiểm soát:

```
Bạn là Viz, một chuyên gia phân tích dữ liệu.

Định vị vai trò
- Phong cách: Khả năng insight mạnh, diễn đạt rõ ràng, coi trọng trực quan hóa
- Sứ mệnh: Kể dữ liệu phức tạp thành "câu chuyện biểu đồ" dễ hiểu

Quy trình làm việc
1) Hiểu nhu cầu
2) Tạo SQL an toàn (chỉ dùng SELECT)
3) Trích xuất insight
4) Trình bày bằng biểu đồ

Quy tắc cứng
- MUST: Chỉ sử dụng SELECT, tuyệt đối không sửa đổi dữ liệu
- ALWAYS: Mặc định tạo biểu đồ trình bày
- NEVER: Bịa đặt hoặc đoán dữ liệu

Định dạng đầu ra
Kết luận ngắn gọn (2-3 câu) + JSON biểu đồ ECharts
```

**Kết luận**: Prompt tốt nói rõ "là ai, làm gì, làm thế nào, đạt tiêu chuẩn nào", AI sẽ hoạt động ổn định và có thể kiểm soát.


## 2. Công thức vàng "9 yếu tố" của Prompt

Một cấu trúc đã được thực hành chứng minh là hữu dụng:

```
Đặt tên + Chỉ thị kép + Xác nhận mô phỏng + Nhấn mạnh lặp lại + Quy tắc bắt buộc
+ Thông tin nền + Khích lệ tích cực + Ví dụ tham khảo + Ví dụ phản diện (tùy chọn)
```

### 2.1 Giải thích các yếu tố

| Yếu tố | Giải quyết vấn đề gì | Tại sao hiệu quả |
| ---- | ----------------- | ------------ |
| Đặt tên | Xác định danh tính và phong cách | Để AI thiết lập "cảm giác vai trò" |
| Chỉ thị kép | Phân biệt "tôi là ai/tôi cần làm gì" | Giảm nhầm lẫn định vị |
| Xác nhận mô phỏng | Lặp lại trước khi thực thi | Ngăn chặn lệch hướng |
| Nhấn mạnh lặp lại | Điểm chính xuất hiện nhiều lần | Nâng cao độ ưu tiên |
| Quy tắc bắt buộc | MUST/ALWAYS/NEVER | Hình thành đường ranh |
| Thông tin nền | Kiến thức và ràng buộc cần thiết | Giảm hiểu lầm |
| Khích lệ tích cực | Hướng dẫn kỳ vọng và phong cách | Ngữ điệu và biểu hiện ổn định hơn |
| Ví dụ tham khảo | Đối tượng bắt chước trực tiếp | Đầu ra gần với kỳ vọng hơn |
| Ví dụ phản diện | Tránh các bẫy thường gặp | Có lỗi thì sửa, càng dùng càng chính xác |

### 2.2 Mẫu nhanh để bắt đầu

```yaml
# 1) Đặt tên
Bạn là [Tên], một [vị trí/chuyên môn] xuất sắc.

# 2) Chỉ thị kép
## Vai trò
Phong cách: [tính từ x2-3]
Sứ mệnh: [Một câu mô tả trách nhiệm chính]

## Quy trình tác vụ
1) Hiểu: [điểm chính]
2) Thực thi: [điểm chính]
3) Xác minh: [điểm chính]
4) Trình bày: [điểm chính]

# 3) Xác nhận mô phỏng
Lặp lại sự hiểu biết trước khi thực thi: "Tôi hiểu rằng bạn cần... Tôi sẽ hoàn thành thông qua..."

# 4) Nhấn mạnh lặp lại
Yêu cầu cốt lõi: [1-2 điểm quan trọng nhất] (xuất hiện ít nhất 2 lần ở đầu/quy trình/cuối)

# 5) Quy tắc bắt buộc
MUST: [Quy tắc không được vi phạm]
ALWAYS: [Nguyên tắc tuân thủ nhất quán]
NEVER: [Mục cấm rõ ràng]

# 6) Thông tin nền
[Kiến thức lĩnh vực cần thiết/ngữ cảnh/bẫy thường gặp]

# 7) Khích lệ tích cực
Bạn xuất sắc về [năng lực], giỏi về [sở trường], vui lòng giữ phong cách này để hoàn thành tác vụ.

# 8) Ví dụ tham khảo
[Đưa ra ví dụ ngắn gọn về "đầu ra lý tưởng"]

# 9) Ví dụ phản diện (tùy chọn)
- [Cách làm sai] → [Cách làm đúng]
```


## 3. Ví dụ thực chiến: Viz (Phân tích dữ liệu)

Dưới đây kết hợp 9 yếu tố lại, tạo ra một ví dụ hoàn chỉnh "có thể dùng ngay".

```text
# Đặt tên
Bạn là Viz, một chuyên gia phân tích dữ liệu.

# Chỉ thị kép
[Vai trò]
Phong cách: Khả năng insight mạnh, diễn đạt rõ ràng, hướng đến trực quan
Sứ mệnh: Kể dữ liệu phức tạp thành "câu chuyện biểu đồ"

[Quy trình tác vụ]
1) Hiểu: Phân tích nhu cầu dữ liệu và phạm vi chỉ số của người dùng
2) Truy vấn: Tạo SQL an toàn (chỉ truy vấn dữ liệu thực, SELECT-only)
3) Phân tích: Trích xuất insight quan trọng (xu hướng/so sánh/tỷ lệ)
4) Trình bày: Chọn biểu đồ phù hợp để diễn đạt rõ ràng

# Xác nhận mô phỏng
Lặp lại trước khi thực thi: "Tôi hiểu bạn muốn phân tích [đối tượng/phạm vi], sẽ thông qua [phương thức truy vấn và trực quan hóa] để trình bày kết quả."

# Nhấn mạnh lặp lại
Nhấn mạnh lại: Tính chân thực của dữ liệu là ưu tiên, thà thiếu còn hơn dư; không có dữ liệu thì nói thật.

# Quy tắc bắt buộc
MUST: Chỉ sử dụng truy vấn SELECT, không sửa đổi bất kỳ dữ liệu nào
ALWAYS: Mặc định tạo biểu đồ trực quan
NEVER: Bịa đặt hoặc đoán dữ liệu

# Thông tin nền
- ECharts cần sử dụng cấu hình "JSON thuần", không bao gồm chú thích/hàm
- Mỗi biểu đồ tập trung 1 chủ đề, tránh chồng chất nhiều chỉ số

# Khích lệ tích cực
Bạn giỏi việc trích xuất kết luận có thể thực thi từ dữ liệu thực, và diễn đạt bằng biểu đồ ngắn gọn nhất.

# Ví dụ tham khảo
Mô tả (2-3 câu) + JSON biểu đồ

Mô tả ví dụ:
Tháng này có thêm 127 leads mới, tăng 23% so với tháng trước, chủ yếu đến từ kênh thứ ba.

Biểu đồ ví dụ:
{
  "title": {"text": "Xu hướng leads tháng này"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Ví dụ phản diện (tùy chọn)
- Trộn lẫn tiếng Trung và tiếng Anh → Giữ ngôn ngữ nhất quán
- Biểu đồ quá tải → Mỗi biểu đồ chỉ diễn đạt một chủ đề
- Dữ liệu không đầy đủ → Nói thật "hiện chưa có dữ liệu khả dụng"
```

**Điểm thiết kế chính**

* "Tính chân thực" xuất hiện nhiều lần trong quy trình, nhấn mạnh, quy tắc (cảnh báo mạnh)
* Chọn đầu ra hai phần "Mô tả + JSON", thuận tiện cho việc tích hợp vào front-end
* Xác định rõ "SQL chỉ đọc", giảm rủi ro


## 4. Cách làm Prompt ngày càng tốt hơn

### 4.1 Lặp 5 bước

```
Làm cho dùng được trước → Kiểm tra số lượng nhỏ → Ghi lại vấn đề → Đối chứng thêm quy tắc/ví dụ → Kiểm tra lại
```

<img src="https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-20-21.jpg" alt="Quy trình tối ưu" width="50%">

Khuyến nghị kiểm tra một lần 5–10 tác vụ điển hình, hoàn thành một vòng trong 30 phút.

### 4.2 Nguyên tắc và tỷ lệ

* **Hướng dẫn tích cực ưu tiên**: Trước tiên hãy nói cho AI biết nên làm thế nào
* **Cải thiện theo vấn đề**: Gặp vấn đề thì thêm ràng buộc
* **Ràng buộc vừa phải**: Đừng ngay từ đầu chồng chất "mục cấm"

Tỷ lệ kinh nghiệm: **Tích cực 80% : Tiêu cực 20%**.

### 4.3 Một tối ưu điển hình

**Vấn đề**: Biểu đồ quá tải, khả năng đọc kém
**Tối ưu**:

1. Trong "Thông tin nền" thêm vào: Mỗi biểu đồ một chủ đề
2. Trong "Ví dụ tham khảo" đưa ra "biểu đồ chỉ số đơn"
3. Nếu vấn đề lặp lại, thì trong "Quy tắc bắt buộc/Nhấn mạnh lặp lại" thêm ràng buộc cứng


## 5. Kỹ thuật nâng cao

### 5.1 Sử dụng XML/thẻ để cấu trúc rõ ràng hơn (Khuyến nghị cho Prompt dài)

Khi nội dung >1000 ký tự hoặc dễ nhầm lẫn, sử dụng thẻ phân vùng sẽ ổn định hơn:

```xml
<vai_trò>Bạn là Dex, một chuyên gia tổ chức dữ liệu.</vai_trò>
<phong_cách>Cẩn thận, chính xác, có trật tự.</phong_cách>

<tác_vụ>
Phải hoàn thành theo các bước:
1. Nhận diện Field quan trọng
2. Trích xuất giá trị Field
3. Thống nhất định dạng (Ngày YYYY-MM-DD)
4. Đầu ra JSON
</tác_vụ>

<quy_tắc>
MUST: Giữ giá trị Field chính xác
NEVER: Đoán thông tin thiếu
ALWAYS: Đánh dấu các mục không chắc chắn
</quy_tắc>

<ví_dụ>
{"Họ tên":"Nguyễn Văn A","Ngày":"2024-01-15","Số tiền":5000,"Trạng thái":"Đã xác nhận"}
</ví_dụ>
```

### 5.2 Cách viết phân lớp "Bối cảnh + Tác vụ" (Cách nói trực quan hơn)

* **Bối cảnh** (ổn định lâu dài): Nhân viên này là ai, phong cách thế nào, có những năng lực gì
* **Tác vụ** (chuyển đổi theo nhu cầu): Hiện tại cần làm gì, quan tâm chỉ số nào, phạm vi mặc định là gì

Điều này phù hợp tự nhiên với mô hình "Nhân viên + Tác vụ" của NocoBase: **Bối cảnh cố định, Tác vụ linh hoạt**.

### 5.3 Mô-đun hóa tái sử dụng

Tách các quy tắc thường dùng thành mô-đun, ghép khi cần dùng:

**Mô-đun an toàn dữ liệu**

```
MUST: Chỉ sử dụng SELECT
NEVER: Thực thi INSERT/UPDATE/DELETE
```

**Mô-đun cấu trúc đầu ra**

```
Đầu ra phải bao gồm:
1) Mô tả ngắn gọn (2-3 câu)
2) Nội dung cốt lõi (biểu đồ/dữ liệu/mã)
3) Đề xuất tùy chọn (nếu có)
```


## 6. Quy tắc vàng (Kết luận thực hành)

1. Một AI chỉ làm một loại việc, chuyên sâu thì ổn định hơn
2. Ví dụ hiệu quả hơn khẩu hiệu, đưa ra mẫu tích cực trước
3. Sử dụng MUST/ALWAYS/NEVER để thiết lập ranh giới
4. Diễn đạt theo quy trình, giảm sự không chắc chắn
5. Bước nhỏ chạy nhanh, kiểm tra nhiều sửa ít, lặp liên tục
6. Đừng quá nhiều ràng buộc, tránh "viết chết"
7. Ghi lại vấn đề và thay đổi, hình thành phiên bản
8. 80/20: Trước tiên nói "làm thế nào cho đúng", sau đó ràng buộc "đừng làm sai"


## 7. Câu hỏi thường gặp

**Q1: Độ dài bao nhiêu là phù hợp?**

* Nhân viên cơ bản: 500–800 ký tự
* Nhân viên phức tạp: 800–1500 ký tự
* Không khuyến nghị >2000 ký tự (sẽ chậm và dư thừa)
  Tiêu chuẩn: 9 yếu tố đều bao phủ, nhưng không có lời thừa.

**Q2: AI không nghe lời thì làm sao?**

1. Sử dụng MUST/ALWAYS/NEVER để xác định ranh giới rõ ràng
2. Yêu cầu quan trọng lặp lại 2–3 lần
3. Sử dụng thẻ/phân vùng để tăng cường cấu trúc
4. Đưa ra nhiều ví dụ tích cực, ít nói lý thuyết suông
5. Đánh giá xem có cần mô hình mạnh hơn không

**Q3: Cách cân bằng tích cực/tiêu cực?**
Viết tích cực trước (vai trò, quy trình, ví dụ), sau đó dựa trên lỗi để thêm ràng buộc, và chỉ ràng buộc các điểm "lỗi lặp lại".

**Q4: Có cần cập nhật thường xuyên không?**

* Bối cảnh (danh tính/phong cách/năng lực cốt lõi): Ổn định lâu dài
* Tác vụ (kịch bản/chỉ số/phạm vi): Điều chỉnh theo nghiệp vụ
* Có thay đổi thì tạo phiên bản, và ghi lại "tại sao thay đổi"


## 8. Bước tiếp theo

**Thực hành tay**

* Chọn một vai trò đơn giản (như trợ lý hỗ trợ khách hàng), viết một "phiên bản dùng được" theo 9 yếu tố, kiểm tra 5 tác vụ điển hình
* Tìm một nhân viên hiện có, tổ chức 3–5 vấn đề thực tế, làm một vòng lặp nhỏ

**Đọc mở rộng**

* [《Hướng dẫn cấu hình Quản trị viên cho Nhân viên AI》](./admin-configuration.md): Áp dụng Prompt vào cấu hình thực tế
* Sách hướng dẫn chuyên dụng cho từng Nhân viên AI: Xem mẫu vai trò/tác vụ hoàn chỉnh


## Lời kết

**Chạy thông trước, sau đó tinh chỉnh.**
Bắt đầu từ một phiên bản "có thể làm việc", liên tục thu thập vấn đề, bổ sung ví dụ và quy tắc trong các tác vụ thực tế.
Hãy nhớ: **Trước tiên nói cho nó biết làm thế nào cho đúng (hướng dẫn tích cực), sau đó ràng buộc nó đừng làm sai (giới hạn vừa phải).**
