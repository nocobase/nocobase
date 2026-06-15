# Chương 10: Lọc Dashboard và điều kiện

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Trong chương này, chúng tôi sẽ hướng dẫn bạn từng bước hoàn thành phần tiếp theo của dashboard task, có bất kỳ thắc mắc nào nhớ đến diễn đàn hỏi bất cứ lúc nào.

Bắt đầu từ việc ôn lại nội dung chương trước, hãy cùng mở ra hành trình khám phá này!

### 10.1 Đáp án chương trước

#### 10.1.1 Trạng thái và liên kết

Trước tiên, chúng ta cần thêm chuyển hướng liên kết cho dữ liệu các trạng thái khác nhau, để dễ dàng điều hướng nhanh. Sau đây là cấu trúc liên kết của từng trạng thái:

(Giả sử liên kết của chúng ta là `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`)

##### Đáp án thử thách


| Trạng thái<br/>      | Liên kết<br/>                                            |
| -------------------- | -------------------------------------------------------- |
| Chưa bắt đầu<br/>    | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>      |
| Đang tiến hành<br/>  | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>      |
| Chờ duyệt<br/>       | hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br>     |
| Đã hoàn thành<br/>   | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>        |
| Đã hủy<br/>          | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>        |
| Đã lưu trữ<br/>      | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>         |

#### 10.1.2 Thêm chức năng đa chọn Người chịu trách nhiệm

1. **Tạo [Field tùy chỉnh](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5) mới**: Chúng ta cần tạo một Field "Người chịu trách nhiệm", loại đa chọn, và điền biệt danh (hoặc tên Người dùng) của các thành viên, thuận tiện cho việc nhanh chóng chọn người tương ứng khi phân công task.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **Trong cấu hình báo cáo**: Thiết lập "Người chịu trách nhiệm/Biệt danh bao gồm Lọc hiện tại/Người chịu trách nhiệm" làm điều kiện lọc. Như vậy, bạn có thể nhanh chóng tìm các task liên quan đến người chịu trách nhiệm hiện tại.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

Lọc tùy ý vài lần để xác nhận chức năng này hoạt động bình thường.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 Liên kết Dashboard với Người dùng

Chúng ta có thể hiển thị nội dung khác nhau theo từng Người dùng, cách thao tác như sau:

1. **Thiết lập giá trị mặc định của Field "Người chịu trách nhiệm" là "Người dùng hiện tại/Biệt danh"**: Như vậy có thể để hệ thống tự động hiển thị các task liên quan đến Người dùng hiện tại, nâng cao hiệu quả thao tác.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **Sau khi làm mới trang**: Dashboard sẽ tự động tải dữ liệu liên quan đến Người dùng đăng nhập hiện tại. (Nhớ thêm điều kiện lọc Người dùng cho biểu đồ cần thiết)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 Tái cấu trúc lọc task

Một số bạn có thể đã phát hiện một thiết kế không hợp lý:

Sau khi chuyển hướng trực tiếp ở "Thiết lập phạm vi dữ liệu" của Block bảng, task của chúng ta sẽ bị giới hạn trước trong phạm vi trạng thái tương ứng, lúc này chúng ta lọc các trạng thái khác, sẽ thấy dữ liệu trống!

Phải làm sao? Hãy bỏ lọc dữ liệu, đổi cách lọc khác!

1. **Bỏ cách lọc dữ liệu**: Tránh dữ liệu trạng thái bị khóa trong phạm vi hiện tại, linh hoạt điều chỉnh nhu cầu lọc.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **Cấu hình giá trị mặc định Block lọc biểu mẫu.**

Còn nhớ [Block lọc](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) của chúng ta chứ?

Tạo một Block biểu mẫu mới dùng để lọc bảng task, cấu hình **Trạng thái** và các Field khác bạn cần, dùng để điền biến do url đem lại. (Nhớ kết nối Block bảng task cần được lọc)

- Thiết lập giá trị mặc định Field trạng thái là `URL search params/task_status`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **Kiểm thử chức năng lọc mới**: Có thể thay đổi điều kiện lọc trạng thái bất cứ lúc nào, chuyển đổi tự do.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **Tùy chọn**: Nếu bạn muốn từng Người dùng tập trung vào task của mình, còn có thể thiết lập giá trị mặc định Field "Người chịu trách nhiệm" là "Người dùng hiện tại".

---

### 10.4 Tin tức, thông báo, tập trung thông tin

Hãy cải tạo thư viện tài liệu! Hiển thị thông tin cần thiết lên Dashboard~

Trong quản lý tài liệu lâu dài, chúng ta sẽ gặp ngày càng nhiều tài liệu và tư liệu, lúc này chúng ta sẽ dần xuất hiện nhiều nhu cầu khác nhau:

- News: Tập trung vào động thái dự án, thành tựu, mốc quan trọng
- Thông báo/nhắc nhở tạm thời

#### 10.4.1 Thông tin nóng (News)

1. **Thêm Field "Thông tin nóng"**: Trong bảng tài liệu thêm Field hộp kiểm "Thông tin nóng", để đánh dấu tài liệu này có phải là tin tức quan trọng hay không.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **Bổ sung và chọn thông tin tài liệu**: Tùy ý chọn một bài viết, trong biểu mẫu chỉnh sửa thêm Field "Thông tin nóng" và đánh dấu chọn.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **Tạo Block "Danh sách" mới**: Quay lại trong Dashboard, tạo [Block "Danh sách"](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) mới > chọn bảng tài liệu.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

Kéo sang phải, hiển thị "Ngày tạo" và "Tiêu đề", điều chỉnh độ rộng Field, và đóng "Hiển thị tiêu đề"

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **Hiển thị thông tin nóng**:

Để thể hiện tính thời gian thực, chúng ta có thể hiển thị thời gian đồng thời.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

Sắp xếp theo thứ tự ngày tạo giảm dần, hiển thị tin tức nóng mới nhất.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

Một thông tin nóng đơn giản đã được làm xong, các thành viên có thể theo dõi các tiến triển quan trọng của toàn bộ dự án bất cứ lúc nào!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 Thông báo

Tiếp theo là một chức năng thông báo công khai đơn giản, tin rằng các bạn đã thấy nó nhiều lần trong Demo trực tuyến của chúng ta. Đối với thông báo tạm thời này, chúng ta không muốn hiển thị lâu dài, cũng không cần ghi lại tiến triển dự án. Chỉ dùng để nhắc nhở/thông báo những việc tạm thời.

1. **Tạo [Block Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) mới**: Chọn bất kỳ khu vực nào của Dashboard, sử dụng cú pháp Markdown thêm nội dung thông báo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Về việc sử dụng thực tế của Markdown, có thể tham khảo Demo chính thức, tài liệu chính thức của chúng tôi, hoặc [hướng dẫn "Tài liệu nhẹ"](https://www.nocobase.com/cn/tutorials).

Làm ví dụ đơn giản, dựa trên ngôn ngữ HTML viết "Một thông báo lộng lẫy" để cho mọi người thấy chức năng mạnh mẽ của [Block Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown).

- Mã ví dụ:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Thông báo quan trọng</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Các đồng nghiệp thân mến:</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Để nâng cao hiệu quả công việc tốt hơn, chúng tôi sẽ tổ chức một buổi đào tạo toàn thể vào <span style="color: red; font-weight: bold; font-size: 1.5em;">ngày 10 tháng 11</span>.</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Cảm ơn sự hợp tác của các bạn!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Trân trọng,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Đội ngũ quản lý</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 Tóm tắt

Thông qua các bước cấu hình trên, chúng ta đã thành công tạo một Dashboard cá nhân hóa, để các thành viên nhóm có thể quản lý task hiệu quả hơn, theo dõi tiến triển dự án và nhận thông báo, nhắc nhở kịp thời.

Từ lọc trạng thái, thiết lập người chịu trách nhiệm đến hiển thị thông tin nóng, nhằm mục đích tối ưu hóa trải nghiệm Người dùng và nâng cao tính tiện lợi và linh hoạt của hệ thống.

Đến đây, Dashboard cá nhân hóa của chúng ta đã sẵn sàng, mời mọi người cùng trải nghiệm, kết hợp với nhu cầu thực tế, cải tạo sâu hơn, hãy cùng bước vào [chương tiếp theo](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation)!

---

Tiếp tục khám phá, thỏa sức sáng tạo! Nếu gặp vấn đề, đừng quên bạn có thể tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) bất cứ lúc nào để thảo luận.
