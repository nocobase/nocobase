---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Sự kiện Trước Thao tác

## Giới thiệu

Plugin Sự kiện Trước Thao tác cung cấp một cơ chế chặn các thao tác. Cơ chế này được kích hoạt sau khi yêu cầu tạo mới, cập nhật hoặc xóa một bản ghi được gửi đi, nhưng trước khi yêu cầu đó được xử lý.

Nếu một nút “Kết thúc luồng công việc” được thực thi trong luồng công việc đã kích hoạt, hoặc nếu bất kỳ nút nào khác thực thi thất bại (do lỗi hoặc không hoàn thành), thao tác trên biểu mẫu sẽ bị chặn. Ngược lại, thao tác dự kiến sẽ được thực thi bình thường.

Khi sử dụng cùng với nút “Thông báo phản hồi”, bạn có thể cấu hình thông báo phản hồi trả về cho client, cung cấp các thông tin gợi ý phù hợp. Sự kiện Trước Thao tác có thể được dùng để thực hiện xác thực nghiệp vụ hoặc kiểm tra logic, nhằm chấp thuận hoặc chặn các yêu cầu thao tác tạo mới, cập nhật và xóa do client gửi đi.

## Cấu hình Kích hoạt

### Tạo Kích hoạt

Khi tạo một luồng công việc, hãy chọn loại “Sự kiện Trước Thao tác”:

![Tạo Sự kiện Trước Thao tác](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Chọn bộ sưu tập

Trong bộ kích hoạt của một luồng công việc chặn, điều đầu tiên cần cấu hình là bộ sưu tập tương ứng với thao tác:

![Cấu hình Sự kiện Chặn_Bộ sưu tập](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Sau đó, chọn chế độ chặn. Bạn có thể chọn chỉ chặn các nút thao tác đã liên kết với luồng công việc này, hoặc chặn tất cả các thao tác đã chọn cho bộ sưu tập này (không phân biệt đến từ biểu mẫu nào và không cần liên kết với luồng công việc tương ứng):

### Chế độ Chặn

![Cấu hình Sự kiện Chặn_Chế độ Chặn](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Hiện tại, các loại thao tác được hỗ trợ bao gồm “Tạo mới”, “Cập nhật” và “Xóa”. Bạn có thể chọn nhiều loại thao tác cùng lúc.

## Cấu hình Thao tác

Nếu bạn đã chọn chế độ “Chỉ kích hoạt chặn khi biểu mẫu liên kết với luồng công việc này được gửi” trong cấu hình kích hoạt, bạn cần quay lại giao diện biểu mẫu và liên kết luồng công việc này với nút thao tác tương ứng:

![Thêm Đơn hàng_Liên kết luồng công việc](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Trong cấu hình liên kết luồng công việc, hãy chọn luồng công việc tương ứng. Thông thường, ngữ cảnh dữ liệu kích hoạt mặc định là “Toàn bộ dữ liệu biểu mẫu” là đủ:

![Chọn luồng công việc để liên kết](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Lưu ý}
Các nút có thể liên kết với Sự kiện Trước Thao tác hiện chỉ hỗ trợ các nút “Gửi” (hoặc “Lưu”), “Cập nhật dữ liệu” và “Xóa” trong các biểu mẫu tạo mới hoặc cập nhật. Nút “Kích hoạt luồng công việc” không được hỗ trợ (nút này chỉ có thể liên kết với “Sự kiện Sau Thao tác”).
:::

## Điều kiện để chặn

Trong “Sự kiện Trước Thao tác”, có hai điều kiện sẽ khiến thao tác tương ứng bị chặn:

1. Luồng công việc thực thi đến bất kỳ nút “Kết thúc luồng công việc” nào. Tương tự như hướng dẫn trước đó, khi dữ liệu kích hoạt luồng công việc không đáp ứng các điều kiện đã đặt trước trong nút “Điều kiện”, nó sẽ đi vào nhánh “Không” và thực thi nút “Kết thúc luồng công việc”. Tại thời điểm này, luồng công việc sẽ kết thúc và thao tác được yêu cầu sẽ bị chặn.
2. Bất kỳ nút nào trong luồng công việc thực thi thất bại, bao gồm lỗi thực thi nút hoặc các trường hợp ngoại lệ khác. Trong trường hợp này, luồng công việc sẽ kết thúc với trạng thái tương ứng và thao tác được yêu cầu cũng sẽ bị chặn. Ví dụ, nếu luồng công việc gọi dữ liệu bên ngoài thông qua “Yêu cầu HTTP” và yêu cầu đó thất bại, luồng công việc sẽ kết thúc với trạng thái thất bại, đồng thời cũng sẽ chặn yêu cầu thao tác tương ứng.

Sau khi các điều kiện chặn được đáp ứng, thao tác tương ứng sẽ không còn được thực thi. Ví dụ, nếu việc gửi đơn hàng bị chặn, dữ liệu đơn hàng tương ứng sẽ không được tạo.

## Các tham số liên quan của thao tác tương ứng

Trong luồng công việc loại “Sự kiện Trước Thao tác”, đối với các thao tác khác nhau, bộ kích hoạt có các dữ liệu khác nhau có thể được sử dụng làm biến trong luồng công việc:

| Loại thao tác \\ Biến | “Người thực hiện” | “Mã định danh vai trò người thực hiện” | Tham số thao tác: “ID” | Tham số thao tác: “Đối tượng dữ liệu đã gửi” |
| ---------------------- | ---------------- | ------------------------------------ | ---------------------- | ----------------------------------------- |
| Tạo một bản ghi        | ✓                | ✓                                    | -                      | ✓                                         |
| Cập nhật một bản ghi   | ✓                | ✓                                    | ✓                      | ✓                                         |
| Xóa một hoặc nhiều bản ghi | ✓                | ✓                                    | ✓                      | -                                         |

:::info{title=Lưu ý}
Biến “Dữ liệu kích hoạt / Tham số thao tác / Đối tượng dữ liệu đã gửi” của Sự kiện Trước Thao tác không phải là dữ liệu thực tế trong cơ sở dữ liệu, mà chỉ là các tham số liên quan được gửi cùng thao tác. Nếu bạn cần dữ liệu thực tế từ cơ sở dữ liệu, bạn cần truy vấn dữ liệu liên quan thông qua nút “Truy vấn dữ liệu” trong luồng công việc.

Ngoài ra, đối với thao tác xóa, khi nhắm mục tiêu một bản ghi duy nhất, “ID” trong các tham số thao tác là một giá trị đơn giản, trong khi khi nhắm mục tiêu nhiều bản ghi, “ID” trong các tham số thao tác là một mảng.
:::

## Xuất Thông báo phản hồi

Sau khi cấu hình bộ kích hoạt, bạn có thể tùy chỉnh logic phán đoán liên quan trong luồng công việc. Thông thường, bạn sẽ sử dụng chế độ phân nhánh của nút “Điều kiện” để quyết định có “Kết thúc luồng công việc” hay không và trả về “Thông báo phản hồi” đã đặt trước, dựa trên kết quả phán đoán điều kiện nghiệp vụ cụ thể:

![Cấu hình luồng công việc chặn](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Đến đây, cấu hình của luồng công việc tương ứng đã hoàn tất. Bạn có thể thử gửi một dữ liệu không đáp ứng cấu hình điều kiện trong luồng công việc để kích hoạt logic chặn của bộ chặn. Lúc này, bạn sẽ thấy thông báo phản hồi được trả về:

![Thông báo phản hồi lỗi](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Trạng thái Thông báo phản hồi

Nếu nút “Kết thúc luồng công việc” được cấu hình để thoát với trạng thái “Thành công”, và khi nút này được thực thi, yêu cầu thao tác vẫn sẽ bị chặn, nhưng thông báo phản hồi trả về sẽ hiển thị với trạng thái “Thành công” (thay vì “Lỗi”):

![Thông báo phản hồi trạng thái thành công](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Ví dụ

Kết hợp với các hướng dẫn cơ bản ở trên, chúng ta hãy lấy một kịch bản “Gửi đơn hàng” làm ví dụ. Giả sử chúng ta cần kiểm tra tồn kho của tất cả các sản phẩm mà người dùng đã chọn khi họ gửi đơn hàng. Nếu tồn kho của bất kỳ sản phẩm nào không đủ, việc gửi đơn hàng sẽ bị chặn và một thông báo gợi ý tương ứng sẽ được trả về. Luồng công việc sẽ lặp lại để kiểm tra từng sản phẩm cho đến khi tất cả các sản phẩm đều có đủ tồn kho, sau đó sẽ tiếp tục và tạo dữ liệu đơn hàng cho người dùng.

Các bước khác tương tự như trong hướng dẫn. Tuy nhiên, vì một đơn hàng liên quan đến nhiều sản phẩm, ngoài việc thêm mối quan hệ nhiều-nhiều “Đơn hàng” <-- m:1 -- “Chi tiết đơn hàng” -- 1:m --> “Sản phẩm” khi mô hình hóa dữ liệu, bạn còn cần thêm một nút “Lặp” vào luồng công việc “Sự kiện Trước Thao tác” để lặp lại kiểm tra xem tồn kho của từng sản phẩm có đủ hay không:

![Ví dụ_Luồng công việc kiểm tra lặp](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Đối tượng cho vòng lặp được chọn là mảng “Chi tiết đơn hàng” từ dữ liệu đơn hàng đã gửi:

![Ví dụ_Cấu hình đối tượng lặp](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Nút điều kiện trong luồng công việc lặp được sử dụng để xác định xem tồn kho của đối tượng sản phẩm hiện tại trong vòng lặp có đủ hay không:

![Ví dụ_Điều kiện trong vòng lặp](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Các cấu hình khác tương tự như trong phần sử dụng cơ bản. Khi đơn hàng cuối cùng được gửi, nếu bất kỳ sản phẩm nào có tồn kho không đủ, việc gửi đơn hàng sẽ bị chặn và một thông báo gợi ý tương ứng sẽ được trả về. Khi thử nghiệm, hãy thử gửi một đơn hàng với nhiều sản phẩm, trong đó một sản phẩm có tồn kho không đủ và một sản phẩm khác có đủ tồn kho. Bạn có thể thấy thông báo phản hồi được trả về:

![Ví dụ_Thông báo phản hồi sau khi gửi](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Có thể thấy, thông báo phản hồi không chỉ ra rằng sản phẩm đầu tiên “iPhone 15 pro” thiếu tồn kho, mà chỉ chỉ ra rằng sản phẩm thứ hai “iPhone 14 pro” thiếu tồn kho. Điều này là do trong vòng lặp, sản phẩm đầu tiên có đủ tồn kho nên không bị chặn, trong khi sản phẩm thứ hai thiếu tồn kho nên đã chặn việc gửi đơn hàng.

## Gọi từ bên ngoài

Bản thân Sự kiện Trước Thao tác được đưa vào giai đoạn xử lý yêu cầu, vì vậy nó cũng hỗ trợ kích hoạt thông qua các lệnh gọi HTTP API.

Đối với các luồng công việc được liên kết cục bộ với một nút thao tác, bạn có thể gọi chúng như sau (lấy nút tạo của bộ sưu tập `posts` làm ví dụ):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Trong đó, tham số URL `triggerWorkflows` là khóa (key) của luồng công việc; nhiều khóa luồng công việc được phân tách bằng dấu phẩy. Khóa này có thể được lấy bằng cách di chuột qua tên luồng công việc ở phía trên cùng của canvas luồng công việc:

![Luồng công việc_Cách xem khóa](https://static-docs.nocobase.com/20240426135108.png)

Sau khi lệnh gọi trên được thực hiện, Sự kiện Trước Thao tác cho bộ sưu tập `posts` tương ứng sẽ được kích hoạt. Sau khi luồng công việc tương ứng được xử lý đồng bộ, dữ liệu sẽ được tạo và trả về bình thường.

Nếu luồng công việc đã cấu hình đi đến “nút kết thúc”, logic sẽ tương tự như thao tác trên giao diện: yêu cầu sẽ bị chặn và không có dữ liệu nào được tạo. Khi trạng thái của nút kết thúc được cấu hình là thất bại, mã trạng thái phản hồi trả về sẽ là `400`; nếu thành công, nó sẽ là `200`.

Nếu nút “Thông báo phản hồi” cũng được cấu hình trước nút kết thúc, thông báo được tạo cũng sẽ được trả về trong kết quả phản hồi, trong đó cấu trúc khi có lỗi là:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Cấu trúc thông báo khi “nút kết thúc” được cấu hình là thành công là:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Lưu ý}
Vì có thể thêm nhiều nút “Thông báo phản hồi” trong một luồng công việc, nên cấu trúc dữ liệu của thông báo trả về là một mảng.
:::

Nếu Sự kiện Trước Thao tác được cấu hình ở chế độ toàn cục, khi gọi HTTP API, bạn không cần sử dụng tham số URL `triggerWorkflows` để chỉ định luồng công việc tương ứng, mà chỉ cần gọi trực tiếp thao tác của bộ sưu tập tương ứng là có thể kích hoạt.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Lưu ý"}
Khi gọi HTTP API để kích hoạt Sự kiện Trước Thao tác, bạn cũng cần chú ý đến trạng thái kích hoạt của luồng công việc và liệu cấu hình bộ sưu tập có khớp hay không, nếu không, lệnh gọi có thể không thành công hoặc xảy ra lỗi.
:::