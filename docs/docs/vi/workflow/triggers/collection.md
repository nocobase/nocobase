---
title: "Trigger Workflow - Sự kiện bảng dữ liệu"
description: "Trigger sự kiện bảng dữ liệu: lắng nghe các thao tác thêm/sửa/xóa/xem trên bảng dữ liệu, kích hoạt Workflow khi thỏa mãn điều kiện, như trừ tồn kho khi có đơn mới hay duyệt bình luận."
keywords: "workflow,sự kiện bảng dữ liệu,trigger,thêm sửa xóa,sự kiện Collection,NocoBase"
---

# Sự kiện bảng dữ liệu

## Giới thiệu

Trigger loại sự kiện bảng dữ liệu sẽ lắng nghe các sự kiện thêm/sửa/xóa/xem của bảng dữ liệu, khi xảy ra thao tác dữ liệu trên bảng đó và thỏa mãn điều kiện được cấu hình thì sẽ kích hoạt Workflow tương ứng. Ví dụ trừ tồn kho sản phẩm sau khi có đơn hàng mới, chờ kiểm duyệt thủ công sau khi có bình luận mới...

## Sử dụng cơ bản

Có một số trường hợp biến động của bảng dữ liệu:

1. Sau khi thêm dữ liệu.
2. Sau khi cập nhật dữ liệu.
3. Sau khi thêm hoặc cập nhật dữ liệu.
4. Sau khi xóa dữ liệu.

![Sự kiện bảng dữ liệu_chọn thời điểm kích hoạt](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Có thể chọn thời điểm kích hoạt khác nhau tùy theo nhu cầu nghiệp vụ. Khi trường hợp biến động được chọn bao gồm trường hợp cập nhật bảng dữ liệu, còn có thể giới hạn các trường có biến động, chỉ khi các trường được chọn có biến động thì mới thỏa mãn điều kiện kích hoạt, không chọn nghĩa là tất cả các trường có biến động đều có thể kích hoạt.

![Sự kiện bảng dữ liệu_chọn các trường có biến động](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Chi tiết hơn, có thể cấu hình các quy tắc điều kiện cho từng trường của dòng dữ liệu được kích hoạt, khi các trường thỏa mãn điều kiện tương ứng thì mới kích hoạt.

![Sự kiện bảng dữ liệu_cấu hình điều kiện dữ liệu thỏa mãn](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Sau khi sự kiện bảng dữ liệu được kích hoạt, sẽ inject dòng dữ liệu sinh ra sự kiện vào kế hoạch thực thi làm dữ liệu ngữ cảnh kích hoạt để các Node trong quy trình tiếp theo gọi làm biến. Nhưng khi muốn sử dụng trường quan hệ của dữ liệu này trong các Node tiếp theo, cần cấu hình preload dữ liệu quan hệ trước, dữ liệu quan hệ được chọn sẽ được inject cùng vào ngữ cảnh sau khi kích hoạt và có thể được chọn theo cấp để sử dụng.

## Mẹo liên quan

### Tạm thời chưa hỗ trợ kích hoạt thao tác dữ liệu hàng loạt

Sự kiện bảng dữ liệu tạm thời chưa hỗ trợ kích hoạt thao tác dữ liệu hàng loạt, ví dụ khi thêm dữ liệu bài viết và đồng thời thêm nhiều dữ liệu thẻ của bài viết đó (dữ liệu quan hệ một - nhiều), chỉ có thể kích hoạt Workflow thêm bài viết, còn nhiều thẻ được thêm cùng lúc sẽ không kích hoạt Workflow thêm thẻ. Khi liên kết và thêm dữ liệu quan hệ nhiều - nhiều, cũng sẽ không kích hoạt Workflow của bảng trung gian.

### Thao tác dữ liệu ngoài ứng dụng sẽ không kích hoạt

Việc thao tác bảng dữ liệu thông qua việc gọi API ứng dụng qua HTTP cũng có thể kích hoạt sự kiện tương ứng, nhưng nếu không thông qua ứng dụng NocoBase mà trực tiếp thao tác cơ sở dữ liệu để gây ra biến động dữ liệu thì sẽ không kích hoạt sự kiện tương ứng. Ví dụ Trigger trong cơ sở dữ liệu sẽ không liên quan với Workflow trong ứng dụng.

Ngoài ra, việc sử dụng Node thao tác SQL để thao tác cơ sở dữ liệu tương đương với việc thao tác trực tiếp cơ sở dữ liệu nên cũng sẽ không kích hoạt sự kiện bảng dữ liệu.

### Nguồn dữ liệu bên ngoài

Workflow từ phiên bản `0.20` đã hỗ trợ nguồn dữ liệu bên ngoài, nếu sử dụng plugin nguồn dữ liệu bên ngoài và sự kiện bảng dữ liệu được cấu hình là nguồn dữ liệu bên ngoài, chỉ cần thao tác dữ liệu trên nguồn dữ liệu đó được hoàn thành trong ứng dụng (người dùng thêm, cập nhật và Workflow thao tác dữ liệu...) thì đều có thể kích hoạt sự kiện bảng dữ liệu tương ứng. Nhưng nếu biến động dữ liệu được thực hiện thông qua hệ thống khác hoặc trực tiếp trong cơ sở dữ liệu bên ngoài thì sẽ không kích hoạt sự kiện bảng dữ liệu.

## Ví dụ

Lấy ví dụ tình huống tính tổng giá và trừ tồn kho sau khi thêm một đơn hàng.

Đầu tiên, chúng ta tạo bảng sản phẩm và bảng đơn hàng, mô hình dữ liệu như sau:

| Tên trường | Loại trường |
| -------- | -------- |
| Tên sản phẩm | Văn bản một dòng |
| Giá     | Số     |
| Tồn kho     | Số nguyên     |

| Tên trường | Loại trường       |
| -------- | -------------- |
| Mã đơn hàng   | Tự động đánh số       |
| Sản phẩm đặt | Nhiều - một (Sản phẩm) |
| Tổng giá đơn hàng | Số           |

Và thêm dữ liệu sản phẩm cơ bản:

| Tên sản phẩm      | Giá | Tồn kho |
| ------------- | ---- | ---- |
| iPhone 14 Pro | 7999 | 10   |
| iPhone 13 Pro | 5999 | 0    |

Sau đó tạo một Workflow dựa trên sự kiện bảng dữ liệu của đơn hàng:

![Sự kiện bảng dữ liệu_ví dụ_kích hoạt khi thêm đơn](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Một số mục cấu hình trong đó:

- Bảng dữ liệu: chọn bảng "Đơn hàng".
- Thời điểm kích hoạt: chọn kích hoạt "Sau khi thêm dữ liệu".
- Điều kiện kích hoạt: để trống.
- Preload dữ liệu quan hệ: chọn "Sản phẩm".

Sau đó cấu hình các Node khác theo logic của quy trình, kiểm tra tồn kho sản phẩm có lớn hơn 0 không, nếu lớn hơn 0 thì trừ tồn kho, ngược lại đơn hàng không hợp lệ thì xóa đơn hàng:

![Sự kiện bảng dữ liệu_ví dụ_điều phối quy trình thêm đơn](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Cấu hình của các Node sẽ được mô tả chi tiết trong tài liệu giới thiệu loại cụ thể.

Bật Workflow này và thêm đơn hàng qua giao diện để kiểm thử. Sau khi đặt hàng "iPhone 14 Pro", tồn kho của sản phẩm tương ứng sẽ giảm còn 9, còn nếu đặt "iPhone 13 Pro" thì do tồn kho không đủ, đơn hàng sẽ bị xóa.

![Sự kiện bảng dữ liệu_ví dụ_kết quả thực thi thêm đơn](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)
