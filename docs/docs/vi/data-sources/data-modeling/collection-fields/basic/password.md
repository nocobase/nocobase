---
title: "Mật khẩu"
description: "Trường mật khẩu dùng để lưu nội dung nhập thuộc loại mật khẩu, được hiển thị dưới dạng che khi nhập trên trang."
keywords: "mật khẩu,password,nhập liệu nhạy cảm,NocoBase"
---

# Mật khẩu

## Giới thiệu

Trong NocoBase, **mật khẩu (Password)** được dùng để nhập nội dung thuộc loại mật khẩu.

Trường mật khẩu phù hợp để lưu những nội dung cần ẩn trong quá trình nhập, chẳng hạn như mật khẩu dịch vụ bên ngoài, mã truy cập tạm thời, v.v. Điểm chính của trường này là cách nhập và hiển thị, không tương đương với một giải pháp quản lý khóa hoàn chỉnh.

Nếu cần lưu khóa có độ nhạy cảm cao hoặc thông tin xác thực dài hạn, hãy ưu tiên đánh giá các giải pháp mã hóa chuyên dụng, quản lý khóa hoặc biến môi trường.

## Các trường hợp sử dụng

Mật khẩu phù hợp với các tình huống nghiệp vụ sau:

- Mật khẩu tạm thời của hệ thống bên ngoài
- Mã truy cập trong cấu hình kết nối
- Văn bản nhạy cảm chỉ cần nhập dưới dạng che
- Mã xác minh hoặc mật khẩu tạm thời trong quy trình nội bộ

## Tạo cấu hình

Trên trang「Configure fields」của bảng dữ liệu, nhấp「Add field」, chọn「Mật khẩu」để tạo trường mật khẩu.

![20240512175917](https://static-docs.nocobase.com/20240512175917.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Mật khẩu tương ứng với `password`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「Mật khẩu truy cập」「Mã truy cập kết nối」「Mã truy cập tạm thời」. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc, v.v. Sau khi tạo thường không thể chỉnh sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường mật khẩu thường sử dụng `password` hoặc `string`. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, giá trị mặc định có thể được tự động điền. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình độ dài, biểu thức chính quy hoặc bắt buộc nhập. |
| Description | Mô tả trường. Thích hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường mật khẩu như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `password`. |
| Field type mặc định | `password`. |
| Field type có thể chọn | `password`, `string`. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng ô nhập mật khẩu. |
| Lọc | Thông thường không khuyến nghị sử dụng làm điều kiện lọc. |
| Sắp xếp | Thông thường không khuyến nghị sử dụng để sắp xếp. |
| Xác thực | Hỗ trợ xác thực độ dài, biểu thức chính quy, bắt buộc nhập, v.v. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp「Edit」bên phải trường để chỉnh sửa cấu hình trường mật khẩu. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có khớp hay không.

:::

## Xóa trường

Nhấp「Delete」bên phải trường để xóa trường mật khẩu. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường mật khẩu được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, việc nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa liệu trường có còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường mật khẩu phù hợp để nhập văn bản nhạy cảm trong biểu mẫu cấu hình.
![20260709225244](https://static-docs.nocobase.com/20260709225244.png)

| Tình huống | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập mã truy cập bằng ô nhập mật khẩu. |
| Khối chi tiết | Hiển thị dưới dạng che hoặc theo cách bị giới hạn. |
| Quyền | Giới hạn người có thể xem hoặc chỉnh sửa trường mật khẩu. |
| Quy trình làm việc | Thận trọng khi sử dụng làm tham số cho yêu cầu bên ngoài. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](./input.md) — Lưu văn bản ngắn thông thường