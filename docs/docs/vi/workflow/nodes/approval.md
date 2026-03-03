---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/workflow/nodes/approval).
:::

# Phê duyệt

## Giới thiệu

Trong luồng công việc phê duyệt, cần sử dụng nút "Phê duyệt" chuyên dụng để cấu hình logic vận hành cho người phê duyệt xử lý (thông qua, từ chối hoặc trả lại) yêu cầu phê duyệt đã khởi tạo, nút "Phê duyệt" cũng chỉ có thể được sử dụng trong quy trình phê duyệt.

:::info{title=Gợi ý}
Sự khác biệt so với nút "Xử lý thủ công" thông thường: Nút "Xử lý thủ công" thông thường dành cho các kịch bản tổng quát hơn, có thể được sử dụng cho nhiều loại luồng công việc như nhập dữ liệu thủ công, quyết định thủ công liệu quy trình có tiếp tục hay không, v.v. "Nút phê duyệt" là nút xử lý chuyên biệt dành riêng cho quy trình phê duyệt, chỉ xử lý dữ liệu của yêu cầu phê duyệt đã khởi tạo và không thể sử dụng trong các luồng công việc khác.
:::

## Tạo nút

Nhấp vào nút dấu cộng ("+") trong quy trình, thêm nút "Phê duyệt", sau đó chọn một trong các chế độ thông qua để tạo nút phê duyệt:

![Tạo nút Phê duyệt](https://static-docs.nocobase.com/20251107000938.png)

## Cấu hình nút

### Chế độ thông qua

Có hai chế độ thông qua:

1.  Chế độ trực tiếp: Thường được sử dụng cho các quy trình đơn giản, việc nút phê duyệt có thông qua hay không chỉ quyết định quy trình có kết thúc hay không, trường hợp không thông qua sẽ thoát trực tiếp khỏi quy trình.

    ![Chế độ thông qua_Chế độ trực tiếp](https://static-docs.nocobase.com/20251107001043.png)

2.  Chế độ phân nhánh: Thường được sử dụng cho logic dữ liệu phức tạp hơn, sau khi nút phê duyệt tạo ra bất kỳ kết quả nào, có thể tiếp tục thực thi các nút khác trong nhánh kết quả của nó.

    ![Chế độ thông qua_Chế độ phân nhánh](https://static-docs.nocobase.com/20251107001234.png)

    Sau khi nút này được "Thông qua", ngoài việc thực thi nhánh thông qua, quy trình tiếp theo cũng sẽ tiếp tục. Sau thao tác "Từ chối", theo mặc định cũng có thể tiếp tục thực thi quy trình tiếp theo, hoặc có thể cấu hình trong nút để kết thúc quy trình sau khi thực thi nhánh.

:::info{title=Gợi ý}
Chế độ thông qua không thể sửa đổi sau khi nút được tạo.
:::

### Người phê duyệt

Người phê duyệt là tập hợp người dùng chịu trách nhiệm cho hành động phê duyệt của nút này, có thể là một hoặc nhiều người dùng, nguồn lựa chọn có thể là giá trị tĩnh từ danh sách người dùng hoặc giá trị động được chỉ định bởi biến:

![Nút phê duyệt_Người phê duyệt](https://static-docs.nocobase.com/20251107001433.png)

Khi chọn biến, chỉ có thể chọn khóa chính hoặc khóa ngoại của dữ liệu người dùng trong ngữ cảnh và kết quả nút. Nếu biến được chọn là một mảng trong quá trình thực thi (quan hệ nhiều-nhiều), thì mỗi người dùng trong mảng sẽ được hợp nhất vào toàn bộ tập hợp người phê duyệt.

Ngoài việc chọn trực tiếp người dùng hoặc biến, cũng có thể lọc động những người dùng thỏa mãn điều kiện dựa trên điều kiện truy vấn của bộ sưu tập người dùng để làm người phê duyệt:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Chế độ thỏa thuận

Nếu chỉ có một người phê duyệt tại thời điểm thực thi cuối cùng (bao gồm cả trường hợp sau khi loại bỏ trùng lặp từ nhiều biến), thì bất kể chọn chế độ thỏa thuận nào, chỉ người dùng đó thực hiện thao tác phê duyệt và kết quả cũng chỉ do người dùng đó quyết định.

Khi có nhiều người dùng trong tập hợp người phê duyệt, việc chọn các chế độ thỏa thuận khác nhau đại diện cho các phương thức xử lý khác nhau:

1. Hoặc ký: Chỉ cần một người thông qua là nút thông qua, tất cả mọi người từ chối mới đại diện cho nút bị từ chối.
2. Hội ký: Cần tất cả mọi người thông qua mới đại diện cho nút thông qua, chỉ cần một người từ chối là nút bị từ chối.
3. Bỏ phiếu: Cần vượt quá tỷ lệ số người thông qua đã thiết lập thì nút mới thông qua, nếu không nút sẽ bị từ chối.

Đối với thao tác trả lại, trong bất kỳ chế độ nào, nếu có người dùng trong tập hợp người phê duyệt xử lý là trả lại, thì nút sẽ trực tiếp thoát khỏi quy trình.

### Thứ tự xử lý

Tương tự, khi có nhiều người dùng trong tập hợp người phê duyệt, việc chọn các thứ tự xử lý khác nhau đại diện cho các phương thức xử lý khác nhau:

1. Song song: Tất cả người phê duyệt có thể xử lý theo bất kỳ thứ tự nào, thứ tự trước sau không quan trọng.
2. Tuần tự: Người phê duyệt xử lý tuần tự theo thứ tự trong tập hợp người phê duyệt, người sau chỉ có thể xử lý sau khi người trước đã gửi.

Bất kể có được thiết lập là xử lý "Tuần tự" hay không, kết quả được tạo ra theo thứ tự xử lý thực tế cũng tuân theo các quy tắc trong "Chế độ thỏa thuận" nêu trên, sau khi đạt điều kiện tương ứng thì nút sẽ hoàn thành thực thi.

### Thoát luồng công việc sau khi nhánh từ chối kết thúc

Khi "Chế độ thông qua" được thiết lập là "Chế độ phân nhánh", có thể chọn thoát luồng công việc sau khi nhánh từ chối kết thúc. Sau khi chọn, cuối nhánh từ chối sẽ hiển thị một dấu "✗", cho biết sau khi nhánh này kết thúc sẽ không tiếp tục các nút tiếp theo:

![Nút phê duyệt_Thoát sau khi từ chối](https://static-docs.nocobase.com/20251107001839.png)

### Cấu hình giao diện người phê duyệt

Cấu hình giao diện người phê duyệt được sử dụng để cung cấp giao diện thao tác cho người phê duyệt khi luồng công việc phê duyệt thực thi đến nút này, nhấp vào nút cấu hình để mở cửa sổ bật lên:

![Nút phê duyệt_Cấu hình giao diện_Cửa sổ bật lên](https://static-docs.nocobase.com/20251107001958.png)

Trong cửa sổ cấu hình có thể thêm các khối như nội dung gửi ban đầu, thông tin phê duyệt, biểu mẫu xử lý và văn bản nhắc nhở tùy chỉnh:

![Nút phê duyệt_Cấu hình giao diện_Thêm khối](https://static-docs.nocobase.com/20251107002604.png)

#### Nội dung gửi ban đầu

Trong đó, khối chi tiết nội dung phê duyệt là khối dữ liệu do người khởi tạo gửi, tương tự như khối dữ liệu thông thường, có thể tùy ý thêm các thành phần trường của bộ sưu tập và sắp xếp tùy ý để tổ chức nội dung mà người phê duyệt cần xem:

![Nút phê duyệt_Cấu hình giao diện_Khối chi tiết](https://static-docs.nocobase.com/20251107002925.png)

#### Biểu mẫu xử lý

Trong khối biểu mẫu thao tác có thể thêm các nút thao tác được nút này hỗ trợ, bao gồm "Thông qua", "Phủ quyết", "Trả lại", "Chuyển giao" và "Thêm người ký":

![Nút phê duyệt_Cấu hình giao diện_Khối biểu mẫu thao tác](https://static-docs.nocobase.com/20251107003015.png)

Ngoài ra, cũng có thể thêm các trường có thể được sửa đổi bởi người phê duyệt vào biểu mẫu thao tác. Các trường này sẽ hiển thị trong biểu mẫu thao tác khi người phê duyệt xử lý phê duyệt, người phê duyệt có thể sửa đổi giá trị của các trường này, sau khi gửi sẽ đồng thời cập nhật dữ liệu dùng để phê duyệt cũng như bản sao của dữ liệu tương ứng trong quy trình phê duyệt.

![Nút phê duyệt_Cấu hình giao diện_Biểu mẫu thao tác_Sửa đổi trường nội dung phê duyệt](https://static-docs.nocobase.com/20251107003206.png)

#### "Thông qua" và "Phủ quyết"

Trong các nút thao tác phê duyệt, "Thông qua" và "Phủ quyết" là các thao tác quyết định, sau khi gửi thì quá trình xử lý của người phê duyệt tại nút này hoàn thành, các trường bổ sung cần điền khi gửi có thể được thêm trong cửa sổ "Cấu hình xử lý" của nút thao tác, ví dụ như "Bình luận".

![Nút phê duyệt_Cấu hình giao diện_Biểu mẫu thao tác_Cấu hình xử lý](https://static-docs.nocobase.com/20251107003314.png)

#### "Trả lại"

"Trả lại" cũng là thao tác quyết định, ngoài việc có thể cấu hình bình luận, còn có thể cấu hình các nút có thể trả lại:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Chuyển giao" và "Thêm người ký"

"Chuyển giao" và "Thêm người ký" là các thao tác không quyết định, được sử dụng để điều chỉnh động người phê duyệt trong quy trình phê duyệt, "Chuyển giao" là giao nhiệm vụ phê duyệt của người dùng hiện tại cho một người dùng khác xử lý thay, "Thêm người ký" là thêm một người phê duyệt trước hoặc sau người phê duyệt hiện tại, do người phê duyệt mới thêm vào cùng tiếp tục phê duyệt.

Sau khi bật nút thao tác "Chuyển giao" hoặc "Thêm người ký", cần chọn "Phạm vi chỉ định nhân viên" trong menu cấu hình của nút để thiết lập phạm vi có thể chỉ định người phê duyệt mới:

![Nút phê duyệt_Cấu hình giao diện_Biểu mẫu thao tác_Phạm vi chỉ định nhân viên](https://static-docs.nocobase.com/20241226232321.png)

Tương tự như cấu hình người phê duyệt ban đầu của nút, phạm vi chỉ định nhân viên cũng có thể là người phê duyệt được chọn trực tiếp hoặc dựa trên điều kiện truy vấn của bộ sưu tập người dùng, cuối cùng sẽ được hợp nhất thành một tập hợp và không bao gồm những người dùng đã có trong tập hợp người phê duyệt.

:::warning{title=Quan trọng}
Nếu bật hoặc tắt một nút thao tác nào đó, hoặc sửa đổi phạm vi chỉ định nhân viên, cần lưu cấu hình của nút này sau khi đóng cửa sổ cấu hình giao diện thao tác, nếu không thay đổi của nút thao tác đó sẽ không có hiệu lực.
:::

### Thẻ "Phê duyệt của tôi" <Badge>2.0+</Badge>