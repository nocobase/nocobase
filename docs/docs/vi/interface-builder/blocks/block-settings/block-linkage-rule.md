---
title: "Quy tắc liên kết Block"
description: "Cấu hình Block: cài đặt Quy tắc liên kết Block, thực hiện liên kết dữ liệu giữa các Block, liên kết lọc, liên kết hiển thị/ẩn."
keywords: "Quy tắc liên kết Block,liên kết Block,liên kết dữ liệu,cấu hình Block,Interface Builder,NocoBase"
---

# Quy tắc liên kết Block

## Giới thiệu

Quy tắc liên kết Block cho phép bạn kiểm soát động hiển thị Block, quản lý tổng thể việc hiển thị các phần tử từ cấp Block. Block là vật mang Field và nút Action, thông qua các quy tắc này, bạn có thể linh hoạt kiểm soát toàn bộ view hiển thị từ chiều Block.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Lưu ý**: Trước khi thực thi Quy tắc liên kết Block, hiển thị Block trước tiên cần qua **đánh giá quyền ACL**, chỉ khi bạn có quyền truy cập tương ứng, mới có thể vào logic đánh giá Quy tắc liên kết Block. Nói cách khác, Quy tắc liên kết Block chỉ có hiệu lực sau khi đáp ứng yêu cầu quyền xem ACL, khi không có Quy tắc liên kết Block, Block mặc định hiển thị.

### Biến toàn cục kiểm soát Block

**Quy tắc liên kết Block** hỗ trợ kiểm soát động nội dung hiển thị của Block thông qua biến toàn cục, cho phép người dùng có vai trò và quyền khác nhau xem và thao tác view dữ liệu được tùy chỉnh. Ví dụ, trong hệ thống quản lý đơn hàng, mặc dù các vai trò khác nhau (như admin, nhân viên bán hàng, nhân viên tài chính, v.v.) đều có quyền xem đơn hàng, nhưng các Field và nút Action mỗi vai trò cần xem có thể khác nhau. Bằng cách cấu hình biến toàn cục, có thể linh hoạt điều chỉnh các Field hiển thị, nút Action, thậm chí cả quy tắc Sắp xếp và lọc dữ liệu theo vai trò người dùng, quyền hoặc các điều kiện khác.

#### Trường hợp ứng dụng cụ thể:

- **Kiểm soát quyền vai trò**: Theo quyền của các vai trò khác nhau, kiểm soát các Field nhất định có hiển thị hoặc có thể chỉnh sửa hay không. Ví dụ, nhân viên bán hàng chỉ có thể xem thông tin cơ bản của đơn hàng, trong khi nhân viên tài chính có thể xem chi tiết thanh toán đơn hàng.
- **View cá nhân hóa**: Tùy chỉnh các view Block khác nhau cho các phòng ban hoặc đội nhóm khác nhau, đảm bảo mỗi người dùng chỉ thấy nội dung liên quan đến công việc của họ, nâng cao hiệu suất làm việc.
- **Quản lý quyền Action**: Kiểm soát hiển thị nút Action thông qua biến toàn cục, ví dụ, một số vai trò có thể chỉ có thể xem dữ liệu, các vai trò khác có thể thực hiện các thao tác như sửa đổi, xóa.

### Biến ngữ cảnh kiểm soát Block

Block còn có thể được kiểm soát hiển thị thông qua biến trong ngữ cảnh. Ví dụ, có thể sử dụng các biến ngữ cảnh như "Bản ghi hiện tại", "Form hiện tại", "Bản ghi Popup hiện tại" để hiển thị hoặc ẩn động Block.

Ví dụ: Chỉ khi trạng thái đơn hàng là "Đã thanh toán", mới hiển thị Block "Thông tin cơ hội đơn hàng".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Xem thêm giải thích về Quy tắc liên kết tại [Quy tắc liên kết](/interface-builder/linkage-rule)
