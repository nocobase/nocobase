---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Phê duyệt

## Giới thiệu

Trong một luồng công việc phê duyệt, cần sử dụng một nút "Phê duyệt" chuyên dụng để cấu hình logic vận hành cho người phê duyệt xử lý (duyệt, từ chối hoặc trả lại) yêu cầu phê duyệt đã khởi tạo. Nút "Phê duyệt" chỉ có thể được sử dụng trong các quy trình phê duyệt.

:::info{title=Mẹo}
Sự khác biệt so với nút "Xử lý thủ công" thông thường: Nút "Xử lý thủ công" thông thường được thiết kế cho các kịch bản tổng quát hơn, có thể dùng trong nhiều loại luồng công việc để nhập dữ liệu thủ công, quyết định thủ công liệu quy trình có tiếp tục hay không, v.v. Nút "Phê duyệt" là một nút xử lý chuyên biệt, dành riêng cho các quy trình phê duyệt, chỉ xử lý dữ liệu của yêu cầu phê duyệt đã khởi tạo và không thể sử dụng trong các luồng công việc khác.
:::

## Tạo nút

Nhấp vào nút dấu cộng ("+") trong luồng công việc, thêm nút "Phê duyệt", sau đó chọn một trong các chế độ duyệt để tạo nút phê duyệt:

![Tạo nút Phê duyệt](https://static-docs.nocobase.com/20251107000938.png)

## Cấu hình nút

### Chế độ duyệt

Có hai chế độ duyệt:

1.  **Chế độ duyệt thẳng**: Thường được sử dụng cho các quy trình đơn giản hơn. Việc nút phê duyệt được duyệt hay không chỉ quyết định liệu quy trình có kết thúc hay không. Nếu không được duyệt, quy trình sẽ thoát trực tiếp.

    ![Chế độ duyệt thẳng](https://static-docs.nocobase.com/20251107001043.png)

2.  **Chế độ phân nhánh**: Thường được sử dụng cho logic dữ liệu phức tạp hơn. Sau khi nút phê duyệt tạo ra bất kỳ kết quả nào, các nút khác có thể tiếp tục được thực thi trong nhánh kết quả của nó.

    ![Chế độ phân nhánh](https://static-docs.nocobase.com/20251107001234.png)

    Sau khi nút này được "Duyệt", ngoài việc thực thi nhánh duyệt, quy trình tiếp theo cũng sẽ tiếp tục. Sau thao tác "Từ chối", theo mặc định, quy trình tiếp theo cũng có thể tiếp tục, hoặc bạn có thể cấu hình nút để kết thúc quy trình sau khi thực thi nhánh.

:::info{title=Mẹo}
Chế độ duyệt không thể sửa đổi sau khi nút được tạo.
:::

### Người phê duyệt

Người phê duyệt là tập hợp người dùng chịu trách nhiệm cho hành động phê duyệt của nút này. Có thể là một hoặc nhiều người dùng. Nguồn lựa chọn có thể là một giá trị tĩnh được chọn từ danh sách người dùng, hoặc một giá trị động được chỉ định bởi một biến:

![Cấu hình người phê duyệt](https://static-docs.nocobase.com/20251107001433.png)

Khi chọn một biến, bạn chỉ có thể chọn khóa chính hoặc khóa ngoại của dữ liệu người dùng từ ngữ cảnh và kết quả nút. Nếu biến được chọn là một mảng trong quá trình thực thi (quan hệ nhiều-nhiều), thì mỗi người dùng trong mảng sẽ được hợp nhất vào toàn bộ tập hợp người phê duyệt.

Ngoài việc chọn trực tiếp người dùng hoặc biến, bạn cũng có thể lọc động những người dùng thỏa mãn điều kiện dựa trên các điều kiện truy vấn của bảng người dùng để làm người phê duyệt:

![Lọc người phê duyệt theo điều kiện](https://static-docs.nocobase.com/20251107001703.png)

### Chế độ thỏa thuận

Nếu chỉ có một người phê duyệt tại thời điểm thực thi cuối cùng (bao gồm cả trường hợp sau khi loại bỏ các giá trị trùng lặp từ nhiều biến), thì bất kể chế độ thỏa thuận nào được chọn, chỉ người dùng đó sẽ thực hiện thao tác phê duyệt và kết quả cũng chỉ do người dùng đó quyết định.

Khi có nhiều người dùng trong tập hợp người phê duyệt, việc chọn các chế độ thỏa thuận khác nhau sẽ đại diện cho các phương thức xử lý khác nhau:

1.  **Duyệt bất kỳ**: Chỉ cần một người trong số họ duyệt là nút được duyệt. Nút chỉ bị từ chối nếu tất cả mọi người đều từ chối.
2.  **Duyệt đồng thuận**: Cần tất cả mọi người duyệt thì nút mới được duyệt. Chỉ cần một người trong số họ từ chối là nút bị từ chối.
3.  **Bỏ phiếu**: Cần số người duyệt vượt quá tỷ lệ đã cài đặt thì nút mới được duyệt, nếu không nút sẽ bị từ chối.

Đối với thao tác trả lại, trong bất kỳ chế độ nào, nếu có người dùng trong tập hợp người phê duyệt xử lý là trả lại, thì nút sẽ trực tiếp thoát khỏi quy trình.

### Thứ tự xử lý

Tương tự, khi có nhiều người dùng trong tập hợp người phê duyệt, việc chọn các thứ tự xử lý khác nhau sẽ đại diện cho các phương thức xử lý khác nhau:

1.  **Song song**: Tất cả người phê duyệt có thể xử lý theo bất kỳ thứ tự nào, thứ tự xử lý không quan trọng.
2.  **Tuần tự**: Người phê duyệt xử lý tuần tự theo thứ tự trong tập hợp người phê duyệt. Người phê duyệt tiếp theo chỉ có thể xử lý sau khi người trước đó đã gửi.

Bất kể có được đặt là xử lý "Tuần tự" hay không, kết quả được tạo ra theo thứ tự xử lý thực tế cũng tuân theo các quy tắc trong "Chế độ thỏa thuận" đã nêu ở trên. Nút sẽ hoàn tất việc thực thi sau khi các điều kiện tương ứng được đáp ứng.

### Thoát luồng công việc sau khi nhánh từ chối kết thúc

Khi "Chế độ duyệt" được đặt là "Chế độ phân nhánh", bạn có thể chọn thoát luồng công việc sau khi nhánh từ chối kết thúc. Sau khi chọn tùy chọn này, một dấu "✗" sẽ hiển thị ở cuối nhánh từ chối, cho biết rằng các nút tiếp theo sẽ không tiếp tục sau khi nhánh này kết thúc:

![Thoát sau khi từ chối](https://static-docs.nocobase.com/20251107001839.png)

### Cấu hình giao diện người phê duyệt

Cấu hình giao diện người phê duyệt được sử dụng để cung cấp giao diện thao tác cho người phê duyệt khi luồng công việc phê duyệt thực thi đến nút này. Nhấp vào nút cấu hình để mở cửa sổ bật lên:

![Cửa sổ bật lên cấu hình giao diện người phê duyệt](https://static-docs.nocobase.com/20251107001958.png)

Trong cửa sổ bật lên cấu hình, bạn có thể thêm các khối như nội dung gửi ban đầu, thông tin phê duyệt, biểu mẫu xử lý và văn bản nhắc nhở tùy chỉnh:

![Thêm khối vào giao diện người phê duyệt](https://static-docs.nocobase.com/20251107002604.png)

#### Nội dung gửi ban đầu

Trong đó, khối chi tiết nội dung phê duyệt chính là khối dữ liệu do người khởi tạo gửi. Tương tự như một khối dữ liệu thông thường, bạn có thể tùy ý thêm các thành phần trường từ bảng dữ liệu và sắp xếp chúng theo ý muốn để tổ chức nội dung mà người phê duyệt cần xem:

![Cấu hình khối chi tiết](https://static-docs.nocobase.com/20251107002925.png)

#### Biểu mẫu xử lý

Trong khối biểu mẫu thao tác, bạn có thể thêm các nút thao tác được nút này hỗ trợ, bao gồm "Duyệt", "Từ chối", "Trả lại", "Chuyển giao" và "Thêm người ký":

![Khối biểu mẫu thao tác](https://static-docs.nocobase.com/20251107003015.png)

Ngoài ra, các trường có thể được người phê duyệt sửa đổi cũng có thể được thêm vào biểu mẫu thao tác. Các trường này sẽ hiển thị trong biểu mẫu thao tác khi người phê duyệt xử lý yêu cầu. Người phê duyệt có thể sửa đổi giá trị của các trường này, và sau khi gửi, cả dữ liệu dùng để phê duyệt và bản sao (snapshot) của dữ liệu tương ứng trong quy trình phê duyệt sẽ được cập nhật đồng thời.

![Sửa đổi các trường nội dung phê duyệt](https://static-docs.nocobase.com/20251107003206.png)

#### "Duyệt" và "Từ chối"

Trong các nút thao tác phê duyệt, "Duyệt" và "Từ chối" là các thao tác mang tính quyết định. Sau khi gửi, quá trình xử lý của người phê duyệt tại nút này sẽ hoàn tất. Các trường bổ sung cần điền khi gửi, chẳng hạn như "Bình luận", có thể được thêm vào trong cửa sổ bật lên "Cấu hình xử lý" của nút thao tác.

![Cấu hình xử lý](https://static-docs.nocobase.com/20251107003314.png)

#### "Trả lại"

"Trả lại" cũng là một thao tác mang tính quyết định. Ngoài việc có thể cấu hình bình luận, bạn còn có thể cấu hình các nút có thể trả lại:

![Cấu hình nút có thể trả lại](https://static-docs.nocobase.com/20251107003555.png)

#### "Chuyển giao" và "Thêm người ký"

"Chuyển giao" và "Thêm người ký" là các thao tác không mang tính quyết định, được sử dụng để điều chỉnh động người phê duyệt trong quy trình phê duyệt. "Chuyển giao" là giao nhiệm vụ phê duyệt của người dùng hiện tại cho một người dùng khác xử lý thay. "Thêm người ký" là thêm một người phê duyệt trước hoặc sau người phê duyệt hiện tại, và người phê duyệt mới sẽ cùng tiếp tục phê duyệt.

Sau khi bật các nút thao tác "Chuyển giao" hoặc "Thêm người ký", bạn cần chọn "Phạm vi chỉ định người" trong menu cấu hình của nút để thiết lập phạm vi những người có thể được chỉ định làm người phê duyệt mới:

![Phạm vi chỉ định người](https://static-docs.nocobase.com/20241226232321.png)

Tương tự như cấu hình người phê duyệt ban đầu của nút, phạm vi chỉ định người cũng có thể là những người phê duyệt được chọn trực tiếp, hoặc dựa trên các điều kiện truy vấn của bảng người dùng. Cuối cùng, chúng sẽ được hợp nhất thành một tập hợp và không bao gồm những người dùng đã có trong tập hợp người phê duyệt.

:::warning{title=Quan trọng}
Nếu một nút thao tác được bật hoặc tắt, hoặc phạm vi chỉ định người được sửa đổi, bạn phải lưu cấu hình của nút sau khi đóng cửa sổ bật lên cấu hình giao diện thao tác. Nếu không, các thay đổi đối với nút thao tác sẽ không có hiệu lực.
:::

## Kết quả nút

Sau khi quá trình phê duyệt hoàn tất, trạng thái và dữ liệu liên quan sẽ được ghi lại trong kết quả nút và có thể được sử dụng làm biến bởi các nút tiếp theo.

![Kết quả nút](https://static-docs.nocobase.com/20250614095052.png)

### Trạng thái phê duyệt của nút

Đại diện cho trạng thái xử lý của nút phê duyệt hiện tại, kết quả là một giá trị liệt kê (enum).

### Dữ liệu sau phê duyệt

Nếu người phê duyệt sửa đổi nội dung phê duyệt trong biểu mẫu thao tác, dữ liệu đã sửa đổi sẽ được ghi lại trong kết quả nút để các nút tiếp theo sử dụng. Nếu cần sử dụng các trường quan hệ, bạn cần cấu hình tải trước (preloading) cho các trường quan hệ trong trình kích hoạt (trigger).

### Lịch sử phê duyệt

> v1.8.0+

Lịch sử xử lý phê duyệt là một mảng, chứa các bản ghi xử lý của tất cả người phê duyệt trong nút này. Mỗi bản ghi xử lý bao gồm các trường sau:

| Trường | Kiểu | Mô tả |
| --- | --- | --- |
| id | number | Mã định danh duy nhất của bản ghi xử lý |
| userId | number | ID người dùng đã xử lý bản ghi này |
| status | number | Trạng thái xử lý |
| comment | string | Bình luận tại thời điểm xử lý |
| updatedAt | string | Thời gian cập nhật bản ghi xử lý |

Bạn có thể sử dụng các trường này làm biến trong các nút tiếp theo tùy theo nhu cầu.