---
title: "Tổng quan về Block"
description: "Block trong xây dựng giao diện NocoBase: Data block, Filter block, Block khác, có thể đặt trong Trang, Modal, Drawer, hỗ trợ bố cục kéo thả, event flow, cấu hình tham số."
keywords: "Block, Blocks, Data block, Filter block, bố cục kéo thả, event flow, xây dựng giao diện, NocoBase"
---

# Block

Block là vật mang dữ liệu và nội dung, có thể được đặt trong Trang (Page), Modal hoặc Drawer, nhiều Block có thể được sắp xếp tự do bằng cách kéo thả.

## Loại Block

![Loại Block](https://static-docs.nocobase.com/f71af45b5cd914ea0558f760ddbbba58.png)

- Data block: Dùng để hiển thị dữ liệu từ nguồn dữ liệu trên giao diện.
- Filter block: Dùng để lấy dữ liệu trong nguồn dữ liệu làm điều kiện lọc, kích hoạt lọc cho các Data block khác.
- Block khác: Dùng để chứa các nội dung đặc thù hoặc độc lập như Workflow công việc cần làm, nhật ký kiểm tra, Markdown v.v.

## Thêm Block

Block có thể được đặt trong Trang (Page), Modal hoặc Drawer.

### Block trong Trang

Hiện tại các loại Block trong Trang bao gồm: Data block, Filter block, Block khác.

![20251023222441](https://static-docs.nocobase.com/20251023222441.png)

### Block trong Popup (Modal hoặc Drawer)

Popup có hai loại Modal và Drawer, giống như Trang cũng có thể thêm Block, sự khác biệt là Block Form trong Popup thường là để thêm, chỉnh sửa hoặc xem một bản ghi đơn lẻ, các loại Block bao gồm Data block, Block khác.

![20251023222613](https://static-docs.nocobase.com/20251023222613.png)

## Trình thiết kế của Block

Mỗi Block ở góc trên bên phải đều có ba biểu tượng nhỏ, từ trái sang phải lần lượt là:

1. Bố cục kéo thả
2. [Event flow](/interface-builder/event-flow)
3. Cấu hình tham số Block

![20251023224032](https://static-docs.nocobase.com/20251023224032.png)

Tất cả các cấu hình của Block đơn giản đều tập trung trong "Cấu hình tham số Block", ví dụ JS Block

![20251023224903](https://static-docs.nocobase.com/20251023224903.png)

Block loại dữ liệu phức tạp còn cung cấp "Cấu hình Field" và "Cấu hình Action" được nhúng độc lập.

![20251023225141](https://static-docs.nocobase.com/20251023225141.png)

Ngoài ra, bạn cũng có thể tự do phát huy, cung cấp nhiều khả năng lồng ghép hơn, ví dụ Block biểu đồ.

![](https://static-docs.nocobase.com/07588190b3f41ae3060e71d8b76b4447.png)

## Bố cục Block

Nhiều Block có thể được điều chỉnh bố cục bằng cách kéo thả.

![20251029201501](https://static-docs.nocobase.com/20251029201501.gif)
