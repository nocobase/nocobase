---
pkg: '@nocobase/plugin-workflow-action-trigger'
title: "Sự kiện sau Action"
description: "Trigger sự kiện sau Action: kích hoạt Workflow sau khi Action được thực thi, như tự động tạo liên kết sau khi lưu, gửi thông báo, đồng bộ dữ liệu."
keywords: "workflow,sự kiện sau action,Post Action,kích hoạt sau khi lưu,đồng bộ dữ liệu,NocoBase"
---
# Sự kiện sau Action

## Giới thiệu

Tất cả biến động dữ liệu được người dùng tạo ra trong hệ thống thường được hoàn thành thông qua một thao tác nào đó, hình thức cụ thể thường là bấm vào một nút nào đó, nút có thể là nút gửi trong form hoặc nút Action trong Block dữ liệu. Sự kiện sau Action được dùng để liên kết các thao tác trên những nút này với Workflow liên quan, để đạt được hiệu quả kích hoạt quy trình cụ thể sau khi thao tác của người dùng thành công.

Ví dụ, khi thêm hoặc cập nhật dữ liệu, người dùng có thể thông qua việc cấu hình tùy chọn "Liên kết Workflow" của nút, sau khi bấm thao tác hoàn tất sẽ kích hoạt Workflow được liên kết.

Về mặt triển khai, vì việc xử lý sự kiện sau Action nằm ở tầng middleware (middleware của Koa), do đó các lời gọi HTTP API của NocoBase cũng có thể kích hoạt sự kiện sau Action đã được định nghĩa.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Cấu hình Trigger

### Tạo Workflow

Khi tạo Workflow, loại chọn "Sự kiện sau Action":

![Tạo Workflow_Trigger sự kiện sau Action](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Chế độ thực thi

Đối với sự kiện sau Action, khi tạo còn có thể chọn chế độ thực thi là "Đồng bộ" hoặc "Bất đồng bộ":

![Tạo Workflow_chọn đồng bộ hoặc bất đồng bộ](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Nếu là quy trình cần thực thi và trả về ngay sau khi người dùng thao tác, có thể sử dụng chế độ đồng bộ, ngược lại mặc định là chế độ bất đồng bộ. Ở chế độ bất đồng bộ, sau khi kích hoạt Workflow thì thao tác đó hoàn tất, Workflow sẽ được thực thi tuần tự ở backend ứng dụng theo dạng hàng đợi.

### Cấu hình bảng dữ liệu

Vào canvas Workflow, bấm vào Trigger để mở popup cấu hình, đầu tiên cần chọn bảng dữ liệu cần liên kết:

![Cấu hình Workflow_chọn bảng dữ liệu](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Chọn chế độ kích hoạt

Sau đó chọn chế độ kích hoạt, có hai loại là chế độ cục bộ và chế độ toàn cục:

![Cấu hình Workflow_chọn chế độ kích hoạt](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Trong đó:

* Chế độ cục bộ chỉ kích hoạt trên các nút Action được liên kết với Workflow này, các nút không liên kết Workflow này sau khi bấm sẽ không kích hoạt. Có thể dựa trên việc cân nhắc các form có mục đích khác nhau có kích hoạt cùng một quy trình hay không để quyết định có liên kết Workflow này hay không.
* Chế độ toàn cục thì sẽ kích hoạt trên tất cả các nút Action được cấu hình trên bảng dữ liệu, không phân biệt từ form nào và cũng không cần liên kết với Workflow tương ứng.

Ở chế độ cục bộ, hiện hỗ trợ liên kết các nút Action sau:

* Nút "Gửi" và "Lưu" của form thêm.
* Nút "Gửi" và "Lưu" của form cập nhật.
* Nút "Cập nhật dữ liệu" trong dòng dữ liệu (bảng, danh sách, kanban...).

### Chọn loại Action

Nếu chọn chế độ toàn cục, còn cần chọn loại Action, hiện hỗ trợ "Action tạo dữ liệu" và "Action cập nhật dữ liệu". Cả hai Action đều kích hoạt Workflow sau khi Action thành công.

### Chọn dữ liệu quan hệ preload

Nếu cần sử dụng dữ liệu liên kết của dữ liệu kích hoạt trong các bước tiếp theo, có thể chọn các trường quan hệ cần preload:

![Cấu hình Workflow_preload quan hệ](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Sau khi kích hoạt có thể trực tiếp sử dụng các dữ liệu liên kết này trong quy trình.

## Cấu hình Action

Đối với Action ở chế độ kích hoạt cục bộ, sau khi cấu hình Workflow xong, cần quay lại giao diện người dùng và liên kết Workflow này với nút Action form trong Block dữ liệu tương ứng.

Workflow được cấu hình cho nút "Gửi" (bao gồm nút "Lưu dữ liệu") sẽ được kích hoạt sau khi người dùng gửi form tương ứng và Action dữ liệu hoàn tất.

![Sự kiện sau Action_nút gửi](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Từ menu cấu hình của nút chọn "Liên kết Workflow" để mở popup cấu hình liên kết. Trong popup có thể cấu hình bao nhiêu Workflow muốn kích hoạt cũng được, nếu không cấu hình cái nào nghĩa là không cần kích hoạt. Đối với mỗi Workflow, cần giới hạn trước dữ liệu kích hoạt là dữ liệu của toàn bộ form hay dữ liệu của trường quan hệ nào đó trong form, sau đó dựa trên bảng dữ liệu tương ứng với mô hình dữ liệu được chọn để chọn Workflow form đã được cấu hình khớp với mô hình bảng đó.

![Sự kiện sau Action_cấu hình liên kết Workflow_chọn ngữ cảnh](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Sự kiện sau Action_cấu hình liên kết Workflow_chọn Workflow](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Mẹo"}
Workflow cần được bật mới có thể được chọn trong giao diện trên.
:::

## Ví dụ

Ở đây minh họa thông qua thao tác thêm.

Giả sử tình huống "Đề nghị hoàn ứng", chúng ta cần sau khi nhân viên gửi đề nghị hoàn ứng chi phí, sẽ thực hiện kiểm duyệt tự động hạn mức và kiểm duyệt thủ công khi vượt hạn mức, chỉ những đề nghị được kiểm duyệt thành công mới được thông qua, sau đó giao cho bộ phận tài chính xử lý.

Đầu tiên, chúng ta tạo một bảng dữ liệu "Hoàn ứng chi phí" với các trường sau:

- Tên dự án: Văn bản một dòng
- Người đề nghị: Nhiều - một (User)
- Số tiền: Số
- Trạng thái: Lựa chọn đơn ("Kiểm duyệt thông qua", "Xử lý hoàn tất")

Sau đó tạo một Workflow loại "Sự kiện sau Action" và cấu hình mô hình bảng dữ liệu trong Trigger thành bảng "Hoàn ứng chi phí":

![Ví dụ_cấu hình Trigger_chọn bảng dữ liệu](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Sau khi đặt Workflow ở trạng thái bật, các Node xử lý cụ thể của quy trình sẽ quay lại cấu hình sau.

Sau đó chúng ta tạo Block bảng của bảng dữ liệu "Hoàn ứng chi phí" trên giao diện và thêm nút "Thêm" trên thanh công cụ, cấu hình các trường form tương ứng. Trong mục cấu hình của nút Action "Gửi" form, mở hộp thoại cấu hình "Liên kết Workflow" của nút, chọn dữ liệu của toàn bộ form làm ngữ cảnh và Workflow là Workflow chúng ta đã tạo trước đó:

![Ví dụ_cấu hình nút form_liên kết Workflow](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Sau khi cấu hình form xong, quay lại điều phối logic của Workflow. Ví dụ chúng ta cần khi số tiền lớn hơn 500 đồng yêu cầu admin kiểm duyệt thủ công, ngược lại trực tiếp thông qua, sau khi kiểm duyệt thông qua mới tạo bản ghi hoàn ứng và bộ phận tài chính tiếp tục xử lý (lược).

![Ví dụ_quy trình xử lý](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Bỏ qua phần xử lý của tài chính sau đó, như vậy đã hoàn tất cấu hình quy trình đề nghị hoàn ứng. Khi nhân viên điền đơn đề nghị hoàn ứng và gửi, sẽ kích hoạt Workflow tương ứng, nếu số tiền nhỏ hơn 500 sẽ tự động tạo bản ghi và chờ tài chính xử lý tiếp, ngược lại sẽ do quản lý kiểm duyệt, sau khi kiểm duyệt thông qua cũng tương tự tạo bản ghi và giao cho tài chính xử lý.

Quy trình của ví dụ này cũng có thể được cấu hình trên nút "Gửi" thông thường, có thể tùy theo tình huống nghiệp vụ cụ thể để quyết định có cần tạo bản ghi trước rồi mới thực thi quy trình tiếp theo hay không.

## Gọi từ bên ngoài

Việc kích hoạt sự kiện sau Action không chỉ giới hạn ở thao tác trên giao diện người dùng mà còn có thể được kích hoạt thông qua HTTP API.

:::info{title="Mẹo"}
Khi kích hoạt sự kiện sau Action thông qua HTTP API, cũng cần lưu ý trạng thái bật của Workflow và việc cấu hình bảng dữ liệu có khớp không, nếu không có thể không gọi thành công hoặc xuất hiện lỗi.
:::

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

Sau khi gọi như trên thành công, sẽ kích hoạt sự kiện sau Action của bảng `posts` tương ứng.

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

Sau khi gọi như trên thành công, sẽ kích hoạt sự kiện sau Action của bảng `categories` tương ứng.

:::info{title="Mẹo"}
Nếu sự kiện được cấu hình ở chế độ toàn cục, không cần sử dụng tham số URL `triggerWorkflows` để chỉ định Workflow tương ứng, trực tiếp gọi Action bảng dữ liệu tương ứng là có thể kích hoạt.
:::

## Câu hỏi thường gặp

### Sự khác biệt với sự kiện trước Action

* Sự kiện trước Action: được kích hoạt trước khi một Action nào đó (như thêm, cập nhật...) được thực thi, trước khi Action được thực thi, có thể kiểm tra hoặc xử lý dữ liệu của request trong quy trình, nếu quy trình bị dừng (request bị chặn) thì Action đó (thêm, cập nhật...) sẽ không được thực thi.
* Sự kiện sau Action: được kích hoạt sau khi một Action nào đó của người dùng thành công, lúc này dữ liệu đã được gửi thành công và đã hoàn tất ghi vào DB, có thể tiếp tục xử lý quy trình liên quan dựa trên kết quả thành công.

Như hình dưới đây:

![Thứ tự thực thi Action](https://static-docs.nocobase.com/20251219234806.png)

### Sự khác biệt với sự kiện bảng dữ liệu

Sự kiện sau Action có điểm tương tự với sự kiện bảng dữ liệu, về mặt hiệu quả đều là quy trình được kích hoạt sau khi dữ liệu biến động, nhưng về mặt triển khai có sự khác biệt, sự kiện sau Action nhằm vào tầng API, còn sự kiện bảng dữ liệu nhằm vào biến động dữ liệu của bảng dữ liệu.

Sự kiện bảng dữ liệu gần với tầng cơ sở của hệ thống hơn, trong một số tình huống có thể do biến động dữ liệu của một sự kiện kích hoạt một sự kiện khác và sinh ra phản ứng dây chuyền. Đặc biệt là dữ liệu của một số bảng dữ liệu liên kết cũng phát sinh biến động trong Action của bảng hiện tại, thì các sự kiện liên quan của bảng liên kết cũng có thể được kích hoạt.

Việc kích hoạt sự kiện bảng dữ liệu không chứa thông tin liên quan đến người dùng. Còn sự kiện sau Action gần với phía người dùng hơn, là kết quả của thao tác người dùng, ngữ cảnh quy trình cũng sẽ chứa thông tin liên quan đến người dùng, phù hợp xử lý quy trình thao tác người dùng. Trong thiết kế tương lai của NocoBase, có thể sẽ mở rộng thêm nhiều sự kiện sau Action có thể dùng để kích hoạt, nên **khuyến nghị sử dụng sự kiện sau Action** để xử lý các quy trình có biến động dữ liệu do thao tác người dùng gây ra.

Một điểm khác biệt nữa là sự kiện sau Action có thể liên kết cục bộ trên nút form cụ thể, nếu có nhiều form, có thể một phần form gửi sẽ kích hoạt sự kiện đó còn phần khác thì không, còn sự kiện bảng dữ liệu là nhằm vào biến động dữ liệu của toàn bộ bảng dữ liệu, không thể liên kết cục bộ.
