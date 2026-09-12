---
pkg: '@nocobase/plugin-ai'
title: 'Sử dụng Tools cho Nhân viên AI'
description: 'Tools định nghĩa năng lực của Nhân viên AI: General tools, Employee-specific tools, Custom tools, cấu hình quyền Skill Ask/Allow.'
keywords: 'Tools Nhân viên AI,Tools,Ask,Allow,Quyền Skill,NocoBase'
---

# Sử dụng Tools

Tools định nghĩa "có thể làm gì" của Nhân viên AI.

## Cấu trúc Tools

Trang Tools chia thành ba loại:

1. `General tools`: Tất cả Nhân viên AI dùng chung, thường chỉ đọc.
2. `Employee-specific tools`: Chuyên dụng cho nhân viên hiện tại.
3. `Custom tools`: Công cụ tùy chỉnh được kích hoạt thông qua trigger "Sự kiện Nhân viên AI" của Workflow, có thể thêm/xóa và cấu hình quyền mặc định.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Quyền Tools

Quyền Tools được thống nhất là:

- `Ask`: Hỏi xác nhận trước khi gọi.
- `Allow`: Cho phép gọi trực tiếp.

Khuyến nghị: Các công cụ liên quan đến sửa đổi dữ liệu nên mặc định sử dụng `Ask`.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Giới thiệu Tools

### Tools tổng quát

| Tên Tool | Mô tả chức năng |
| -------------------- | -------------------------------------------- |
| Form filler | Điền dữ liệu vào form được chỉ định |
| Chart generator | Tạo cấu hình JSON biểu đồ ECharts |
| Load specific SKILLS | Tải Skill và các Tool mà Skill cần |
| Suggestions | Đưa ra đề xuất hành động tiếp theo dựa trên nội dung hội thoại và ngữ cảnh hiện tại |

### Tools chuyên dụng

| Tên Tool | Mô tả chức năng | Nhân viên sở hữu |
| ---------------------------- | -------------------------------------------- | -------- |
| AI employee task dispatching | Công cụ điều phối công việc, phân bổ tác vụ dựa trên loại tác vụ và năng lực của nhân viên | Atlas |
| List AI employees | Liệt kê tất cả nhân viên khả dụng | Atlas |
| Get AI employee | Lấy thông tin chi tiết của nhân viên cụ thể, bao gồm Skills và Tools | Atlas |

### Custom tools

Trong module Workflow tạo Workflow với loại trigger là `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Trong `Custom tools` nhấp `Add tool` để thêm Workflow làm Tool sử dụng, và cấu hình quyền theo rủi ro nghiệp vụ.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
