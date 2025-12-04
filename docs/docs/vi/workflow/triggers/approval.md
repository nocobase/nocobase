---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Phê duyệt

## Giới thiệu

Phê duyệt là một dạng quy trình được thiết kế đặc biệt để khởi tạo và xử lý thủ công nhằm quyết định trạng thái của dữ liệu liên quan. Nó thường được sử dụng để quản lý quy trình trong tự động hóa văn phòng hoặc các công việc ra quyết định thủ công khác, ví dụ như có thể tạo và quản lý các luồng công việc thủ công cho các tình huống như "đơn xin nghỉ phép", "phê duyệt chi phí" và "phê duyệt mua nguyên liệu".

Plugin Phê duyệt cung cấp một loại luồng công việc (trigger) chuyên dụng là "Phê duyệt (sự kiện)" và một nút "Phê duyệt" dành riêng cho quy trình này. Kết hợp với các bộ sưu tập tùy chỉnh và khối tùy chỉnh độc đáo của NocoBase, bạn có thể nhanh chóng và linh hoạt tạo cũng như quản lý các kịch bản phê duyệt đa dạng.

## Tạo luồng công việc

Khi tạo một luồng công việc, hãy chọn loại "Phê duyệt" để tạo luồng công việc phê duyệt:

![Approval Trigger_Create Approval Workflow](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Sau đó, trong giao diện cấu hình luồng công việc, hãy nhấp vào trigger để mở hộp thoại và thực hiện các cấu hình bổ sung.

## Cấu hình Trigger

### Liên kết bộ sưu tập

Plugin Phê duyệt của NocoBase được thiết kế linh hoạt và có thể sử dụng với bất kỳ bộ sưu tập tùy chỉnh nào. Điều này có nghĩa là cấu hình phê duyệt không cần phải cấu hình lại mô hình dữ liệu mà có thể trực tiếp tái sử dụng bộ sưu tập đã tạo. Do đó, sau khi vào cấu hình trigger, trước tiên bạn cần chọn một bộ sưu tập để quyết định luồng công việc này sẽ được kích hoạt khi dữ liệu của bộ sưu tập đó được tạo hoặc cập nhật.

![Approval Trigger_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Sau đó, trong biểu mẫu tạo (hoặc chỉnh sửa) dữ liệu của bộ sưu tập tương ứng, hãy liên kết luồng công việc này với nút gửi:

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Sau đó, khi người dùng gửi biểu mẫu này, luồng công việc phê duyệt tương ứng sẽ được kích hoạt. Dữ liệu đã gửi không chỉ được lưu trong bộ sưu tập tương ứng mà còn được chụp nhanh vào luồng phê duyệt để những người phê duyệt sau này xem xét và sử dụng.

### Rút lại

Nếu một luồng công việc phê duyệt cho phép người khởi tạo rút lại, bạn cần bật nút "Rút lại" trong cấu hình giao diện của người khởi tạo:

![Approval Trigger_Trigger Configuration_Allow Withdraw](https://static-docs.nocobase.com/20251029232544.png)

Sau khi được bật, một phê duyệt được khởi tạo bởi luồng công việc này có thể được người khởi tạo rút lại trước khi bất kỳ người phê duyệt nào xử lý. Tuy nhiên, sau khi bất kỳ người phê duyệt nào trong một nút phê duyệt tiếp theo đã xử lý, nó sẽ không thể bị rút lại nữa.

:::info{title=Lưu ý}
Sau khi bật hoặc xóa nút rút lại, bạn cần nhấp vào lưu và gửi trong hộp thoại cấu hình trigger để các thay đổi có hiệu lực.
:::

### Cấu hình giao diện biểu mẫu của người khởi tạo phê duyệt

Cuối cùng, bạn cần cấu hình giao diện biểu mẫu của người khởi tạo. Giao diện này sẽ được sử dụng cho các thao tác gửi khi khởi tạo từ khối trung tâm phê duyệt và khi khởi tạo lại sau khi rút lại. Nhấp vào nút cấu hình để mở hộp thoại:

![Approval Trigger_Trigger Configuration_Initiator Form](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Bạn có thể thêm một biểu mẫu cho giao diện của người khởi tạo dựa trên bộ sưu tập đã liên kết, hoặc thêm văn bản mô tả (Markdown) để nhắc nhở và hướng dẫn. Biểu mẫu là bắt buộc; nếu không, người khởi tạo sẽ không thể thực hiện bất kỳ thao tác nào khi vào giao diện này.

Sau khi thêm một khối biểu mẫu, giống như trong giao diện cấu hình biểu mẫu thông thường, bạn có thể thêm các thành phần trường từ bộ sưu tập tương ứng và sắp xếp chúng theo ý muốn để tổ chức nội dung cần điền vào biểu mẫu:

![Approval Trigger_Trigger Configuration_Initiator Form_Field Configuration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Ngoài nút gửi trực tiếp, bạn cũng có thể thêm nút thao tác "Lưu bản nháp" để hỗ trợ quy trình lưu tạm thời:

![Approval Trigger_Trigger Configuration_Initiator Form_Action Configuration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Nút Phê duyệt

Trong một luồng công việc phê duyệt, bạn cần sử dụng nút "Phê duyệt" chuyên dụng để cấu hình logic thao tác cho người phê duyệt xử lý (duyệt, từ chối hoặc trả lại) phê duyệt đã khởi tạo. Nút "Phê duyệt" chỉ có thể được sử dụng trong các luồng công việc phê duyệt. Tham khảo [Nút Phê duyệt](../nodes/approval.md) để biết thêm chi tiết.

## Cấu hình khởi tạo phê duyệt

Sau khi cấu hình và bật một luồng công việc phê duyệt, bạn có thể liên kết luồng công việc đó với nút gửi biểu mẫu của bộ sưu tập tương ứng, cho phép người dùng khởi tạo phê duyệt khi gửi:

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Sau khi liên kết luồng công việc, khi người dùng gửi biểu mẫu hiện tại, một phê duyệt sẽ được khởi tạo.

:::info{title=Lưu ý}
Hiện tại, nút khởi tạo phê duyệt chỉ hỗ trợ nút 'Gửi' (hoặc 'Lưu') trong biểu mẫu tạo hoặc cập nhật. Nó không hỗ trợ nút 'Gửi đến luồng công việc' (nút này chỉ có thể được liên kết với 'Sự kiện sau thao tác').
:::

## Trung tâm việc cần làm

Trung tâm việc cần làm cung cấp một điểm truy cập thống nhất, giúp người dùng dễ dàng xem và xử lý các nhiệm vụ cần làm của họ. Các phê duyệt do người dùng hiện tại khởi tạo và các nhiệm vụ đang chờ xử lý của họ đều có thể được truy cập thông qua Trung tâm việc cần làm trên thanh công cụ phía trên, và các loại nhiệm vụ cần làm khác nhau có thể được xem thông qua điều hướng bên trái.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Các phê duyệt tôi đã khởi tạo

#### Xem các phê duyệt đã khởi tạo

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Trực tiếp khởi tạo một phê duyệt mới

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Việc cần làm của tôi

#### Danh sách việc cần làm

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Chi tiết việc cần làm

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## API HTTP

### Người khởi tạo

#### Khởi tạo từ bộ sưu tập

Để khởi tạo từ một khối dữ liệu, bạn có thể thực hiện cuộc gọi như sau (sử dụng nút tạo của bộ sưu tập `posts` làm ví dụ):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Trong đó, tham số URL `triggerWorkflows` là key của luồng công việc; nhiều luồng công việc được phân tách bằng dấu phẩy. Key này có thể được lấy bằng cách di chuột qua tên luồng công việc ở phía trên cùng của canvas luồng công việc:

![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)

Sau khi gọi thành công, luồng công việc phê duyệt cho bộ sưu tập `posts` tương ứng sẽ được kích hoạt.

:::info{title="Lưu ý"}
Vì các cuộc gọi bên ngoài cũng cần dựa trên danh tính người dùng, nên khi gọi qua API HTTP, giống như các yêu cầu được gửi từ giao diện thông thường, cần phải cung cấp thông tin xác thực, bao gồm tiêu đề yêu cầu `Authorization` hoặc tham số `token` (token nhận được khi đăng nhập), và tiêu đề yêu cầu `X-Role` (tên vai trò hiện tại của người dùng).
:::

Nếu bạn cần kích hoạt một sự kiện cho dữ liệu liên quan một-đối-một trong thao tác này (một-đối-nhiều hiện chưa được hỗ trợ), bạn có thể sử dụng `!` trong tham số để chỉ định dữ liệu kích hoạt cho trường liên kết:

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

Sau khi gọi thành công, sự kiện phê duyệt cho bộ sưu tập `categories` tương ứng sẽ được kích hoạt.

:::info{title="Lưu ý"}
Khi kích hoạt sự kiện sau thao tác thông qua API HTTP, bạn cũng cần chú ý đến trạng thái bật của luồng công việc và liệu cấu hình bộ sưu tập có khớp hay không; nếu không, cuộc gọi có thể không thành công hoặc có thể xảy ra lỗi.
:::

#### Khởi tạo từ Trung tâm phê duyệt

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

*   `collectionName`: Tên của bộ sưu tập mục tiêu để khởi tạo phê duyệt, bắt buộc.
*   `workflowId`: ID của luồng công việc được sử dụng để khởi tạo phê duyệt, bắt buộc.
*   `data`: Các trường của bản ghi bộ sưu tập được tạo khi khởi tạo phê duyệt, bắt buộc.
*   `status`: Trạng thái của bản ghi được tạo khi khởi tạo phê duyệt, bắt buộc. Các giá trị có thể bao gồm:
    *   `0`: Bản nháp, cho biết lưu nhưng không gửi để phê duyệt.
    *   `1`: Gửi để phê duyệt, cho biết người khởi tạo gửi yêu cầu phê duyệt, bắt đầu quy trình phê duyệt.

#### Lưu và gửi

Khi một phê duyệt đã khởi tạo (hoặc rút lại) đang ở trạng thái bản nháp, bạn có thể lưu hoặc gửi lại thông qua API sau:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Lấy danh sách các phê duyệt đã khởi tạo

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Rút lại

Người khởi tạo có thể rút lại một bản ghi hiện đang trong quá trình phê duyệt thông qua API sau:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Tham số**

*   `<approval id>`: ID của bản ghi phê duyệt cần rút lại, bắt buộc.

### Người phê duyệt

Sau khi luồng công việc phê duyệt đi vào nút phê duyệt, một nhiệm vụ cần làm sẽ được tạo cho người phê duyệt hiện tại. Người phê duyệt có thể hoàn thành nhiệm vụ phê duyệt thông qua giao diện hoặc bằng cách gọi API HTTP.

#### Lấy các bản ghi xử lý phê duyệt

Các nhiệm vụ cần làm là các bản ghi xử lý phê duyệt. Bạn có thể lấy tất cả các bản ghi xử lý phê duyệt của người dùng hiện tại thông qua API sau:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Trong đó, `approvalRecords` là một tài nguyên bộ sưu tập, vì vậy bạn có thể sử dụng các điều kiện truy vấn chung như `filter`, `sort`, `pageSize` và `page`.

#### Lấy một bản ghi xử lý phê duyệt duy nhất

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"`
```

#### Duyệt và từ chối

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

*   `<record id>`: ID của bản ghi cần xử lý phê duyệt, bắt buộc.
*   `status`: Trạng thái của quá trình xử lý phê duyệt. `2` là "Duyệt", `-1` là "Từ chối", bắt buộc.
*   `comment`: Thông tin ghi chú cho quá trình xử lý phê duyệt, tùy chọn.
*   `data`: Các sửa đổi đối với bản ghi bộ sưu tập tại nút phê duyệt hiện tại sau khi phê duyệt. Tùy chọn (chỉ có hiệu lực khi được duyệt).

#### Trả lại <Badge>v1.9.0+</Badge>

Trước phiên bản v1.9.0, việc trả lại sử dụng cùng API với "Duyệt" và "Từ chối", với `"status": 1` đại diện cho việc trả lại.

Bắt đầu từ phiên bản v1.9.0, việc trả lại có một API riêng:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Tham số**

*   `<record id>`: ID của bản ghi cần xử lý phê duyệt, bắt buộc.
*   `returnToNodeKey`: Key của nút mục tiêu để trả lại, tùy chọn. Khi một phạm vi các nút có thể trả lại được cấu hình trong nút, tham số này có thể được sử dụng để chỉ định trả lại nút nào. Nếu không được cấu hình, tham số này không cần truyền giá trị, mặc định sẽ trả lại điểm bắt đầu để người khởi tạo gửi lại.

#### Chuyển giao

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Tham số**

*   `<record id>`: ID của bản ghi cần xử lý phê duyệt, bắt buộc.
*   `assignee`: ID của người dùng được chuyển giao, bắt buộc.

#### Thêm người ký

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Tham số**

*   `<record id>`: ID của bản ghi cần xử lý phê duyệt, bắt buộc.
*   `assignees`: Danh sách ID người dùng cần thêm làm người ký, bắt buộc.
*   `order`: Thứ tự của người ký được thêm. `-1` có nghĩa là trước "tôi", `1` có nghĩa là sau "tôi".