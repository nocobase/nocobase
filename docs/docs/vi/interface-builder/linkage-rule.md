:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quy tắc Liên động

## Giới thiệu

Trong NocoBase, Quy tắc Liên động là một cơ chế dùng để kiểm soát hành vi tương tác của các phần tử giao diện người dùng (frontend). Nó cho phép người dùng điều chỉnh logic hiển thị và hành vi của các khối, trường và thao tác trong giao diện dựa trên các điều kiện khác nhau, mang lại trải nghiệm tương tác linh hoạt, ít mã (low-code). Tính năng này đang được liên tục cải tiến và tối ưu hóa.

Bằng cách cấu hình các quy tắc liên động, bạn có thể đạt được những điều sau:

- Ẩn/hiện một số khối dựa trên vai trò người dùng hiện tại. Các vai trò khác nhau sẽ thấy các khối với phạm vi dữ liệu khác nhau, ví dụ: quản trị viên thấy khối chứa thông tin đầy đủ; người dùng thông thường chỉ thấy khối thông tin cơ bản.
- Khi một tùy chọn được chọn trong biểu mẫu, tự động điền hoặc đặt lại giá trị của các trường khác.
- Khi một tùy chọn được chọn trong biểu mẫu, vô hiệu hóa một số mục nhập.
- Khi một tùy chọn được chọn trong biểu mẫu, đặt một số mục nhập là bắt buộc.
- Kiểm soát xem các nút thao tác có hiển thị hoặc có thể nhấp được trong một số điều kiện nhất định hay không.

## Cấu hình Điều kiện

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Biến bên trái

Biến bên trái trong điều kiện được dùng để định nghĩa "đối tượng đánh giá" trong quy tắc liên động. Điều kiện sẽ được đánh giá dựa trên giá trị của biến này để quyết định có kích hoạt hành vi liên động hay không.

Các biến có thể chọn bao gồm:

- Các trường trong ngữ cảnh, ví dụ: `「Biểu mẫu hiện tại/xxx」`, `「Bản ghi hiện tại/xxx」`, `「Bản ghi cửa sổ bật lên hiện tại/xxx」`, v.v.
- Các biến toàn cục hệ thống, ví dụ: `Người dùng hiện tại`, `Vai trò hiện tại`, v.v., phù hợp để kiểm soát động dựa trên thông tin nhận dạng, quyền hạn của người dùng và các thông tin khác.
  > ✅ Các tùy chọn biến bên trái khả dụng được xác định bởi ngữ cảnh của khối. Hãy sử dụng biến bên trái một cách hợp lý tùy theo nhu cầu nghiệp vụ:
  >
  > - `「Người dùng hiện tại」` đại diện cho thông tin người dùng đang đăng nhập;
  > - `「Biểu mẫu hiện tại」` đại diện cho các giá trị được nhập theo thời gian thực trong biểu mẫu;
  > - `「Bản ghi hiện tại」` đại diện cho giá trị bản ghi đã lưu, ví dụ như bản ghi hàng trong bảng.

### Toán tử

Toán tử được dùng để thiết lập logic đánh giá điều kiện, tức là cách so sánh biến bên trái với giá trị bên phải. Các loại biến bên trái khác nhau hỗ trợ các toán tử khác nhau. Các toán tử phổ biến như sau:

- **Kiểu văn bản**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, v.v.
- **Kiểu số**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, v.v.
- **Kiểu Boolean**: `$isTruly`, `$isFalsy`
- **Kiểu mảng**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, v.v.

> ✅ Hệ thống sẽ tự động đề xuất danh sách các toán tử khả dụng dựa trên kiểu của biến bên trái để đảm bảo logic cấu hình hợp lý.

### Giá trị bên phải

Được dùng để so sánh với biến bên trái, đây là giá trị tham chiếu để xác định xem điều kiện có được đáp ứng hay không.

Nội dung được hỗ trợ bao gồm:

- Giá trị hằng số: Nhập các số, văn bản, ngày tháng cố định, v.v.;
- Biến ngữ cảnh: ví dụ như các trường khác trong biểu mẫu hiện tại, bản ghi hiện tại, v.v.;
- Biến hệ thống: ví dụ như người dùng hiện tại, thời gian hiện tại, vai trò hiện tại, v.v.

> ✅ Hệ thống sẽ tự động điều chỉnh phương thức nhập cho giá trị bên phải dựa trên kiểu của biến bên trái, ví dụ:
>
> - Khi bên trái là "trường tùy chọn", bộ chọn tùy chọn tương ứng sẽ hiển thị;
> - Khi bên trái là "trường ngày tháng", bộ chọn ngày tháng sẽ hiển thị;
> - Khi bên trái là "trường văn bản", hộp nhập văn bản sẽ hiển thị.

> 💡 Việc sử dụng linh hoạt các giá trị bên phải (đặc biệt là các biến động) cho phép bạn xây dựng logic liên động dựa trên người dùng hiện tại, trạng thái dữ liệu hiện tại và môi trường ngữ cảnh, từ đó mang lại trải nghiệm tương tác mạnh mẽ hơn.

## Logic Thực thi Quy tắc

### Kích hoạt Điều kiện

Khi điều kiện trong một quy tắc được đáp ứng (không bắt buộc), thao tác sửa đổi thuộc tính bên dưới sẽ tự động được thực thi. Nếu không có điều kiện nào được thiết lập, quy tắc mặc định được coi là luôn đáp ứng và thao tác sửa đổi thuộc tính sẽ tự động được thực thi.

### Nhiều Quy tắc

Bạn có thể cấu hình nhiều quy tắc liên động cho một biểu mẫu. Khi các điều kiện của nhiều quy tắc được đáp ứng đồng thời, hệ thống sẽ thực thi các kết quả theo thứ tự từ đầu đến cuối, nghĩa là kết quả cuối cùng sẽ là tiêu chuẩn thực thi.
Ví dụ: Quy tắc 1 đặt một trường thành "Vô hiệu hóa", và Quy tắc 2 đặt trường đó thành "Có thể chỉnh sửa". Nếu điều kiện của cả hai quy tắc đều được đáp ứng, trường sẽ chuyển sang trạng thái "Có thể chỉnh sửa".

> Thứ tự thực thi của nhiều quy tắc là rất quan trọng. Khi thiết kế quy tắc, hãy đảm bảo làm rõ mức độ ưu tiên và mối quan hệ tương tác giữa chúng để tránh xung đột quy tắc.

## Quản lý Quy tắc

Bạn có thể thực hiện các thao tác sau đối với mỗi quy tắc:

- Đặt tên tùy chỉnh: Đặt tên dễ hiểu cho quy tắc để dễ quản lý và nhận diện.

- Sắp xếp: Điều chỉnh thứ tự dựa trên mức độ ưu tiên thực thi của quy tắc để đảm bảo hệ thống xử lý chúng theo đúng trình tự.

- Xóa: Xóa các quy tắc không còn cần thiết.

- Bật/Tắt: Tạm thời tắt một quy tắc mà không cần xóa nó, phù hợp cho các trường hợp cần tạm ngừng một quy tắc trong những tình huống cụ thể.

- Sao chép quy tắc: Tạo quy tắc mới bằng cách sao chép quy tắc hiện có để tránh cấu hình lặp lại.

## Về Biến

Trong việc gán giá trị trường và cấu hình điều kiện, không chỉ hỗ trợ sử dụng hằng số mà còn hỗ trợ sử dụng biến. Danh sách biến sẽ khác nhau tùy thuộc vào vị trí của khối. Việc lựa chọn và sử dụng biến một cách hợp lý có thể đáp ứng nhu cầu nghiệp vụ một cách linh hoạt hơn. Để biết thêm thông tin về biến, vui lòng tham khảo [Biến](/interface-builder/variables).

## Quy tắc Liên động Khối

Quy tắc liên động khối cho phép kiểm soát động việc hiển thị của một khối dựa trên các biến hệ thống (như người dùng hiện tại, vai trò) hoặc biến ngữ cảnh (như bản ghi cửa sổ bật lên hiện tại). Ví dụ, quản trị viên có thể xem thông tin đơn hàng đầy đủ, trong khi vai trò chăm sóc khách hàng chỉ có thể xem dữ liệu đơn hàng cụ thể. Thông qua quy tắc liên động khối, bạn có thể cấu hình các khối tương ứng dựa trên vai trò, và thiết lập các trường, nút thao tác và phạm vi dữ liệu khác nhau trong các khối đó. Khi vai trò đăng nhập là vai trò mục tiêu, hệ thống sẽ hiển thị khối tương ứng. Cần lưu ý rằng các khối mặc định là hiển thị, vì vậy thông thường bạn cần xác định logic để ẩn khối.

👉 Để biết chi tiết, xem: [Khối/Quy tắc Liên động Khối](/interface-builder/blocks/block-settings/block-linkage-rule)

## Quy tắc Liên động Trường

Quy tắc liên động trường được dùng để điều chỉnh động trạng thái của các trường trong biểu mẫu hoặc khối chi tiết dựa trên hành động của người dùng, chủ yếu bao gồm:

- Kiểm soát trạng thái **Hiển thị/Ẩn** của một trường
- Đặt trường có **Bắt buộc** hay không
- **Gán giá trị**
- Thực thi JavaScript để xử lý logic nghiệp vụ tùy chỉnh

👉 Để biết chi tiết, xem: [Khối/Quy tắc Liên động Trường](/interface-builder/blocks/block-settings/field-linkage-rule)

## Quy tắc Liên động Thao tác

Quy tắc liên động thao tác hiện hỗ trợ kiểm soát hành vi thao tác, như ẩn/vô hiệu hóa, dựa trên các biến ngữ cảnh như giá trị bản ghi hiện tại và biểu mẫu hiện tại, cũng như các biến toàn cục.

👉 Để biết chi tiết, xem: [Thao tác/Quy tắc Liên động](/interface-builder/actions/action-settings/linkage-rule)