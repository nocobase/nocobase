# Chương 7: Dashboard — Nhìn toàn cục bằng một cái liếc

Chương trước chúng ta đã dùng Workflow để hệ thống tự động thông báo, tự động ghi thời gian. Hệ thống ngày càng thông minh, nhưng vẫn còn thiếu một thứ — **góc nhìn toàn cục**.

Có bao nhiêu ticket? Đã xử lý bao nhiêu? Loại vấn đề nào nhiều nhất? Mỗi ngày tăng bao nhiêu? Những câu hỏi này dựa vào lật danh sách thì không trả lời được. Chương này, chúng ta dùng [Block biểu đồ](/data-visualization) (biểu đồ tròn, biểu đồ đường, biểu đồ cột) và [Block Markdown](/interface-builder/blocks/other-blocks/markdown) để xây dựng một **Dashboard dữ liệu**, biến dữ liệu thành hình ảnh có thể hiểu được bằng một cái liếc.

## 7.1 Thêm trang Dashboard

Trước tiên, chúng ta thêm một menu item mới vào thanh navigation trên cùng.

Vào [chế độ cấu hình](/get-started/how-nocobase-works), trên thanh menu trên cùng click **"Thêm menu item"** (biểu tượng `+`), chọn **"Trang phiên bản mới (v2)"**, đặt tên là "Dashboard dữ liệu".

![07-dashboard-2026-03-15-21-39-35](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-39-35.png)

Trang này chuyên để đặt biểu đồ, chính là sân khấu chính của Dashboard.

## 7.2 Biểu đồ tròn: Phân bố trạng thái ticket

Biểu đồ đầu tiên, chúng ta dùng biểu đồ tròn để hiển thị "Chờ xử lý, đang xử lý, đã hoàn thành" mỗi cái có bao nhiêu.

Trong trang Dashboard dữ liệu, click **Tạo [Block](/interface-builder/blocks) (Add block) → [Biểu đồ](/data-visualization)**.

Sau khi thêm, click nút **Cấu hình** ở góc trên bên phải Block, panel cấu hình biểu đồ sẽ mở ở bên phải.

### Cấu hình query dữ liệu

- **[Bảng dữ liệu](/data-sources/data-modeling/collection)**: Chọn "Ticket"
- **Measures**: Chọn bất kỳ [Field](/data-sources/data-modeling/collection-fields) không trùng (ví dụ ID), cách aggregation chọn **Count**
- **Dimensions**: Chọn Field "Trạng thái"

![07-dashboard-2026-03-15-21-44-32](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-44-32.png)

Click **Thực thi query**, có thể preview dữ liệu trả về ở phía dưới.

### Cấu hình tùy chọn biểu đồ

- **Kiểu biểu đồ**: Chọn **Biểu đồ tròn**
- **Mapping Field**: Category chọn "Trạng thái", Value chọn giá trị count
- **Label**: Bật công tắc

Trong trang bên trái sẽ xuất hiện một biểu đồ tròn đẹp. Mỗi miếng đại diện cho một trạng thái, mặc định hiển thị số lượng cụ thể và tỷ lệ.

![07-dashboard-2026-03-15-21-45-40](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-45-40.png)

Click **Lưu**, biểu đồ đầu tiên đã hoàn thành.

## 7.3 Biểu đồ đường: Xu hướng ticket mới mỗi ngày

Biểu đồ tròn nhìn "phân bố hiện tại", biểu đồ đường nhìn "xu hướng thay đổi".

Trong trang lại thêm một Block biểu đồ, cấu hình như sau:

### Query dữ liệu

- **Bảng dữ liệu**: Chọn "Ticket"
- **Measures**: ID, count
- **Dimensions**: Chọn Field "Thời gian tạo", định dạng cài thành **YYYY-MM-DD** (group theo ngày)

> **Mẹo nhỏ**: Định dạng của dimension ngày rất quan trọng. Chọn `YYYY-MM-DD` là thống kê theo ngày, chọn `YYYY-MM` là thống kê theo tháng. Chọn độ chi tiết phù hợp theo lượng dữ liệu của bạn.

### Tùy chọn biểu đồ

- **Kiểu biểu đồ**: Chọn **Biểu đồ đường**
- **Mapping Field**: xField chọn "Thời gian tạo", yField chọn giá trị count

![07-dashboard-2026-03-15-21-48-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-48-33.png)

Sau khi lưu, bạn có thể thấy đường cong thay đổi của lượng ticket theo thời gian. Nếu một ngày nào đó đột nhiên tăng vọt, chứng tỏ ngày đó đã có vấn đề gì đó, đáng để chú ý.

## 7.4 Biểu đồ cột: Số lượng ticket mỗi phân loại

Biểu đồ thứ ba, chúng ta xem phân loại nào có ticket nhiều nhất. Ở đây dùng **biểu đồ cột ngang** thay vì biểu đồ cột dọc — khi phân loại nhiều, label trục X của biểu đồ cột dọc dễ chồng lên nhau bị ẩn, hiển thị ngang sẽ rõ hơn.

Thêm Block biểu đồ thứ ba:

### Query dữ liệu

- **Bảng dữ liệu**: Chọn "Ticket"
- **Measures**: ID count
- **Dimensions**: Chọn Field liên kết "Phân loại" (chọn Field tên của phân loại)

### Tùy chọn biểu đồ

- **Kiểu biểu đồ**: Chọn **Biểu đồ cột (Bar)**
- **Mapping Field**: xField chọn giá trị count (ID count), yField chọn "Tên phân loại"

![07-dashboard-2026-03-15-22-05-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-05-11.png)

Sau khi lưu, loại vấn đề nào nhiều nhất nhìn vào là biết ngay. Nếu cột "Sự cố mạng" dài hơn rất nhiều so với các phân loại khác, có lẽ nên cân nhắc nâng cấp thiết bị mạng.

## 7.5 Block bảng: Ticket chưa hoàn thành

Biểu đồ cho góc nhìn tổng hợp, nhưng admin thông thường còn cần thấy chi tiết cụ thể. Chúng ta thêm một bảng **Ticket chưa hoàn thành**, hiển thị trực tiếp tất cả ticket vẫn chưa xử lý xong.

Trong trang thêm một **Block bảng**, bảng dữ liệu chọn "Ticket".

### Cấu hình điều kiện lọc

Click tùy chọn cấu hình ở góc trên bên phải của Block bảng, tìm **Cài đặt phạm vi dữ liệu**, thêm một điều kiện [lọc](/interface-builder/blocks/filter-blocks/form):

- **Trạng thái** không bằng **Đã hoàn thành**

Như vậy bảng chỉ hiển thị các ticket chưa hoàn thành, một ticket hoàn thành sẽ tự động biến mất khỏi danh sách.

### Cấu hình Field

Chọn các cột muốn hiển thị: Tiêu đề, trạng thái, mức độ ưu tiên, người xử lý, thời gian tạo.

![07-dashboard-2026-03-15-22-20-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-20-11.png)

> **Mẹo nhỏ**: Có thể thêm **sắp xếp mặc định** (giảm dần theo thời gian tạo), để ticket mới nhất xếp ở trên cùng.

## 7.6 Block Markdown: Thông báo hệ thống

Ngoài biểu đồ, chúng ta còn có thể đặt một số thông tin text trên Dashboard.

Thêm một **[Block Markdown](/interface-builder/blocks/other-blocks/markdown)**, viết thông báo hệ thống hoặc hướng dẫn sử dụng:

```markdown
## Hệ thống ticket IT

Chào mừng bạn sử dụng! Gặp vấn đề hãy submit ticket, team kỹ thuật sẽ xử lý sớm nhất có thể.

**Vấn đề khẩn cấp** vui lòng gọi trực tiếp đường dây nóng IT: 8888
```

![07-dashboard-2026-03-15-21-53-54](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-53-54.png)

Block Markdown đặt ở đầu Dashboard, vừa là thông tin chào mừng, vừa có thể dùng làm bảng thông báo. Nội dung có thể sửa bất cứ lúc nào, rất linh hoạt.

![07-dashboard-2026-03-15-22-30-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-30-57.png)

## 7.7 Block JS: Banner chào mừng cá nhân hóa

Định dạng Markdown khá cố định, nếu muốn hiệu ứng phong phú hơn thì làm sao? NocoBase cung cấp **Block JS (JavaScript Block)**, có thể dùng code để tự do tùy chỉnh nội dung hiển thị.

Chúng ta dùng nó để làm một banner chào mừng phong cách business — dựa vào Người dùng đang đăng nhập và thời gian, hiển thị câu chào hỏi cá nhân hóa.

Trong trang thêm một **Block JS** (Tạo Block → Block khác → Block JS).

![07-dashboard-2026-03-15-22-33-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-33-24.png)

Trong Block JS có thể qua `ctx.getVar("ctx.user.username")` để lấy username của Người dùng đang đăng nhập, dưới đây là một banner chào mừng phong cách business tối giản:

```js
const uname = await ctx.getVar("ctx.user.username")
const name = uname || 'Người dùng';
const hour = new Date().getHours();
const hi = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const week = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'][d.getDay()];

ctx.render(`
<div style="padding: 24px 32px; background: #f7f8fa; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 600; color: #1d2129;">${hi}, ${name}</div>
      <div style="font-size: 14px; color: #86909c; margin-top: 4px;">Chào mừng quay lại hệ thống ticket IT</div>
    </div>
    <div style="font-size: 14px; color: #86909c;">${date}　${week}</div>
  </div>
</div>`);
```

![07-dashboard-2026-03-15-22-51-27](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-51-27.png)

Hiệu ứng là một card nền xám nhạt, bên trái là câu chào, bên phải là ngày tháng. Gọn gàng, thực dụng, không lấn át.

> **Mẹo nhỏ**: `ctx.getVar("ctx.user.xxx")` là cách lấy thông tin Người dùng hiện tại trong Block JS, các Field thường dùng có `nickname` (biệt danh), `username` (tên Người dùng), `email` (email), v.v. Block JS còn có thể gọi API để query dữ liệu, sau này bạn có thể dùng nó để làm thêm nội dung tùy chỉnh.

## 7.8 Action Panel: Lối vào nhanh + Tái sử dụng popup

Dashboard không chỉ là nơi xem dữ liệu, mà còn nên là điểm khởi đầu của thao tác. Chúng ta thêm một **Action Panel**, để Người dùng trực tiếp submit ticket từ trang chủ, nhảy đến danh sách ticket.

Trong trang thêm một Block **Action Panel** (Tạo Block → Block khác → Action Panel), sau đó trong Action Panel thêm hai [Action](/interface-builder/actions):

![07-dashboard-2026-03-15-22-54-06](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-54-06.png)

1. **Link: Nhảy đến danh sách ticket** — Thêm một Action "Link", cấu hình URL trỏ đến trang danh sách ticket (ví dụ `/admin/camcwbox2uc`)

![07-dashboard-2026-03-15-22-57-49](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-57-49.png)

2. **Nút: Thêm ticket** — Thêm một nút Action "Popup", sửa tiêu đề thành "Thêm ticket"

![07-dashboard-2026-03-15-23-00-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-00-36.png)

Nhưng nút "Thêm ticket" sau khi click thì popup trống, chúng ta cần cấu hình nội dung popup. Lại xây từ đầu form thêm mới quá phiền — ở đây dẫn ra một tính năng cực kỳ thực dụng: **tái sử dụng popup**.

### Lưu template popup

> Lưu ý: Template popup ở đây và "template Block" ở Chương 4 không phải là một thứ. Template Block lưu Field và layout của một Block form đơn lẻ, còn template popup lưu nội dung của **toàn bộ popup** — bao gồm tất cả Block, Field, nút Action bên trong.

1. Vào **trang danh sách ticket**, tìm nút "Thêm ticket"
2. Click tùy chọn cấu hình của nút, tìm **"Save as template"**, lưu popup hiện tại
3. Đặt tên cho template (như "Popup thêm ticket mới")

![07-dashboard-2026-03-15-23-05-17](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-05-17.png)

### Tái sử dụng popup ở trang chủ

1. Quay lại trang Dashboard dữ liệu, click tùy chọn cấu hình của nút "Thêm ticket" trong Action Panel
2. Tìm **"Cài đặt popup"**, chọn template "Popup thêm ticket mới" vừa lưu
3. Sau khi lưu, click nút có thể trực tiếp mở popup form thêm mới giống hệt với trang danh sách ticket

![07-dashboard-2026-03-15-23-06-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-06-33.png)

![07-dashboard-2026-03-15-23-07-20](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-07-20.gif)

### Click tiêu đề mở popup chi tiết

Cách tương tự, chúng ta cũng có thể cho tiêu đề của bảng ticket chưa hoàn thành click được, mở trực tiếp chi tiết ticket:

1. Trước tiên đến **trang danh sách ticket**, tìm tùy chọn cấu hình của nút "Xem", tương tự **"Save as template"** (như "Popup chi tiết ticket")

![07-dashboard-2026-03-15-23-08-02](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-08-02.png)

2. Quay lại trang Dashboard dữ liệu, trong bảng ticket chưa hoàn thành, click tùy chọn cấu hình của Field "Tiêu đề"
3. Bật công tắc **"Bật click để mở"** — lúc này sẽ xuất hiện tùy chọn "Cài đặt popup"
4. Trong cài đặt popup chọn template "Popup chi tiết ticket" vừa lưu

![07-dashboard-2026-03-15-23-11-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-11-24.png)

Bây giờ, Người dùng click tiêu đề ticket trên Dashboard có thể trực tiếp xem chi tiết, không cần nhảy đến trang danh sách ticket. Toàn bộ Dashboard trở nên gọn gàng và hiệu quả hơn.

![07-dashboard-2026-03-15-23-12-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-12-36.png)

> **Lợi ích của tái sử dụng popup**: Cùng một template popup có thể dùng ở nhiều trang, sau khi sửa template tất cả các nơi tham chiếu đồng bộ cập nhật. Đây cũng là tư duy tương tự với chế độ "Reference" ở Chương 4 — bảo trì một chỗ, có hiệu lực mọi nơi.

## 7.9 Điều chỉnh layout

Bây giờ trên trang đã có 6 Block (Banner chào mừng JS + Action Panel + 3 biểu đồ + bảng ticket), chúng ta điều chỉnh layout, để nó đẹp hơn.

Trong chế độ cấu hình, bạn có thể qua **kéo thả** để điều chỉnh vị trí và kích thước của mỗi Block:

Layout đề xuất tham khảo:

- **Hàng đầu tiên**: Banner chào mừng JS (trái) + Action Panel (phải)
- **Hàng thứ hai**: Biểu đồ tròn (trái) + Bảng ticket (phải)
- **Hàng thứ ba**: Biểu đồ đường (trái) + Biểu đồ cột (phải)

![07-dashboard-2026-03-15-23-14-19](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-14-19.png)

Lưu ý, bạn có thể phát hiện chiều cao Block không thẳng hàng, lúc này có thể trong Cài đặt Block > Chiều cao Block điều chỉnh thủ công, ví dụ tôi đã điều chỉnh hai Block ở hàng thứ hai đều thành 500px.

Kéo viền có thể điều chỉnh độ rộng Block, để hai biểu đồ mỗi cái chiếm một nửa. Thử nhiều lần là có thể tìm ra cách sắp xếp thoải mái nhất.

![07-dashboard-2026-03-15-23-18-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-18-57.png)

## Tóm tắt

Chương này chúng ta đã dùng 6 Block để xây dựng một Dashboard dữ liệu phong phú và thực dụng:

- **Banner chào mừng JS**: Hiển thị câu chào cá nhân hóa dựa vào Người dùng hiện tại và thời gian
- **Action Panel**: Nhảy nhanh đến danh sách ticket, một bước thêm ticket (tái sử dụng popup)
- **Biểu đồ tròn**: Nhìn vào là thấy tỷ lệ phân bố trạng thái ticket
- **Biểu đồ đường**: Theo dõi xu hướng thay đổi của lượng ticket theo thời gian
- **Biểu đồ cột**: So sánh ngang số lượng ticket của các phân loại, phân loại nhiều cũng không sợ label chồng lên nhau
- **Bảng ticket chưa hoàn thành**: Một cái nhìn về tất cả ticket chờ xử lý, click tiêu đề trực tiếp xem chi tiết (tái sử dụng popup)

Đồng thời chúng ta đã học **tái sử dụng popup** — kỹ thuật quan trọng này — lưu popup của một trang thành template, ở các trang khác trực tiếp tham chiếu, tránh cấu hình lặp lại.

Trực quan hóa dữ liệu là Plugin tích hợp sẵn của NocoBase, không cần cài đặt thêm. Cách cấu hình giống như xây trang — chọn dữ liệu, chọn kiểu biểu đồ, mapping Field, ba bước xong.

## Xem trước tiếp theo

Đến đây, chức năng của hệ thống ticket đã rất hoàn chỉnh: mô hình hóa dữ liệu, xây trang, nhập form, kiểm soát quyền, Workflow tự động, Dashboard dữ liệu, đều có. Sau này chúng ta dự định tung ra **tutorial xây dựng phiên bản AI Agent** — dùng AI Agent tự động hoàn thành xây dựng hệ thống ở local, hãy chờ đợi nhé.

## Tài nguyên liên quan

- [Trực quan hóa dữ liệu](/data-visualization) — Cấu hình biểu đồ chi tiết
- [Block Markdown](/interface-builder/blocks/other-blocks/markdown) — Cách dùng Block Markdown
- [Layout Block](/interface-builder/blocks) — Layout trang và cấu hình Block
