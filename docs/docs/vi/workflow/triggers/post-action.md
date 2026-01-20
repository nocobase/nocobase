---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Sự kiện sau thao tác

## Giới thiệu

Tất cả các thay đổi dữ liệu do người dùng tạo ra trong hệ thống thường được hoàn thành thông qua một thao tác, hình thức cụ thể thường là nhấp vào một nút. Nút này có thể là nút gửi trong một biểu mẫu, hoặc nút thao tác trong một khối dữ liệu. Sự kiện sau thao tác được dùng để liên kết các luồng công việc liên quan với các thao tác của những nút này, nhằm đạt được hiệu quả kích hoạt một quy trình cụ thể sau khi thao tác của người dùng hoàn tất thành công.

Ví dụ, khi thêm mới hoặc cập nhật dữ liệu, người dùng có thể cấu hình tùy chọn “Liên kết luồng công việc” cho một nút. Sau khi thao tác nhấp chuột hoàn tất, luồng công việc đã liên kết sẽ được kích hoạt.

Ở cấp độ triển khai, do việc xử lý sự kiện sau thao tác nằm ở tầng middleware (middleware của Koa), do đó, các lệnh gọi HTTP API đến NocoBase cũng có thể kích hoạt các sự kiện sau thao tác đã được định nghĩa.

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt.

## Cấu hình trình kích hoạt

### Tạo luồng công việc

Khi tạo một luồng công việc, hãy chọn loại là “Sự kiện sau thao tác”:

![Tạo luồng công việc_Trình kích hoạt sự kiện sau thao tác](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Chế độ thực thi

Đối với các sự kiện sau thao tác, khi tạo, bạn cũng có thể chọn chế độ thực thi là “Đồng bộ” hoặc “Bất đồng bộ”:

![Tạo luồng công việc_Chọn đồng bộ hoặc bất đồng bộ](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Nếu quy trình cần được thực thi và trả về ngay lập tức sau thao tác của người dùng, bạn có thể sử dụng chế độ đồng bộ; nếu không, mặc định sẽ là chế độ bất đồng bộ. Ở chế độ bất đồng bộ, thao tác sẽ hoàn tất ngay sau khi luồng công việc được kích hoạt, và luồng công việc sẽ được thực thi tuần tự trong hàng đợi nền của ứng dụng.

### Cấu hình bộ sưu tập

Vào khung vẽ luồng công việc, nhấp vào trình kích hoạt để mở cửa sổ cấu hình, và trước tiên cần chọn bộ sưu tập cần liên kết:

![Cấu hình luồng công việc_Chọn bộ sưu tập](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Chọn chế độ kích hoạt

Sau đó chọn chế độ kích hoạt, có hai loại: chế độ cục bộ và chế độ toàn cục:

![Cấu hình luồng công việc_Chọn chế độ kích hoạt](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Trong đó:

*   Chế độ cục bộ chỉ được kích hoạt trên các nút thao tác đã liên kết luồng công việc này. Các nút chưa liên kết luồng công việc này sẽ không kích hoạt khi được nhấp. Bạn có thể quyết định có nên liên kết luồng công việc này hay không, dựa trên việc các biểu mẫu có mục đích khác nhau có nên kích hoạt cùng một quy trình hay không.
*   Chế độ toàn cục sẽ được kích hoạt trên tất cả các nút thao tác đã cấu hình của bộ sưu tập, không phân biệt đến từ biểu mẫu nào, và cũng không cần liên kết luồng công việc tương ứng.

Ở chế độ cục bộ, các nút thao tác hiện hỗ trợ liên kết như sau:

*   Các nút “Gửi” và “Lưu” trong biểu mẫu thêm mới.
*   Các nút “Gửi” và “Lưu” trong biểu mẫu cập nhật.
*   Nút “Cập nhật dữ liệu” trong các hàng dữ liệu (bảng, danh sách, Kanban, v.v.).

### Chọn loại thao tác

Nếu bạn chọn chế độ toàn cục, bạn cũng cần chọn loại thao tác. Hiện tại, hỗ trợ “Thao tác tạo dữ liệu” và “Thao tác cập nhật dữ liệu”. Cả hai thao tác đều kích hoạt luồng công việc sau khi thao tác thành công.

### Chọn dữ liệu liên kết được tải trước

Nếu bạn cần sử dụng dữ liệu liên kết của dữ liệu kích hoạt trong các quy trình tiếp theo, bạn có thể chọn các trường liên kết cần tải trước:

![Cấu hình luồng công việc_Tải trước liên kết](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Sau khi kích hoạt, bạn có thể trực tiếp sử dụng dữ liệu liên kết này trong quy trình.

## Cấu hình thao tác

Đối với các thao tác ở chế độ kích hoạt cục bộ, sau khi cấu hình luồng công việc hoàn tất, bạn cần quay lại giao diện người dùng và liên kết luồng công việc này với nút thao tác biểu mẫu của khối dữ liệu tương ứng.

Các luồng công việc được cấu hình cho nút “Gửi” (bao gồm cả nút “Lưu dữ liệu”) sẽ được kích hoạt sau khi người dùng gửi biểu mẫu tương ứng và thao tác dữ liệu hoàn tất.

![Sự kiện sau thao tác_Nút Gửi](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Chọn “Liên kết luồng công việc” từ menu cấu hình nút để mở cửa sổ cấu hình liên kết. Trong cửa sổ này, bạn có thể cấu hình bất kỳ số lượng luồng công việc nào cần kích hoạt. Nếu không cấu hình cái nào, có nghĩa là không cần kích hoạt. Đối với mỗi luồng công việc, trước tiên cần xác định dữ liệu kích hoạt là dữ liệu của toàn bộ biểu mẫu hay dữ liệu của một trường liên kết cụ thể trong biểu mẫu. Sau đó, dựa trên bộ sưu tập tương ứng với mô hình dữ liệu đã chọn, hãy chọn luồng công việc biểu mẫu đã được cấu hình để khớp với mô hình bộ sưu tập đó.

![Sự kiện sau thao tác_Cấu hình liên kết luồng công việc_Chọn ngữ cảnh](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Sự kiện sau thao tác_Cấu hình liên kết luồng công việc_Chọn luồng công việc](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Lưu ý"}
Luồng công việc cần được kích hoạt trước khi có thể được chọn trong giao diện trên.
:::

## Ví dụ

Ở đây sẽ minh họa bằng cách sử dụng thao tác thêm mới.

Giả sử có một kịch bản “Đơn xin hoàn tiền”. Chúng ta cần thực hiện kiểm tra tự động hạn mức và kiểm tra thủ công đối với các khoản vượt hạn mức sau khi nhân viên gửi yêu cầu hoàn tiền. Chỉ những đơn được kiểm tra thành công mới được duyệt và sau đó chuyển cho bộ phận tài chính xử lý.

Đầu tiên, chúng ta có thể tạo một bộ sưu tập “Hoàn tiền chi phí” với các trường sau:

*   Tên dự án: Văn bản một dòng
*   Người nộp đơn: Nhiều-một (Người dùng)
*   Số tiền: Số
*   Trạng thái: Chọn một (“Đã duyệt”, “Đã xử lý”)

Sau đó, hãy tạo một luồng công việc loại “Sự kiện sau thao tác” và cấu hình mô hình bộ sưu tập trong trình kích hoạt là bộ sưu tập “Hoàn tiền chi phí”:

![Ví dụ_Cấu hình trình kích hoạt_Chọn bộ sưu tập](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Sau khi đặt luồng công việc ở trạng thái đã kích hoạt, chúng ta sẽ quay lại cấu hình các nút xử lý cụ thể của quy trình sau.

Sau đó, chúng ta tạo một khối bảng cho bộ sưu tập “Hoàn tiền chi phí” trên giao diện, và thêm một nút “Thêm” vào thanh công cụ, cấu hình các trường biểu mẫu tương ứng. Trong các tùy chọn cấu hình của nút thao tác “Gửi” của biểu mẫu, hãy mở hộp thoại cấu hình “Liên kết luồng công việc” của nút, chọn toàn bộ dữ liệu biểu mẫu làm ngữ cảnh, và chọn luồng công việc mà chúng ta đã tạo trước đó:

![Ví dụ_Cấu hình nút biểu mẫu_Liên kết luồng công việc](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Sau khi cấu hình biểu mẫu hoàn tất, hãy quay lại sắp xếp logic của luồng công việc. Ví dụ, chúng ta yêu cầu quản trị viên thực hiện kiểm tra thủ công khi số tiền lớn hơn 500, nếu không thì duyệt trực tiếp. Sau khi duyệt thành công mới tạo bản ghi hoàn tiền và được bộ phận tài chính xử lý thêm (đã lược bỏ).

![Ví dụ_Quy trình xử lý](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Nếu bỏ qua các bước xử lý tài chính tiếp theo, thì việc cấu hình quy trình xin hoàn tiền đã hoàn tất. Khi nhân viên điền và gửi đơn xin hoàn tiền, luồng công việc tương ứng sẽ được kích hoạt. Nếu số tiền chi phí nhỏ hơn 500, một bản ghi sẽ tự động được tạo và chờ bộ phận tài chính xử lý thêm. Nếu không, nó sẽ được người quản lý duyệt, và sau khi duyệt thành công, một bản ghi cũng sẽ được tạo và chuyển cho bộ phận tài chính xử lý.

Quy trình trong ví dụ này cũng có thể được cấu hình trên một nút “Gửi” thông thường. Bạn có thể quyết định có cần tạo bản ghi trước khi thực hiện các quy trình tiếp theo hay không, dựa trên kịch bản nghiệp vụ cụ thể.

## Gọi từ bên ngoài

Việc kích hoạt sự kiện sau thao tác không chỉ giới hạn ở các thao tác trên giao diện người dùng, mà còn có thể được kích hoạt thông qua các lệnh gọi HTTP API.

:::info{title="Lưu ý"}
Khi kích hoạt sự kiện sau thao tác thông qua lệnh gọi HTTP API, bạn cũng cần chú ý đến trạng thái kích hoạt của luồng công việc và liệu cấu hình bộ sưu tập có khớp hay không, nếu không, lệnh gọi có thể không thành công hoặc xảy ra lỗi.
:::

Đối với các luồng công việc được liên kết cục bộ trên một nút thao tác, bạn có thể gọi như sau (ví dụ với nút tạo của bộ sưu tập `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Trong đó, tham số URL `triggerWorkflows` là khóa của luồng công việc, nhiều luồng công việc được phân tách bằng dấu phẩy. Khóa này có thể được lấy bằng cách di chuột qua tên luồng công việc ở đầu khung vẽ luồng công việc:

![Luồng công việc_Khóa_Cách xem](https://static-docs.nocobase.com/20240426135108.png)

Sau khi lệnh gọi trên thành công, sự kiện sau thao tác của bộ sưu tập `posts` tương ứng sẽ được kích hoạt.

:::info{title="Lưu ý"}
Vì các lệnh gọi từ bên ngoài cũng cần dựa trên danh tính người dùng, nên khi gọi qua HTTP API, tương tự như các yêu cầu gửi từ giao diện thông thường, đều cần cung cấp thông tin xác thực, bao gồm tiêu đề yêu cầu `Authorization` hoặc tham số `token` (token nhận được khi đăng nhập), và tiêu đề yêu cầu `X-Role` (tên vai trò hiện tại của người dùng).
:::

Nếu bạn cần kích hoạt một sự kiện cho dữ liệu liên kết một-một (một-nhiều hiện chưa được hỗ trợ) trong thao tác này, bạn có thể sử dụng `!` trong tham số để chỉ định dữ liệu kích hoạt của trường liên kết:

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

Sau khi lệnh gọi trên thành công, sự kiện sau thao tác của bộ sưu tập `categories` tương ứng sẽ được kích hoạt.

:::info{title="Lưu ý"}
Nếu sự kiện được cấu hình ở chế độ toàn cục, bạn không cần sử dụng tham số URL `triggerWorkflows` để chỉ định luồng công việc tương ứng. Chỉ cần gọi thao tác bộ sưu tập tương ứng là có thể kích hoạt.
:::

## Các câu hỏi thường gặp

### Sự khác biệt với sự kiện trước thao tác

*   **Sự kiện trước thao tác**: Được kích hoạt trước khi một thao tác (như thêm mới, cập nhật, v.v.) được thực thi. Trước khi thao tác được thực thi, dữ liệu yêu cầu có thể được xác thực hoặc xử lý trong luồng công việc. Nếu luồng công việc bị chấm dứt (yêu cầu bị chặn), thao tác đó (thêm mới, cập nhật, v.v.) sẽ không được thực thi.
*   **Sự kiện sau thao tác**: Được kích hoạt sau khi một thao tác của người dùng thành công. Tại thời điểm này, dữ liệu đã được gửi thành công và đã được lưu vào cơ sở dữ liệu, có thể tiếp tục xử lý các quy trình liên quan dựa trên kết quả thành công.

Như được hiển thị trong hình dưới đây:

![Thứ tự thực thi thao tác](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Sự khác biệt với sự kiện bộ sưu tập

Sự kiện sau thao tác và sự kiện bộ sưu tập có những điểm tương đồng, về mặt hiệu quả, cả hai đều là các quy trình được kích hoạt sau khi dữ liệu thay đổi. Tuy nhiên, cấp độ triển khai của chúng khác nhau: sự kiện sau thao tác là ở cấp độ API, trong khi sự kiện bộ sưu tập là dành cho các thay đổi dữ liệu trong bộ sưu tập.

Sự kiện bộ sưu tập gần với tầng cơ sở của hệ thống hơn. Trong một số trường hợp, một thay đổi dữ liệu do một sự kiện gây ra có thể kích hoạt một sự kiện khác, tạo ra một phản ứng dây chuyền. Đặc biệt khi dữ liệu trong một số bộ sưu tập liên kết cũng thay đổi trong quá trình thao tác trên bộ sưu tập hiện tại, thì các sự kiện liên quan đến bộ sưu tập liên kết cũng có thể được kích hoạt.

Việc kích hoạt sự kiện bộ sưu tập không bao gồm thông tin liên quan đến người dùng. Ngược lại, sự kiện sau thao tác gần với phía người dùng hơn, là kết quả của các thao tác người dùng. Ngữ cảnh của luồng công việc cũng sẽ chứa thông tin liên quan đến người dùng, phù hợp để xử lý các quy trình liên quan đến thao tác người dùng. Trong thiết kế tương lai của NocoBase, có thể sẽ mở rộng thêm nhiều sự kiện sau thao tác có thể được dùng để kích hoạt, vì vậy **khuyến nghị nên sử dụng sự kiện sau thao tác** để xử lý các quy trình mà thay đổi dữ liệu do thao tác người dùng gây ra.

Một điểm khác biệt nữa là, sự kiện sau thao tác có thể được liên kết cục bộ trên các nút biểu mẫu cụ thể. Nếu có nhiều biểu mẫu, việc gửi từ một số biểu mẫu có thể kích hoạt sự kiện này, trong khi các biểu mẫu khác thì không. Trong khi đó, sự kiện bộ sưu tập là dành cho các thay đổi dữ liệu trong toàn bộ bộ sưu tập và không thể liên kết cục bộ.