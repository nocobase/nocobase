# Theo dõi Lead và Quản lý Trạng thái

## 1. Giới thiệu

### 1.1 Mục tiêu chương này

Trong chương này, chúng ta sẽ cùng học cách hiện thực Chuyển đổi cơ hội CRM trong NocoBase. Thông qua việc theo dõi Lead và quản lý trạng thái, bạn có thể nâng cao hiệu quả nghiệp vụ và đạt được kiểm soát quy trình bán hàng tinh tế hơn.

### 1.2 Xem trước hiệu quả cuối cùng

Trong chương trước, chúng ta đã giải thích cách quản lý liên kết dữ liệu giữa Lead với công ty, liên hệ và cơ hội. Bây giờ, chúng ta tập trung vào module Lead, chủ yếu thảo luận cách Theo dõi Lead và quản lý trạng thái. Hãy xem ví dụ hiệu quả sau:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Mô tả cấu trúc Lead Collection

### 2.1 Giới thiệu Lead Collection

Trong chức năng Theo dõi Lead, Field "trạng thái" (status) đóng vai trò vô cùng quan trọng, không chỉ phản ánh tiến trình hiện tại của Lead (như không đạt, Lead mới, đang xử lý, đang theo dõi, đang giao dịch, hoàn thành), mà còn điều khiển toàn bộ việc hiển thị và biến đổi của form. Block bảng sau hiển thị cấu trúc Field của Lead collection và mô tả chi tiết:


| Field name     | Tên hiển thị Field | Field interface  | Description                                                      |
| -------------- | ------------------ | ---------------- | ---------------------------------------------------------------- |
| id             | **Id**             | Integer          | Khóa chính                                                       |
| account_id     | **account_id**     | Integer          | Khóa ngoại ACCOUNT                                               |
| contact_id     | **contact_id**     | Integer          | Khóa ngoại CONTACT                                               |
| opportunity_id | **opportunity_id** | Integer          | Khóa ngoại OPPORTUNITY                                           |
| name           | **Tên Lead**       | Single line text | Tên khách hàng tiềm năng                                         |
| company        | **Tên công ty**    | Single line text | Tên công ty của khách hàng tiềm năng                             |
| email          | **Email**          | Email            | Địa chỉ email của khách hàng tiềm năng                           |
| phone          | **Số điện thoại**  | Phone            | Số điện thoại liên hệ                                            |
| status         | **Trạng thái**     | Single select    | Trạng thái hiện tại của Lead (Không đạt, Lead mới, Đang xử lý, Đang theo dõi, Đang giao dịch, Hoàn thành) |
| Account        | **Công ty**        | Many to one      | Liên kết đến Collection công ty                                  |
| Contact        | **Liên hệ**        | Many to one      | Liên kết đến Collection liên hệ                                  |
| Opportunity    | **Cơ hội**         | Many to one      | Liên kết đến Collection cơ hội                                   |

## 3. Tạo Block bảng Leads (table block) và Block chi tiết

### 3.1 Mô tả tạo

Đầu tiên, chúng ta cần tạo một table block "Leads" để hiển thị các Field cần thiết. Đồng thời, ở bên phải trang cấu hình một Block chi tiết, khi bạn nhấp vào một bản ghi, bên phải sẽ tự động hiển thị thông tin chi tiết tương ứng. Vui lòng xem hiệu quả cấu hình hình bên dưới:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Cấu hình nút Action

### 4.1 Mô tả tổng quan các nút

Để đáp ứng các nhu cầu thao tác khác nhau, chúng ta cần tạo tổng cộng 11 nút. Mỗi nút sẽ áp dụng cách hiển thị khác nhau (ẩn, kích hoạt hoặc vô hiệu hóa) theo trạng thái (status) của bản ghi, từ đó hướng dẫn người dùng thao tác đúng theo quy trình nghiệp vụ.
![20250226173632](https://static-docs.nocobase.com/20250226173632.png)

### 4.2 Cấu hình chi tiết từng nút chức năng

#### 4.2.1 Nút Chỉnh sửa

- Quy tắc liên động: Khi status của bản ghi là "Completed" (đã hoàn thành), tự động vô hiệu hóa nút này, ngăn chặn chỉnh sửa không cần thiết.

#### 4.2.2 Nút Không đạt 1 (chưa kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề hiển thị là "Unqualified >".
- Action và hành vi: Sau khi nhấp thực hiện Action update, cập nhật status của bản ghi thành "Unqualified", sau khi cập nhật thành công quay về trang trước, đồng thời hiển thị thông báo thành công "Unqualified".
- Quy tắc liên động: Chỉ hiển thị khi status của bản ghi rỗng; một khi status có giá trị, nút này sẽ tự động ẩn.

#### 4.2.3 Nút Không đạt 2 (trạng thái kích hoạt)

- Kiểu dáng và giao diện: Cũng hiển thị là "Unqualified >".
- Action và hành vi: Dùng để cập nhật status của bản ghi thành "Unqualified".
- Quy tắc liên động: Khi status rỗng, nút này ẩn; nếu status là "Completed", nút sẽ bị vô hiệu hóa.

#### 4.2.4 Nút Lead mới 1 (chưa kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề hiển thị là "New >".
- Action và hành vi: Sau khi nhấp cập nhật bản ghi, đặt status thành "New", sau khi cập nhật thành công hiển thị thông báo "New".
- Quy tắc liên động: Nếu status của bản ghi đã ở trạng thái "New", "Working", "Nurturing" hoặc "Completed", nút này sẽ ẩn.

#### 4.2.5 Nút Lead mới 2 (trạng thái kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề vẫn là "New >".
- Action và hành vi: Cũng dùng để cập nhật bản ghi, đặt status thành "New".
- Quy tắc liên động: Khi status thuộc về "Unqualified" hoặc rỗng thì ẩn; nếu status là "Completed", nút bị vô hiệu hóa.

#### 4.2.6 Nút Đang xử lý (chưa kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề hiển thị là "Working >".
- Action và hành vi: Sau khi nhấp nút, status của bản ghi cập nhật thành "Working", và hiển thị thông báo thành công "Working".
- Quy tắc liên động: Nếu status của bản ghi đã là "Working", "Nurturing" hoặc "Completed", nút này ẩn.

#### 4.2.7 Nút Đang xử lý (trạng thái kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề vẫn là "Working >".
- Action và hành vi: Dùng để cập nhật status của bản ghi thành "Working".
- Quy tắc liên động: Khi status là "Unqualified", "New" hoặc rỗng, nút này ẩn; nếu status là "Completed", nút bị vô hiệu hóa.

#### 4.2.8 Nút Đang theo dõi (chưa kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề hiển thị là "Nurturing >".
- Action và hành vi: Sau khi nhấp nút, cập nhật status của bản ghi thành "Nurturing", và hiển thị thông báo thành công "Nurturing".
- Quy tắc liên động: Nếu status của bản ghi đã là "Nurturing" hoặc "Completed", nút ẩn.

#### 4.2.9 Nút Đang theo dõi (trạng thái kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề cũng là "Nurturing >".
- Action và hành vi: Cũng dùng để cập nhật status của bản ghi thành "Nurturing".
- Quy tắc liên động: Khi status là "Unqualified", "New", "Working" hoặc rỗng thì ẩn; nếu status là "Completed", nút bị vô hiệu hóa.

#### 4.2.10 Nút Chuyển đổi

- Kiểu dáng và giao diện: Tiêu đề hiển thị là "transfer", và mở dưới dạng modal popup.
- Action và hành vi: Chủ yếu dùng để thực hiện thao tác chuyển bản ghi. Sau Action update, hệ thống sẽ hiển thị một giao diện bao gồm drawer, Tabs và form, tiện cho bạn thực hiện chuyển bản ghi.
- Quy tắc liên động: Khi status của bản ghi là "Completed", nút này ẩn để ngăn chặn chuyển đổi lặp lại.
  ![](https://static-docs.nocobase.com/20250226094223.png)

#### 4.2.11 Nút Chuyển đổi hoàn tất (trạng thái kích hoạt)

- Kiểu dáng và giao diện: Tiêu đề hiển thị là "transfered", cũng mở dưới dạng modal popup.
- Action và hành vi: Nút này chỉ dùng để hiển thị thông tin sau khi chuyển đổi hoàn tất, không có chức năng chỉnh sửa.
- Quy tắc liên động: Chỉ hiển thị khi status của bản ghi là "Completed", các trạng thái khác (như "Unqualified", "New", "Working", "Nurturing" hoặc rỗng) thì ẩn.
  ![](https://static-docs.nocobase.com/20250226094203.png)

### 4.3 Tổng kết cấu hình nút

- Mỗi chức năng đều cung cấp các kiểu nút khác nhau cho trạng thái chưa kích hoạt và kích hoạt.
- Sử dụng quy tắc liên động, kiểm soát động việc hiển thị nút (ẩn hoặc vô hiệu hóa) theo status của bản ghi, từ đó hướng dẫn nhân viên bán hàng thao tác đúng theo quy trình công việc.

## 5. Cài đặt Quy tắc liên động Form

### 5.1 Quy tắc 1: Chỉ hiển thị tên

- Khi bản ghi chưa được xác nhận hoặc status rỗng, chỉ hiển thị tên.
  ![](https://static-docs.nocobase.com/20250226092629.png)
  ![](https://static-docs.nocobase.com/20250226092555.png)

### 5.2 Quy tắc 2: Tối ưu hiển thị ở trạng thái "Lead mới"

- Khi status là "Lead mới", trang sẽ ẩn tên công ty và hiển thị thông tin liên hệ.
  ![](https://static-docs.nocobase.com/20250226092726.png)

## 6. Quy tắc Markdown trang và cú pháp Handlebars

### 6.1 Hiển thị nội dung động

Trong trang, chúng ta sử dụng cú pháp Handlebars để hiển thị động các thông tin gợi ý khác nhau theo trạng thái của bản ghi. Sau đây là code mẫu cho từng trạng thái:

Khi trạng thái là "Không đạt":

```markdown
{{#if (eq $nRecord.status "Không đạt")}}
**Theo dõi thông tin liên quan đến những Lead không đủ điều kiện của bạn.**  
Nếu Lead của bạn không quan tâm đến sản phẩm hoặc đã rời khỏi công ty liên quan, có thể là không đủ điều kiện.  
- Ghi lại bài học kinh nghiệm để tham khảo trong tương lai  
- Lưu chi tiết tiếp cận và thông tin liên hệ  
{{/if}}
```

Khi trạng thái là "Lead mới":

```markdown
{{#if (eq $nRecord.status "Lead mới")}}
**Xác định sản phẩm hoặc dịch vụ cần thiết cho cơ hội này.**  
- Thu thập case study, tài liệu tham khảo hoặc phân tích cạnh tranh  
- Xác nhận các bên liên quan chính của bạn  
- Xác định các tài nguyên có sẵn để sử dụng  
{{/if}}
```

Khi trạng thái là "Đang xử lý":

```markdown
{{#if (eq $nRecord.status "Đang xử lý")}}
**Cung cấp giải pháp của bạn cho các bên liên quan.**  
- Truyền đạt giá trị của giải pháp  
- Làm rõ thời gian biểu và ngân sách  
- Lập kế hoạch với khách hàng về thời điểm và cách thức chốt giao dịch  
{{/if}}
```

Khi trạng thái là "Đang theo dõi":

```markdown
{{#if (eq $nRecord.status "Đang theo dõi")}}
**Xác định kế hoạch triển khai dự án của khách hàng.**  
- Đạt được thỏa thuận theo nhu cầu  
- Tuân thủ quy trình giảm giá nội bộ  
- Có được hợp đồng đã ký kết  
{{/if}}
```

Khi trạng thái là "Chuyển đổi hoàn tất":

```markdown
{{#if (eq $nRecord.status "Chuyển đổi hoàn tất")}}
**Xác nhận kế hoạch triển khai dự án và các bước cuối cùng.**  
- Đảm bảo tất cả các thỏa thuận còn lại và thủ tục ký kết đã sẵn sàng  
- Tuân thủ chính sách giảm giá nội bộ  
- Đảm bảo hợp đồng đã được ký và việc triển khai dự án đang diễn ra theo kế hoạch  
{{/if}}
```

## 7. Hiển thị các đối tượng liên kết và liên kết chuyển hướng sau khi chuyển đổi hoàn tất

### 7.1 Mô tả đối tượng liên kết

Sau khi chuyển đổi hoàn tất, chúng ta muốn hiển thị các đối tượng liên kết liên quan (công ty, liên hệ, cơ hội) và đính kèm liên kết chuyển hướng đến trang chi tiết. Lưu ý: Trong các popup hoặc trang khác, phần cuối của định dạng liên kết chi tiết (số sau filterbytk) đại diện cho id của đối tượng hiện tại, ví dụ:

```text
http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/1
```

### 7.2 Sử dụng Handlebars để tạo liên kết liên quan

Đối với Công ty:

```markdown
{{#if (eq $nRecord.status "Đã hoàn thành")}}
**Account:**
[{{$nRecord.account.name}}](http://localhost:13000/apps/tsting/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Đối với Liên hệ:

```markdown
{{#if (eq $nRecord.status "Đã hoàn thành")}}
**Contact:**
[{{$nRecord.contact.name}}](http://localhost:13000/apps/tsting/admin/1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Đối với Cơ hội:

```markdown
{{#if (eq $nRecord.status "Đã hoàn thành")}}
**Opportunity:**
[{{$nRecord.opportunity.name}}](http://localhost:13000/apps/tsting/admin/si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
{{/if}}
```

![](https://static-docs.nocobase.com/20250226093501.png)

## 8. Ẩn đối tượng liên kết nhưng giữ lại giá trị

Để đảm bảo hiển thị thông tin liên kết bình thường sau khi chuyển đổi hoàn tất, cần đặt trạng thái của "Công ty", "Liên hệ" và "Cơ hội" thành "Ẩn (giữ giá trị)". Như vậy, mặc dù các Field này không hiển thị trong form, giá trị của chúng vẫn sẽ được ghi lại và truyền đi.
![](https://static-docs.nocobase.com/20250226093906.png)

## 9. Ngăn chặn sửa trạng thái sau khi chuyển đổi hoàn tất

Để ngăn chặn việc thay đổi trạng thái ngoài ý muốn sau khi chuyển đổi hoàn tất, chúng ta thêm một điều kiện đánh giá cho tất cả các nút: khi trạng thái là "Đã hoàn thành", tất cả các nút sẽ bị vô hiệu hóa.
![](https://static-docs.nocobase.com/20250226094302.png)

## 10. Lời kết

Sau khi hoàn thành tất cả các bước trên, chức năng theo dõi và chuyển đổi Lead của bạn đã hoàn thành rồi! Thông qua việc giải thích từng bước trong chương này, hy vọng bạn có thể hiểu rõ hơn về cách hiện thực liên động biến đổi form trạng thái trong NocoBase. Chúc bạn thao tác thuận lợi và sử dụng vui vẻ!
