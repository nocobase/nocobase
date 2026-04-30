# Chương 6: Workflow — Cho hệ thống tự động làm việc

Chương trước chúng ta đã thêm quyền cho hệ thống, các vai trò khác nhau thấy nội dung khác nhau. Nhưng tất cả thao tác vẫn dựa vào con người làm thủ công — ticket mới đến phải tự đi xem, trạng thái thay đổi không ai biết.

Chương này, chúng ta dùng [Workflow](/workflow) của NocoBase để hệ thống **tự động làm việc** — cấu hình các node [đánh giá điều kiện](/workflow/nodes/condition) và [cập nhật tự động](/workflow/nodes/update), thực hiện chuyển trạng thái ticket tự động và ghi thời gian tạo tự động.

## 6.1 [Workflow](/workflow) là gì

Workflow chính là một bộ rule "Nếu… Thì…" tự động.

Lấy một ví dụ: Bạn cài chuông báo trên điện thoại, mỗi sáng 8 giờ kêu. Chuông báo chính là Workflow đơn giản nhất — **điều kiện thỏa mãn (đến 8 giờ), thì tự động thực hiện (kêu)**.

Workflow của NocoBase cũng là tư duy như vậy:

![06-workflows-2026-03-20-13-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-20-13-25-38.jpg)

- **[Trigger](/workflow/triggers/collection)**: Lối vào của Workflow. Ví dụ "có người tạo một ticket mới" hoặc "một dữ liệu nào đó được cập nhật"
- **Đánh giá điều kiện**: Bước lọc tùy chọn. Ví dụ "chỉ khi người xử lý không trống mới tiếp tục"
- **Action thực thi**: Bước thực sự làm việc. Ví dụ "gửi thông báo" hoặc "cập nhật một Field nào đó"

Action thực thi của Workflow có thể nối tiếp nhiều node, các kiểu node thường dùng có:

- **Kiểm soát luồng**: Đánh giá điều kiện, nhánh song song, vòng lặp, delay
- **Thao tác dữ liệu**: Thêm dữ liệu, cập nhật dữ liệu, query dữ liệu, xóa dữ liệu
- **Thông báo và bên ngoài**: Thông báo, HTTP request, tính toán

Tutorial này chỉ dùng vài cái thường gặp nhất, sau khi học cách kết hợp có thể ứng phó hầu hết các tình huống.

### Tổng quan các kiểu Trigger

NocoBase cung cấp nhiều kiểu Trigger, chọn khi tạo Workflow:

| Trigger | Mô tả | Tình huống điển hình |
|-------|------|---------|
| [**Sự kiện bảng dữ liệu**](/workflow/triggers/collection) | Trigger khi dữ liệu được thêm, cập nhật hoặc xóa | Thông báo ticket mới, ghi lại thay đổi trạng thái |
| [**Task định kỳ**](/workflow/triggers/schedule) | Trigger theo Cron expression hoặc thời gian cố định | Tạo báo cáo ngày, dọn dẹp dữ liệu hết hạn định kỳ |
| [**Sự kiện sau Action**](/workflow/triggers/action) | Trigger sau khi Người dùng thực hiện Action trên giao diện | Gửi thông báo sau khi submit form, ghi log thao tác |
| **Phê duyệt** | Khởi động luồng phê duyệt, hỗ trợ phê duyệt nhiều cấp | Phê duyệt nghỉ phép, phê duyệt mua sắm |
| **Action tùy chỉnh** | Gắn vào nút tùy chỉnh, click để trigger | Lưu trữ một bước, thao tác hàng loạt |
| **Sự kiện trước Action** | Chặn thao tác Người dùng, thực thi đồng bộ trước rồi mới cho qua | Validate trước submit, tự động bổ sung Field |
| **AI Employee** | Cung cấp Workflow làm tool cho AI Employee gọi | AI tự động thực hiện thao tác nghiệp vụ |

Tutorial này sẽ dùng hai loại Trigger là **Sự kiện bảng dữ liệu** và **Sự kiện Action tùy chỉnh**, các kiểu khác cách dùng tương tự, sau khi học có thể suy ra một biết hai.

Workflow của NocoBase là Plugin tích hợp sẵn, không cần cài đặt thêm, hộp ra là dùng.

## 6.2 Tình huống một: Ticket mới tự động thông báo người xử lý

**Yêu cầu**: Khi có người tạo một ticket mới, và đã chỉ định người xử lý, hệ thống tự động gửi cho người xử lý một tin nhắn nội bộ, để họ biết "có việc đến rồi".

### Bước 1: Tạo Workflow

Mở menu cấu hình Plugin ở góc trên bên phải, vào **Quản lý Workflow**.

![06-workflows-2026-03-14-23-50-45](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-50-45.png)


Click **Tạo mới**, trong dialog hiện ra:

- **Tên**: Điền "Ticket mới thông báo người xử lý"
- **Kiểu Trigger**: Chọn **Sự kiện bảng dữ liệu**

![06-workflows-2026-03-14-23-53-37](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-53-37.png)


Sau khi submit, click link **Cấu hình** trong danh sách, vào trang chỉnh sửa luồng.

### Bước 2: Cấu hình Trigger

Click thẻ Trigger ở trên cùng, mở drawer cấu hình:

- **[Bảng dữ liệu](/data-sources/data-modeling/collection)**: Chọn data source chính / "Ticket"
- **Thời điểm trigger**: Chọn "Sau khi thêm hoặc cập nhật dữ liệu"
- **[Field](/data-sources/data-modeling/collection-fields) thay đổi**: Đánh dấu "Người xử lý (Assignee)" — chỉ khi Field người xử lý thay đổi mới trigger, tránh sửa các Field khác sinh thông báo không cần thiết (khi thêm dữ liệu, tất cả Field đều được coi là thay đổi, nên tạo ticket mới cũng sẽ trigger)
- **Trigger khi thỏa các điều kiện sau**: Chế độ chọn "Thỏa **bất kỳ** điều kiện nào trong nhóm", thêm hai điều kiện:
  - `assignee_id` không trống
  - `Assignee / ID` không trống

  > Tại sao phải cấu hình hai điều kiện? Vì khi trigger trong form có thể chỉ có foreign key (assignee_id) mà chưa query được object liên kết, cũng có thể có object liên kết nhưng Field foreign key trống. Hai điều kiện dùng quan hệ OR, đảm bảo chỉ cần đã chỉ định người xử lý là chắc chắn trigger.

- **Pre-load dữ liệu liên kết**: Đánh dấu "Assignee" — node thông báo sau cần dùng thông tin của người xử lý, bắt buộc phải load trước trong Trigger

![06-workflows-2026-03-14-23-58-31](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-58-31.png)

Click lưu. Như vậy, bản thân Trigger đã hoàn thành đánh giá điều kiện — chỉ trigger khi người xử lý không trống, không cần thêm node đánh giá điều kiện riêng.

### Bước 3: Thêm node thông báo

Click **+** phía dưới Trigger, chọn node **Thông báo**.

![06-workflows-2026-03-15-00-00-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-00-55.png)

Mở cấu hình node thông báo, mục đầu tiên là chọn **Channel thông báo** — nhưng chúng ta chưa tạo channel nào, dropdown trống. Đi tạo một cái trước.

![06-workflows-2026-03-15-00-10-12](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-10-12.png)


### Bước 4: Tạo channel thông báo

NocoBase hỗ trợ nhiều kiểu channel thông báo:

| Kiểu channel | Mô tả |
|---------|------|
| **Tin nội bộ** | Thông báo trong trình duyệt, push thời gian thực đến trung tâm thông báo của Người dùng |
| **Email** | Gửi email qua SMTP, cần cấu hình mail server |

Tutorial này dùng channel **tin nội bộ** đơn giản nhất:

1. Mở cài đặt Plugin ở góc trên bên phải, vào **Quản lý thông báo**
2. Click **Tạo channel mới**

![06-workflows-2026-03-15-00-13-07](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-13-07.png)

3. Kiểu channel chọn **Tin nội bộ**, điền tên channel (như "Tin nội bộ hệ thống")
4. Lưu

![06-workflows-2026-03-15-00-17-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-17-55.png)

### Bước 5: Cấu hình node thông báo

Quay lại trang chỉnh sửa Workflow, mở cấu hình node thông báo.

Node thông báo có các tùy chọn cấu hình sau:

- **Channel thông báo**: Chọn "Tin nội bộ hệ thống" vừa tạo
- **Người nhận**: Click chọn Query Người dùng → "id = Biến trigger / Dữ liệu trigger / Người phụ trách / ID"
- **Tiêu đề**: Điền tiêu đề thông báo, như "Bạn có một ticket mới chờ xử lý". Hỗ trợ chèn biến, ví dụ thêm tiêu đề ticket: `Ticket mới: {{Dữ liệu trigger / Tiêu đề}}`
- **Nội dung**: Điền nội dung thông báo, tương tự có thể chèn biến tham chiếu các Field như mức độ ưu tiên, mô tả của ticket

![06-workflows-2026-03-15-20-10-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-10-11.png)

(Bước tiếp theo chúng ta đi tìm địa chỉ ticket, trước khi thoát popup, hãy nhớ lưu trước!)

- **Trang chi tiết desktop**: Điền đường dẫn URL của trang chi tiết ticket. Cách lấy: Ở frontend mở popup chi tiết của bất kỳ ticket nào, sao chép đường dẫn từ thanh địa chỉ trình duyệt, định dạng tương tự `/admin/camcwbox2uc/view/d8f8e122d37/filterbytk/353072988225540`. Dán đường dẫn vào ô cấu hình, trong đó số sau `filterbytk/` chính là ID ticket — thay phần này thành biến ID của dữ liệu trigger là được (click selector biến → Dữ liệu trigger → ID). Sau khi cấu hình, Người dùng click vào thông báo trong danh sách thông báo có thể trực tiếp nhảy đến trang chi tiết ticket tương ứng, đồng thời tự động đánh dấu là đã đọc

![06-workflows-2026-03-15-00-28-32](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-28-32.png)

![06-workflows-2026-03-15-20-15-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-15-19.png)

- **Tiếp tục khi gửi thất bại**: Tùy chọn, đánh dấu xong dù thông báo gửi thất bại, Workflow cũng không bị gián đoạn

> Sau khi thông báo được gửi đi, người xử lý có thể thấy tin nhắn này trong **Trung tâm thông báo** ở góc trên bên phải trang, chưa đọc còn có chấm đỏ nhắc nhở. Click thông báo có thể nhảy đến trang chi tiết ticket xem thông tin đầy đủ.

### Bước 6: Test và bật

> Luồng hoàn chỉnh của tình huống một chỉ có hai node: Trigger (kèm lọc điều kiện) → Thông báo. Đơn giản trực tiếp.

Khoan vội bật — Workflow cung cấp tính năng **thực thi thủ công**, có thể dùng dữ liệu chỉ định để test luồng có đúng không:

1. Click nút **Thực thi** ở góc trên bên phải (không phải công tắc bật)
2. Chọn một dữ liệu ticket có sẵn làm dữ liệu trigger
  > Nếu trong ô chọn ticket hiển thị là id, trong Data source > Bảng dữ liệu > Ticket, cài cột "Tiêu đề" làm Field tiêu đề là được
![06-workflows-2026-03-15-19-47-57](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-47-57.png)

3. Click thực thi, Workflow sẽ thực thi và tự động chuyển sang phiên bản mới đã sao chép
![06-workflows-2026-03-15-19-57-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-57-19.png)

4. Click ba chấm ở góc trên bên phải, chọn lịch sử thực thi. Lúc này sẽ thấy bản ghi thực thi vừa rồi, sau khi click xem, có thể thấy chi tiết thực thi, bao gồm tình huống trigger, chi tiết thực thi của mỗi node, tham số.
![06-workflows-2026-03-15-19-58-34](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-58-34.png)

![06-workflows-2026-03-15-20-01-02](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-01-02.png)


5. Ticket vừa rồi có vẻ là cho Alice, chúng ta chuyển sang tài khoản của Alice xem, đã nhận thành công!

![06-workflows-2026-03-15-20-16-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-22.png)

Click có thể nhảy đến trang ticket đích, đồng thời thông báo sẽ tự động được đánh dấu là đã đọc.

![06-workflows-2026-03-15-20-16-54](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-54.png)


Sau khi xác nhận luồng không có vấn đề, click công tắc **Bật/Tắt** ở góc trên bên phải, chuyển Workflow sang trạng thái bật.

![06-workflows-2026-03-15-20-18-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-18-16.png)

> **Lưu ý**: Workflow một khi đã được thực thi (bao gồm thực thi thủ công), sẽ trở thành trạng thái **chỉ đọc** (xám), không thể chỉnh sửa nữa. Nếu cần sửa, click **"Sao chép sang phiên bản mới"** ở góc trên bên phải, tiếp tục chỉnh sửa trên phiên bản mới. Phiên bản cũ sẽ tự động tắt.

![06-workflows-2026-03-15-20-19-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-19-11.png)

Quay lại trang ticket, tạo một ticket mới, nhớ chọn một người xử lý. Sau đó chuyển sang tài khoản người xử lý đăng nhập, kiểm tra trung tâm thông báo — sẽ thấy một thông báo mới.

![06-workflows-2026-03-15-20-22-00](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-22-00.gif)

Chúc mừng, luồng tự động đầu tiên đã chạy!

## 6.3 Tình huống hai: Thay đổi trạng thái tự động ghi thời gian hoàn thành

**Yêu cầu**: Khi trạng thái ticket đổi thành "Đã hoàn thành", hệ thống tự động điền thời gian hiện tại vào Field "Thời gian hoàn thành". Như vậy không cần ghi thủ công, cũng không quên.

> Nếu bạn còn chưa tạo Field "Thời gian hoàn thành" trong bảng ticket, hãy đến **Quản lý bảng dữ liệu → Ticket** thêm một Field kiểu **Ngày**, đặt tên là "Thời gian hoàn thành" trước. Các bước cụ thể tham khảo cách tạo Field ở Chương 2, ở đây không lặp lại.
> ![06-workflows-2026-03-15-20-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-25-38.png)

### Bước 1: Tạo Workflow mới

Quay lại trang Quản lý Workflow, click tạo mới:

- **Tên**: Điền "Ticket hoàn thành tự động ghi thời gian"
- **Kiểu Trigger**: Chọn **Sự kiện Action tùy chỉnh** (trigger khi Người dùng click nút đã bind Workflow này)
- **Chế độ thực thi**: Đồng bộ
> Về đồng bộ và bất đồng bộ:
> - Bất đồng bộ: Sau khi thao tác, chúng ta có thể tiếp tục làm việc khác, Workflow tự động thực thi xong sẽ thông báo cho chúng ta kết quả
> - Đồng bộ: Sau khi thao tác, giao diện sẽ ở chế độ chờ, chờ Workflow thực thi xong chúng ta mới có thể làm việc khác

![06-workflows-2026-03-19-22-56-34](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-56-34.png)

### Bước 2: Cấu hình Trigger

Mở cấu hình Trigger:

- **Bảng dữ liệu**: Chọn "Ticket"
- **Chế độ thực thi**: Chọn **Chế độ một hàng** (mỗi lần chỉ xử lý ticket được click hiện tại)

![06-workflows-2026-03-19-22-58-21](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-58-21.png)

<!-- TODO: Bổ sung ảnh chụp cấu hình Trigger -->


### Bước 3: Thêm đánh giá điều kiện

Khác với Trigger sự kiện bảng dữ liệu bản thân đã chứa điều kiện đánh giá, chúng ta cần tự thêm node đánh giá điều kiện:

![06-workflows-2026-03-15-20-39-14](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-39-14.png)

Chúng ta khuyến nghị chọn "'Có' và 'Không' tiếp tục riêng", để tiện cho việc mở rộng sau này.

- Điều kiện: **Dữ liệu trigger → Trạng thái** không bằng **Đã hoàn thành** (tức là chỉ ticket chưa hoàn thành mới được qua, đã hoàn thành không xử lý lặp lại)

![06-workflows-2026-03-19-22-37-59](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-37-59.png)

### Bước 4: Thêm node cập nhật dữ liệu

Trên nhánh "Có" của đánh giá điều kiện, click **+**, chọn node **Cập nhật dữ liệu**:

![06-workflows-2026-03-15-20-46-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-46-22.png)

- **Bảng dữ liệu**: Chọn "Ticket"
- **Điều kiện lọc**: ID bằng Dữ liệu trigger → ID (đảm bảo chỉ cập nhật ticket hiện tại)
- **Giá trị Field**:
  - Trạng thái = **Đã hoàn thành**
  - Thời gian hoàn thành = **Biến hệ thống / Thời gian hệ thống**

![06-workflows-2026-03-19-22-39-27](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-39-27.png)

> Như vậy một node đã đồng thời hoàn thành hai việc "đổi trạng thái" và "ghi thời gian", không cần cấu hình giá trị Field riêng trên nút.

### Bước 5: Tạo nút Action "Hoàn thành"

Workflow đã cấu hình xong, nhưng "sự kiện Action tùy chỉnh" cần được bind vào một nút Action cụ thể mới trigger. Chúng ta tạo một nút "Hoàn thành" chuyên dụng trong cột Action của danh sách ticket:

1. Vào chế độ UI editor, trong cột Action của bảng ticket, click **"+"**, chọn nút Action **"Trigger Workflow"**

![06-workflows-2026-03-19-22-41-31](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-41-31.png)

2. Click tùy chọn cấu hình nút, sửa tiêu đề thành **"Hoàn thành"**, và chọn một biểu tượng nhỏ liên quan đến hoàn thành (như biểu tượng tick)

![06-workflows-2026-03-19-22-43-39](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-43-39.png)

3. Cấu hình **linkage rule** cho nút: Khi trạng thái ticket đã là "Đã hoàn thành", ẩn nút này (ticket đã hoàn thành không cần click "Hoàn thành" nữa)
   - Điều kiện: Dữ liệu hiện tại → Trạng thái bằng Đã hoàn thành
   - Action: Ẩn

![06-workflows-2026-03-15-21-15-29](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-15-29.png)

4. Mở **"Bind Workflow"** trong tùy chọn cấu hình nút, chọn Workflow "Ticket hoàn thành tự động ghi thời gian" vừa tạo

![06-workflows-2026-03-19-23-00-53](https://static-docs.nocobase.com/06-workflows-2026-03-19-23-00-53.png)

### Bước 6: Cấu hình refresh event flow

Nút đã tạo xong, nhưng sau khi click bảng sẽ không tự refresh — Người dùng không thấy thay đổi trạng thái. Chúng ta cần cấu hình **event flow** của nút, để nó tự động refresh bảng sau khi Workflow thực thi xong.

1. Click biểu tượng tia chớp (⚡) thứ hai trong tùy chọn cấu hình nút, mở cấu hình **event flow**
2. Cấu hình sự kiện trigger:
   - **Sự kiện trigger**: Chọn **Click**
   - **Thời điểm thực thi**: Chọn **Sau tất cả các flow**
3. Click **"Append step"**, chọn **"Refresh target Block"**

![06-workflows-2026-03-20-16-46-59](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-46-59.png)

4. Tìm bảng ticket trong trang hiện tại, mở menu cấu hình của nó, chọn **"Sao chép UID"** ở dưới cùng, dán UID vào Block đích của bước refresh

![06-workflows-2026-03-20-16-48-39](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-48-39.png)

Như vậy, sau khi click nút "Hoàn thành", Workflow thực thi xong, bảng sẽ tự động refresh, Người dùng ngay lập tức có thể thấy thay đổi của trạng thái và thời gian hoàn thành.

### Bước 7: Bật và test

Quay lại trang Quản lý Workflow, bật Workflow "Ticket hoàn thành tự động ghi thời gian".

Sau đó mở một ticket có trạng thái "Đang xử lý", trong cột Action click nút **"Hoàn thành"**. Có thể thấy:

- Field "Thời gian hoàn thành" của ticket tự động điền thời gian hiện tại
- Bảng tự động refresh, nút "Hoàn thành" trên ticket này đã biến mất (linkage rule có hiệu lực)

![06-workflows-2026-03-15-21-25-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-11.gif)

Có tiện không? Đây chính là cách dùng phổ biến thứ hai của Workflow — **cập nhật dữ liệu tự động**. Hơn nữa thông qua cách "Sự kiện Action tùy chỉnh + bind nút", chúng ta đã thực hiện một cơ chế trigger chính xác: chỉ click nút cụ thể mới thực thi Workflow.

## 6.4 Xem lịch sử thực thi

Workflow đã chạy bao nhiêu lần? Có lỗi không? NocoBase đều ghi lại cho bạn.

Trong danh sách Quản lý Workflow, đằng sau mỗi Workflow đều có một link số **số lần thực thi**. Click vào, có thể thấy bản ghi chi tiết của mỗi lần thực thi:

- **Trạng thái thực thi**: Thành công (xanh lá) hay thất bại (đỏ), nhìn vào là biết
- **Thời gian trigger**: Trigger lúc nào
- **Chi tiết node**: Click vào có thể thấy kết quả thực thi của mỗi node

![06-workflows-2026-03-15-21-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-38.png)

Nếu một lần thực thi nào đó thất bại, click vào chi tiết có thể thấy node nào có vấn đề, cũng như thông báo lỗi cụ thể. Đây là tool quan trọng nhất để debug Workflow.

![06-workflows-2026-03-15-21-36-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-36-16.png)

## Tóm tắt

Chương này chúng ta đã tạo hai Workflow đơn giản nhưng thực dụng:

- **Thông báo ticket mới** (trigger Sự kiện bảng dữ liệu): Tự động thông báo sau khi tạo mới hoặc thay đổi người xử lý, không cần phải hô hào thủ công
- **Tự động ghi thời gian hoàn thành** (trigger Sự kiện Action tùy chỉnh): Tự động điền thời gian sau khi click nút "Hoàn thành", chấm dứt sót do con người

Hai Workflow lần lượt minh họa hai cách trigger khác nhau, cộng lại không đến 10 phút cấu hình, hệ thống đã có thể tự động làm việc. NocoBase còn hỗ trợ nhiều kiểu node hơn (HTTP request, tính toán, vòng lặp, v.v.), nhưng đối với người mới bắt đầu, nắm được các kết hợp này đã đủ ứng phó hầu hết tình huống.

## Xem trước chương sau

Hệ thống đã có thể tự động làm việc, nhưng chúng ta vẫn còn thiếu một "góc nhìn toàn cục" — tổng cộng có bao nhiêu ticket? Phân loại nào nhiều nhất? Mỗi ngày có bao nhiêu ticket mới? Chương sau chúng ta sẽ dùng [Block](/interface-builder/blocks) biểu đồ để xây dựng một **Dashboard dữ liệu**, nhìn toàn cục bằng một cái liếc.

## Tài nguyên liên quan

- [Tổng quan Workflow](/workflow) — Khái niệm cốt lõi và tình huống sử dụng Workflow
- [Trigger sự kiện bảng dữ liệu](/workflow/triggers/collection) — Cấu hình trigger thay đổi dữ liệu
- [Node cập nhật dữ liệu](/workflow/nodes/update) — Cấu hình cập nhật dữ liệu tự động
