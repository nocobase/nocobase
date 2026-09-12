# Chương 2: Mô hình hóa dữ liệu — Hai bảng giải quyết hệ thống ticket

Chương trước chúng ta đã cài đặt NocoBase và làm quen với giao diện. Bây giờ, chúng ta cần dựng khung xương cho hệ thống ticket — định nghĩa **data model**.

Chương này sẽ tạo hai [bảng dữ liệu](/data-sources/data-modeling/collection) ticket và phân loại, cấu hình [kiểu Field](/data-sources/data-modeling/collection-fields) (single line text, dropdown select, liên kết [many-to-one](/data-sources/data-modeling/collection-fields/associations/m2o), v.v.) và thiết lập quan hệ liên kết giữa các bảng. Data model là nền móng của hệ thống: nghĩ rõ trước về việc cần lưu những dữ liệu gì, giữa các dữ liệu có quan hệ gì, sau đó việc xây giao diện, cấu hình quyền mới có thể trôi chảy.


## 2.1 Bảng dữ liệu và Field là gì

Nếu bạn đã dùng Excel, hiểu bảng dữ liệu sẽ rất dễ:

| Khái niệm Excel | Khái niệm NocoBase | Mô tả |
|------------|--------------|------|
| Sheet | Bảng dữ liệu (Collection) | Container của một loại dữ liệu |
| Tiêu đề cột | Field | Thuộc tính mô tả dữ liệu |
| Mỗi dòng | Record | Một dữ liệu cụ thể |

![02-data-modeling-2026-03-11-08-32-41](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-32-41.png)

Ví dụ "bảng ticket" mà chúng ta sắp tạo, giống như một bảng Excel — mỗi cột là một Field (tiêu đề, trạng thái, ưu tiên…), mỗi dòng là một record ticket.

Tuy nhiên, NocoBase mạnh hơn Excel rất nhiều. Nó hỗ trợ nhiều **kiểu bảng dữ liệu**, các kiểu khác nhau có khả năng khác nhau:

| Kiểu bảng | Tình huống phù hợp | Ví dụ |
|--------|---------|------|
| **Bảng thường** | Hầu hết dữ liệu nghiệp vụ | Ticket, đơn hàng, Khách hàng |
| **Bảng cây** | Dữ liệu có quan hệ phân cấp | Danh mục phân loại, cơ cấu tổ chức phòng ban |
| Bảng lịch | Sự kiện ngày tháng | Cuộc họp, lịch trực |
| Bảng file | Quản lý đính kèm | Tài liệu, hình ảnh |

Hôm nay chúng ta sẽ dùng **bảng thường** và **bảng cây**, các kiểu khác sau này dùng đến sẽ học.

**Vào quản lý data source**: Click biểu tượng **"Quản lý data source"** ở góc dưới bên trái (biểu tượng cơ sở dữ liệu cạnh bánh răng), bạn sẽ thấy "[data source chính](/data-sources)" — tất cả bảng của chúng ta đều được tạo ở đây.

![02-data-modeling-2026-03-11-08-35-08](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-35-08.png)


## 2.2 Tạo bảng cốt lõi: Ticket

Đi thẳng vào chủ đề, tạo cốt lõi của hệ thống trước — bảng ticket.

### Tạo bảng

1. Trong trang quản lý data source, click **data source chính** để vào

![02-data-modeling-2026-03-11-08-36-06](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-36-06.png)

2. Click **"Tạo bảng dữ liệu"**, chọn **"Bảng thường"**

![02-data-modeling-2026-03-11-08-38-52](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-38-52.png)

3. Tên bảng dữ liệu: `tickets`, tiêu đề bảng dữ liệu: `Ticket`

![02-data-modeling-2026-03-11-08-40-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-40-34.png)

Khi tạo bảng, hệ thống sẽ tự động đánh dấu một bộ **Field hệ thống**, chúng sẽ tự động ghi lại metadata của mỗi record:

| Field | Mô tả |
|------|------|
| ID | Primary key, định danh duy nhất phân tán |
| Ngày tạo | Thời gian tạo của record |
| Người tạo | Ai đã tạo record này |
| Ngày sửa cuối | Thời gian cập nhật cuối cùng |
| Người sửa cuối | Người dùng cập nhật lần cuối |

Các Field hệ thống này giữ mặc định là được, không cần quản lý thủ công. Nếu một số tình huống không cần, cũng có thể bỏ tick.

### Thêm Field cơ bản

Bảng đã tạo xong, tiếp theo thêm Field. Click **"Cấu hình Field (Configure fields)"** của bảng ticket, bạn sẽ thấy các Field hệ thống mặc định vừa rồi đã có trong danh sách.

![02-data-modeling-2026-03-11-08-58-48](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-58-48.png)

![02-data-modeling-2026-03-11-08-59-47](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-59-47.png)

Click nút **"Thêm Field (Add field)"** ở góc trên bên phải, sẽ hiện ra danh sách dropdown các kiểu Field — chọn kiểu Field bạn muốn thêm.

![02-data-modeling-2026-03-11-09-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-00-22.png)

Chúng ta thêm các Field của riêng ticket trước, Field liên kết sẽ thêm sau.

**1. Tiêu đề (Single line text)**

Mỗi ticket cần một tiêu đề ngắn gọn để tóm tắt vấn đề. Click **"Thêm Field"** → chọn **["Single line text"](/data-sources/data-modeling/collection-fields/basic/input)**:

![02-data-modeling-2026-03-11-09-01-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-01-00.png)

- Tên Field: `title`, tiêu đề Field: `Tiêu đề`
- Click **"Cài đặt validation rule"**, thêm một rule **"Bắt buộc"**

![02-data-modeling-2026-03-11-09-02-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-02-40.png)

**2. Mô tả (Markdown(Vditor))**

Dùng để mô tả chi tiết vấn đề, hỗ trợ format, tiện cho dán hình, dán code. Trong "Thêm Field" → phân loại "Media" có ba lựa chọn:

| Kiểu Field | Đặc điểm |
|---------|------|
| Markdown | Markdown cơ bản, style đơn giản |
| Rich Text | Rich text, style đơn giản + tải file đính kèm |
| **Markdown(Vditor)** | Tính năng phong phú nhất, hỗ trợ ba chế độ WYSIWYG, render tức thì, edit source |

Chúng ta chọn **Markdown(Vditor)**.

![02-data-modeling-2026-03-11-09-09-58](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-09-58.png)

- Tên Field: `description`, tiêu đề Field: `Mô tả`

![02-data-modeling-2026-03-11-09-10-50](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-10-50.png)

**3. Trạng thái (Dropdown - single select)**

![02-data-modeling-2026-03-11-09-12-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-12-00.png)
Ticket từ lúc submit đến khi hoàn thành cần có một trạng thái để theo dõi tiến độ.

- Tên Field: `status`, tiêu đề Field: `Trạng thái`
- Thêm các option (mỗi option cần điền "giá trị option" và "label option", màu sắc tùy chọn):

| Giá trị option | Label option | Màu |
|--------|---------|------|
| pending | Chờ xử lý | Orange (Hoàng hôn) |
| in_progress | Đang xử lý | Blue (Bình minh xanh) |
| completed | Đã hoàn thành | Green (Xanh cực quang) |

![02-data-modeling-2026-03-11-09-17-44](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-17-44.png)

Điền option và lưu trước. Sau đó click lại **"Edit"** của Field này, lúc này có thể chọn **"Chờ xử lý"** trong "giá trị mặc định".

![02-data-modeling-2026-03-11-09-20-28](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-20-28.png)

![02-data-modeling-2026-03-11-09-22-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-22-34.png)

> Lần đầu tạo chưa có dữ liệu option, nên giá trị mặc định không chọn được — cần lưu xong mới quay lại cài đặt.

> Tại sao dùng dropdown single select? Vì trạng thái là vài giá trị cố định, [dropdown](/data-sources/data-modeling/collection-fields/choices/select) có thể ngăn Người dùng điền tùy ý, đảm bảo dữ liệu chuẩn.

**4. Mức độ ưu tiên (Dropdown - single select)**

Phân biệt mức độ khẩn cấp của ticket, tiện cho người xử lý sắp xếp theo ưu tiên.

- Tên Field: `priority`, tiêu đề Field: `Mức độ ưu tiên`
- Thêm các option:

| Giá trị option | Label option | Màu |
|--------|---------|------|
| low | Thấp | |
| medium | Trung bình | |
| high | Cao | Orange (Hoàng hôn) |
| urgent | Khẩn cấp | Red (Hoàng hôn nhạt) |

Đến đây, bảng ticket đã có 4 Field cơ bản. Nhưng — ticket chắc nên có "phân loại" chứ? Như "vấn đề mạng" "lỗi phần mềm"?

Nếu làm phân loại thành dropdown, dĩ nhiên cũng được. Nhưng bạn sẽ nhanh chóng nhận ra: phân loại có thể có phân loại con ("vấn đề phần cứng" còn có "màn hình" "bàn phím" "máy in"), dropdown thì không đủ.

Chúng ta cần **một bảng khác** chuyên để quản lý phân loại. Và bảng này, dùng **bảng cây** của NocoBase tạo là phù hợp nhất.


## 2.3 Tạo bảng cây phân loại: Cho phân loại có cấp bậc

### Bảng cây là gì

Bảng cây là một loại bảng dữ liệu đặc biệt, nó tự mang **quan hệ cha-con** — mỗi record có thể có một "node cha". Điều này phù hợp tự nhiên với dữ liệu có cấu trúc phân cấp:

```
Vấn đề phần cứng    ← Phân loại cấp 1
├── Màn hình         ← Phân loại cấp 2
├── Bàn phím chuột
└── Máy in
Lỗi phần mềm
├── Phần mềm văn phòng
└── Vấn đề hệ thống
Vấn đề mạng
Tài khoản quyền
```

Nếu dùng bảng thường, bạn cần tự thêm thủ công một Field "phân loại cha" để hiện thực quan hệ này. Còn **bảng cây sẽ tự động xử lý cho bạn**, lại còn hỗ trợ hiển thị dạng cây, thêm record con, v.v., đỡ lo nhiều.

### Tạo bảng

1. Quay lại quản lý data source, click **"Tạo bảng dữ liệu"**
2. Lần này chọn **"Bảng cây"** (không phải bảng thường!)
![02-data-modeling-2026-03-11-09-26-07](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-07.png)

3. Tên bảng dữ liệu: `categories`, tiêu đề bảng dữ liệu: `Phân loại ticket`

![02-data-modeling-2026-03-11-09-26-55](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-55.png)

> Lưu ý sau khi tạo, ngoài Field hệ thống, trong bảng còn tự động xuất hiện hai Field quan hệ **"Parent"** và **"Children"** — đây chính là khả năng đặc biệt của bảng cây. Qua Parent có thể truy cập node cha, qua Children có thể truy cập tất cả node con, không cần bạn thêm thủ công.

![02-data-modeling-2026-03-11-09-27-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-27-40.png)

### Thêm Field

Click **"Cấu hình Field"** vào danh sách Field, có thể thấy Field hệ thống và các Field Parent, Children được tự động sinh ra.
Click **"Thêm Field"** ở góc trên bên phải:

**Field một: Tên phân loại**

1. Chọn **"Single line text"**
2. Tên Field: `name`, tiêu đề Field: `Tên phân loại`
3. Click **"Cài đặt validation rule"**, thêm rule **"Bắt buộc"**

**Field hai: Màu**

1. Chọn **"Màu"**
2. Tên Field: `color`, tiêu đề Field: `Màu`

![02-data-modeling-2026-03-11-09-28-59](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-28-59.png)

Field màu cho phép mỗi phân loại có màu nhận dạng riêng, sau này khi hiển thị trên giao diện sẽ trực quan hơn.

![02-data-modeling-2026-03-11-09-29-23](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-29-23.png)

Đến đây, các Field cơ bản của hai bảng dữ liệu đã được cấu hình xong. Tiếp theo chúng ta liên kết chúng với nhau.


## 2.4 Quay lại bảng ticket: Thêm Field liên kết

> **Field quan hệ lần đầu tiếp xúc có thể hơi trừu tượng.** Nếu bạn cảm thấy không dễ hiểu, có thể nhảy đến [Chương 3: Xây dựng trang](./03-building-pages) trước, cảm nhận cách dữ liệu hiển thị qua thao tác trang thực tế, rồi quay lại bổ sung Field liên kết.

Ticket cần liên kết với phân loại, người submit và người xử lý. Loại Field này gọi là **Field quan hệ** — nó không lưu trực tiếp một đoạn text như "tiêu đề", mà lưu ID của một record nào đó trong bảng khác, qua ID này tìm record tương ứng.

Lấy một ticket cụ thể để xem — bên trái là các thuộc tính của ticket, trong đó "phân loại" và "người submit" lưu không phải text, mà là một ID. Hệ thống thông qua ID này, từ bảng bên phải tìm chính xác record tương ứng:


![02-data-modeling-2026-03-12-00-50-10](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-50-10.png)

Cái bạn thấy trên giao diện là tên ("vấn đề mạng" "Nguyễn Văn A"), đằng sau là liên kết qua ID. **Nhiều ticket có thể trỏ đến cùng một phân loại hoặc cùng một Người dùng** — quan hệ này gọi là [**many-to-one**](/data-sources/data-modeling/collection-fields/associations/m2o).

### Thêm Field quan hệ

Quay lại "Cấu hình Field" của bảng ticket → "Thêm Field", chọn **"Many-to-one"**.
![02-data-modeling-2026-03-12-00-52-39](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-52-39.png)

Khi tạo bạn sẽ thấy các tùy chọn cấu hình này:

| Tùy chọn cấu hình | Mô tả | Cách điền |
|--------|------|--------|
| Bảng dữ liệu nguồn | Bảng hiện tại (tự động điền) | Không cần đổi |
| **Bảng dữ liệu đích** | Liên kết đến bảng nào | Chọn bảng tương ứng |
| **Foreign key** | Tên cột liên kết lưu trong bảng hiện tại | Điền một tên có ý nghĩa |
| Field định danh bảng dữ liệu đích | Mặc định `id` | Giữ mặc định là được |
| ON DELETE | Cách xử lý khi record đích bị xóa | Giữ mặc định là được |

![02-data-modeling-2026-03-12-00-58-38](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-58-38.png)

> Foreign key mặc định sẽ tự động sinh một tên ngẫu nhiên (như `f_xxxxx`), khuyến nghị đổi thành tên có ý nghĩa, tiện cho bảo trì sau này. Đặt tên dùng chữ thường cộng dấu gạch dưới (như `category_id`), không dùng hỗn hợp chữ hoa thường.

Theo cách này lần lượt thêm ba Field:

**5. Phân loại → Bảng phân loại ticket**

- Tiêu đề Field: `Phân loại`
- Bảng dữ liệu đích: Chọn **"Phân loại ticket"** (nếu trong danh sách không có, gõ thẳng tên bảng sẽ tự động tạo)
- Foreign key: `category_id`

**6. Người submit → Bảng Người dùng**

Ghi lại ai đã submit ticket này. NocoBase tích hợp sẵn bảng Người dùng, liên kết trực tiếp là được.

- Tiêu đề Field: `Người submit`
- Bảng dữ liệu đích: Chọn **"Người dùng"**
- Foreign key: `submitter_id`
![02-data-modeling-2026-03-12-01-00-09](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-09.png)

**7. Người xử lý → Bảng Người dùng**

Ghi lại ai phụ trách xử lý ticket này.

- Tiêu đề Field: `Người xử lý`
- Bảng dữ liệu đích: Chọn **"Người dùng"**
- Foreign key: `assignee_id`

![02-data-modeling-2026-03-12-01-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-22.png)


## 2.5 Toàn cảnh data model

Xem lại data model hoàn chỉnh mà chúng ta đã xây dựng:

![02-data-modeling-2026-03-16-00-30-35](https://static-docs.nocobase.com/02-data-modeling-2026-03-16-00-30-35.png)

`}o--||` biểu thị quan hệ many-to-one: bên trái "nhiều", bên phải "một".


## Tóm tắt

Chương này chúng ta đã hoàn thành mô hình hóa dữ liệu — khung xương của toàn bộ hệ thống ticket:

1. **Bảng ticket** (tickets): 4 Field cơ bản + 3 Field liên kết, tạo bằng **bảng thường**
2. **Bảng phân loại ticket** (categories): 2 Field tùy chỉnh + Field Parent/Children tự động, tạo bằng **bảng cây**, hỗ trợ tự nhiên phân loại có cấp bậc

Chúng ta đã học được vài khái niệm quan trọng:

- **Bảng dữ liệu (Collection)** = container của một loại dữ liệu
- **Kiểu bảng dữ liệu** = các tình huống khác nhau chọn kiểu khác nhau (bảng thường, bảng cây…)
- **Field** = thuộc tính của dữ liệu, tạo qua "Cấu hình Field" → "Thêm Field"
- **Field hệ thống** = ID, ngày tạo, người tạo, v.v., được tự động đánh dấu khi tạo bảng
- **Field quan hệ (many-to-one)** = trỏ đến record của bảng khác, thiết lập liên kết giữa các bảng

> Có thể bạn để ý rằng, các ảnh chụp màn hình về sau đã có dữ liệu — những dữ liệu test này là chúng ta đã nhập trước để demo hiệu ứng, đừng vội. Trong NocoBase, thêm/xóa/sửa/tra dữ liệu đều được làm qua trang frontend. Chương 3 chúng ta sẽ xây bảng để hiển thị dữ liệu, Chương 4 sẽ xây form để nhập dữ liệu, từng bước hé lộ.


## Xem trước chương sau

Khung xương đã dựng xong, nhưng hiện tại mới chỉ là bảng trống. Chương sau, chúng ta sẽ xây dựng trang, để dữ liệu thực sự hiển thị ra được.

Hẹn gặp lại ở chương sau!

## Tài nguyên liên quan

- [Tổng quan data source](/data-sources) — Khái niệm cốt lõi của mô hình hóa dữ liệu NocoBase
- [Field bảng dữ liệu](/data-sources/data-modeling/collection-fields) — Mô tả chi tiết tất cả các kiểu Field
- [Liên kết many-to-one](/data-sources/data-modeling/collection-fields/associations/m2o) — Mô tả cấu hình quan hệ liên kết
