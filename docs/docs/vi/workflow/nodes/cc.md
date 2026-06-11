---
pkg: '@nocobase/plugin-workflow-cc'
title: "Node Workflow - Sao gửi"
description: "Node sao gửi: gửi nội dung ngữ cảnh quy trình đến người dùng được chỉ định, hiển thị trong 'Sao gửi cho tôi' ở trung tâm Task."
keywords: "workflow,sao gửi,CC,trung tâm Task,sao gửi cho tôi,NocoBase"
---

# Sao gửi <Badge>v1.8.2+</Badge>

## Giới thiệu

Node sao gửi được dùng để gửi một số nội dung ngữ cảnh trong quá trình thực thi Workflow đến người dùng được chỉ định để họ hiểu và tham khảo. Ví dụ trong quy trình phê duyệt hoặc các quy trình khác, có thể sao gửi thông tin liên quan đến các bên tham gia khác để họ kịp thời nắm bắt tiến độ công việc.

Có thể đặt nhiều Node sao gửi trong Workflow để khi Workflow thực thi đến Node đó, sẽ gửi thông tin liên quan đến người nhận được chỉ định.

Nội dung sao gửi sẽ được hiển thị trong menu "Sao gửi cho tôi" của trung tâm Task, người dùng có thể xem tất cả nội dung được sao gửi cho mình ở đây. Và sẽ nhắc người dùng các nội dung sao gửi chưa xem dựa trên trạng thái chưa đọc, sau khi xem người dùng có thể chủ động đánh dấu là đã đọc.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Sao gửi":

![Sao gửi_thêm](https://static-docs.nocobase.com/20250710222842.png)

## Cấu hình Node

![Cấu hình Node](https://static-docs.nocobase.com/20250710224041.png)

Trong giao diện cấu hình Node, có thể đặt các tham số sau:

### Người nhận

Người nhận là tập hợp người dùng đối tượng sao gửi, có thể là một hoặc nhiều người dùng. Nguồn được chọn có thể là giá trị tĩnh được chọn từ danh sách người dùng, cũng có thể là giá trị động được chỉ định bởi biến, còn có thể là kết quả truy vấn bảng người dùng.

![Cấu hình người nhận](https://static-docs.nocobase.com/20250710224421.png)

### Giao diện người dùng

Người nhận cần xem nội dung sao gửi trong menu "Sao gửi cho tôi" của trung tâm Task. Có thể cấu hình kết quả của Trigger và Node bất kỳ trong ngữ cảnh quy trình làm Block nội dung.

![Giao diện người dùng](https://static-docs.nocobase.com/20250710225400.png)

### Thẻ Task chờ làm <Badge>2.0+</Badge>

Có thể được dùng để cấu hình thẻ Task trong danh sách "Sao gửi cho tôi" ở trung tâm Task.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Trong thẻ có thể tự do cấu hình các trường nghiệp vụ muốn hiển thị (trừ trường quan hệ).

Sau khi Task sao gửi Workflow được tạo, trong danh sách trung tâm Task có thể thấy thẻ Task tùy chỉnh:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Tiêu đề Task

Tiêu đề Task là tiêu đề được hiển thị trong trung tâm Task, có thể sử dụng biến trong ngữ cảnh quy trình để sinh tiêu đề một cách động.

![Tiêu đề Task](https://static-docs.nocobase.com/20250710225603.png)

## Trung tâm Task

Người dùng có thể xem và quản lý tất cả nội dung được sao gửi cho mình trong trung tâm Task và lọc, xem theo trạng thái đã đọc.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Sau khi xem có thể đánh dấu là đã đọc, số lượng chưa đọc sẽ giảm theo.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)
