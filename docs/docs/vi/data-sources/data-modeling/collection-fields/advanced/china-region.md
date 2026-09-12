---
title: "Khu vực hành chính Trung Quốc"
description: "Trường khu vực hành chính Trung Quốc dùng để lưu thông tin về các đơn vị hành chính như tỉnh, thành phố, quận/huyện, hỗ trợ lựa chọn liên kết ba cấp và hiển thị theo cấp."
keywords: "Khu vực hành chính Trung Quốc,tỉnh thành quận huyện,trường đơn vị hành chính,liên kết ba cấp,NocoBase"
---

# Khu vực hành chính Trung Quốc

<PluginInfo name="field-china-region"></PluginInfo>

## Giới thiệu

Trong NocoBase, **khu vực hành chính Trung Quốc (China region)** dùng để lưu thông tin về các đơn vị hành chính của Trung Quốc như tỉnh, thành phố, quận/huyện.

Trường khu vực hành chính Trung Quốc dựa trên bảng dữ liệu đơn vị hành chính tích hợp sẵn `chinaRegions`, và sử dụng bộ chọn liên kết để nhập dữ liệu trên trang. Người dùng có thể lần lượt chọn tỉnh, thành phố và quận/huyện theo từng cấp; khi hiển thị, các cấp sẽ được nối lại thành một đường dẫn hoàn chỉnh.

Nếu cần lưu địa chỉ chi tiết như đường phố, số nhà, có thể kết hợp sử dụng với trường [văn bản một dòng](../basic/input.md) hoặc [văn bản nhiều dòng](../basic/textarea.md).

## Các trường hợp sử dụng

Khu vực hành chính Trung Quốc phù hợp với các trường hợp nghiệp vụ sau:

- Địa điểm của khách hàng, người liên hệ, cửa hàng và dự án
- Thông tin địa chỉ cơ bản như nơi đăng ký hộ khẩu, quê quán và khu vực nhận hàng
- Khu vực dịch vụ, khu vực bán hàng và khu vực triển khai dự án
- Dữ liệu cần lọc hoặc thống kê theo tỉnh, thành phố và quận/huyện

## Tạo cấu hình

Trên trang «Configure fields» của bảng dữ liệu, nhấp vào «Add field» rồi chọn «Khu vực hành chính Trung Quốc» để tạo trường khu vực hành chính Trung Quốc.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Khu vực hành chính Trung Quốc tương ứng với `chinaRegion`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như «Khu vực hiện tại», «Khu vực dịch vụ», «Khu vực nhận hàng». Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Khu vực hành chính Trung Quốc thường được lưu dưới dạng bản ghi quan hệ hoặc giá trị có cấu trúc, tùy thuộc vào cấu hình trường. |
| Cấp độ lựa chọn | Kiểm soát cấp sâu nhất có thể lựa chọn. Hiện hỗ trợ «Tỉnh», «Thành phố» và «Quận», mặc định là «Quận». |
| Bắt buộc chọn đến cấp cuối cùng | Khi bật, người dùng phải chọn đến cấp sâu nhất đã cấu hình mới có thể gửi; khi tắt, có thể hoàn tất lựa chọn ở cấp trung gian. |
| Validation rules | Quy tắc xác thực. Thường dùng để cấu hình bắt buộc nhập và cấp độ lựa chọn. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường khu vực hành chính Trung Quốc như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `chinaRegion`. |
| Nguồn dữ liệu | Bảng dữ liệu đơn vị hành chính tích hợp sẵn `chinaRegions`. |
| Thành phần trên trang | Sử dụng bộ chọn liên kết trong chế độ chỉnh sửa. |
| Cấp độ lựa chọn | Hiện hỗ trợ ba cấp: tỉnh, thành phố và quận. |
| Cách hiển thị | Trong chế độ đọc, hiển thị theo cấp dưới dạng `省 / 市 / 区`. |
| Lọc | Hỗ trợ lọc theo giá trị khu vực đã lưu; khả năng cụ thể phụ thuộc vào cấu hình trường và khối trang. |
| Chọn nhiều | Không hỗ trợ chọn nhiều. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào «Edit» ở bên phải trường để chỉnh sửa cấu hình trường khu vực hành chính Trung Quốc. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường hiển thị và được sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, quy tắc xác thực, cấp độ lựa chọn hoặc việc có bắt buộc chọn đến cấp cuối cùng hay không.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng với kiểu mới hay không. |
| Cấp độ lựa chọn | Có | Điều chỉnh cấp có thể chọn của trường: tỉnh, thành phố hoặc quận. |
| Bắt buộc chọn đến cấp cuối cùng | Có | Kiểm soát việc có bắt buộc chọn đến cấp sâu nhất đã cấu hình khi gửi hay không. |
| Validation rules | Có | Điều chỉnh các quy tắc xác thực như bắt buộc nhập. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Trường khu vực hành chính Trung Quốc phụ thuộc vào bảng dữ liệu `chinaRegions` do plugin cung cấp. Trước khi sử dụng, hãy đảm bảo plugin trường «Đơn vị hành chính Trung Quốc» đã được bật.

:::

## Xóa trường

Nhấp vào «Delete» ở bên phải trường để xóa trường khu vực hành chính Trung Quốc. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường khu vực hành chính Trung Quốc được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường khu vực hành chính Trung Quốc phù hợp với các trường hợp về địa chỉ, khu vực và thống kê.

| Trường hợp | Mục đích |
| --- | --- |
| Khối biểu mẫu | Sử dụng bộ chọn liên kết để chọn tỉnh, thành phố và quận/huyện. |
| Khối chi tiết | Hiển thị đường dẫn đơn vị hành chính. |
| Khối bảng | Hiển thị khu vực thuộc về bản ghi. |
| Khối lọc | Lọc bản ghi theo khu vực. |
| Khối biểu đồ | Thống kê dữ liệu nghiệp vụ theo tỉnh, thành phố và quận. |

### Chế độ có thể chỉnh sửa

Trong chế độ có thể chỉnh sửa, trường khu vực hành chính Trung Quốc hiển thị dưới dạng bộ chọn liên kết.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Chế độ đọc

Trong chế độ đọc, trường khu vực hành chính Trung Quốc sẽ hiển thị dưới dạng đường dẫn văn bản, ví dụ:

```text
北京市 / 市辖区 / 东城区
```

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](../basic/input.md) — Lưu địa chỉ chi tiết
- [Văn bản nhiều dòng](../basic/textarea.md) — Lưu mô tả địa chỉ dài hơn
