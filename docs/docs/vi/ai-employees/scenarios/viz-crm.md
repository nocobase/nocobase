---
pkg: "@nocobase/plugin-ai"
title: "Hướng dẫn cấu hình Viz cho kịch bản CRM"
description: "Cấu hình nhà phân tích insight Viz lấy CRM làm ví dụ: engine phân tích mẫu hóa Overall Analytics, phân tích đặc thù SQL Execution, bảng mẫu data_analysis, an toàn và thực hành tốt nhất."
keywords: "Viz,CRM,Overall Analytics,SQL Execution,Phân tích dữ liệu,NocoBase"
---

# Nhân viên AI · Viz: Hướng dẫn cấu hình kịch bản CRM

> Lấy ví dụ CRM, tìm hiểu cách để nhà phân tích insight AI của bạn thực sự hiểu nghiệp vụ và phát huy toàn bộ tiềm năng.

## 1. Lời mở đầu: Để Viz từ "xem dữ liệu" đến "hiểu nghiệp vụ"

Trong hệ thống NocoBase, **Viz** là nhà phân tích insight AI tích hợp sẵn.
Anh ấy có thể nhận diện ngữ cảnh trang (như Leads, Opportunities, Accounts), tạo biểu đồ xu hướng, biểu đồ phễu và thẻ KPI.
Tuy nhiên mặc định, anh ấy chỉ có năng lực truy vấn cơ bản nhất:

| Tool | Mô tả chức năng | Tính bảo mật |
| ----------------------- | ------- | ---- |
| Get Collection Names | Lấy danh sách bảng dữ liệu | An toàn |
| Get Collection Metadata | Lấy cấu trúc Field | An toàn |

Các Tool này chỉ cho phép Viz "nhận biết cấu trúc", chưa thể thực sự "hiểu nội dung".
Để anh ấy tạo insight, phát hiện bất thường, phân tích xu hướng, bạn cần **mở rộng các Tool phân tích phù hợp hơn** cho anh ấy.

Trong CRM Demo chính thức, chúng tôi sử dụng hai cách:

* **Overall Analytics (Engine phân tích tổng quát)**: Phương án có thể tái sử dụng, mẫu hóa, an toàn;
* **SQL Execution (Engine phân tích đặc thù)**: Tự do hơn, nhưng rủi ro lớn hơn.

Hai cách này không phải là lựa chọn duy nhất, chúng giống như một **mô hình thiết kế**:

> Bạn có thể dựa theo nguyên lý của nó, tạo ra triển khai phù hợp hơn với nghiệp vụ của riêng mình.

---

## 2. Cấu trúc của Viz: Persona ổn định + Tác vụ linh hoạt

Để hiểu cách mở rộng Viz, trước tiên cần hiểu thiết kế phân lớp bên trong anh ấy:

| Lớp | Mô tả | Ví dụ |
| -------- | ------------------------------- | ----- |
| **Định nghĩa vai trò** | Persona và phương pháp phân tích của Viz: Hiểu → Truy vấn → Phân tích → Trực quan hóa | Cố định không đổi |
| **Định nghĩa tác vụ** | Prompt tùy chỉnh và tổ hợp Tool nhắm đến kịch bản nghiệp vụ cụ thể | Có thể sửa đổi |
| **Cấu hình Tool** | Cầu nối Viz gọi nguồn dữ liệu bên ngoài hoặc Workflow | Có thể tự do thay thế |

Thiết kế phân lớp này, làm cho Viz có thể duy trì cá tính ổn định (logic phân tích nhất quán),
đồng thời cũng có thể nhanh chóng thích ứng với các kịch bản nghiệp vụ khác nhau (CRM, quản lý bệnh viện, phân tích kênh, vận hành sản xuất...).

---

## 3. Mô hình một: Engine phân tích mẫu hóa (Khuyến nghị)

### 3.1 Tổng quan nguyên lý

**Overall Analytics** là engine phân tích cốt lõi trong CRM Demo.
Nó quản lý tất cả các truy vấn SQL thông qua một **bảng mẫu phân tích dữ liệu (data_analysis)**.
Viz không trực tiếp viết SQL, mà **gọi các mẫu đã được định nghĩa** để tạo kết quả.

Quy trình chạy như sau:

```mermaid
flowchart TD
    A[Viz nhận tác vụ] --> B[Gọi Workflow Overall Analytics]
    B --> C[Khớp mẫu theo trang/tác vụ hiện tại]
    C --> D[Thực thi SQL mẫu (chỉ đọc)]
    D --> E[Trả về kết quả dữ liệu]
    E --> F[Viz tạo biểu đồ + Diễn giải ngắn gọn]
```

Như vậy, Viz có thể tạo kết quả phân tích an toàn, chuẩn hóa trong vài giây,
và Quản trị viên có thể quản lý và xét duyệt thống nhất tất cả các mẫu SQL.

---

### 3.2 Cấu trúc bảng mẫu (data_analysis)

| Tên Field | Loại | Mô tả | Ví dụ |
| ------------------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| **id** | Integer | Khóa chính | 1 |
| **name** | Text | Tên mẫu phân tích | Leads Data Analysis |
| **collection** | Text | Bảng dữ liệu tương ứng | Lead |
| **sql** | Code | Câu lệnh SQL phân tích (chỉ đọc) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description** | Markdown | Mô tả mẫu hoặc tiêu chí | "Thống kê số lượng leads theo giai đoạn" |
| **createdAt / createdBy / updatedAt / updatedBy** | Field hệ thống | Thông tin kiểm toán | Tự động tạo |

#### Ví dụ mẫu trong CRM Demo

| Name | Collection | Description |
| -------------------------------- | ----------- | ----------- |
| Account Data Analysis | Account | Phân tích dữ liệu tài khoản |
| Contact Data Analysis | Contact | Phân tích liên hệ |
| Leads Data Analysis | Lead | Phân tích xu hướng leads |
| Opportunity Data Analysis | Opportunity | Phễu giai đoạn cơ hội |
| Task Data Analysis | Todo Tasks | Thống kê trạng thái tác vụ tồn đọng |
| Users (Sales Reps) Data Analysis | Users | So sánh hiệu suất đại diện bán hàng |

---

### 3.3 Ưu điểm của mô hình này

| Tiêu chí | Ưu điểm |
| -------- | ---------------------- |
| **Tính bảo mật** | Tất cả SQL đều được lưu trữ và xét duyệt, tránh tạo truy vấn trực tiếp |
| **Khả năng bảo trì** | Mẫu được quản lý tập trung, cập nhật thống nhất |
| **Khả năng tái sử dụng** | Cùng một mẫu có thể được tái sử dụng bởi nhiều tác vụ |
| **Khả năng di động** | Có thể di chuyển dễ dàng sang hệ thống khác, chỉ cần cấu trúc bảng giống nhau |
| **Trải nghiệm người dùng** | Người dùng nghiệp vụ không cần quan tâm SQL, chỉ cần khởi tạo yêu cầu phân tích |

> Bảng `data_analysis` này không nhất thiết phải có tên đó.
> Điểm chính là: **mẫu hóa lưu trữ logic phân tích**, gọi thống nhất bởi Workflow.

---

### 3.4 Cách để Viz sử dụng nó

Trong định nghĩa tác vụ, có thể nói rõ với Viz:

```markdown
Hi Viz,

Vui lòng phân tích dữ liệu của module hiện tại.

**Ưu tiên sử dụng:** Tool Overall Analytics, lấy kết quả phân tích từ bảng mẫu.
**Nếu không tìm thấy mẫu khớp:** Giải thích thiếu mẫu, và đề nghị Quản trị viên bổ sung.

Yêu cầu đầu ra:
- Mỗi kết quả tạo biểu đồ độc lập;
- Bên dưới biểu đồ kèm 2–3 câu mô tả ngắn gọn;
- Không bịa đặt dữ liệu hoặc giả định.
```

Như vậy, Viz sẽ tự động gọi Workflow, khớp SQL phù hợp nhất từ bảng mẫu và tạo biểu đồ.

---

## 4. Mô hình hai: Engine SQL đặc thù (Sử dụng cẩn thận)

### 4.1 Kịch bản phù hợp

Khi bạn cần phân tích khám phá, truy vấn tạm thời, hoặc tổng hợp JOIN nhiều bảng, có thể để Viz gọi một Tool **SQL Execution**.

Đặc điểm của Tool này:

* Viz có thể trực tiếp tạo truy vấn `SELECT`;
* Hệ thống sau khi thực thi sẽ trả về kết quả;
* Viz chịu trách nhiệm phân tích và trực quan hóa.

Tác vụ ví dụ:

> "Vui lòng phân tích xu hướng thay đổi tỷ lệ chuyển đổi leads của các khu vực trong 90 ngày gần đây."

Trong trường hợp này, Viz có thể tạo:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Rủi ro và khuyến nghị bảo vệ

| Điểm rủi ro | Chiến lược bảo vệ |
| ------ | --------------- |
| Tạo thao tác ghi | Cưỡng chế giới hạn là `SELECT` |
| Truy cập bảng không liên quan | Xác minh tên bảng có tồn tại không |
| Rủi ro hiệu năng bảng lớn | Giới hạn phạm vi thời gian, số dòng LIMIT |
| Thao tác có thể truy nguyên | Bật log truy vấn và kiểm toán |
| Kiểm soát quyền người dùng | Chỉ Quản trị viên mới có thể sử dụng Tool này |

> Khuyến nghị chung:
>
> * Người dùng thông thường chỉ kích hoạt phân tích mẫu hóa (Overall Analytics);
> * Quản trị viên hoặc nhà phân tích cao cấp mới có thể sử dụng SQL Execution.

---

## 5. Nếu bạn muốn tự tạo một "Overall Analytics"

Dưới đây là một ý tưởng tổng quát đơn giản, bạn hoàn toàn có thể sao chép vào bất kỳ hệ thống nào (không phụ thuộc NocoBase):

### Bước 1: Thiết kế bảng mẫu

Tên bảng tùy ý (như `analysis_templates`).
Chỉ cần bao gồm các Field: `name`, `sql`, `collection`, `description` là được.

### Bước 2: Viết một dịch vụ hoặc Workflow "lấy mẫu → thực thi"

Logic:

1. Nhận tác vụ hoặc ngữ cảnh trang (như collection hiện tại);
2. Khớp mẫu;
3. Thực thi SQL mẫu (chỉ đọc);
4. Trả về cấu trúc dữ liệu chuẩn hóa (rows + fields).

### Bước 3: Để AI gọi giao diện này

Prompt tác vụ có thể viết như sau:

```
Vui lòng gọi Tool phân tích mẫu trước, nếu không có phân tích khớp trong mẫu, thì sử dụng SQL Executor.
Vui lòng đảm bảo tất cả truy vấn là chỉ đọc, và tạo biểu đồ trình bày kết quả.
```

> Như vậy, hệ thống Nhân viên AI của bạn đã có năng lực phân tích tương tự CRM Demo, nhưng hoàn toàn độc lập, có thể tùy chỉnh.

---

## 6. Thực hành tốt nhất và khuyến nghị thiết kế

| Khuyến nghị | Mô tả |
| ---------------------- | -------------------------------------- |
| **Ưu tiên phân tích mẫu hóa** | An toàn, ổn định, có thể tái sử dụng |
| **SQL Execution chỉ làm bổ sung** | Chỉ giới hạn cho debug nội bộ hoặc truy vấn tạm thời |
| **Một biểu đồ một trọng điểm** | Đầu ra rõ ràng, tránh trộn lẫn quá mức |
| **Đặt tên mẫu rõ ràng** | Đặt tên tương ứng với trang/lĩnh vực nghiệp vụ, ví dụ `Leads-Stage-Conversion` |
| **Giải thích ngắn gọn rõ ràng** | Mỗi biểu đồ kèm 2–3 câu tổng kết |
| **Thiếu mẫu cần giải thích** | Thông báo người dùng "không tìm thấy mẫu tương ứng" thay vì đầu ra trống |

---

## 7. Từ CRM Demo đến kịch bản của bạn

Dù bạn làm CRM bệnh viện, sản xuất chế tạo, kho vận, hay tuyển sinh giáo dục,
chỉ cần bạn có thể trả lời ba câu hỏi sau, Viz đều có thể phát huy giá trị trong hệ thống của bạn:

| Câu hỏi | Ví dụ |
| -------------- | ------------------- |
| **1. Bạn muốn phân tích gì?** | Xu hướng leads / Giai đoạn chốt đơn / Tỷ lệ vận hành thiết bị |
| **2. Dữ liệu ở đâu?** | Bảng nào, các Field nào |
| **3. Muốn trình bày thế nào?** | Đường gấp khúc, phễu, biểu đồ tròn, bảng so sánh |

Một khi bạn định nghĩa tốt các nội dung này, chỉ cần:

* Viết logic phân tích vào bảng mẫu;
* Gắn Prompt tác vụ trên trang;
* Viz có thể "tiếp quản" phân tích báo cáo của bạn.

---

## 8. Lời kết: Mang đi mô hình

"Overall Analytics" và "SQL Execution" chỉ là hai triển khai ví dụ.
Quan trọng hơn là tư tưởng đằng sau chúng:

> **Để Nhân viên AI hiểu logic nghiệp vụ của bạn, không chỉ thực thi Prompt.**

Dù bạn dùng NocoBase, hệ thống riêng, hay Workflow tự viết,
bạn đều có thể sao chép cấu trúc này:

* Tập trung mẫu;
* Workflow gọi;
* Thực thi chỉ đọc;
* AI trình bày.

Như vậy, Viz không còn chỉ là "AI có thể tạo biểu đồ",
mà là một nhà phân tích thực sự hiểu dữ liệu của bạn, hiểu tiêu chí của bạn, hiểu nghiệp vụ của bạn.
