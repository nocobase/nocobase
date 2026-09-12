# Trực quan hóa Sales Pipeline CRM

## 1. Giới thiệu

### 1.1 Lời mở đầu

Chương này là phần thứ hai của loạt hướng dẫn [Cách hiện thực Chuyển đổi Lead CRM trong NocoBase](https://www.nocobase.com/cn/tutorials/how-to-implement-lead-conversion-in-nocobase). Trong chương trước, chúng ta đã giới thiệu kiến thức cơ bản về Chuyển đổi Lead, bao gồm cách tạo các tập hợp dữ liệu (Collections) cần thiết, cấu hình trang quản lý dữ liệu và hiện thực chức năng chuyển đổi từ Lead thành công ty, liên hệ và cơ hội. Chương này sẽ tập trung vào quy trình theo dõi Lead và việc hiện thực quản lý trạng thái.

[NocoBase CRM Solution chính thức ra mắt! Mời bạn trải nghiệm](https://www.nocobase.com/cn/blog/crm-solution)

### 1.2 Mục tiêu chương này

Trong chương này, chúng ta sẽ cùng học cách hiện thực Chuyển đổi Lead CRM trong NocoBase. Thông qua việc theo dõi Lead và quản lý trạng thái, bạn có thể nâng cao hiệu quả nghiệp vụ và đạt được kiểm soát quy trình bán hàng tinh tế hơn.

### 1.3 Xem trước hiệu quả cuối cùng

Trong chương trước, chúng ta đã giải thích cách quản lý liên kết dữ liệu giữa Lead với công ty, liên hệ và cơ hội. Bây giờ, chúng ta tập trung vào module Lead, chủ yếu thảo luận cách Theo dõi Lead và quản lý trạng thái. Hãy xem ví dụ hiệu quả sau:
![](https://static-docs.nocobase.com/202502250226-transfer3.gif)

## 2. Mô tả cấu trúc Lead Collection

### 2.1 Giới thiệu Lead Collection

Trong chức năng Theo dõi Lead, Field "trạng thái" (status) đóng vai trò vô cùng quan trọng, không chỉ phản ánh tiến trình hiện tại của Lead (như không đạt, Lead mới, đang xử lý, đang theo dõi, đang giao dịch, hoàn thành), mà còn điều khiển toàn bộ việc hiển thị và biến đổi của form. Block bảng sau hiển thị cấu trúc Field của Lead collection và mô tả chi tiết:


| Field name     | Tên hiển thị Field | Field interface  | Description                                                                      |
| -------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------- |
| id             | **Id**             | Integer          | Khóa chính                                                                       |
| account_id     | **account_id**     | Integer          | Khóa ngoại bảng công ty ACCOUNT                                                  |
| contact_id     | **contact_id**     | Integer          | Khóa ngoại bảng liên hệ CONTACT                                                  |
| opportunity_id | **opportunity_id** | Integer          | Khóa ngoại bảng cơ hội OPPORTUNITY                                               |
| name           | **Tên Lead**       | Single line text | Tên khách hàng tiềm năng                                                         |
| company        | **Tên công ty**    | Single line text | Tên công ty của khách hàng tiềm năng                                             |
| email          | **Email**          | Email            | Địa chỉ email của khách hàng tiềm năng                                           |
| phone          | **Số điện thoại**  | Phone            | Số điện thoại liên hệ                                                            |
| status         | **Trạng thái**     | Single select    | Trạng thái hiện tại của Lead, mặc định là "Không đạt" (Không đạt, Lead mới, Đang xử lý, Đang theo dõi, Đang giao dịch, Hoàn thành) |
| Account        | **Công ty**        | Many to one      | Liên kết đến công ty                                                             |
| Contact        | **Liên hệ**        | Many to one      | Liên kết đến liên hệ                                                             |
| Opportunity    | **Cơ hội**         | Many to one      | Liên kết đến cơ hội                                                              |

## 3. Tạo Block bảng Leads (table block) và Block chi tiết

### 3.1 Mô tả tạo

Đầu tiên, chúng ta cần tạo một table block "Leads" để hiển thị các Field cần thiết. Đồng thời, ở bên phải trang cấu hình một Block chi tiết, khi bạn nhấp vào một bản ghi, bên phải sẽ tự động hiển thị thông tin chi tiết tương ứng. Vui lòng xem hiệu quả cấu hình hình bên dưới:
![](https://static-docs.nocobase.com/20250226090009.png)

## 4. Cấu hình nút Action

### 4.1 Mô tả tổng quan các nút

Để đáp ứng các nhu cầu thao tác khác nhau, chúng ta cần tạo tổng cộng 10 nút. Mỗi nút sẽ áp dụng cách hiển thị khác nhau (ẩn, kích hoạt hoặc vô hiệu hóa) theo trạng thái (status) của bản ghi, từ đó hướng dẫn người dùng thao tác đúng theo quy trình nghiệp vụ.
![20250311083825](https://static-docs.nocobase.com/20250311083825.png)

### 4.2 Cấu hình chi tiết từng nút chức năng


| Nút                              | Kiểu dáng                          | Action                                                            | Quy tắc liên động                                                                            |
| -------------------------------- | ---------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Nút Chỉnh sửa                    | Action chỉnh sửa                   | —                                                                | Khi status của bản ghi là "Completed" (đã hoàn thành) tự động vô hiệu hóa, ngăn chặn chỉnh sửa không cần thiết. |
| Nút Không đạt (trạng thái kích hoạt) | "Unqualified >"                | Cập nhật status của bản ghi thành "Unqualified".                  | Hiển thị mặc định; nếu status là "Completed", nút bị vô hiệu hóa.                            |
| Nút Lead mới (chưa kích hoạt)    | Action update dữ liệu, "New >"     | Đặt status thành "New", sau khi cập nhật thành công hiển thị thông báo "New". | Nếu status của bản ghi không phải "Unqualified" thì ẩn. (Tức bản ghi đã ở "New" hoặc trạng thái sau, nên ở trạng thái kích hoạt) |
| Nút Lead mới (trạng thái kích hoạt) | Action update dữ liệu, "New >"  | Cập nhật status của bản ghi thành "New".                          | Khi status là "Unqualified" thì ẩn; nếu status là "Completed", nút bị vô hiệu hóa.           |
| Nút Đang xử lý (chưa kích hoạt)  | Action update dữ liệu, "Working >" | Cập nhật status thành "Working", và hiển thị thông báo thành công "Working". | Khi status của bản ghi không phải "Unqualified", "New" thì ẩn.                               |
| Nút Đang xử lý (trạng thái kích hoạt) | Action update dữ liệu, "Working >" | Cập nhật status của bản ghi thành "Working".                | Khi status là "Unqualified", "New" thì ẩn; nếu status là "Completed", nút bị vô hiệu hóa.    |
| Nút Đang theo dõi (chưa kích hoạt) | Action update dữ liệu, "Nurturing >" | Đặt status thành "Nurturing", và hiển thị thông báo thành công "Nurturing". | Khi status của bản ghi không phải "Unqualified", "New", "Working" thì ẩn.                  |
| Nút Đang theo dõi (trạng thái kích hoạt) | Action update dữ liệu, "Nurturing >" | Cập nhật status của bản ghi thành "Nurturing".          | Khi status là "Unqualified", "New", "Working" thì ẩn; nếu status là "Completed", nút bị vô hiệu hóa. |
| Nút Chuyển đổi                   | Action chỉnh sửa, "transfer", icon "√" | Hiển thị form chuyển đổi, khi submit form, cập nhật status của bản ghi thành "Completed". | Khi status của bản ghi là "Completed" thì ẩn để ngăn chặn chuyển đổi lặp lại.            |
| Nút Chuyển đổi hoàn tất (trạng thái kích hoạt) | Action xem, "transfered", icon "√" | Chỉ dùng để hiển thị thông tin sau khi chuyển đổi hoàn tất, không có chức năng chỉnh sửa. | Chỉ hiển thị khi status của bản ghi là "Completed"; các trạng thái khác thì ẩn.        |

- Ví dụ quy tắc liên động:
  Đang xử lý (chưa kích hoạt)
  ![20250311084104](https://static-docs.nocobase.com/20250311084104.png)
  Đang xử lý (kích hoạt)
  ![20250311083953](https://static-docs.nocobase.com/20250311083953.png)
- Form chuyển đổi:
  Nút chuyển đổi (chưa kích hoạt)
  ![](https://static-docs.nocobase.com/20250226094223.png)
  Nút chuyển đổi (kích hoạt)
  ![](https://static-docs.nocobase.com/20250226094203.png)
- Hiển thị thông báo khi submit chuyển đổi:
  ![20250311084638](https://static-docs.nocobase.com/20250311084638.png)

### 4.3 Tổng kết cấu hình nút

- Mỗi chức năng đều cung cấp các kiểu nút khác nhau cho trạng thái chưa kích hoạt và kích hoạt.
- Sử dụng quy tắc liên động, kiểm soát động việc hiển thị nút (ẩn hoặc vô hiệu hóa) theo status của bản ghi, từ đó hướng dẫn nhân viên bán hàng thao tác đúng theo quy trình công việc.

## 5. Cài đặt Quy tắc liên động Form

### 5.1 Quy tắc 1: Chỉ hiển thị tên

- Khi bản ghi chưa được xác nhận, chỉ hiển thị tên.
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
**Thu thập thêm thông tin về Lead này.**  
- Tìm hiểu nhu cầu và điểm quan tâm của khách hàng tiềm năng
- Thu thập thông tin liên hệ cơ bản và bối cảnh công ty
- Xác định mức độ ưu tiên và cách thức theo dõi tiếp theo
{{/if}}
```

Khi trạng thái là "Đang xử lý":

```markdown
{{#if (eq $nRecord.status "Đang xử lý")}}
**Chủ động liên hệ với Lead và đánh giá nhu cầu sơ bộ.**  
- Liên hệ với khách hàng tiềm năng qua điện thoại/email
- Tìm hiểu vấn đề và thách thức mà khách hàng đang gặp phải
- Đánh giá sơ bộ mức độ phù hợp giữa nhu cầu của khách hàng và sản phẩm/dịch vụ của công ty
{{/if}}
```

Khi trạng thái là "Đang theo dõi":

```markdown
{{#if (eq $nRecord.status "Đang theo dõi")}}
**Khai thác sâu nhu cầu khách hàng, tiến hành nuôi dưỡng Lead.**  
- Cung cấp tài liệu sản phẩm liên quan hoặc gợi ý giải pháp
- Trả lời câu hỏi của khách hàng, giải tỏa những lo lắng
- Đánh giá khả năng chuyển đổi của Lead
{{/if}}
```

Khi trạng thái là "Chuyển đổi hoàn tất":

```markdown
{{#if (eq $nRecord.status "Chuyển đổi hoàn tất")}}
**Lead đã được chuyển đổi thành công thành khách hàng.**  
- Xác nhận đã tạo các bản ghi công ty và liên hệ liên quan
- Tạo bản ghi cơ hội, thiết lập kế hoạch theo dõi
- Bàn giao tài liệu liên quan và bản ghi giao tiếp cho nhân viên bán hàng phụ trách
{{/if}}
```

## 7. Hiển thị các đối tượng liên kết và liên kết chuyển hướng sau khi chuyển đổi hoàn tất

### 7.1 Mô tả đối tượng liên kết

Sau khi chuyển đổi hoàn tất, chúng ta muốn hiển thị các đối tượng liên kết liên quan (công ty, liên hệ, cơ hội) và có thể chuyển hướng trực tiếp đến trang chi tiết.
Lúc này tìm bất kỳ một popup chi tiết, ví dụ công ty, sau đó copy liên kết.
![20250311085502](https://static-docs.nocobase.com/20250311085502.png)
Lưu ý: Trong các popup hoặc trang khác, phần cuối của định dạng liên kết chi tiết (số sau filterbytk) đại diện cho id của đối tượng hiện tại, ví dụ:

```text
{Base URL}/admin/w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{id}
```

### 7.2 Sử dụng Handlebars để tạo liên kết liên quan

Công ty:

```markdown
{{#if (eq $nRecord.status "Đã hoàn thành")}}
**Công ty:**
[{{$nRecord.account.name}}](w3yyu23uro0/popups/ki0wcnfruj6/filterbytk/{{$nRecord.account_id}})
{{/if}}
```

Liên hệ:

```markdown
{{#if (eq $nRecord.status "Đã hoàn thành")}}
**Liên hệ:**
[{{$nRecord.contact.name}}](1oqybfwrocb/popups/8bbsqy5bbpl/filterbytk/{{$nRecord.contact_id}})
{{/if}}
```

Cơ hội:

```markdown
{{#if (eq $nRecord.status "Đã hoàn thành")}}
**Cơ hội:**
[{{$nRecord.opportunity.name}}](si0io9rt6q6/popups/yyx8uflsowr/filterbytk/{{$nRecord.opportunity_id}})
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
