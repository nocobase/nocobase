---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
title: "Sự kiện Action tùy chỉnh"
description: "Trigger sự kiện Action tùy chỉnh: liên kết nút Action tùy chỉnh, kích hoạt Workflow khi bấm, triển khai tự động hóa được điều khiển bởi nút."
keywords: "workflow,sự kiện action tùy chỉnh,Custom Action,kích hoạt nút,liên kết workflow,NocoBase"
---
# Sự kiện Action tùy chỉnh

## Giới thiệu

NocoBase đã tích hợp sẵn các Action dữ liệu thông thường (thêm, xóa, sửa, xem...), khi các Action này không thể đáp ứng yêu cầu nghiệp vụ phức tạp, có thể sử dụng sự kiện Action tùy chỉnh trong Workflow và liên kết sự kiện đó với nút "Kích hoạt Workflow" trong Block của trang, sau khi người dùng bấm sẽ kích hoạt Workflow Action tùy chỉnh.

## Tạo Workflow

Khi tạo Workflow, chọn "Sự kiện Action tùy chỉnh":

![Tạo Workflow "Sự kiện Action tùy chỉnh"](https://static-docs.nocobase.com/20240509091820.png)

## Cấu hình Trigger

### Loại ngữ cảnh

> v.1.6.0+

Sự khác nhau của loại ngữ cảnh sẽ quyết định Workflow này có thể được liên kết trên các nút của Block nào:

* Không có ngữ cảnh: tức sự kiện toàn cục, có thể liên kết trên panel Action, nút Action của Block dữ liệu;
* Một dòng dữ liệu: có thể liên kết trên nút Action của các Block dữ liệu như dòng dữ liệu bảng, form, chi tiết...;
* Nhiều dòng dữ liệu: có thể liên kết trên nút Action hàng loạt của bảng.

![Cấu hình Trigger_loại ngữ cảnh](https://static-docs.nocobase.com/20250215135808.png)

### Bảng dữ liệu

Khi loại ngữ cảnh là một dòng dữ liệu hoặc nhiều dòng dữ liệu, cần chọn bảng dữ liệu cần liên kết với mô hình dữ liệu:

![Cấu hình Trigger_chọn bảng dữ liệu](https://static-docs.nocobase.com/20250215135919.png)

### Dữ liệu quan hệ cần sử dụng

Nếu cần sử dụng dữ liệu liên kết của dòng dữ liệu kích hoạt trong Workflow, có thể chọn các trường liên kết sâu hơn ở đây:

![Cấu hình Trigger_chọn dữ liệu quan hệ cần sử dụng](https://static-docs.nocobase.com/20250215135955.png)

Các trường này sẽ được tự động preload vào ngữ cảnh của Workflow sau khi sự kiện được kích hoạt để sử dụng trong Workflow.

## Cấu hình Action

Tùy thuộc vào loại ngữ cảnh được cấu hình của Workflow, cấu hình nút Action ở các Block khác nhau cũng có sự khác biệt.

### Không có ngữ cảnh

> v1.6.0+

Trong panel Action và các Block dữ liệu khác đều có thể thêm nút "Kích hoạt Workflow":

![Block thêm nút Action_panel Action](https://static-docs.nocobase.com/20250215221738.png)

![Block thêm nút Action_lịch](https://static-docs.nocobase.com/20250215221942.png)

![Block thêm nút Action_biểu đồ Gantt](https://static-docs.nocobase.com/20250215221810.png)

Sau khi thêm nút, liên kết với Workflow không có ngữ cảnh đã được tạo trước đó, lấy ví dụ nút trong panel Action:

![Nút liên kết Workflow_panel Action](https://static-docs.nocobase.com/20250215222120.png)

![Chọn Workflow để liên kết_không có ngữ cảnh](https://static-docs.nocobase.com/20250215222234.png)

### Bản ghi một dòng

Trong bất kỳ Block dữ liệu nào, đối với cột thao tác của một dòng dữ liệu đều có thể thêm nút "Kích hoạt Workflow", như form, dòng dữ liệu của bảng, chi tiết...:

![Block thêm nút Action_form](https://static-docs.nocobase.com/20240509165428.png)

![Block thêm nút Action_dòng bảng](https://static-docs.nocobase.com/20240509165340.png)

![Block thêm nút Action_chi tiết](https://static-docs.nocobase.com/20240509165545.png)

Sau khi thêm nút, liên kết với Workflow đã được tạo trước đó:

![Nút liên kết Workflow](https://static-docs.nocobase.com/20240509165631.png)

![Chọn Workflow để liên kết](https://static-docs.nocobase.com/20240509165658.png)

Sau đó bấm vào nút này là có thể kích hoạt sự kiện Action tùy chỉnh đó:

![Kết quả kích hoạt khi bấm nút](https://static-docs.nocobase.com/20240509170453.png)

### Bản ghi nhiều dòng

> v1.6.0+

Trong cột thao tác của Block bảng, khi thêm nút "Kích hoạt Workflow" sẽ có một tùy chọn bổ sung, chọn loại ngữ cảnh là "Không có ngữ cảnh" hoặc "Nhiều dòng dữ liệu":

![Block thêm nút Action_bảng](https://static-docs.nocobase.com/20250215222507.png)

Khi chọn "Không có ngữ cảnh", tức là sự kiện toàn cục, chỉ có thể liên kết Workflow loại không có ngữ cảnh.

Khi chọn "Nhiều dòng dữ liệu", có thể liên kết Workflow loại nhiều dòng dữ liệu, có thể được dùng để Action hàng loạt sau khi chọn nhiều dữ liệu (hiện chỉ bảng hỗ trợ). Lúc này phạm vi Workflow có thể chọn chỉ là Workflow đã được cấu hình khớp với bảng dữ liệu của Block dữ liệu hiện tại:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Khi bấm nút để kích hoạt, phải đã chọn một số dòng dữ liệu trong bảng, nếu không sẽ không kích hoạt Workflow:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Ví dụ

Ví dụ, chúng ta có một bảng dữ liệu "Mẫu", đối với các mẫu "Đã thu thập" (trạng thái) cần cung cấp một Action "Gửi xét nghiệm", việc gửi xét nghiệm sẽ kiểm tra thông tin cơ bản của mẫu trước, sau đó sinh một dữ liệu "Bản ghi gửi xét nghiệm", rồi sửa trạng thái mẫu thành "Đã gửi xét nghiệm". Mà chuỗi quá trình này không thể hoàn thành thông qua việc bấm các nút "Thêm xóa sửa" đơn giản, lúc này có thể sử dụng sự kiện Action tùy chỉnh để triển khai.

Trước tiên tạo một bảng dữ liệu "Mẫu" và một bảng dữ liệu "Bản ghi gửi xét nghiệm", nhập dữ liệu kiểm thử cơ bản vào bảng mẫu:

![Ví dụ_bảng dữ liệu mẫu](https://static-docs.nocobase.com/20240509172234.png)

Sau đó tạo một Workflow "Sự kiện Action tùy chỉnh", nếu cần quy trình thao tác có phản hồi tương đối kịp thời, có thể chọn chế độ đồng bộ (ở chế độ đồng bộ không thể sử dụng các Node loại bất đồng bộ như xử lý thủ công):

![Ví dụ_tạo Workflow](https://static-docs.nocobase.com/20240509173106.png)

Trong cấu hình Trigger, bảng dữ liệu chọn "Mẫu":

![Ví dụ_cấu hình Trigger](https://static-docs.nocobase.com/20240509173148.png)

Theo yêu cầu nghiệp vụ, điều phối logic trong quy trình, ví dụ tham số chỉ tiêu lớn hơn `90` thì mới được phép gửi xét nghiệm, nếu không thì nhắc vấn đề liên quan:

![Ví dụ_điều phối logic nghiệp vụ](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Mẹo}
Node "[Thông báo phản hồi](../nodes/response-message.md)" có thể được sử dụng trong sự kiện Action tùy chỉnh đồng bộ, dùng để trả về thông tin nhắc cho client. Không thể sử dụng ở chế độ bất đồng bộ.
:::

Sau khi cấu hình xong quy trình và bật, quay lại giao diện bảng và thêm nút "Kích hoạt Workflow" trong cột thao tác của bảng:

![Ví dụ_thêm nút Action](https://static-docs.nocobase.com/20240509174525.png)

Sau đó trong menu cấu hình của nút chọn liên kết Workflow để mở popup cấu hình:

![Ví dụ_mở popup liên kết Workflow](https://static-docs.nocobase.com/20240509174633.png)

Thêm Workflow đã được bật trước đó:

![Ví dụ_chọn Workflow](https://static-docs.nocobase.com/20240509174723.png)

Sau khi gửi, sửa text của nút thành tên Action như "Gửi xét nghiệm", việc cấu hình quy trình đã hoàn tất.

Khi sử dụng, chọn một dữ liệu mẫu bất kỳ trong bảng và bấm nút "Gửi xét nghiệm" là có thể kích hoạt sự kiện Action tùy chỉnh. Như logic được điều phối trước đó, nếu tham số chỉ tiêu mẫu nhỏ hơn 90, sau khi bấm sẽ nhắc như sau:

![Ví dụ_chỉ tiêu không thỏa mãn để gửi xét nghiệm](https://static-docs.nocobase.com/20240509175026.png)

Nếu tham số chỉ tiêu lớn hơn 90, sẽ thực thi quy trình bình thường, sinh dữ liệu "Bản ghi gửi xét nghiệm" và sửa trạng thái mẫu thành "Đã gửi xét nghiệm":

![Ví dụ_gửi xét nghiệm thành công](https://static-docs.nocobase.com/20240509175247.png)

Đến đây, một sự kiện Action tùy chỉnh đơn giản đã hoàn tất. Tương tự, đối với các nghiệp vụ có thao tác phức tạp như xử lý đơn hàng, gửi báo cáo... đều có thể được triển khai thông qua sự kiện Action tùy chỉnh.

## Gọi từ bên ngoài

Việc kích hoạt sự kiện Action tùy chỉnh không chỉ giới hạn ở thao tác trên giao diện người dùng mà còn có thể được kích hoạt thông qua HTTP API. Đặc biệt, sự kiện Action tùy chỉnh cung cấp loại Action mới `trigger` để kích hoạt Workflow cho tất cả các Action bảng dữ liệu, có thể cài đặt API Action tiêu chuẩn của NocoBase để gọi.

:::info{title="Mẹo"}
Vì việc gọi từ bên ngoài cũng cần dựa trên danh tính người dùng, nên khi gọi qua HTTP API, giống như request thông thường được gửi từ giao diện, đều cần cung cấp thông tin xác thực, bao gồm header `Authorization` hoặc tham số `token` (token nhận được khi đăng nhập), và header `X-Role` (tên vai trò hiện tại của người dùng).
:::

### Không có ngữ cảnh

Workflow không có ngữ cảnh cần thực hiện Action kích hoạt nhằm vào tài nguyên workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Bản ghi một dòng

Tương tự như Workflow được kích hoạt bởi nút trong ví dụ, có thể gọi như sau:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Vì Action này nhằm vào một dữ liệu đơn lẻ, nên khi gọi đối với dữ liệu hiện có, cần chỉ định ID dòng dữ liệu, thay thế phần `<:id>` trong URL.

Nếu là gọi nhằm vào form (như thêm hoặc cập nhật), với form thêm dữ liệu mới có thể không truyền ID nhưng cần truyền dữ liệu được gửi làm dữ liệu ngữ cảnh thực thi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Đối với form cập nhật, cần đồng thời truyền ID dòng dữ liệu và dữ liệu cập nhật:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Nếu đồng thời truyền ID và dữ liệu, sẽ load dòng dữ liệu tương ứng với ID trước, rồi sử dụng các thuộc tính trong đối tượng dữ liệu được truyền vào để ghi đè dòng dữ liệu gốc để thu được dữ liệu ngữ cảnh kích hoạt cuối cùng.

:::warning{title="Lưu ý"}
Nếu truyền vào dữ liệu quan hệ, cũng sẽ được ghi đè, đặc biệt khi đã cấu hình các mục dữ liệu quan hệ preload, cần xử lý cẩn thận dữ liệu được truyền vào để tránh dữ liệu quan hệ bị ghi đè không như mong đợi.
:::

Ngoài ra, tham số URL `triggerWorkflows` là key của Workflow, nhiều Workflow phân tách bằng dấu phẩy. Key này có thể nhận được khi rê chuột qua tên Workflow trên đầu canvas Workflow:

![Cách xem key Workflow](https://static-docs.nocobase.com/20240426135108.png)

Sau khi gọi như trên thành công, sẽ kích hoạt sự kiện Action tùy chỉnh của bảng `samples` tương ứng.

:::info{title="Mẹo"}
Khi kích hoạt sự kiện sau Action thông qua HTTP API, cũng cần lưu ý trạng thái bật của Workflow và việc cấu hình bảng dữ liệu có khớp không, nếu không có thể không gọi thành công hoặc xuất hiện lỗi.
:::

### Bản ghi nhiều dòng

Tương tự cách gọi của bản ghi một dòng nhưng dữ liệu truyền vào chỉ cần nhiều tham số khóa chính (`filterByTk[]`) và không cần truyền phần data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Lời gọi này sẽ kích hoạt sự kiện Action tùy chỉnh chế độ bản ghi nhiều dòng và lấy dữ liệu có id 1 và 2 làm dữ liệu trong ngữ cảnh Trigger.
