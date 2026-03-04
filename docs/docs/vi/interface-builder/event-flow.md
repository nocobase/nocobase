:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/interface-builder/event-flow).
:::

# Luồng sự kiện

## Giới thiệu

Nếu bạn muốn kích hoạt một số thao tác tùy chỉnh khi một biểu mẫu thay đổi, bạn có thể sử dụng luồng sự kiện để thực hiện. Ngoài biểu mẫu, các trang, khối, nút và trường đều có thể sử dụng luồng sự kiện để cấu hình một số thao tác tùy chỉnh.

## Cách sử dụng

Dưới đây là một ví dụ đơn giản để minh họa cách cấu hình luồng sự kiện. Hãy cùng thực hiện liên kết giữa hai bảng, khi nhấp vào một hàng của bảng bên trái, dữ liệu của bảng bên phải sẽ tự động được lọc.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Các bước cấu hình như sau:

1. Nhấp vào biểu tượng "tia chớp" ở góc trên bên phải của khối bảng bên trái để mở giao diện cấu hình luồng sự kiện.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Nhấp vào "Thêm luồng sự kiện (Add event flow)", "Sự kiện kích hoạt" chọn "Nhấp vào hàng", nghĩa là kích hoạt khi nhấp vào hàng của bảng.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Cấu hình "Thời điểm thực thi", dùng để kiểm soát thứ tự của luồng sự kiện này so với quy trình tích hợp sẵn của hệ thống. Thông thường hãy giữ mặc định; nếu muốn thông báo/chuyển hướng sau khi logic tích hợp sẵn thực thi xong, có thể chọn "Sau tất cả các luồng". Xem thêm giải thích bên dưới tại [Thời điểm thực thi](#thời-điểm-thực-thi).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Điều kiện kích hoạt (Trigger condition)" dùng để cấu hình các điều kiện, luồng sự kiện chỉ được kích hoạt khi đáp ứng điều kiện. Ở đây chúng ta không cần cấu hình, chỉ cần nhấp vào hàng là sẽ kích hoạt luồng sự kiện.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Di chuột đến "Thêm bước (Add step)", có thể thêm một số bước thao tác. Chúng ta chọn "Đặt phạm vi dữ liệu (Set data scope)" để thiết lập phạm vi dữ liệu cho bảng bên phải.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Sao chép UID của bảng bên phải, điền vào ô nhập "UID khối mục tiêu (Target block UID)". Ngay bên dưới sẽ hiển thị một giao diện cấu hình điều kiện, tại đây có thể cấu hình phạm vi dữ liệu cho bảng bên phải.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Hãy cùng cấu hình một điều kiện như hình dưới đây:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Sau khi cấu hình xong phạm vi dữ liệu, cần phải làm mới khối thì kết quả lọc mới hiển thị. Tiếp theo hãy cấu hình làm mới khối bảng bên phải. Thêm một bước "Làm mới khối mục tiêu (Refresh target blocks)", sau đó điền UID của bảng bên phải.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Cuối cùng nhấp vào nút lưu ở góc dưới bên phải, việc cấu hình đã hoàn tất.

## 事件详解 (Chi tiết sự kiện)

### Trước khi hiển thị (Before render)

Sự kiện chung, có thể sử dụng trong trang, khối, nút hoặc trường. Trong sự kiện này, có thể thực hiện một số công việc khởi tạo. Ví dụ: cấu hình các phạm vi dữ liệu khác nhau trong các điều kiện khác nhau.

### Nhấp vào hàng (Row click)

Sự kiện dành riêng cho khối bảng. Kích hoạt khi nhấp vào hàng của bảng. Khi kích hoạt, một Clicked row record sẽ được thêm vào ngữ cảnh, có thể được sử dụng làm biến trong điều kiện và các bước.

### Giá trị biểu mẫu thay đổi (Form values change)

Sự kiện dành riêng cho khối biểu mẫu. Kích hoạt khi giá trị của trường biểu mẫu thay đổi. Có thể lấy giá trị của biểu mẫu thông qua biến "Current form" trong điều kiện và các bước.

### Nhấp (Click)

Sự kiện dành riêng cho nút. Kích hoạt khi nhấp vào nút.

## Thời điểm thực thi

Trong cấu hình luồng sự kiện, có hai khái niệm dễ gây nhầm lẫn:

- **Sự kiện kích hoạt:** Khi nào bắt đầu thực thi (ví dụ: Trước khi hiển thị, Nhấp vào hàng, Nhấp, Giá trị biểu mẫu thay đổi, v.v.).
- **Thời điểm thực thi:** Sau khi cùng một sự kiện kích hoạt xảy ra, **luồng sự kiện tùy chỉnh** của bạn sẽ được chèn vào vị trí nào trong **quy trình tích hợp sẵn** để thực thi.

### "Quy trình tích hợp sẵn / Bước tích hợp sẵn" là gì?

Nhiều trang, khối hoặc thao tác bản thân chúng đã đi kèm với một bộ quy trình xử lý tích hợp sẵn của hệ thống (ví dụ: gửi đi, mở cửa sổ bật lên, yêu cầu dữ liệu, v.v.). Khi bạn thêm luồng sự kiện tùy chỉnh cho cùng một sự kiện (ví dụ: "Nhấp"), "Thời điểm thực thi" dùng để quyết định:

- Thực thi luồng sự kiện của bạn trước, hay thực thi logic tích hợp sẵn trước;
- Hoặc chèn luồng sự kiện của bạn vào trước hoặc sau một bước nào đó của quy trình tích hợp sẵn để thực thi.

### Hiểu các tùy chọn thời điểm thực thi trong UI như thế nào?

- **Trước tất cả các luồng (mặc định):** Thực thi đầu tiên. Thích hợp để làm "chặn/chuẩn bị" (ví dụ: xác thực, xác nhận lại, khởi tạo biến, v.v.).
- **Sau tất cả các luồng:** Thực thi sau khi logic tích hợp sẵn hoàn tất. Thích hợp để làm "kết thúc/phản hồi" (ví dụ: thông báo tin nhắn, làm mới các khối khác, chuyển hướng trang, v.v.).
- **Trước luồng chỉ định / Sau luồng chỉ định:** Điểm chèn tinh vi hơn. Sau khi chọn cần chọn thêm "Quy trình tích hợp sẵn" cụ thể.
- **Trước bước luồng chỉ định / Sau bước luồng chỉ định:** Điểm chèn tinh vi nhất. Sau khi chọn cần chọn đồng thời "Quy trình tích hợp sẵn" và "Bước quy trình tích hợp sẵn".

> Gợi ý: Nếu bạn không chắc chắn nên chọn quy trình/bước tích hợp sẵn nào, hãy ưu tiên sử dụng hai mục đầu tiên ("Trước / Sau").

## Chi tiết các bước

### Biến tùy chỉnh (Custom variable)

Dùng để tùy chỉnh một biến, sau đó sử dụng trong ngữ cảnh.

#### Phạm vi tác dụng

Các biến tùy chỉnh có phạm vi tác dụng, ví dụ biến được định nghĩa trong luồng sự kiện của khối chỉ có thể dùng trong khối đó. Nếu muốn dùng được trong tất cả các khối của trang hiện tại, cần cấu hình trong luồng sự kiện của trang.

#### Biến biểu mẫu (Form variable)

Sử dụng giá trị của một khối biểu mẫu nào đó làm biến. Cấu hình cụ thể như sau:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Tiêu đề biến
- Variable identifier: Định danh biến
- Form UID: UID biểu mẫu

#### Các biến khác

Các biến khác sẽ lần lượt được hỗ trợ trong tương lai, hãy cùng chờ đón.

### Đặt phạm vi dữ liệu (Set data scope)

Thiết lập phạm vi dữ liệu của khối mục tiêu. Cấu hình cụ thể như sau:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID khối mục tiêu
- Condition: Điều kiện lọc

### Làm mới khối mục tiêu (Refresh target blocks)

Làm mới khối mục tiêu, cho phép cấu hình nhiều khối. Cấu hình cụ thể như sau:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID khối mục tiêu

### Điều hướng đến URL (Navigate to URL)

Chuyển hướng đến một URL nào đó. Cấu hình cụ thể như sau:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL đích, hỗ trợ sử dụng biến
- Search parameters: Tham số truy vấn trong URL
- Open in new window: Nếu tích chọn, sẽ mở một trang trình duyệt mới khi chuyển hướng

### Hiển thị thông báo (Show message)

Hiển thị thông báo phản hồi thao tác trên toàn cục.

#### Khi nào sử dụng

- Có thể cung cấp các thông tin phản hồi như thành công, cảnh báo và lỗi.
- Hiển thị ở giữa phía trên và tự động biến mất, là một phương thức nhắc nhở nhẹ nhàng không làm gián đoạn thao tác của người dùng.

#### Cấu hình cụ thể

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Loại thông báo
- Message content: Nội dung thông báo
- Duration: Thời gian hiển thị bao lâu, đơn vị giây

### Hiển thị thông báo nhắc nhở (Show notification)

Hiển thị thông báo nhắc nhở trên toàn cục.

#### Khi nào sử dụng

Hiển thị thông báo nhắc nhở ở bốn góc của hệ thống. Thường dùng cho các trường hợp sau:

- Nội dung thông báo khá phức tạp.
- Thông báo có tính tương tác, đưa ra các điểm hành động tiếp theo cho người dùng.
- Hệ thống chủ động đẩy thông báo.

#### Cấu hình cụ thể

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Loại thông báo
- Notification title: Tiêu đề thông báo
- Notification description: Mô tả thông báo
- Placement: Vị trí, các tùy chọn có: trên cùng bên trái, trên cùng bên phải, dưới cùng bên trái, dưới cùng bên phải

### Thực thi JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Thực thi mã JavaScript.

## Ví dụ

### Biểu mẫu: Gọi API bên thứ ba để điền ngược dữ liệu vào trường

Ngữ cảnh: Kích hoạt luồng sự kiện trong biểu mẫu, yêu cầu API bên thứ ba, sau khi nhận được dữ liệu sẽ tự động điền ngược vào các trường biểu mẫu.

Các bước cấu hình:

1. Mở cấu hình luồng sự kiện trong khối biểu mẫu, thêm một luồng sự kiện mới;
2. Sự kiện kích hoạt chọn "Trước khi hiển thị";
3. Thời điểm thực thi chọn "Sau tất cả các luồng";
4. Thêm bước "Thực thi JavaScript (Execute JavaScript)", dán và sửa đổi mã bên dưới theo nhu cầu:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```