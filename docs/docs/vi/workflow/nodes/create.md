:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Thêm Dữ Liệu

Dùng để thêm một bản ghi mới vào một bộ sưu tập.

Các giá trị trường cho bản ghi mới có thể sử dụng biến từ ngữ cảnh của luồng công việc. Để gán giá trị cho các trường quan hệ, bạn có thể tham chiếu trực tiếp đến các biến dữ liệu tương ứng trong ngữ cảnh, có thể là một đối tượng hoặc giá trị khóa ngoại. Nếu không sử dụng biến, bạn cần nhập thủ công các giá trị khóa ngoại. Đối với nhiều giá trị khóa ngoại trong quan hệ nhiều-nhiều, chúng phải được phân tách bằng dấu phẩy.

## Tạo Nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Thêm Dữ Liệu”:

![Thêm nút 'Thêm Dữ Liệu'](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Cấu Hình Nút

![Nút Thêm Dữ Liệu_Ví dụ_Cấu Hình Nút](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Bộ sưu tập

Chọn bộ sưu tập mà bạn muốn thêm bản ghi mới vào.

### Giá Trị Trường

Gán giá trị cho các trường của bộ sưu tập. Bạn có thể sử dụng biến từ ngữ cảnh của luồng công việc hoặc nhập thủ công các giá trị tĩnh.

:::info{title="Lưu ý"}
Dữ liệu được tạo bởi nút “Thêm Dữ Liệu” trong luồng công việc không tự động xử lý dữ liệu người dùng như “Người tạo” và “Người sửa cuối cùng”. Bạn cần tự cấu hình giá trị cho các trường này tùy theo nhu cầu.
:::

### Tải trước dữ liệu quan hệ

Nếu các trường của bản ghi mới bao gồm các trường quan hệ và bạn muốn sử dụng dữ liệu quan hệ tương ứng trong các bước luồng công việc tiếp theo, bạn có thể chọn các trường quan hệ tương ứng trong cấu hình tải trước. Bằng cách này, sau khi bản ghi mới được tạo, dữ liệu quan hệ tương ứng sẽ tự động được tải và lưu trữ cùng với dữ liệu kết quả của nút.

## Ví Dụ

Ví dụ, khi dữ liệu trong bộ sưu tập “Bài viết” được thêm hoặc cập nhật, cần tự động thêm một bản ghi “Phiên bản Bài viết” để ghi lại lịch sử thay đổi của bài viết. Bạn có thể sử dụng nút “Thêm Dữ Liệu” để thực hiện điều này:

![Nút Thêm Dữ Liệu_Ví dụ_Cấu Hình Luồng Công Việc](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Nút Thêm Dữ Liệu_Ví dụ_Cấu Hình Nút](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Sau khi kích hoạt luồng công việc với cấu hình này, khi dữ liệu trong bộ sưu tập “Bài viết” thay đổi, một bản ghi “Phiên bản Bài viết” sẽ tự động được thêm để ghi lại lịch sử thay đổi của bài viết.