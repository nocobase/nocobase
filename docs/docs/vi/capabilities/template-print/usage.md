---
title: Hướng dẫn sử dụng In theo mẫu
description: Chuẩn bị mẫu, xác định dữ liệu nghiệp vụ và kiểm tra chứng từ được tạo.
---

# Hướng dẫn sử dụng In theo mẫu

[← Tổng quan In theo mẫu](./index.md)

Gói In theo mẫu cung cấp một Agent Skill và các ví dụ tham khảo. Gói không bao gồm giao diện in dựng sẵn, engine dựng chứng từ hay API nghiệp vụ. Hãy triển khai việc tạo và tải xuống trong ứng dụng hoặc plugin nghiệp vụ của bạn.

## Chuẩn bị mẫu và quy tắc nghiệp vụ

| Cần cung cấp | Ví dụ                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| Một mẫu thực tế | Một chứng từ vận chuyển Word có tiêu đề công ty, các dòng hàng và khu vực chữ ký           |
| Nguồn dữ liệu    | Đơn hàng hiện tại, khách hàng, chi tiết hàng hóa và thông tin giao hàng                      |
| Định dạng đầu ra   | Tải xuống DOCX; nêu rõ yêu cầu chuyển đổi PDF nếu cần                              |
| Quy tắc truy cập    | Những vai trò nào được tạo và tải xuống chứng từ, và có lưu lịch sử tạo hay không |

Yêu cầu Agent kiểm tra xem đã có Skill In theo mẫu chưa. Nếu cần tích hợp, hãy làm theo hướng dẫn tương ứng với phiên bản đã cài của ứng dụng. Ứng dụng sở hữu mẫu, ánh xạ trường, dependency khi chạy và mã nghiệp vụ.

## Mô tả yêu cầu

```text
Generate a transport document for the current order using my Word template.
Fill in the order number, customer, origin, destination, and cargo line items, preserving the company header and signature area.
Only employees authorized to view the order may generate and download the document. Do not accept unauthorized order data supplied by the client.
Implement DOCX download first, explain how missing fields are handled, and verify the document against a real order.
If PDF is needed, identify the required conversion environment and deployment dependencies first.
```

Quay lại [tổng quan](./index.md) để chọn kịch bản khác và điều chỉnh prompt.

## Kiểm tra kết quả

- Kiểm tra trường hợp một và nhiều dòng hàng, ngày tháng, số tiền và giá trị bị thiếu theo quy tắc đã thống nhất.
- Dùng nguồn có thể truy cập và đã được cấp quyền cho hình ảnh và mã QR.
- Kiểm soát quyền nghiệp vụ trên API tạo và tải xuống; thay đổi mã định danh đơn hàng không được làm lộ dữ liệu của người khác.
- Mở chứng từ đã tạo và kiểm tra việc chuyển đổi PDF trong môi trường triển khai thực tế nếu cần.

## Tài liệu tham khảo cho phát triển

Đọc [tài liệu của gói năng lực](https://github.com/nocobase/nocobase/blob/v3-develop/packages/plugins/app-plugin-template-print/README.md) và [plugin ví dụ có thể chạy được](https://github.com/nocobase/nocobase/blob/v3-develop/packages/examples/app-plugin-template-print-example/README.md). Ví dụ này sở hữu dữ liệu demo và route riêng; nó không phải là một dịch vụ in đa dụng cho mọi ứng dụng.
