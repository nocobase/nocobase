---
pkg: "@nocobase/plugin-kanban"
title: "Block Kanban"
description: "Block Kanban: hiển thị bản ghi dữ liệu theo cột nhóm, hỗ trợ chuyển đổi kiểu, thêm nhanh, cấu hình Popup, Sắp xếp bằng kéo thả và mở khi nhấp thẻ."
keywords: "Block Kanban,Kanban,nhóm dữ liệu,Sắp xếp bằng kéo thả,thêm nhanh,cài đặt Popup,bố cục thẻ,Interface Builder,NocoBase"
---

# Kanban

## Giới thiệu

Block Kanban hiển thị bản ghi dữ liệu theo cột nhóm, phù hợp với các trường hợp như chuyển đổi trạng thái nhiệm vụ, theo dõi giai đoạn bán hàng, xử lý phiếu công việc cần xem và đẩy dữ liệu theo giai đoạn.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Tùy chọn cấu hình Block

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### Cài đặt nhóm

Block Kanban phải chỉ định Field nhóm trước, hệ thống sẽ phân bổ bản ghi vào các cột khác nhau theo giá trị Field.

- Field nhóm hỗ trợ Field chọn đơn, Field nhiều-một.
- Tiêu đề cột và màu cột của Field chọn đơn sẽ trực tiếp tái sử dụng nhãn và màu được cấu hình trong tùy chọn Field.
- Các tùy chọn nhóm của Field nhiều-một sẽ được tải từ bản ghi của Table liên kết.
- Khi Field nhóm là Field nhiều-một, có thể cấu hình thêm:
	- Field tiêu đề: Quyết định tiêu đề cột hiển thị giá trị Field liên kết nào.
	- Field màu: Quyết định màu nền của tiêu đề cột và container cột.
- Thông qua "Chọn giá trị nhóm" có thể kiểm soát những cột nào sẽ hiển thị, cũng như thứ tự hiển thị của cột.
- Bản ghi có giá trị nhóm rỗng sẽ hiển thị trong cột "Không xác định".

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### Kiểu

Kanban hỗ trợ hai kiểu cột:

- `Classic`: Giữ lại nền cột mặc định nhẹ hơn.
- `Filled`: Sử dụng màu cột để render nền tiêu đề cột và container cột, phù hợp với các trường hợp màu trạng thái rõ ràng hơn.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### Cài đặt kéo thả

Sau khi bật kéo thả, có thể kéo trực tiếp thẻ để điều chỉnh thứ tự.

- Sau khi bật "Bật Sắp xếp bằng kéo thả", có thể chọn thêm "Field Sắp xếp bằng kéo thả".
- Sắp xếp bằng kéo thả phụ thuộc vào Field sắp xếp, Field sắp xếp cần khớp với Field nhóm hiện tại.
- Khi kéo thẻ sang cột khác, sẽ đồng thời cập nhật giá trị Field nhóm và vị trí sắp xếp của bản ghi.

Xem thêm tại [Field sắp xếp](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### Thêm nhanh

Sau khi bật "Thêm nhanh", phía bên phải tiêu đề mỗi cột sẽ hiển thị một nút dấu cộng.

- Nhấp dấu cộng tiêu đề cột, sẽ mở Popup thêm mới với cột hiện tại làm ngữ cảnh.
- Form thêm mới sẽ tự động mang theo giá trị nhóm tương ứng của cột hiện tại.
- Nếu cột hiện tại là cột "Không xác định", thì sẽ điền sẵn Field nhóm thành giá trị rỗng.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### Cài đặt Popup

"Cài đặt Popup" cấp Block được dùng để kiểm soát hành vi Popup được mở bởi nút thêm nhanh tiêu đề cột.

- Có thể cấu hình cách mở, ví dụ Drawer, hộp thoại hoặc Trang.
- Có thể cấu hình kích thước Popup.
- Có thể bind mẫu Popup hoặc tiếp tục thêm nội dung Block trong Popup.

### Số phân trang mỗi cột

Dùng để kiểm soát số bản ghi tải lần đầu của mỗi cột. Khi nhiều bản ghi trong cột, có thể tiếp tục cuộn để tải.

### Độ rộng cột

Dùng để cài đặt độ rộng của mỗi cột, thuận tiện điều chỉnh hiệu ứng hiển thị theo mật độ nội dung thẻ.

### Cài đặt phạm vi dữ liệu

Dùng để giới hạn phạm vi dữ liệu hiển thị trong Block Kanban.

Ví dụ: Chỉ hiển thị nhiệm vụ do người phụ trách hiện tại tạo, hoặc chỉ hiển thị bản ghi dưới một dự án nào đó.

Xem thêm tại [Cài đặt phạm vi dữ liệu](/interface-builder/blocks/block-settings/data-scope)


## Cấu hình Field

Bên trong thẻ Kanban sử dụng bố cục Field kiểu Chi tiết để hiển thị thông tin tóm tắt bản ghi.

### Thêm Field

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

Tùy chọn cấu hình Field tham khảo [Field Chi tiết](/interface-builder/fields/generic/detail-form-item)

### Cài đặt thẻ

Bản thân thẻ hỗ trợ các cài đặt sau:

- Bật mở khi nhấp: Sau khi bật, nhấp thẻ có thể mở bản ghi hiện tại.
- Cài đặt Popup: Có thể cấu hình riêng cách mở, kích thước và mẫu Popup sau khi nhấp thẻ.
- Bố cục: Có thể điều chỉnh bố cục hiển thị Field trong thẻ.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Cấu hình Action

Block Kanban hỗ trợ cấu hình Action toàn cục ở trên cùng, các loại Action có thể thấy cụ thể sẽ thay đổi theo khả năng action đã được bật trong môi trường hiện tại.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### Action toàn cục

- [Thêm](/interface-builder/actions/types/add-new)
- [Popup](/interface-builder/actions/types/pop-up)
- [Liên kết](/interface-builder/actions/types/link)
- [Làm mới](/interface-builder/actions/types/refresh)
- [Yêu cầu tùy chỉnh](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
