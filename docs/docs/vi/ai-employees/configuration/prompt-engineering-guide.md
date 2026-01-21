:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trợ lý AI · Hướng dẫn Kỹ thuật Prompt

> Từ "cách viết" đến "viết hay", hướng dẫn này sẽ chỉ cho bạn cách viết các prompt chất lượng cao một cách đơn giản, ổn định và có thể tái sử dụng.

## 1. Tại sao Prompt lại quan trọng

Prompt là "mô tả công việc" của một trợ lý AI, quyết định trực tiếp phong cách, giới hạn và chất lượng đầu ra của nó.

**Ví dụ so sánh:**

❌ Prompt không rõ ràng:

```
Bạn là một trợ lý phân tích dữ liệu, giúp người dùng phân tích dữ liệu.
```

✅ Prompt rõ ràng và có thể kiểm soát:

```
Bạn là Viz, một chuyên gia phân tích dữ liệu.

Định vị vai trò
- Phong cách: Có khả năng phân tích sâu sắc, diễn đạt rõ ràng, chú trọng trực quan hóa
- Sứ mệnh: Biến dữ liệu phức tạp thành "câu chuyện biểu đồ" dễ hiểu

Luồng công việc
1) Hiểu yêu cầu
2) Tạo SQL an toàn (chỉ sử dụng SELECT)
3) Rút trích thông tin chi tiết
4) Trình bày bằng biểu đồ

Quy tắc cứng
- PHẢI: Chỉ sử dụng SELECT, tuyệt đối không thay đổi dữ liệu
- LUÔN LUÔN: Mặc định xuất ra biểu đồ trực quan
- KHÔNG BAO GIỜ: Bịa đặt hoặc đoán dữ liệu

Định dạng đầu ra
Kết luận ngắn gọn (2-3 câu) + JSON biểu đồ ECharts
```

**Kết luận**: Một prompt tốt sẽ làm rõ "là ai, làm gì, làm như thế nào và đạt tiêu chuẩn gì", giúp hiệu suất của AI ổn định và có thể kiểm soát được.

## 2. Công thức vàng "Chín yếu tố" của Prompt

Một cấu trúc đã được thực tiễn chứng minh hiệu quả:

```
Đặt tên + Hướng dẫn kép + Xác nhận mô phỏng + Nhấn mạnh lặp lại + Quy tắc bắt buộc
+ Thông tin nền + Khuyến khích tích cực + Ví dụ tham khảo + Ví dụ phản diện (Tùy chọn)
```

### 2.1 Mô tả các yếu tố

| Yếu tố   | Giải quyết vấn đề gì            | Tại sao hiệu quả        |
| ---- | ----------------- | ------------ |
| Đặt tên   | Xác định rõ danh tính và phong cách           | Giúp AI xây dựng "cảm giác vai trò" |
| Hướng dẫn kép | Phân biệt "tôi là ai / tôi cần làm gì"     | Giảm nhầm lẫn định vị       |
| Xác nhận mô phỏng | Nhắc lại sự hiểu biết trước khi thực hiện            | Ngăn ngừa sai lệch          |
| Nhấn mạnh lặp lại | Các điểm chính xuất hiện lặp đi lặp lại           | Nâng cao mức độ ưu tiên        |
| Quy tắc bắt buộc | PHẢI/LUÔN LUÔN/KHÔNG BAO GIỜ | Hình thành giới hạn cơ bản         |
| Thông tin nền | Kiến thức và ràng buộc cần thiết           | Giảm hiểu lầm         |
| Khuyến khích tích cực | Hướng dẫn kỳ vọng và phong cách           | Giọng điệu và hiệu suất ổn định hơn    |
| Ví dụ tham khảo | Cung cấp một mô hình trực tiếp để bắt chước           | Đầu ra gần với kỳ vọng hơn      |
| Ví dụ phản diện | Tránh các lỗi thường gặp             | Sửa lỗi, càng dùng càng chính xác    |

### 2.2 Mẫu khởi đầu nhanh

```yaml
# 1) Đặt tên
Bạn là [Tên], một [Vai trò/Chuyên môn] xuất sắc.

# 2) Hướng dẫn kép
## Vai trò
Phong cách: [Tính từ x2-3]
Sứ mệnh: [Tóm tắt trách nhiệm chính trong một câu]

## Luồng công việc
1) Hiểu: [Điểm chính]
2) Thực hiện: [Điểm chính]
3) Xác minh: [Điểm chính]
4) Trình bày: [Điểm chính]

# 3) Xác nhận mô phỏng
Trước khi thực hiện, hãy nhắc lại sự hiểu biết của bạn: "Tôi hiểu rằng bạn cần... Tôi sẽ hoàn thành điều này bằng cách..."

# 4) Nhấn mạnh lặp lại
Yêu cầu cốt lõi: [1-2 điểm quan trọng nhất] (xuất hiện ít nhất 2 lần ở đầu/trong luồng/cuối)

# 5) Quy tắc bắt buộc
PHẢI: [Quy tắc không thể vi phạm]
LUÔN LUÔN: [Nguyên tắc luôn tuân thủ]
KHÔNG BAO GIỜ: [Hành động bị cấm rõ ràng]

# 6) Thông tin nền
[Kiến thức chuyên môn/ngữ cảnh/lỗi thường gặp cần thiết]

# 7) Khuyến khích tích cực
Bạn xuất sắc trong [Khả năng] và giỏi về [Sở trường]. Vui lòng duy trì phong cách này để hoàn thành nhiệm vụ.

# 8) Ví dụ tham khảo
[Cung cấp một ví dụ ngắn gọn về "đầu ra lý tưởng"]

# 9) Ví dụ phản diện (Tùy chọn)
- [Cách làm sai] → [Cách làm đúng]
```

## 3. Ví dụ thực tế: Viz (Phân tích dữ liệu)

Dưới đây là ví dụ hoàn chỉnh, "sẵn sàng sử dụng", kết hợp chín yếu tố.

```text
# Đặt tên
Bạn là Viz, một chuyên gia phân tích dữ liệu.

# Hướng dẫn kép
【Vai trò】
Phong cách: Có khả năng phân tích sâu sắc, diễn đạt rõ ràng, định hướng trực quan
Sứ mệnh: Biến dữ liệu phức tạp thành "câu chuyện biểu đồ"

【Luồng công việc】
1) Hiểu: Phân tích yêu cầu dữ liệu và phạm vi chỉ số của người dùng
2) Truy vấn: Tạo SQL an toàn (chỉ truy vấn dữ liệu thực, chỉ SELECT)
3) Phân tích: Rút trích thông tin chi tiết chính (xu hướng/so sánh/tỷ lệ)
4) Trình bày: Chọn biểu đồ phù hợp để diễn đạt rõ ràng

# Xác nhận mô phỏng
Trước khi thực hiện, hãy nhắc lại: "Tôi hiểu rằng bạn muốn phân tích [đối tượng/phạm vi], và tôi sẽ trình bày kết quả thông qua [phương pháp truy vấn và trực quan hóa]."

# Nhấn mạnh lặp lại
Nhấn mạnh lại: Ưu tiên tính xác thực của dữ liệu, thà thiếu còn hơn sai; nếu không có dữ liệu, hãy nói rõ sự thật.

# Quy tắc bắt buộc
PHẢI: Chỉ sử dụng truy vấn SELECT, không sửa đổi bất kỳ dữ liệu nào
LUÔN LUÔN: Mặc định xuất ra biểu đồ trực quan
KHÔNG BAO GIỜ: Bịa đặt hoặc đoán dữ liệu

# Thông tin nền
- ECharts yêu cầu cấu hình "JSON thuần túy", không chứa chú thích/hàm
- Mỗi biểu đồ tập trung vào 1 chủ đề, tránh chồng chất nhiều chỉ số

# Khuyến khích tích cực
Bạn giỏi trong việc rút trích kết luận có thể hành động từ dữ liệu thực và diễn đạt chúng bằng các biểu đồ đơn giản nhất.

# Ví dụ tham khảo
Mô tả (2-3 câu) + JSON biểu đồ

Mô tả ví dụ:
Tháng này, có 127 khách hàng tiềm năng mới, tăng 23% so với tháng trước, chủ yếu đến từ các kênh bên thứ ba.

Biểu đồ ví dụ:
{
  "title": {"text": "Xu hướng khách hàng tiềm năng tháng này"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Tuần1","Tuần2","Tuần3","Tuần4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Ví dụ phản diện (Tùy chọn)
- Trộn lẫn tiếng Anh và tiếng Việt → Duy trì tính nhất quán về ngôn ngữ
- Biểu đồ quá tải → Mỗi biểu đồ chỉ thể hiện một chủ đề
- Dữ liệu không đầy đủ → Trung thực nói rõ "Không có dữ liệu khả dụng"
```

**Điểm thiết kế**

*   "Tính xác thực" xuất hiện nhiều lần trong luồng công việc, phần nhấn mạnh và các quy tắc (nhắc nhở mạnh mẽ)
*   Chọn định dạng đầu ra hai phần "mô tả + JSON" để dễ dàng tích hợp với frontend
*   Làm rõ "chỉ đọc SQL" để giảm thiểu rủi ro

## 4. Cách cải thiện Prompt theo thời gian

### 4.1 Quy trình lặp lại năm bước

```
Bắt đầu với phiên bản hoạt động → Kiểm tra quy mô nhỏ → Ghi lại vấn đề → Thêm quy tắc/ví dụ để giải quyết → Kiểm tra lại
```

<img src="https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-20-21.jpg" alt="Quy trình tối ưu hóa" width="50%">

Nên kiểm tra 5–10 tác vụ điển hình cùng lúc, hoàn thành một vòng trong vòng 30 phút.

### 4.2 Nguyên tắc và Tỷ lệ

*   **Ưu tiên hướng dẫn tích cực**: Trước tiên, hãy nói cho AI biết nó nên làm gì
*   **Cải thiện dựa trên vấn đề**: Chỉ thêm ràng buộc khi gặp vấn đề
*   **Ràng buộc vừa phải**: Đừng chất đống các "điều cấm" ngay từ đầu

Tỷ lệ kinh nghiệm: **Tích cực 80% : Tiêu cực 20%**.

### 4.3 Một tối ưu hóa điển hình

**Vấn đề**: Biểu đồ quá tải, khó đọc
**Tối ưu hóa**:

1.  Trong "Thông tin nền", thêm: mỗi biểu đồ một chủ đề
2.  Trong "Ví dụ tham khảo", cung cấp "biểu đồ đơn chỉ số"
3.  Nếu vấn đề lặp lại, hãy thêm ràng buộc cứng vào "Quy tắc bắt buộc/Nhấn mạnh lặp lại"

## 5. Kỹ thuật nâng cao

### 5.1 Sử dụng XML/Thẻ để cấu trúc rõ ràng hơn (Khuyên dùng cho prompt dài)

Khi nội dung vượt quá 1000 ký tự hoặc dễ gây nhầm lẫn, việc phân vùng bằng thẻ sẽ ổn định hơn:

```xml
<Vai trò>Bạn là Dex, một chuyên gia sắp xếp dữ liệu.</Vai trò>
<Phong cách>Cẩn thận, chính xác, có hệ thống.</Phong cách>

<Nhiệm vụ>
Phải hoàn thành theo các bước sau:
1. Xác định các trường chính
2. Trích xuất giá trị trường
3. Chuẩn hóa định dạng (Ngày YYYY-MM-DD)
4. Xuất JSON
</Nhiệm vụ>

<Quy tắc>
PHẢI: Duy trì độ chính xác của giá trị trường
KHÔNG BAO GIỜ: Đoán thông tin bị thiếu
LUÔN LUÔN: Đánh dấu các mục không chắc chắn
</Quy tắc>

<Ví dụ>
{"Tên":"Nguyễn Văn A","Ngày":"2024-01-15","Số tiền":5000,"Trạng thái":"Đã xác nhận"}
</Ví dụ>
```

### 5.2 Cách viết phân lớp "Thông tin nền + Nhiệm vụ" (Cách tiếp cận trực quan hơn)

*   **Thông tin nền** (ổn định lâu dài): Trợ lý này là ai, phong cách như thế nào, có những khả năng gì
*   **Nhiệm vụ** (chuyển đổi theo yêu cầu): Hiện tại cần làm gì, tập trung vào những chỉ số nào, phạm vi mặc định là gì

Điều này hoàn toàn phù hợp với mô hình "Trợ lý + Nhiệm vụ" của NocoBase: **thông tin nền cố định, nhiệm vụ linh hoạt**.

### 5.3 Tái sử dụng theo module

Chia các quy tắc thường dùng thành các module, ghép nối khi cần:

**Module An toàn dữ liệu**

```
PHẢI: Chỉ sử dụng SELECT
KHÔNG BAO GIỜ: Thực hiện INSERT/UPDATE/DELETE
```

**Module Cấu trúc đầu ra**

```
Đầu ra phải bao gồm:
1) Mô tả ngắn gọn (2-3 câu)
2) Nội dung cốt lõi (biểu đồ/dữ liệu/mã)
3) Đề xuất tùy chọn (nếu có)
```

## 6. Quy tắc vàng (Kết luận thực tiễn)

1.  Một AI chỉ nên làm một loại công việc, chuyên môn hóa sẽ ổn định hơn
2.  Ví dụ hiệu quả hơn khẩu hiệu, hãy cung cấp mẫu tích cực trước
3.  Sử dụng PHẢI/LUÔN LUÔN/KHÔNG BAO GIỜ để đặt ra giới hạn
4.  Diễn đạt theo quy trình, giảm sự không chắc chắn
5.  Tiến hành từng bước nhỏ, kiểm tra nhiều, sửa ít và lặp lại liên tục
6.  Đừng đặt quá nhiều ràng buộc, tránh "cố định" hành vi
7.  Ghi lại các vấn đề và thay đổi để tạo phiên bản
8.  80/20: Trước tiên, hãy nói "cách làm đúng", sau đó ràng buộc "những gì không nên làm sai"

## 7. Câu hỏi thường gặp

**H1: Độ dài lý tưởng là bao nhiêu?**

*   Trợ lý cơ bản: 500–800 ký tự
*   Trợ lý phức tạp: 800–1500 ký tự
*   Không nên vượt quá 2000 ký tự (có thể làm chậm và thừa thãi)
    Tiêu chuẩn: Bao gồm tất cả chín yếu tố, nhưng không có lời lẽ thừa thãi.

**H2: Nếu AI không tuân thủ hướng dẫn thì sao?**

1.  Sử dụng PHẢI/LUÔN LUÔN/KHÔNG BAO GIỜ để làm rõ giới hạn
2.  Lặp lại các yêu cầu quan trọng 2–3 lần
3.  Sử dụng thẻ/phân vùng để tăng cường cấu trúc
4.  Cung cấp nhiều ví dụ tích cực hơn, ít nói về nguyên tắc trừu tượng
5.  Đánh giá xem có cần một mô hình mạnh hơn không

**H3: Làm thế nào để cân bằng giữa hướng dẫn tích cực và tiêu cực?**
Trước tiên, hãy viết các phần tích cực (vai trò, luồng công việc, ví dụ), sau đó thêm các ràng buộc dựa trên lỗi, và chỉ ràng buộc những điểm "thường xuyên mắc lỗi".

**H4: Có nên cập nhật thường xuyên không?**

*   Thông tin nền (danh tính/phong cách/khả năng cốt lõi): Ổn định lâu dài
*   Nhiệm vụ (kịch bản/chỉ số/phạm vi): Điều chỉnh theo nhu cầu kinh doanh
*   Khi có thay đổi, hãy tạo phiên bản mới và ghi lại "lý do thay đổi"

## 8. Các bước tiếp theo

**Thực hành**

*   Chọn một vai trò đơn giản bất kỳ (ví dụ: trợ lý chăm sóc khách hàng), viết một "phiên bản có thể sử dụng" theo chín yếu tố, và kiểm tra với 5 tác vụ điển hình
*   Tìm một trợ lý hiện có, thu thập 3–5 vấn đề thực tế, và thực hiện một vòng lặp cải tiến nhỏ

**Đọc thêm**

*   [《Trợ lý AI · Hướng dẫn Cấu hình Quản trị viên》](./admin-configuration.md): Áp dụng prompt vào cấu hình thực tế
*   Sổ tay riêng cho từng trợ lý AI: Xem các mẫu vai trò/nhiệm vụ hoàn chỉnh

## Kết luận

**Hãy làm cho nó hoạt động, sau đó tinh chỉnh.**
Bắt đầu với một phiên bản "hoạt động được", và liên tục thu thập vấn đề, bổ sung ví dụ và quy tắc trong các tác vụ thực tế.
Hãy nhớ: **Trước tiên, hãy nói cho nó biết cách làm đúng (hướng dẫn tích cực), sau đó ràng buộc nó không làm sai (hạn chế vừa phải).**