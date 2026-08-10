---
title: "Không gian"
description: "Trường không gian được sử dụng để xác định không gian mà bản ghi thuộc về sau khi bật khả năng đa không gian."
keywords: "Không gian,space,đa không gian,trường hệ thống,NocoBase"
---

# Không gian

## Giới thiệu

Trong NocoBase, **không gian (Space)** được sử dụng để ghi nhận không gian mà dữ liệu thuộc về.

Trường không gian thường xuất hiện sau khi bật plugin đa không gian, dùng để cô lập dữ liệu theo không gian. Trường này không phù hợp để tùy ý chỉnh sửa như một trường nghiệp vụ thông thường.

Nếu chỉ là chiều phân loại theo phòng ban, khu vực hoặc dự án trong nghiệp vụ, bạn nên tạo trường quan hệ thông thường hoặc trường tùy chọn.

## Trường hợp sử dụng

Không gian phù hợp với các trường hợp nghiệp vụ sau:

- Cô lập dữ liệu đa không gian
- Lọc dữ liệu theo không gian
- Kiểm soát quyền ở cấp không gian
- Phân bổ dữ liệu nghiệp vụ dạng đa thuê bao

## Cấu hình tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Không gian」 để tạo trường không gian.

![index-2025-11-01-00-50-45](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Không gian tương ứng với `space`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Không gian」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc và các chức năng khác. Sau khi tạo thường không chỉnh sửa nữa; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường không gian thường là trường quan hệ trỏ đến bảng không gian. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Thường được hệ thống hoặc ngữ cảnh không gian duy trì. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình do thay đổi về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường không gian như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Mặc định Field interface | `space`. |
| Mặc định Field type | `belongsTo`. |
| Field type có thể chọn | `belongsTo`. |
| Thành phần trang | Được hệ thống hoặc khả năng đa không gian duy trì; trang thường chỉ đọc hoặc sử dụng theo ngữ cảnh không gian. |
| Lọc | Hỗ trợ lọc theo không gian, tùy thuộc vào cấu hình đa không gian. |
| Sắp xếp | Thường không dùng để sắp xếp. |
| Kiểm tra | Được khả năng đa không gian duy trì. |

## Cấu hình chỉnh sửa

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường không gian. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản tương đương với việc thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có phù hợp hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường không gian. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường không gian được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường không gian phù hợp để sử dụng trong các tình huống cô lập dữ liệu đa không gian và phân quyền.

| Tình huống | Công dụng |
| --- | --- |
| Khối bảng | Hiển thị không gian mà bản ghi thuộc về. |
| Khối lọc | Lọc bản ghi theo không gian. |
| Quyền | Cô lập quyền truy cập dữ liệu theo không gian. |
| Quy trình làm việc | Đọc không gian mà bản ghi thuộc về làm ngữ cảnh. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Đa không gian](../../../../multi-app/multi-space/index.md) — Tìm hiểu về khả năng đa không gian
- [Trường quan hệ](../associations/index.md) — Tạo trường quan hệ thông thường
