---
pkg: '@nocobase/plugin-workflow-subflow'
title: "Node Workflow - Gọi Workflow"
description: "Node gọi Workflow: gọi quy trình con, truyền biến, tái sử dụng logic quy trình, tách quy trình."
keywords: "workflow,gọi workflow,Subflow,quy trình con,tái sử dụng quy trình,NocoBase"
---

# Gọi Workflow

## Giới thiệu

Được dùng để gọi các quy trình khác trong một Workflow, có thể sử dụng biến của quy trình hiện tại làm đầu vào cho quy trình con và sử dụng đầu ra của quy trình con làm biến của quy trình hiện tại trong các Node tiếp theo.

Quá trình xử lý của việc gọi Workflow như hình dưới đây:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Thông qua việc gọi Workflow có thể tái sử dụng một số logic quy trình thông dụng, ví dụ gửi email, SMS..., hoặc tách một quy trình phức tạp thành nhiều quy trình con để dễ quản lý và bảo trì.

Về bản chất, Workflow không phân biệt một quy trình có phải là quy trình con hay không, bất kỳ Workflow nào cũng có thể được gọi làm quy trình con bởi các quy trình khác và cũng có thể gọi các quy trình khác. Tất cả các Workflow đều bình đẳng, chỉ tồn tại mối quan hệ gọi và được gọi.

Tương tự, việc sử dụng gọi Workflow được chia thành hai vị trí:

1. Trong quy trình chính: với tư cách là bên gọi, qua Node "Gọi Workflow" gọi các Workflow khác.
2. Trong quy trình con: với tư cách là bên được gọi, qua Node "Đầu ra luồng" lưu biến cần xuất ra trong quy trình hiện tại để có thể được các Node tiếp theo sử dụng trong Workflow gọi quy trình hiện tại.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Gọi Workflow":

![Thêm Node gọi Workflow](https://static-docs.nocobase.com/20241230001323.png)

## Cấu hình Node

### Chọn Workflow

Chọn Workflow cần gọi, có thể qua ô tìm kiếm để tìm nhanh:

![Chọn Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Mẹo}
* Workflow chưa được bật cũng có thể được gọi làm quy trình con.
* Khi Workflow hiện tại ở chế độ đồng bộ thì cũng chỉ có thể gọi quy trình con ở chế độ đồng bộ.
:::

### Cấu hình biến Trigger của Workflow

Sau khi chọn Workflow, còn cần cấu hình biến của Trigger làm dữ liệu đầu vào để kích hoạt quy trình con. Có thể trực tiếp chọn dữ liệu tĩnh hoặc chọn biến trong quy trình hiện tại:

![Cấu hình biến Trigger](https://static-docs.nocobase.com/20241230162722.png)

Các loại Trigger khác nhau có biến cần thiết khác nhau, có thể tùy theo nhu cầu hoàn tất cấu hình trên form.

## Node đầu ra luồng

Tham khảo nội dung Node [Đầu ra luồng](./output.md) để cấu hình biến đầu ra của quy trình con.

## Sử dụng đầu ra luồng

Quay lại quy trình chính, trong các Node khác bên dưới Node gọi Workflow, khi muốn sử dụng giá trị đầu ra của quy trình con, có thể chọn kết quả của Node gọi Workflow. Nếu đầu ra của quy trình con là một giá trị đơn giản như chuỗi, số, giá trị logic, ngày (ngày là chuỗi định dạng UTC)..., có thể trực tiếp sử dụng; nếu là đối tượng phức tạp (như đối tượng trong bảng dữ liệu), cần qua Node phân tích JSON để ánh xạ trước rồi mới có thể sử dụng các thuộc tính trong đó, ngược lại chỉ có thể được sử dụng theo toàn bộ đối tượng.

Nếu quy trình con không cấu hình Node đầu ra luồng hoặc không có giá trị đầu ra, thì khi sử dụng kết quả của Node gọi Workflow trong quy trình chính, chỉ có thể nhận được giá trị rỗng (`null`).
