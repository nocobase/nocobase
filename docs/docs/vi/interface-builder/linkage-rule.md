---
title: "Quy tắc liên kết"
description: "Quy tắc liên kết trong xây dựng giao diện: liên kết Block, liên kết Field, liên kết Action, triển khai lọc, gán giá trị, ẩn hiện và liên kết dữ liệu giữa các component."
keywords: "Quy tắc liên kết, liên kết Block, liên kết Field, liên kết Action, liên kết dữ liệu, xây dựng giao diện, NocoBase"
---

# Quy tắc liên kết

## Giới thiệu

Trong NocoBase, quy tắc liên kết là một cơ chế dùng để kiểm soát hành vi tương tác của các phần tử giao diện ở phía front-end. Nó cho phép bạn điều chỉnh logic hiển thị và hành vi của Block, Field cũng như Action trong giao diện dựa trên các điều kiện khác nhau, mang lại trải nghiệm tương tác linh hoạt và low-code. Tính năng này đang được liên tục cải tiến và tối ưu hóa.

Bằng cách cấu hình quy tắc liên kết, bạn có thể thực hiện các tình huống như:

- Ẩn/hiển thị một số Block dựa trên vai trò người dùng hiện tại, các vai trò khác nhau hiển thị Block với phạm vi dữ liệu khác nhau, ví dụ Quản trị viên hiển thị Block thông tin đầy đủ; Người dùng thông thường chỉ thấy Block thông tin cơ bản
- Khi Form chọn một tùy chọn, tự động điền hoặc đặt lại giá trị các Field khác.
- Khi Form chọn một tùy chọn, vô hiệu hóa một số mục nhập.
- Khi Form chọn một tùy chọn, đặt một số mục nhập là bắt buộc.
- Kiểm soát việc nút Action có thể nhìn thấy hoặc nhấp được hay không trong một số điều kiện.


## Cấu hình điều kiện

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Biến bên trái

Biến bên trái của điều kiện được sử dụng để xác định "đối tượng được đánh giá" trong quy tắc liên kết, tức là dựa trên giá trị của biến đó để đánh giá điều kiện, từ đó quyết định có kích hoạt hành vi liên kết hay không.

Các biến có thể chọn bao gồm:

- Field trong ngữ cảnh, ví dụ `「Form hiện tại/xxx」`、`「Bản ghi hiện tại/xxx」`、`「Bản ghi Popup hiện tại/xxx」` v.v.;
- Biến toàn cục của hệ thống, ví dụ `Người dùng hiện tại`、`Vai trò hiện tại` v.v., phù hợp để kiểm soát động dựa trên thông tin định danh, quyền của người dùng.
  > Các biến có thể chọn cho biến bên trái được quyết định bởi ngữ cảnh nơi Block tồn tại, hãy sử dụng biến bên trái hợp lý theo nhu cầu nghiệp vụ:
  >
  > - 「Người dùng hiện tại」biểu thị thông tin người dùng đang trong trạng thái đăng nhập;
  > - 「Form hiện tại」biểu thị giá trị nhập vào theo thời gian thực trong Form;
  > - 「Bản ghi hiện tại」biểu thị giá trị bản ghi đã lưu, ví dụ bản ghi dòng trên Table.

### Toán tử

Toán tử dùng để thiết lập logic đánh giá điều kiện, tức là cách so sánh biến bên trái với giá trị bên phải. Các loại biến bên trái khác nhau hỗ trợ các toán tử khác nhau, các toán tử thường gặp như sau:

- **Loại Text**: `$includes`、`$eq`、`$ne`、`$empty`、`$notEmpty` v.v.
- **Loại số**: `$eq`、`$gt`、`$lt`、`$gte`、`$lte` v.v.
- **Loại Boolean**: `$isTruly`、`$isFalsy`
- **Loại mảng**: `$match`、`$anyOf`、`$empty`、`$notEmpty` v.v.

> Hệ thống sẽ tự động đề xuất danh sách toán tử khả dụng dựa trên loại biến bên trái, đảm bảo logic cấu hình hợp lý.

### Giá trị bên phải

Dùng để so sánh với biến bên trái, là giá trị tham chiếu để đánh giá điều kiện có thỏa mãn hay không.

Nội dung được hỗ trợ bao gồm:

- Giá trị hằng: nhập giá trị số, văn bản, ngày tháng cố định v.v.;
- Biến ngữ cảnh: ví dụ Field khác trong Form hiện tại, bản ghi hiện tại v.v.;
- Biến hệ thống: ví dụ người dùng hiện tại, thời gian hiện tại, vai trò hiện tại v.v.

> Hệ thống sẽ tự động điều chỉnh phương thức nhập bên phải dựa trên loại biến bên trái, ví dụ:
>
> - Khi bên trái là "Field tùy chọn", sẽ hiển thị bộ chọn tùy chọn tương ứng;
> - Khi bên trái là "Field ngày", sẽ hiển thị bộ chọn ngày;
> - Khi bên trái là "Field text", sẽ hiển thị ô nhập text.

> Sử dụng linh hoạt giá trị bên phải (đặc biệt là biến động), bạn có thể xây dựng logic liên kết dựa trên người dùng hiện tại, trạng thái dữ liệu hiện tại, ngữ cảnh môi trường, từ đó tạo ra trải nghiệm tương tác mạnh mẽ hơn.

## Logic thực thi quy tắc

### Kích hoạt điều kiện

Khi điều kiện trong quy tắc được thỏa mãn (không bắt buộc), thao tác thay đổi thuộc tính bên dưới sẽ được tự động thực thi, nếu không thiết lập điều kiện, mặc định sẽ coi quy tắc luôn được thỏa mãn và tự động thực thi thao tác thay đổi thuộc tính.

### Nhiều quy tắc

Bạn có thể cấu hình nhiều quy tắc liên kết cho một Form, khi đồng thời thỏa mãn điều kiện của nhiều quy tắc, hệ thống sẽ thực thi kết quả theo thứ tự trước sau của các quy tắc, tức là kết quả cuối cùng được lấy làm tiêu chuẩn.
Ví dụ: Quy tắc 1 đặt Field thành "Vô hiệu hóa", Quy tắc 2 đặt Field thành "Có thể chỉnh sửa", nếu cả hai điều kiện của quy tắc đều thỏa mãn, thì Field sẽ ở trạng thái "Có thể chỉnh sửa".

> Thứ tự thực thi của nhiều quy tắc rất quan trọng. Hãy đảm bảo khi thiết kế quy tắc, bạn cần làm rõ độ ưu tiên và mối quan hệ tương hỗ giữa chúng để tránh xung đột quy tắc

## Quản lý quy tắc

Bạn có thể thực hiện các thao tác sau cho mỗi quy tắc:

- Tùy chỉnh đặt tên: Đặt tên dễ hiểu cho quy tắc để thuận tiện quản lý và nhận diện.

- Sắp xếp: Điều chỉnh thứ tự theo độ ưu tiên thực thi của quy tắc, đảm bảo hệ thống xử lý quy tắc đúng thứ tự.

- Xóa: Xóa các quy tắc không còn cần thiết.

- Bật/Tắt: Tạm thời tắt một quy tắc nào đó mà không cần xóa, phù hợp với tình huống cần tạm dừng một quy tắc trong điều kiện cụ thể.

- Sao chép quy tắc: Tạo quy tắc mới bằng cách sao chép quy tắc đã có, tránh cấu hình lặp lại.

## Về biến

Trong việc gán giá trị Field và cấu hình điều kiện, không chỉ hỗ trợ sử dụng hằng số mà còn hỗ trợ sử dụng biến. Danh sách biến sẽ khác nhau tùy theo vị trí Block, lựa chọn và sử dụng biến hợp lý có thể đáp ứng linh hoạt hơn nhu cầu nghiệp vụ. Để biết thêm thông tin về biến, vui lòng tham khảo [Biến](/interface-builder/variables).

## Quy tắc liên kết Block

Quy tắc liên kết Block cho phép bạn kiểm soát động việc hiển thị Block dựa trên biến hệ thống (ví dụ người dùng hiện tại, vai trò) hoặc biến ngữ cảnh (ví dụ bản ghi Popup hiện tại). Ví dụ, Quản trị viên có thể xem thông tin đơn hàng đầy đủ, trong khi vai trò chăm sóc khách hàng chỉ có thể xem dữ liệu đơn hàng cụ thể. Thông qua quy tắc liên kết Block, bạn có thể cấu hình Block tương ứng theo vai trò, đồng thời thiết lập các Field, nút Action và phạm vi dữ liệu khác nhau trong Block. Khi vai trò đăng nhập là vai trò mục tiêu, hệ thống sẽ hiển thị Block tương ứng. Cần lưu ý rằng Block mặc định là hiển thị, thông thường cần phán đoán logic ẩn Block.

Chi tiết xem: [Block/Quy tắc liên kết Block](/interface-builder/blocks/block-settings/block-linkage-rule)

## Quy tắc liên kết Field

Quy tắc liên kết Field được sử dụng để điều chỉnh động trạng thái Field trong Form hoặc Block chi tiết dựa trên thao tác của người dùng, chủ yếu bao gồm:

- Kiểm soát **hiển thị/ẩn** Field
- Đặt Field có **bắt buộc** hay không
- **Gán giá trị**
- Thực thi JavaScript để xử lý logic nghiệp vụ tùy chỉnh

Chi tiết xem: [Block/Quy tắc liên kết Field](/interface-builder/blocks/block-settings/field-linkage-rule)

## Quy tắc liên kết Action

Quy tắc liên kết Action hiện hỗ trợ các biến ngữ cảnh như giá trị bản ghi hiện tại, Form hiện tại và biến toàn cục để kiểm soát hành vi Action như ẩn/vô hiệu hóa.

Chi tiết xem: [Action/Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule)
