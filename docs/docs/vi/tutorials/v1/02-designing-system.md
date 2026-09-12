# Chương 2: Thiết kế hệ thống quản lý Task

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113593597037138&bvid=BV1oCi2YdEAU&cid=27174896249&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Thiết kế một hệ thống quản lý Task có thể nghe có vẻ phức tạp, nhưng với sự trợ giúp của NocoBase, quá trình này sẽ trở nên dễ dàng và thú vị. Chúng ta sẽ cùng nhau từng bước phân tích nhu cầu, thiết kế cấu trúc dữ liệu, và lên kế hoạch cho các tính năng tương lai. Yên tâm, chúng ta sẽ không bị sa lầy vào những đống code khiến đầu váng, mà sẽ dùng cách trực quan và đơn giản nhất để xây dựng hệ thống quản lý Task của riêng bạn.

### 2.1 Phân tích nhu cầu hệ thống

Trước khi bắt tay vào, hãy làm rõ hệ thống quản lý Task này nên có những tính năng gì. Hãy tưởng tượng cách chúng ta thường quản lý Task hàng ngày, hoặc hệ thống quản lý Task lý tưởng của bạn nên làm được những gì:

- **Quản lý Task**: Người dùng có thể tạo, chỉnh sửa, xóa Task, phân công Task cho những người khác nhau, và theo dõi tiến độ Task bất cứ lúc nào.
- **Chuyển đổi nhiều view**: Task không chỉ có thể hiển thị dưới dạng danh sách, mà còn có thể dùng kanban, Gantt chart hoặc view lịch để hiển thị trực quan.
- **Tài liệu online**: Nên có thể chỉnh sửa tài liệu Task online, giúp các thành viên team hiểu chi tiết Task.
- **Quản lý đính kèm**: Có thể thêm đính kèm cho Task, upload hình ảnh, video, ghi chú quan trọng, v.v.
- **Tính năng bình luận**: Những người liên quan đến Task có thể bình luận về Task, chia sẻ ý kiến, ghi lại quá trình thảo luận.

Tiếp theo, hãy dùng một sơ đồ luồng đơn giản để phân tích mối quan hệ giữa các module tính năng này:
![](https://static-docs.nocobase.com/20241219-0-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER.drawio.svg)

Có cảm thấy ngay lập tức rõ ràng không?

---

> **Giới thiệu về bảng dữ liệu**: NocoBase dùng một định nghĩa gọi là "Collection" để mô tả cấu trúc dữ liệu, như vậy có thể thống nhất dữ liệu từ các nguồn khác nhau, cung cấp nền tảng vững chắc cho quản lý và phân tích dữ liệu.
>
> Nó hỗ trợ tạo nhiều kiểu bảng dữ liệu, bao gồm bảng thường, bảng kế thừa, bảng cây, bảng lịch, bảng file, bảng expression, bảng SQL, bảng view và bảng external, để thích ứng với các nhu cầu xử lý dữ liệu khác nhau. Thiết kế như vậy khiến thao tác dữ liệu linh hoạt và hiệu quả hơn.

### 2.2 Thiết kế bảng dữ liệu

Tốt, tiếp theo cần động não một chút. Để hỗ trợ các tính năng này, chúng ta cần lên kế hoạch các bảng dữ liệu trong hệ thống. Đừng lo, chúng ta không cần một cấu trúc cơ sở dữ liệu phức tạp, chỉ cần đơn giản vài bảng là đủ.

Dựa vào nhu cầu chúng ta vừa phân tích, thường sẽ thiết kế các bảng dữ liệu sau:

1. **Bảng Người dùng (Users)**: Ghi lại thông tin Người dùng trong hệ thống, ai đang làm Task? Ai phụ trách quản lý?
2. **Bảng Task (Tasks)**: Ghi lại thông tin chi tiết của mỗi Task, bao gồm tên Task, tài liệu, người phụ trách và trạng thái tiến độ.
3. **Bảng đính kèm (Attachments)**: Ghi lại tất cả đính kèm liên quan đến Task, như hình ảnh, file, v.v.
4. **Bảng bình luận (Comments)**: Ghi lại bình luận của Người dùng về Task, tiện cho thành viên team tương tác.

Mối quan hệ giữa các bảng rất đơn giản: Mỗi Task có thể có nhiều đính kèm và bình luận, tất cả đính kèm và bình luận đều do một Người dùng tạo hoặc upload. Điều này tạo nên cấu trúc cốt lõi của hệ thống quản lý Task.

Xem hình bên dưới, nó hiển thị mối quan hệ cơ bản giữa các bảng:
![](https://static-docs.nocobase.com/%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER241219-0.drawio.svg)

### 2.3 Thiết kế bảng trong hệ thống NocoBase

Vậy, để dùng NocoBase thực hiện hệ thống quản lý Task này, thực tế chúng ta cần thiết kế những bảng nào? Thực ra đơn giản hơn bạn tưởng:

- **Bảng Task**: Đây là cốt lõi của toàn bộ hệ thống, dùng để lưu thông tin chi tiết của mỗi Task.
- **Bảng bình luận**: Dùng để lưu bình luận của Task, để thành viên team có thể phản hồi về Task.

Các tính năng phức tạp khác, như quản lý đính kèm, thông tin Người dùng, v.v., NocoBase đã đóng gói sẵn cho bạn, hoàn toàn không cần tạo thủ công. Có nhẹ đầu hơn nhiều không?

Chúng ta sẽ bắt đầu từ một hệ thống quản lý dữ liệu Task đơn giản, từng bước mở rộng tính năng. Ví dụ, thiết kế tốt các Field thông tin cơ bản của Task trước, sau này thêm tính năng bình luận, toàn bộ quá trình linh hoạt và kiểm soát được.

Cấu trúc bảng tổng thể sẽ đại khái như sau, bao gồm các Field chúng ta cần:
![](https://static-docs.nocobase.com/241219-1.svg)

### Tóm tắt

Qua phần này, bạn đã hiểu cách thiết kế một hệ thống quản lý Task cơ bản. Trong NocoBase, chúng ta bắt đầu từ phân tích nhu cầu, lên kế hoạch cấu trúc bảng dữ liệu và Field. Tiếp theo, bạn sẽ thấy việc thực hiện những tính năng này còn đơn giản hơn cả thiết kế.

Ví dụ, sự khởi đầu của bảng Task sẽ rất gọn gàng, như thế này:

```text
Bảng Task (Tasks):
        Tên Task (task_name) Single line text
        Mô tả Task (task_description) Multi line text
```

Có rất trực quan không? Đã sẵn sàng cho thao tác của [chương tiếp theo (Chương 3: Quản lý dữ liệu Task — Vận trù, dễ dàng làm quen)](https://www.nocobase.com/cn/tutorials/task-tutorial-data-management-guide) chưa?

---

Tiếp tục khám phá, sáng tạo vô hạn khả năng! Nếu trong quá trình thao tác gặp vấn đề, đừng quên có thể tra [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) bất cứ lúc nào để nhận trợ giúp. Hẹn gặp lại ở chương sau!
