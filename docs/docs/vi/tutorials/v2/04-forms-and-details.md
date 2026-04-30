# Chương 4: Form và chi tiết — Nhập, hiển thị, một bước hoàn thành

Chương trước chúng ta đã xây xong danh sách ticket, và dùng một form đơn giản để nhập dữ liệu test. Chương này chúng ta đến **hoàn thiện trải nghiệm form** — tối ưu layout Field của [Block form](/interface-builder/blocks/data-blocks/form), thêm [Block chi tiết](/interface-builder/blocks/data-blocks/details), cấu hình [linkage rule](/interface-builder/linkage-rules), còn có thể dùng [history thay đổi](https://docs.nocobase.com/cn/record-history/) để theo dõi mỗi lần sửa của ticket.

:::tip
Tính năng "[Record history](https://docs.nocobase.com/cn/record-history/)" trong mục 4.4 của chương này nằm trong [bản chuyên nghiệp](https://www.nocobase.com/cn/commercial), bỏ qua mục này không ảnh hưởng đến việc học các chương sau.
:::

## 4.1 Hoàn thiện form tạo ticket mới

Chương trước chúng ta đã nhanh chóng tạo một form có thể dùng được, bây giờ đến hoàn thiện nó — điều chỉnh thứ tự Field, cài đặt giá trị mặc định, tối ưu layout. Nếu bạn đã bỏ qua phần form nhanh ở chương trước, cũng không sao, ở đây chúng ta sẽ bắt đầu tạo form mới từ đầu.

### Thêm nút Action "Tạo mới"

1. Đảm bảo đang ở chế độ UI editor (công tắc góc trên bên phải đã bật).
2. Vào trang "Danh sách ticket", click **"[Action](/interface-builder/actions) (Actions)"** phía trên Block bảng.
3. Đánh dấu nút Action **"Thêm"**.
4. Phía trên bảng sẽ xuất hiện một nút "Thêm", click sẽ mở một [popup](/interface-builder/actions/pop-up).

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Cấu hình form trong popup

1. Click nút "Thêm", mở popup.
2. Trong popup click **"Tạo [Block](/interface-builder/blocks) (Add block) → Block dữ liệu → Form (Thêm)"**.
3. Chọn **"[Bảng dữ liệu](/data-sources/data-modeling/collection) hiện tại (Current collection)"**. Popup đã liên kết context bảng dữ liệu tương ứng, không cần chỉ định thủ công.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. Trong form click **"[Field](/data-sources/data-modeling/collection-fields) (Fields)"**, đánh dấu các Field sau:

| Field | Điểm cấu hình |
|------|---------|
| Tiêu đề | Bắt buộc (theo toàn cục) |
| Mô tả | Nhập text lớn |
| Trạng thái | Dropdown (sau sẽ cài giá trị mặc định qua linkage rule) |
| Mức độ ưu tiên | Dropdown |
| Phân loại | Field liên kết, tự động hiển thị thành dropdown |
| Người submit | Field liên kết (sau sẽ cài giá trị mặc định qua linkage rule) |
| Người xử lý | Field liên kết |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

Bạn sẽ thấy bên cạnh Field "Tiêu đề" tự động có dấu sao đỏ `*` — vì khi tạo Field ở Chương 2 chúng ta đã cài bắt buộc, form sẽ tự động kế thừa rule bắt buộc ở cấp bảng dữ liệu, không cần cấu hình riêng nữa.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Mẹo**: Nếu một Field nào đó không được cài bắt buộc ở cấp bảng dữ liệu, nhưng bạn muốn yêu cầu bắt buộc trong form hiện tại, cũng có thể cài riêng trong tùy chọn cấu hình Field.
> 
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Thêm nút submit

1. Phía dưới Block form, click **"Action (Actions)"**.
2. Đánh dấu nút **"Submit"**.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. Sau khi Người dùng điền form xong, click submit là có thể tạo một ticket mới.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Linkage rule: Giá trị mặc định và Field linkage

Có một số Field chúng ta muốn tự động điền sẵn (như trạng thái mặc định "chờ xử lý"), một số Field cần thay đổi động theo điều kiện (như ticket khẩn cấp bắt buộc điền mô tả). Hiện tại tính năng giá trị mặc định của 2.0 vẫn đang trong quá trình tiến hóa, tutorial này thống nhất dùng **linkage rule** để cấu hình giá trị mặc định và Field linkage.

1. Click **cài đặt Block** (biểu tượng ba gạch ngang) ở góc trên bên phải của Block form.
2. Tìm **"Linkage rule (Linkage rules)"**, click sẽ mở panel cấu hình ở sidebar.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Cài đặt giá trị mặc định

Chúng ta cài giá trị mặc định cho "Trạng thái" và "Người submit" trước:

1. Click **"Thêm linkage rule"**.
2. **Không cài điều kiện** (để trống là được) — linkage rule không điều kiện sẽ thực hiện ngay khi form load.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Cấu hình action (Actions):
   - Field trạng thái → **Cài giá trị mặc định** → Chờ xử lý
   - Field người submit → **Cài giá trị mặc định** → Người dùng hiện tại

> **Lưu ý chọn giá trị Field**: Khi cài giá trị, nhất định phải chọn **"Form hiện tại"** làm nguồn dữ liệu trước. Nếu là Field object liên kết (như phân loại, người submit, người xử lý và các Field many-to-one khác), bắt buộc phải chọn thuộc tính object bản thân, không phải Field con sau khi mở rộng.
>
> Khi chọn biến (như "Người dùng hiện tại"), cần **single click** chọn biến trước, rồi **double click** để điền vào ô chọn.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


Nếu muốn một Field người submit nào đó không thể sửa (như trạng thái), có thể trong tùy chọn cấu hình Field cài **"Display mode"** thành **"Readonly"**.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Ba display mode**: Editable, Readonly (cấm chỉnh sửa nhưng giữ vẻ ngoài Field), Easy-reading (chỉ hiển thị text).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Ticket khẩn cấp bắt buộc điền mô tả

Tiếp theo thêm một linkage rule có điều kiện: Khi Người dùng chọn mức độ ưu tiên là "Khẩn cấp", Field mô tả trở thành **bắt buộc**, nhắc nhở người submit nhất định phải viết rõ tình hình.

1. Click **"Thêm linkage rule"**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Cấu hình rule:
   - **Điều kiện (Condition)**: Form hiện tại / Mức độ ưu tiên **bằng** Khẩn cấp
   - **Action (Actions)**: Field mô tả → cài thành **Bắt buộc**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Lưu rule.

Bây giờ test một chút: Chọn mức độ ưu tiên là "Khẩn cấp", bên cạnh Field mô tả sẽ xuất hiện dấu sao đỏ `*`, biểu thị bắt buộc. Chọn mức độ ưu tiên khác sẽ trở lại không bắt buộc.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Cuối cùng dựa vào những gì đã học, điều chỉnh layout đơn giản
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **Linkage rule còn làm được gì?** Ngoài cài giá trị mặc định và kiểm soát bắt buộc, còn có thể kiểm soát hiển thị/ẩn Field, gán giá trị động. Ví dụ: Khi trạng thái là "Đã đóng", ẩn Field người xử lý. Các chương sau gặp lại sẽ mở rộng.

## 4.3 [Block chi tiết](/interface-builder/blocks/data-blocks/details)

Chương trước chúng ta đã thêm nút "Xem" cho hàng trong bảng, click sẽ mở drawer. Bây giờ đến cấu hình nội dung trong drawer.

1. Trong bảng click nút **"Xem"** của một hàng nào đó, mở drawer.
2. Trong drawer click **"Tạo Block (Add block) → Block dữ liệu → Chi tiết"**.
3. Chọn **"Bảng dữ liệu hiện tại (Current collection)"**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. Trong Block chi tiết **"Field (Fields)"**, layout như sau:


| Khu vực | Field |
|------|------|
| Đầu | Tiêu đề, trạng thái (style tag) |
| Thân | Mô tả (vùng text lớn) |
| Thông tin bên | Tên phân loại, mức độ ưu tiên, người submit, người xử lý, thời gian tạo |

Cách đặt một tiêu đề lớn?
Chọn Field > markdown > edit markdown > trong vùng edit chọn biến > record hiện tại > tiêu đề
Như vậy đã chèn động tiêu đề của record vào Block markdown.
Xóa text mặc định, dùng cú pháp markdown, biến nó thành style tiêu đề cấp 2 (tức là thêm ## space ở phía trước).

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

Field tiêu đề bản thân trong trang có thể bỏ đi, điều chỉnh layout form chi tiết một chút

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **Mẹo**: Nhiều Field có thể qua kéo thả xếp trên cùng một hàng, để layout gọn gàng đẹp mắt hơn.


1. Trong **"Action (Actions)"** của Block chi tiết, đánh dấu nút **"Edit"**, tiện cho việc trực tiếp vào chế độ edit từ chi tiết.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Cấu hình form edit

Click nút "Edit", sẽ mở một popup mới — bên trong cần đặt một form edit. Field của form edit và form tạo mới gần như giống nhau, chẳng lẽ phải đánh dấu lại từ đầu?

Không cần. Còn nhớ form tạo mới chứ? Chúng ta **lưu nó thành template** trước, form edit trực tiếp tham chiếu là được.

**Bước 1: Quay lại form tạo mới, lưu thành template**

1. Đóng popup hiện tại, quay lại danh sách ticket, click nút "Thêm" để mở form tạo mới.
2. Click **cài đặt Block** (biểu tượng ba gạch ngang) ở góc trên bên phải của Block form, tìm **"Save as template"**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Click lưu là được, mặc định là **"Reference"** — tất cả các form tham chiếu template đó sẽ chia sẻ cùng một bộ cấu hình, sửa một chỗ tất cả đồng bộ.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Form ticket của chúng ta không phức tạp, chọn "Reference" thống nhất bảo trì sẽ tiện hơn. Nếu chọn "Copy", thì mỗi form lấy bản sao độc lập, tự sửa không ảnh hưởng nhau.

**Bước 2: Tham chiếu template trong popup edit**

1. Quay lại drawer chi tiết hoặc cột Action bảng, click nút "Edit" để mở popup edit.

Bạn có thể nghĩ: trực tiếp qua **"Tạo Block → Block khác → Block template"** để tạo không phải được sao? Thử một chút bạn sẽ phát hiện — cách này tạo ra là một **form thêm**, hơn nữa Field cũng không tự động điền. Đây là một cái bẫy thường gặp.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

Cách làm đúng là:

2. Trong popup click **"Tạo Block (Add block) → Block dữ liệu → Form (Edit)"**, tạo một Block form edit bình thường trước.
3. Trong form edit click **"Field (Fields) → Field templates"**, chọn template vừa lưu.
4. Field sẽ được điền hết tất cả một lượt, hoàn toàn giống form tạo mới.
5. Đừng quên thêm nút Action "Submit", để Người dùng sau khi sửa có thể lưu.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

Sau này muốn thêm Field? Chỉ cần sửa một lần trong template, form tạo mới và form edit đồng bộ cập nhật.

### Quick edit: Không bật popup cũng có thể sửa dữ liệu

Ngoài edit qua popup, NocoBase còn hỗ trợ **quick edit** trực tiếp trong bảng — không cần mở popup nào, di chuột lên là có thể sửa.

Có hai cách bật:

- **Cấp Block bảng**: Click **cài đặt Block** (biểu tượng ba gạch ngang) của Block bảng, tìm **"Quick editing"**, bật xong toàn bộ Field của bảng đều hỗ trợ quick edit.
- **Cấp Field đơn lẻ**: Click tùy chọn cấu hình Field của một cột nào đó, tìm **"Quick editing"**, có thể từng Field kiểm soát có bật hay không.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Sau khi bật, di chuột lên cell của bảng sẽ xuất hiện một biểu tượng bút chì nhỏ, click sẽ bật component edit của Field đó, sửa xong tự động lưu.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **Phù hợp tình huống nào?** Quick edit rất phù hợp tình huống cần sửa hàng loạt các Field như trạng thái, người xử lý, v.v. Ví dụ admin khi xem danh sách ticket, có thể trực tiếp click cột "Trạng thái" để nhanh chóng đổi ticket từ "Chờ xử lý" thành "Đang xử lý", không cần mở edit từng cái.

## 4.4 Bật record history

:::info Plugin thương mại
"[Record history](https://docs.nocobase.com/cn/record-history/)" là Plugin [bản chuyên nghiệp](https://www.nocobase.com/cn/commercial) NocoBase, cần license bản thương mại mới có thể dùng. Nếu bạn dùng bản cộng đồng, có thể bỏ qua mục này, không ảnh hưởng đến các chương sau.
:::

Một điểm quan trọng nhất của hệ thống ticket là: **ai vào lúc nào sửa cái gì, đều phải có thể truy ra**. Plugin "Record history" của NocoBase giúp chúng ta tự động ghi lại mỗi lần thay đổi dữ liệu.

### Cấu hình record history

1. Vào **Cài đặt → Quản lý Plugin**, đảm bảo Plugin "Record history" đã được bật.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Vào trang cấu hình Plugin, click **"Thêm bảng dữ liệu"**, chọn **"Ticket"**.
3. Chọn các Field cần ghi lại: **Tiêu đề, trạng thái, mức độ ưu tiên, người xử lý, mô tả**, v.v.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Đề xuất**: Không cần ghi lại tất cả Field. Các Field như ID, thời gian tạo sẽ không sửa thủ công, không cần theo dõi. Chỉ ghi lại những thay đổi Field có ý nghĩa nghiệp vụ.

4. Lúc này quay lại tùy chọn cấu hình, click **"Đồng bộ snapshot dữ liệu lịch sử"**, Plugin sẽ tự động ghi lại tất cả ticket hiện có làm record history đầu tiên, mỗi lần sửa sau đó sẽ thêm một record history mới.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Xem history trong trang chi tiết

1. Quay lại trang drawer chi tiết ticket (click nút "Xem" của hàng trong bảng).
2. Trong drawer **"Tạo Block (Add block) → Record history"**.
3. Chọn **"Bảng dữ liệu hiện tại"**, chọn dữ liệu **"Record hiện tại"**.
4. Phía dưới trang chi tiết sẽ xuất hiện một timeline, hiển thị rõ ràng mỗi lần thay đổi: ai vào lúc nào sửa Field nào từ giá trị gì thành giá trị gì.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

Như vậy, dù ticket có qua tay nhiều người xử lý, tất cả thay đổi đều rõ ràng.

## Tóm tắt

Chương này chúng ta đã hoàn thành toàn bộ vòng đời của dữ liệu:

- **Form** — Người dùng có thể submit ticket mới, Field có giá trị mặc định và validation
- **Linkage rule** — Ticket khẩn cấp tự động yêu cầu điền mô tả bắt buộc
- **Block chi tiết** — Hiển thị rõ ràng thông tin đầy đủ của ticket
- **Record history** — Tự động theo dõi mỗi lần thay đổi, audit không lo (Plugin thương mại, tùy chọn)

Từ "thấy được" đến "điền được" rồi "tra được" — hệ thống ticket của chúng ta đã có tính khả dụng cơ bản.

## Tài nguyên liên quan

- [Block form](/interface-builder/blocks/data-blocks/form) — Cấu hình chi tiết Block form
- [Block chi tiết](/interface-builder/blocks/data-blocks/details) — Cấu hình Block chi tiết
- [Linkage rule](/interface-builder/linkage-rules) — Mô tả linkage rule Field
