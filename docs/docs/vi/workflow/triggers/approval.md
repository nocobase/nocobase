---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/workflow/triggers/approval).
:::

# Phê duyệt

## Giới thiệu

Phê duyệt là một dạng quy trình chuyên dụng được khởi tạo và xử lý bởi con người nhằm quyết định trạng thái của dữ liệu liên quan. Nó thường được sử dụng để quản lý quy trình trong tự động hóa văn phòng hoặc các công việc ra quyết định thủ công khác, ví dụ như có thể tạo và quản lý các luồng công việc thủ công cho các kịch bản như "đơn xin nghỉ phép", "phê duyệt chi phí" và "phê duyệt mua nguyên liệu".

Plugin Phê duyệt cung cấp một loại luồng công việc (trigger) chuyên dụng là "Phê duyệt (sự kiện)" và một nút "Phê duyệt" dành riêng cho quy trình này. Kết hợp với các bộ sưu tập tùy chỉnh và khối tùy chỉnh đặc trưng của NocoBase, bạn có thể nhanh chóng và linh hoạt tạo cũng như quản lý các kịch bản phê duyệt đa dạng.

## Tạo luồng công việc

Khi tạo luồng công việc, hãy chọn loại "Phê duyệt" để tạo luồng công việc phê duyệt:

![审批触发器_创建审批流程](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Sau đó, trong giao diện cấu hình luồng công việc, hãy nhấp vào trigger để mở cửa sổ bật lên và thực hiện thêm các cấu hình.

## Cấu hình Trigger

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Liên kết bộ sưu tập

Plugin Phê duyệt của NocoBase được thiết kế dựa trên tính linh hoạt, có thể sử dụng với bất kỳ bộ sưu tập tùy chỉnh nào, nghĩa là cấu hình phê duyệt không cần phải cấu hình lại mô hình dữ liệu mà trực tiếp tái sử dụng bộ sưu tập đã tạo. Do đó, sau khi vào cấu hình trigger, trước tiên bạn cần chọn bộ sưu tập để quyết định luồng công việc này sẽ thực hiện phê duyệt cho dữ liệu của bộ sưu tập nào:

![审批触发器_触发器配置_选择数据表](https://static-docs.nocobase.com/20251226103223.png)

### Phương thức kích hoạt

Khi khởi tạo phê duyệt cho dữ liệu nghiệp vụ, bạn có thể chọn hai phương thức kích hoạt sau:

*   **Trước khi lưu dữ liệu**

    Khởi tạo phê duyệt trước khi dữ liệu đã gửi được lưu, phù hợp với các kịch bản yêu cầu dữ liệu chỉ được lưu sau khi được phê duyệt. Trong chế độ này, dữ liệu tại thời điểm khởi tạo chỉ là dữ liệu tạm thời, chỉ sau khi được phê duyệt mới chính thức được lưu vào bộ sưu tập tương ứng.

*   **Sau khi lưu dữ liệu**

    Khởi tạo phê duyệt sau khi dữ liệu đã gửi được lưu, phù hợp với các kịch bản dữ liệu có thể được lưu trước rồi mới phê duyệt. Trong chế độ này, dữ liệu tại thời điểm khởi tạo đã được lưu vào bộ sưu tập tương ứng, và các sửa đổi trong quá trình phê duyệt cũng sẽ được lưu lại.

### Vị trí khởi tạo phê duyệt

Có thể chọn vị trí khởi tạo phê duyệt trong hệ thống:

*   **Chỉ khởi tạo trong khối dữ liệu**

    Có thể liên kết thao tác của bất kỳ khối biểu mẫu nào của bảng này với luồng công việc này để khởi tạo phê duyệt, đồng thời xử lý và theo dõi quá trình phê duyệt trong khối phê duyệt của một bản ghi dữ liệu duy nhất, thường phù hợp với dữ liệu nghiệp vụ.

*   **Có thể khởi tạo trong cả khối dữ liệu và Trung tâm việc cần làm**

    Ngoài khối dữ liệu, cũng có thể khởi tạo và xử lý phê duyệt trong Trung tâm việc cần làm chung, thường phù hợp với dữ liệu hành chính.

### Ai có thể khởi tạo phê duyệt

Có thể cấu hình quyền dựa trên phạm vi người dùng để quyết định người dùng nào có thể khởi tạo phê duyệt này:

*   **Tất cả người dùng**

    Tất cả người dùng trong hệ thống đều có thể khởi tạo phê duyệt này.

*   **Chỉ những người dùng đã chọn**

    Chỉ cho phép người dùng trong phạm vi chỉ định khởi tạo phê duyệt này, có thể chọn nhiều người.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Cấu hình giao diện biểu mẫu của người khởi tạo

Cuối cùng, cần cấu hình giao diện biểu mẫu của người khởi tạo, giao diện này sẽ được sử dụng cho các thao tác gửi khi khởi tạo từ khối Trung tâm phê duyệt và khi khởi tạo lại sau khi người dùng rút lại. Nhấp vào nút cấu hình để mở cửa sổ bật lên:

![审批触发器_触发器配置_发起人表单](https://static-docs.nocobase.com/20251226130239.png)

Có thể thêm biểu mẫu điền thông tin dựa trên bộ sưu tập đã liên kết cho giao diện của người khởi tạo, hoặc thêm văn bản hướng dẫn (Markdown) để gợi ý và dẫn dắt. Trong đó, biểu mẫu là bắt buộc phải thêm, nếu không người khởi tạo sẽ không thể thao tác sau khi vào giao diện này.

Sau khi thêm khối biểu mẫu, giống như giao diện cấu hình biểu mẫu thông thường, bạn có thể thêm các thành phần trường của bộ sưu tập tương ứng và sắp xếp tùy ý để tổ chức nội dung cần điền trong biểu mẫu:

![审批触发器_触发器配置_发起人表单_字段配置](https://static-docs.nocobase.com/20251226130339.png)

Khác với nút gửi trực tiếp, bạn cũng có thể thêm nút thao tác "Lưu bản nháp" để hỗ trợ quy trình xử lý lưu tạm thời:

![审批触发器_触发器配置_发起人表单_操作配置_保存](https://static-docs.nocobase.com/20251226130512.png)

Nếu một quy trình phê duyệt cho phép người khởi tạo rút lại, cần bật nút "Rút lại" trong cấu hình giao diện người khởi tạo:

![审批触发器_触发器配置_允许撤回](https://static-docs.nocobase.com/20251226130637.png)

Sau khi bật, phê duyệt do quy trình này khởi tạo có thể được người khởi tạo rút lại trước khi bất kỳ người phê duyệt nào xử lý, nhưng sau khi bất kỳ người phê duyệt nào được cấu hình trong các nút phê duyệt tiếp theo đã xử lý, nó sẽ không còn có thể rút lại.

:::info{title=Gợi ý}
Sau khi bật hoặc xóa nút rút lại, cần nhấp vào lưu và gửi trong cửa sổ bật lên cấu hình trigger để có hiệu lực.
:::

### Thẻ "Đơn đăng ký của tôi" <Badge>2.0+</Badge>

Có thể được sử dụng để cấu hình các thẻ nhiệm vụ trong danh sách "Đơn đăng ký của tôi" tại Trung tâm việc cần làm.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Trong thẻ, bạn có thể tự do cấu hình các trường nghiệp vụ muốn hiển thị (ngoại trừ các trường quan hệ) hoặc thông tin liên quan đến phê duyệt.

Sau khi đơn đăng ký phê duyệt được tạo, bạn có thể thấy thẻ nhiệm vụ tùy chỉnh trong danh sách Trung tâm việc cần làm:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Chế độ hiển thị bản ghi trong quy trình

*   **Ảnh chụp nhanh (Snapshot)**

    Trong quy trình phê duyệt, trạng thái bản ghi mà người đăng ký và người phê duyệt nhìn thấy khi truy cập, và sau khi gửi chỉ có thể nhìn thấy bản ghi do chính mình sửa đổi - sẽ không nhìn thấy các cập nhật do người khác thực hiện sau đó.

*   **Mới nhất**

    Trong quy trình phê duyệt, người đăng ký và người phê duyệt luôn nhìn thấy phiên bản mới nhất của bản ghi trong suốt quy trình, bất kể trạng thái của bản ghi trước khi họ thao tác là gì. Sau khi quy trình kết thúc, họ sẽ nhìn thấy phiên bản cuối cùng của bản ghi.

## Nút Phê duyệt

Trong luồng công việc phê duyệt, cần sử dụng nút "Phê duyệt" chuyên dụng để cấu hình logic thao tác cho người phê duyệt xử lý (thông qua, từ chối hoặc trả lại) phê duyệt đã khởi tạo, nút "Phê duyệt" cũng chỉ có thể được sử dụng trong luồng công việc phê duyệt. Tham khảo [Nút phê duyệt](../nodes/approval.md) để biết thêm chi tiết.

:::info{title=Gợi ý}
Nếu một quy trình phê duyệt không có bất kỳ nút "Phê duyệt" nào, quy trình đó sẽ được tự động thông qua.
:::

## Cấu hình khởi tạo phê duyệt

Sau khi cấu hình và bật một luồng công việc phê duyệt, bạn có thể liên kết luồng công việc đó với nút gửi biểu mẫu của bộ sưu tập tương ứng để người dùng khởi tạo phê duyệt khi gửi:

![发起审批_绑定工作流](https://static-docs.nocobase.com/20251226110710.png)

Sau đó, việc người dùng gửi biểu mẫu đó sẽ kích hoạt luồng công việc phê duyệt tương ứng, dữ liệu đã gửi ngoài việc được lưu trong bộ sưu tập tương ứng, cũng sẽ được chụp nhanh vào luồng phê duyệt để nhân viên phê duyệt sau này tra cứu và sử dụng.

:::info{title=Gợi ý}
Nút khởi tạo phê duyệt hiện chỉ hỗ trợ sử dụng nút "Gửi" (hoặc "Lưu") trong biểu mẫu thêm mới hoặc cập nhật, không hỗ trợ sử dụng nút "Kích hoạt luồng công việc" (nút này chỉ có thể liên kết với "Sự kiện thao tác tùy chỉnh").
:::

## Trung tâm việc cần làm

Trung tâm việc cần làm cung cấp một lối vào thống nhất, thuận tiện cho người dùng xem và xử lý các nhiệm vụ cần làm. Các phê duyệt do người dùng hiện tại khởi tạo và các nhiệm vụ cần làm đều có thể truy cập thông qua Trung tâm việc cần làm trên thanh công cụ phía trên, và xem các loại nhiệm vụ cần làm khác nhau thông qua điều hướng phân loại bên trái.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Tôi đã khởi tạo

#### Xem các phê duyệt đã khởi tạo

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Trực tiếp khởi tạo phê duyệt mới

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Việc cần làm của tôi

#### Danh sách việc cần làm

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Chi tiết việc cần làm

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Người khởi tạo

#### Khởi tạo từ bộ sưu tập

Khởi tạo từ khối dữ liệu, đều có thể gọi như sau (lấy ví dụ nút tạo của bảng `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Trong đó tham số URL `triggerWorkflows` là key của luồng công việc, nhiều luồng công việc được phân tách bằng dấu phẩy. Key này có thể lấy được bằng cách di chuột lên tên luồng công việc ở phía trên cùng của canvas luồng công việc:

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

Sau khi gọi thành công, sẽ kích hoạt luồng công việc phê duyệt của bảng `posts` tương ứng.

:::info{title="Gợi ý"}
Vì các cuộc gọi bên ngoài cũng cần dựa trên danh tính người dùng, nên khi gọi qua HTTP API, giống như các yêu cầu được gửi từ giao diện thông thường, đều cần cung cấp thông tin xác thực, bao gồm tiêu đề `Authorization` hoặc tham số `token` (token nhận được khi đăng nhập), và tiêu đề `X-Role` (tên vai trò hiện tại của người dùng).
:::

Nếu cần kích hoạt sự kiện cho dữ liệu quan hệ đối một (đối nhiều hiện chưa hỗ trợ) trong thao tác đó, bạn có thể sử dụng `!` trong tham số để chỉ định dữ liệu kích hoạt của trường quan hệ:

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

Sau khi gọi thành công như trên, sẽ kích hoạt sự kiện phê duyệt của bảng `categories` tương ứng.

:::info{title="Gợi ý"}
Khi kích hoạt sự kiện sau thao tác thông qua gọi HTTP API, cũng cần chú ý đến trạng thái bật của luồng công việc, cũng như cấu hình bộ sưu tập có khớp hay không, nếu không có thể sẽ không gọi thành công hoặc xuất hiện lỗi.
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

* `collectionName`: Tên bộ sưu tập mục tiêu khởi tạo phê duyệt, bắt buộc.
* `workflowId`: ID luồng công việc sử dụng để khởi tạo phê duyệt, bắt buộc.
* `data`: Các trường bản ghi bộ sưu tập được tạo khi khởi tạo phê duyệt, bắt buộc.
* `status`: Trạng thái bản ghi được tạo khi khởi tạo phê duyệt, bắt buộc. Các giá trị tùy chọn bao gồm:
  * `0`: Bản nháp, biểu thị lưu nhưng không gửi phê duyệt.
  * `2`: Gửi phê duyệt, biểu thị người khởi tạo gửi đơn đăng ký phê duyệt, đi vào phê duyệt.

#### Lưu và gửi

Khi phê duyệt đã khởi tạo (hoặc rút lại) đang ở trạng thái bản nháp, có thể lưu hoặc gửi lại thông qua giao diện sau:

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

Người khởi tạo có thể rút lại bản ghi hiện đang trong quá trình phê duyệt thông qua giao diện sau:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Tham số**

* `<approval id>`: ID bản ghi phê duyệt cần rút lại, bắt buộc.

### Người phê duyệt

Sau khi quy trình phê duyệt đi vào nút phê duyệt, sẽ tạo nhiệm vụ cần làm cho người phê duyệt hiện tại. Người phê duyệt có thể hoàn thành nhiệm vụ phê duyệt thông qua thao tác giao diện, cũng có thể hoàn thành thông qua gọi HTTP API.

#### Lấy bản ghi xử lý phê duyệt

Nhiệm vụ cần làm chính là bản ghi xử lý phê duyệt, có thể lấy tất cả các bản ghi xử lý phê duyệt của người dùng hiện tại thông qua giao diện sau:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Trong đó `approvalRecords` đóng vai trò là tài nguyên bộ sưu tập, cũng có thể sử dụng các điều kiện truy vấn thông dụng như `filter`, `sort`, `pageSize` và `page`.

#### Lấy một bản ghi xử lý phê duyệt duy nhất

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
* `status`: Trường là trạng thái xử lý phê duyệt, `2` biểu thị "Thông qua", `-1` biểu thị "Từ chối", bắt buộc.
* `comment`: Thông tin ghi chú của xử lý phê duyệt, tùy chọn.
* `data`: Biểu thị các sửa đổi đối với bản ghi bộ sưu tập tại nút phê duyệt hiện tại sau khi phê duyệt thông qua, tùy chọn (chỉ có hiệu lực khi thông qua).

#### Trả lại <Badge>v1.9.0+</Badge>

Trước phiên bản v1.9.0, trả lại sử dụng cùng một giao diện với "Thông qua", "Từ chối", sử dụng `"status": 1` đại diện cho trả lại.

Từ phiên bản v1.9.0, trả lại đã có giao diện riêng biệt:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Tham số**

* `<record id>`: ID bản ghi cần xử lý phê duyệt, bắt buộc.
* `returnToNodeKey`: Key của nút mục tiêu trả lại, tùy chọn. Khi trong nút cấu hình phạm vi các nút có thể trả lại, có thể sử dụng tham số này để chỉ định trả lại nút nào. Trong trường hợp không cấu hình, tham số này không cần truyền giá trị, mặc định sẽ trả lại điểm bắt đầu, do người khởi tạo gửi lại.

#### Chuyển giao

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Tham số**

* `<record id>`: ID bản ghi cần xử lý phê duyệt, bắt buộc.
* `assignee`: ID người dùng chuyển giao, bắt buộc.

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
* `assignees`: Danh sách ID người dùng được thêm ký, bắt buộc.
* `order`: Thứ tự thêm ký, `-1` biểu thị trước "tôi", `1` biểu thị sau "tôi".