# Chương 8: Knowledge Base - Bảng cây

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 Chào mừng đến chương mới

Trong chương này, chúng ta sẽ tìm hiểu sâu cách xây dựng một Knowledge Base. Đây sẽ là một module tổng hợp, giúp chúng ta quản lý và tổ chức tài liệu, task và thông tin. Thông qua việc thiết kế và tạo bảng tài liệu có cấu trúc cây, chúng ta sẽ thực hiện quản lý hiệu quả trạng thái, đính kèm và task liên kết của tài liệu.

### 8.2 Khám phá thiết kế cơ sở dữ liệu

#### 8.2.1 Thiết kế cơ bản và tạo bảng tài liệu

Trước tiên, chúng ta bắt đầu từ một thiết kế cơ sở dữ liệu đơn giản, xây dựng một "bảng tài liệu" cho Knowledge Base để ghi lại tất cả thông tin tài liệu. Bảng tài liệu bao gồm các Field chính sau:

1. **Tiêu đề (Title)**: Đây là tên của tài liệu, sử dụng định dạng văn bản một dòng.
2. **Nội dung (Content)**: Nội dung chi tiết của tài liệu, sử dụng định dạng văn bản nhiều dòng hỗ trợ Markdown.
3. **Trạng thái tài liệu (Status)**: Dùng để đánh dấu trạng thái hiện tại của tài liệu, bao gồm bốn lựa chọn: bản nháp, đã đăng, đã lưu trữ và đã xóa.
4. **Đính kèm (Attachment)**: Có thể thêm các đính kèm như file và hình ảnh để làm phong phú nội dung tài liệu.
5. **Task liên kết (Related Task)**: Đây là Field quan hệ nhiều-tới-một, dùng để liên kết tài liệu với một Task nào đó, thuận tiện cho việc tham chiếu tài liệu trong quản lý Task.

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

Chúng ta cũng sẽ dần thêm các Field khác vào hệ thống quản lý tài liệu khi mở rộng chức năng.

#### 8.2.2 Xây dựng cấu trúc cây và quản lý mục lục

> Bảng cấu trúc cây (do plugin bảng cây cung cấp), cấu trúc cây, trong đó mỗi mục dữ liệu có thể có một hoặc nhiều mục con, và những mục con này có thể có mục con của riêng mình.

Để đảm bảo tổ chức và phân cấp của tài liệu, bảng tài liệu của chúng ta chọn [**bảng cấu trúc cây**](https://docs-cn.nocobase.com/handbook/collection-tree), thuận tiện cho việc thực hiện quản lý phân loại quan hệ cha-con. Khi tạo bảng cấu trúc cây, hệ thống tự động tạo các Field sau:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **ID bản ghi cha**: Dùng để ghi lại tài liệu cấp trên của tài liệu hiện tại.
- **Bản ghi cha**: Field nhiều-tới-một, giúp chúng ta thực hiện quan hệ liên kết cha-con.
- **Bản ghi con**: Field một-tới-nhiều, thuận tiện xem tất cả các tài liệu con dưới một tài liệu nào đó.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

Các Field này dùng để duy trì cấp mục lục của một bảng cấu trúc cây, vì vậy không nên sửa đổi.

Đồng thời chúng ta cần tạo quan hệ liên kết với bảng task [(nhiều-tới-một)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), kèm theo liên kết ngược, thuận tiện khi cần, có thể tạo danh sách tài liệu trong popup liên kết task.

### 8.3 Tạo trang quản lý tài liệu

#### 8.3.1 Tạo menu quản lý tài liệu mới

Trong menu chính của hệ thống, thêm một trang mới - "Quản lý tài liệu", và chọn icon phù hợp. Sau đó, tạo một Block bảng cho bảng tài liệu của chúng ta. Trong Block bảng thêm các thao tác cơ bản thêm, xóa, sửa, xem và nhập một số dữ liệu thử nghiệm để kiểm tra thiết kế bảng dữ liệu có hoạt động bình thường không.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### Bài tập

1. Hãy thử thêm một tài liệu cha tên "Tài liệu 1" trong trang quản lý tài liệu.
2. Thêm một tài liệu con cho "Tài liệu 1", đặt tên là "Chương 1".

#### 8.3.2 Chuyển đổi sang dạng bảng cây

Tôi biết bạn có thể thắc mắc, tại sao không phải là cấu trúc cây mục lục?

Mặc định, Block bảng sẽ hiển thị dưới dạng bảng thông thường, hãy bật thủ công:

1. Nhấn vào góc trên bên phải Block bảng > Bảng cây.

   Bạn sẽ thấy ngay khi đánh dấu chọn, dưới bảng cây xuất hiện thêm công tắc "Mở rộng tất cả".

   Đồng thời "Chương 1" mà chúng ta vừa tạo biến mất.
2. Nhấn vào tùy chọn kích hoạt "Mở rộng tất cả" dưới bảng cây.

   Lúc này, chúng ta sẽ thấy cấu trúc cha-con của tài liệu được hiển thị trực quan hơn, có thể dễ dàng xem và mở rộng tất cả các tài liệu phân cấp.

   Tiện thể thêm thao tác "Thêm bản ghi con".

Chuyển đổi bảng cây thành công!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 Cấu hình "Thêm bản ghi con"

Hãy phác thảo nội dung cơ bản cần thiết để thêm. Lưu ý lúc này nếu chúng ta đánh dấu chọn Field bản ghi cha, sẽ thấy mặc định ở trạng thái "Chỉ đọc (không thể chỉnh sửa)", vì mặc định chúng ta đang tạo dưới tài liệu hiện tại.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

Nếu dữ liệu task quá nhiều, bạn có thể cảm thấy việc phân công task liên kết đặc biệt phiền phức, chúng ta có thể thiết lập giá trị mặc định cho bộ lọc task, để nó bằng task liên kết của bản ghi cha.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

Giá trị mặc định có thể chưa có hiệu lực ngay, hãy đóng và nhấn lại xem, đã được tự động điền!

### 8.4 Cấu hình mẫu biểu mẫu và liên kết task

#### 8.4.1 Tạo [mẫu](https://docs-cn.nocobase.com/handbook/block-template) bảng và biểu mẫu

Để thuận tiện cho việc quản lý sau này, chúng ta sẽ [lưu](https://docs-cn.nocobase.com/handbook/block-template) bảng, biểu mẫu tạo và chỉnh sửa của tài liệu thành mẫu, để có thể tái sử dụng trên các trang khác.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 Hiển thị sao chép Block bảng tài liệu

Trong popup xem của bảng task, thêm một [tab](https://docs-cn.nocobase.com/manual/ui/pages) mới - "Tài liệu". Trong tab này, thêm Block biểu mẫu > Bản ghi khác > Bảng tài liệu > "Sao chép mẫu" > nhấn để đưa mẫu biểu mẫu tài liệu chúng ta đã tạo trước đó vào. (Nhớ chọn [**Sao chép mẫu**](https://docs-cn.nocobase.com/handbook/block-template).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

Cách này thuận tiện cho việc tạo tất cả các danh sách tài liệu.

#### 8.4.3 Cải tạo liên kết task

Vì chúng ta sao chép mẫu bảng từ bên ngoài, không liên kết với bảng task. Bạn sẽ thấy hiển thị toàn bộ dữ liệu tài liệu, chắc chắn không phải kết quả mong đợi.

Tình huống này khá phổ biến, nếu chúng ta không tạo Field quan hệ tương ứng, mà cần hiển thị dữ liệu liên kết, thì cần liên kết thủ công cả hai. (Nhớ rằng chúng ta sử dụng [**Sao chép mẫu**](https://docs-cn.nocobase.com/handbook/block-template), không chọn [Tham chiếu mẫu](https://docs-cn.nocobase.com/handbook/block-template), nếu không tất cả các thay đổi của chúng ta sẽ đồng bộ đến các Block bảng khác!)

- Liên kết hiển thị dữ liệu

Chúng ta nhấn vào góc trên bên phải Block bảng, ["Thiết lập phạm vi dữ liệu"](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope) thành:

【Task/ID】= 【Bản ghi popup hiện tại/ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

Thành công, hiện tại các tài liệu còn lại trong bảng đều sẽ là những tài liệu được liên kết với task của chúng ta.

- Thêm liên kết Block biểu mẫu.

Vào Block thêm:

Đối với Field bảng task liên kết, thiết lập [giá trị mặc định](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) > 【Bản ghi popup cấp trên】.

Popup cấp trên thuộc về thao tác "Xem" của dữ liệu task chúng ta đang ở, sẽ liên kết trực tiếp với dữ liệu task tương ứng.

Chúng ta thiết lập [chỉ đọc (chế độ đọc)](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern), nghĩa là trong popup hiện tại, chỉ có thể liên kết với task hiện tại.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

Xong! Bây giờ thêm mới, hiển thị đều sẽ là tài liệu liên kết với task hiện tại.

Bạn cẩn thận có thể bổ sung lọc liên kết trong "Chỉnh sửa", "Thêm subtask".

Để cấu trúc cây rõ ràng, dễ thấy hơn, cột thao tác gọn gàng đẹp mắt hơn một chút, chúng ta di chuyển tiêu đề lên cột đầu tiên.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 Lọc và tìm kiếm trong quản lý tài liệu

#### 8.5.1 Thêm [Block lọc](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)

Tiện thể chúng ta thêm chức năng lọc cho bảng tài liệu.

- Trong trang quản lý tài liệu thêm một [Block lọc](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form).
- Chọn biểu mẫu trong lọc, kéo lên trên cùng.
- Đánh dấu chọn các Field tiêu đề, trạng thái, bảng task làm điều kiện lọc.
- Thêm thao tác "Lọc" và "Đặt lại".

Biểu mẫu này chính là hộp tìm kiếm của chúng ta, thuận tiện cho việc tìm tài liệu liên quan nhanh sau khi nhập từ khóa.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [Kết nối Block dữ liệu](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

Lúc này bạn sẽ thấy nhấn không có hiệu quả, chúng ta cần bước cuối cùng: kết nối các Block có chức năng tìm kiếm với nhau.

- Chúng ta nhấn vào cấu hình ở góc trên bên phải Block > [Kết nối Block dữ liệu](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  Bên trong cung cấp các Block có thể được kết nối.

  Vì chúng ta tạo biểu mẫu bảng tài liệu, nó sẽ tìm kiếm tất cả các Block dữ liệu liên kết bảng tài liệu (trang này chỉ có một) và hiển thị làm tùy chọn.

  Cũng đừng lo phân biệt không rõ, khi chuột di chuyển lên trên, góc nhìn màn hình cũng sẽ tự động tập trung vào Block tương ứng.
  ```
- Nhấn để mở Block cần được kết nối, kiểm tra tìm kiếm.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

Bằng cách nhấn nút cấu hình ở góc trên bên phải của Block lọc, kết nối Block lọc với Block dữ liệu chính của bảng tài liệu. Như vậy, mỗi khi thiết lập điều kiện trong Block lọc, Block bảng sẽ tự động cập nhật kết quả theo điều kiện.

### 8.6 [Thiết lập Quyền](https://docs-cn.nocobase.com/handbook/acl) Knowledge Base

Để đảm bảo an toàn và quản lý chuẩn mực tài liệu, có thể phân [Quyền](https://docs-cn.nocobase.com/handbook/acl) cho thư viện tài liệu theo vai trò. Người dùng các vai trò khác nhau có thể xem, chỉnh sửa hoặc xóa tài liệu theo cấu hình Quyền.

Tuy nhiên tiếp theo chúng ta sẽ cải tạo bảng tài liệu, thêm chức năng tin tức, thông báo task, Quyền có thể mở rộng một chút.

### 8.7 Tóm tắt và bước tiếp theo

Trong chương này, chúng ta đã tạo một Knowledge Base cơ bản, bao gồm bảng tài liệu, [cấu trúc cây](https://docs-cn.nocobase.com/handbook/collection-tree) và hiển thị liên kết với task. Thông qua thêm Block lọc và tái sử dụng mẫu cho tài liệu, chúng ta đã thực hiện quản lý tài liệu hiệu quả.

Tiếp theo, chúng ta sẽ vào [chương tiếp theo](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1), học cách xây dựng một Dashboard cá nhân bao gồm [biểu đồ phân tích dữ liệu](https://docs-cn.nocobase.com/handbook/data-visualization), hiển thị thông tin quan trọng!

---

Tiếp tục khám phá, thỏa sức sáng tạo! Nếu gặp vấn đề, đừng quên bạn có thể tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) bất cứ lúc nào để thảo luận.
