
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sử dụng tính năng "In mẫu" để tạo Hợp đồng Cung cấp và Mua bán

Trong các tình huống chuỗi cung ứng hoặc thương mại, việc nhanh chóng tạo ra một "Hợp đồng Cung cấp và Mua bán" tiêu chuẩn, với nội dung được điền tự động từ các **nguồn dữ liệu** như thông tin người mua, người bán và chi tiết sản phẩm, là rất cần thiết. Dưới đây, chúng tôi sẽ sử dụng một ví dụ đơn giản về "Hợp đồng" để hướng dẫn quý vị cách cấu hình và sử dụng tính năng "In mẫu" để ánh xạ thông tin dữ liệu vào các vị trí giữ chỗ trong mẫu hợp đồng, từ đó tự động tạo ra tài liệu hợp đồng cuối cùng.

---

## 1. Tổng quan về bối cảnh và cấu trúc dữ liệu

Trong ví dụ này, chúng ta có các **bộ sưu tập** dữ liệu chính sau (bỏ qua các trường không liên quan):

- **parties**: Lưu trữ thông tin đơn vị hoặc cá nhân của Bên A/Bên B, bao gồm tên, địa chỉ, người liên hệ, số điện thoại, v.v.
- **contracts**: Lưu trữ các bản ghi hợp đồng cụ thể, bao gồm số hợp đồng, khóa ngoại người mua/người bán, thông tin người ký, ngày bắt đầu/kết thúc, tài khoản ngân hàng, v.v.
- **contract_line_items**: Dùng để lưu trữ nhiều mục hàng hóa trong hợp đồng (tên sản phẩm, thông số kỹ thuật, số lượng, đơn giá, ngày giao hàng, v.v.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Vì hệ thống hiện tại chỉ hỗ trợ in từng bản ghi một, chúng ta sẽ nhấp vào "In" trên trang "Chi tiết hợp đồng". Hệ thống sẽ tự động lấy bản ghi hợp đồng tương ứng, cùng với các thông tin bên liên quan khác, và điền chúng vào tài liệu Word hoặc PDF.

## 2. Chuẩn bị

### 2.1 Chuẩn bị **plugin**

Lưu ý rằng "In mẫu" là một **plugin** thương mại. Quý vị cần mua và kích hoạt **plugin** này trước khi có thể thực hiện các thao tác in.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Xác nhận kích hoạt **plugin****:

Trên bất kỳ trang nào, hãy tạo một khối chi tiết (ví dụ: `users`) và kiểm tra xem có tùy chọn cấu hình mẫu tương ứng trong cấu hình hành động hay không:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Tạo **bộ sưu tập**

Hãy tạo các **bộ sưu tập** chính, **bộ sưu tập** hợp đồng và **bộ sưu tập** mục sản phẩm đã thiết kế ở trên (chỉ cần chọn các trường cốt lõi).

#### **Bộ sưu tập** Hợp đồng (Contracts)

| Danh mục trường | Tên hiển thị trường | Tên trường | Giao diện trường |
|---------|-------------------|------------|-----------------|
| **Trường PK & FK** | | | |
| | ID | id | Số nguyên |
| | ID Người mua | buyer_id | Số nguyên |
| | ID Người bán | seller_id | Số nguyên |
| **Trường liên kết** | | | |
| | Mục hợp đồng | contract_items | Một-nhiều |
| | Người mua (Bên A) | buyer | Nhiều-một |
| | Người bán (Bên B) | seller | Nhiều-một |
| **Trường chung** | | | |
| | Số hợp đồng | contract_no | Văn bản một dòng |
| | Ngày bắt đầu giao hàng | start_date | Ngày giờ (có múi giờ) |
| | Ngày kết thúc giao hàng | end_date | Ngày giờ (có múi giờ) |
| | Tỷ lệ đặt cọc (%) | deposit_ratio | Phần trăm |
| | Số ngày thanh toán sau giao hàng | payment_days_after | Số nguyên |
| | Tên tài khoản ngân hàng (Người thụ hưởng) | bank_account_name | Văn bản một dòng |
| | Tên ngân hàng | bank_name | Văn bản một dòng |
| | Số tài khoản ngân hàng (Người thụ hưởng) | bank_account_number | Văn bản một dòng |
| | Tổng số tiền | total_amount | Số |
| | Mã tiền tệ | currency_codes | Chọn một |
| | Tỷ lệ số dư (%) | balance_ratio | Phần trăm |
| | Số ngày số dư sau giao hàng | balance_days_after | Số nguyên |
| | Địa điểm giao hàng | delivery_place | Văn bản dài |
| | Tên người ký Bên A | party_a_signatory_name | Văn bản một dòng |
| | Chức danh người ký Bên A | party_a_signatory_title | Văn bản một dòng |
| | Tên người ký Bên B | party_b_signatory_name | Văn bản một dòng |
| | Chức danh người ký Bên B | party_b_signatory_title | Văn bản một dòng |
| **Trường hệ thống** | | | |
| | Ngày tạo | createdAt | Ngày tạo |
| | Người tạo | createdBy | Người tạo |
| | Ngày cập nhật cuối cùng | updatedAt | Ngày cập nhật cuối cùng |
| | Người cập nhật cuối cùng | updatedBy | Người cập nhật cuối cùng |

#### **Bộ sưu tập** Các bên (Parties)

| Danh mục trường | Tên hiển thị trường | Tên trường | Giao diện trường |
|---------|-------------------|------------|-----------------|
| **Trường PK & FK** | | | |
| | ID | id | Số nguyên |
| **Trường chung** | | | |
| | Tên bên | party_name | Văn bản một dòng |
| | Địa chỉ | address | Văn bản một dòng |
| | Người liên hệ | contact_person | Văn bản một dòng |
| | Điện thoại liên hệ | contact_phone | Điện thoại |
| | Chức vụ | position | Văn bản một dòng |
| | Email | email | Email |
| | Trang web | website | URL |
| **Trường hệ thống** | | | |
| | Ngày tạo | createdAt | Ngày tạo |
| | Người tạo | createdBy | Người tạo |
| | Ngày cập nhật cuối cùng | updatedAt | Ngày cập nhật cuối cùng |
| | Người cập nhật cuối cùng | updatedBy | Người cập nhật cuối cùng |

#### **Bộ sưu tập** Mục hàng hóa hợp đồng (Contract Line Items)

| Danh mục trường | Tên hiển thị trường | Tên trường | Giao diện trường |
|---------|-------------------|------------|-----------------|
| **Trường PK & FK** | | | |
| | ID | id | Số nguyên |
| | ID Hợp đồng | contract_id | Số nguyên |
| **Trường liên kết** | | | |
| | Hợp đồng | contract | Nhiều-một |
| **Trường chung** | | | |
| | Tên sản phẩm | product_name | Văn bản một dòng |
| | Thông số kỹ thuật / Mẫu mã | spec | Văn bản một dòng |
| | Số lượng | quantity | Số nguyên |
| | Đơn giá | unit_price | Số |
| | Tổng số tiền | total_amount | Số |
| | Ngày giao hàng | delivery_date | Ngày giờ (có múi giờ) |
| | Ghi chú | remark | Văn bản dài |
| **Trường hệ thống** | | | |
| | Ngày tạo | createdAt | Ngày tạo |
| | Người tạo | createdBy | Người tạo |
| | Ngày cập nhật cuối cùng | updatedAt | Ngày cập nhật cuối cùng |
| | Người cập nhật cuối cùng | updatedBy | Người cập nhật cuối cùng |

### 2.3 Cấu hình giao diện

**Nhập dữ liệu mẫu:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Cấu hình các quy tắc liên kết như sau để tự động tính tổng giá và các khoản thanh toán sau:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Tạo một khối xem, sau khi xác nhận dữ liệu, hãy bật thao tác "In mẫu":**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Cấu hình **plugin** In mẫu

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Thêm một cấu hình mẫu mới, ví dụ: "Hợp đồng Cung cấp và Mua bán":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Tiếp theo, chúng ta sẽ đến trang Tab "Danh sách trường", nơi quý vị có thể thấy tất cả các trường của đối tượng hiện tại. Sau khi nhấp vào "Sao chép", quý vị có thể bắt đầu điền vào mẫu.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Chuẩn bị tệp hợp đồng

**Tệp mẫu hợp đồng Word**

Hãy chuẩn bị sẵn mẫu hợp đồng (tệp .docx) trước, ví dụ: `SUPPLY AND PURCHASE CONTRACT.docx`

Trong ví dụ này, chúng tôi cung cấp một phiên bản đơn giản của "Hợp đồng Cung cấp và Mua bán", bao gồm các vị trí giữ chỗ mẫu:

- `{d.contract_no}`: Số hợp đồng
- `{d.buyer.party_name}`, `{d.seller.party_name}`: Tên người mua, người bán
- `{d.total_amount}`: Tổng số tiền hợp đồng
- Và các vị trí giữ chỗ khác như "người liên hệ", "địa chỉ", "số điện thoại", v.v.

Tiếp theo, quý vị có thể sao chép các trường từ **bộ sưu tập** đã tạo và dán vào tài liệu Word.

---

## 3. Hướng dẫn biến mẫu

### 3.1 Điền biến cơ bản, thuộc tính đối tượng liên kết

**Điền trường cơ bản:**

Ví dụ, số hợp đồng ở trên cùng, hoặc đối tượng chủ thể ký kết hợp đồng của chúng ta. Quý vị chỉ cần nhấp vào sao chép và dán trực tiếp vào vị trí trống tương ứng trong hợp đồng.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Định dạng dữ liệu

#### Định dạng ngày tháng

Trong các mẫu, chúng ta thường cần định dạng các trường, đặc biệt là trường ngày tháng. Định dạng ngày tháng được sao chép trực tiếp thường khá dài (ví dụ: Wed Jan 01 2025 00:00:00 GMT) và cần được định dạng lại để hiển thị theo kiểu mong muốn.

Đối với các trường ngày tháng, quý vị có thể sử dụng hàm `formatD()` để chỉ định định dạng đầu ra:

```
{tên_trường:formatD(kiểu_định_dạng)}
```

**Ví dụ:**

Ví dụ, nếu trường gốc chúng ta sao chép là `{d.created_at}`, và chúng ta cần định dạng ngày tháng thành kiểu `2025-01-01`, thì hãy sửa đổi trường này thành:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Đầu ra: 2025-01-01
```

**Các kiểu định dạng ngày tháng phổ biến:**

- `YYYY` - Năm (bốn chữ số)
- `MM` - Tháng (hai chữ số)
- `DD` - Ngày (hai chữ số)
- `HH` - Giờ (định dạng 24 giờ)
- `mm` - Phút
- `ss` - Giây

**Ví dụ 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Đầu ra: 2025-01-01 14:30:00
```

#### Định dạng số tiền

Giả sử có một trường số tiền, ví dụ như `{d.total_amount}` trong hợp đồng. Chúng ta có thể sử dụng hàm `formatN()` để định dạng số, chỉ định số chữ số thập phân và dấu phân cách hàng nghìn.

**Cú pháp:**

```
{tên_trường:formatN(số_chữ_số_thập_phân, dấu_phân_cách_hàng_nghìn)}
```

- **Số chữ số thập phân**: Quý vị có thể chỉ định số chữ số thập phân muốn giữ lại. Ví dụ, `2` có nghĩa là giữ lại hai chữ số thập phân.
- **Dấu phân cách hàng nghìn**: Chỉ định có sử dụng dấu phân cách hàng nghìn hay không, thường là `true` hoặc `false`.

**Ví dụ 1: Định dạng số tiền với dấu phân cách hàng nghìn và hai chữ số thập phân**

```
{d.amount:formatN(2, true)}  // Đầu ra: 1,234.56
```

Thao tác này sẽ định dạng `d.amount` thành hai chữ số thập phân và thêm dấu phân cách hàng nghìn.

**Ví dụ 2: Định dạng số tiền thành số nguyên không có chữ số thập phân**

```
{d.amount:formatN(0, true)}  // Đầu ra: 1,235
```

Thao tác này sẽ định dạng `d.amount` thành số nguyên và thêm dấu phân cách hàng nghìn.

**Ví dụ 3: Định dạng số tiền với hai chữ số thập phân nhưng không có dấu phân cách hàng nghìn**

```
{d.amount:formatN(2, false)}  // Đầu ra: 1234.56
```

Ở đây, dấu phân cách hàng nghìn bị vô hiệu hóa và chỉ giữ lại hai chữ số thập phân.

**Các nhu cầu định dạng số tiền khác:**

- **Ký hiệu tiền tệ**: Bản thân Carbone không trực tiếp cung cấp chức năng định dạng ký hiệu tiền tệ, nhưng quý vị có thể thêm ký hiệu tiền tệ trực tiếp vào dữ liệu hoặc mẫu. Ví dụ:
  ```
  {d.amount:formatN(2, true)} VNĐ  // Đầu ra: 1,234.56 VNĐ
  ```

#### Định dạng chuỗi

Đối với các trường chuỗi, quý vị có thể sử dụng `:upperCase` để chỉ định định dạng văn bản, ví dụ như chuyển đổi chữ hoa/thường.

**Cú pháp:**

```
{tên_trường:upperCase:các_lệnh_khác}
```

**Các phương pháp chuyển đổi phổ biến:**

- `upperCase` - Chuyển đổi thành tất cả chữ hoa
- `lowerCase` - Chuyển đổi thành tất cả chữ thường
- `upperCase:ucFirst` - Viết hoa chữ cái đầu tiên

**Ví dụ:**

```
{d.party_a_signatory_name:upperCase}  // Đầu ra: JOHN DOE
```

### 3.3 In lặp

#### Cách in danh sách đối tượng con (ví dụ: chi tiết sản phẩm)

Khi cần in một bảng chứa nhiều mục con (ví dụ: chi tiết sản phẩm), chúng ta thường phải sử dụng phương pháp in lặp. Bằng cách này, hệ thống sẽ tạo một dòng nội dung cho mỗi mục trong danh sách cho đến khi tất cả các mục được duyệt qua.

Giả sử chúng ta có một danh sách sản phẩm (ví dụ: `contract_items`), chứa nhiều đối tượng sản phẩm. Mỗi đối tượng sản phẩm có nhiều thuộc tính, chẳng hạn như tên sản phẩm, thông số kỹ thuật, số lượng, đơn giá, tổng số tiền và ghi chú.

**Bước 1: Điền các trường vào hàng đầu tiên của bảng**

Đầu tiên, ở hàng đầu tiên của bảng (không phải tiêu đề bảng), chúng ta sẽ sao chép và điền trực tiếp các biến mẫu. Các biến này sẽ được thay thế bằng dữ liệu tương ứng và hiển thị trong đầu ra.

Ví dụ, hàng đầu tiên của bảng như sau:

| Tên sản phẩm | Thông số kỹ thuật / Mẫu mã | Số lượng | Đơn giá | Tổng số tiền | Ghi chú |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Ở đây, `d.contract_items[i]` đại diện cho mục thứ `i` trong danh sách sản phẩm, và `i` là một chỉ mục, biểu thị thứ tự của sản phẩm hiện tại.

**Bước 2: Sửa đổi chỉ mục ở hàng thứ hai**

Tiếp theo, ở hàng thứ hai của bảng, chúng ta sẽ sửa đổi chỉ mục của trường thành `i+1` và chỉ điền thuộc tính đầu tiên. Điều này là do khi in lặp, chúng ta cần lấy dữ liệu của mục tiếp theo từ danh sách và hiển thị nó ở hàng tiếp theo.

Ví dụ, hàng thứ hai được điền như sau:

| Tên sản phẩm | Thông số kỹ thuật / Mẫu mã | Số lượng | Đơn giá | Tổng số tiền | Ghi chú |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

Trong ví dụ này, chúng ta đã thay đổi `[i]` thành `[i+1]`, để có thể lấy dữ liệu sản phẩm tiếp theo trong danh sách.

**Bước 3: Tự động in lặp khi hiển thị mẫu**

Khi hệ thống xử lý mẫu này, nó sẽ hoạt động theo logic sau:

1. Hàng đầu tiên sẽ được điền theo các trường quý vị đã thiết lập trong mẫu.
2. Sau đó, hệ thống sẽ tự động xóa hàng thứ hai và bắt đầu trích xuất dữ liệu từ `d.contract_items`, điền lặp lại từng hàng theo định dạng bảng cho đến khi tất cả chi tiết sản phẩm được in xong.

Chỉ mục `i` trong mỗi hàng sẽ tăng lên, đảm bảo rằng mỗi hàng hiển thị thông tin sản phẩm khác nhau.

---

## 4. Tải lên và cấu hình mẫu hợp đồng

### 4.1 Tải lên mẫu

1. Nhấp vào nút "Thêm mẫu", và nhập tên mẫu, ví dụ: "Mẫu Hợp đồng Cung cấp và Mua bán".
2. Tải lên [tệp hợp đồng Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) đã chuẩn bị, trong đó đã bao gồm tất cả các vị trí giữ chỗ.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Sau khi hoàn tất, hệ thống sẽ liệt kê mẫu này trong danh sách các mẫu tùy chọn để sử dụng sau này.
4. Chúng ta nhấp vào "Sử dụng" để kích hoạt mẫu này.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Tại thời điểm này, hãy thoát khỏi cửa sổ bật lên hiện tại và nhấp vào "Tải xuống mẫu" để nhận được mẫu hoàn chỉnh đã tạo.

**Mẹo nhỏ:**

- Nếu mẫu sử dụng định dạng `.doc` hoặc các định dạng khác, có thể cần chuyển đổi sang `.docx`, tùy thuộc vào khả năng hỗ trợ của **plugin**.
- Trong các tệp Word, hãy lưu ý không chia nhỏ các vị trí giữ chỗ thành nhiều đoạn văn hoặc hộp văn bản, để tránh các lỗi hiển thị.

---

Chúc quý vị sử dụng thành công! Với tính năng "In mẫu", quý vị có thể tiết kiệm đáng kể công việc lặp lại, tránh lỗi sao chép-dán thủ công trong quản lý hợp đồng, và đạt được việc xuất hợp đồng theo tiêu chuẩn và tự động.