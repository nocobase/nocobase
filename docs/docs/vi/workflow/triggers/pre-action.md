---
pkg: '@nocobase/plugin-workflow-request-interceptor'
title: "Sự kiện trước Action"
description: "Trigger sự kiện trước Action: kích hoạt Workflow trước khi Action được thực thi, như kiểm tra trước khi gửi, xử lý trước khi thao tác hàng loạt, có thể chặn hoặc sửa Action."
keywords: "workflow,sự kiện trước action,Pre Action,kiểm tra trước khi gửi,chặn request,NocoBase"
---
# Sự kiện trước Action

## Giới thiệu

Plugin sự kiện trước Action cung cấp một cơ chế chặn Action, có thể được kích hoạt sau khi request thêm, sửa, xóa được gửi nhưng trước khi được xử lý.

Nếu trong quy trình sau khi kích hoạt có Node "Kết thúc quy trình" được thực thi, hoặc các Node khác thực thi thất bại (lỗi hoặc các tình huống không thực thi xong khác) thì Action form đó sẽ bị chặn, ngược lại Action dự định sẽ được thực thi bình thường.

Kết hợp sử dụng Node "Thông báo phản hồi" có thể cấu hình thông báo phản hồi trả về client cho quy trình này, để đưa thông tin nhắc nhở tương ứng cho client. Sự kiện trước Action có thể dùng để xác minh nghiệp vụ hoặc kiểm tra logic, để thông qua hoặc chặn các request Action như tạo, cập nhật, xóa được client gửi đến.

## Cấu hình Trigger

### Tạo Trigger

Khi tạo Workflow, loại chọn "Sự kiện trước Action":

![Tạo sự kiện trước Action](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Chọn bảng dữ liệu

Trigger Workflow chặn trước tiên cần cấu hình bảng dữ liệu mà Action tương ứng:

![Cấu hình sự kiện chặn_bảng dữ liệu](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Sau đó chọn chế độ chặn, có thể chỉ chặn các nút Action liên kết với Workflow này hoặc chặn tất cả Action được chọn trên bảng dữ liệu này (không phân biệt từ form nào, cũng không cần liên kết với Workflow tương ứng):

### Chế độ chặn

![Cấu hình sự kiện chặn_chế độ chặn](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Hiện loại Action được hỗ trợ gồm "Tạo", "Cập nhật" và "Xóa", có thể chọn nhiều loại Action cùng lúc.

## Cấu hình Action

Nếu trong cấu hình Trigger chọn chế độ "Chỉ kích hoạt chặn khi form liên kết Workflow này gửi", còn cần quay lại giao diện form và liên kết Workflow này với nút Action tương ứng:

![Thêm đơn hàng_liên kết Workflow](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Trong cấu hình liên kết Workflow chọn Workflow tương ứng, ngữ cảnh dữ liệu kích hoạt thường mặc định chọn "Toàn bộ dữ liệu form":

![Chọn Workflow để liên kết](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Mẹo}
Nút mà sự kiện trước Action cần liên kết hiện chỉ hỗ trợ sử dụng các nút "Gửi" (hoặc "Lưu"), "Cập nhật dữ liệu" và "Xóa" trong form thêm hoặc cập nhật, không hỗ trợ sử dụng nút "Kích hoạt Workflow" (nút này chỉ có thể liên kết "Sự kiện sau Action").
:::

## Điều kiện đạt được việc chặn

Trong "Sự kiện trước Action" có hai điều kiện sẽ dẫn đến việc Action tương ứng bị chặn:

1. Quy trình thực thi đến bất kỳ Node "Kết thúc quy trình" nào, tương tự như trong hướng dẫn sử dụng phía trước, khi dữ liệu kích hoạt quy trình không thỏa mãn điều kiện được đặt trước trong Node "Phán đoán điều kiện", sẽ vào nhánh "Sai" và thực thi Node "Kết thúc quy trình", lúc này quy trình sẽ kết thúc và Action được yêu cầu sẽ bị chặn.
2. Bất kỳ Node nào trong quy trình thực thi thất bại, bao gồm Node thực thi gặp lỗi hoặc các tình huống bất thường khác, lúc này quy trình sẽ kết thúc với trạng thái tương ứng, và Action được yêu cầu cũng sẽ bị chặn. Ví dụ trong quy trình có gọi dữ liệu bên ngoài qua "HTTP Request", nếu request thất bại, quy trình kết thúc với trạng thái thất bại đồng thời cũng sẽ chặn request Action tương ứng.

Sau khi đạt được điều kiện chặn, Action tương ứng sẽ không được thực thi nữa, ví dụ sau khi gửi đơn hàng bị chặn thì sẽ không sinh dữ liệu đơn hàng tương ứng.

## Tham số liên quan của Action tương ứng

Trong Workflow loại "Sự kiện trước Action", với các Action khác nhau, trong Trigger có các dữ liệu khác nhau có thể được dùng làm biến trong quy trình:

| Loại Action \\ Biến   | "Người thao tác" | "Định danh vai trò người thao tác" | Tham số Action: "ID" | Tham số Action: "Đối tượng dữ liệu được gửi" |
| ------------------ | -------- | ---------------- | -------------- | -------------------------- |
| Tạo một bản ghi       | ✓        | ✓                | -              | ✓                          |
| Cập nhật một bản ghi       | ✓        | ✓                | ✓              | ✓                          |
| Xóa một hoặc nhiều bản ghi | ✓        | ✓                | ✓              | -                          |

:::info{title=Mẹo}
Biến của sự kiện trước Action "Dữ liệu Trigger / Tham số Action / Đối tượng dữ liệu được gửi" không phải dữ liệu thực tế trong cơ sở dữ liệu, chỉ là tham số liên quan được Action gửi, nếu cần dữ liệu thực tế trong cơ sở dữ liệu thì cần thông qua Node "Truy vấn dữ liệu" để truy vấn ra dữ liệu liên quan trong quy trình.

Ngoài ra với Action xóa, khi nhằm vào một bản ghi, "ID" trong tham số Action là một giá trị đơn giản, còn khi nhằm vào nhiều bản ghi, "ID" trong tham số Action là một mảng.
:::

## Đầu ra thông báo phản hồi

Sau khi cấu hình Trigger, có thể tự định nghĩa logic phán đoán liên quan trong Workflow, thường sẽ sử dụng chế độ nhánh của Node "Phán đoán điều kiện", dựa trên kết quả phán đoán điều kiện nghiệp vụ cụ thể để chọn có "Kết thúc quy trình" hay không và trả về "Thông báo phản hồi" được đặt trước:

![Cấu hình quy trình chặn](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Đến đây đã hoàn tất cấu hình Workflow tương ứng, và có thể thử gửi một dữ liệu không thỏa mãn cấu hình phán đoán điều kiện trong quy trình để kích hoạt logic chặn của bộ chặn, lúc này có thể thấy thông báo phản hồi được trả về:

![Thông báo phản hồi báo lỗi](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Trạng thái của thông báo phản hồi

Nếu trong Node "Kết thúc quy trình" cấu hình thoát với trạng thái "Thành công" và khi thực thi đến Node "Kết thúc quy trình" đó, request của Action đó vẫn sẽ bị chặn, nhưng thông báo phản hồi trả về sẽ hiển thị với trạng thái "Thành công" (chứ không phải "Lỗi"):

![Thông báo phản hồi trạng thái thành công](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Ví dụ

Kết hợp với hướng dẫn sử dụng cơ bản phía trên, lấy ví dụ tình huống "Gửi đơn hàng", giả sử chúng ta cần khi người dùng gửi đơn hàng, kiểm tra tồn kho của tất cả các sản phẩm được người dùng chọn, nếu tồn kho của bất kỳ sản phẩm nào không đủ thì chặn việc gửi đơn hàng đó và trả về thông báo nhắc tương ứng; vòng lặp kiểm tra từng sản phẩm cho đến khi tồn kho của tất cả các sản phẩm đều đủ thì cho qua và sinh dữ liệu đơn hàng cho người dùng.

Các bước khác giống như trong phần hướng dẫn, nhưng vì một đơn hàng nhằm vào nhiều sản phẩm nên ngoài việc thêm quan hệ "Đơn hàng" <-- m:1 -- "Chi tiết đơn hàng" -- 1:m --> "Sản phẩm" trong mô hình hóa dữ liệu, còn cần thêm một Node "Vòng lặp" trong Workflow "Sự kiện trước Action" để vòng lặp kiểm tra tồn kho của từng sản phẩm có đủ không:

![Ví dụ_quy trình kiểm tra vòng lặp](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Đối tượng vòng lặp chọn mảng "Chi tiết đơn hàng" trong dữ liệu đơn hàng được gửi:

![Ví dụ_cấu hình đối tượng vòng lặp](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Node phán đoán điều kiện trong quy trình vòng lặp dùng để phán đoán tồn kho của đối tượng sản phẩm vòng lặp hiện tại có đủ không:

![Ví dụ_phán đoán điều kiện trong vòng lặp](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Các cấu hình khác giống cấu hình trong sử dụng cơ bản, cuối cùng khi gửi đơn hàng, nếu tồn kho của bất kỳ sản phẩm nào không đủ thì sẽ chặn việc gửi đơn hàng và trả về thông báo nhắc tương ứng. Khi kiểm thử cũng có thể thử gửi nhiều sản phẩm trong một đơn hàng, trong đó một sản phẩm tồn kho không đủ, một sản phẩm tồn kho đủ, có thể thấy thông báo phản hồi được trả về:

![Ví dụ_thông báo phản hồi sau khi gửi](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Có thể thấy, trong thông báo phản hồi không thông báo sản phẩm đầu tiên "iPhone 15 pro" thiếu tồn kho mà chỉ thông báo sản phẩm thứ hai "iPhone 14 pro" thiếu tồn kho, đó là vì trong vòng lặp, sản phẩm đầu tiên tồn kho đủ nên không bị chặn, còn sản phẩm thứ hai tồn kho không đủ nên đã chặn việc gửi đơn hàng.

## Gọi từ bên ngoài

Sự kiện trước Action bản thân được inject trong giai đoạn xử lý request, vì vậy cũng hỗ trợ kích hoạt thông qua HTTP API.

Đối với Workflow được liên kết cục bộ trên nút Action, có thể gọi như sau (lấy ví dụ nút tạo trên bảng `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Trong đó tham số URL `triggerWorkflows` là key của Workflow, nhiều Workflow phân tách bằng dấu phẩy. Key này có thể nhận được khi rê chuột qua tên Workflow trên đầu canvas Workflow:

![Cách xem key Workflow](https://static-docs.nocobase.com/20240426135108.png)

Sau khi gọi như trên, sẽ kích hoạt sự kiện trước Action của bảng `posts` tương ứng. Sau khi Workflow tương ứng xử lý đồng bộ xong, dữ liệu được tạo bình thường và trả về.

Nếu trong Workflow được cấu hình tiến đến "Node kết thúc", thì giống như logic của thao tác trên giao diện, request sẽ bị chặn và sẽ không tạo dữ liệu. Khi trạng thái cấu hình trong Node kết thúc là thất bại, mã trạng thái phản hồi trả về là `400`, khi thành công là `200`.

Nếu trước Node kết thúc còn cấu hình Node "Thông báo phản hồi", thông báo được sinh ra cũng sẽ được trả về trong kết quả phản hồi, trong đó cấu trúc khi lỗi là:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Cấu trúc thông báo khi "Node kết thúc" được cấu hình là thành công:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Mẹo}
Vì có thể thêm nhiều Node "Thông báo phản hồi" trong quy trình nên cấu trúc dữ liệu thông báo trả về là mảng.
:::

Nếu sự kiện trước Action được cấu hình ở chế độ toàn cục, thì khi gọi HTTP API, không cần sử dụng tham số URL `triggerWorkflows` để chỉ định Workflow tương ứng, trực tiếp gọi Action bảng dữ liệu tương ứng là có thể kích hoạt.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Mẹo"}
Khi kích hoạt sự kiện sau Action thông qua HTTP API, cũng cần lưu ý trạng thái bật của Workflow và việc cấu hình bảng dữ liệu có khớp không, nếu không có thể không gọi thành công hoặc xuất hiện lỗi.
:::
