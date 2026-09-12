---
title: "Trường"
description: "Tìm hiểu vai trò của trường trong NocoBase, cách tạo và quản lý trường, các trường hợp sử dụng của từng loại trường, cách tạo trường từ trang, cũng như logic ánh xạ trường của nguồn dữ liệu chính và nguồn dữ liệu bên ngoài."
keywords: "trường,Loại trường,Interface trường,ánh xạ trường,trường tiêu đề,ràng buộc duy nhất,trường quan hệ,NocoBase"
---

# Trường

## Giới thiệu

Trong NocoBase, **Field (trường)** là một thuộc tính nghiệp vụ dùng để mô tả dữ liệu trong [Collection (bảng dữ liệu)](../collection.md), nhằm mô tả một bản ghi có thể lưu trữ những thông tin nào, cũng như cách nhập, hiển thị, lọc và tham gia vào logic nghiệp vụ của các thông tin đó trên trang.

| Định nghĩa | Mô tả |
| --- | --- |
| Lưu trữ dữ liệu gì | Ví dụ: văn bản, số, ngày tháng, tệp, trạng thái, quan hệ, JSON. |
| Sử dụng trên trang như thế nào | Ví dụ: sử dụng ô nhập liệu, bộ chọn ngày, menu thả xuống, trình tải tệp đính kèm và bộ chọn quan hệ để nhập và hiển thị dữ liệu. |
| Tham gia vào các khả năng nghiệp vụ như thế nào | Trường được các khối trên trang, bộ lọc, sắp xếp, quyền, workflow, API, các chức năng nhập xuất dữ liệu và những chức năng khác sử dụng. |

Trường có thể tương ứng với:
- cột cơ sở dữ liệu thực trong cơ sở dữ liệu chính
- cột cơ sở dữ liệu có sẵn trong cơ sở dữ liệu bên ngoài
- trường trong chế độ xem cơ sở dữ liệu
- trường trong kết quả truy vấn SQL
- trường trong phản hồi REST API
- trường quan hệ, trường hệ thống hoặc trường ảo trong bảng dữ liệu

Có thể hiểu đây là “một thuộc tính của đối tượng nghiệp vụ”. Ví dụ:

| Đối tượng nghiệp vụ | Field tương ứng |
| --- | --- |
| Khách hàng | Tên khách hàng, số điện thoại, cấp độ khách hàng, người phụ trách |
| Đơn hàng | Mã đơn hàng, số tiền đơn hàng, trạng thái đơn hàng, khách hàng |
| Hợp đồng | Tên hợp đồng, ngày ký, tệp đính kèm hợp đồng, trạng thái phê duyệt |
| Nhiệm vụ | Tiêu đề nhiệm vụ, thời hạn, mức độ ưu tiên, người thực hiện |
| Tệp | Tên tệp, kích thước, loại MIME, URL |

## Các trường hợp sử dụng

Dưới đây là các trường hợp sử dụng phổ biến được sắp xếp theo phân loại trường. Phần này trước hết giúp bạn xác định nên chọn loại trường nào; để xem cấu hình cụ thể, ánh xạ kiểu dữ liệu và các lưu ý, hãy tiếp tục xem tài liệu của từng phân loại tương ứng.

| Phân loại trường | Trường hợp sử dụng |
| --- | --- |
| [Trường văn bản](./basic/input.md) | Phù hợp để lưu trữ tên, mã, mô tả, thông tin liên hệ, địa chỉ liên kết và các nội dung khác. |
| [Trường văn bản có định dạng](./media/rich-text.md) | Phù hợp để lưu trữ nội dung chính, tài liệu mô tả, phương án xử lý, đoạn mã và các nội dung phức tạp khác. |
| [Trường số](./basic/number.md) | Phù hợp để lưu trữ số lượng, số tiền, điểm số, tỷ lệ và các giá trị số khác. |
| [Trường ngày và giờ](./datetime/index.md) | Phù hợp để lưu trữ thời điểm, ngày, giờ, dấu thời gian của hệ thống bên ngoài và các nội dung khác. |
| [Trường trạng thái và tùy chọn](./choices/select.md) | Phù hợp để lưu trữ các giá trị trong một phạm vi cố định, chẳng hạn như có kích hoạt hay không, trạng thái đơn hàng, cấp độ khách hàng và nhãn khách hàng. |
| [Trường tệp đính kèm](./media/field-attachment.md) | Phù hợp để tải tệp lên hoặc lưu địa chỉ tệp bên ngoài. |
| [Trường quan hệ](./associations/index.md) | Phù hợp để biểu đạt mối liên kết giữa các bảng dữ liệu khác nhau, chẳng hạn như đơn hàng thuộc về khách hàng, khách hàng sở hữu các đơn hàng và người dùng liên kết với vai trò. |
| [Trường định danh và mã hóa](./advanced/uuid.md) | Phù hợp để lưu trữ khóa chính nội bộ, ID đồng bộ hóa bên ngoài, định danh truy cập công khai và mã nghiệp vụ. |
| [Trường hình học](./geometric/point.md) | Phù hợp để lưu trữ thông tin không gian hoặc địa lý, chẳng hạn như vị trí cửa hàng, tuyến đường giao hàng và phạm vi dịch vụ. |
| [Trường hệ thống](./system-info/created-at.md) | Phù hợp để lưu trữ thông tin hệ thống do NocoBase hoặc cơ sở dữ liệu duy trì, chẳng hạn như ID, thời gian tạo, người tạo và thời gian cập nhật. |
| [Các trường khác](./advanced/json.md) | Phù hợp để xử lý các nhu cầu về trường không thuộc trực tiếp vào các phân loại khác, chẳng hạn như sắp xếp, công thức và JSON. |

## Loại Interface của trường

NocoBase phân loại các trường theo góc nhìn Interface như sau:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Kiểu dữ liệu của trường

Mỗi Field Interface đều có một kiểu dữ liệu mặc định. Ví dụ, đối với trường có Interface là số (Number), kiểu dữ liệu mặc định là double, nhưng cũng có thể là float, decimal và các kiểu khác. Hiện tại, các kiểu dữ liệu được hỗ trợ gồm:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Ánh xạ loại trường

Quy trình thêm trường mới vào cơ sở dữ liệu chính:

1. Chọn loại Interface
2. Cấu hình kiểu dữ liệu có thể chọn cho Interface hiện tại

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Quy trình ánh xạ trường của nguồn dữ liệu bên ngoài:

1. Tự động ánh xạ kiểu dữ liệu tương ứng (Field type) và kiểu UI (Field Interface) dựa trên kiểu trường của cơ sở dữ liệu bên ngoài.
2. Thay đổi theo nhu cầu thành kiểu dữ liệu và loại Interface phù hợp hơn

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)