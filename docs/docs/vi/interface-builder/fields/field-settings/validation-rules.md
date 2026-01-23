:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Thiết lập Quy tắc Xác thực

## Giới thiệu

Các quy tắc xác thực được sử dụng để đảm bảo dữ liệu người dùng nhập vào đáp ứng các yêu cầu mong muốn.

## Nơi thiết lập Quy tắc Xác thực cho Trường

### Cấu hình Quy tắc Xác thực cho Trường của bộ sưu tập

Hầu hết các trường đều hỗ trợ cấu hình quy tắc xác thực. Sau khi một trường được cấu hình quy tắc xác thực, quá trình xác thực ở phía backend sẽ được kích hoạt khi dữ liệu được gửi đi. Các loại trường khác nhau hỗ trợ các quy tắc xác thực khác nhau.

- **Trường Ngày**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Trường Số**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Trường Văn bản**

  Ngoài việc giới hạn độ dài văn bản, các trường văn bản còn hỗ trợ biểu thức chính quy (regex) tùy chỉnh để xác thực chi tiết hơn.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Xác thực Frontend trong Cấu hình Trường

Các quy tắc xác thực được thiết lập trong cấu hình trường sẽ kích hoạt quá trình xác thực ở phía frontend, đảm bảo dữ liệu người dùng nhập vào tuân thủ các quy định.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Các trường văn bản** cũng hỗ trợ xác thực bằng biểu thức chính quy (regex) tùy chỉnh để đáp ứng các yêu cầu định dạng cụ thể.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)