# Chương 11: Subtask và tính toán Giờ làm việc

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Các bạn ơi, cuối cùng chúng ta cũng đến với chương mới! Khi nghiệp vụ mở rộng, các tác vụ ngày càng nhiều và phức tạp, dần dần chúng ta nhận ra rằng việc quản lý tác vụ đơn giản đã không còn đủ nữa. Bây giờ, chúng ta cần quản lý tác vụ chi tiết hơn, phân chia thành nhiều cấp độ để giúp mọi người hoàn thành công việc hiệu quả hơn!

### 11.1 Lập kế hoạch tác vụ: Từ tổng thể đến chi tiết

Chúng ta sẽ phân chia các tác vụ phức tạp thành nhiều tác vụ nhỏ có thể quản lý được, theo dõi tiến độ để hiểu rõ tình trạng hoàn thành tác vụ, và sử dụng quản lý nhiều cấp độ để hỗ trợ tổ chức Subtask đa cấp. Bây giờ, hãy cùng bắt đầu lập kế hoạch nào!

---

### 11.2 Tạo bảng Subtask mới

#### 11.2.1 Thiết kế cấu trúc Subtask

Đầu tiên, chúng ta tạo một "bảng Subtask" (Sub Tasks [**bảng cây**](https://docs-cn.nocobase.com/handbook/collection-tree)) và thiết kế nó thành cấu trúc dạng cây. Các thuộc tính của Subtask tương tự như tác vụ chính, ví dụ như "tên tác vụ", "trạng thái", "người phụ trách", "tiến độ", v.v. Tùy theo nhu cầu, bạn có thể bổ sung thêm các nội dung liên quan như bình luận, tài liệu.

Để thiết lập mối quan hệ giữa Subtask và tác vụ chính, chúng ta tạo một quan hệ nhiều-một, cho phép mỗi Subtask thuộc về một tác vụ chính. Đồng thời, chúng ta thiết lập một quan hệ ngược, để có thể xem hoặc quản lý nội dung Subtask trực tiếp trong tác vụ chính.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> Mẹo: Khuyến nghị tạo bằng Block liên kết trên trang tác vụ chính, thao tác sẽ tiện lợi hơn!

#### 11.2.2 Hiển thị Subtask trong giao diện quản lý tác vụ

Trong giao diện quản lý tác vụ, chúng ta đặt cách xem của "bảng tác vụ" thành [chế độ **trang**](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

Trong trang, tạo một tab "Quản lý Subtask" mới, sau đó thêm bảng Subtask đã tạo và chọn hiển thị dạng cấu trúc cây. Như vậy, bạn có thể quản lý và xem Subtask trên cùng một trang.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3. Biểu đồ so sánh Giờ làm việc: Ước tính tổng giờ làm việc và tiến độ (tùy chọn)

Tiếp theo, chúng ta tận dụng đà này để tạo chi tiết Giờ làm việc và biểu đồ so sánh Giờ làm việc của tác vụ, nhằm ước tính tổng Giờ làm việc và tiến độ tác vụ.

#### 11.3.1 Thêm thông tin thời gian và Giờ làm việc cho Subtask

Thêm các Field sau vào bảng Subtask:

- **Ngày bắt đầu**
- **Ngày kết thúc**
- **Tổng Giờ làm việc**
- **Giờ làm việc còn lại**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

Thông qua các Field này, có thể tính toán động số ngày kéo dài và Giờ làm việc của tác vụ.

#### 11.3.2 Tính toán số ngày tác vụ kéo dài

Chúng ta tạo một [Field công thức](https://docs-cn.nocobase.com/handbook/field-formula) "số ngày" mới trong bảng Subtask để tính số ngày tác vụ kéo dài.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

Cách tính công thức được chia thành:

- Math.js

  > Sử dụng thư viện [math.js](https://mathjs.org/), có thể tính các công thức số phức tạp
  >
- Formula.js

  > Sử dụng thư viện [Formula.js](https://formulajs.info/functions/), dùng để tính các công thức thông dụng. Nếu bạn quen thuộc với công thức Excel thì cái này sẽ rất dễ dàng đối với bạn!
  >
- Template chuỗi

  > Đúng như tên gọi, đây là một phương thức nối chuỗi. Khi chúng ta cần các mô tả động, mã số động, có thể sử dụng cách nối chuỗi này
  >

Ở đây, chúng ta có thể dùng thư viện `Formula.js`, tương tự công thức Excel, tiện cho việc tính các công thức thường gặp.

Công thức cho Field số ngày như sau:

```html
DAYS(Ngày kết thúc, Ngày bắt đầu)
```

Đảm bảo sử dụng định dạng tiếng Anh viết thường để tránh lỗi.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

Sau khi hoàn thành, hãy thử trên trang, số ngày đã thay đổi động theo ngày bắt đầu và ngày kết thúc của chúng ta!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 Khai báo Giờ làm việc hàng ngày: Theo dõi tiến độ thực tế (tùy chọn)

#### 11.4.1 Tạo bảng khai báo Giờ làm việc hàng ngày

Chúng ta tạo một bảng khai báo Giờ làm việc hàng ngày để ghi lại tình hình hoàn thành tác vụ mỗi ngày. Thêm các Field sau:

- **Giờ làm việc hôm nay** (hours khuyến nghị số nguyên)
- **Ngày**
- **Giờ làm việc lý tưởng** (ideal_hours khuyến nghị số nguyên)
- **Subtask thuộc về**: quan hệ [nhiều-một](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) với Subtask.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 Hiển thị Giờ làm việc hàng ngày trên trang Subtask

Quay lại trang chỉnh sửa Subtask, thiết lập bảng Giờ làm việc hàng ngày dưới dạng [bảng con](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table) để hiển thị, kéo thả bố cục các Field khác. Như vậy có thể dễ dàng điền và xem dữ liệu Giờ làm việc hàng ngày trên trang Subtask.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 Quy tắc tính toán và liên động quan trọng (tùy chọn)

Để ước tính tiến độ tác vụ và Giờ làm việc còn lại chính xác hơn, tiếp theo chúng ta thực hiện một số cấu hình quan trọng.

#### 11.5.1 Đặt [bắt buộc nhập](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required) cho các Field của Subtask

Đánh dấu **Ngày bắt đầu**, **Ngày kết thúc** và **Giờ làm việc dự kiến** là [bắt buộc nhập](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required), để đảm bảo các dữ liệu này đầy đủ, phục vụ cho việc tính toán sau này.

#### 11.5.2 Thiết lập [quy tắc liên động](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) cho tỷ lệ hoàn thành và Giờ làm việc còn lại

Trong bảng Subtask, thêm các quy tắc tính toán sau:

- **Tỷ lệ hoàn thành**: Tổng Giờ làm việc hàng ngày / Giờ làm việc dự kiến

```html
SUM(【Form hiện tại / Giờ làm việc hàng ngày / Giờ làm việc hôm nay】)  /  【Form hiện tại / Giờ làm việc dự kiến】
```

- **Giờ làm việc còn lại**: Giờ làm việc dự kiến - Tổng Giờ làm việc hàng ngày

```html
【Form hiện tại / Giờ làm việc dự kiến】 - SUM(【Form hiện tại / Giờ làm việc hàng ngày / Giờ làm việc hôm nay】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- Tương tự, chúng ta cũng cấu hình Giờ làm việc lý tưởng trong quy tắc liên động của Giờ làm việc hàng ngày

```html
  【Form hiện tại / Giờ làm việc dự kiến】 / 【Form hiện tại / Số ngày tác vụ kéo dài】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

Như vậy, chúng ta có thể tính toán tiến độ hoàn thành và Giờ làm việc còn lại của tác vụ theo thời gian thực.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 Tạo biểu đồ tỷ lệ tiến độ tác vụ (tùy chọn)

#### 11.6.1 Tạo [biểu đồ](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) tiến độ tác vụ

Tạo một Block biểu đồ mới, dùng để thống kê **tổng Giờ làm việc hàng ngày** và **tổng Giờ làm việc lý tưởng**, đồng thời hiển thị tiến độ tác vụ theo chiều ngày.

Giới hạn 【tác vụ liên kết/Id】 bằng 【ID bản ghi popup hiện tại】, để đảm bảo biểu đồ tiến độ phản ánh tình hình thực tế của tác vụ hiện tại.

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 Hiển thị thông tin cơ bản và biến đổi tiến độ

Cuối cùng, bạn còn nhớ [Block Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) của chúng ta không, chúng ta sử dụng Block `markdown` để hiển thị thông tin cơ bản và biến đổi tiến độ của tác vụ.

Sử dụng template [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars) để render phần trăm tiến độ:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

Trong đó cú pháp render động chọn [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars), bạn có thể tham khảo tài liệu chính thức để xem và học chi tiết cú pháp.

---

### 11.7 Tổng kết

Xin chúc mừng! Bây giờ chúng ta đã hoàn thành việc phân chia Subtask. Thông qua quản lý đa cấp, khai báo Giờ làm việc hàng ngày và hiển thị biểu đồ, có thể nhìn thấy rõ tiến độ hoàn thành tác vụ, giúp đội nhóm làm việc hiệu quả hơn. Cảm ơn bạn đã kiên nhẫn đọc, hãy tiếp tục cố gắng và cùng chờ đón [chương tiếp theo](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking) thú vị nhé!

---

Tiếp tục khám phá và phát huy hết khả năng sáng tạo của bạn! Nếu gặp vấn đề, đừng quên rằng bạn có thể tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận bất cứ lúc nào.
