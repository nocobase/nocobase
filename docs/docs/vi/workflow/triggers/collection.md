:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sự kiện bộ sưu tập

## Giới thiệu

Bộ kích hoạt (trigger) loại sự kiện bộ sưu tập sẽ lắng nghe các sự kiện thêm, sửa, xóa dữ liệu trên một bộ sưu tập. Khi một thao tác dữ liệu trên bộ sưu tập đó xảy ra và đáp ứng các điều kiện đã cấu hình, nó sẽ kích hoạt luồng công việc tương ứng. Ví dụ, các tình huống như trừ tồn kho sản phẩm sau khi tạo đơn hàng mới, hoặc chờ xét duyệt thủ công sau khi thêm một bình luận mới.

## Cách sử dụng cơ bản

Có một số trường hợp thay đổi của bộ sưu tập:

1. Sau khi tạo dữ liệu.
2. Sau khi cập nhật dữ liệu.
3. Sau khi tạo hoặc cập nhật dữ liệu.
4. Sau khi xóa dữ liệu.

![Sự kiện bộ sưu tập_Chọn thời điểm kích hoạt](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Quý vị có thể chọn thời điểm kích hoạt dựa trên các nhu cầu nghiệp vụ khác nhau. Khi chọn trường hợp thay đổi bao gồm việc cập nhật bộ sưu tập, quý vị cũng có thể giới hạn các trường đã thay đổi. Điều kiện kích hoạt chỉ được đáp ứng khi các trường đã chọn thay đổi. Nếu không chọn trường nào, điều đó có nghĩa là bất kỳ thay đổi nào trong các trường đều có thể kích hoạt.

![Sự kiện bộ sưu tập_Chọn trường đã thay đổi](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Cụ thể hơn, quý vị có thể cấu hình các quy tắc điều kiện cho từng trường của hàng dữ liệu kích hoạt. Bộ kích hoạt sẽ chỉ hoạt động khi các trường đáp ứng các điều kiện tương ứng.

![Sự kiện bộ sưu tập_Cấu hình điều kiện dữ liệu](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Sau khi một sự kiện bộ sưu tập được kích hoạt, hàng dữ liệu đã tạo ra sự kiện sẽ được đưa vào kế hoạch thực thi dưới dạng dữ liệu ngữ cảnh kích hoạt, để các nút trong luồng công việc tiếp theo sử dụng làm biến. Tuy nhiên, khi các nút tiếp theo cần sử dụng các trường quan hệ của dữ liệu này, quý vị cần cấu hình tải trước dữ liệu quan hệ. Dữ liệu quan hệ đã chọn sẽ được đưa vào ngữ cảnh cùng với bộ kích hoạt và có thể được chọn và sử dụng theo cấp bậc.

## Lưu ý quan trọng

### Hiện không hỗ trợ kích hoạt bởi các thao tác dữ liệu hàng loạt

Sự kiện bộ sưu tập hiện không hỗ trợ kích hoạt bởi các thao tác dữ liệu hàng loạt. Ví dụ, khi tạo một bài viết và đồng thời thêm nhiều thẻ cho bài viết đó (dữ liệu quan hệ một-nhiều), chỉ luồng công việc tạo bài viết mới được kích hoạt. Các thẻ được thêm đồng thời sẽ không kích hoạt luồng công việc tạo thẻ mới. Khi liên kết hoặc thêm dữ liệu quan hệ nhiều-nhiều, luồng công việc cho bộ sưu tập trung gian cũng sẽ không được kích hoạt.

### Các thao tác dữ liệu bên ngoài ứng dụng sẽ không kích hoạt sự kiện

Các thao tác trên bộ sưu tập thông qua các lệnh gọi API HTTP đến giao diện ứng dụng cũng có thể kích hoạt các sự kiện tương ứng. Tuy nhiên, nếu các thay đổi dữ liệu được thực hiện trực tiếp thông qua các thao tác cơ sở dữ liệu thay vì thông qua ứng dụng NocoBase, các sự kiện tương ứng sẽ không thể được kích hoạt. Ví dụ, các trigger gốc của cơ sở dữ liệu sẽ không được liên kết với các luồng công việc trong ứng dụng.

Ngoài ra, việc sử dụng nút hành động SQL để thao tác trên cơ sở dữ liệu tương đương với việc thao tác trực tiếp trên cơ sở dữ liệu và sẽ không kích hoạt các sự kiện bộ sưu tập.

### Nguồn dữ liệu bên ngoài

Luồng công việc đã hỗ trợ nguồn dữ liệu bên ngoài kể từ phiên bản `0.20`. Nếu quý vị đang sử dụng một plugin nguồn dữ liệu bên ngoài và sự kiện bộ sưu tập được cấu hình cho một nguồn dữ liệu bên ngoài, miễn là các thao tác dữ liệu trên nguồn dữ liệu đó được thực hiện trong ứng dụng (chẳng hạn như tạo mới, cập nhật của người dùng và các thao tác dữ liệu của luồng công việc), các sự kiện bộ sưu tập tương ứng đều có thể được kích hoạt. Tuy nhiên, nếu các thay đổi dữ liệu được thực hiện thông qua các hệ thống khác hoặc trực tiếp trong cơ sở dữ liệu bên ngoài, các sự kiện bộ sưu tập sẽ không thể được kích hoạt.

## Ví dụ

Hãy lấy ví dụ về kịch bản tính tổng giá và trừ tồn kho sau khi tạo một đơn hàng mới.

Đầu tiên, chúng ta tạo bộ sưu tập Sản phẩm và bộ sưu tập Đơn hàng, với mô hình dữ liệu như sau:

| Tên trường      | Kiểu trường    |
| --------------- | -------------- |
| Tên sản phẩm    | Văn bản một dòng |
| Giá             | Số             |
| Tồn kho         | Số nguyên      |

| Tên trường      | Kiểu trường       |
| --------------- | ---------------- |
| Mã đơn hàng     | Số tự động        |
| Sản phẩm đơn hàng | Nhiều-một (Sản phẩm) |
| Tổng giá đơn hàng | Số             |

Và thêm một số dữ liệu sản phẩm cơ bản:

| Tên sản phẩm  | Giá  | Tồn kho |
| ------------- | ---- | ------- |
| iPhone 14 Pro | 7999 | 10      |
| iPhone 13 Pro | 5999 | 0       |

Sau đó, tạo một luồng công việc dựa trên sự kiện bộ sưu tập Đơn hàng:

![Sự kiện bộ sưu tập_Ví dụ_Kích hoạt đơn hàng mới](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Một số tùy chọn cấu hình bao gồm:

- Bộ sưu tập: Chọn bộ sưu tập "Đơn hàng".
- Thời điểm kích hoạt: Chọn "Sau khi tạo dữ liệu".
- Điều kiện kích hoạt: Để trống.
- Tải trước dữ liệu quan hệ: Chọn "Sản phẩm".

Sau đó, cấu hình các nút khác theo logic của luồng công việc: kiểm tra xem tồn kho sản phẩm có lớn hơn 0 hay không. Nếu lớn hơn 0, trừ tồn kho; ngược lại, đơn hàng không hợp lệ và cần được xóa.

![Sự kiện bộ sưu tập_Ví dụ_Sắp xếp luồng công việc đơn hàng mới](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Cấu hình của các nút sẽ được giải thích chi tiết trong tài liệu giới thiệu về từng loại cụ thể.

Kích hoạt luồng công việc này và kiểm tra bằng cách tạo một đơn hàng mới thông qua giao diện. Sau khi đặt hàng "iPhone 14 Pro", tồn kho của sản phẩm tương ứng sẽ giảm xuống còn 9. Nếu đặt hàng "iPhone 13 Pro", đơn hàng sẽ bị xóa do không đủ tồn kho.

![Sự kiện bộ sưu tập_Ví dụ_Kết quả thực thi đơn hàng mới](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)