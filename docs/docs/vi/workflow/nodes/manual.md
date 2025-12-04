---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xử lý Thủ công

## Giới thiệu

Khi một quy trình nghiệp vụ không thể tự động hóa hoàn toàn việc ra quyết định, bạn có thể sử dụng nút thủ công để giao một phần quyền quyết định cho người dùng xử lý.

Khi một nút thủ công được thực thi, nó sẽ tạm dừng toàn bộ quá trình thực hiện của `luồng công việc`, tạo ra một nhiệm vụ cần làm cho người dùng tương ứng. Sau khi người dùng gửi nhiệm vụ, `luồng công việc` sẽ tiếp tục, tiếp tục chờ đợi hoặc kết thúc, tùy thuộc vào trạng thái đã chọn. Điều này rất hữu ích trong các trường hợp cần quy trình phê duyệt.

## Cài đặt

`plugin` này được tích hợp sẵn, bạn không cần cài đặt.

## Tạo nút

Trong giao diện cấu hình `luồng công việc`, hãy nhấp vào nút dấu cộng (“+”) trong `luồng công việc` để thêm nút “Xử lý Thủ công”:

![Create Manual Node](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Cấu hình nút

### Người phụ trách

Nút thủ công cần chỉ định một người dùng làm người thực hiện nhiệm vụ cần làm. Danh sách các nhiệm vụ cần làm có thể được thêm vào khi bạn thêm khối vào trang, và nội dung cửa sổ bật lên của nhiệm vụ cho mỗi nút cần được cấu hình trong giao diện của nút.

Chọn một người dùng, hoặc chọn khóa chính hoặc khóa ngoại của dữ liệu người dùng từ ngữ cảnh thông qua một biến.

![Manual Node_Configure_Assignee_Select Variable](https://static-docs.nocobase.com/22fbca3b821fda31019037001445.png)

:::info{title=Lưu ý}
Hiện tại, tùy chọn người phụ trách cho nút thủ công chưa hỗ trợ xử lý cho nhiều người dùng. Tính năng này sẽ được hỗ trợ trong các phiên bản tương lai.
:::

### Cấu hình giao diện người dùng

Cấu hình giao diện cho mục cần làm là phần cốt lõi của nút thủ công. Bạn có thể nhấp vào nút “Cấu hình giao diện người dùng” để mở một cửa sổ bật lên cấu hình riêng biệt, nơi bạn có thể cấu hình theo kiểu WYSIWYG (nhìn là thấy ngay kết quả), giống như một trang thông thường:

![Manual Node_Node Configuration_Interface Configuration](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Tab

Các tab có thể được dùng để phân biệt các nội dung khác nhau. Ví dụ, một tab dùng cho việc gửi biểu mẫu được phê duyệt, một tab khác cho việc gửi biểu mẫu bị từ chối, hoặc để hiển thị chi tiết dữ liệu liên quan, v.v. Bạn có thể cấu hình chúng một cách linh hoạt.

#### Khối

Các loại khối được hỗ trợ chủ yếu gồm hai loại: khối dữ liệu và khối biểu mẫu. Ngoài ra, Markdown chủ yếu được sử dụng cho các nội dung tĩnh như thông báo hoặc gợi ý.

##### Khối dữ liệu

Khối dữ liệu có thể hiển thị dữ liệu kích hoạt hoặc kết quả xử lý của bất kỳ nút nào, cung cấp thông tin ngữ cảnh liên quan cho người phụ trách nhiệm vụ cần làm. Ví dụ, nếu `luồng công việc` được kích hoạt bởi một sự kiện biểu mẫu, bạn có thể tạo một khối chi tiết cho dữ liệu kích hoạt. Điều này nhất quán với cấu hình chi tiết của một trang thông thường, cho phép bạn chọn bất kỳ trường nào có trong dữ liệu kích hoạt để hiển thị:

![Manual Node_Node Configuration_Interface Configuration_Data Block_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Khối dữ liệu nút cũng tương tự; bạn có thể chọn kết quả dữ liệu từ một nút phía trước (upstream) để hiển thị chi tiết. Ví dụ, kết quả của một nút tính toán phía trước có thể dùng làm thông tin tham khảo ngữ cảnh cho nhiệm vụ cần làm của người phụ trách:

![Manual Node_Node Configuration_Interface Configuration_Data Block_Node Data](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Lưu ý}
Vì `luồng công việc` đang ở trạng thái chưa được thực thi khi cấu hình giao diện, nên các khối dữ liệu sẽ không hiển thị dữ liệu cụ thể nào. Dữ liệu liên quan đến quy trình cụ thể chỉ có thể được nhìn thấy trong giao diện cửa sổ bật lên của nhiệm vụ cần làm sau khi `luồng công việc` được kích hoạt và thực thi.
:::

##### Khối biểu mẫu

Giao diện nhiệm vụ cần làm phải có ít nhất một khối biểu mẫu được cấu hình, đóng vai trò xử lý quyết định cuối cùng về việc `luồng công việc` có tiếp tục hay không. Nếu không cấu hình biểu mẫu, `luồng công việc` sẽ bị gián đoạn và không thể tiếp tục. Có ba loại khối biểu mẫu:

- Biểu mẫu tùy chỉnh
- Biểu mẫu tạo bản ghi mới
- Biểu mẫu cập nhật bản ghi

![Manual Node_Node Configuration_Interface Configuration_Form Types](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Biểu mẫu tạo bản ghi mới và biểu mẫu cập nhật bản ghi yêu cầu chọn một `bộ sưu tập` cơ sở. Sau khi người dùng nhiệm vụ cần làm gửi biểu mẫu, các giá trị trong biểu mẫu sẽ được sử dụng để tạo mới hoặc cập nhật dữ liệu trong `bộ sưu tập` đã chỉ định. Biểu mẫu tùy chỉnh cho phép bạn tự do định nghĩa một biểu mẫu tạm thời không liên quan đến `bộ sưu tập` nào. Các giá trị trường được người dùng nhiệm vụ cần làm gửi đi có thể được sử dụng trong các nút tiếp theo.

Các nút gửi của biểu mẫu có thể được cấu hình thành ba loại:

- Gửi và tiếp tục `luồng công việc`
- Gửi và kết thúc `luồng công việc`
- Chỉ lưu tạm giá trị biểu mẫu

![Manual Node_Node Configuration_Interface Configuration_Form Buttons](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Ba nút này đại diện cho ba trạng thái nút trong quá trình xử lý `luồng công việc`. Sau khi gửi, trạng thái của nút sẽ thay đổi thành “Hoàn thành”, “Từ chối” hoặc tiếp tục ở trạng thái “Đang chờ”. Một biểu mẫu phải cấu hình ít nhất một trong hai nút đầu tiên để quyết định hướng xử lý tiếp theo của toàn bộ `luồng công việc`.

Trên nút “Tiếp tục `luồng công việc`”, bạn có thể cấu hình gán giá trị cho các trường biểu mẫu:

![Manual Node_Node Configuration_Interface Configuration_Form Button_Set Form Values](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Manual Node_Node Configuration_Interface Configuration_Form Button_Set Form Values Popup](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Sau khi mở cửa sổ bật lên, bạn có thể gán giá trị cho bất kỳ trường biểu mẫu nào. Sau khi biểu mẫu được gửi, giá trị này sẽ là giá trị cuối cùng của trường. Điều này đặc biệt hữu ích khi xem xét dữ liệu. Bạn có thể sử dụng nhiều nút “Tiếp tục `luồng công việc`” khác nhau trong một biểu mẫu, với mỗi nút đặt các giá trị liệt kê khác nhau cho các trường tương tự như trạng thái, từ đó đạt được hiệu quả tiếp tục thực thi `luồng công việc` tiếp theo với các giá trị dữ liệu khác nhau.

## Khối Nhiệm vụ cần làm

Đối với xử lý thủ công, bạn cũng cần thêm một danh sách nhiệm vụ cần làm vào trang để hiển thị các nhiệm vụ cần làm. Điều này cho phép những người liên quan truy cập và xử lý các nhiệm vụ cụ thể của nút thủ công thông qua danh sách này.

### Thêm khối

Bạn có thể chọn “Nhiệm vụ cần làm của `luồng công việc`” từ các khối trên trang để thêm khối danh sách nhiệm vụ cần làm:

![Manual Node_Add To-do Block](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Ví dụ về khối danh sách nhiệm vụ cần làm:

![Manual Node_To-do List](https://static-docs.nocobase.com/cfefb0d2c6a91c5c9dfa550d6b220f34.png)

### Chi tiết nhiệm vụ cần làm

Sau đó, những người liên quan có thể nhấp vào nhiệm vụ cần làm tương ứng để mở cửa sổ bật lên của nhiệm vụ cần làm và thực hiện xử lý thủ công:

![Manual Node_To-do Details](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Ví dụ

### Duyệt bài viết

Giả sử một bài viết do người dùng thông thường gửi cần được quản trị viên phê duyệt trước khi có thể cập nhật thành trạng thái đã xuất bản. Nếu `luồng công việc` bị từ chối, bài viết sẽ vẫn ở trạng thái bản nháp (không công khai). Quy trình này có thể được thực hiện bằng cách sử dụng biểu mẫu cập nhật trong một nút thủ công.

Tạo một `luồng công việc` được kích hoạt bởi “Tạo bài viết mới” và thêm một nút thủ công:

<figure>
  <img alt="人工节点_示例_文章审核_流程编排" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Trong nút thủ công, cấu hình người phụ trách là quản trị viên. Trong cấu hình giao diện, thêm một khối dựa trên dữ liệu kích hoạt để hiển thị chi tiết của bài viết mới:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_详情区块" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Trong cấu hình giao diện, thêm một khối dựa trên biểu mẫu cập nhật bản ghi, chọn `bộ sưu tập` bài viết, để quản trị viên quyết định có phê duyệt hay không. Sau khi phê duyệt, bài viết tương ứng sẽ được cập nhật dựa trên các cấu hình tiếp theo khác. Sau khi thêm biểu mẫu, mặc định sẽ có một nút “Tiếp tục `luồng công việc`”, có thể coi là “Phê duyệt”. Sau đó, thêm một nút “Kết thúc `luồng công việc`” để dùng trong trường hợp không phê duyệt:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单和操作" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Khi tiếp tục `luồng công việc`, chúng ta cần cập nhật trạng thái của bài viết. Có hai cách để cấu hình điều này. Một là hiển thị trực tiếp trường trạng thái của bài viết trong biểu mẫu để người vận hành chọn. Phương pháp này phù hợp hơn cho những trường hợp cần điền biểu mẫu chủ động, ví dụ như cung cấp phản hồi:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单字段" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Để đơn giản hóa thao tác của người vận hành, một cách khác là cấu hình gán giá trị biểu mẫu trên nút “Tiếp tục `luồng công việc`”. Trong phần gán giá trị, thêm một trường “Trạng thái” với giá trị “Đã xuất bản”. Điều này có nghĩa là khi người vận hành nhấp vào nút, bài viết sẽ được cập nhật thành trạng thái đã xuất bản:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单赋值" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Sau đó, từ menu cấu hình ở góc trên bên phải của khối biểu mẫu, chọn điều kiện lọc cho dữ liệu cần cập nhật. Ở đây, chọn `bộ sưu tập` “Bài viết”, và điều kiện lọc là “ID `bằng` Biến kích hoạt / Dữ liệu kích hoạt / ID”:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_表单条件" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Cuối cùng, bạn có thể sửa đổi tiêu đề của từng khối, văn bản của các nút liên quan và văn bản gợi ý của các trường biểu mẫu để làm cho giao diện thân thiện hơn với người dùng:

<figure>
  <img alt="人工节点_示例_文章审核_节点配置_最终表单" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Đóng bảng cấu hình và nhấp vào nút gửi để lưu cấu hình nút. `Luồng công việc` hiện đã được cấu hình hoàn tất. Sau khi kích hoạt `luồng công việc` này, nó sẽ tự động được kích hoạt khi một bài viết mới được tạo. Quản trị viên có thể thấy `luồng công việc` này cần được xử lý từ danh sách nhiệm vụ cần làm. Nhấp vào xem để thấy chi tiết của nhiệm vụ cần làm:

<figure>
  <img alt="人工节点_示例_文章审核_待办列表" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="人工节点_示例_文章审核_待办详情" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Quản trị viên có thể đưa ra phán đoán thủ công dựa trên chi tiết bài viết để quyết định xem bài viết có thể được xuất bản hay không. Nếu có, nhấp vào nút “Phê duyệt”, bài viết sẽ được cập nhật thành trạng thái đã xuất bản. Nếu không, nhấp vào nút “Từ chối”, bài viết sẽ vẫn ở trạng thái bản nháp.

## Phê duyệt đơn xin nghỉ phép

Giả sử một nhân viên cần xin nghỉ phép, yêu cầu này phải được quản lý phê duyệt thì mới có hiệu lực, đồng thời dữ liệu ngày nghỉ của nhân viên đó cần được cập nhật. Dù được phê duyệt hay từ chối, một nút yêu cầu HTTP sẽ được sử dụng để gọi API SMS, gửi tin nhắn thông báo liên quan đến nhân viên (xem phần [Yêu cầu HTTP](#_HTTP_请求)). Kịch bản này có thể được thực hiện bằng cách sử dụng biểu mẫu tùy chỉnh trong một nút thủ công.

Tạo một `luồng công việc` được kích hoạt bởi “Tạo đơn xin nghỉ phép mới” và thêm một nút thủ công. Quy trình này tương tự như quy trình duyệt bài viết trước đó, nhưng ở đây người phụ trách là quản lý. Trong cấu hình giao diện, thêm một khối dựa trên dữ liệu kích hoạt để hiển thị chi tiết của đơn xin nghỉ phép mới, sau đó thêm một khối dựa trên biểu mẫu tùy chỉnh để quản lý quyết định có phê duyệt hay không. Trong biểu mẫu tùy chỉnh, thêm một trường cho trạng thái phê duyệt và một trường cho lý do từ chối:

<figure>
  <img alt="人工节点_示例_请假审批_节点配置" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Khác với quy trình duyệt bài viết, vì chúng ta cần tiếp tục các quy trình tiếp theo dựa trên kết quả phê duyệt của quản lý, nên ở đây chúng ta chỉ cấu hình một nút “Tiếp tục `luồng công việc`” để gửi, mà không sử dụng nút “Kết thúc `luồng công việc`”.

Đồng thời, sau nút thủ công, chúng ta có thể sử dụng một nút điều kiện để xác định xem quản lý đã phê duyệt đơn xin nghỉ phép hay chưa. Trong nhánh phê duyệt, thêm xử lý dữ liệu để cập nhật ngày nghỉ, và sau khi các nhánh hợp nhất, thêm một nút yêu cầu để gửi thông báo SMS cho nhân viên. Điều này tạo thành `luồng công việc` hoàn chỉnh sau đây:

<figure>
  <img alt="人工节点_示例_请假审批_流程编排" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Trong đó, điều kiện trong nút điều kiện được cấu hình là “Nút thủ công / Dữ liệu biểu mẫu tùy chỉnh / Giá trị của trường phê duyệt là ‘Đã phê duyệt’”:

<figure>
  <img alt="人工节点_示例_请假审批_条件判断" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Dữ liệu trong nút gửi yêu cầu cũng có thể sử dụng các biến biểu mẫu tương ứng từ nút thủ công để phân biệt nội dung SMS cho trường hợp phê duyệt và từ chối. Như vậy, toàn bộ cấu hình `luồng công việc` đã hoàn tất. Sau khi `luồng công việc` được kích hoạt, khi nhân viên gửi biểu mẫu xin nghỉ phép, quản lý có thể xử lý phê duyệt trong các nhiệm vụ cần làm của họ. Thao tác này về cơ bản tương tự như quy trình duyệt bài viết.