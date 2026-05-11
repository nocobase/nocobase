# Chương 4: Plugin Task và bình luận

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113532393752067&bvid=BV16XB2YqERC&cid=26937593203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe

## Ôn lại phần trước

Các bạn còn nhớ Task thử thách của phần trước không? Chúng ta cần cấu hình Field **trạng thái** và **đính kèm** cho bảng Task, và hiển thị chúng trong danh sách Task. Đừng vội, chúng ta cùng tiết lộ đáp án trước!

1. **Cấu hình Field trạng thái**:
   - Chọn Field [**Dropdown (single select)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select), điền các label option: **Chưa bắt đầu, Đang tiến hành, Chờ duyệt, Đã hoàn thành, Đã hủy, Đã lưu trữ**. Màu sắc tự do cài đặt theo sở thích, thêm chút màu cho Task!

![Cấu hình Field trạng thái](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162341275.png)

2. **Cấu hình Field đính kèm**:
   - Tạo Field [**đính kèm**](https://docs-cn.nocobase.com/handbook/file-manager/field-attachment) mới, đặt cho nó một cái tên, ví dụ "Đính kèm", click submit, hoàn thành đơn giản.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162343470.png)

3. **Danh sách Task hiển thị người tạo và trạng thái**:
   - Trong Block bảng đánh dấu các Field "Người tạo", "Trạng thái" và "Đính kèm", để danh sách Task hiển thị nhiều thông tin then chốt hơn, trở nên phong phú hơn.

![Field hiển thị danh sách Task](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162344570.png)

4. **Hiển thị Field trong form thêm và edit**:
   - Trong form popup, đừng quên đánh dấu Field trạng thái và đính kèm, như vậy bất kể khi thêm hay edit Task, đều có thể tiện thấy các Field này.

![Hiển thị Field trong form](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162345053.gif)

Làm tốt rồi đúng không? Đừng vội, lặp lại thao tác vài lần, bạn sẽ thấy mình dần dần thành thạo cách dùng cốt lõi của NocoBase. Mỗi bước thao tác đều đặt nền móng vững chắc cho việc quản lý Task tiếp theo của bạn, hãy cùng xem tiếp!

---

## 4.1 Nội dung Task và bình luận: Quản lý Task tương tác

Đến nay, hệ thống quản lý Task của bạn đã có thể chứa thông tin Task cơ bản. Tuy nhiên, chúng ta biết, quản lý Task không chỉ là vài dòng text mô tả, đôi khi chúng ta cần nội dung phong phú hơn, cũng như tương tác thời gian thực giữa các thành viên team.

### 4.1.1 Markdown(Vditor): Khiến nội dung Task phong phú hơn

Bạn có thể đã chú ý đến editor [**Rich Text**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/rich-text) và [**Markdown**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/markdown) mà NocoBase cung cấp, tuy nhiên tính năng của chúng có thể vẫn chưa làm bạn hài lòng.
Editor Rich Text tính năng tương đối hạn chế, editor Markdown tuy dễ dùng, nhưng không hỗ trợ preview thời gian thực.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162346447.png)

Vậy, có editor nào vừa có thể preview thời gian thực, vừa hỗ trợ tính năng phong phú không? Câu trả lời là có! [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor) là editor text mạnh nhất trong NocoBase, hỗ trợ preview thời gian thực, upload hình ảnh, thậm chí ghi âm. Hơn nữa, nó đã được tích hợp sẵn trong hệ thống, hoàn toàn miễn phí!

> **Giới thiệu Plugin**: Plugin là một trong những tính năng cốt lõi của NocoBase, cho phép Người dùng thêm tính năng tùy chỉnh hoặc tích hợp dịch vụ bên thứ ba theo nhu cầu dự án.
> Thông qua việc dùng mở rộng Plugin, có thể mở rộng thực hiện một số tích hợp tính năng tiện lợi hoặc bất ngờ, càng tiện cho việc sáng tạo và phát triển của bạn.

Dưới đây tôi sẽ đưa bạn từng bước bật editor mạnh mẽ này, còn nhớ Plugin Manager của chúng ta chứ? Haha đúng vậy, nó nằm ở trong đó.

> **Markdown(Vditor)**: Dùng để lưu Markdown, và dùng editor Vditor để render, hỗ trợ cú pháp Markdown thường gặp, như list, code, quote, v.v., và hỗ trợ upload hình ảnh, ghi âm. Đồng thời có thể render tức thì, WYSIWYG.

1. **Bật Plugin Markdown(Vditor)**:
   - Mở **Plugin Manager** ở góc trên bên phải, gõ "markdown" tìm Plugin, bật [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor). Đừng lo trang sẽ refresh ngắn, vài giây sau nó sẽ trở lại bình thường.

![Bật Plugin Markdown](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162348237.png)

2. **Tạo Field Markdown**:

   - Quay lại bảng Task, click "Tạo Field", phiên bản Markdown Pro Plus tăng cường của chúng ta đã xuất hiện!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162349275.png)

- Đặt cho nó cái tên, ví dụ "Chi tiết Task (task_detail)", đánh dấu tất cả các tính năng có sẵn.

3. Bạn có thể chú ý đến tùy chọn "Bảng dữ liệu file", không chọn có ảnh hưởng tính năng file không? Không cần lo, sẽ lưu vào không gian lưu trữ mặc định của chúng ta, yên tâm dùng.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162350389.gif)

4. **Test Field Markdown**:
   - Bây giờ quay lại trang quản lý Task, bắt đầu viết text Markdown đầu tiên của bạn! Lại thử dán hình ảnh, hoặc upload file, có cảm thấy rất mạnh không?

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162351380.gif)

Bảng Task ngày càng phong phú! Theo từng bước, tính năng hệ thống của bạn dần mở rộng, tiếp theo chúng ta xem cách điều chỉnh sắp xếp Field, để giao diện đẹp hơn.

### 4.1.2 Điều chỉnh sắp xếp Field

Khi Field trong bảng Task tăng lên, layout trang có thể trông hơi lộn xộn, đừng lo, sự linh hoạt của NocoBase cho phép bạn dễ dàng điều chỉnh vị trí Field.

**Điều chỉnh vị trí Field**:

- Di chuột đến biểu tượng chữ thập ở góc trên bên phải Field, click và kéo Field đến vị trí muốn, thả tay là hoàn thành điều chỉnh. Thử xem, layout trang ngay lập tức gọn gàng hơn nhiều!

![Điều chỉnh vị trí Field](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162352077.gif)

Sau khi thao tác như vậy, layout trang sẽ phù hợp hơn với nhu cầu của bạn. Tiếp theo, chúng ta thêm tính năng bình luận cho bảng Task, để team tương tác dễ dàng hơn.

## 4.2 Tính năng bình luận

Chỉ có mô tả Task không đủ, đôi khi chúng ta còn cần thành viên team thêm bình luận cho Task, thảo luận vấn đề, ghi lại phản hồi. Cùng bắt đầu thực hiện nào.

### 4.2.1 Cách một: Dùng Plugin bình luận

#### 4.2.1.1 Cài Plugin bình luận

> **Plugin bình luận (Plugin thương mại)**: Cung cấp template và Block bảng dữ liệu bình luận, thêm tính năng bình luận cho dữ liệu của bất kỳ bảng dữ liệu nào.
>
> Lưu ý khi thêm bình luận cần qua Field quan hệ liên kết với bảng dữ liệu đích, để tránh xung đột dữ liệu bình luận

Trong [**Plugin Manager**](https://docs-cn.nocobase.com/handbook/plugin-manager), upload và bật **Plugin bình luận**. Sau khi Plugin được bật, trong data source sẽ xuất hiện một tùy chọn "Bảng bình luận" mới.
Click thêm > Upload Plugin > Kéo file zip vào > Submit
Tìm bình luận, Plugin bình luận đã xuất hiện! Sau khi bật vào data source, thấy tùy chọn bảng bình luận, cài đặt thành công!

![Cài Plugin bình luận](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162353550.gif)

#### 4.2.1.2 Tạo bảng bình luận mới

Chúng ta chuyển sang data source, tạo bảng dữ liệu bình luận mới **Bảng bình luận (Comments)**.

#### 4.2.1.3 Thảo luận về quan hệ giữa bảng bình luận và bảng Task

Chúng ta đã tạo **Bảng bình luận (Comments)**, có thể bạn nghĩ: Có phải có thể trực tiếp đến trang vẽ khu bình luận không? Đừng vội, hãy nghĩ một chút, **mỗi Task đều có khu bình luận riêng**, và quan hệ giữa bình luận và Task nên là **many-to-one**. Vậy làm sao để liên kết bình luận và Task?

**Đúng vậy! Đây chính là [Field quan hệ](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations) mà chúng ta sắp dùng!**

NocoBase cho phép chúng ta qua Field quan hệ, thiết lập quan hệ giữa bảng và bảng ở cấp độ dữ liệu, giống như xây cầu, kết nối chặt chẽ các dữ liệu liên quan.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162355370.gif)

**Tại sao chọn quan hệ many-to-one?**

Tại sao chúng ta chọn quan hệ [**many-to-one**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), không phải [**one-to-many**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/o2m) hay quan hệ kiểu khác? Nhớ lại, **mỗi Task đều có nhiều bình luận**, do đó, nhiều bình luận có thể trỏ đến cùng một Task. Trường hợp này, chúng ta cần tạo một Field **many-to-one** trong bảng bình luận, trỏ đến Task trong bảng Task.

> Bạn thông minh có thể đã nghĩ ra:
> Vì bình luận và Task là quan hệ many-to-one, vậy trong bảng Task có thể tạo một Field **one-to-many**, để trỏ đến bảng bình luận không?
> **Chúc mừng bạn, hoàn toàn đúng!** One-to-many và many-to-one là quan hệ ngược nhau, chúng ta cũng có thể trong bảng Task tạo một Field one-to-many, liên kết đến bảng bình luận. Bạn thật tuyệt vời!

#### 4.2.1.4 Cài Field quan hệ many-to-one

Tiếp theo, chúng ta sẽ tạo một Field many-to-one trong bảng bình luận, dùng để liên kết với bảng Task. Chúng ta có thể đặt tên Field này là **Task thuộc về (belong_task)**. Khi cài đặt, có vài cấu hình then chốt cần lưu ý:

1. **Bảng data source**: Chúng ta phát sinh quan hệ từ đâu? Ở đây chọn **Bảng bình luận**.
2. **Bảng dữ liệu đích**: Chúng ta muốn thiết lập quan hệ với bảng nào? Ở đây chọn **Bảng Task**.

> **Foreign key và mã Field bảng dữ liệu đích: Ví dụ:**
> Tiếp theo là phần then chốt: **Foreign key** và **mã Field bảng dữ liệu đích**.
> Khái niệm này nghe hơi phức tạp? Đừng lo, tiếp theo chúng ta dùng một ví dụ chi tiết để giúp bạn dễ dàng hiểu.
>
> **Hãy tưởng tượng một tình huống**, giả sử bây giờ trong tay bạn có rất nhiều bảng điểm thi đại học, Task của chúng ta là tìm cho mỗi bảng điểm học sinh tương ứng. Vậy chúng ta làm thế nào?
> Chúng ta cầm một bảng điểm, trên đó có thông tin sau:
>
> - **Tên**: Trương Tam
> - **Lớp**: Lớp 12-15
> - **Số báo danh**: 202300000001
> - **Số CMND**: 111111111111
>   Bây giờ, giả sử bạn muốn qua **tên** và **lớp** để tìm học sinh Trương Tam. Nhưng vấn đề đến rồi — trong cùng một trường, có rất nhiều học sinh trùng tên, riêng lớp 12-15 đã có **20 học sinh tên Trương Tam**! Như vậy chỉ dựa vào tên và lớp, rất khó xác định chính xác là Trương Tam nào đúng không?
>   **Lúc này, chúng ta cần một định danh độc đáo hơn để giúp chúng ta nhận diện**. Ví dụ, **số báo danh** là một lựa chọn rất tốt. Số báo danh của mỗi học sinh đều duy nhất, qua số báo danh, chúng ta có thể chính xác tìm thấy học sinh tương ứng với bảng điểm. Ví dụ, bạn gửi truy vấn số báo danh 202300000001, không lâu sau, có một trường gửi phản hồi: "Bảng điểm này thuộc về Trương Tam, người đeo kính ngồi hàng 3 trong lớp 12-15 của chúng tôi!"
>   **Cùng đạo lý**, quay lại tình huống thiết kế quan hệ **bình luận**, bạn có chợt sáng tỏ: Chúng ta có thể chọn một Field định danh duy nhất của bảng Task (ví dụ **id**), lưu vào bình luận này, để xác định bình luận thuộc về Task nào?
>   Đây chính là khái niệm cốt lõi của việc thực hiện quan hệ many-to-one: **Foreign key**, đơn giản nhỉ, hahaha

Trong bảng bình luận của chúng ta, lưu Field id duy nhất này của bảng Task, chúng ta đặt tên là **task_id**, như vậy có thể qua task_id bind bình luận và Task lại.

#### 4.2.1.5 Chiến lược xử lý foreign key khi xóa

Trong NocoBase, sau khi cài quan hệ many-to-one, còn cần xem xét nếu xóa Task thì dữ liệu bình luận nên xử lý thế nào. Bạn có thể chọn các cách sau:

- **CASCADE**: Nếu bạn xóa Task, tất cả bình luận liên kết với Task này sẽ bị xóa cùng.
- **SET NULL** (cài đặt mặc định): Khi Task bị xóa, dữ liệu bình luận sẽ được giữ lại, nhưng Field foreign key liên kết sẽ bị set null.
- **RESTRICT và NO ACTION**: Khi Task có bình luận liên kết, hệ thống sẽ ngăn bạn xóa Task này, đảm bảo bình luận không bị mất.

#### 4.2.1.7 Tạo quan hệ ngược trong bảng Task

Cuối cùng, chúng ta đánh dấu "**Tạo Field quan hệ ngược trong bảng dữ liệu đích**", để tiện cho chúng ta xem tất cả bình luận liên kết từ Task. Điều này khiến quản lý dữ liệu tiện lợi hơn.

Trong NocoBase, vị trí lưu của Field quan hệ quyết định cách lấy dữ liệu, do đó nếu chúng ta muốn trong bảng Task cũng có thể xem dữ liệu bình luận tương ứng, thì cần tạo một Field quan hệ ngược **one-to-many** trong bảng Task, liên kết đến bảng bình luận.

Khi bạn lại mở bảng Task, hệ thống sẽ tự động sinh một Field bình luận liên kết, và ghi chú quan hệ "**one-to-many**", như vậy bạn có thể dễ dàng xem và quản lý tất cả bình luận liên kết!

## 4.3 Xây dựng trang

### 4.3.1 Bật bảng bình luận

Khoảnh khắc căng thẳng thú vị đến rồi, chúng ta quay lại popup edit, tạo Block bảng bình luận, tiện đánh dấu các tính năng cần, xong!

![demov3N-16.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162357118.gif)

### 4.3.2 Điều chỉnh trang

Chúng ta làm đẹp style trang một chút, di chuột đến góc trên bên phải nút edit, chọn popup rộng hơn. Áp dụng kiến thức vừa học, kéo Block bình luận, đặt ở bên phải popup, hoàn hảo!

![demov3N-17.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162358300.gif)

Bây giờ một số bạn có thể thèm thuồng: Tôi cũng muốn thực hiện bình luận! Đừng sợ, tôi cũng đã chuẩn bị cho bạn cách miễn phí thứ hai.

### 4.2.2 Cách hai: Bảng bình luận tùy chỉnh

Nếu bạn không mua Plugin bình luận, chúng ta vẫn có thể qua tạo bảng thường để thực hiện tính năng bình luận tương tự.

1. **Tạo bảng bình luận mới**:

   - Tạo **Bảng bình luận (comments2)**, thêm Field **Nội dung bình luận (content)** (kiểu Markdown) và Field **Task thuộc về (belong_task)** (kiểu many-to-one).
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170001040.gif)
2. **Tạo Block list bình luận trong trang**:

   - Trong popup edit của bảng Task, thêm một [**Block list**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) (kiểu Block thứ ba của chúng ta đã xuất hiện, list đồng thời có thể hiển thị thông tin chi tiết Field), chọn bình luận, test một chút:
     ![Tạo Block list bình luận](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170003544.gif)

## Tóm tắt

Bạn đã học cách qua Markdown(Vditor) làm phong phú nội dung Task, và đã thêm tính năng bình luận cho Task! Hệ thống quản lý Task đã có nền tảng tính năng hoàn chỉnh, có cảm thấy mình đã tiến gần thêm một bước đến việc xây dựng một tool quản lý Task chuyên nghiệp không?

Đừng quên tiếp tục khám phá và thao tác, NocoBase đầy ắp khả năng vô hạn. Nếu bạn gặp vấn đề gì, đừng hoảng, tôi sẽ luôn ở bên bạn, đưa bạn qua từng bước.

[Chương tiếp theo (Chương 5: Tab và Block — Đa dạng view, rực rỡ muôn màu)](https://www.nocobase.com/cn/tutorials/task-tutorial-tabs-blocks), chúng ta sẽ đi sâu khám phá thêm các tính năng Block của NocoBase, giúp bạn nâng hệ thống lên một tầm cao mới. Tiếp tục cố lên!

---

Tiếp tục khám phá, thỏa sức phát huy sáng tạo của bạn! Nếu gặp vấn đề, đừng quên có thể tra [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận bất cứ lúc nào.
