---
title: "Lựa chọn LLM"
description: "Khám phá kết quả đánh giá và hướng dẫn lựa chọn các mô hình flagship hàng đầu để xây dựng ứng dụng NocoBase, dựa trên hệ thống đánh giá tiêu chuẩn bao quát mô hình hóa dữ liệu, trang, quyền và Workflow."
keywords: "NocoBase AI Builder,lựa chọn LLM,GPT,DeepSeek,Qwen,AI Agent,đánh giá mô hình"
---

# Lựa chọn LLM

:::tip Kết luận chính

**Các mô hình flagship hàng đầu hiện có trên thị trường đều có thể xây dựng phần cốt lõi của một ứng dụng NocoBase.**

Mỗi mô hình có sự khác biệt về mức độ hoàn thiện của kết quả ban đầu, thời gian xây dựng và số lượng vấn đề. Bạn có thể lựa chọn dựa trên dịch vụ mô hình hiện có, điều kiện mạng tại khu vực, chi phí và thói quen sử dụng của đội ngũ.

:::

Đánh giá này sử dụng một bộ yêu cầu CRM tiêu chuẩn (hệ thống quản lý cơ hội bán hàng và theo dõi khách hàng) để kiểm tra các ứng dụng do những mô hình khác nhau xây dựng:

| Chiều đánh giá | Hạng mục đánh giá tiêu chuẩn |
| :---: | :---: |
| 14 | 61 |

## Các chiều đánh giá

Đánh giá bao quát các năng lực cốt lõi, năng lực cấu hình và thành phần nền tảng của NocoBase. Đồng thời, đánh giá cũng kiểm tra khả năng hiểu yêu cầu và thực hiện các tác vụ xây dựng tương ứng của từng mô hình.

| Năng lực | Trọng tâm đánh giá |
| --- | --- |
| Mô hình hóa dữ liệu | Bảng dữ liệu, kiểu Field, quan hệ liên kết, ràng buộc bắt buộc và duy nhất, giá trị mặc định |
| Trang và chức năng | Điều hướng, danh sách, biểu mẫu, chi tiết, tìm kiếm, bộ lọc và Dashboard |
| Logic nghiệp vụ | Chuyển đổi trạng thái, kiểm tra hợp lệ nghiệp vụ, quy tắc tính toán và tính nhất quán của dữ liệu liên quan |
| Quyền và bảo mật | Vai trò, quyền menu, quyền thao tác, phạm vi dữ liệu và quyền Field |
| Tự động hóa Workflow | Trigger, Node, nhánh điều kiện, thông báo, tác động phụ lên dữ liệu và thử lại khi thất bại |
| Trải nghiệm người dùng | Kiến trúc thông tin, trải nghiệm biểu mẫu, phản hồi thao tác và bố cục responsive |
| Tính ổn định | Dữ liệu đầu vào không hợp lệ, gửi trùng lặp, tính nhất quán khi thất bại, khối lượng dữ liệu và khôi phục mạng |
| Mức độ bao quát yêu cầu | Các yêu cầu rõ ràng và luồng nghiệp vụ cốt lõi có được triển khai đầy đủ hay không |
| Mở rộng hợp lý | Các chức năng do mô hình chủ động bổ sung có phục vụ mục đích nghiệp vụ rõ ràng hay không |
| Kiểm soát phạm vi | Kết quả có chứa mô-đun nghiệp vụ trùng lặp, không được sử dụng hoặc nằm ngoài phạm vi hay không |

## Kết quả đánh giá

| Chiều đánh giá | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| Mô hình hóa dữ liệu | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| Hoàn thiện chức năng | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#d97706;font-weight:600">◐ Đạt một phần</span> |
| Logic nghiệp vụ | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| Quyền và bảo mật | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| Tự động hóa Workflow | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| Trải nghiệm người dùng | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#d97706;font-weight:600">◐ Đạt một phần</span> |
| Tính ổn định | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| Mức độ bao quát yêu cầu | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#d97706;font-weight:600">◐ Đạt một phần</span> |
| Mở rộng hợp lý | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| Kiểm soát phạm vi | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> | <span style="color:#15803d;font-weight:600">✓ Đạt</span> |
| **Tốc độ xây dựng** | <span style="color:#2563eb;font-weight:700">Khá nhanh</span> | <span style="color:#2563eb;font-weight:700">Khá nhanh</span> | <span style="color:#d97706;font-weight:700">Chậm</span> | <span style="color:#15803d;font-weight:700">Nhanh nhất</span> |
| **Điểm chất lượng của một lần chạy** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip Điểm chất lượng của một lần chạy

Điểm chất lượng của một lần chạy có thang điểm tối đa là 100. Mỗi bug được phát hiện trong lần nghiệm thu đầy đủ đầu tiên sẽ bị trừ một điểm, qua đó phản ánh chất lượng của kết quả xây dựng ban đầu từ mô hình. Mô hình có thể khắc phục những vấn đề này thông qua các vòng phản hồi và chỉnh sửa tiếp theo.

:::

:::info Lưu ý về thời gian xây dựng

Thời gian xây dựng chịu ảnh hưởng của các yếu tố như hiệu năng phần cứng máy tính, quá trình cài đặt dependency và biên dịch Build, tốc độ phản hồi của dịch vụ mô hình và điều kiện mạng.

:::

## Chi tiết hạng mục đánh giá

61 hạng mục đánh giá tiêu chuẩn được tổ chức thành ba lớp: 46 hạng mục về chất lượng kết quả xây dựng, 7 hạng mục về khả năng hiểu yêu cầu và mở rộng hợp lý, cùng 8 hạng mục về hiệu quả của quá trình xây dựng. Mỗi hạng mục đều sử dụng phương pháp kiểm tra và tiêu chí đạt nhất quán.

### Lớp 1: Chất lượng kết quả xây dựng (46 hạng mục)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Chiều đánh giá</th><th>Hạng mục đánh giá tiêu chuẩn</th></tr></thead>
  <tbody>
    <tr><td>Mô hình hóa dữ liệu (8 hạng mục)</td><td><code>DM-01</code> Tất cả các bảng dữ liệu bắt buộc đã được tạo hay chưa<br /><code>DM-02</code> Tất cả các Field bắt buộc có tồn tại hay không<br /><code>DM-03</code> Kiểu Field có chính xác hay không<br /><code>DM-04</code> Quan hệ một-một có thể được tạo và sử dụng hay không<br /><code>DM-05</code> Quan hệ một-nhiều có thể được tạo và sử dụng hay không<br /><code>DM-06</code> Quan hệ nhiều-nhiều có thể được tạo và sử dụng hay không<br /><code>DM-07</code> Các quy tắc bắt buộc, duy nhất và giá trị mặc định có hiệu lực hay không<br /><code>DM-08</code> Dữ liệu liên quan có thể được xem và lọc hay không</td></tr>
    <tr><td>Hoàn thiện chức năng (6 hạng mục)</td><td><code>FC-01</code> Tất cả các trang và mục điều hướng bắt buộc có đầy đủ hay không<br /><code>FC-02</code> Có thể tạo, xem, chỉnh sửa và xóa bản ghi hay không<br /><code>FC-03</code> Các hành trình người dùng cốt lõi có thể được hoàn tất từ đầu đến cuối hay không<br /><code>FC-04</code> Các thao tác nghiệp vụ quan trọng có sẵn hay không<br /><code>FC-05</code> Chức năng tìm kiếm, lọc và sắp xếp có sẵn hay không<br /><code>FC-06</code> Dashboard có chứa nội dung bắt buộc hay không</td></tr>
    <tr><td>Logic nghiệp vụ (6 hạng mục)</td><td><code>BL-01</code> Quy tắc chuyển đổi trạng thái cơ hội có chính xác hay không<br /><code>BL-02</code> Các quy tắc kiểm tra hợp lệ nghiệp vụ có hiệu lực hay không<br /><code>BL-03</code> Field tính toán và định nghĩa thống kê có chính xác hay không<br /><code>BL-04</code> Dữ liệu có được ánh xạ chính xác sau khi chuyển đổi khách hàng tiềm năng hay không<br /><code>BL-05</code> Cập nhật các bản ghi liên quan có duy trì tính nhất quán hay không<br /><code>BL-06</code> Quy tắc xóa và lưu trữ có chính xác hay không</td></tr>
    <tr><td>Quyền và bảo mật (7 hạng mục)</td><td><code>ACL-01</code> Tất cả các vai trò bắt buộc đã được tạo hay chưa<br /><code>ACL-02</code> Người dùng thử nghiệm và việc gán vai trò có chính xác hay không<br /><code>ACL-03</code> Quyền truy cập trang và menu có chính xác hay không<br /><code>ACL-04</code> Quyền thao tác dữ liệu có chính xác hay không<br /><code>ACL-05</code> Phạm vi dữ liệu cấp bản ghi có chính xác hay không<br /><code>ACL-06</code> Quyền xem và chỉnh sửa cấp Field có chính xác hay không<br /><code>ACL-07</code> Việc thay đổi và kết hợp vai trò có hoạt động chính xác hay không</td></tr>
    <tr><td>Tự động hóa Workflow (7 hạng mục)</td><td><code>WF-01</code> Tất cả các Workflow bắt buộc đã được tạo và kích hoạt hay chưa<br /><code>WF-02</code> Trigger của Workflow có được thiết kế chính xác hay không<br /><code>WF-03</code> Thứ tự Node và quá trình truyền dữ liệu có chính xác hay không<br /><code>WF-04</code> Điều kiện và kết quả phân nhánh có chính xác hay không<br /><code>WF-05</code> Các tác động phụ khi đọc/ghi bản ghi có chính xác hay không<br /><code>WF-06</code> Người nhận và nội dung thông báo có chính xác hay không<br /><code>WF-07</code> Log lỗi và hành vi thử lại có thể truy vết hay không</td></tr>
    <tr><td>Trải nghiệm người dùng (7 hạng mục)</td><td><code>UX-01</code> Điều hướng và kiến trúc thông tin có rõ ràng hay không<br /><code>UX-02</code> Thông tin danh sách và các thao tác thường dùng có dễ sử dụng hay không<br /><code>UX-03</code> Cách nhóm, thứ tự và hướng dẫn trong biểu mẫu có rõ ràng hay không<br /><code>UX-04</code> Trang chi tiết có hỗ trợ việc nắm bắt thông tin và thực hiện thao tác tiếp theo hay không<br /><code>UX-05</code> Phản hồi thao tác và thay đổi trạng thái có rõ ràng hay không<br /><code>UX-06</code> Ứng dụng có thể sử dụng được ở các độ rộng màn hình khác nhau hay không<br /><code>UX-07</code> Trạng thái trống, đang tải và lỗi có được xử lý đầy đủ hay không</td></tr>
    <tr><td>Tính ổn định (5 hạng mục)</td><td><code>ROB-01</code> Dữ liệu đầu vào không hợp lệ và giá trị biên có được xử lý an toàn hay không<br /><code>ROB-02</code> Việc gửi trùng lặp có gây ra tác động phụ trùng lặp hay không<br /><code>ROB-03</code> Dữ liệu có duy trì tính nhất quán khi thực thi thất bại hay không<br /><code>ROB-04</code> Ứng dụng có tiếp tục sử dụng được với tập dữ liệu trống và tập dữ liệu lớn hay không<br /><code>ROB-05</code> Ứng dụng có thể khôi phục sau khi phiên làm việc hoặc kết nối mạng bị gián đoạn hay không</td></tr>
  </tbody>
</table>

### Lớp 2: Khả năng hiểu yêu cầu và mở rộng hợp lý (7 hạng mục)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Chiều đánh giá</th><th>Hạng mục đánh giá tiêu chuẩn</th></tr></thead>
  <tbody>
    <tr><td>Mức độ bao quát yêu cầu (3 hạng mục)</td><td><code>COV-01</code> Tất cả các trang và thao tác được yêu cầu trong prompt có được triển khai hay không<br /><code>COV-02</code> Tất cả dữ liệu, quyền và Workflow được yêu cầu trong prompt có được triển khai hay không<br /><code>COV-03</code> Các năng lực cần thiết cho quy trình chính nhưng không được nêu riêng trong prompt có đầy đủ hay không</td></tr>
    <tr><td>Mở rộng hợp lý (2 hạng mục)</td><td><code>EXT-01</code> Các Field, quan hệ liên kết và quy tắc được chủ động bổ sung có cần thiết hay không<br /><code>EXT-02</code> Các trang, thao tác và số liệu thống kê được chủ động bổ sung có phục vụ mục đích rõ ràng hay không</td></tr>
    <tr><td>Kiểm soát phạm vi (2 hạng mục)</td><td><code>SCOPE-01</code> Có tạo ra các chức năng và cấu hình trùng lặp hoặc không được sử dụng hay không<br /><code>SCOPE-02</code> Có bổ sung mô-đun nghiệp vụ không liên quan đến phạm vi tác vụ hay không</td></tr>
  </tbody>
</table>

### Lớp 3: Hiệu quả của quá trình xây dựng (8 hạng mục)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Chiều đánh giá</th><th>Hạng mục đánh giá tiêu chuẩn</th></tr></thead>
  <tbody>
    <tr><td>Thời gian đến kết quả khả dụng đầu tiên (1 hạng mục)</td><td><code>EFF-FIRST-01</code> Thời gian cần thiết để đạt được kết quả khả dụng đầu tiên</td></tr>
    <tr><td>Hiệu quả hội tụ (3 hạng mục)</td><td><code>EFF-FINAL-01</code> Số vòng lặp cần thiết để đạt nghiệm thu cuối cùng<br /><code>EFF-FINAL-02</code> Tổng thời gian cần thiết để đạt trạng thái cuối cùng<br /><code>EFF-FINAL-03</code> Số Token tiêu thụ để đạt trạng thái cuối cùng</td></tr>
    <tr><td>Can thiệp của con người (1 hạng mục)</td><td><code>EFF-HUMAN-01</code> Số lần can thiệp của con người trong quá trình đánh giá</td></tr>
    <tr><td>Khả năng tái lập (3 hạng mục)</td><td><code>EFF-STABLE-01</code> Các lần chạy lặp lại cùng một tác vụ có cho kết quả nghiệm thu nhất quán hay không<br /><code>EFF-STABLE-02</code> Bảng dữ liệu, quan hệ liên kết, vai trò và Workflow có nhất quán qua ba lần chạy hay không<br /><code>EFF-STABLE-03</code> Biến động về số vòng lặp và thời gian có nằm trong tầm kiểm soát hay không</td></tr>
  </tbody>
</table>

## Bước tiếp theo

- [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md) — Mô tả trang và tương tác bằng ngôn ngữ tự nhiên, đồng thời liên tục lặp lại và hoàn thiện cùng AI Agent
- [Bắt đầu nhanh với AI Portal](./index.md) — Tạo và chạy AI Portal đầu tiên của bạn
- [Mô hình hóa dữ liệu](../data-modeling.md) — Tạo bảng dữ liệu, Field và quan hệ liên kết bằng ngôn ngữ tự nhiên
- [Quản lý Workflow](../workflow.md) — Tạo, chỉnh sửa, kích hoạt và chẩn đoán Workflow
- [Cấu hình quyền](../acl.md) — Quản lý vai trò, chính sách quyền, gán người dùng và đánh giá rủi ro
