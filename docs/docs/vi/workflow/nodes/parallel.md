---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nhánh song song

Nút nhánh song song cho phép bạn chia một luồng công việc thành nhiều nhánh. Mỗi nhánh có thể được cấu hình với các nút khác nhau, và cách thức thực thi của chúng sẽ thay đổi tùy theo chế độ nhánh. Bạn có thể sử dụng nút nhánh song song trong các tình huống cần thực hiện nhiều hành động đồng thời.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo nút

Trong giao diện cấu hình luồng công việc, bạn nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Nhánh song song”:

![Thêm nhánh song song](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Sau khi thêm nút nhánh song song vào luồng công việc, hai nhánh con sẽ được thêm vào mặc định. Bạn cũng có thể thêm nhiều nhánh hơn bằng cách nhấp vào nút thêm nhánh. Mỗi nhánh có thể thêm bất kỳ số lượng nút nào. Các nhánh không cần thiết có thể được xóa bằng cách nhấp vào nút xóa ở đầu nhánh.

![Quản lý nhánh song song](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Cấu hình nút

### Chế độ nhánh

Nút nhánh song song có ba chế độ sau:

- **Tất cả thành công**: Luồng công việc sẽ chỉ tiếp tục thực thi các nút sau khi tất cả các nhánh hoàn thành thành công. Nếu không, nếu bất kỳ nhánh nào kết thúc sớm, dù là do lỗi, thất bại hay bất kỳ trạng thái không thành công nào khác, toàn bộ nút nhánh song song sẽ kết thúc sớm với trạng thái đó. Chế độ này còn được gọi là “Chế độ All”.
- **Bất kỳ thành công**: Luồng công việc sẽ tiếp tục thực thi các nút sau khi bất kỳ nhánh nào hoàn thành thành công. Toàn bộ nút nhánh song song sẽ chỉ kết thúc sớm nếu tất cả các nhánh đều kết thúc sớm, dù là do lỗi, thất bại hay bất kỳ trạng thái không thành công nào khác. Chế độ này còn được gọi là “Chế độ Any”.
- **Bất kỳ thành công hoặc thất bại**: Luồng công việc sẽ tiếp tục thực thi các nút sau khi bất kỳ nhánh nào hoàn thành thành công. Tuy nhiên, nếu bất kỳ nút nào thất bại, toàn bộ nhánh song song sẽ kết thúc sớm với trạng thái đó. Chế độ này còn được gọi là “Chế độ Race”.

Bất kể chế độ nào, mỗi nhánh sẽ được thực thi theo thứ tự từ trái sang phải cho đến khi các điều kiện của chế độ nhánh được thiết lập trước được đáp ứng, sau đó sẽ tiếp tục đến các nút tiếp theo hoặc kết thúc sớm.

## Ví dụ

Tham khảo ví dụ trong [Nút Trì hoãn](./delay.md).