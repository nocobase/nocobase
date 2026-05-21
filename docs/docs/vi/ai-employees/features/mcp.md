---
pkg: "@nocobase/plugin-ai"
title: "Tích hợp MCP cho Nhân viên AI"
description: "Tích hợp dịch vụ MCP cho Nhân viên AI, kiểm tra tính khả dụng của dịch vụ MCP, và quản lý quyền gọi Tool MCP."
keywords: "Skills Nhân viên AI,MCP,Model Context Protocol,tools"
---

# Tích hợp MCP

Nhân viên AI có thể tích hợp dịch vụ MCP tuân theo giao thức Model Context Protocol (MCP), sau khi tích hợp dịch vụ MCP, Nhân viên AI có thể sử dụng các Tool do dịch vụ MCP cung cấp để hoàn thành tác vụ.


## Cấu hình MCP

Vào module cấu hình MCP, ở đây bạn có thể thêm dịch vụ MCP mới, bảo trì các dịch vụ MCP đã tích hợp.

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## Thêm dịch vụ MCP

Nhấp nút `Thêm` ở góc trên bên phải danh sách dịch vụ MCP, nhập thông tin tích hợp dịch vụ MCP trong hộp thoại để hoàn thành việc thêm dịch vụ MCP.

Hỗ trợ hai giao thức truyền dịch vụ MCP là Stdio và HTTP (Streamable / SSE).

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

Khi thêm dịch vụ MCP, bạn cần nhập `Tên`, `Tiêu đề`, `Mô tả`. `Tên` là định danh duy nhất của dịch vụ MCP; `Tiêu đề` là tên hiển thị của dịch vụ MCP trong hệ thống; `Mô tả` là tùy chọn, dùng để mô tả ngắn gọn các chức năng mà dịch vụ MCP cung cấp.

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio

Khi thêm dịch vụ MCP hỗ trợ giao thức truyền stdio, bạn cần nhập `lệnh` để chạy dịch vụ MCP và `tham số lệnh`, theo nhu cầu có thể thêm `biến môi trường` cần thiết để chạy lệnh dịch vụ MCP.

:::warning
Các lệnh chạy dịch vụ MCP như node, npx, uvx, go, v.v. cần được hỗ trợ bởi môi trường máy chủ triển khai NocoBase mới có thể sử dụng.

Image Docker của NocoBase chỉ hỗ trợ các lệnh môi trường Nodejs như node, npx.
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

Khi thêm dịch vụ MCP hỗ trợ giao thức truyền http, bạn cần nhập địa chỉ `URL` của dịch vụ MCP, theo nhu cầu có thể thêm `Header yêu cầu`.

Giao thức truyền http hỗ trợ hai phương thức truyền là Streamable và SSE, Streamable là phương thức truyền mới được thêm vào tiêu chuẩn MCP, phương thức truyền SSE sắp bị loại bỏ, vui lòng chọn phương thức truyền cụ thể theo hướng dẫn tài liệu của dịch vụ MCP đang sử dụng.

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### Kiểm tra tính khả dụng

Khi thêm và chỉnh sửa dịch vụ MCP, sau khi nhập xong thông tin cấu hình MCP, bạn có thể khởi động kiểm tra tính khả dụng đối với dịch vụ MCP, khi thông tin cấu hình MCP đầy đủ và chính xác và dịch vụ MCP khả dụng, sẽ trả về thông báo kiểm tra tính khả dụng dịch vụ MCP thành công.

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## Xem dịch vụ MCP

Nhấp nút `Xem` trên danh sách dịch vụ MCP để xem danh sách Tool do dịch vụ MCP cung cấp.

Trong danh sách Tool của dịch vụ MCP còn có thể thiết lập cấu hình quyền sử dụng Tool đó của Nhân viên AI, khi quyền Tool được thiết lập là `Ask`, sẽ hỏi có cho phép gọi hay không trước khi gọi; khi thiết lập là `Allow`, sẽ trực tiếp gọi Tool khi cần thiết.

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## Sử dụng dịch vụ MCP

Sau khi kích hoạt dịch vụ MCP cần sử dụng trong module cấu hình MCP, khi trò chuyện với Nhân viên AI, Nhân viên AI sẽ tự động sử dụng các Tool do dịch vụ MCP cung cấp để hoàn thành tác vụ.

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)
