---
pkg: "@nocobase/plugin-workflow-response-message"
title: "Node Workflow - Phản hồi HTTP"
description: "Node phản hồi HTTP: phản hồi trả về cho hệ thống bên thứ ba trong Webhook đồng bộ, sau khi thực thi sẽ dừng quy trình."
keywords: "workflow,phản hồi HTTP,Response,phản hồi Webhook,NocoBase"
---

# Phản hồi HTTP

## Giới thiệu

Chỉ hỗ trợ sử dụng trong Workflow Webhook ở chế độ đồng bộ, dùng để phản hồi trả về cho hệ thống bên thứ ba. Ví dụ trong quá trình xử lý callback thanh toán, nếu xử lý nghiệp vụ có kết quả không như mong đợi (như lỗi, thất bại...), có thể qua Node phản hồi để trả về phản hồi biểu thị lỗi cho hệ thống bên thứ ba để một số hệ thống bên thứ ba có thể thử lại sau dựa trên trạng thái.

Ngoài ra, việc thực thi Node phản hồi sẽ dừng việc thực thi của Workflow, các Node tiếp theo sẽ không thực thi nữa. Nếu toàn bộ Workflow không cấu hình Node phản hồi, hệ thống sẽ tự động phản hồi dựa trên trạng thái thực thi quy trình, thực thi thành công trả về `200`, thực thi thất bại trả về `500`.

## Tạo Node phản hồi

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Phản hồi":

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Cấu hình phản hồi

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Trong body phản hồi có thể sử dụng biến trong ngữ cảnh Workflow.
