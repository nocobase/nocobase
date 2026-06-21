---
title: "Ví dụ sinh «Hợp đồng cung cấp và mua hàng» bằng tính năng «Template In ấn»"
description: "Template In ấn NocoBase: Ví dụ sinh «Hợp đồng cung cấp và mua hàng» bằng tính năng «Template In ấn»"
keywords: "scenes,NocoBase"
---

# Ví dụ sinh «Hợp đồng cung cấp và mua hàng» bằng tính năng «Template In ấn»

Trong các kịch bản chuỗi cung ứng hoặc thương mại, thường cần nhanh chóng sinh một "Hợp đồng cung cấp và mua hàng" chuẩn hóa, và điền nội dung động dựa trên thông tin người mua, người bán, chi tiết Sản phẩm... trong nguồn dữ liệu. Dưới đây sẽ lấy một use case "hợp đồng" đơn giản hóa làm ví dụ, hướng dẫn bạn cách cấu hình và sử dụng tính năng "Template In ấn", ánh xạ thông tin dữ liệu vào placeholder trong Template hợp đồng, từ đó tự động sinh tài liệu hợp đồng cuối cùng.

---

## 1. Bối cảnh và tổng quan cấu trúc dữ liệu

Trong ví dụ của chúng tôi, đại khái có các bảng dữ liệu chính sau (bỏ qua các trường không liên quan khác):

- **parties**: Lưu trữ thông tin đơn vị hoặc cá nhân của bên A/bên B, bao gồm tên, địa chỉ, người liên hệ, điện thoại...
- **contracts**: Lưu trữ bản ghi hợp đồng cụ thể, bao gồm mã hợp đồng, khóa ngoại người mua/người bán, thông tin người ký, ngày bắt đầu và kết thúc, tài khoản ngân hàng...
- **contract_line_items**: Dùng để lưu nhiều mục dưới hợp đồng đó (tên Sản phẩm, quy cách, số lượng, đơn giá, ngày giao hàng...)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Vì hệ thống hiện tại chỉ hỗ trợ in một bản ghi, chúng tôi sẽ nhấn "In" trên trang "Chi tiết hợp đồng", hệ thống tự động lấy bản ghi contracts tương ứng, cùng với các thông tin liên quan như parties, để điền vào tài liệu Word hoặc PDF.

---

## 2. Chuẩn bị

### 2.1 Chuẩn bị Plugin

Lưu ý, "Template In ấn" của chúng tôi là Plugin thương mại, cần mua và kích hoạt mới có thể thực hiện thao tác in.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Xác nhận Plugin đã kích hoạt:**

Tại bất kỳ trang nào, tạo một Block chi tiết (ví dụ users), kiểm tra xem trong cấu hình thao tác có tùy chọn cấu hình Template tương ứng không:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Tạo bảng dữ liệu

Tạo bảng đối tượng chính, bảng hợp đồng và bảng mục Sản phẩm được thiết kế ở trên (chỉ chọn các trường cốt lõi).

#### Bảng hợp đồng (Contracts)

| Phân loại trường | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Buyer ID | buyer_id | Integer |
| | Seller ID | seller_id | Integer |
| **Association Fields** | | | |
| | Contract Items | contract_items | One to many |
| | Buyer (Party A) | buyer | Many to one |
| | Seller (Party B) | seller | Many to one |
| **General Fields** | | | |
| | Contract Number | contract_no | Single line text |
| | Delivery Start Date | start_date | Datetime (with time zone) |
| | Delivery End Date | end_date | Datetime (with time zone) |
| | Deposit Ratio (%) | deposit_ratio | Percent |
| | Payment Days After Delivery | payment_days_after | Integer |
| | Bank Account Name (Beneficiary) | bank_account_name | Single line text |
| | Bank Name | bank_name | Single line text |
| | Bank Account Number (Beneficiary) | bank_account_number | Single line text |
| | Total Amount | total_amount | Number |
| | Currency Codes | currency_codes | Single select |
| | Balance Ratio (%) | balance_ratio | Percent |
| | Balance Days After Delivery | balance_days_after | Integer |
| | Delivery Place | delivery_place | Long text |
| | Party A Signatory Name | party_a_signatory_name | Single line text |
| | Party A Signatory Title | party_a_signatory_title | Single line text |
| | Party B Signatory Name | party_b_signatory_name | Single line text |
| | Party B Signatory Title | party_b_signatory_title | Single line text |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

#### Bảng đối tượng (Parties)

| Phân loại trường | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| **General Fields** | | | |
| | Party Name | party_name | Single line text |
| | Address | address | Single line text |
| | Contact Person | contact_person | Single line text |
| | Contact Phone | contact_phone | Phone |
| | Position | position | Single line text |
| | Email | email | Email |
| | Website | website | URL |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

#### Bảng mục Sản phẩm (Contract Line Items)

| Phân loại trường | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Contract ID | contract_id | Integer |
| **Association Fields** | | | |
| | Contract | contract | Many to one |
| **General Fields** | | | |
| | Product Name | product_name | Single line text |
| | Specification / Model | spec | Single line text |
| | Quantity | quantity | Integer |
| | Unit Price | unit_price | Number |
| | Total Amount | total_amount | Number |
| | Delivery Date | delivery_date | Datetime (with time zone) |
| | Remark | remark | Long text |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

### 2.3 Cấu hình giao diện

**Nhập dữ liệu mẫu:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Cấu hình quy tắc liên động như sau, tự động tính tổng giá và khoản thanh toán sau:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Tạo Block xem, sau khi xác nhận dữ liệu, kích hoạt thao tác «Template In ấn»:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Cấu hình Plugin Template In ấn

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Thêm một cấu hình Template, ví dụ «Hợp đồng cung cấp và mua hàng»:

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Tiếp theo chúng tôi đến tab Danh sách trường, có thể thấy tất cả các trường của đối tượng hiện tại. Sau đó nhấn "Sao chép", có thể bắt đầu điền Template.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Chuẩn bị file hợp đồng

**File Template hợp đồng Word**

Chuẩn bị sẵn mẫu hợp đồng (file .docx), ví dụ: `SUPPLY AND PURCHASE CONTRACT.docx`

Trong ví dụ bài viết này, chúng tôi đưa ra một phiên bản «Hợp đồng cung cấp và mua hàng» đơn giản hóa, trong đó bao gồm các placeholder mẫu:

- `{d.contract_no}`: Mã hợp đồng
- `{d.buyer.party_name}`, `{d.seller.party_name}`: Tên người mua, người bán
- `{d.total_amount}`: Tổng giá trị hợp đồng
- Cùng với các placeholder khác như "Người liên hệ", "Địa chỉ", "Điện thoại"...

Tiếp theo có thể sao chép theo các trường bạn đã tạo bảng và đè vào Word.

---

## 3. Hướng dẫn biến Template

### 3.1 Điền biến cơ bản, thuộc tính đối tượng liên kết

**Điền trường cơ bản:**

Ví dụ mã hợp đồng ở phía trên cùng, hoặc đối tượng ký kết hợp đồng. Chúng tôi nhấn sao chép, dán trực tiếp vào vị trí trống tương ứng của hợp đồng.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Định dạng dữ liệu

#### Định dạng ngày

Trong Template, chúng tôi thường cần định dạng các trường, đặc biệt là trường ngày. Định dạng ngày sao chép trực tiếp thường khá dài (như Wed Jan 01 2025 00:00:00 GMT), cần thông qua Định dạng để hiển thị kiểu mong muốn.

Đối với trường ngày, có thể sử dụng hàm `formatD()` để chỉ định định dạng đầu ra:

```
{Tên trường:formatD(Kiểu Định dạng)}
```

**Ví dụ:**

Ví dụ trường gốc chúng ta sao chép là `{d.created_at}`, và chúng ta cần Định dạng ngày thành kiểu `2025-01-01`, thì cải tạo trường này thành:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Output: 2025-01-01
```

**Các kiểu Định dạng ngày thường gặp:**

- `YYYY` - Năm (4 chữ số)
- `MM` - Tháng (2 chữ số)
- `DD` - Ngày (2 chữ số)
- `HH` - Giờ (định dạng 24 giờ)
- `mm` - Phút
- `ss` - Giây

**Ví dụ 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Output: 2025-01-01 14:30:00
```

#### Định dạng số tiền

Giả sử có một trường số tiền, ví dụ `{d.total_amount}` trong hợp đồng. Chúng ta có thể sử dụng hàm `formatN()` để Định dạng số, chỉ định số chữ số thập phân và dấu phân cách hàng nghìn.

**Cú pháp:**

```
{Tên trường:formatN(Số chữ số thập phân, Dấu phân cách hàng nghìn)}
```

- **Số chữ số thập phân**: Bạn có thể chỉ định giữ bao nhiêu chữ số thập phân. Ví dụ, `2` nghĩa là giữ hai chữ số thập phân
- **Dấu phân cách hàng nghìn**: Chỉ định có sử dụng dấu phân cách hàng nghìn không, thường là `true` hoặc `false`

**Ví dụ 1: Định dạng số tiền có dấu phân cách hàng nghìn và hai chữ số thập phân**

```
{d.amount:formatN(2, true)}  // Output: 1,234.56
```

Điều này sẽ Định dạng `d.amount` thành hai chữ số thập phân và thêm dấu phân cách hàng nghìn.

**Ví dụ 2: Định dạng số tiền thành số nguyên không có chữ số thập phân**

```
{d.amount:formatN(0, true)}  // Output: 1,235
```

Điều này sẽ Định dạng `d.amount` thành số nguyên, và thêm dấu phân cách hàng nghìn.

**Ví dụ 3: Định dạng số tiền thành hai chữ số thập phân không có dấu phân cách hàng nghìn**

```
{d.amount:formatN(2, false)}  // Output: 1234.56
```

Ở đây đã tắt dấu phân cách hàng nghìn, chỉ giữ hai chữ số thập phân.

**Yêu cầu Định dạng số tiền khác:**

- **Ký hiệu tiền tệ**: Carbone không trực tiếp cung cấp tính năng Định dạng ký hiệu tiền tệ, nhưng bạn có thể trực tiếp thêm ký hiệu tiền tệ vào dữ liệu hoặc Template. Ví dụ:
  ```
  {d.amount:formatN(2, true)} VND  // Output: 1,234.56 VND
  ```

#### Định dạng chuỗi

Đối với trường chuỗi, có thể sử dụng `:upperCase` để chỉ định Định dạng văn bản, ví dụ chuyển đổi hoa thường.

**Cú pháp:**

```
{Tên trường:upperCase:Lệnh khác}
```

**Cách chuyển đổi thường dùng:**

- `upperCase` - Chuyển thành chữ hoa toàn bộ
- `lowerCase` - Chuyển thành chữ thường toàn bộ
- `upperCase:ucFirst` - Viết hoa chữ cái đầu

**Ví dụ:**

```
{d.party_a_signatory_name:upperCase}  // Output: JOHN DOE
```

### 3.3 In vòng lặp

#### Cách in danh sách đối tượng con (như chi tiết Sản phẩm)

Khi chúng ta cần in một bảng chứa nhiều mục con (ví dụ chi tiết Sản phẩm), thường cần áp dụng cách in vòng lặp. Như vậy, hệ thống sẽ sinh một hàng nội dung dựa trên từng mục trong danh sách, cho đến khi duyệt hết tất cả các mục.

Giả sử chúng ta có một danh sách Sản phẩm (ví dụ `contract_items`), nó chứa nhiều đối tượng Sản phẩm. Mỗi đối tượng Sản phẩm có nhiều thuộc tính, như tên Sản phẩm, quy cách, số lượng, đơn giá, tổng giá trị và ghi chú.

**Bước 1: Điền trường vào hàng đầu tiên của bảng**

Trước tiên, ở hàng đầu tiên của bảng (không phải header), chúng ta sao chép trực tiếp và điền biến Template. Các biến này sẽ được thay thế bằng dữ liệu tương ứng, hiển thị ở đầu ra.

Ví dụ, hàng đầu tiên của bảng như sau:

| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Ở đây, `d.contract_items[i]` đại diện cho mục thứ i trong danh sách Sản phẩm, `i` là một index, đại diện cho thứ tự Sản phẩm hiện tại.

**Bước 2: Sửa index ở hàng thứ hai**

Tiếp theo, ở bảng hàng thứ hai, chúng ta sửa index của trường thành `i+1`, và điền thuộc tính đầu tiên là được. Đó là vì khi in vòng lặp, chúng ta muốn lấy mục dữ liệu tiếp theo từ danh sách, và hiển thị ở hàng tiếp theo.

Ví dụ, hàng thứ hai điền như sau:
| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |


Trong ví dụ này, chúng ta đã đổi `[i]` thành `[i+1]`, như vậy có thể lấy dữ liệu Sản phẩm tiếp theo trong danh sách.

**Bước 3: Tự động in vòng lặp khi render Template**

Khi hệ thống xử lý Template này, sẽ thao tác theo logic sau:

1. Hàng đầu tiên sẽ được điền theo trường bạn đặt trong Template
2. Sau đó, hệ thống sẽ tự động xóa hàng thứ hai, và bắt đầu trích xuất dữ liệu từ `d.contract_items`, điền vòng lặp từng hàng theo Định dạng trong bảng, cho đến khi tất cả chi tiết Sản phẩm in xong

`i` của mỗi hàng sẽ tăng lên, để đảm bảo mỗi hàng hiển thị thông tin Sản phẩm khác nhau.

---

## 4. Tải lên và cấu hình Template hợp đồng

### 4.1 Tải lên Template

1. Nhấn nút "Thêm Template", nhập tên Template, ví dụ "Template hợp đồng cung cấp và mua hàng"
2. Tải lên [file hợp đồng Word đã chuẩn bị (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx), trong đó đã chứa tất cả placeholder


![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Sau khi hoàn thành, hệ thống sẽ liệt kê Template đó trong danh sách Template có thể chọn, để sử dụng sau này
4. Chúng ta nhấn "Sử dụng" để kích hoạt Template này

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Lúc này thoát popup hiện tại, nhấn tải xuống Template, có thể lấy được Template đầy đủ đã sinh.

**Mẹo nhỏ:**

- Nếu Template sử dụng `.doc` hoặc định dạng khác, có thể cần chuyển thành `.docx`, cụ thể tùy thuộc vào tình hình hỗ trợ của Plugin
- Trong file Word, lưu ý không tách placeholder vào nhiều đoạn hoặc text box, để tránh xảy ra render bất thường

---

Chúc bạn sử dụng thuận lợi! Thông qua tính năng "Template In ấn", bạn có thể tiết kiệm rất nhiều công sức lặp lại trong quản lý hợp đồng, tránh lỗi sao chép dán thủ công, hiện thực xuất hợp đồng chuẩn hóa và tự động hóa.
