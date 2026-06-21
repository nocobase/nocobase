---
pkg: '@nocobase/plugin-workflow-approval'
title: "Phê duyệt"
description: "Trigger phê duyệt: phối hợp với quy trình phê duyệt, người dùng phát động phê duyệt thủ công, kích hoạt Workflow tiếp theo khi phê duyệt thông qua/từ chối, triển khai tự động hóa được điều khiển bởi phê duyệt."
keywords: "workflow,trigger phê duyệt,Approval,quy trình phê duyệt,phê duyệt thủ công,NocoBase"
---
# Phê duyệt

## Giới thiệu

Phê duyệt là một dạng quy trình chuyên dùng để được phát động và xử lý thủ công nhằm quyết định trạng thái dữ liệu liên quan. Thường được dùng trong tự động hóa văn phòng hoặc quản lý quy trình các sự việc cần ra quyết định thủ công khác, ví dụ có thể tạo và quản lý các quy trình thủ công cho các tình huống như "Đề nghị nghỉ phép", "Phê duyệt hoàn ứng chi phí" và "Phê duyệt mua nguyên liệu"...

Plugin phê duyệt cung cấp loại Workflow chuyên dụng (Trigger) "Phê duyệt (sự kiện)" và Node "Phê duyệt" chuyên dùng cho quy trình này, kết hợp với bảng dữ liệu tùy chỉnh và Block tùy chỉnh đặc trưng của NocoBase, có thể nhanh chóng và linh hoạt tạo và quản lý các tình huống phê duyệt khác nhau.

## Tạo quy trình

Khi tạo Workflow, chọn loại "Phê duyệt" để tạo quy trình phê duyệt:

![Trigger phê duyệt_tạo quy trình phê duyệt](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Sau đó trong giao diện cấu hình Workflow, bấm vào Trigger để mở popup và cấu hình thêm.

## Cấu hình Trigger

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Liên kết bảng dữ liệu

Plugin phê duyệt của NocoBase được thiết kế dựa trên tính linh hoạt, có thể được sử dụng phối hợp với bất kỳ bảng dữ liệu tùy chỉnh nào, tức cấu hình phê duyệt không cần cấu hình lại mô hình dữ liệu mà trực tiếp sử dụng lại bảng dữ liệu đã được tạo. Vì vậy sau khi vào cấu hình Trigger, đầu tiên cần chọn bảng dữ liệu để quyết định quy trình này nhằm vào dữ liệu của bảng dữ liệu nào để phê duyệt:

![Trigger phê duyệt_cấu hình Trigger_chọn bảng dữ liệu](https://static-docs.nocobase.com/20251226103223.png)

### Cách kích hoạt

Khi phát động phê duyệt nhằm vào dữ liệu nghiệp vụ, có thể chọn một trong hai cách kích hoạt sau:

*   **Trước khi lưu dữ liệu**

    Phát động phê duyệt trước khi dữ liệu được gửi được lưu, phù hợp với tình huống cần phê duyệt thông qua mới lưu dữ liệu. Ở chế độ này, dữ liệu khi phát động phê duyệt chỉ là dữ liệu tạm thời, chỉ sau khi phê duyệt thông qua mới được lưu chính thức vào bảng dữ liệu tương ứng.

*   **Sau khi lưu dữ liệu**

    Phát động phê duyệt sau khi dữ liệu được gửi được lưu, phù hợp với tình huống dữ liệu có thể được lưu trước rồi mới phê duyệt. Ở chế độ này, dữ liệu khi phát động phê duyệt đã được lưu vào bảng dữ liệu tương ứng, các sửa đổi đối với nó trong quá trình phê duyệt cũng sẽ được lưu.

### Vị trí phát động phê duyệt

Có thể chọn vị trí phát động phê duyệt trong hệ thống:

*   **Chỉ phát động trong Block dữ liệu**

    Có thể liên kết Action của bất kỳ Block form nào của bảng đó với Workflow này để phát động phê duyệt và xử lý, theo dõi quá trình phê duyệt trong Block phê duyệt của một dữ liệu đơn lẻ, thường phù hợp với dữ liệu nghiệp vụ.

*   **Có thể phát động cả trong Block dữ liệu và trung tâm Task**

    Ngoài Block dữ liệu, còn có thể phát động và xử lý phê duyệt trong trung tâm Task toàn cục, thường phù hợp với dữ liệu hành chính.

### Ai có thể phát động phê duyệt

Có thể cấu hình quyền dựa trên phạm vi người dùng để quyết định người dùng nào có thể phát động phê duyệt này:

*   **Tất cả người dùng**

    Tất cả người dùng trong hệ thống đều có thể phát động phê duyệt này.

*   **Chỉ người dùng đã chọn**

    Chỉ cho phép phạm vi người dùng được chỉ định phát động phê duyệt này, có thể chọn nhiều.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Cấu hình giao diện form phát động phê duyệt

Cuối cùng cần cấu hình giao diện form của người phát động, giao diện này sẽ được dùng cho thao tác gửi khi phát động từ Block trung tâm phê duyệt và khi người dùng phát động lại sau khi rút lại. Bấm nút cấu hình để mở popup:

![Trigger phê duyệt_cấu hình Trigger_form người phát động](https://static-docs.nocobase.com/20251226130239.png)

Có thể thêm form điền dựa trên bảng dữ liệu được liên kết hoặc văn bản giải thích để nhắc và hướng dẫn (Markdown) cho giao diện của người phát động. Trong đó form là bắt buộc phải thêm, nếu không người phát động sau khi vào giao diện đó sẽ không thể thao tác.

Sau khi thêm Block form, giống như giao diện cấu hình form thông thường, có thể thêm các Component trường của bảng dữ liệu tương ứng và sắp xếp tùy ý để tổ chức nội dung cần điền của form:

![Trigger phê duyệt_cấu hình Trigger_form người phát động_cấu hình trường](https://static-docs.nocobase.com/20251226130339.png)

Khác với nút gửi trực tiếp, còn có thể thêm nút Action "Lưu nháp" để hỗ trợ quy trình xử lý lưu tạm:

![Trigger phê duyệt_cấu hình Trigger_form người phát động_cấu hình Action_lưu](https://static-docs.nocobase.com/20251226130512.png)

Nếu một quy trình phê duyệt cho phép người phát động rút lại, cần bật nút "Rút lại" trong cấu hình giao diện người phát động:

![Trigger phê duyệt_cấu hình Trigger_cho phép rút lại](https://static-docs.nocobase.com/20251226130637.png)

Sau khi bật, phê duyệt được phát động bởi quy trình này có thể được người phát động rút lại trước khi bất kỳ người phê duyệt nào xử lý, nhưng sau khi người phê duyệt được cấu hình tại Node phê duyệt tiếp theo bất kỳ đã xử lý thì sẽ không còn rút lại được nữa.

:::info{title=Mẹo}
Sau khi bật hoặc xóa nút rút lại, trong popup cấu hình Trigger cần bấm Lưu để gửi mới có hiệu lực.
:::

### Thẻ "Đề nghị của tôi" <Badge>2.0+</Badge>

Có thể được dùng để cấu hình thẻ Task trong danh sách "Đề nghị của tôi" ở trung tâm Task.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Trong thẻ có thể tự do cấu hình các trường nghiệp vụ muốn hiển thị (trừ trường quan hệ) hoặc thông tin liên quan đến phê duyệt.

Sau khi đề nghị phê duyệt được tạo, trong danh sách trung tâm Task có thể thấy thẻ Task tùy chỉnh:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Chế độ hiển thị bản ghi trong quy trình

*   **Snapshot**

    Trong quy trình phê duyệt, người đề nghị và người phê duyệt khi vào sẽ thấy trạng thái của bản ghi và sau khi gửi chỉ thấy bản ghi do mình sửa - sẽ không thấy các cập nhật mà người khác làm sau đó.

*   **Mới nhất**

    Trong quy trình phê duyệt, người đề nghị và người phê duyệt trong toàn bộ quy trình luôn thấy phiên bản mới nhất của bản ghi, bất kể trạng thái của bản ghi trước khi họ thao tác là gì. Sau khi quy trình kết thúc, họ sẽ thấy phiên bản cuối cùng của bản ghi.

## Node phê duyệt

Trong Workflow phê duyệt, cần sử dụng Node "Phê duyệt" chuyên dụng để cấu hình logic Action xử lý (thông qua, từ chối hoặc trả lại) phê duyệt được phát động cho người phê duyệt, Node "Phê duyệt" chỉ có thể được dùng trong quy trình phê duyệt. Tham khảo [Node phê duyệt](../nodes/approval.md) để hiểu chi tiết.

:::info{title=Mẹo}
Nếu trong một quy trình phê duyệt không có Node "Phê duyệt" nào, quy trình đó sẽ tự động được thông qua.
:::

## Cấu hình phát động phê duyệt

Sau khi cấu hình xong một Workflow phê duyệt và bật, có thể liên kết Workflow đó với nút gửi form của bảng dữ liệu tương ứng để người dùng phát động phê duyệt khi gửi:

![Phát động phê duyệt_liên kết Workflow](https://static-docs.nocobase.com/20251226110710.png)

Sau đó việc người dùng gửi form đó sẽ kích hoạt Workflow phê duyệt tương ứng, dữ liệu được gửi ngoài việc lưu vào bảng dữ liệu tương ứng cũng sẽ được snapshot vào luồng phê duyệt để người phê duyệt sau xem và sử dụng.

:::info{title=Mẹo}
Nút phát động phê duyệt hiện chỉ hỗ trợ sử dụng nút "Gửi" (hoặc "Lưu") trong form thêm hoặc cập nhật, không hỗ trợ sử dụng nút "Kích hoạt Workflow" (nút này chỉ có thể liên kết "Sự kiện Action tùy chỉnh").
:::

## Trung tâm Task

Trung tâm Task cung cấp một cổng vào thống nhất để thuận tiện cho người dùng xem và xử lý các Task. Phê duyệt được người dùng hiện tại phát động và Task chờ làm đều có thể được vào qua trung tâm Task ở thanh công cụ phía trên và xem các loại Task chờ làm khác nhau qua điều hướng phân loại bên trái.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Tôi đã phát động

#### Xem các phê duyệt đã phát động

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Trực tiếp phát động phê duyệt mới

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Task chờ làm của tôi

#### Danh sách Task chờ làm

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Chi tiết Task chờ làm

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Người phát động

#### Phát động từ bảng dữ liệu

Phát động từ Block dữ liệu, có thể gọi như sau (lấy ví dụ nút tạo trên bảng `posts`):

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

Sau khi gọi thành công, sẽ kích hoạt Workflow phê duyệt của bảng `posts` tương ứng.

:::info{title="Mẹo"}
Vì việc gọi từ bên ngoài cũng cần dựa trên danh tính người dùng, nên khi gọi qua HTTP API, giống như request thông thường được gửi từ giao diện, đều cần cung cấp thông tin xác thực, bao gồm header `Authorization` hoặc tham số `token` (token nhận được khi đăng nhập), và header `X-Role` (tên vai trò hiện tại của người dùng).
:::

Nếu cần kích hoạt sự kiện cho dữ liệu quan hệ một - một (chưa hỗ trợ một - nhiều) trong Action đó, có thể sử dụng `!` trong tham số để chỉ định dữ liệu kích hoạt của trường quan hệ:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Sau khi gọi như trên thành công, sẽ kích hoạt sự kiện phê duyệt của bảng `categories` tương ứng.

:::info{title="Mẹo"}
Khi kích hoạt sự kiện sau Action thông qua HTTP API, cũng cần lưu ý trạng thái bật của Workflow và việc cấu hình bảng dữ liệu có khớp không, nếu không có thể không gọi thành công hoặc xuất hiện lỗi.
:::

#### Phát động từ trung tâm phê duyệt

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Tham số**

* `collectionName`: tên bảng dữ liệu đích phát động phê duyệt, bắt buộc.
* `workflowId`: ID Workflow được dùng để phát động phê duyệt, bắt buộc.
* `data`: các trường bản ghi bảng dữ liệu được tạo khi phát động phê duyệt, bắt buộc.
* `status`: trạng thái bản ghi được tạo khi phát động phê duyệt, bắt buộc. Các giá trị có thể chọn:
  * `0`: nháp, biểu thị lưu nhưng không gửi phê duyệt.
  * `2`: gửi phê duyệt, biểu thị người phát động gửi đề nghị phê duyệt và vào quy trình phê duyệt.

#### Lưu và gửi

Khi phê duyệt được phát động (hoặc rút lại) đang ở trạng thái nháp, có thể qua interface dưới đây để lưu hoặc gửi lại:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Lấy danh sách phê duyệt đã phát động

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Rút lại

Người phát động có thể rút lại bản ghi đang trong quá trình phê duyệt qua interface dưới đây:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Tham số**

* `<approval id>`: ID của bản ghi phê duyệt cần rút lại, bắt buộc.

### Người phê duyệt

Sau khi quy trình phê duyệt vào Node phê duyệt, sẽ tạo Task chờ làm cho người phê duyệt hiện tại. Người phê duyệt có thể hoàn tất Task phê duyệt qua thao tác giao diện, cũng có thể hoàn tất qua việc gọi HTTP API.

#### Lấy bản ghi xử lý phê duyệt

Task chờ làm tức bản ghi xử lý phê duyệt, có thể lấy tất cả bản ghi xử lý phê duyệt của người dùng hiện tại qua interface dưới đây:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Trong đó `approvalRecords` là tài nguyên bảng dữ liệu, cũng có thể sử dụng các điều kiện truy vấn chung như `filter`, `sort`, `pageSize` và `page`...

#### Lấy một bản ghi xử lý phê duyệt

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Thông qua và từ chối

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Tham số**

* `<record id>`: ID bản ghi cần xử lý phê duyệt, bắt buộc.
* `status`: trường là trạng thái xử lý phê duyệt, `2` biểu thị "Thông qua", `-1` biểu thị "Từ chối", bắt buộc.
* `comment`: thông tin ghi chú khi xử lý phê duyệt, tùy chọn.
* `data`: biểu thị các sửa đổi đối với bản ghi bảng dữ liệu của Node phê duyệt hiện tại sau khi phê duyệt được thông qua, tùy chọn (chỉ có hiệu lực khi thông qua).

#### Trả lại <Badge>v1.9.0+</Badge>

Trước phiên bản v1.9.0, "Trả lại" sử dụng cùng interface với "Thông qua", "Từ chối", sử dụng `"status": 1` để biểu thị trả lại.

Từ phiên bản v1.9.0 trở đi, trả lại có interface riêng:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Tham số**

* `<record id>`: ID bản ghi cần xử lý phê duyệt, bắt buộc.
* `returnToNodeKey`: key của Node đích trả lại, tùy chọn. Khi trong Node được cấu hình phạm vi Node có thể trả lại, có thể sử dụng tham số này để chỉ định trả lại đến Node nào. Trong trường hợp không cấu hình, tham số này không cần truyền giá trị, mặc định sẽ trả lại điểm bắt đầu để người phát động gửi lại.

#### Chuyển tiếp ký

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Tham số**

* `<record id>`: ID bản ghi cần xử lý phê duyệt, bắt buộc.
* `assignee`: ID của người dùng được chuyển tiếp ký, bắt buộc.

#### Thêm ký

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Tham số**

* `<record id>`: ID bản ghi cần xử lý phê duyệt, bắt buộc.
* `assignees`: danh sách ID người dùng được thêm ký, bắt buộc.
* `order`: thứ tự thêm ký, `-1` đánh dấu trước "Tôi", `1` đánh dấu sau "Tôi".
