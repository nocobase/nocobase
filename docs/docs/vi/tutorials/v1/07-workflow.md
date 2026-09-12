# Chương 7: Workflow

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Chúc mừng bạn đã đi đến chương cuối cùng này! Trong chương này, chúng ta sẽ giới thiệu và khám phá đơn giản chức năng Workflow mạnh mẽ của **NocoBase**. Thông qua chức năng này, bạn có thể tự động hóa các thao tác cho các task trong hệ thống, tiết kiệm thời gian và nâng cao hiệu suất.

### Đáp án thử thách chương trước

Nhưng trước khi bắt đầu, hãy ôn lại thử thách chương trước! Chúng ta đã thành công cấu hình **Quyền bình luận** cho vai trò "Đối tác" như sau:

1. **Thêm Quyền**: Cho phép Người dùng đăng bình luận.
2. **Quyền xem**: Cho phép Người dùng xem tất cả các bình luận.
3. **Quyền chỉnh sửa**: Người dùng chỉ có thể chỉnh sửa bình luận do mình đăng.
4. **Quyền xóa**: Người dùng chỉ có thể xóa bình luận của mình.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

Sau khi cấu hình như vậy, Tom không chỉ có thể tự do đăng bình luận mà còn có thể xem bình luận của các thành viên khác, đồng thời đảm bảo chỉ chính mình mới có thể chỉnh sửa và xóa phát biểu của mình.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

Bây giờ, hãy thực hiện một chức năng tự động hóa: **mỗi khi người chịu trách nhiệm task được thay đổi, hệ thống sẽ tự động đăng một thông báo cho người chịu trách nhiệm tương ứng, nhắc người chịu trách nhiệm mới tiếp nhận task**.

> **Workflow:** Plugin Workflow là một công cụ tự động hóa mạnh mẽ, thường thấy trong lĩnh vực quản lý quy trình nghiệp vụ (BPM).
>
> Nó được dùng để thiết kế và sắp xếp các quy trình nghiệp vụ dựa trên mô hình dữ liệu, nhờ vào việc cấu hình điều kiện kích hoạt và các node quy trình, thực hiện luồng quy trình tự động. Loại plugin này đặc biệt phù hợp xử lý tự động các task lặp đi lặp lại, dựa trên dữ liệu.

### 7.1 Tạo workflow

#### 7.1.1 Tạo workflow trên trang quản trị

Trước tiên, chuyển sang **vai trò Root**, đây là vai trò quản trị viên hệ thống, có tất cả các Quyền. Tiếp theo, vào [**module Workflow**](https://docs-cn.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

Nhấn nút **"Thêm"** ở góc trên bên phải, tạo một workflow mới, điền thông tin cơ bản:

- **Tên**: Tạo thông báo hệ thống khi thay đổi người chịu trách nhiệm.
- **Cách kích hoạt**: Chọn "Sự kiện bảng dữ liệu".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 Giải thích lựa chọn cách kích hoạt:

1. [**Sự kiện bảng dữ liệu**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection): Kích hoạt khi thông tin trong bảng dữ liệu thay đổi (thêm, sửa, xóa). Cách này rất phù hợp để theo dõi sự thay đổi của Field task, ví dụ thay đổi người chịu trách nhiệm.
2. [**Task định kỳ**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule): Tự động kích hoạt vào thời điểm cụ thể, phù hợp hơn cho các thao tác tự động hóa liên quan đến lịch trình.
3. [**Sự kiện sau thao tác**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action): Liên kết với nút thao tác, kích hoạt khi Người dùng thực hiện một thao tác nào đó. Ví dụ, kích hoạt task sau khi nhấn nút lưu.

Trong quá trình sử dụng sau này, chúng ta sẽ phát hiện các cách kích hoạt khác, ví dụ "Sự kiện trước thao tác", "Sự kiện thao tác tùy chỉnh", "Phê duyệt"... đều có thể được mở khóa thông qua các plugin tương ứng.

Trong tình huống này, chúng ta sử dụng [**Sự kiện bảng dữ liệu**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) để theo dõi sự thay đổi của "Người chịu trách nhiệm" trong "Bảng task". Sau khi gửi workflow, nhấn **Cấu hình**, vào trang thiết lập workflow.

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 Cấu hình node workflow

#### 7.2.1 Cấu hình điều kiện kích hoạt

Không nói nhiều, bắt đầu xây dựng quy trình thông báo tự động!

Trước tiên, cấu hình node đầu tiên, thiết lập điều kiện để workflow tự động khởi động trong tình huống cụ thể.

- **Bảng dữ liệu**: Chọn "Bảng task". (Bảng dữ liệu nào sẽ kích hoạt workflow này, dữ liệu tương ứng cũng sẽ được đọc đồng bộ vào workflow. Tất nhiên chúng ta muốn workflow này bắt đầu khi "Bảng task" thay đổi.)
- **Thời điểm kích hoạt**: Chọn "Sau khi thêm hoặc cập nhật dữ liệu".
- **Field kích hoạt**: Chọn "Người chịu trách nhiệm".
- **Điều kiện kích hoạt**: Chọn "ID người chịu trách nhiệm tồn tại", đảm bảo chỉ khi task được phân người chịu trách nhiệm mới gửi thông báo hệ thống.
- **Tải trước dữ liệu**: Chọn "Người chịu trách nhiệm", để có thể sử dụng thông tin của họ trong các quy trình tiếp theo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 Mở kênh "Tin nhắn nội bộ"

Bước tiếp theo, chúng ta sẽ tạo một node gửi thông báo.

Trước đó, chúng ta cần tạo [kênh "Tin nhắn nội bộ"](https://docs-cn.nocobase.com/handbook/notification-in-app-message) dùng để gửi thông báo.

- Quay lại giao diện quản lý plugin, chọn "Quản lý thông báo", tạo thông báo task mới (task_message)
- Sau khi tạo kênh xong, quay lại workflow, tạo node "Thông báo" mới
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- Cấu hình node
  **Kênh:** Chọn "Thông báo task"
  **Người nhận:** Chọn "Biến trigger/Dữ liệu trigger/Người chịu trách nhiệm/ID", như vậy có thể xác định được người chịu trách nhiệm sau khi thay đổi.
  **Tiêu đề tin nhắn:** Chúng ta điền "Nhắc nhở thay đổi người chịu trách nhiệm"
  **Nội dung tin nhắn:** Điền "Bạn đã được chỉ định làm người chịu trách nhiệm mới"

Sau khi hoàn tất, nhấn công tắc ở góc trên bên phải, kích hoạt workflow này.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

Cấu hình xong~

#### 7.2.3 Kiểm thử thông báo

Khoảnh khắc thú vị đến rồi, quay lại trang, nhấn chỉnh sửa bất kỳ task nào, thay đổi người chịu trách nhiệm, nhấn gửi trực tiếp, hệ thống đã gửi thông báo!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

Quy trình thiết lập workflow là vậy đó, nhưng chúng ta vẫn còn việc cần làm:

Thông báo chúng ta tạo ra cần chèn động thông tin task, nếu không mọi người sẽ không biết task nào được chuyển giao cho mình.

### 7.3 Hoàn thiện workflow

#### 7.3.1 Quản lý phiên bản

Quay lại cấu hình workflow, lúc này bạn sẽ thấy giao diện workflow đã chuyển sang màu xám, không thể chỉnh sửa.

Đừng lo, nhấn dấu ba chấm ở góc trên bên phải > [**Sao chép sang phiên bản mới**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions), chúng ta đã đến trang cấu hình phiên bản mới. Tất nhiên, các phiên bản trước cũng được giữ lại, nhấn nút **Phiên bản**, có thể chuyển sang phiên bản lịch sử bất cứ lúc nào (Lưu ý: phiên bản workflow đã thực thi không thể thay đổi nữa!).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 Tối ưu nội dung thông báo

Bây giờ, hãy làm cho nội dung thông báo cá nhân hóa hơn, thêm mô tả chi tiết về thông tin chuyển giao.

- **Chỉnh sửa node thông báo.**

Đổi nội dung tin nhắn thành: "Task 《【Tên task】》, người chịu trách nhiệm đã được thay đổi thành: 【Biệt danh người chịu trách nhiệm】"

- Chúng ta nhấn vào biến bên phải, điền tên task và người chịu trách nhiệm.
- Sau đó nhấn vào góc trên bên phải, kích hoạt phiên bản này.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

Kích hoạt phiên bản workflow đã cập nhật, kiểm thử lại, thông báo hệ thống đã hiển thị tên task mới.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### Tóm tắt

Tuyệt vời! Bạn đã thành công tạo một workflow tự động hóa dựa trên sự thay đổi người chịu trách nhiệm task. Chức năng này không chỉ tiết kiệm thời gian thao tác thủ công mà còn nâng cao hiệu quả cộng tác nhóm. Đến đây, hệ thống quản lý task của chúng ta đã có những chức năng mạnh mẽ.

---

### Tổng kết và triển vọng

Đến đây, bạn đã hoàn thành một hệ thống quản lý task hoàn chỉnh từ con số không - bao gồm tạo task, chức năng bình luận, thiết lập Quyền vai trò, cũng như workflow và thông báo hệ thống.

Sự linh hoạt và khả năng mở rộng của NocoBase sắp đem đến cho bạn vô vàn khả năng. Trong tương lai, bạn có thể tiếp tục khám phá thêm nhiều plugin, tùy chỉnh chức năng, hoặc tạo logic nghiệp vụ phức tạp hơn. Tin rằng qua những bài học này, bạn đã nắm vững cách sử dụng và các khái niệm cốt lõi của NocoBase.

Hãy chờ đợi ý tưởng tiếp theo của bạn! Nếu có bất kỳ vấn đề nào, hãy tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận.

Tiếp tục khám phá, sáng tạo vô hạn!
