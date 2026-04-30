# Chương 3: Xây dựng trang — Từ trống không đến có thể dùng được

Chương trước chúng ta đã dựng xong khung xương của bảng dữ liệu, nhưng hiện tại dữ liệu chỉ tồn tại ở "backend" — Người dùng hoàn toàn không thấy được. Chương này, chúng ta cần đưa dữ liệu **lên sân khấu**: tạo [Block bảng](/interface-builder/blocks/data-blocks/table) để hiển thị dữ liệu ticket, cấu hình hiển thị Field, sắp xếp, [lọc](/interface-builder/blocks/filter-blocks/form) và phân trang, biến nó thành một danh sách ticket thực sự có thể dùng được.

## 3.1 Block là gì

Trong NocoBase, **Block** chính là "khối lego" trên trang. Muốn hiển thị một bảng? Đặt một [Block bảng](/interface-builder/blocks/data-blocks/table). Muốn hiển thị một form? Đặt một Block form. Một trang có thể tự do kết hợp nhiều Block, còn có thể kéo thả điều chỉnh layout.

Các kiểu Block thường gặp:

| Kiểu | Tác dụng |
|------|------|
| Bảng (Table) | Hiển thị nhiều dữ liệu dạng hàng cột |
| Form | Cho Người dùng nhập hoặc chỉnh sửa dữ liệu |
| Chi tiết (Details) | Hiển thị thông tin đầy đủ của một record |
| Form lọc (Filter Form) | Cung cấp điều kiện lọc, lọc dữ liệu của các Block khác |
| Biểu đồ (Chart) | Hiển thị trực quan như biểu đồ tròn, biểu đồ đường |
| Markdown | Đặt một đoạn text hoặc mô tả tùy chỉnh |

Hãy nhớ phép so sánh này: **Block = khối lego**, tiếp theo chúng ta sẽ dùng các khối lego này để xây trang quản lý ticket.

## 3.2 Thêm menu và trang

Trước tiên, chúng ta cần tạo lối vào "Quản lý ticket" trong hệ thống.

1. Click công tắc **UI editor** ở góc trên bên phải, vào [chế độ cấu hình](/get-started/how-nocobase-works) giao diện (toàn bộ trang sẽ xuất hiện viền có thể chỉnh sửa màu cam).
2. Di chuột đến nút **"Thêm menu item (Add menu item)"** trên thanh navigation trên cùng, chọn **"Thêm nhóm (Add group)"**, đặt tên là **"Quản lý ticket"**.

![03-building-pages-2026-03-12-09-38-36](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-38-36.png)


3. Thanh navigation trên cùng sẽ ngay lập tức xuất hiện menu "Quản lý ticket". **Click vào nó**, bên trái sẽ mở thanh menu nhóm.
4. Trong thanh menu bên trái, click nút **"Thêm menu item (Add menu item)"** màu cam, chọn **"Trang phiên bản mới (v2) (Modern page (v2))"**, lần lượt thêm hai trang con:
   - **Danh sách ticket** — Hiển thị tất cả ticket
   - **Phân loại ticket** — Quản lý dữ liệu phân loại

![03-building-pages-2026-03-12-09-41-26](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-41-26.png)

> **Lưu ý**: Khi thêm trang sẽ thấy hai tùy chọn "Trang phiên bản cũ (v1)" và "Trang phiên bản mới (v2)", tutorial này thống nhất dùng **v2**.

## 3.3 Thêm Block bảng

Bây giờ vào trang "Danh sách ticket", thêm một Block bảng cho nó:

1. Trong trang trống, click **"Tạo Block (Add block)"**.
2. Chọn **Block dữ liệu → Bảng**.
3. Trong danh sách bảng dữ liệu hiện ra, chọn **"Ticket"** (chính là bảng tickets mà chúng ta đã tạo ở chương trước).

![03-building-pages-2026-03-13-08-44-07](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-07.png)

Sau khi thêm Block bảng thành công, trang sẽ xuất hiện một bảng trống.

![03-building-pages-2026-03-13-08-44-29](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-29.png)

Bảng trống không có dữ liệu thì khó debug, chúng ta thêm nhanh một nút tạo mới trước, nhập vài dữ liệu test:

1. Click **"Cấu hình Action (Configure actions)"** ở góc trên bên phải của bảng, đánh dấu **"Tạo mới (Add new)"**.

![03-building-pages-2026-03-17-14-58-39](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-58-39.png)

2. Click nút **"Tạo mới"** vừa xuất hiện, trong popup chọn **Thêm Block (Add block) → Form (Tạo mới) (Form (Add New)) → Bảng dữ liệu hiện tại (Current collection)**.

![03-building-pages-2026-03-17-14-59-42](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-59-42.png)

3. Trong popup click **"Cấu hình Field (Configure fields)"**, đánh dấu các Field như tiêu đề, trạng thái, mức độ ưu tiên; click **"Cấu hình Action (Configure actions)"**, bật nút **"Submit"**.

![03-building-pages-2026-03-17-15-00-54](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-00-54.png)

![03-building-pages-2026-03-17-15-01-49](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-01-49.png)

4. Điền tùy ý vài dữ liệu ticket và submit, trong bảng sẽ thấy nội dung.

![03-building-pages-2026-03-17-15-03-04](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-03-04.png)

> Cấu hình chi tiết của form (Field linkage, edit form, popup chi tiết, v.v.) chúng ta sẽ giảng giải sâu trong [Chương 4](/tutorials/v2/04-forms-and-details), ở đây nhập được dữ liệu là đủ.

## 3.4 Cấu hình cột hiển thị

Mặc định bảng sẽ không tự động hiển thị tất cả Field, chúng ta cần chọn thủ công các cột muốn hiển thị:

1. Bên phải header của Block bảng, click **"[Field](/data-sources/data-modeling/collection-fields) (Fields)"**.
2. Đánh dấu các Field cần hiển thị:
   - **Tiêu đề** — Chủ đề ticket, nhìn vào là thấy ngay
   - **Trạng thái** — Tiến độ xử lý hiện tại
   - **Mức độ ưu tiên** — Mức độ khẩn cấp
   - **Phân loại** — Field liên kết, sẽ hiển thị tên phân loại
   - **Người submit** — Ai đã submit ticket
   - **Người xử lý** — Ai đang phụ trách
3. Các Field không cần hiển thị (như ID, thời gian tạo) thì không đánh dấu, giữ bảng gọn gàng.

![03-building-pages-2026-03-13-08-47-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-47-18.png)

> **Mẹo**: Thứ tự hiển thị của Field có thể điều chỉnh bằng kéo thả. Đặt "tiêu đề" và "trạng thái" quan trọng nhất ở trước, tiện cho việc nhìn lướt qua thông tin chính.

### Vấn đề Field liên kết hiển thị ID

Sau khi đánh dấu "Phân loại", bạn sẽ phát hiện trong bảng hiển thị là ID phân loại (số), không phải tên. Điều này là do Field liên kết mặc định dùng ID làm Field tiêu đề. Có hai cách sửa:

**Cách một: Sửa trong cấu hình cột bảng (chỉ có hiệu lực với bảng hiện tại)**

Click vào tùy chọn cấu hình của cột "Phân loại", tìm **"Field tiêu đề (Title field)"**, đổi từ ID thành **Tên**. Cách này chỉ ảnh hưởng đến Block bảng hiện tại.

![03-building-pages-2026-03-13-09-23-03](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-03.png)

![03-building-pages-2026-03-13-09-57-40](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-57-40.gif)

**Cách hai: Sửa trong data source (có hiệu lực toàn cục, khuyến nghị)**

Vào **Cài đặt → [Data source](/data-sources) → [Bảng dữ liệu](/data-sources/data-modeling/collection) → Bảng phân loại**, đổi **"Field tiêu đề"** thành **Tên**. Như vậy tất cả các nơi tham chiếu đến bảng phân loại đều sẽ mặc định hiển thị tên, một lần làm mãi mãi. Sau khi sửa cần quay lại trang thêm lại Field này mới có hiệu lực.
![03-building-pages-2026-03-13-09-23-41](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-41.png)

## 3.5 Thêm lọc và sắp xếp

Khi ticket ngày càng nhiều, chúng ta cần nhanh chóng tìm thấy ticket cụ thể. NocoBase cung cấp nhiều cách, chúng ta giới thiệu cách phổ biến nhất trước, đó là **Block form lọc**.

### Thêm form lọc

1. Trong trang danh sách ticket, click **"Tạo Block"**, chọn **Block lọc → Form lọc**.
2. Trong trang v2 không cần chọn bảng dữ liệu — form lọc sẽ trực tiếp được thêm vào trang.
3. Trong form lọc, click **"Field (Fields)"**, sẽ hiển thị danh sách tất cả các Block dữ liệu có thể lọc trên trang hiện tại, ví dụ `Table: Ticket #c48b` (đoạn code phía sau là UID của Block, dùng để phân biệt các Block của cùng một bảng).

![03-building-pages-2026-03-13-08-48-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-48-37.png)

4. Di chuột lên tên Block, sẽ mở rộng danh sách Field có thể lọc của Block đó. Click Field để thêm nó vào làm điều kiện lọc: **Trạng thái**, **Mức độ ưu tiên**, **Phân loại**.

![03-building-pages-2026-03-13-09-25-44](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-25-44.png)

5. Sau khi thêm, Người dùng nhập điều kiện trong form lọc, dữ liệu trong bảng sẽ **lọc tự động thời gian thực**.

![03-building-pages-2026-03-13-10-00-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-10-00-25.gif)

### Tìm kiếm fuzzy đa Field

Nếu chúng ta muốn qua một ô tìm kiếm đồng thời tìm nhiều Field thì làm sao?

Click tùy chọn cấu hình ở góc trên bên phải của Field tìm kiếm, sẽ thấy tùy chọn **"Connect fields"**. Mở rộng ra sẽ liệt kê các Field có thể tìm kiếm liên kết trong mỗi Block — bạn sẽ phát hiện mặc định chỉ kết nối "Tiêu đề".
![03-building-pages-2026-03-13-09-30-06](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-30-06.png)

Chúng ta có thể chọn thêm nhiều Field, ví dụ: **Mô tả**, như vậy khi Người dùng nhập keyword sẽ đồng thời tìm các Field này.

Thậm chí còn có thể qua Field của object liên kết để lọc — click "Phân loại", trong tùy chọn cấp tiếp theo đánh dấu "Tên phân loại", khi tìm cũng sẽ match tên phân loại.

![03-building-pages-2026-03-13-09-31-35](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-31-35.png)
![03-building-pages-2026-03-13-09-32-20](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-32-20.png)

> **Connect fields rất mạnh**: Nó có thể có hiệu lực qua nhiều Block, nhiều Field. Nếu trên trang có nhiều Block dữ liệu, hãy tự thử tạo Block mới xem hiệu ứng!

### Không muốn lọc tự động?

Nếu muốn Người dùng phải click nút mới kích hoạt lọc, có thể click **"[Action](/interface-builder/actions) (Actions)"** ở góc dưới bên phải của form lọc, đánh dấu nút **"Lọc (Filter)"** và **"Reset"**. Như vậy sau khi Người dùng điền điều kiện cần click thủ công mới thực hiện lọc.
![03-building-pages-2026-03-13-09-33-15](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-33-15.png)

### Một cách lọc khác: Action lọc tích hợp sẵn của bảng

Ngoài Block form lọc độc lập, bản thân Block bảng cũng tự mang nút Action **"Lọc (Filter)"**. Phía trên Block bảng click **"Action (Actions)"**, đánh dấu **"Lọc"**, thanh công cụ bảng sẽ xuất hiện một nút lọc. Click sẽ bật panel điều kiện, Người dùng có thể trực tiếp lọc dữ liệu theo điều kiện Field.
![03-building-pages-2026-03-13-09-34-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-34-25.png)
![03-building-pages-2026-03-13-09-36-09](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-36-09.png)

Nếu không muốn mỗi lần phải bật nút lọc rồi thủ công tìm Field, có thể preset Field lọc mặc định trong cấu hình của nút lọc, như vậy Người dùng vừa bật là có thể trực tiếp thấy các điều kiện lọc thường dùng.
![03-building-pages-2026-03-13-09-38-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-38-37.png)

> **Lưu ý**: Action lọc tích hợp sẵn của bảng hiện **chưa hỗ trợ tìm kiếm fuzzy đa Field**. Nếu cần tìm kiếm đa Field, hãy dùng Block form lọc bên trên kết hợp tính năng "Connect fields".

### Cài đặt sắp xếp mặc định

Chúng ta muốn ticket mới nhất xếp lên đầu:

1. Click **cài đặt Block** (biểu tượng ba gạch ngang) ở góc trên bên phải của Block bảng.
2. Tìm **"Cài đặt rule [sắp xếp](/interface-builder/blocks/data-blocks/table)"**.
3. Thêm Field sắp xếp: chọn **Thời gian tạo**, cách sắp xếp chọn **Giảm dần**.

![03-building-pages-2026-03-13-09-40-54](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-40-54.png)

Như vậy, ticket mới submit sẽ luôn xếp ở trên cùng, xử lý sẽ tiện hơn.

## 3.6 Cấu hình Action hàng

Chỉ xem danh sách thôi chưa đủ, chúng ta còn cần có thể click vào xem chi tiết ticket, cũng như chỉnh sửa ticket.

1. Phía trên cột Action, click số "+" thứ hai.
2. Click các Action: **Xem**, **[Edit](/interface-builder/actions/edit)**, **[Xóa](/interface-builder/actions/delete)**.
3. Mỗi vị trí thanh Action của hàng dữ liệu sẽ xuất hiện các nút "Xem", "Edit" và "Xóa".

![03-building-pages-2026-03-13-09-42-42](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-42-42.png)

Click nút "Xem" hoặc "Xem", sẽ mở một drawer, bên trong có thể đặt Block chi tiết để hiển thị thông tin đầy đủ. Chương sau chúng ta sẽ cấu hình chi tiết.
Click "Xóa", hàng dữ liệu này sẽ bị xóa.

## 3.7 Điều chỉnh layout trang

Đến giờ này, trên trang đã có hai Block là form lọc và bảng, nhưng chúng mặc định xếp chồng trên dưới, có thể nhìn không đẹp. NocoBase hỗ trợ điều chỉnh vị trí và layout của Block bằng **kéo thả**.

Trong chế độ cấu hình, di chuột đến drag handle ở góc trên bên trái của Block (con trỏ sẽ đổi thành mũi tên chữ thập), giữ và kéo là được.

**Kéo form lọc lên trên bảng**: Giữ Block form lọc, di chuyển đến mép trên của Block bảng, khi xuất hiện vạch gợi ý màu xanh thì thả tay, form lọc sẽ xếp lên trên bảng.

![03-building-pages-2026-03-13-11-50-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-18.gif)

**Kéo Field lọc về cùng một hàng**: Bên trong form lọc, các Field mặc định cũng xếp dọc. Kéo "Mức độ ưu tiên" sang phải "Trạng thái", khi xuất hiện vạch gợi ý dọc thì thả tay, hai Field sẽ xếp ngang trên cùng một hàng, tiết kiệm không gian dọc.

![03-building-pages-2026-03-13-11-50-58](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-58.gif)

> Trong NocoBase hầu như tất cả các phần tử đều hỗ trợ kéo thả — nút Action, cột bảng, menu item, v.v., có thể tự khám phá!

## 3.8 Cấu hình trang phân loại ticket

Đừng quên ở mục 3.2 chúng ta đã tạo trang con "Phân loại ticket", bây giờ thêm nội dung cho nó. Quy trình cấu hình tương tự danh sách ticket — thêm Block bảng, đánh dấu Field, cấu hình Action — ở đây không lặp lại nữa, chỉ nói một điểm khác biệt quan trọng.

Còn nhớ Chương 2 chúng ta đã tạo bảng "Phân loại ticket" không? Nó là một **bảng cây** (hỗ trợ phân cấp cha-con). Để bảng hiển thị đúng cấu trúc dạng cây, cần bật một tùy chọn cấu hình:

1. Vào trang "Phân loại ticket", thêm một Block bảng, chọn bảng dữ liệu "Phân loại ticket".
2. Click **cài đặt Block** (biểu tượng ba gạch ngang) của Block bảng, tìm **"Bật bảng cây (Tree table)"**, bật nó.


Sau khi bật, bảng sẽ hiển thị quan hệ phân loại cha-con dưới dạng phân cấp thụt lề, không phải tất cả record xếp ngang.

3. Đánh dấu Field cần hiển thị (như tên, mô tả, v.v.), cấu hình Action hàng (thêm, edit, xóa).
4. **Đề xuất layout**: Đặt "Tên" ở cột đầu tiên, cột "Action" ở cột thứ hai. Bảng phân loại Field không nhiều, layout hai cột như vậy gọn gàng và thân thiện hơn.

![03-building-pages-2026-03-13-18-51-36](https://static-docs.nocobase.com/03-building-pages-2026-03-13-18-51-36.png)

## Tóm tắt

Chúc mừng bạn! Hệ thống ticket của chúng ta đã có một **giao diện quản lý** ra hồn:

- Một cấu trúc menu rõ ràng (Quản lý ticket → Danh sách ticket / Phân loại ticket)
- Một **Block bảng** hiển thị dữ liệu ticket
- **Form lọc** có thể nhanh chóng lọc theo trạng thái, mức độ ưu tiên, phân loại
- **Rule sắp xếp** giảm dần theo thời gian tạo
- Nút Action hàng, tiện cho xem và chỉnh sửa
- Một **bảng cây** hiển thị phân cấp phân loại

Có đơn giản hơn tưởng tượng không? Toàn bộ quá trình không viết một dòng code, hoàn toàn được hoàn thành qua kéo thả và cấu hình giao diện.

## Xem trước chương sau

Chỉ "thấy" thôi chưa đủ — Người dùng còn phải có thể **submit ticket mới**. Chương sau, chúng ta đến xây dựng Block form, cấu hình rule linkage Field, còn có thể bật record history để theo dõi mỗi lần thay đổi của ticket.

## Tài nguyên liên quan

- [Tổng quan Block](/interface-builder/blocks) — Mô tả tất cả các kiểu Block
- [Block bảng](/interface-builder/blocks/data-blocks/table) — Cấu hình chi tiết Block bảng
- [Block lọc](/interface-builder/blocks/filter-blocks/form) — Cấu hình form lọc
