# Chương 3: Quản lý dữ liệu Task

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Bây giờ chúng ta đã phân tích xong nhu cầu của hệ thống quản lý Task, đến lúc bắt tay vào thao tác thực tế! Nhớ lại, hệ thống quản lý Task của chúng ta cần có thể **[Tạo mới](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [Edit](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit), [Xóa](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** Task, còn cần **query danh sách Task**, và những tính năng này đều có thể thực hiện qua trang, Block và Action của NocoBase.

> Truy cập tài liệu chính thức, xem định nghĩa chi tiết của [menu](https://docs-cn.nocobase.com/handbook/ui/menus) và [trang](https://docs-cn.nocobase.com/handbook/ui/pages).

### 3.1 Bắt đầu thế nào?

Bạn có thể nhớ rằng, chúng ta trước đây đã giới thiệu cách tạo trang mới và hiển thị danh sách Người dùng. Những trang này như canvas, có thể chứa các kiểu Block khác nhau, bạn có thể tự do sắp xếp thứ tự và kích thước của chúng. Để tiện ôn lại các bước thao tác:

1. [**Tạo trang mới**](https://docs-cn.nocobase.com/handbook/ui/pages): Click vài lần đơn giản là có thể hoàn thành tạo trang.
   ![Tạo trang mới](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **Tạo [Block bảng](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) mới**: Sau khi chọn Block bảng, bạn có thể hiển thị các dữ liệu khác nhau.
   ![Tạo Block bảng mới](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

Trông rất đơn giản, đúng không?
Tuy nhiên, khi bạn mở "Danh sách dữ liệu", bạn sẽ thấy trong các tùy chọn mặc định chỉ có hai bảng "Người dùng" và "Vai trò".
Vậy bảng Task ở đâu? Đừng lo, câu trả lời nằm trong tính năng [**data source**](https://docs-cn.nocobase.com/handbook/data-source-manager) của NocoBase.

> **Giới thiệu data source**: Data source có thể là cơ sở dữ liệu, API hoặc các kiểu lưu trữ dữ liệu khác, hỗ trợ kết nối nhiều cơ sở dữ liệu quan hệ, như MySQL, PostgreSQL, SQLite, MariaDB.
> Trong NocoBase, đã cung cấp **Plugin quản lý data source**, để quản lý data source và bảng dữ liệu. Tuy nhiên Plugin quản lý data source chỉ cung cấp giao diện quản lý data source, không cung cấp khả năng kết nối data source, nó cần kết hợp với các **Plugin data source** khác để dùng.

### 3.2 Data source: Kho bảng dữ liệu của bạn

![](https://static-docs.nocobase.com/20241009144356.png)

Trong NocoBase, tất cả bảng dữ liệu đều được lưu trong [**data source**](https://docs-cn.nocobase.com/handbook/data-source-manager), data source giống như những cuốn sách, bên trong viết đầy thiết kế và cấu trúc của mỗi bảng dữ liệu. Tiếp theo, hãy cùng viết một trang mới của chúng ta: **Bảng Task**.

> [!NOTE] Note
> Nếu bạn muốn xem thêm khả năng của data source và bảng dữ liệu, tham khảo [Quản lý data source](https://docs-cn.nocobase.com/handbook/data-source-manager) và [Tổng quan bảng dữ liệu](https://docs-cn.nocobase.com/handbook/data-modeling/collection)

- **Vào cài đặt data source**:
  - Click **Cài đặt** > **Data source** > **Cấu hình data source chính** ở góc trên bên phải.
  - Bạn sẽ thấy tất cả bảng đã có trong data source chính của NocoBase, mặc định thường chỉ có hai bảng "Người dùng" và "Vai trò".
    ![Cấu hình data source](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

Bây giờ, đến lúc tạo bảng thứ ba, cũng chính là **Bảng Task** của chúng ta. Đây sẽ là lần đầu chúng ta tạo bảng dữ liệu trong NocoBase, thật là khoảnh khắc thú vị! Chúng ta chỉ cần theo thiết kế trước đó, tạo một bảng Task đơn giản, bao gồm các Field sau:

```
Bảng Task (Tasks):
        Tên Task (task_name) Single line text
        Mô tả Task (task_description) Multi line text
```

### 3.3 Tạo bảng Task

1. **Tạo bảng Task mới**:

   - Click "Tạo bảng dữ liệu" > Chọn **Bảng dữ liệu thường** > Điền **Tên bảng dữ liệu** (như "Bảng Task") và **Mã bảng dữ liệu** (như "tasks").
   - **Mã bảng dữ liệu** là ID duy nhất của bảng, khuyến nghị dùng tiếng Anh, số hoặc dấu gạch dưới để đặt tên, tiện cho tìm kiếm và bảo trì sau này.
   - Submit để tạo.
     ![Tạo bảng Task](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **Mô tả Field mặc định**:
   NocoBase sẽ sinh các Field preset cho mỗi bảng dữ liệu thường:

   - **ID**: Định danh duy nhất của mỗi record.
   - **Ngày tạo**: Tự động ghi thời gian tạo của Task.
   - **Người tạo**: Tự động ghi người tạo Task.
   - **Ngày sửa cuối** và **Người sửa cuối**: Ghi thời gian và Người dùng sửa Task mỗi lần.

Các Field mặc định này chính là những gì chúng ta cần, tiết kiệm rất nhiều phiền phức thêm thủ công.

3. **Tạo Field tùy chỉnh**:
   - **Tên Task**: Click "Thêm Field" > Chọn **Single line text** > Cài tên Field là "Tên Task", mã Field là "task_name".
     ![Tạo Field tên Task](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **Mô tả Task**: Lại tạo một Field **Multi line text**, mã Field là "task_description".
     ![Tạo Field mô tả Task](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

Chúc mừng bạn! Bây giờ **Bảng Task** của chúng ta đã được định nghĩa, bạn đã thành công tạo cấu trúc dữ liệu Task của riêng mình. Tuyệt vời!

### 3.4 Tạo trang quản lý Task

Bây giờ chúng ta đã có bảng Task, tiếp theo là dùng một Block phù hợp, đưa nó lên container trang. Chúng ta sẽ tạo một **Trang quản lý Task** mới, và thêm một Block bảng hiển thị dữ liệu Task vào trang.

1. **Tạo trang quản lý Task mới**:

   - Click "Tạo trang mới", đặt tên là "Quản lý Task".
   - Tạo một Block Task, hiển thị dữ liệu bảng Task.
     ![Tạo Block Task](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **Thêm dữ liệu**:

   - "Ơ, sao không có dữ liệu?", đừng lo, chúng ta bây giờ sẽ thêm vào!
   - Click "Cấu hình Action" ở góc trên bên phải trang, click Action **"Thêm"**, bạn sẽ thấy bật ra một container popup trống.
     Action [Thêm](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [Edit](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) mặc định sẽ bind popup.
   - Tiếp theo Block mới (form) lên sàn: Tạo Block popup > Chọn **Bảng dữ liệu hiện tại**.
   - Hiển thị Field tên Task và mô tả, cấu hình Action submit, submit form là xong!
     ![Cấu hình Action](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **Nhập dữ liệu**:

   - Nhập một dữ liệu test, click submit, thành công! Dữ liệu Task đã được thêm vào.
     ![Submit dữ liệu](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

Khoảnh khắc thú vị! Bạn đã thành công nhập dữ liệu Task đầu tiên, có rất đơn giản không?

### 3.5 Query và lọc Task — Định vị Task nhanh chóng

Khi Task ngày càng nhiều, làm sao nhanh chóng tìm Task bạn muốn? Lúc này, [**Action lọc**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter) sẽ phát huy tác dụng. Trong NocoBase, bạn có thể dễ dàng tìm Task cụ thể qua kết hợp điều kiện của Action lọc.

#### 3.5.1 Bật Action lọc

Trước tiên, chúng ta cần bật Action lọc:

- **Di chuột đến "Cấu hình Action"**, sau đó click **công tắc lọc**, bật lọc.
  ![Bật lọc](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 Dùng điều kiện lọc

Sau khi bật Action lọc, bạn sẽ thấy nút lọc xuất hiện trên trang. Bây giờ có thể qua **Tên Task** để test xem Action lọc có hoạt động không:

- Trong panel Action lọc chọn Tên Task, nhập nội dung bạn muốn query.
- Click "Submit", xem danh sách Task có hiển thị đúng kết quả đã lọc không.
  ![Bật lọc](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 Tắt Action lọc

Nếu bạn không cần Action lọc nữa, thông thường đối với Action kiểu công tắc, chỉ cần nhấn nhẹ một cái là có thể hủy:

- **Reset điều kiện lọc**: Đảm bảo không có điều kiện lọc nào đang có hiệu lực, click nút "Reset".
- Lại click **công tắc "Lọc"**, lọc sẽ ẩn khỏi trang.
  ![Tắt lọc](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

Đơn giản như vậy! Action lọc sẽ mang đến sự tiện lợi rất lớn cho việc quản lý lượng lớn Task của bạn, khi chúng ta từng bước làm quen với hệ thống, sẽ có nhiều cách query đa dạng và linh hoạt khác được tiết lộ. (Bạn có thể tra [Block lọc form](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) và [Block lọc collapse panel](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse))

Tiếp tục giữ niềm đam mê này, hãy cùng tiến lên!

### 3.6 Edit và xóa Task

Ngoài thêm, query Task, chúng ta còn cần có thể [**Edit**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) và [**Xóa**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) Task. Bạn đã quen thuộc với quy trình thêm Block, Field, Action, lúc này sẽ rất đơn giản:

1. **Edit Task**:

   - Trong cấu hình của danh sách Task thêm Action **Edit**, click edit > Thêm Block form (edit) > Chọn Field cần edit.
2. **Xóa Task**:

   - Tương tự, trong cấu hình của cột Action bật công tắc Action **Xóa**, sau khi nút xóa xuất hiện, click xóa > Xác nhận, Task sẽ bị xóa khỏi danh sách.
     ![Edit Task](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

Đến đây, các Action **thêm/xóa/sửa/tra** của danh sách Task đã được thực hiện đầy đủ.

Quá tuyệt! Bạn đã thành công hoàn thành bước này!

### Task thử thách

Sau khi bạn ngày càng thành thạo các thao tác của NocoBase, hãy thử một thử thách nhỏ: Chúng ta cần đánh dấu trạng thái Task, và để nó hỗ trợ upload đính kèm, làm thế nào nhỉ?

Gợi ý:

- Thêm vào bảng Task của chúng ta:
  1. Field "**Trạng thái (status)**", làm dropdown single select, bao gồm các tùy chọn sau: **Chưa bắt đầu, Đang tiến hành, Chờ duyệt, Đã hoàn thành, Đã hủy, Đã lưu trữ**.
  2. Field "**Đính kèm (attachment)**".
- Trong các Block bảng Task, form "Thêm" và "Edit", hiển thị Field "Trạng thái", "Đính kèm".

Bạn đã có ý tưởng chưa? Đừng vội, [Chương tiếp theo (Chương 4: Plugin Task và bình luận — Như hổ thêm cánh, làm chủ thuận lợi)](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use) sẽ tiết lộ câu trả lời, hãy cùng chờ xem!

---

Tiếp tục khám phá, thỏa sức phát huy sáng tạo của bạn! Nếu gặp vấn đề, đừng quên có thể tra [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận bất cứ lúc nào.
