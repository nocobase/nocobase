---
pkg: '@nocobase/plugin-workflow-approval'
title: "Node Workflow - Phê duyệt"
description: "Node phê duyệt: chuyên dùng cho quy trình phê duyệt, cấu hình các Action thông qua/từ chối/trả lại, chỉ có thể dùng trong quy trình phê duyệt."
keywords: "workflow,node phê duyệt,Approval,thông qua từ chối trả lại,quy trình phê duyệt,NocoBase"
---

# Phê duyệt

## Giới thiệu

Trong Workflow phê duyệt, cần sử dụng Node "Phê duyệt" chuyên dụng để cấu hình logic Action xử lý (thông qua, từ chối hoặc trả lại) phê duyệt được phát động cho người phê duyệt, Node "Phê duyệt" chỉ có thể được dùng trong quy trình phê duyệt.

:::info{title=Mẹo}
Sự khác biệt với Node "Xử lý thủ công" thông thường: Node "Xử lý thủ công" thông thường nhằm vào tình huống chung hơn, có thể được dùng cho nhiều loại Workflow để nhập dữ liệu thủ công, ra quyết định thủ công cho việc tiếp tục quy trình... Còn "Node phê duyệt" là Node xử lý chuyên biệt cho quy trình phê duyệt, chỉ xử lý dữ liệu phát động phê duyệt, không thể dùng trong các Workflow khác.
:::

## Tạo Node

Bấm nút dấu cộng ("+") trong quy trình, thêm Node "Phê duyệt", sau đó chọn một trong các chế độ thông qua để tạo Node phê duyệt:

![Node phê duyệt_tạo](https://static-docs.nocobase.com/20251107000938.png)

## Cấu hình Node

### Chế độ thông qua

Có hai chế độ thông qua:

1.  Chế độ thông suốt: thường được dùng cho quy trình tương đối đơn giản, việc Node phê duyệt thông qua hay không chỉ quyết định quy trình có kết thúc hay không, trong trường hợp không thông qua sẽ trực tiếp thoát quy trình.

    ![Node phê duyệt_chế độ thông qua_chế độ thông suốt](https://static-docs.nocobase.com/20251107001043.png)

2.  Chế độ nhánh: thường được dùng cho logic dữ liệu phức tạp hơn, sau khi Node phê duyệt sinh ra bất kỳ kết quả nào, có thể tiếp tục thực thi các Node khác trong nhánh kết quả của nó.

    ![Node phê duyệt_chế độ thông qua_chế độ nhánh](https://static-docs.nocobase.com/20251107001234.png)

    Sau khi Node được "Thông qua", ngoài việc thực thi nhánh thông qua, sẽ tiếp tục thực thi quy trình tiếp theo. Sau Action "Từ chối" mặc định cũng có thể tiếp tục thực thi quy trình tiếp theo, cũng có thể cấu hình kết thúc quy trình sau khi thực thi nhánh trong Node.

:::info{title=Mẹo}
Chế độ thông qua không thể sửa sau khi Node được tạo.
:::

### Người phê duyệt

Người phê duyệt là tập hợp người dùng chịu trách nhiệm cho hành vi phê duyệt của Node, có thể là một hoặc nhiều người dùng, nguồn được chọn có thể là giá trị tĩnh được chọn từ danh sách người dùng, cũng có thể là giá trị động được chỉ định bởi biến:

![Node phê duyệt_người phê duyệt](https://static-docs.nocobase.com/20251107001433.png)

Khi chọn biến, chỉ có thể chọn khóa chính hoặc khóa ngoại của dữ liệu người dùng trong ngữ cảnh và kết quả Node. Nếu biến được chọn khi thực thi là mảng (quan hệ một - nhiều), thì mỗi người dùng trong mảng sẽ được hợp vào tập hợp người phê duyệt.

Ngoài việc trực tiếp chọn người dùng hoặc biến, còn có thể dựa vào điều kiện truy vấn của bảng người dùng để lọc ra người dùng thỏa mãn điều kiện làm người phê duyệt một cách động:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Chế độ thương lượng

Nếu cuối cùng khi thực thi chỉ có một người phê duyệt (bao gồm trường hợp nhiều biến đã được loại trùng), thì bất kể chọn chế độ thương lượng nào, đều chỉ do người dùng đó thực hiện Action phê duyệt và kết quả cũng chỉ do người dùng đó quyết định.

Khi trong tập hợp người phê duyệt có nhiều người dùng, các chế độ thương lượng khác nhau biểu thị các cách xử lý khác nhau:

1. Hoặc ký: chỉ cần một trong số họ thông qua là Node được thông qua, tất cả từ chối thì Node mới bị từ chối.
2. Cùng ký: cần tất cả thông qua thì Node mới được thông qua, chỉ cần một trong số họ từ chối là Node bị từ chối.
3. Bỏ phiếu: cần số người thông qua vượt quá tỉ lệ được đặt thì Node mới được thông qua, ngược lại Node bị từ chối.

Đối với Action trả lại, ở bất kỳ chế độ nào, nếu trong tập hợp người phê duyệt có người dùng xử lý là trả lại, thì Node sẽ trực tiếp thoát quy trình.

### Thứ tự xử lý

Tương tự, khi trong tập hợp người phê duyệt có nhiều người dùng, các thứ tự xử lý khác nhau biểu thị các cách xử lý khác nhau:

1. Song song: tất cả người phê duyệt có thể xử lý theo bất kỳ thứ tự nào, không liên quan đến thứ tự xử lý.
2. Tuần tự: người phê duyệt xử lý theo thứ tự trong tập hợp người phê duyệt, người trước trong số người phê duyệt gửi xong rồi người tiếp theo mới có thể xử lý.

Bất kể có được đặt là xử lý "Tuần tự" hay không, kết quả sinh ra theo thứ tự xử lý thực tế cũng tuân theo quy tắc trong "Chế độ thương lượng" ở trên, sau khi đạt được điều kiện tương ứng thì Node hoàn tất thực thi.

### Thoát Workflow sau khi nhánh từ chối kết thúc

Khi "Chế độ thông qua" được đặt là "Chế độ nhánh", có thể chọn thoát Workflow sau khi nhánh từ chối kết thúc. Sau khi chọn, cuối nhánh từ chối sẽ hiển thị một dấu "✗", biểu thị nhánh đó sau khi kết thúc sẽ không tiếp tục các Node tiếp theo:

![Node phê duyệt_thoát sau khi từ chối](https://static-docs.nocobase.com/20251107001839.png)

### Cấu hình giao diện người phê duyệt

Cấu hình giao diện người phê duyệt được dùng để cung cấp giao diện thao tác cho người phê duyệt khi Workflow phê duyệt thực thi đến Node đó, bấm nút cấu hình để mở popup:

![Node phê duyệt_cấu hình giao diện_popup](https://static-docs.nocobase.com/20251107001958.png)

Trong popup cấu hình có thể thêm các Block như nội dung gửi gốc, thông tin phê duyệt, form xử lý và văn bản nhắc tùy chỉnh...:

![Node phê duyệt_cấu hình giao diện_thêm Block](https://static-docs.nocobase.com/20251107002604.png)

#### Nội dung gửi gốc

Trong đó Block chi tiết nội dung phê duyệt là Block dữ liệu được người phát động gửi, tương tự Block dữ liệu thông thường, có thể thêm các Component trường của bảng dữ liệu tùy ý và sắp xếp tùy ý để tổ chức nội dung mà người phê duyệt cần xem:

![Node phê duyệt_cấu hình giao diện_Block chi tiết](https://static-docs.nocobase.com/20251107002925.png)

#### Form xử lý

Trong Block form thao tác có thể thêm các nút Action mà Node hỗ trợ, bao gồm "Thông qua", "Phủ quyết", "Trả lại", "Chuyển tiếp ký" và "Thêm ký":

![Node phê duyệt_cấu hình giao diện_Block form thao tác](https://static-docs.nocobase.com/20251107003015.png)

Ngoài ra, trong form thao tác cũng có thể thêm các trường có thể được người phê duyệt sửa. Các trường này khi người phê duyệt xử lý phê duyệt sẽ hiển thị trong form thao tác, người phê duyệt có thể sửa giá trị các trường này, sau khi gửi sẽ đồng thời cập nhật dữ liệu được dùng cho phê duyệt và snapshot dữ liệu tương ứng trong quy trình phê duyệt.

![Node phê duyệt_cấu hình giao diện_form thao tác_sửa các trường nội dung phê duyệt](https://static-docs.nocobase.com/20251107003206.png)

#### "Thông qua" và "Phủ quyết"

Trong các nút Action phê duyệt, "Thông qua" và "Phủ quyết" là các Action quyết định, sau khi gửi thì việc xử lý của người phê duyệt tương ứng tại Node đó hoàn tất, các trường bổ sung cần điền khi gửi có thể được thêm trong popup "Cấu hình xử lý" của nút Action, như "Bình luận"...

![Node phê duyệt_cấu hình giao diện_form thao tác_cấu hình xử lý](https://static-docs.nocobase.com/20251107003314.png)

#### "Trả lại"

"Trả lại" cũng là Action quyết định, ngoài việc có thể cấu hình bình luận, còn có thể cấu hình các Node có thể trả lại:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Chuyển tiếp ký" và "Thêm ký"

"Chuyển tiếp ký" và "Thêm ký" là các Action không quyết định, được dùng để điều chỉnh động người phê duyệt trong quy trình phê duyệt, "Chuyển tiếp ký" là giao Task phê duyệt của người dùng hiện tại cho người dùng khác xử lý thay, "Thêm ký" là thêm một người phê duyệt trước hoặc sau người phê duyệt hiện tại, cùng người phê duyệt mới được thêm tiếp tục phê duyệt.

Sau khi bật nút Action "Chuyển tiếp ký" hoặc "Thêm ký", cần chọn "Phạm vi người được chỉ định" trong menu cấu hình của nút để thiết lập phạm vi người phê duyệt mới có thể chỉ định:

![Node phê duyệt_cấu hình giao diện_form thao tác_phạm vi người được chỉ định](https://static-docs.nocobase.com/20241226232321.png)

Giống như cấu hình người phê duyệt gốc của Node, phạm vi người được chỉ định cũng có thể là người phê duyệt được chọn trực tiếp hoặc dựa vào điều kiện truy vấn của bảng người dùng, cuối cùng sẽ được hợp thành một tập hợp và không bao gồm những người dùng đã có trong tập hợp người phê duyệt.

:::warning{title=Quan trọng}
Nếu đã bật hoặc tắt một nút Action nào đó, hoặc đã sửa phạm vi người được chỉ định, cần lưu cấu hình Node đó sau khi đóng popup cấu hình giao diện thao tác, nếu không thay đổi của nút Action đó sẽ không có hiệu lực.
:::

### Thẻ "Phê duyệt của tôi" <Badge>2.0+</Badge>

Có thể được dùng để cấu hình thẻ Task trong danh sách "Phê duyệt của tôi" ở trung tâm Task.

![20260214141554](https://static-docs.nocobase.com/20260214141554.png)

Trong thẻ có thể tự do cấu hình các trường nghiệp vụ muốn hiển thị (trừ trường quan hệ) hoặc thông tin liên quan đến phê duyệt.

Sau khi phê duyệt vào Node đó, trong danh sách trung tâm Task có thể thấy thẻ Task tùy chỉnh:

![20260214141722](https://static-docs.nocobase.com/20260214141722.png)

## Kết quả Node

Sau khi phê duyệt hoàn tất, các trạng thái và dữ liệu liên quan sẽ được ghi trong kết quả Node, có thể được dùng làm biến cho các Node tiếp theo sử dụng.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Trạng thái phê duyệt Node

Đại diện cho trạng thái xử lý của Node phê duyệt hiện tại, kết quả là giá trị enum.

### Dữ liệu sau khi phê duyệt

Nếu người phê duyệt đã sửa nội dung phê duyệt trong form thao tác, dữ liệu được sửa sẽ được ghi trong kết quả Node để các Node tiếp theo sử dụng. Nếu cần sử dụng trường quan hệ, cần cấu hình preload cho trường quan hệ trong Trigger.

### Bản ghi phê duyệt

> v1.8.0+

Bản ghi xử lý phê duyệt là một mảng, chứa các bản ghi xử lý của tất cả người phê duyệt trong Node đó, mỗi dòng bản ghi xử lý chứa các trường sau:

| Trường | Kiểu | Mô tả |
| --- | --- | --- |
| id | number | Định danh duy nhất của bản ghi xử lý |
| userId | number | ID của người dùng xử lý bản ghi đó |
| status | number | Trạng thái xử lý |
| comment | string | Bình luận khi xử lý |
| updatedAt | string | Thời gian cập nhật bản ghi xử lý |

Có thể sử dụng các trường trong đó làm biến trong các Node tiếp theo theo nhu cầu.
