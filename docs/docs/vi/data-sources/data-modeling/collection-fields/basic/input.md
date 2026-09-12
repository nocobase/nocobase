---
title: "Văn bản một dòng"
description: "Trường văn bản một dòng dùng để lưu tên, mã số, tiêu đề, liên hệ và các nội dung văn bản ngắn khác, mặc định sử dụng kiểu string và giao diện Input."
keywords: "Văn bản một dòng,input,trường văn bản,string,Field interface,NocoBase"
---

# Văn bản một dòng

## Giới thiệu

Trong NocoBase, **văn bản một dòng (Single line text)** là trường văn bản được sử dụng phổ biến nhất. Trường này phù hợp để lưu các nội dung văn bản ngắn trong phạm vi một dòng, chẳng hạn như tên khách hàng, mã đơn hàng, người liên hệ, tóm tắt địa chỉ và mã của hệ thống bên ngoài.

Trường văn bản một dòng mặc định sử dụng `Input` ô nhập liệu, và Field type mặc định là `string`. Trường này có thể được sử dụng làm trường tiêu đề, đồng thời tham gia vào việc lọc, sắp xếp, phân quyền, điều kiện quy trình công việc và truy vấn API.

Nếu nội dung có thể cần xuống dòng hoặc có độ dài lớn, [văn bản nhiều dòng](./textarea.md) sẽ phù hợp hơn. Nếu nội dung có định dạng cố định, chẳng hạn như email, số điện thoại hoặc URL, bạn nên ưu tiên chọn trường chuyên dụng tương ứng.

## Các trường hợp sử dụng

Văn bản một dòng phù hợp với các trường hợp nghiệp vụ sau:

- Tên khách hàng, tên công ty, họ tên người liên hệ
- Mã đơn hàng, mã hợp đồng, mã dự án
- Tiêu đề nhiệm vụ, tiêu đề phiếu yêu cầu, tiêu đề bài viết
- ID hệ thống bên ngoài, mã đồng bộ, mã nghiệp vụ
- Thành phố, tóm tắt địa chỉ, tên cửa hàng và các thông tin văn bản ngắn khác

## Tạo cấu hình

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, rồi chọn「Single line text」để tạo trường văn bản một dòng.

![20240512163555](https://static-docs.nocobase.com/20240512163555.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Văn bản một dòng tương ứng với `input`, trên trang mặc định sử dụng ô nhập liệu để nhập và hiển thị. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「Tên khách hàng」「Mã đơn hàng」「Tiêu đề nhiệm vụ」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, phân quyền, quy trình công việc, v.v. Sau khi tạo thường không nên chỉnh sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Văn bản một dòng mặc định là `string`, cũng có thể chọn `uid`. Đối với văn bản ngắn thông thường, sử dụng `string` là đủ. |
| Automatically remove heading and tailing spaces | Tự động loại bỏ khoảng trắng ở đầu và cuối. Phù hợp với nội dung như tên khách hàng, mã số và tiêu đề, khi không muốn giữ lại khoảng trắng ở đầu và cuối. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền văn bản mặc định. |
| Primary | Đặt trường làm khóa chính. Chỉ khả dụng khi tạo trường mới trong cơ sở dữ liệu chính; không nên dùng văn bản nghiệp vụ thông thường làm khóa chính. |
| Unique | Ràng buộc duy nhất. Phù hợp với văn bản không được trùng lặp, chẳng hạn như mã đơn hàng, mã hợp đồng và ID hệ thống bên ngoài. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn độ dài tối thiểu, độ dài tối đa, độ dài cố định hoặc biểu thức chính quy. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền, quy trình công việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường văn bản một dòng như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `input`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`、`uid`. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng ô nhập liệu `Input`. |
| Trường tiêu đề | Hỗ trợ sử dụng làm trường tiêu đề của bảng dữ liệu. Phù hợp để đặt「Tên khách hàng」「Mã đơn hàng」「Tiêu đề nhiệm vụ」làm trường tiêu đề. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Lọc | Hỗ trợ các bộ lọc dạng văn bản, chẳng hạn như chứa, không chứa, bằng, khác, rỗng và không rỗng. |
| Xác thực | Hỗ trợ xác thực độ dài tối thiểu, độ dài tối đa, độ dài cố định, biểu thức chính quy, v.v. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」bên phải trường để chỉnh sửa cấu hình trường văn bản một dòng. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc tùy chọn tự động loại bỏ khoảng trắng ở đầu và cuối.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase. Ví dụ, các cột văn bản ngắn như `varchar`、`char` trong cơ sở dữ liệu có thể được ánh xạ thành trường văn bản một dòng.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Automatically remove heading and tailing spaces | Có | Kiểm soát việc có loại bỏ khoảng trắng ở đầu và cuối khi lưu hay không. |
| Default value | Có | Điều chỉnh văn bản mặc định khi thêm bản ghi mới. |
| Unique | Hỗ trợ có điều kiện | Có thể cấu hình khi tạo trường mới trong cơ sở dữ liệu chính. Nếu dữ liệu hiện có đã chứa các giá trị trùng lặp, việc thêm ràng buộc duy nhất có thể thất bại. |
| Validation rules | Có | Điều chỉnh xác thực về độ dài, định dạng hoặc biểu thức chính quy. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」bên phải trường để xóa trường văn bản một dòng. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường văn bản một dòng được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình công việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường văn bản một dòng có thể được sử dụng trong hầu hết các tình huống liên quan đến khối dữ liệu và biểu mẫu.

| Tình huống | Mục đích |
| --- | --- |
| Khối biểu mẫu | Nhập hoặc chỉnh sửa nội dung văn bản ngắn, chẳng hạn như tên khách hàng, mã đơn hàng và tiêu đề nhiệm vụ. |
| Khối bảng | Hiển thị, sắp xếp và lọc nội dung văn bản ngắn. Khi nội dung dài, bảng sẽ rút gọn hiển thị theo cấu hình giao diện. |
| Khối chi tiết | Hiển thị thông tin văn bản trong một bản ghi. |
| Khối lọc | Dùng làm điều kiện truy vấn để lọc bản ghi, chẳng hạn như lọc theo tên khách hàng, mã số hoặc tiêu đề. |
| Hiển thị trường quan hệ | Khi trường văn bản một dòng được đặt làm trường tiêu đề, đoạn văn bản này sẽ được ưu tiên hiển thị khi trường quan hệ chọn bản ghi. |
| Quy trình công việc và phân quyền | Dùng làm trường điều kiện để tham gia đánh giá, chẳng hạn như mã đơn hàng có rỗng hay không, tên khách hàng có chứa một từ khóa hay không. |

### Chế độ có thể chỉnh sửa

Ở chế độ có thể chỉnh sửa, trường văn bản một dòng sử dụng ô nhập liệu để nhập nội dung.

![20240512164001](https://static-docs.nocobase.com/20240512164001.png)

### Chế độ đọc

Ở chế độ đọc, trường văn bản một dòng được hiển thị dưới dạng văn bản thông thường.

![20240512164138](https://static-docs.nocobase.com/20240512164138.png)