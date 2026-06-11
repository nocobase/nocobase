# Chương 5: Tab và Block động

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Các bạn, chào mừng đến với Chương 5! Nội dung chương này rất thú vị, chúng ta sẽ thêm nhiều tính năng cho trang quản lý Task, hỗ trợ nhiều cách view khác nhau. Tin rằng bạn đã chờ đợi từ lâu rồi đúng không? Đừng vội, tôi sẽ từng bước đưa bạn thực hiện, như thường lệ, chúng ta cùng dễ dàng làm xong!

### 5.1 Container tab, chứa nhiều Block

Chúng ta đã tạo trang quản lý Task, nhưng để hệ thống trực quan hơn, chúng ta muốn Task có thể chuyển đổi các chế độ hiển thị khác nhau trong trang, ví dụ [**bảng**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table), [**kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**lịch**](https://docs-cn.nocobase.com/handbook/calendar), thậm chí [**Gantt chart**](https://docs-cn.nocobase.com/handbook/block-gantt). Tính năng tab của NocoBase cho phép chúng ta chuyển đổi các sắp xếp Block khác nhau trong cùng một trang, đừng lo, chúng ta thao tác từ từ.

- Tạo tab
  Trước tiên, chúng ta tạo tab.

1. **Thêm tab con**:

   - Mở trang quản lý Task của bạn trước đó, tạo một tab con trong trang. Tab đầu tiên chúng ta có thể đặt tên là **"View bảng"**, view này hiển thị Block danh sách Task chúng ta đã cài đặt.
2. **Tạo thêm một tab mới**:

   - Tiếp theo, chúng ta lại tạo một tab, gọi là **"View kanban"**. Chúng ta sẽ tạo Block kanban Task ở đây.
     ![Tạo tab](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

Đã sẵn sàng chưa? Chúng ta vào tạo các kiểu Block!

> **Giới thiệu Block**: Block là vật mang dữ liệu và nội dung, hiển thị dữ liệu lên website theo cách phù hợp, có thể đặt trong trang (Page), dialog (Modal) hoặc drawer (Drawer), nhiều Block có thể tự do kéo thả sắp xếp, qua việc liên tục thao tác dữ liệu trong Block có thể thực hiện nhiều cấu hình và hiển thị.
> Qua việc dùng tính năng Block trong NocoBase, áp dụng vào case học tập này, có thể nhanh chóng thực hiện và quản lý xây dựng trang và tính năng hệ thống, đồng thời Block có thể cài template tiện cho copy và reference, giảm đáng kể workload tạo Block.

### 5.2 Block kanban: Trạng thái Task nhìn vào là biết

[**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban) là một tính năng cực kỳ quan trọng trong hệ thống quản lý Task, nó cho phép bạn qua cách kéo thả trực quan quản lý trạng thái Task. Ví dụ, bạn có thể group theo trạng thái Task, trực tiếp thấy mỗi Task đang ở giai đoạn nào.

#### 5.2.1 Tạo Block kanban

1. **Bắt đầu tạo Block kanban mới**:

- Trong tab **View kanban**, click "Tạo Block", chọn bảng Task, tiếp theo sẽ xuất hiện một tùy chọn, hỏi bạn cần group Task theo Field nào.

2. **Chọn Field group**:

- Chúng ta chọn Field **trạng thái** đã tạo trước đó, group theo trạng thái Task. (Lưu ý, Field group chỉ có thể là kiểu ["Dropdown (single select)"](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) hoặc ["Radio button"](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group))

3. **Thêm Field sắp xếp**:

- Card trong kanban có thể qua Field sắp xếp để điều chỉnh thứ tự. Để thực hiện tính năng này, chúng ta cần tạo Field sắp xếp mới. Click "Thêm Field", tạo một Field tên **Sắp xếp trạng thái (status_sort)**.
- Field này dùng để định vị thứ tự lên xuống của card khi kéo thả kanban, giống như tọa độ, trái phải group là trạng thái khác nhau, vị trí lên xuống là giá trị sắp xếp. Sau này khi chúng ta kéo thả card, có thể từ form quan sát thay đổi giá trị sắp xếp.
  ![Tạo Block kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 Đánh dấu Field và Action

- Cuối cùng, nhớ đánh dấu các Field cần hiển thị trong Block kanban, ví dụ tên Task, trạng thái Task, v.v., đảm bảo thông tin card phong phú đầy đủ.

![Hiển thị Field kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 Dùng template: Copy và Reference

Sau khi tạo Block kanban, chúng ta cần tạo một **form thêm mới**. Ở đây, NocoBase cung cấp một tính năng cực kỳ tiện lợi — bạn có thể [**copy** hoặc **reference**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) template form trước đó, như vậy chúng ta không cần cấu hình lại mỗi lần.

#### 5.3.1 **Lưu form thành template**

- Trong form thêm mới trước đó của bạn, di chuột đến cấu hình form, click "Save as template". Bạn có thể đặt cho template một cái tên, ví dụ "Bảng Task_Form thêm mới".

![Lưu form thành template](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **Copy hoặc reference template**

Khi tạo form mới trong view kanban, bạn sẽ thấy hai tùy chọn: "**Copy template**" và "**Reference template**". Bạn có thể hỏi: Chúng có khác biệt gì?

- [**Copy template**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): Tương đương copy một bản sao form mới, bạn có thể độc lập sửa nó, không ảnh hưởng đến form gốc.
- [**Reference template**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): Là "mượn" trực tiếp form gốc, mọi sửa đổi đều sẽ đồng bộ đến các nơi khác reference template này. Ví dụ bạn sửa thứ tự Field, tất cả các form reference template này sẽ thay đổi theo.

![Copy và Reference template](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

Bạn có thể chọn copy hay reference template theo nhu cầu của mình. Thông thường, **Reference template** tiện hơn, vì bạn chỉ cần sửa một lần, tất cả các nơi đều sẽ đồng bộ có hiệu lực, cực kỳ tiết kiệm thời gian công sức.

### 5.4 Block lịch: Tiến độ Task nhìn vào là biết

Tiếp theo, hãy tạo một [**Block lịch**](https://docs-cn.nocobase.com/handbook/calendar), giúp bạn quản lý lịch trình thời gian của Task tốt hơn.

#### 5.4.1 Tạo view lịch

##### 5.4.1.1 **Tạo Field ngày mới**:

View lịch cần biết **ngày bắt đầu** và **ngày kết thúc** của Task, do đó chúng ta cần thêm hai Field mới trong bảng Task:

- **Ngày bắt đầu (start_date)**: Đánh dấu thời gian bắt đầu của Task.
- **Ngày kết thúc (end_date)**: Đánh dấu thời gian kết thúc của Task.

![Thêm Field ngày](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 Tạo Block lịch mới:

Quay lại view lịch, tạo một Block lịch, chọn bảng Task, và dùng Field **Ngày bắt đầu** và **Ngày kết thúc** vừa tạo. Như vậy, Task sẽ hiển thị trên lịch dưới dạng một khoảng thời gian liên tục, hiển thị trực quan tiến độ Task.

![Xây dựng view lịch](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 Trải nghiệm thao tác lịch:

Trên lịch, bạn có thể tùy ý kéo thả Task, click và edit thông tin chi tiết Task (đừng quên copy hoặc reference template).

![Thao tác lịch](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 Block Gantt chart: Vũ khí thần thánh quản lý tiến độ Task

Block cuối cùng là [**Block Gantt chart**](https://docs-cn.nocobase.com/handbook/block-gantt), nó là tool thường dùng trong quản lý dự án, giúp bạn theo dõi tiến độ và quan hệ phụ thuộc của Task.

#### 5.5.1 Tạo tab "View Gantt chart"

#### 5.5.2 **Thêm Field "Tỷ lệ hoàn thành"**:

Để Gantt chart hiển thị tiến độ Task tốt hơn, chúng ta cần thêm một Field, gọi là **Tỷ lệ hoàn thành (complete_percent)**. Field này dùng để ghi tiến độ hoàn thành của Task, giá trị mặc định là 0%.

![Thêm Field tỷ lệ hoàn thành](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **Tạo Block Gantt chart mới**:

Trong view Gantt chart, tạo một Block Gantt chart, chọn bảng Task, và cấu hình các Field ngày bắt đầu, ngày kết thúc và tỷ lệ hoàn thành liên quan.

![Xây dựng view Gantt chart](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **Trải nghiệm tính năng kéo thả Gantt chart**:

Trong Gantt chart, bạn có thể qua kéo thả Task để điều chỉnh tiến độ và thời gian của nó, ngày bắt đầu, ngày kết thúc và tỷ lệ hoàn thành của Task đều sẽ cập nhật theo.

![Kéo thả Gantt chart](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### Tóm tắt

Quá tuyệt! Bạn bây giờ đã nắm vững cách dùng nhiều Block trong NocoBase để hiển thị dữ liệu Task, bao gồm [**Block kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**Block lịch**](https://docs-cn.nocobase.com/handbook/calendar) và [**Block Gantt chart**](https://docs-cn.nocobase.com/handbook/block-gantt). Các Block này không chỉ khiến quản lý Task trực quan hơn, mà còn mang đến cho chúng ta sự linh hoạt rất lớn.

Nhưng đây mới chỉ là bắt đầu! Hãy tưởng tượng, trong một team, các thành viên khác nhau có thể có trách nhiệm khác nhau, làm sao đảm bảo mỗi người đều có thể hợp tác liền mạch? Làm sao đảm bảo an toàn dữ liệu đồng thời, để mỗi người chỉ thấy và thao tác nội dung liên quan đến mình?

Đã sẵn sàng chưa? Chúng ta đến chương sau: [Chương 6: Đối tác — Hợp tác không gián đoạn, kiểm soát linh hoạt](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions).

Xem cách qua thao tác đơn giản, để hợp tác team của chúng ta lên một tầm cao mới!

---

Tiếp tục khám phá, thỏa sức phát huy sáng tạo của bạn! Nếu gặp vấn đề, đừng quên có thể tra [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) để thảo luận bất cứ lúc nào.
