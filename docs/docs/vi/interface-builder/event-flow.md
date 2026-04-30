---
title: "Event flow"
description: "Event flow trong xây dựng giao diện: cấu hình logic tương tác giữa Block và Field, điều khiển bởi Flow, kết nối qua Step, triển khai điều phối logic nghiệp vụ không cần lập trình."
keywords: "event flow, Event Flow, Flow, Step, logic tương tác, điều phối không cần lập trình, xây dựng giao diện, NocoBase"
---

# Event flow

## Giới thiệu

Nếu bạn muốn kích hoạt một số thao tác tùy chỉnh khi một Form nào đó thay đổi, bạn có thể sử dụng event flow để thực hiện. Ngoài Form, các Trang, Block, nút và Field cũng có thể sử dụng event flow để cấu hình một số thao tác tùy chỉnh.

## Cách sử dụng

Sau đây sẽ là một ví dụ đơn giản, để minh họa cách cấu hình event flow. Hãy thực hiện liên kết giữa hai Table, khi nhấp vào một dòng của Table bên trái, tự động lọc dữ liệu của Table bên phải.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Các bước cấu hình như sau:

1. Nhấp vào biểu tượng "tia chớp" ở góc trên bên phải của Block Table bên trái, mở giao diện cấu hình event flow.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Nhấp "Add event flow", "Sự kiện kích hoạt" chọn "Row click", có nghĩa là khi nhấp vào dòng Table sẽ kích hoạt.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Cấu hình "Thời điểm thực thi", dùng để kiểm soát thứ tự trước sau của event flow này so với quy trình tích hợp sẵn của hệ thống. Thông thường giữ mặc định là được; nếu bạn muốn hiển thị thông báo/chuyển hướng sau khi logic tích hợp hoàn tất, có thể chọn "Sau tất cả các flow". Xem thêm bên dưới [Thời điểm thực thi](#thời-điểm-thực-thi).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Trigger condition" là dùng để cấu hình điều kiện, khi điều kiện được thỏa mãn mới kích hoạt event flow. Ở đây bạn không cần cấu hình, chỉ cần nhấp vào dòng đều sẽ kích hoạt event flow.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Di chuột đến "Add step", có thể thêm một số bước thao tác. Bạn chọn "Set data scope", để thiết lập phạm vi dữ liệu của Table bên phải.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Sao chép UID của Table bên phải, điền vào ô nhập "Target block UID". Bên dưới sẽ hiển thị ngay giao diện cấu hình điều kiện, ở đây bạn có thể cấu hình phạm vi dữ liệu của Table bên phải.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Hãy cấu hình một điều kiện như hình bên dưới:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Sau khi cấu hình phạm vi dữ liệu, vẫn cần làm mới Block thì mới hiển thị kết quả lọc. Tiếp theo bạn cấu hình làm mới Block Table bên phải. Thêm một bước "Refresh target blocks", sau đó điền UID của Table bên phải.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Cuối cùng nhấp nút lưu ở góc dưới bên phải, cấu hình hoàn tất.

## Chi tiết sự kiện

### Trước render

Sự kiện chung, có thể sử dụng trong Trang, Block, nút hoặc Field. Trong sự kiện này, bạn có thể thực hiện một số công việc khởi tạo. Ví dụ trong các điều kiện khác nhau, cấu hình các phạm vi dữ liệu khác nhau.

### Row click (Nhấp dòng)

Sự kiện riêng của Block Table. Khi nhấp vào dòng Table sẽ kích hoạt. Khi kích hoạt sẽ thêm một Clicked row record vào ngữ cảnh, có thể được sử dụng làm biến trong điều kiện và bước.

### Form values change (Giá trị Form thay đổi)

Sự kiện riêng của Block Form. Khi giá trị của Field Form thay đổi sẽ kích hoạt. Có thể lấy giá trị Form thông qua biến "Current form" trong điều kiện và bước.

### Click (Nhấp)

Sự kiện riêng của nút. Khi nhấp nút sẽ kích hoạt.

## Thời điểm thực thi

Trong cấu hình event flow, có hai khái niệm dễ nhầm lẫn:

- **Sự kiện kích hoạt:** Khi nào bắt đầu thực thi (ví dụ: trước render, nhấp dòng, nhấp, giá trị Form thay đổi v.v.).
- **Thời điểm thực thi:** Sau khi cùng một sự kiện kích hoạt xảy ra, **event flow tùy chỉnh** của bạn sẽ chèn vào vị trí nào của **quy trình tích hợp sẵn** để thực thi.

### "Quy trình tích hợp sẵn/Bước tích hợp sẵn" là gì?

Nhiều Trang, Block hoặc Action vốn đã có một bộ quy trình xử lý tích hợp sẵn của hệ thống (ví dụ: gửi, mở Popup, yêu cầu dữ liệu v.v.). Khi bạn thêm event flow tùy chỉnh cho cùng một sự kiện (ví dụ "nhấp"), "Thời điểm thực thi" được sử dụng để quyết định:

- Thực thi event flow của bạn trước, hay thực thi logic tích hợp trước;
- Hoặc chèn event flow của bạn vào trước hoặc sau một bước nào đó của quy trình tích hợp để thực thi.

### Hiểu các tùy chọn thời điểm thực thi trong UI như thế nào?

- **Trước tất cả các flow (mặc định):** Thực thi đầu tiên. Phù hợp để "chặn/chuẩn bị" (ví dụ xác thực, xác nhận lần hai, khởi tạo biến v.v.).
- **Sau tất cả các flow:** Thực thi sau khi logic tích hợp hoàn tất. Phù hợp để "kết thúc/phản hồi" (ví dụ thông báo, làm mới các Block khác, chuyển hướng trang v.v.).
- **Trước flow cụ thể / Sau flow cụ thể:** Điểm chèn tinh tế hơn. Sau khi chọn cần chọn "quy trình tích hợp" cụ thể.
- **Trước bước flow cụ thể / Sau bước flow cụ thể:** Điểm chèn tinh tế nhất. Sau khi chọn cần đồng thời chọn "quy trình tích hợp" và "bước quy trình tích hợp".

> Mẹo: Nếu bạn không chắc chắn nên chọn quy trình/bước tích hợp nào, ưu tiên sử dụng hai tùy chọn đầu tiên ("trước / sau") là được.

## Chi tiết bước

### Custom variable (Biến tùy chỉnh)

Dùng để tùy chỉnh một biến, sau đó sử dụng trong ngữ cảnh.

#### Phạm vi tác dụng

Biến tùy chỉnh có phạm vi tác dụng, ví dụ biến được định nghĩa trong event flow của Block chỉ có thể sử dụng trong Block này. Nếu muốn có thể sử dụng trong tất cả các Block của trang hiện tại, thì cần phải cấu hình trong event flow của trang.

#### Form variable (Biến Form)

Sử dụng giá trị của một Block Form nào đó làm biến để sử dụng. Cấu hình cụ thể như sau:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Tiêu đề biến
- Variable identifier: Định danh biến
- Form UID: UID Form

#### Biến khác

Sau này sẽ lần lượt hỗ trợ các biến khác, vui lòng chờ đợi.

### Set data scope (Thiết lập phạm vi dữ liệu)

Thiết lập phạm vi dữ liệu của Block mục tiêu. Cấu hình cụ thể như sau:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID Block mục tiêu
- Condition: Điều kiện lọc

### Refresh target blocks (Làm mới Block mục tiêu)

Làm mới Block mục tiêu, cho phép cấu hình nhiều Block. Cấu hình cụ thể như sau:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID Block mục tiêu

### Navigate to URL (Chuyển hướng đến URL)

Chuyển hướng đến một URL nào đó. Cấu hình cụ thể như sau:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL mục tiêu, hỗ trợ sử dụng biến
- Search parameters: Tham số truy vấn trong URL
- Open in new window: Nếu chọn, sẽ mở một trang trình duyệt mới khi chuyển hướng

### Show message (Hiển thị thông báo)

Hiển thị toàn cục thông tin phản hồi thao tác.

#### Khi nào sử dụng

- Có thể cung cấp thông tin phản hồi như thành công, cảnh báo và lỗi.
- Hiển thị ở giữa phía trên và tự động biến mất, là một phương thức nhắc nhở nhẹ không làm gián đoạn thao tác của người dùng.

#### Cấu hình cụ thể

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Loại nhắc nhở
- Message content: Nội dung nhắc nhở
- Duration: Thời gian hiển thị, đơn vị giây

### Show notification (Hiển thị thông báo nhắc nhở)

Hiển thị toàn cục thông tin nhắc nhở thông báo.

#### Khi nào sử dụng

Hiển thị thông tin nhắc nhở thông báo ở bốn góc của hệ thống. Thường được sử dụng trong các tình huống sau:

- Nội dung thông báo phức tạp hơn.
- Thông báo có tương tác, đưa ra điểm hành động tiếp theo cho người dùng.
- Hệ thống chủ động đẩy.

#### Cấu hình cụ thể

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Loại thông báo
- Notification title: Tiêu đề thông báo
- Notification description: Mô tả thông báo
- Placement: Vị trí, các tùy chọn có: Trên trái, Trên phải, Dưới trái, Dưới phải

### Execute JavaScript (Thực thi JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Thực thi mã JavaScript.

### Custom request (Yêu cầu tùy chỉnh)

#### Khi nào sử dụng
Khi cần gọi API bên ngoài hoặc dịch vụ bên thứ ba trong quy trình, bạn có thể kích hoạt một yêu cầu HTTP tùy chỉnh thông qua **Custom request**. Các tình huống sử dụng phổ biến bao gồm:

* Gọi API hệ thống bên ngoài (ví dụ CRM, dịch vụ AI v.v.)
* Lấy dữ liệu từ xa và xử lý trong các bước quy trình tiếp theo
* Đẩy dữ liệu đến hệ thống bên thứ ba (Webhook, thông báo tin nhắn v.v.)
* Kích hoạt quy trình tự động hóa của dịch vụ bên trong hoặc bên ngoài

Sau khi yêu cầu thực thi xong, dữ liệu trả về có thể tiếp tục được sử dụng trong các bước tiếp theo, ví dụ xử lý dữ liệu, đánh giá điều kiện hoặc lưu trữ v.v.

#### Cấu hình cụ thể

![](https://static-docs.nocobase.com/Leads-03-16-2026_05_50_PM%20(1).png)

* HTTP method: Phương thức yêu cầu HTTP, ví dụ `GET`, `POST`, `PUT`, `DELETE` v.v.
* URL: Địa chỉ mục tiêu của yêu cầu, có thể điền URL API đầy đủ, hoặc nối động qua biến.
* Headers: Thông tin header yêu cầu, dùng để truyền thông tin xác thực hoặc cấu hình API, ví dụ `Authorization`, `Content-Type` v.v.
* Parameters: Tham số truy vấn URL (Query Parameters), thường dùng cho yêu cầu `GET`.
* Body: Nội dung body yêu cầu, thường dùng cho các yêu cầu `POST`, `PUT` v.v., có thể điền JSON, dữ liệu Form v.v.
* Timeout config: Cấu hình thời gian timeout yêu cầu, dùng để giới hạn thời gian chờ tối đa của yêu cầu, tránh quy trình bị chặn lâu.
* Response type: Loại dữ liệu phản hồi yêu cầu.
  * JSON: API trả về dữ liệu JSON, kết quả trả về sẽ được tiêm vào ngữ cảnh quy trình, có thể lấy qua `ctx.steps` ở các bước sau.
  * Stream: API trả về dữ liệu luồng (Stream), sau khi yêu cầu thành công sẽ tự động kích hoạt tải xuống tệp.
* Access control: Kiểm soát truy cập, dùng để giới hạn vai trò nào có thể kích hoạt bước yêu cầu này, đảm bảo an toàn cho việc gọi API.


## Ví dụ

### Form: Gọi API bên thứ ba để điền lại Field

Tình huống: Trong Form kích hoạt event flow, yêu cầu API bên thứ ba, sau khi nhận dữ liệu tự động điền lại vào Field Form.

Các bước cấu hình:

1. Mở cấu hình event flow trong Block Form, thêm một event flow;
2. Sự kiện kích hoạt chọn "Trước render";
3. Thời điểm thực thi chọn "Sau tất cả các flow";
4. Thêm bước "Execute JavaScript", dán và sửa đổi mã sau theo nhu cầu:

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
