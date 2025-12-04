:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quy tắc Liên kết Khối

## Giới thiệu

Quy tắc liên kết khối cho phép người dùng kiểm soát động việc hiển thị của các khối, quản lý tổng thể việc trình bày các phần tử ở cấp độ khối. Khối đóng vai trò là nơi chứa các trường và nút thao tác, thông qua các quy tắc này, người dùng có thể linh hoạt kiểm soát việc hiển thị của toàn bộ chế độ xem từ góc độ khối.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Lưu ý**: Trước khi thực thi các quy tắc liên kết khối, việc hiển thị của khối trước tiên cần trải qua **kiểm tra quyền ACL**. Chỉ khi người dùng có quyền truy cập tương ứng, logic đánh giá của quy tắc liên kết khối mới được thực hiện. Nói cách khác, các quy tắc liên kết khối chỉ có hiệu lực sau khi đáp ứng yêu cầu quyền xem ACL. Khi không có quy tắc liên kết khối, khối sẽ hiển thị mặc định.

### Kiểm soát Khối bằng Biến Toàn cục

**Quy tắc liên kết khối** hỗ trợ sử dụng các biến toàn cục để kiểm soát động nội dung hiển thị trong các khối, giúp người dùng với các vai trò và quyền hạn khác nhau có thể xem và thao tác với các chế độ xem dữ liệu tùy chỉnh. Ví dụ, trong một hệ thống quản lý đơn hàng, mặc dù các vai trò khác nhau (như quản trị viên, nhân viên bán hàng, nhân viên tài chính, v.v.) đều có quyền xem đơn hàng, nhưng các trường và nút thao tác mà mỗi vai trò cần xem có thể khác nhau. Bằng cách cấu hình các biến toàn cục, bạn có thể dựa trên vai trò, quyền hạn hoặc các điều kiện khác của người dùng để linh hoạt điều chỉnh các trường hiển thị, nút thao tác, và thậm chí cả các quy tắc sắp xếp và lọc dữ liệu.

#### Các trường hợp sử dụng cụ thể:

- **Kiểm soát quyền theo vai trò**: Dựa trên quyền hạn của các vai trò khác nhau, kiểm soát liệu một số trường có hiển thị hoặc có thể chỉnh sửa được hay không. Ví dụ, nhân viên bán hàng chỉ có thể xem thông tin cơ bản của đơn hàng, trong khi nhân viên tài chính có thể xem chi tiết thanh toán.
- **Chế độ xem cá nhân hóa**: Tùy chỉnh các chế độ xem khối khác nhau cho các phòng ban hoặc nhóm khác nhau, đảm bảo mỗi người dùng chỉ thấy nội dung liên quan đến công việc của họ, từ đó nâng cao hiệu quả công việc.
- **Quản lý quyền thao tác**: Kiểm soát việc hiển thị các nút thao tác thông qua các biến toàn cục. Ví dụ, một số vai trò có thể chỉ được xem dữ liệu, trong khi các vai trò khác có thể thực hiện các thao tác như sửa đổi hoặc xóa.

### Kiểm soát Khối bằng Biến Ngữ cảnh

Các khối cũng có thể được kiểm soát hiển thị thông qua các biến trong ngữ cảnh. Ví dụ, bạn có thể sử dụng các biến ngữ cảnh như "Bản ghi hiện tại", "Biểu mẫu hiện tại", "Bản ghi cửa sổ bật lên hiện tại" để hiển thị hoặc ẩn khối một cách động.

Ví dụ: Khối "Thông tin cơ hội đơn hàng" chỉ hiển thị khi trạng thái của đơn hàng là "Đã thanh toán".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Để biết thêm thông tin về quy tắc liên kết, tham khảo [Quy tắc Liên kết](/interface-builder/linkage-rule)