---
title: "Ngày giờ (có múi giờ)"
description: "Trường ngày giờ (có múi giờ) dùng để lưu ngày và giờ kèm ngữ nghĩa múi giờ."
keywords: "ngày giờ,datetime,múi giờ,NocoBase"
---

# Ngày giờ (có múi giờ)

## Giới thiệu

Trong NocoBase, **ngày giờ (có múi giờ) (Date time with timezone)** dùng để lưu ngày và giờ, đồng thời xử lý theo ngữ nghĩa múi giờ.

Ngày giờ (có múi giờ) phù hợp với hoạt động cộng tác xuyên múi giờ, nghiệp vụ quốc tế hóa hoặc các tình huống cần xác định rõ một thời điểm, chẳng hạn như tạo lịch hẹn, thời hạn hoặc thời gian thực hiện.

Nếu nghiệp vụ chỉ quan tâm đến văn bản thời gian cục bộ và không cần chuyển đổi múi giờ, có thể chọn [ngày giờ (không có múi giờ)](./datetime-without-tz.md). Nếu chỉ cần ngày, hãy chọn [ngày](./date.md).

## Trường hợp sử dụng

Ngày giờ (có múi giờ) phù hợp với các tình huống nghiệp vụ sau:

- Thời gian bắt đầu cuộc họp, thời gian đặt lịch
- Thời hạn nhiệm vụ, thời gian thực hiện
- Các thời điểm nghiệp vụ xuyên múi giờ
- Thời gian liên quan đến điều kiện lập lịch của workflow

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「ngày giờ (có múi giờ)」 để tạo trường ngày giờ (có múi giờ).

![20240512181142](https://static-docs.nocobase.com/20240512181142.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Ngày giờ (có múi giờ) tương ứng với `datetime`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「thời gian bắt đầu」, 「thời hạn」 hoặc 「thời gian thực hiện」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, workflow và các chức năng khác. Thông thường không thể thay đổi sau khi tạo, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Ngày giờ (có múi giờ) thường sử dụng `date`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình bắt buộc nhập, phạm vi thời gian và các quy tắc khác. |
| Description | Mô tả trường. Thích hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, workflow và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường ngày giờ (có múi giờ) như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `datetime`. |
| Field type mặc định | `date`. |
| Field type có thể chọn | `date`. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng bộ chọn ngày giờ. |
| Lọc | Hỗ trợ lọc theo thời điểm, khoảng thời gian, có giá trị hoặc không có giá trị. |
| Sắp xếp | Hỗ trợ sắp xếp theo thời gian. |
| Xác thực | Hỗ trợ các quy tắc như bắt buộc nhập và phạm vi thời gian. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường ngày giờ (có múi giờ). Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường ngày giờ (có múi giờ). Trong cơ sở dữ liệu chính, cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường ngày giờ (có múi giờ) được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc được ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, workflow, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Cấu hình và sử dụng trên trang

Trường ngày giờ (có múi giờ) phù hợp để sử dụng trong lịch, bảng, bộ lọc và workflow.
![20260709232355](https://static-docs.nocobase.com/20260709232355.png)

| Tình huống | Mục đích |
| --- | --- |
| Khối biểu mẫu | Chọn ngày và giờ. |
| Khối bảng | Hiển thị, sắp xếp và lọc thời gian. |
| Khối lịch | Dùng làm trường thời gian bắt đầu hoặc thời gian kết thúc. |
| Workflow | Dùng làm điều kiện thời gian hoặc trường liên quan đến việc lập lịch. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày giờ (không có múi giờ)](./datetime-without-tz.md) — Lưu ngày giờ mà không chuyển đổi múi giờ
- [Ngày](./date.md) — Chỉ lưu ngày
- [Thời gian](./time.md) — Chỉ lưu thời gian
