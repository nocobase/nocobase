---
pkg: "@nocobase/plugin-data-source-main"
title: "Bảng thông thường"
description: "Bảng thông thường phù hợp để lưu trữ dữ liệu nghiệp vụ thông thường như khách hàng, đơn hàng, hợp đồng, phiếu công việc, dự án và nhiệm vụ; hỗ trợ các trường hệ thống thường dùng, cấu hình khóa chính và xây dựng các khối trên trang."
keywords: "Bảng thông thường,General Collection,trường hệ thống,bảng dữ liệu,NocoBase"
---

# Bảng thông thường

## Giới thiệu

Bảng thông thường là loại bảng dữ liệu được sử dụng phổ biến nhất, phù hợp để lưu trữ dữ liệu nghiệp vụ thông thường như khách hàng, đơn hàng, hợp đồng, phiếu công việc, phiếu hoàn ứng, dự án và nhiệm vụ. Khi phần lớn đối tượng nghiệp vụ không có yêu cầu đặc biệt về cấu trúc, chỉ cần sử dụng bảng thông thường.

Bảng thông thường có thể đến từ các nguồn dữ liệu sau:

- Bảng mới được tạo trong cơ sở dữ liệu chính
- Bảng thực có sẵn được đồng bộ từ cơ sở dữ liệu chính
- Bảng thực có sẵn được kết nối từ cơ sở dữ liệu bên ngoài
- Tài nguyên được ánh xạ từ REST API
- Bảng dữ liệu trong ứng dụng NocoBase bên ngoài

Trong NocoBase, các dữ liệu này đều được sử dụng theo cách của bảng thông thường. Điểm khác biệt là: bảng thông thường trong cơ sở dữ liệu chính có thể được NocoBase tạo và duy trì cấu trúc bảng thực; còn bảng thông thường trong nguồn dữ liệu bên ngoài thường chỉ đọc cấu trúc hiện có, trong khi cấu trúc bảng thực vẫn do hệ thống bên ngoài duy trì.

## Kịch bản áp dụng

Bảng thông thường phù hợp với các kịch bản nghiệp vụ sau:

- Dữ liệu CRM như khách hàng, liên hệ, cơ hội kinh doanh và hợp đồng
- Dữ liệu giao dịch như đơn hàng, phiếu giao hàng, phiếu trả hàng và hóa đơn
- Dữ liệu cộng tác như phiếu công việc, nhiệm vụ, dự án và yêu cầu
- Dữ liệu quy trình như phiếu hoàn ứng, phiếu mua hàng và đề nghị thanh toán
- Dữ liệu cơ bản như thiết bị, tài sản, sản phẩm và cửa hàng



## Tạo và cấu hình

Trong cơ sở dữ liệu chính, nhấp vào「Create collection」, sau đó chọn「General collection」để tạo bảng thông thường.

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như「Khách hàng」「Đơn hàng」「Tệp đính kèm hợp đồng」. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Collection name | Tên định danh của bảng dữ liệu, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow và các chức năng khác. Tên này được tự động tạo và cũng có thể chỉnh sửa thủ công; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Categories | Phân loại bảng dữ liệu. Việc phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. Khi có nhiều bảng dữ liệu, khuyến nghị phân loại theo mô-đun nghiệp vụ, chẳng hạn như「Quản lý khách hàng」「Quản lý dự án」「Tài chính」. |
| Description | Mô tả bảng dữ liệu. Có thể ghi rõ bảng lưu trữ dữ liệu gì, do ai duy trì và liên quan đến những quy trình nghiệp vụ nào để thuận tiện cho việc bảo trì sau này. |
| Use simple pagination mode | Chế độ phân trang đơn giản. Sau khi bật, khi khối bảng phân trang sẽ bỏ qua việc thống kê tổng số bản ghi, phù hợp với các bảng có lượng dữ liệu rất lớn và có thể giảm áp lực truy vấn. |
| Preset fields | Trường đặt trước. Khi tạo bảng, có thể chọn tự động thêm các trường thường dùng như ID, thời gian tạo, người tạo, thời gian cập nhật và người cập nhật. Đối với bảng nghiệp vụ thông thường, khuyến nghị giữ lại các trường này. |

### Các trường tích hợp

Khi tạo bảng thông thường, có thể tự động thêm các trường hệ thống thường dùng thông qua `Preset fields`.

| Trường | Tên trường | Mô tả |
| --- | --- | --- |
| ID | `id` | Trường khóa chính mặc định, dùng để định danh duy nhất một bản ghi. Loại khóa chính mặc định là `Snowflake ID (53-bit)`. |
| Thời gian tạo | `createdAt` | Tự động ghi lại thời gian tạo bản ghi này. Thường được dùng để sắp xếp, lọc, kiểm toán và làm điều kiện cho workflow. |
| Người tạo | `createdBy` | Tự động ghi lại người dùng đã tạo bản ghi này. Thường được dùng cho chức năng “chỉ xem dữ liệu do tôi tạo”, kiểm soát quyền hạn và truy vết trách nhiệm. |
| Thời gian cập nhật | `updatedAt` | Tự động ghi lại thời điểm bản ghi này được cập nhật lần cuối. Thường được dùng để xác định dữ liệu có bị thay đổi hay không. |
| Người cập nhật | `updatedBy` | Tự động ghi lại người dùng đã cập nhật bản ghi này lần cuối. Thường được dùng trong các kịch bản kiểm toán và cộng tác. |
| [Không gian](../../multi-app/multi-space/index.md) | `space` | Có sẵn sau khi bật [plugin đa không gian](../../multi-app/multi-space/index.md), dùng để cô lập dữ liệu theo không gian. Khi chưa bật đa không gian, trường này sẽ không xuất hiện trong các trường đặt trước của bảng thông thường. |

### Trường khóa chính

**Primary key** dùng để xác định trường khóa chính. Trường này được sử dụng để định danh duy nhất một bản ghi ở cấp cơ sở dữ liệu. Khi tạo bảng, khuyến nghị giữ lại trường đặt trước ID; loại khóa chính mặc định là `Snowflake ID (53-bit)`.

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Di chuyển chuột lên Interface của trường ID để chọn loại khóa chính khác.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Các loại khóa chính có thể chọn:

- [Văn bản](../data-modeling/collection-fields/basic/input.md)
- [Số nguyên](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning Lưu ý

Bảng dữ liệu không có khóa chính cần được thiết lập「Record unique key」khi chỉnh sửa bảng dữ liệu, nếu không sẽ không thể tạo khối trên trang cũng như xem hoặc chỉnh sửa bản ghi chính xác.

:::


## Sử dụng trong cấu hình trang

Bảng thông thường có thể được sử dụng cho hầu hết các khối dữ liệu và khối lọc.

| Khối | Công dụng |
| --- | --- |
| [Khối bảng](../../interface-builder/blocks/data-blocks/table.md) | Xem, lọc, sắp xếp và xử lý hàng loạt các bản ghi. |
| [Khối biểu mẫu](../../interface-builder/blocks/data-blocks/form.md) | Thêm mới hoặc chỉnh sửa một bản ghi. |
| [Khối chi tiết](../../interface-builder/blocks/data-blocks/details.md) | Xem chi tiết một bản ghi. |
| [Khối danh sách](../../interface-builder/blocks/data-blocks/list.md) | Hiển thị các bản ghi dưới dạng danh sách. |
| [Khối thẻ dạng lưới](../../interface-builder/blocks/data-blocks/grid-card.md) | Hiển thị các bản ghi như hình ảnh, tệp, sản phẩm và tài sản dưới dạng lưới thẻ. |
| [Khối kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Hiển thị các bản ghi được nhóm theo các trường như trạng thái, giai đoạn và người phụ trách. |
| [Khối lịch](../../interface-builder/blocks/data-blocks/calendar.md) | Hiển thị các bản ghi theo ngày hoặc khoảng thời gian. |
| [Khối biểu đồ](../../interface-builder/blocks/data-blocks/chart.md) | Tạo biểu đồ thống kê dựa trên các bản ghi. |
| [Khối bản đồ](../../interface-builder/blocks/data-blocks/map.md) | Hiển thị các bản ghi theo vị trí địa lý. |
| [Khối biểu đồ Gantt](../../plugins/@nocobase/plugin-gantt/index.md) | Hiển thị kế hoạch dự án và lịch trình nhiệm vụ theo thời gian bắt đầu và kết thúc. |
| [Khối lọc biểu mẫu](../../interface-builder/blocks/filter-blocks/form.md) | Sử dụng điều kiện biểu mẫu để lọc các khối dữ liệu trên trang. |
| [Khối lọc cây](../../interface-builder/blocks/filter-blocks/tree.md) | Sử dụng cấu trúc cây để lọc các khối dữ liệu trên trang, thường dùng cho việc lọc theo cấp bậc như danh mục, tổ chức và khu vực. |

## Chỉnh sửa cấu hình

Trong danh sách bảng dữ liệu, nhấp vào「Edit」ở bên phải bảng thông thường để sửa cấu hình cơ bản của bảng dữ liệu. Việc chỉnh sửa bảng dữ liệu chủ yếu được dùng để điều chỉnh siêu dữ liệu bảng dữ liệu và một số cấu hình vận hành, không dùng để sửa hàng loạt cấu trúc trường.

Nếu muốn thêm trường, thay đổi loại trường, điều chỉnh loại giao diện của trường hoặc xóa trường, cần vào「Configure fields」để xử lý.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Collection display name | Có | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như「Khách hàng」「Đơn hàng」「Tệp đính kèm hợp đồng」. Sau khi sửa, chỉ ảnh hưởng đến hiển thị trên giao diện, không thay đổi tên định danh của bảng dữ liệu. |
| Collection name | Không | Tên định danh của bảng dữ liệu, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow và các chức năng khác. Sau khi tạo, không thể sửa trong biểu mẫu chỉnh sửa bảng. |
| Inherits | Hỗ trợ có điều kiện | Chọn bảng cha cần kế thừa. Chỉ khả dụng khi cơ sở dữ liệu chính là PostgreSQL và cấu hình này được hiển thị trên giao diện. Trước khi điều chỉnh quan hệ kế thừa của bảng dữ liệu hiện có, cần xác nhận cấu trúc trường, các khối trên trang, quyền hạn và workflow có phụ thuộc vào cấu trúc ban đầu hay không. |
| Categories | Có | Phân loại bảng dữ liệu. Việc phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. |
| Description | Có | Mô tả bảng dữ liệu. Phù hợp để bổ sung mục đích sử dụng, người duy trì, nguồn dữ liệu và các quy trình nghiệp vụ liên quan của bảng dữ liệu. |
| Use simple pagination mode | Có | Chế độ phân trang đơn giản. Sau khi bật, khi khối bảng phân trang sẽ bỏ qua việc thống kê tổng số bản ghi, phù hợp với các bảng có lượng dữ liệu rất lớn. |
| Record unique key | Có | Định danh duy nhất của bản ghi. Dùng để xác định một bản ghi trong khối, thường chọn khóa chính hoặc trường duy nhất. Bảng dữ liệu không có khóa chính bắt buộc phải cấu hình mục này, nếu không sẽ không thể tạo khối, xem hoặc chỉnh sửa bản ghi chính xác. |

:::warning Lưu ý

Việc chỉnh sửa bảng dữ liệu không tự động điều chỉnh các trường hiện có. `Preset fields` chỉ có hiệu lực khi tạo bảng; nếu sau khi tạo cần bổ sung các trường như thời gian tạo, người tạo, thời gian cập nhật và người cập nhật, cần thêm riêng trong「Configure fields」.

:::

## Xóa bảng dữ liệu

Trong danh sách bảng dữ liệu, nhấp vào「Delete」ở bên phải bảng thông thường để xóa bảng dữ liệu. Đối với bảng thông thường trong cơ sở dữ liệu chính, còn có thể chọn nhiều bảng rồi xóa cùng lúc.

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

Khi xóa, hệ thống sẽ hiển thị yêu cầu xác nhận lần hai. Sau khi xác nhận, NocoBase sẽ xóa siêu dữ liệu Collection của bảng thông thường này, đồng thời xóa bảng dữ liệu thực và dữ liệu bên trong bảng đó trong cơ sở dữ liệu chính.

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

Trong hộp thoại xác nhận xóa có một tùy chọn: tự động xóa các đối tượng phụ thuộc vào bảng dữ liệu này. Sau khi bật, NocoBase sẽ cố gắng xóa đồng thời các đối tượng cơ sở dữ liệu phụ thuộc vào bảng này, chẳng hạn như các view cơ sở dữ liệu được tạo dựa trên bảng này, cũng như các đối tượng khác tiếp tục phụ thuộc vào những đối tượng đó.

:::danger Cảnh báo

Xóa bảng thông thường là thao tác có rủi ro cao. Sau khi xóa, cấu trúc bảng, dữ liệu bảng, siêu dữ liệu trường, cũng như các khối trên trang, trường quan hệ, quyền hạn, workflow và lệnh gọi API phụ thuộc vào bảng này đều có thể bị lỗi. Trước khi chọn tự động xóa các đối tượng phụ thuộc, hãy xác nhận rằng những đối tượng đó cũng có thể được xóa.

:::
