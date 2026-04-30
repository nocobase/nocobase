# Chương 12: Đặt Phòng họp và Workflow

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Tin rằng đến giờ, bạn đã rất quen thuộc với **NocoBase** rồi.

Trong chương này, chúng ta cùng nhau hiện thực một kịch bản đặc biệt: module quản lý cuộc họp.

Module này bao gồm các chức năng đặt Phòng họp và thông báo. Trong quá trình này, chúng ta sẽ từng bước xây dựng một module quản lý cuộc họp từ con số không, bắt đầu từ cơ bản và dần dần hiện thực các chức năng phức tạp hơn. Hãy bắt đầu thiết kế cấu trúc bảng dữ liệu cơ bản của module này.

---

### 12.1 Thiết kế cấu trúc bảng dữ liệu

Cấu trúc bảng dữ liệu có thể hiểu là khung cơ bản của module quản lý cuộc họp. Ở đây chúng ta sẽ tập trung giới thiệu **bảng Phòng họp** và **bảng đặt chỗ**, đồng thời sẽ liên quan đến một số quan hệ mới như quan hệ [nhiều-nhiều](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m) với người dùng.

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 Bảng Phòng họp

Bảng Phòng họp dùng để lưu trữ thông tin cơ bản của tất cả Phòng họp, các Field bao gồm tên Phòng họp, vị trí, sức chứa, cấu hình, v.v.

##### Ví dụ cấu trúc bảng

```json
Phòng họp (Rooms)
    ID (khóa chính)
    Tên Phòng họp (name, văn bản một dòng)
    Vị trí cụ thể (location, văn bản nhiều dòng)
    Sức chứa (capacity, số nguyên)
    Cấu hình (equipment, văn bản nhiều dòng)
```

#### 12.1.2 Bảng đặt chỗ

Bảng đặt chỗ dùng để ghi lại tất cả thông tin đặt cuộc họp, các Field bao gồm Phòng họp, người dùng tham gia, khoảng thời gian, chủ đề và mô tả cuộc họp, v.v.

##### Ví dụ cấu trúc bảng

```json
Đặt chỗ (Bookings)
    ID (số nguyên, khóa chính duy nhất)
    Phòng họp (room, quan hệ nhiều-một, khóa ngoại room_id liên kết với ID Phòng họp)
    Người dùng (users, nhiều-nhiều, liên kết với ID người dùng)
    Thời gian bắt đầu (start_time, ngày giờ)
    Thời gian kết thúc (end_time, ngày giờ)
    Tiêu đề cuộc họp (title, văn bản một dòng)
    Mô tả cuộc họp (description, Markdown)
```

##### [Quan hệ nhiều-nhiều](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

Trong bảng đặt chỗ, có liên quan đến một quan hệ "nhiều-nhiều": một người dùng có thể tham gia nhiều cuộc họp, một cuộc họp cũng có thể có nhiều người dùng tham gia. Quan hệ nhiều-nhiều ở đây cần cấu hình tốt liên kết khóa ngoại. Để dễ quản lý, chúng ta có thể đặt tên bảng trung gian là **booking_users**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 Xây dựng module quản lý cuộc họp

Sau khi thiết kế xong cấu trúc bảng dữ liệu, chúng ta có thể tạo hai bảng theo thiết kế và xây dựng module "Quản lý cuộc họp". Sau đây là các bước tạo và cấu hình:

#### 12.2.1 Tạo [Block bảng](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)

Đầu tiên, thêm module "Quản lý cuộc họp" trên trang, lần lượt tạo **Block bảng Phòng họp** và **[Block bảng](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) bảng đặt chỗ**. Sau đó tạo thêm một [Block lịch](https://docs-cn.nocobase.com/handbook/calendar) bảng đặt chỗ, view mặc định của lịch đặt là "ngày".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### Thiết lập liên kết Block bảng Phòng họp

Liên kết Block bảng Phòng họp với hai Block còn lại, như vậy có thể tự động lọc ra các bản ghi đặt chỗ tương ứng với Phòng họp đó. Tiếp theo, hãy thử các chức năng lọc, thêm, xóa, sửa, đọc để kiểm tra tương tác cơ bản của module.

> **Kết nối Block NocoBase (khuyến nghị!!)**:
>
> Ngoài Block lọc trước đó, Block bảng của chúng ta cũng có thể kết nối với các Block khác để hiện thực hiệu ứng nhấp lọc.
>
> Như hình bên dưới, trong cấu hình bảng Phòng họp, chúng ta kết nối hai Block khác của bảng đặt chỗ (Block bảng đặt chỗ, Block lịch đặt chỗ)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> Sau khi kết nối thành công, nhấp vào bảng Phòng họp, bạn sẽ thấy hai bảng còn lại cũng được lọc theo! Nhấp lại vào mục đã chọn để hủy chọn.
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 Phát hiện tình trạng sử dụng Phòng họp

Sau khi cấu hình trang xong, chúng ta cần thêm một chức năng quan trọng: phát hiện tình trạng sử dụng Phòng họp. Chức năng này sẽ kiểm tra xem Phòng họp mục tiêu có đang được sử dụng trong khoảng thời gian chỉ định hay không khi tạo hoặc cập nhật cuộc họp, để tránh xung đột đặt chỗ.

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 Thiết lập [Workflow](https://docs-cn.nocobase.com/handbook/workflow) "sự kiện trước Action"

Để phát hiện trong quá trình đặt chỗ, chúng ta sử dụng một loại Workflow đặc biệt — ["sự kiện trước Action"](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor):

- [**Sự kiện trước Action**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) (Plugin thương mại): Thực hiện một loạt các thao tác trước khi thêm, xóa, sửa dữ liệu, có thể tạm dừng và chặn trước bất cứ lúc nào, cách này rất gần với quy trình phát triển code hàng ngày của chúng ta!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 Cấu hình Node

Trong Workflow phát hiện tình trạng sử dụng, chúng ta cần các loại Node sau:

- [**Node tính toán**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) (logic chuyển đổi dữ liệu, dùng để xử lý các trường hợp sửa, thêm)
- [**Thao tác SQL**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) (thực thi truy vấn SQL)
- [**Phân tích JSON**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) (Plugin thương mại, dùng để phân tích dữ liệu JSON)
- [**Tin nhắn phản hồi**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message) (Plugin thương mại, dùng để trả về thông tin gợi ý)

---

#### 12.3.3 Liên kết bảng đặt chỗ và cấu hình trigger

Bây giờ, chúng ta liên kết bảng đặt chỗ, chế độ trigger chọn "chế độ toàn cục", và chọn loại Action là tạo bản ghi và cập nhật bản ghi.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 Cấu hình [Node tính toán](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)

#### 12.4.1 Tạo Node tính toán "Chuyển ID trống thành -1"

Đầu tiên, chúng ta tạo một Node tính toán để chuyển ID trống thành -1. Node tính toán có thể chuyển đổi biến theo cách chúng ta cần, cung cấp ba dạng thao tác sau:

- **Math.js** (tham khảo [Math.js](https://mathjs.org/))
- **Formula.js** (tham khảo [Formula.js](https://formulajs.info/functions/))
- **Template chuỗi** (dùng để nối dữ liệu)

Ở đây, chúng ta sử dụng **Formula.js** để đánh giá giá trị:

```html
IF(NUMBERVALUE(【Biến trigger/Tham số/Đối tượng giá trị submit/ID】, '', '.'),【Biến trigger/Tham số/Đối tượng giá trị submit/ID】, -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. Tạo [Node thao tác SQL](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)

Tiếp theo, tạo Node thao tác SQL, thực thi câu lệnh truy vấn để kiểm tra Phòng họp khả dụng:

#### 12.5.1 Câu lệnh SQL truy vấn Phòng họp khả dụng

```sql
-- Truy vấn tất cả Phòng họp có thể đặt
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- Loại trừ đặt chỗ hiện tại
  AND b.start_time < '{{$context.params.values.end_time}}' -- Thời gian bắt đầu trước thời gian kết thúc truy vấn
  AND b.end_time > '{{$context.params.values.start_time}}' -- Thời gian kết thúc sau thời gian bắt đầu truy vấn
WHERE b.id IS NULL;
```

> Lưu ý SQL: Biến sẽ được thay thế trực tiếp vào câu lệnh sql, hãy kiểm tra biến cẩn thận để tránh xảy ra SQL injection. Thêm dấu nháy đơn ở vị trí phù hợp.

Trong đó các biến lần lượt là:

{{$jobsMapByNodeKey.3a0lsms6tgg}} đại diện cho kết quả của Node trước, 【Dữ liệu Node/Chuyển ID trống thành -1】

{{$context.params.values.end_time}} đại diện cho 【Biến trigger/Tham số/Đối tượng giá trị submit/Thời gian kết thúc】

{{$context.params.values.start_time}} đại diện cho 【Biến trigger/Tham số/Đối tượng giá trị submit/Thời gian bắt đầu】

#### 12.5.2 Kiểm tra SQL

Mục đích của chúng ta là truy vấn ra tất cả Phòng họp không xung đột với khoảng thời gian mục tiêu.

Trong quá trình này, có thể nhấp vào "Test run" bên dưới, thay đổi giá trị biến, debug SQL.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [Phân tích JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 Cấu hình [Node phân tích JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

Thông qua kiểm tra ở bước trước, chúng ta có thể quan sát kết quả ở dạng sau, lúc này cần kích hoạt [**Plugin JSON query node**](https://docs-cn.nocobase.com/handbook/workflow-json-query):

```json
[
  {
    "id": 2,
    "name": "Phòng họp 2"
  },
  {
    "id": 1,
    "name": "Phòng họp 1"
  }
]
```

> Cách phân tích JSON được chia thành ba loại:
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

Ở đây chúng ta chọn một loại bất kỳ, ví dụ định dạng [JMESPath](https://jmespath.org/), chúng ta cần lọc danh sách tên các Phòng họp khả dụng, vì vậy biểu thức điền:

```sql
[].name
```

Cấu hình ánh xạ thuộc tính áp dụng cho danh sách đối tượng, hiện tại không cần thiết, có thể không điền.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [Đánh giá điều kiện](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

Cấu hình Node đánh giá điều kiện, đánh giá xem Phòng họp hiện tại có nằm trong danh sách Phòng họp khả dụng hay không. Dựa vào kết quả đánh giá là **đúng** hoặc **sai**, lần lượt cấu hình tin nhắn phản hồi:

Điều kiện đánh giá, chọn phép tính "cơ bản":

```json
【Dữ liệu Node / Phân tích danh sách Phòng họp】 chứa 【Biến trigger / Tham số / Đối tượng giá trị submit / Phòng họp / Tên】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 Đúng: Cấu hình tin nhắn thành công

Lúc này cần kích hoạt [**Plugin Workflow: Response message**](https://docs-cn.nocobase.com/handbook/workflow-response-message):

```json
【Biến trigger/Tham số/Đối tượng giá trị submit/Phòng họp/Tên】  khả dụng, đặt chỗ thành công!
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 Sai: Cấu hình tin nhắn thất bại

```json
Phòng họp mục tiêu không khả dụng, danh sách Phòng họp khả dụng: 【Dữ liệu Node/Phân tích danh sách Phòng họp】
```

Lưu ý, khi đánh giá thất bại, chúng ta nhất định phải cấu hình Node "Kết thúc luồng", kết thúc luồng thủ công.

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 Kiểm tra chức năng và debug chi tiết

Bây giờ chúng ta đi vào giai đoạn kiểm tra cuối cùng của hệ thống quản lý cuộc họp. Mục đích của giai đoạn này là xác nhận xem Workflow của chúng ta có thể phát hiện chính xác và ngăn chặn việc đặt Phòng họp xung đột hay không.

#### 12.8.1 Thêm đặt chỗ với khoảng thời gian xung đột

Đầu tiên, chúng ta thử thêm một cuộc họp xung đột với thời gian đặt chỗ đã có để xem hệ thống có chặn thao tác và hiển thị thông báo lỗi hay không.

- Đặt khoảng thời gian đặt chỗ xung đột

Chúng ta thử thêm một đặt chỗ mới ở "Phòng họp 1" với thời gian là

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

Khoảng thời gian này bao trùm cả ngày, chúng ta cố tình tạo xung đột với thời gian đặt chỗ hiện có.

- Xác nhận đặt cuộc họp đã tồn tại

Trong "Phòng họp 1", đã có hai khoảng thời gian đặt chỗ:

1. `2024-11-14 09:00:00 đến 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 đến 2024-11-14 16:30:00`

Hai khoảng thời gian này đều có chồng chéo với khoảng thời gian chúng ta định thêm

(`2024-11-14 00:00:00 - 2024-11-14 23:00:00`).

Vì vậy, theo logic đánh giá, hệ thống nên phát hiện xung đột thời gian và chặn lần đặt chỗ này.

- Submit đặt chỗ và xác minh phản hồi

Chúng ta nhấp vào nút **Submit**, hệ thống sẽ thực thi quy trình phát hiện trong Workflow:

**Phản hồi thành công:** Sau khi submit, hệ thống hiển thị thông báo xung đột, cho thấy logic phát hiện hoạt động bình thường. Trang phản hồi thành công thông báo cho chúng ta rằng không thể hoàn thành đặt chỗ này.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 Thêm đặt chỗ với khoảng thời gian không xung đột

Tiếp theo kiểm tra đặt chỗ không xung đột~

Đảm bảo khi thời gian cuộc họp không chồng chéo, chúng ta có thể đặt Phòng họp thành công!

- Đặt khoảng thời gian đặt chỗ không xung đột

Chúng ta chọn một khoảng thời gian không xung đột, ví dụ

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`.

Khoảng thời gian này không chồng chéo với thời gian đặt chỗ hiện có, vì vậy phù hợp với yêu cầu đặt Phòng họp.

- Submit đặt chỗ không xung đột

Nhấp vào nút **Submit**, hệ thống lại thực thi logic phát hiện của Workflow:

**Hãy cùng xác minh:** Submit thành công! Hệ thống hiển thị thông báo "Đặt chỗ thành công". Cho thấy chức năng đặt chỗ trong trường hợp không xung đột cũng hoạt động bình thường.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 Sửa thời gian đặt chỗ đã có

Ngoài việc thêm đặt chỗ mới, các bạn còn có thể kiểm tra việc sửa thời gian đặt chỗ đã tồn tại.

Ví dụ, đổi thời gian cuộc họp đã có sang một khoảng thời gian không xung đột khác, sau đó nhấp submit lại.

Bước này dành cho các bạn nhé.

---

### 12.9 Tối ưu Dashboard và bảng lịch trình cá nhân

Sau khi tất cả các bài kiểm tra chức năng đã thông qua, chúng ta có thể tiếp tục làm đẹp và tối ưu Dashboard để nâng cao trải nghiệm người dùng.

#### 12.9.1 Điều chỉnh bố cục Dashboard

Trong Dashboard, chúng ta có thể sắp xếp lại nội dung trang theo thói quen thao tác của người dùng, để người dùng tiện xem tình hình dữ liệu hệ thống hơn.

Để nâng cao trải nghiệm người dùng hơn nữa, có thể tạo một bảng lịch trình cuộc họp riêng cho mỗi người dùng. Thao tác cụ thể như sau:

1. **Tạo Block "Lịch trình cá nhân" mới**: Trong Dashboard, thêm một Block lịch hoặc Block danh sách mới, hiển thị lịch trình cuộc họp cá nhân của người dùng.
2. **Đặt giá trị mặc định cho thành viên**: Đặt giá trị mặc định của thành viên là người dùng hiện tại, để khi người dùng mở Dashboard sẽ mặc định hiển thị các cuộc họp liên quan đến mình.

Tiếp tục tối ưu trải nghiệm sử dụng module quản lý cuộc họp của người dùng.

Sau khi hoàn thành các cấu hình này, chức năng và bố cục của Dashboard trực quan và dễ sử dụng hơn, chức năng cũng phong phú hơn nhiều!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

Thông qua các bước trên, chúng ta đã thành công hiện thực và tối ưu các chức năng chính của module quản lý cuộc họp! Hy vọng trong quá trình thao tác, bạn có thể từng bước nắm vững các chức năng cốt lõi của NocoBase và trải nghiệm niềm vui xây dựng hệ thống mô-đun hóa.

---

Tiếp tục khám phá và phát huy hết khả năng sáng tạo của bạn! Nếu gặp vấn đề, đừng quên rằng bạn có thể tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận bất cứ lúc nào.
