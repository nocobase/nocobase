---
title: "Bố cục desktop"
description: "Điều hướng, xây dựng Trang, quản lý route và cách bố cục desktop NocoBase responsive trên màn hình hẹp."
keywords: "bố cục desktop,bố cục UI,responsive màn hình hẹp,xây dựng Trang,quản lý route,UI Editor,NocoBase"
---

# Bố cục desktop

Trong NocoBase, **bố cục desktop** là giao diện ứng dụng mặc định. Bố cục này phù hợp để quản lý dữ liệu, nhập dữ liệu bằng Form, cấu hình nghiệp vụ và thực hiện công việc hằng ngày trên máy tính. Bố cục này cũng có thể được sử dụng trên thiết bị mobile.

Bố cục desktop được truy cập qua `/admin` theo mặc định. Nếu ứng dụng có tiền tố truy cập riêng, địa chỉ thực tế sẽ tự động bao gồm tiền tố tương ứng.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

## Xây dựng Trang

### Bước 1: Mở bố cục desktop

Truy cập `/admin` để mở bố cục desktop. Thông thường, ứng dụng cũng sẽ chuyển thẳng tới đây sau khi đăng nhập thành công.

![20260715225049](https://static-docs.nocobase.com/20260715225049.png)

### Bước 2: Bật UI Editor

Nhấp vào «UI Editor» ở góc trên bên phải Trang để vào chế độ xây dựng giao diện. Sau khi bật, các lối vào cấu hình tương ứng sẽ xuất hiện gần menu, Trang, Block, Field và Action.

![20260715225155_rec_](https://static-docs.nocobase.com/20260715225155_rec_.gif)

### Bước 3: Tạo menu và Trang

Bạn có thể thêm Group, Trang hoặc Link trong khu vực điều hướng, đồng thời bật Tab cho một Trang. Sau khi tạo Trang, hãy mở Trang đó và thêm các Block cần thiết.

Cách xây dựng nội dung giống với các giao diện khác: trước tiên thêm [Block](../blocks/index.md), sau đó cấu hình [Field](../fields/index.md) và [Action](../actions/index.md) theo nhu cầu nghiệp vụ.

![20260715225316_rec_](https://static-docs.nocobase.com/20260715225316_rec_.gif)

### Bước 4: Cấu hình nội dung Trang

Thêm các Block như Table, Form, Chi tiết và Bộ lọc, sau đó điều chỉnh cách sắp xếp Field, Action và Block. Mọi thay đổi sẽ được phản ánh trực tiếp trên Trang hiện tại.

![20260715225424_rec_](https://static-docs.nocobase.com/20260715225424_rec_.gif)

## Quản lý route và menu

Sau khi thêm Trang hoặc Link trong khu vực điều hướng, nội dung tương ứng cũng xuất hiện trong [Trình quản lý route](../../routes/index.md). Khi điều chỉnh route trong trình quản lý, menu cũng được cập nhật đồng bộ.

Bố cục desktop hỗ trợ các loại route phổ biến sau:

- **Group** — Tổ chức nhiều Trang và Link trong cùng một nhóm điều hướng.
- **Page** — Mở một Trang có thể tiếp tục thêm Block.
- **Link** — Mở địa chỉ nội bộ hoặc bên ngoài.
- **Tab** — Tổ chức nhiều phần nội dung trong cùng một Trang.

Bạn có thể thêm, sửa, xóa, hiển thị hoặc ẩn route trong Trình quản lý route. Khi cần sắp xếp tập trung cấu trúc menu, sử dụng Trình quản lý route sẽ thuận tiện hơn.

![20260715225711_rec_](https://static-docs.nocobase.com/20260715225711_rec_.gif)

## Responsive trên màn hình hẹp

Bố cục desktop có thể được dùng trực tiếp trên điện thoại hoặc trong cửa sổ trình duyệt hẹp. Khi chuyển sang trạng thái màn hình hẹp, bố cục vẫn sử dụng route và Trang desktop ban đầu, không tự động chuyển thành bố cục mobile.

### Thay đổi của bố cục

Menu điều hướng sẽ chuyển sang trạng thái thu gọn, còn các Action phía trên được gom vào lối vào gọn hơn. Lề Trang và khoảng cách giữa các Block cũng được thu nhỏ, trong khi khu vực nội dung điều chỉnh theo chiều cao hiển thị của trình duyệt mobile.

UI Editor không khả dụng trên màn hình hẹp. Khi cần chỉnh sửa menu hoặc Trang, bạn cần thực hiện trong trình duyệt máy tính.

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

### Điều chỉnh nội dung Trang

Các thành phần thường dùng trong Trang cũng sẽ điều chỉnh cách tương tác trên màn hình hẹp để dễ sử dụng hơn trên điện thoại. Chẳng hạn, nội dung nhiều cột chuyển thành một cột, Table có thể cuộn ngang để xem các cột vượt khỏi màn hình, còn phân trang và lối vào Action trở nên gọn hơn. Các thao tác chọn dữ liệu, ngày giờ, lọc và Trang con cũng dùng cách tương tác phù hợp hơn với điện thoại.

:::tip Responsive desktop và bố cục mobile

Nếu chỉ thỉnh thoảng truy cập bằng điện thoại, responsive màn hình hẹp của bố cục desktop là đủ. Nếu cần điều hướng dưới cùng, Trang và quy trình riêng cho mobile, bạn có thể xây dựng thêm [bố cục mobile](./mobile.md).

:::

## Đề xuất sử dụng

- Với nghiệp vụ chủ yếu được thực hiện trên máy tính, mặc định hãy dùng bố cục desktop.
- Hoàn tất xây dựng Trang trên màn hình rộng trước, sau đó thu nhỏ cửa sổ để kiểm tra hiệu ứng trên màn hình hẹp.
- Nếu Trang có nhiều cột Table hoặc Action theo chiều ngang, chỉ giữ lại nội dung cần thiết để giảm thao tác trên màn hình nhỏ.
- Nếu quy trình desktop và mobile khác nhau nhiều, việc xây dựng hai bộ Trang riêng sẽ rõ ràng hơn.

## Liên kết liên quan

- [Tổng quan về bố cục UI](./index.md) — Tìm hiểu trường hợp sử dụng bố cục desktop và bố cục mobile
- [Bố cục mobile](./mobile.md) — Xây dựng điều hướng và Trang riêng cho mobile
- [Block](../blocks/index.md) — Thêm và cấu hình Block trên Trang
- [Field](../fields/index.md) — Cấu hình Field trong Table, Form và Chi tiết
- [Action](../actions/index.md) — Cấu hình Action trên Trang và trong Block
- [Trình quản lý route](../../routes/index.md) — Quản lý tập trung menu và route desktop
- [Cấu hình quyền](../../users-permissions/acl/permissions.md) — Kiểm soát route desktop mà role có thể truy cập
