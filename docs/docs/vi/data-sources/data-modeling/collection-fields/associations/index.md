:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trường Quan hệ

Trong NocoBase, trường quan hệ không phải là các trường dữ liệu thực sự, mà chúng được dùng để thiết lập kết nối giữa các **bộ sưu tập**. Khái niệm này tương đương với các mối quan hệ trong cơ sở dữ liệu quan hệ.

Trong cơ sở dữ liệu quan hệ, các loại mối quan hệ phổ biến nhất bao gồm:

- [Một-một](./o2o/index.md): Mỗi **thực thể** trong hai **bộ sưu tập** chỉ tương ứng với một **thực thể** duy nhất trong **bộ sưu tập** còn lại. Loại mối quan hệ này thường được sử dụng để lưu trữ các khía cạnh khác nhau của một **thực thể** trong các **bộ sưu tập** riêng biệt, nhằm giảm sự dư thừa và cải thiện tính nhất quán dữ liệu.
- [Một-nhiều](./o2m/index.md): Mỗi **thực thể** trong một **bộ sưu tập** có thể liên kết với nhiều **thực thể** trong **bộ sưu tập** khác. Đây là một trong những loại mối quan hệ phổ biến nhất. Ví dụ, một tác giả có thể viết nhiều bài báo, nhưng mỗi bài báo chỉ có thể có một tác giả.
- [Nhiều-một](./m2o/index.md): Nhiều **thực thể** trong một **bộ sưu tập** có thể liên kết với một **thực thể** duy nhất trong **bộ sưu tập** khác. Loại mối quan hệ này cũng rất phổ biến trong mô hình hóa dữ liệu. Chẳng hạn, nhiều sinh viên có thể thuộc cùng một lớp học.
- [Nhiều-nhiều](./m2m/index.md): Nhiều **thực thể** trong hai **bộ sưu tập** có thể liên kết với nhau. Loại mối quan hệ này thường yêu cầu một **bộ sưu tập trung gian** để ghi lại các liên kết giữa các **thực thể**. Ví dụ, mối quan hệ giữa sinh viên và khóa học – một sinh viên có thể đăng ký nhiều khóa học, và một khóa học cũng có thể có nhiều sinh viên.

Các loại mối quan hệ này đóng vai trò quan trọng trong thiết kế cơ sở dữ liệu và mô hình hóa dữ liệu, giúp mô tả các mối quan hệ và cấu trúc dữ liệu phức tạp trong thế giới thực.