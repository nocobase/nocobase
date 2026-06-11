# Chương 9: Kanban task và biểu đồ

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Các bạn thân mến, cuối cùng chúng ta đã đến chương trực quan hóa được mong chờ! Trong chương này, chúng ta sẽ tìm hiểu cách nhanh chóng tập trung vào nội dung mình thực sự cần trong vô vàn thông tin. Là người quản lý, chúng ta không thể lạc lối trong các task phức tạp! Hãy cùng nhau dễ dàng giải quyết thống kê task và hiển thị thông tin.

### 9.1 Tập trung thông tin chính

Chúng ta muốn dễ dàng nắm tổng quan tình hình task của nhóm, tìm thấy các task mình chịu trách nhiệm hoặc quan tâm, thay vì lang thang trong đống thông tin phiền phức.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Trước tiên, hãy xem cách tạo một [biểu đồ](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) thống kê task của nhóm.

#### 9.1.1 Tạo [Block dữ liệu biểu đồ](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

Tạo một trang mới (ví dụ Bảng điều khiển cá nhân):

1. Tạo Block dữ liệu biểu đồ mới. (Lưu ý trong Block lớn này, chúng ta có thể tạo rất nhiều biểu đồ dữ liệu)
2. Trong Block biểu đồ, chọn mục tiêu của chúng ta: bảng task. Cùng vào cấu hình biểu đồ.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Cấu hình thống kê trạng thái

Nếu chúng ta muốn thống kê số lượng task theo trạng thái khác nhau, làm sao đây? Trước tiên, chúng ta cần xử lý dữ liệu:

- Số liệu: Chọn một Field duy nhất, ví dụ Field ID để đếm.
- Chiều: Sử dụng trạng thái để nhóm.

Tiếp theo, cấu hình biểu đồ:

1. Chọn [biểu đồ cột](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) hoặc [biểu đồ thanh](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. Trục X chọn trạng thái, trục Y chọn ID. Nhớ chọn Field phân loại "Trạng thái"! (Nếu không chọn, màu của biểu đồ không thể phân biệt, có thể khó nhận biết.)

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Thống kê đa chiều: số lượng task của từng người

Nếu chúng ta muốn thống kê số lượng từng trạng thái của từng người, hãy thực hiện thống kê hai chiều! Chúng ta có thể thêm chiều "Người chịu trách nhiệm/Biệt danh".

1. Nhấn "Thực thi truy vấn" ở góc trên bên trái.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. Bạn sẽ thấy biểu đồ có thể hơi lạ, dường như không phải hiệu quả mong muốn. Không sao, chọn "Nhóm" có thể mở rộng so sánh các người chịu trách nhiệm khác nhau.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Đồng thời, nếu muốn hiển thị xếp chồng tổng số lượng, có thể chọn "Xếp chồng". Như vậy, chúng ta có thể thấy tỷ lệ số task của từng người + tình hình task tổng thể!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Lọc dữ liệu và hiển thị động

#### 9.2.1 Cấu hình lọc dữ liệu

Tất nhiên, chúng ta còn có thể tiếp tục loại bỏ dữ liệu "Đã hủy" và "Đã lưu trữ", chỉ cần bỏ hai tùy chọn này trong điều kiện lọc bên trái, tin rằng bạn đã rất quen thuộc với những phán đoán điều kiện này!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

Sau khi lọc xong, nhấn xác nhận, thoát cấu hình, biểu đồ đầu tiên trong trang đã được xây dựng xong.

#### 9.2.2 [Sao chép biểu đồ](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

Nếu bạn muốn hiển thị đồng thời biểu đồ "Nhóm" và "Xếp chồng", lại không muốn cấu hình lại thì sao?

- Chúng ta nhấn vào sao chép ở góc trên bên phải block biểu đồ đầu tiên
- Cuộn xuống dưới, biểu đồ thứ hai đã xuất hiện, kéo nó sang phải, bỏ cấu hình "Xếp chồng", thay đổi thành "Nhóm".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 [Lọc](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) động

Nếu chúng ta muốn [lọc](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) động dữ liệu task theo các điều kiện khác nhau, có thể không?

Tất nhiên! Chúng ta mở "Lọc" dưới Block dữ liệu biểu đồ, hộp lọc đã xuất hiện ở phía trên, hãy hiển thị các Field mong muốn và thiết lập điều kiện lọc của Field. (Ví dụ thay đổi Field ngày thành "Trong khoảng")

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Tạo Field lọc tùy chỉnh

Nếu chúng ta còn muốn trong tình huống đặc biệt, bao gồm dữ liệu "Đã hủy" và "Đã lưu trữ" thì sao, và cần hỗ trợ lọc động, thiết lập điều kiện lọc mặc định?

Cùng tạo một [Field lọc tùy chỉnh](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)!

> Field lọc tùy chỉnh: Bạn có thể chọn Field trong bảng dữ liệu liên kết hoặc Field tùy chỉnh (chỉ khả dụng trong biểu đồ).
>
> Hỗ trợ chỉnh sửa tiêu đề, mô tả, toán tử lọc Field, và thiết lập giá trị mặc định (như Người dùng hiện tại hoặc ngày), giúp lọc phù hợp hơn với nhu cầu thực tế của bạn.

1. Tiêu đề điền "Trạng thái".
2. Field nguồn để trống.
3. Component chọn "Hộp kiểm".
4. Tùy chọn điền theo giá trị thuộc tính trạng thái khi tạo cơ sở dữ liệu (lưu ý thứ tự thuộc tính ở đây là nhãn tùy chọn - giá trị tùy chọn).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

Tạo thành công, nhấn "Thiết lập giá trị mặc định", chọn các tùy chọn cần thiết

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

Sau khi thiết lập giá trị mặc định, quay lại cấu hình biểu đồ, đổi điều kiện lọc thành "Trạng thái - Bao gồm bất kỳ - Lọc hiện tại/Trạng thái", sau đó xác nhận! (Cả hai biểu đồ đều phải đổi)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

Xong, chúng ta kiểm thử lọc, dữ liệu đã được hiển thị hoàn hảo.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Liên kết động và lọc task

Tiếp theo, chúng ta sẽ thực hiện một chức năng cực kỳ hữu ích: thông qua nhấn vào số thống kê, chuyển thẳng đến lọc của task tương ứng. Vì vậy, trước tiên chúng ta thêm biểu đồ thống kê số lượng từng trạng thái, đặt chúng trên cùng.

#### 9.3.1 Lấy "Chưa bắt đầu" làm ví dụ, tạo [biểu đồ thống kê](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. Thiết lập số liệu là: Đếm ID
2. Thiết lập điều kiện lọc: Trạng thái bằng "Chưa bắt đầu"
3. Tên container điền "Chưa bắt đầu", loại chọn "Thống kê", tên biểu đồ ở dưới để trống.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

Thống kê chưa bắt đầu đã hiển thị thành công. Chúng ta sao chép năm bản theo trạng thái và kéo lên trên cùng

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Cấu hình lọc liên kết

1. Quay lại trang chứa Block bảng quản lý task, xem định dạng liên kết ở phía trên trình duyệt (thường tương tự `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Giả sử `xxxxxxxxx` là tên miền website của bạn, `/admin/0z9e0um1vcn` là đường dẫn. (Chúng ta tìm `/admin` cuối cùng là được)
2. Sao chép một phần của liên kết

   - Chúng ta cần thực hiện chuyển hướng liên kết. Để làm được điều này, trước tiên cần trích xuất một phần cụ thể từ liên kết.
   - Bắt đầu từ `admin/` (lưu ý không bao gồm chữ `admin/`), sao chép đến cuối liên kết. Ví dụ, trong ví dụ này, phần chúng ta cần sao chép là: `0z9e0um1vcn`

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

Chúng ta di chuyển chuột đến "Chưa bắt đầu", sẽ thấy chuột đã chuyển thành hình ngón tay, chúng ta nhấn một cái, chuyển hướng thành công.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Cấu hình liên kết của biểu đồ
   Bây giờ, hãy thêm tham số lọc cho liên kết. Còn nhớ định danh cơ sở dữ liệu của trạng thái task chứ? Chúng ta sẽ thêm tham số này vào cuối liên kết, làm như vậy có thể lọc task thêm.
   - Thêm `?task_status=Not started` vào cuối liên kết, như vậy liên kết của bạn sẽ thành: `0z9e0um1vcn?task_status=Not started`
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Hiểu định dạng truyền tham số URL:
> Khi thêm tham số trong liên kết, có một số quy tắc định dạng cần tuân theo:
>
> - **Dấu chấm hỏi (?)**: Bắt đầu của tham số.
> - **Tên tham số và giá trị tham số**: Định dạng là `tên tham số=giá trị tham số`.
> - **Nhiều tham số**: Nếu cần thêm nhiều tham số, có thể nối chúng bằng ký hiệu `&`, ví dụ:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Trong ví dụ này, `user` là tên một tham số khác, `123` là giá trị tương ứng.

4. Quay lại trang, nhấn để chuyển hướng, thành công, URL phía sau đã có tham số chúng ta muốn

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [Liên kết điều kiện lọc URL](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

Tại sao bảng vẫn chưa thay đổi theo? Đừng lo, cùng hoàn thành bước cuối cùng!

- Quay lại cấu hình Block bảng, nhấn "Thiết lập phạm vi dữ liệu".
- Chọn "Trạng thái" bằng "Tham số truy vấn URL/status".

Nhấn xác nhận, lọc thành công!

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Trực quan hóa dữ liệu](https://docs-cn.nocobase.com/handbook/data-visualization): Biểu đồ ấn tượng

> Trực quan hóa dữ liệu: [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (plugin thương mại, có phí)
> ECharts cung cấp nhiều tùy chọn cấu hình cá nhân hóa hơn, như "[biểu đồ đường](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line) (đa chiều)", "[biểu đồ radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)", "[mây từ khóa](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)"...

Nếu bạn muốn lấy thêm cấu hình biểu đồ, có thể bật Block "Trực quan hóa dữ liệu: ECharts"!

#### 9.4.1 Cấu hình nhanh một [biểu đồ radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar) ấn tượng

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Nếu phát hiện dữ liệu bị che, nhớ điều chỉnh kích thước hoặc bán kính, đảm bảo tất cả thông tin có thể được hiển thị rõ ràng!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

Sau khi cấu hình xong kéo thả cách hiển thị, hoàn thành!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Nhiều container biểu đồ hơn

Còn nhiều biểu đồ chờ bạn khám phá.

##### [Biểu đồ mây từ khóa](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Biểu đồ phễu](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Nhiều chỉ số (biểu đồ trục đôi, biểu đồ đường ECharts)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

Đối với biểu đồ trục đôi, bạn có thể thêm nhiều chỉ số

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Biểu đồ thanh đối lập](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Thử thách nhỏ

Trước khi kết thúc chương này, đưa ra một thử thách nhỏ:

1. Thêm tham số URL cho **Đang tiến hành, Chờ duyệt, Đã hoàn thành, Đã hủy, Đã lưu trữ** còn lại, để chúng có thể chuyển hướng và lọc thuận lợi.
2. Cấu hình Field đa chọn "Người chịu trách nhiệm", giống như chúng ta đã làm với đa chọn "Trạng thái", giá trị mặc định thiết lập là biệt danh Người dùng hiện tại.

[Chương tiếp theo](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) chúng ta sẽ tiếp tục mở phần tiếp theo của Dashboard, mong gặp lại các bạn!

---

Tiếp tục khám phá, thỏa sức sáng tạo! Nếu gặp vấn đề, đừng quên bạn có thể tham khảo [Tài liệu chính thức NocoBase](https://docs-cn.nocobase.com/) hoặc tham gia [Cộng đồng NocoBase](https://forum.nocobase.com/) bất cứ lúc nào để thảo luận.
