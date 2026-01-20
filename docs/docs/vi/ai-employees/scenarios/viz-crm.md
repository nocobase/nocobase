
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trợ lý AI · Viz: Hướng dẫn cấu hình kịch bản CRM

> Lấy ví dụ về CRM, tìm hiểu cách để chuyên viên phân tích AI của bạn thực sự hiểu nghiệp vụ và phát huy tối đa tiềm năng.

## 1. Giới thiệu: Giúp Viz từ "nhìn dữ liệu" thành "hiểu nghiệp vụ"

Trong hệ thống NocoBase, **Viz** là một chuyên viên phân tích AI được tích hợp sẵn.
Viz có thể nhận diện ngữ cảnh trang (ví dụ: Khách hàng tiềm năng, Cơ hội, Tài khoản), tạo biểu đồ xu hướng, biểu đồ phễu và thẻ KPI.
Tuy nhiên, theo mặc định, Viz chỉ có khả năng truy vấn cơ bản nhất:

| Công cụ                      | Mô tả chức năng    | Bảo mật  |
| ----------------------- | ------- | ---- |
| Get Collection Names    | Lấy danh sách **bộ sưu tập** | ✅ An toàn |
| Get Collection Metadata | Lấy cấu trúc trường  | ✅ An toàn |

Những công cụ này chỉ giúp Viz "nhận diện cấu trúc", chứ chưa thực sự "hiểu nội dung".
Để Viz tạo ra các insight, phát hiện bất thường, phân tích xu hướng, bạn cần **mở rộng thêm các công cụ phân tích phù hợp hơn** cho Viz.

Trong bản demo CRM chính thức, chúng tôi đã sử dụng hai phương pháp:

*   **Overall Analytics (Công cụ phân tích tổng quát)**: một giải pháp mẫu hóa, an toàn và có thể tái sử dụng;
*   **SQL Execution (Công cụ phân tích chuyên biệt)**: có độ linh hoạt cao hơn, nhưng đi kèm rủi ro lớn hơn.

Hai phương pháp này không phải là lựa chọn duy nhất; chúng giống như một **mô hình thiết kế** hơn:

> Bạn có thể dựa trên nguyên lý của chúng để tạo ra một triển khai phù hợp hơn với nghiệp vụ của riêng bạn.

---

## 2. Cấu trúc của Viz: Tính cách ổn định + Nhiệm vụ linh hoạt

Để hiểu cách mở rộng Viz, trước tiên bạn cần hiểu thiết kế phân lớp bên trong của Viz:

| Lớp       | Mô tả                              | Ví dụ    |
| -------- | ------------------------------- | ----- |
| **Định nghĩa vai trò** | Tính cách và phương pháp phân tích của Viz: Hiểu → Truy vấn → Phân tích → Trực quan hóa | Cố định  |
| **Định nghĩa nhiệm vụ** | Các câu lệnh tùy chỉnh và tổ hợp công cụ cho một kịch bản nghiệp vụ cụ thể             | Có thể sửa đổi   |
| **Cấu hình công cụ** | Cầu nối để Viz gọi các **nguồn dữ liệu** bên ngoài hoặc **luồng công việc**              | Có thể thay thế tự do |

Thiết kế phân lớp này giúp Viz duy trì tính cách ổn định (logic phân tích nhất quán),
đồng thời có thể nhanh chóng thích ứng với các kịch bản nghiệp vụ khác nhau (CRM, quản lý bệnh viện, phân tích kênh, vận hành sản xuất...).

## 3. Mô hình một: Công cụ phân tích mẫu hóa (Khuyên dùng)

### 3.1 Tổng quan nguyên lý

**Overall Analytics** là công cụ phân tích cốt lõi trong bản demo CRM.
Nó quản lý tất cả các truy vấn SQL thông qua một **bộ sưu tập mẫu phân tích dữ liệu (data_analysis)**.
Viz không trực tiếp viết SQL, mà thay vào đó **gọi các mẫu đã định nghĩa** để tạo ra kết quả.

Luồng thực thi như sau:

```mermaid
flowchart TD
    A[Viz nhận nhiệm vụ] --> B[Gọi luồng công việc Overall Analytics]
    B --> C[Ghép mẫu dựa trên trang/nhiệm vụ hiện tại]
    C --> D[Thực thi SQL mẫu (chỉ đọc)]
    D --> E[Trả về kết quả dữ liệu]
    E --> F[Viz tạo biểu đồ + diễn giải ngắn gọn]
```

Bằng cách này, Viz có thể tạo ra kết quả phân tích an toàn và chuẩn hóa chỉ trong vài giây,
và quản trị viên có thể quản lý, xem xét tập trung tất cả các mẫu SQL.

---

### 3.2 Cấu trúc **bộ sưu tập** mẫu (data_analysis)

| Tên trường                                               | Kiểu       | Mô tả            | Ví dụ                                                 |
| ------------------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| **id**                                            | Integer  | Khóa chính            | 1                                                  |
| **name**                                          | Text     | Tên mẫu phân tích        | Leads Data Analysis                                |
| **collection**                                    | Text     | **Bộ sưu tập** tương ứng         | Lead                                               |
| **sql**                                           | Code     | Câu lệnh SQL phân tích (chỉ đọc) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                   | Markdown | Mô tả mẫu hoặc định nghĩa       | "Thống kê số lượng khách hàng tiềm năng theo giai đoạn"                                        |
| **createdAt / createdBy / updatedAt / updatedBy** | Trường hệ thống     | Thông tin kiểm toán          | Tự động tạo                                               |

#### Ví dụ mẫu trong bản demo CRM

| Name                             | Collection  | Description |
| -------------------------------- | ----------- | ----------- |
| Account Data Analysis            | Account     | Phân tích dữ liệu tài khoản      |
| Contact Data Analysis            | Contact     | Phân tích dữ liệu liên hệ       |
| Leads Data Analysis              | Lead        | Phân tích xu hướng khách hàng tiềm năng      |
| Opportunity Data Analysis        | Opportunity | Biểu đồ phễu giai đoạn cơ hội      |
| Task Data Analysis               | Todo Tasks  | Thống kê trạng thái nhiệm vụ cần làm    |
| Users (Sales Reps) Data Analysis | Users       | So sánh hiệu suất của đại diện bán hàng    |

---

### 3.3 Ưu điểm của mô hình này

| Khía cạnh       | Ưu điểm                     |
| -------- | ---------------------- |
| **Bảo mật**  | Tất cả các câu lệnh SQL đều được lưu trữ và xem xét, tránh việc tạo truy vấn trực tiếp |
| **Khả năng bảo trì** | Các mẫu được quản lý tập trung và cập nhật đồng bộ            |
| **Khả năng tái sử dụng**  | Cùng một mẫu có thể được tái sử dụng cho nhiều nhiệm vụ           |
| **Khả năng di động** | Có thể dễ dàng di chuyển sang các hệ thống khác, chỉ cần cấu trúc **bộ sưu tập** tương tự    |
| **Trải nghiệm người dùng** | Người dùng nghiệp vụ không cần quan tâm đến SQL; họ chỉ cần gửi yêu cầu phân tích  |

> 📘 **Bộ sưu tập** `data_analysis` này không nhất thiết phải có tên như vậy.
> Điều quan trọng là: **lưu trữ logic phân tích dưới dạng mẫu**, và được **luồng công việc** gọi một cách thống nhất.

---

### 3.4 Cách để Viz sử dụng nó

Trong định nghĩa nhiệm vụ, bạn có thể nói rõ với Viz:

```markdown
Chào Viz,

Vui lòng phân tích dữ liệu của mô-đun hiện tại.

**Ưu tiên:** Sử dụng công cụ Overall Analytics để lấy kết quả phân tích từ bộ sưu tập mẫu.
**Nếu không tìm thấy mẫu phù hợp:** Hãy thông báo rằng mẫu bị thiếu và đề xuất quản trị viên bổ sung.

Yêu cầu đầu ra:
- Mỗi kết quả tạo một biểu đồ riêng biệt;
- Kèm theo 2–3 câu mô tả ngắn gọn bên dưới biểu đồ;
- Không bịa đặt dữ liệu hoặc đưa ra giả định.
```

Bằng cách này, Viz sẽ tự động gọi **luồng công việc**, từ **bộ sưu tập** mẫu, tìm SQL phù hợp nhất và tạo biểu đồ.

---

## 4. Mô hình hai: Trình thực thi SQL chuyên biệt (Thận trọng khi sử dụng)

### 4.1 Kịch bản áp dụng

Khi bạn cần phân tích khám phá, truy vấn tạm thời, hoặc tổng hợp JOIN nhiều **bộ sưu tập**, bạn có thể để Viz gọi một công cụ **SQL Execution**.

Đặc điểm của công cụ này là:

*   Viz có thể trực tiếp tạo các truy vấn `SELECT`;
*   Hệ thống thực thi và trả về kết quả;
*   Viz chịu trách nhiệm phân tích và trực quan hóa.

Ví dụ nhiệm vụ:

> "Vui lòng phân tích xu hướng thay đổi tỷ lệ chuyển đổi khách hàng tiềm năng theo từng khu vực trong 90 ngày gần đây."

Trong trường hợp này, Viz có thể tạo ra:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Rủi ro và khuyến nghị bảo vệ

| Điểm rủi ro    | Chiến lược bảo vệ            |
| ------ | --------------- |
| Tạo các thao tác ghi  | Buộc giới hạn chỉ `SELECT`  |
| Truy cập các **bộ sưu tập** không liên quan  | Xác thực tên **bộ sưu tập** có tồn tại không        |
| Rủi ro hiệu suất với **bộ sưu tập** lớn | Giới hạn phạm vi thời gian, sử dụng LIMIT cho số lượng hàng |
| Khả năng truy vết thao tác | Bật nhật ký truy vấn và kiểm toán       |
| Kiểm soát quyền người dùng | Chỉ quản trị viên mới có thể sử dụng công cụ này      |

> Khuyến nghị chung:
>
> *   Người dùng thông thường chỉ nên bật phân tích mẫu hóa (Overall Analytics);
> *   Chỉ quản trị viên hoặc chuyên viên phân tích cao cấp mới được phép sử dụng SQL Execution.

---

## 5. Nếu bạn muốn tự xây dựng một "Overall Analytics"

Dưới đây là một cách tiếp cận đơn giản, tổng quát mà bạn có thể sao chép vào bất kỳ hệ thống nào (không phụ thuộc vào NocoBase):

### Bước 1: Thiết kế **bộ sưu tập** mẫu

Tên **bộ sưu tập** có thể tùy ý (ví dụ: `analysis_templates`).
Chỉ cần bao gồm các trường: `name`, `sql`, `collection`, và `description`.

### Bước 2: Viết một dịch vụ hoặc **luồng công việc** "Lấy mẫu → Thực thi"

Logic:

1.  Nhận nhiệm vụ hoặc ngữ cảnh trang (ví dụ: **bộ sưu tập** hiện tại);
2.  Ghép mẫu;
3.  Thực thi SQL mẫu (chỉ đọc);
4.  Trả về cấu trúc dữ liệu chuẩn hóa (hàng + trường).

### Bước 3: Để AI gọi giao diện này

Câu lệnh nhiệm vụ có thể được viết như sau:

```
Đầu tiên, hãy thử gọi công cụ phân tích mẫu. Nếu không tìm thấy phân tích phù hợp trong các mẫu, hãy sử dụng trình thực thi SQL.
Vui lòng đảm bảo tất cả các truy vấn là chỉ đọc và tạo biểu đồ để hiển thị kết quả.
```

> Bằng cách này, hệ thống trợ lý AI của bạn sẽ có khả năng phân tích tương tự như bản demo CRM, nhưng hoàn toàn độc lập và có thể tùy chỉnh.

---

## 6. Các thực hành tốt nhất và khuyến nghị thiết kế

| Khuyến nghị                     | Mô tả                                     |
| ---------------------- | -------------------------------------- |
| **Ưu tiên phân tích mẫu hóa**            | An toàn, ổn định và có thể tái sử dụng                              |
| **Chỉ sử dụng SQL Execution như một phần bổ sung** | Giới hạn cho việc gỡ lỗi nội bộ hoặc truy vấn tạm thời                            |
| **Một biểu đồ, một điểm chính**              | Đầu ra rõ ràng, tránh quá nhiều thông tin lộn xộn                            |
| **Đặt tên mẫu rõ ràng**             | Đặt tên theo trang/lĩnh vực nghiệp vụ, ví dụ: `Leads-Stage-Conversion` |
| **Giải thích ngắn gọn và rõ ràng**             | Mỗi biểu đồ kèm theo 2–3 câu tóm tắt                          |
| **Thông báo khi thiếu mẫu**             | Thông báo cho người dùng "Không tìm thấy mẫu tương ứng" thay vì hiển thị đầu ra trống                    |

---

## 7. Từ bản demo CRM đến kịch bản của bạn

Dù bạn đang làm CRM bệnh viện, sản xuất, kho bãi logistics hay tuyển sinh giáo dục,
chỉ cần bạn có thể trả lời ba câu hỏi sau, Viz có thể mang lại giá trị cho hệ thống của bạn:

| Câu hỏi             | Ví dụ                  |
| -------------- | ------------------- |
| **1. Bạn muốn phân tích gì?** | Xu hướng khách hàng tiềm năng / Giai đoạn giao dịch / Tỷ lệ hoạt động của thiết bị |
| **2. Dữ liệu ở đâu?**   | **Bộ sưu tập** nào, trường nào            |
| **3. Bạn muốn trình bày như thế nào?**  | Biểu đồ đường, phễu, tròn, bảng so sánh        |

Một khi bạn đã định nghĩa các nội dung này, bạn chỉ cần:

*   Viết logic phân tích vào **bộ sưu tập** mẫu;
*   Đính kèm câu lệnh nhiệm vụ vào trang;
*   Viz có thể "tiếp quản" việc phân tích báo cáo của bạn.

---

## 8. Kết luận: Mang theo mô hình thiết kế

"Overall Analytics" và "SQL Execution" chỉ là hai ví dụ triển khai.
Điều quan trọng hơn là ý tưởng đằng sau chúng:

> **Hãy để trợ lý AI hiểu logic nghiệp vụ của bạn, chứ không chỉ thực thi các câu lệnh.**

Dù bạn đang sử dụng NocoBase, một hệ thống riêng, hay **luồng công việc** tự viết,
bạn đều có thể sao chép cấu trúc này:

*   Các mẫu tập trung;
*   **Luồng công việc** gọi;
*   Thực thi chỉ đọc;
*   AI trình bày.

Bằng cách này, Viz không còn chỉ là một "AI có thể tạo biểu đồ",
mà là một chuyên viên phân tích thực thụ, hiểu dữ liệu, hiểu định nghĩa và hiểu nghiệp vụ của bạn.