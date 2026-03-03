---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/workflow/triggers/custom-action).
:::

# Sự kiện thao tác tùy chỉnh

## Giới thiệu

NocoBase tích hợp sẵn các thao tác dữ liệu phổ biến (thêm, xóa, sửa, truy vấn, v.v.). Khi các thao tác này không thể đáp ứng các nhu cầu nghiệp vụ phức tạp, có thể sử dụng sự kiện thao tác tùy chỉnh trong luồng công việc và liên kết sự kiện này với nút "Kích hoạt luồng công việc" trên khối trang. Sau khi người dùng nhấp vào, một luồng công việc thao tác tùy chỉnh sẽ được kích hoạt.

## Tạo luồng công việc

Khi tạo luồng công việc, chọn "Sự kiện thao tác tùy chỉnh":

![Tạo luồng công việc "Sự kiện thao tác tùy chỉnh"](https://static-docs.nocobase.com/20240509091820.png)

## Cấu hình bộ kích hoạt

### Loại ngữ cảnh

> v.1.6.0+

Sự khác biệt về loại ngữ cảnh sẽ quyết định luồng công việc này có thể được liên kết với các nút của khối nào:

* Không có ngữ cảnh: Tức là sự kiện toàn cục, có thể liên kết với các nút thao tác trên bảng thao tác, khối dữ liệu;
* Dữ liệu một hàng: Có thể liên kết với các nút thao tác trên các khối dữ liệu như hàng dữ liệu bảng, biểu mẫu, chi tiết, v.v.;
* Dữ liệu nhiều hàng: Có thể liên kết với các nút thao tác hàng loạt của bảng.

![Cấu hình bộ kích hoạt_Loại ngữ cảnh](https://static-docs.nocobase.com/20250215135808.png)

### Bộ sưu tập

Khi loại ngữ cảnh là dữ liệu một hàng hoặc dữ liệu nhiều hàng, cần chọn bộ sưu tập để liên kết mô hình dữ liệu:

![Cấu hình bộ kích hoạt_Chọn bộ sưu tập](https://static-docs.nocobase.com/20250215135919.png)

### Dữ liệu liên kết sẽ được sử dụng

Nếu cần sử dụng dữ liệu liên kết của hàng dữ liệu kích hoạt trong luồng công việc, có thể chọn các trường liên kết sâu tại đây:

![Cấu hình bộ kích hoạt_Chọn dữ liệu liên kết sẽ được sử dụng](https://static-docs.nocobase.com/20250215135955.png)

Các trường này sẽ tự động được tải trước vào ngữ cảnh của luồng công việc sau khi sự kiện được kích hoạt, để sử dụng trong luồng công việc.

## Cấu hình thao tác

Tùy thuộc vào loại ngữ cảnh được cấu hình trong luồng công việc, cấu hình nút thao tác trong các khối khác nhau cũng sẽ có sự khác biệt.

### Không có ngữ cảnh

> v1.6.0+

Trong bảng thao tác và các khối dữ liệu khác, đều có thể thêm nút "Kích hoạt luồng công việc":

![Thêm nút thao tác vào khối_Bảng thao tác](https://static-docs.nocobase.com/20250215221738.png)

![Thêm nút thao tác vào khối_Lịch](https://static-docs.nocobase.com/20250215221942.png)

![Thêm nút thao tác vào khối_Biểu đồ Gantt](https://static-docs.nocobase.com/20250215221810.png)

Sau khi thêm nút, liên kết với luồng công việc không có ngữ cảnh đã tạo trước đó, lấy nút trong bảng thao tác làm ví dụ:

![Liên kết luồng công việc với nút_Bảng thao tác](https://static-docs.nocobase.com/20250215222120.png)

![Chọn luồng công việc để liên kết_Không có ngữ cảnh](https://static-docs.nocobase.com/20250215222234.png)

### Bản ghi một hàng

Trong bất kỳ khối dữ liệu nào, đều có thể thêm nút "Kích hoạt luồng công việc" vào thanh thao tác cho dữ liệu một hàng, chẳng hạn như biểu mẫu, hàng dữ liệu bảng, chi tiết, v.v.:

![Thêm nút thao tác vào khối_Biểu mẫu](https://static-docs.nocobase.com/20240509165428.png)

![Thêm nút thao tác vào khối_Hàng bảng](https://static-docs.nocobase.com/20240509165340.png)

![Thêm nút thao tác vào khối_Chi tiết](https://static-docs.nocobase.com/20240509165545.png)

Sau khi thêm nút, liên kết với luồng công việc đã tạo trước đó:

![Liên kết luồng công việc với nút](https://static-docs.nocobase.com/20240509165631.png)

![Chọn luồng công việc để liên kết](https://static-docs.nocobase.com/20240509165658.png)

Sau đó nhấp vào nút này để kích hoạt sự kiện thao tác tùy chỉnh đó:

![Kết quả kích hoạt khi nhấp vào nút](https://static-docs.nocobase.com/20240509170453.png)

### Bản ghi nhiều hàng

> v1.6.0+

Trong thanh thao tác của khối bảng, khi thêm nút "Kích hoạt luồng công việc" sẽ có một tùy chọn bổ sung, chọn loại ngữ cảnh là "Không có ngữ cảnh" hoặc "Dữ liệu nhiều hàng":

![Thêm nút thao tác vào khối_Bảng](https://static-docs.nocobase.com/20250215222507.png)

Khi chọn "Không có ngữ cảnh", tức là sự kiện toàn cục, chỉ có thể liên kết với luồng công việc loại không có ngữ cảnh.

Khi chọn "Dữ liệu nhiều hàng", có thể liên kết với luồng công việc loại dữ liệu nhiều hàng, có thể dùng cho các thao tác hàng loạt sau khi chọn nhiều dữ liệu (hiện tại chỉ bảng hỗ trợ). Lúc này phạm vi luồng công việc có thể chọn chỉ là các luồng công việc được cấu hình khớp với bộ sưu tập của khối dữ liệu hiện tại:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Khi nhấp vào nút kích hoạt, phải chọn một số hàng dữ liệu trong bảng, nếu không luồng công việc sẽ không được kích hoạt:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Ví dụ

Ví dụ, chúng ta có một bộ sưu tập "Mẫu", đối với các mẫu "Đã thu thập" (trạng thái), cần cung cấp một thao tác "Gửi kiểm tra". Gửi kiểm tra sẽ kiểm tra thông tin cơ bản của mẫu trước, sau đó tạo một dữ liệu "Hồ sơ kiểm tra", rồi sửa trạng thái mẫu thành "Đã gửi kiểm tra". Chuỗi quy trình này không thể hoàn thành thông qua các lần nhấp nút "thêm, xóa, sửa, truy vấn" đơn giản, lúc này có thể sử dụng sự kiện thao tác tùy chỉnh để thực hiện.

Trước tiên, tạo một bộ sưu tập "Mẫu" và một bộ sưu tập "Hồ sơ kiểm tra", nhập dữ liệu thử nghiệm cơ bản vào bộ sưu tập Mẫu:

![Ví dụ_Bộ sưu tập Mẫu](https://static-docs.nocobase.com/20240509172234.png)

Sau đó tạo một luồng công việc "Sự kiện thao tác tùy chỉnh". Nếu cần phản hồi kịp thời từ quy trình thao tác, có thể chọn chế độ đồng bộ (trong chế độ đồng bộ không thể sử dụng các nút loại bất đồng bộ như xử lý thủ công):

![Ví dụ_Tạo luồng công việc](https://static-docs.nocobase.com/20240509173106.png)

Trong cấu hình bộ kích hoạt, bộ sưu tập chọn "Mẫu":

![Ví dụ_Cấu hình bộ kích hoạt](https://static-docs.nocobase.com/20240509173148.png)

Dựa trên yêu cầu nghiệp vụ, sắp xếp logic trong quy trình, ví dụ: chỉ cho phép gửi kiểm tra khi tham số chỉ số lớn hơn `90`, nếu không sẽ hiển thị thông báo về vấn đề liên quan:

![Ví dụ_Sắp xếp logic nghiệp vụ](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Mẹo}
Nút "[Thông báo phản hồi](../nodes/response-message.md)" có thể được sử dụng trong các sự kiện thao tác tùy chỉnh đồng bộ, dùng để trả về thông báo gợi ý cho client. Không thể sử dụng trong chế độ bất đồng bộ.
:::

Sau khi cấu hình và kích hoạt luồng công việc, quay lại giao diện bảng, thêm nút "Kích hoạt luồng công việc" vào cột thao tác của bảng:

![Ví dụ_Thêm nút thao tác](https://static-docs.nocobase.com/20240509174525.png)

Sau đó, trong menu cấu hình của nút, chọn liên kết luồng công việc và mở cửa sổ cấu hình bật lên:

![Ví dụ_Mở cửa sổ bật lên liên kết luồng công việc](https://static-docs.nocobase.com/20240509174633.png)

Thêm luồng công việc đã được kích hoạt trước đó:

![Ví dụ_Chọn luồng công việc](https://static-docs.nocobase.com/20240509174723.png)

Sau khi gửi, thay đổi văn bản nút thành tên thao tác, ví dụ như "Gửi kiểm tra". Quá trình cấu hình đã hoàn tất.

Khi sử dụng, chọn bất kỳ dữ liệu mẫu nào trong bảng và nhấp vào nút "Gửi kiểm tra" để kích hoạt sự kiện thao tác tùy chỉnh. Đúng như logic đã sắp xếp trước đó, nếu tham số chỉ số của mẫu nhỏ hơn 90, sau khi nhấp sẽ hiển thị thông báo như sau:

![Ví dụ_Chỉ số không đủ điều kiện gửi kiểm tra](https://static-docs.nocobase.com/20240509175026.png)

Nếu tham số chỉ số lớn hơn 90, quy trình sẽ thực hiện bình thường, tạo dữ liệu "Hồ sơ kiểm tra" và thay đổi trạng thái của mẫu thành "Đã gửi kiểm tra":

![Ví dụ_Gửi kiểm tra thành công](https://static-docs.nocobase.com/20240509175247.png)

Đến đây, một sự kiện thao tác tùy chỉnh đơn giản đã hoàn tất. Tương tự, đối với các nghiệp vụ có thao tác phức tạp như xử lý đơn hàng, gửi báo cáo, v.v., đều có thể được thực hiện thông qua sự kiện thao tác tùy chỉnh.

## Gọi từ bên ngoài

Việc kích hoạt sự kiện thao tác tùy chỉnh không chỉ giới hạn ở các thao tác trên giao diện người dùng, mà còn có thể được kích hoạt thông qua gọi HTTP API. Đặc biệt, sự kiện thao tác tùy chỉnh cung cấp một loại thao tác mới để kích hoạt luồng công việc cho tất cả các thao tác bộ sưu tập: `trigger`, có thể sử dụng API thao tác tiêu chuẩn của NocoBase để tiến hành gọi.

:::info{title="Mẹo"}
Vì các lệnh gọi từ bên ngoài cũng cần dựa trên danh tính người dùng, nên khi gọi qua HTTP API, tương tự như các yêu cầu gửi từ giao diện thông thường, đều cần cung cấp thông tin xác thực, bao gồm tiêu đề yêu cầu `Authorization` hoặc tham số `token` (token nhận được khi đăng nhập), và tiêu đề yêu cầu `X-Role` (tên vai trò hiện tại của người dùng).
:::

### Không có ngữ cảnh

Luồng công việc không có ngữ cảnh cần thực hiện thao tác kích hoạt đối với tài nguyên workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Bản ghi một hàng

Tương tự như luồng công việc được kích hoạt bởi nút trong ví dụ, có thể được gọi như sau:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Vì thao tác này dành cho một bản ghi đơn lẻ, nên khi gọi trên dữ liệu đã có, bạn cần chỉ định ID của hàng dữ liệu, thay thế phần `<:id>` trong URL.

Nếu gọi cho một biểu mẫu (như thêm mới hoặc cập nhật), đối với biểu mẫu thêm dữ liệu mới có thể không cần truyền ID, nhưng cần truyền dữ liệu đã gửi, làm dữ liệu ngữ cảnh thực thi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Đối với biểu mẫu cập nhật, bạn cần truyền cả ID của hàng dữ liệu và dữ liệu cập nhật:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Nếu cả ID và dữ liệu được truyền cùng lúc, hàng dữ liệu tương ứng với ID sẽ được tải trước, sau đó các thuộc tính từ đối tượng dữ liệu được truyền sẽ được sử dụng để ghi đè lên hàng dữ liệu gốc nhằm có được ngữ cảnh dữ liệu kích hoạt cuối cùng.

:::warning{title="Lưu ý"}
Nếu dữ liệu liên kết được truyền vào, nó cũng sẽ bị ghi đè. Đặc biệt, khi đã cấu hình tải trước các mục dữ liệu liên kết, cần xử lý cẩn thận dữ liệu truyền vào để tránh dữ liệu liên kết bị ghi đè không như mong đợi.
:::

Ngoài ra, tham số URL `triggerWorkflows` là khóa (key) của luồng công việc; nhiều luồng công việc được phân tách bằng dấu phẩy. Khóa này có thể được lấy bằng cách di chuột qua tên luồng công việc ở đầu canvas luồng công việc:

![Luồng công việc_Cách xem khóa](https://static-docs.nocobase.com/20240426135108.png)

Sau khi gọi thành công, sự kiện thao tác tùy chỉnh cho bộ sưu tập `samples` tương ứng sẽ được kích hoạt.

:::info{title="Mẹo"}
Khi gọi HTTP API để kích hoạt sự kiện sau thao tác, bạn cũng cần chú ý đến trạng thái kích hoạt của luồng công việc và liệu cấu hình bộ sưu tập có khớp hay không, nếu không, lệnh gọi có thể không thành công hoặc xảy ra lỗi.
:::

### Bản ghi nhiều hàng

Tương tự như cách gọi bản ghi một hàng, nhưng dữ liệu truyền vào chỉ cần nhiều tham số khóa chính (`filterByTk[]`), và không cần truyền phần data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Lệnh gọi này sẽ kích hoạt sự kiện thao tác tùy chỉnh ở chế độ bản ghi nhiều hàng, và sử dụng dữ liệu có id là 1 và 2 làm dữ liệu trong ngữ cảnh bộ kích hoạt.