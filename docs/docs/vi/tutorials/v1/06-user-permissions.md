# Chương 6: Người dùng và Quyền

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113595157318206&bvid=BV1EwiUYYE4f&cid=27181319746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Trong cộng tác nhóm, mỗi người nên hiểu rõ trách nhiệm và quyền hạn của mình để đảm bảo công việc được tiến hành thuận lợi. Hôm nay, chúng ta sẽ cùng tìm hiểu cách tạo vai trò và quản lý quyền, giúp việc cộng tác trở nên trôi chảy và có trật tự hơn.

Đừng lo lắng, quá trình này không phức tạp. Chúng tôi sẽ hướng dẫn bạn từng bước và đồng hành cùng bạn ở mỗi mắt xích quan trọng. Nếu bạn gặp bất kỳ vấn đề nào, vui lòng đến diễn đàn chính thức của chúng tôi để được hỗ trợ.

### Thảo luận yêu cầu:

Chúng ta cần một vai trò "Đối tác (Partner)", vai trò này có một số quyền nhất định để tham gia quản lý task, nhưng không thể tùy ý sửa đổi task của người khác. Bằng cách này, chúng ta có thể phân công và cộng tác task một cách linh hoạt.

![](https://static-docs.nocobase.com/241219-5-er.svg)

> **Giới thiệu về vai trò và quyền:** Vai trò và quyền là cơ chế quan trọng để quản lý truy cập và thao tác của Người dùng, đảm bảo tính bảo mật của hệ thống và tính toàn vẹn của dữ liệu. Vai trò có thể được liên kết với Người dùng, một Người dùng có thể có nhiều vai trò. Việc thiết lập quyền cho vai trò có thể kiểm soát hành vi, thao tác của Người dùng trong hệ thống cũng như giới hạn hiển thị các chức năng trang dành cho Người dùng, có ý nghĩa kiểm soát quyền quan trọng.
> Sử dụng chức năng vai trò và quyền, liên kết với Người dùng. Trong bài học tình huống này, bạn có thể kiểm soát hệ thống quản lý của mình tốt hơn. Là người quản lý, bạn có thể tùy ý phân công ai có Quyền thao tác hệ thống như thế nào!

### 6.1 **Tạo và liên kết vai trò**

#### 6.1.1 **Tạo vai trò "Đối tác (Partner)"**

- Nhấn vào ["**Người dùng và Quyền**"](https://docs-cn.nocobase.com/handbook/users) ở góc trên bên phải giao diện, chọn ["**Vai trò và Quyền**"](https://docs-cn.nocobase.com/handbook/acl). Đây là nơi chúng ta thiết lập vai trò và quản lý Quyền.
- Nhấn nút "**Tạo vai trò**", một hộp thoại sẽ hiện ra. Tại đây, đặt tên vai trò là **Đối tác (Partner)** và xác nhận lưu.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172222974.gif)

Bạn đã tạo thành công một vai trò mới! Tiếp theo, chúng ta cần phân Quyền cho vai trò này, đảm bảo họ có thể tham gia vào quản lý task.

#### 6.1.2 **Liên kết vai trò mới cho chính mình**

Để đảm bảo Quyền của vai trò mà chúng ta thiết lập có hiệu lực, trước tiên có thể liên kết vai trò này với tài khoản của chính mình để kiểm thử. Thao tác rất đơn giản:

- Trong quản lý Người dùng, tìm tài khoản của bạn, nhấn vào, chọn "**Liên kết vai trò**", chọn "**Đối tác**".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223483.gif)

Như vậy bạn có thể dùng tài khoản của chính mình để mô phỏng trải nghiệm vai trò "Đối tác". Tiếp theo, hãy thử cách chuyển đổi vai trò.

#### 6.1.3 **Chuyển đổi sang vai trò "Đối tác"**

Bây giờ, bạn đã liên kết vai trò "Đối tác". Tiếp theo, hãy xem cách chuyển đổi vai trò.

- Nhấn vào **Trung tâm cá nhân** ở góc trên bên phải, sau đó chọn "**Chuyển đổi vai trò**".
- Bạn có thể thấy danh sách tạm thời chưa xuất hiện tùy chọn vai trò "Đối tác", đừng lo, lúc này chỉ cần **làm mới trang/bộ nhớ đệm**, vai trò sẽ hiển thị!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223922.gif)

### 6.2 Phân Quyền truy cập trang cho vai trò

Sau khi chuyển sang vai trò "Đối tác", bạn có thể thấy hệ thống không có bất kỳ trang và menu nào. Đó là vì chúng ta chưa phân Quyền truy cập các trang cụ thể cho vai trò này. Không sao, tiếp theo chúng ta sẽ thiết lập Quyền truy cập cho vai trò "Đối tác".

#### 6.2.1 **Phân Quyền trang quản lý task cho vai trò "Đối tác"**

- Trước tiên, chuyển về vai trò **Root** (Quản trị viên cấp cao), sau đó vào trang "**Vai trò và Quyền**".
- Nhấn vào vai trò "Đối tác", vào trang cấu hình. Tại đây có thể thấy thẻ "**Menu**", đại diện cho tất cả các trang trong hệ thống.
- Đánh dấu chọn Quyền trang "**Quản lý task**", như vậy vai trò "Đối tác" sẽ có thể truy cập trang quản lý task.

Quay lại **Trung tâm cá nhân**, chuyển lại sang vai trò "Đối tác", lúc này bạn sẽ có thể thấy menu trang quản lý task.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223592.gif)

#### 6.2.2 Thiết lập Quyền bảng dữ liệu và thao tác

Mặc dù bây giờ vai trò "Đối tác" đã có thể truy cập trang quản lý task, nhưng chúng ta cần giới hạn thêm Quyền thao tác của họ. Chúng ta muốn "Đối tác" có thể:

- **Xem và chỉnh sửa** các task được giao cho mình;
- **Cập nhật tiến độ task**;
- Nhưng **không thể tạo hoặc xóa task**.

Vì vậy, chúng ta cần cấu hình Quyền cho "bảng task". Tiếp tục nhé!

##### 6.2.2.1 **Cấu hình Quyền bảng dữ liệu cho vai trò "Đối tác"**

- Vào trang "**Vai trò và Quyền**", nhấn vào vai trò "Đối tác", chuyển sang tab "**Nguồn dữ liệu**".
- Tại đây, bạn sẽ thấy thiết lập "**Quyền thao tác bảng dữ liệu**". Tìm "**Bảng task**", chúng ta cần phân Quyền "Xem" và "Chỉnh sửa" cho "Đối tác".
- Tại sao Quyền chỉnh sửa lại được phân là 'Tất cả dữ liệu'?
  Mặc dù chúng ta tạm thời cấp Quyền chỉnh sửa toàn bộ cho Đối tác. Nhưng sau đó chúng ta sẽ giới hạn động Quyền Field theo "Người chịu trách nhiệm task".
  Vì vậy ngay từ đầu giữ Quyền tối đa là để việc kiểm soát sau này linh hoạt hơn.
- "Thêm mới", "Xóa" chúng ta không muốn mở cho các vai trò khác, nên ngay từ đầu không cần phân.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224941.gif)

Đến đây, vai trò Đối tác đã có Quyền xem và chỉnh sửa tất cả các bảng task. Tiếp theo chúng ta cần kiểm soát kỹ hơn để đảm bảo họ chỉ có thể chỉnh sửa các task được giao cho mình.

### 6.3 Thêm Field "Người chịu trách nhiệm" cho task

Tiếp theo, chúng ta sẽ chỉ định một người chịu trách nhiệm cho mỗi task. Thông qua việc chỉ định người chịu trách nhiệm, chúng ta có thể đảm bảo chỉ người chịu trách nhiệm task mới có thể sửa đổi task, người khác chỉ có thể xem. Lúc này chúng ta cần dùng đến **Field quan hệ**, để liên kết bảng task và bảng Người dùng.

#### 6.3.1 **Tạo Field "Người chịu trách nhiệm"**

1. Vào "**Bảng task**", nhấn "**Thêm Field**", chọn "**Field quan hệ**".
2. Chọn quan hệ "**Nhiều-tới-một**" (vì một task chỉ có thể có một người chịu trách nhiệm, còn một Người dùng có thể chịu trách nhiệm nhiều task).
3. Đặt tên Field là "**Người chịu trách nhiệm (Assignee)**". Không cần đánh dấu quan hệ ngược, tạm thời chúng ta chưa dùng đến.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224751.gif)

#### 6.3.2 **Hiển thị Field "Người chịu trách nhiệm"**

Tiếp theo, chúng ta cần đảm bảo Field "Người chịu trách nhiệm" được hiển thị trong bảng và biểu mẫu của trang quản lý task, để bạn có thể dễ dàng phân công người chịu trách nhiệm cho mỗi task. (Nếu Field của bạn mặc định hiển thị mã, đừng hoảng, hãy đổi Field tiêu đề từ ID thành "Biệt danh")

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224547.png)

### 6.4 Sử dụng **Quản lý quyền** để kiểm soát Quyền

Tiếp theo là phần quan trọng!! Bây giờ, chúng ta sẽ tận dụng [**Quản lý quyền**](https://docs-cn.nocobase.com/handbook/acl) của NocoBase để thực hiện một chức năng cực kỳ mạnh mẽ: **chỉ người chịu trách nhiệm và người tạo task mới có thể chỉnh sửa task**, người khác chỉ có thể xem. Sự linh hoạt tiếp theo của NocoBase sắp được thể hiện.

#### 6.4.1 **Thử nghiệm đơn giản, chỉ người chịu trách nhiệm có thể chỉnh sửa biểu mẫu**

Chúng ta muốn chỉ người chịu trách nhiệm task mới có thể chỉnh sửa task, vì vậy hãy thiết lập điều kiện sau:

- Quay lại Quyền bảng dữ liệu của "Đối tác", mở "Cấu hình" của bảng task, nhấn "Phạm vi dữ liệu" sau "Quyền chỉnh sửa".
- Tạo một quy tắc tùy chỉnh mới, đặt tên "Người chịu trách nhiệm có thể chỉnh sửa":
  **Khi "Người chịu trách nhiệm/ID" bằng "Người dùng hiện tại/ID"**, mới có thể chỉnh sửa;
  Điều này có nghĩa chỉ người chịu trách nhiệm task mới có thể chỉnh sửa task, người khác chỉ có thể xem.
- Vì Field người chịu trách nhiệm của chúng ta dùng bảng Người dùng, Người dùng đăng nhập cũng nằm trong bảng Người dùng, nên quy tắc này hoàn hảo thực hiện yêu cầu đầu tiên của chúng ta.

Nhấn thêm, xác nhận

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172226879.gif)

Quay lại trang xem nào:

Hoàn hảo, bây giờ chúng ta chuyển sang vai trò Đối tác, quay lại trang xem, chỉ khi người chịu trách nhiệm dự án là chính chúng ta, thao tác chỉnh sửa mới được hiển thị.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227581.gif)

#### 6.4.2 **Điều kiện bổ sung, người tạo sửa biểu mẫu**

Tiếp theo bạn có thể nhanh chóng phát hiện vấn đề mới:

Vì hầu hết các task chúng ta đều không phải là người chịu trách nhiệm, chúng ta không thể tự chỉnh sửa biểu mẫu, và các đồng đội khác cũng không thể xem chi tiết task!

Đừng lo, còn nhớ chúng ta đã phân Quyền "**Xem**" tất cả dữ liệu cho Đối tác chứ?

- Quay lại trang, trong cấu hình nhấn chọn "Xem", thêm thao tác xem mới

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227426.png)

- Tương tự bố cục popup của thao tác chỉnh sửa, tạo một popup xem, nhớ chọn Block "Chi tiết".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227807.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227352.gif)

Xong~

### 6.5 **Xác minh kiểm soát Quyền**

Nếu bạn thử chuyển đổi sang Người dùng khác, khi xem biểu mẫu, bạn sẽ thấy Block biểu mẫu đã tự động hiển thị các thao tác khác nhau theo Quyền tương ứng của Người dùng. Tất cả các task chúng ta chịu trách nhiệm sẽ mở Quyền thao tác chỉnh sửa, còn các dự án không chịu trách nhiệm thì chỉ có thao tác xem.

Khi chúng ta chuyển sang vai trò Root, lại khôi phục tất cả các Quyền, đó chính là sức mạnh của kiểm soát Quyền NocoBase!

Tiếp theo có thể tùy ý phân công người chịu trách nhiệm task, mời đồng đội cùng cộng tác. Hãy thêm một thành viên mới cho nhóm và kiểm thử xem Quyền chúng ta thiết lập có chính xác không.

#### 6.5.1 **Tạo Người dùng mới và phân vai trò**

- Tạo một Người dùng mới, ví dụ **Tom**, và phân vai trò "**Đối tác**".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228278.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228648.gif)

- Trong trang quản lý task, phân một số task cho **Tom**.

#### 6.5.2 **Kiểm thử đăng nhập**

Cho Tom đăng nhập hệ thống, xem anh ấy có thể xem và chỉnh sửa các task được giao cho mình bình thường không. Theo quy tắc Quyền đã thiết lập, Tom chỉ có thể chỉnh sửa các task mình chịu trách nhiệm, các task khác chỉ đọc đối với anh ấy.

Quyền biểu mẫu chỉnh sửa của tất cả các trang đã được đồng bộ thành công~

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172229408.gif)

### Tóm tắt

Chúc mừng! Đến nay, bạn đã học cách tạo vai trò, phân Quyền, thiết lập Quyền tùy chỉnh trong NocoBase, đảm bảo các thành viên nhóm chỉ có thể chỉnh sửa các task được giao cho mình. Qua các bước này, bạn đã xây dựng một hệ thống quản lý Quyền rõ ràng, có trật tự cho cộng tác nhóm.

### Task thử thách

Đến nay, Tom đã có thể xem và chỉnh sửa các task mình chịu trách nhiệm, nhưng bạn có thể nhận thấy, anh ấy **vẫn chưa thể đăng bình luận**, không thể tham gia tương tác trong task. Vậy, làm thế nào để phân Quyền cho Tom, để anh ấy có thể tự do phát biểu ý kiến, tham gia thảo luận? Đây sẽ là một thử thách rất thú vị!

**Gợi ý thử thách:**

Bạn có thể thử quay lại thiết lập Quyền vai trò, điều chỉnh Quyền của vai trò "Đối tác", ví dụ bảng dữ liệu, xem cách cho phép Tom có Quyền bình luận, đồng thời đảm bảo không ảnh hưởng đến các thao tác hạn chế của anh ấy trong các task khác.

Hãy thử ngay! Chúng tôi sẽ tiết lộ đáp án trong nội dung tiếp theo.

Trong chương tiếp theo, chúng ta cũng sẽ thực hiện chức năng "Hoạt động thành viên" và giới thiệu một module chức năng mạnh mẽ khác - [**Workflow**](https://docs-cn.nocobase.com/handbook/workflow). Thông qua workflow, bạn có thể thực hiện luồng dữ liệu động, kích hoạt các thao tác khác nhau, để hệ thống tự động xử lý các quy trình nghiệp vụ phức tạp. Sẵn sàng tiếp tục khám phá chưa? Hẹn gặp ở [Chương 7: Workflow - Tự động hóa, hiệu quả vượt bậc](https://www.nocobase.com/cn/blog/task-tutorial-workflow)!

---

Tiếp tục khám phá, thỏa sức sáng tạo! Nếu gặp vấn đề, đừng quên tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận.
