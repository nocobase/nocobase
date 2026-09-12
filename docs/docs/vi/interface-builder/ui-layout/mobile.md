---
title: "Bố cục mobile"
description: "Điều hướng, xây dựng Trang, xem trước trên máy tính, tương tác Trang con, route và quyền trong bố cục mobile NocoBase."
keywords: "bố cục mobile,Trang mobile,điều hướng dưới cùng,xem trước mobile,route mobile,UI Editor,NocoBase"
---

# Bố cục mobile

Trong NocoBase, **bố cục mobile** dùng để xây dựng điều hướng và Trang độc lập cho thiết bị mobile. Bố cục này được truy cập qua `/mobile` theo mặc định, dùng thanh Tab dưới cùng làm điều hướng cấp một và phù hợp hơn để nhập, tra cứu dữ liệu, xử lý phê duyệt và xử lý nhiệm vụ trên điện thoại.

Bố cục mobile và bố cục desktop sử dụng chung nguồn dữ liệu và dữ liệu nghiệp vụ, nhưng menu, route và nội dung Trang được cấu hình riêng. Nhờ vậy, bạn có thể sắp xếp lại Trang theo cách sử dụng trên mobile mà không bị giới hạn bởi cấu trúc Trang desktop.

<!-- Cần ảnh chụp toàn bộ Trang trong bố cục mobile trên thiết bị thật -->

## Mở và xem trước bố cục mobile

Theo mặc định, bạn có thể nhấp vào «Mobile» trong Trung tâm cài đặt hoặc truy cập trực tiếp `/mobile`.

Nên xây dựng Trang trong trình duyệt máy tính. Trên máy tính sẽ hiển thị khu vực xem trước mobile và thanh công cụ phía trên, trong đó:

- «UI Editor» dùng để bật hoặc tắt chế độ xây dựng giao diện.
- «Xem trước trên tablet» dùng để kiểm tra cách hiển thị trên thiết bị mobile rộng hơn.
- «Xem trước mobile» dùng để đưa khu vực xem trước về kích thước điện thoại.
- «Mã QR» dùng để mở địa chỉ mobile hiện tại trên điện thoại.

![20260715221712](https://static-docs.nocobase.com/20260715221712.png)

Sau khi hoàn tất xây dựng trên máy tính, hãy dùng mã QR để kiểm tra trên thiết bị thật. Cần kiểm tra kỹ điều hướng, cuộn, nhập Form, Trang popup và vùng an toàn của màn hình.

## Xây dựng điều hướng mobile

Bố cục mobile dùng thanh Tab dưới cùng làm điều hướng cấp một. Hiện tại, điều hướng cấp một chủ yếu hỗ trợ Trang và Link.

### Thêm Trang

1. Bật «UI Editor».
2. Nhấp vào nút thêm ở bên phải thanh Tab dưới cùng.
3. Chọn «Page».
4. Điền tiêu đề Trang và chọn icon.
5. Sau khi gửi, mở Trang mới và tiếp tục thêm nội dung.

![20260715221823_rec_](https://static-docs.nocobase.com/20260715221823_rec_.gif)

### Thêm Link

Nếu cần chuyển đến địa chỉ nội bộ hoặc bên ngoài, hãy chọn «Link», sau đó cấu hình tiêu đề, icon và URL.

Link có thể mở trong cửa sổ hiện tại hoặc cửa sổ mới, tùy theo cấu hình của Link.

![20260715221950](https://static-docs.nocobase.com/20260715221950.png)

### Điều chỉnh điều hướng

Trong chế độ xây dựng giao diện, bạn có thể kéo các Tab dưới cùng để thay đổi thứ tự. Mỗi Tab cũng có thể được sửa tiêu đề và icon, cấu hình quy tắc liên kết, sao chép UID hoặc xóa.

Nếu cần xem, hiển thị, ẩn hoặc xóa tập trung các route mobile, hãy mở «Trung tâm cài đặt / Route / Route mobile».

![20260715222113_rec_](https://static-docs.nocobase.com/20260715222113_rec_.gif)

## Xây dựng Trang mobile

Trước tiên hãy tạo và mở một Trang mobile, sau đó thêm Block vào Trang. Cách tổ chức nội dung Trang về cơ bản giống với desktop: dùng [Block](../blocks/index.md), [Field](../fields/index.md) và [Action](../actions/index.md) để tổ chức nội dung nghiệp vụ. Tuy nhiên, điều hướng mobile và tương tác của một số thành phần sẽ được điều chỉnh cho màn hình nhỏ.

### Thêm nội dung Trang

1. Mở Trang mobile cần xây dựng.
2. Xác nhận «UI Editor» đã được bật.
3. Nhấp vào «Thêm Block» trong Trang.
4. Chọn Table, Form, Chi tiết, Bộ lọc hoặc Block khác.
5. Tiếp tục cấu hình Field, Action và cài đặt Block.

![20260715222230_rec_](https://static-docs.nocobase.com/20260715222230_rec_.gif)

### Sử dụng Tab Trang

Một Trang mobile cũng có thể bật Tab. Các nội dung nằm trong cùng một lối vào điều hướng nhưng tương đối độc lập có thể được đặt trong các Tab khác nhau.

1. Mở cài đặt Trang và bật «Bật Tab». Bạn cũng có thể sửa Trang trong «Trung tâm cài đặt / Route / Route mobile» rồi chọn «Bật Tab Trang».
2. Bật «UI Editor».
3. Nhấp vào «Thêm Tab» ở bên phải thanh Tab Trang.
4. Thêm Tab, sau đó cấu hình tên và nội dung Trang.

Nếu Trang mobile có ít nội dung, chỉ cần dùng một Trang và không cần bật thêm Tab.

![20260715222354_rec_](https://static-docs.nocobase.com/20260715222354_rec_.gif)

### Tương tác mobile của các thành phần thường dùng

Các thành phần thường dùng trong Trang sẽ điều chỉnh cách sắp xếp và tương tác theo bố cục mobile. Chẳng hạn, nội dung nhiều cột tự động chuyển thành một cột thuận tiện hơn khi xem theo chiều dọc, Field lựa chọn và ngày giờ dùng bộ chọn mobile, còn Bộ lọc, bản ghi liên kết và Trang con dùng giao diện phù hợp hơn với thao tác chạm.

Table trong bố cục mobile vẫn giữ dạng Table và có thể cuộn ngang để xem các cột vượt khỏi màn hình. Hành vi bổ sung của các Block khác trên mobile phụ thuộc vào khả năng hỗ trợ của từng Block.

## Trang và Trang con

Nội dung được mở từ các Action như xem, sửa và chọn bản ghi liên kết sẽ hiển thị dưới dạng Trang con mobile. Trang con có nút quay lại để trở về Trang trước đó.

Khi mở Trang con sâu hơn, thanh Tab dưới cùng sẽ ẩn để dành thêm không gian cho nội dung hiện tại. Sau khi đóng Trang con hoặc quay lại cấp trước, thanh Tab dưới cùng sẽ xuất hiện lại.

Khi chuyển giữa các Tab dưới cùng, trạng thái của Trang đã mở được giữ lại, giúp bạn chuyển đổi giữa nhiều tác vụ mobile.

![20260715222828_rec_](https://static-docs.nocobase.com/20260715222828_rec_.gif)

## Quản lý route và quyền

Route mobile có thể được quản lý tập trung trong [Trình quản lý route](../../routes/index.md). Mở «Trung tâm cài đặt / Route / Route mobile» để thêm, sửa, xóa, hiển thị hoặc ẩn Trang và Link, đồng thời cấu hình Tab Trang.

Quyền truy cập route mobile được cấu hình riêng với route desktop. Trong quyền của role, mở «Route mobile» và chọn các Trang mà role hiện tại có thể truy cập. Xem hướng dẫn chi tiết trong [Cấu hình quyền](../../users-permissions/acl/permissions.md).

![20260715223016_rec_](https://static-docs.nocobase.com/20260715223016_rec_.gif)

![20260715223106_rec_](https://static-docs.nocobase.com/20260715223106_rec_.gif)

## Mối quan hệ với bố cục desktop

Bố cục desktop và bố cục mobile có thể dựa trên cùng một bảng dữ liệu để xây dựng các Trang riêng. Chẳng hạn, desktop có thể dùng Table với nhiều Field để xử lý dữ liệu, còn mobile dùng Danh sách hoặc Form đơn giản hơn để nhập dữ liệu tại hiện trường.

Trang của hai bố cục không tự động đồng bộ. Khi sửa Trang, menu hoặc route desktop, cấu hình mobile không thay đổi theo; thay đổi trên mobile cũng không ảnh hưởng đến desktop.

:::tip Đề xuất sử dụng

Nếu thiết bị mobile chỉ cần thỉnh thoảng xem Trang desktop, trước tiên hãy dùng khả năng responsive màn hình hẹp của [bố cục desktop](./desktop.md). Chỉ cần xây dựng riêng bố cục mobile khi cần điều hướng và quy trình Trang độc lập cho thiết bị mobile.

:::

## Liên kết liên quan

- [Tổng quan về bố cục UI](./index.md) — Tìm hiểu trường hợp sử dụng bố cục desktop và bố cục mobile
- [Bố cục desktop](./desktop.md) — Sử dụng bố cục desktop mặc định và responsive màn hình hẹp
- [Block](../blocks/index.md) — Thêm nội dung nghiệp vụ vào Trang mobile
- [Field](../fields/index.md) — Cấu hình Form mobile và Field hiển thị dữ liệu
- [Action](../actions/index.md) — Cấu hình Action trên Trang mobile
- [Trình quản lý route](../../routes/index.md) — Quản lý Trang, Link và Tab mobile
- [Cấu hình quyền](../../users-permissions/acl/permissions.md) — Kiểm soát route mobile mà role có thể truy cập
