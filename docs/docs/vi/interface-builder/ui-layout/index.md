---
title: "Bố cục UI"
description: "Tổng quan về bố cục UI NocoBase, gồm đặc điểm, trường hợp sử dụng và mối quan hệ cấu hình giữa bố cục desktop và bố cục mobile."
keywords: "bố cục UI,bố cục desktop,bố cục mobile,bố cục responsive,trang mobile,NocoBase"
---

# Bố cục UI

NocoBase cung cấp bố cục desktop và bố cục mobile. Cả hai đều có thể sử dụng tính năng xây dựng giao diện để tạo Trang, sau đó cấu hình Block, Field và Action trên Trang.

Bố cục desktop là lựa chọn mặc định, phù hợp để quản lý và xử lý dữ liệu hằng ngày trên máy tính. Nếu cần điều hướng và Trang riêng cho thiết bị mobile, bạn có thể xây dựng thêm bố cục mobile.

<!-- Cần ảnh chụp tổng thể để so sánh bố cục desktop và bố cục mobile -->

## Bố cục desktop

[Bố cục desktop](./desktop.md) được truy cập qua `/admin` theo mặc định. Bố cục này gồm điều hướng phía trên, điều hướng bên và khu vực nội dung Trang, phù hợp với các công việc phổ biến như quản lý Table, nhập dữ liệu bằng Form và xem dữ liệu.

Bố cục desktop cũng hỗ trợ responsive trên màn hình hẹp. Khi Trang được hiển thị trong màn hình nhỏ hơn, điều hướng, khoảng cách và các thành phần thường dùng sẽ được điều chỉnh cho phù hợp, trong khi vẫn sử dụng menu và Trang desktop ban đầu.

<!-- Cần ảnh chụp toàn bộ Trang trong bố cục desktop -->

## Bố cục mobile

[Bố cục mobile](./mobile.md) được truy cập qua `/mobile` theo mặc định. Bố cục này dùng thanh Tab dưới cùng làm điều hướng cấp một, đồng thời cung cấp Trang, Link và Tab Trang riêng cho mobile.

Bố cục mobile phù hợp với các công việc thường xuyên thực hiện trên điện thoại, như nhập dữ liệu tại hiện trường, xử lý phê duyệt, xử lý nhiệm vụ và tra cứu dữ liệu. Bạn có thể xây dựng và xem trước Trang trong trình duyệt máy tính, sau đó dùng mã QR để kiểm tra trên điện thoại thật.

<!-- Cần ảnh chụp toàn bộ Trang trong bố cục mobile -->

## Cách lựa chọn

Mặc định, chỉ cần dùng bố cục desktop.

| Tôi muốn… | Lựa chọn được đề xuất |
| --- | --- |
| Chủ yếu sử dụng trên máy tính và thỉnh thoảng truy cập bằng điện thoại | [Bố cục desktop](./desktop.md) |
| Thiết kế riêng điều hướng, Trang và quy trình thao tác cho điện thoại | [Bố cục mobile](./mobile.md) |
| Cung cấp trải nghiệm đầy đủ trên cả máy tính và thiết bị mobile | Xây dựng riêng bố cục desktop và bố cục mobile |

## Mối quan hệ giữa các cấu hình

Bố cục desktop và bố cục mobile sử dụng chung nguồn dữ liệu, collection và dữ liệu nghiệp vụ. Bạn có thể dựa trên cùng một collection để xây dựng các Trang riêng phù hợp với từng loại thiết bị.

Menu, route và cấu hình Trang được quản lý riêng. Thay đổi Trang desktop không tự động cập nhật Trang mobile, và thay đổi điều hướng mobile cũng không ảnh hưởng đến điều hướng desktop. [Quyền truy cập route](../../users-permissions/acl/permissions.md) của hai bố cục cũng cần được cấu hình riêng.

## Liên kết liên quan

- [Bố cục desktop](./desktop.md) — Xây dựng Trang desktop và tìm hiểu cách responsive trên màn hình hẹp
- [Bố cục mobile](./mobile.md) — Xây dựng điều hướng và Trang riêng cho mobile
- [Trình quản lý route](../../routes/index.md) — Quản lý Trang, Link và menu cho desktop và mobile
- [Cấu hình quyền](../../users-permissions/acl/permissions.md) — Cấu hình menu và Trang mà từng role có thể truy cập
