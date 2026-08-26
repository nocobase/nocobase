---
pkg: '@nocobase/plugin-workflow'
title: "Tổng quan Workflow"
description: "Workflow: trực quan hóa quy trình nghiệp vụ tự động với Trigger và Node, phê duyệt, đồng bộ dữ liệu, HTTP Request, hợp tác người - máy, không cần viết code."
keywords: "workflow,tự động hóa,trigger,phê duyệt,điều phối quy trình,đồng bộ dữ liệu,hợp tác người máy,NocoBase"
---

# Tổng quan

## Giới thiệu

Plugin Workflow giúp bạn điều phối các quy trình nghiệp vụ tự động trong NocoBase, ví dụ như phê duyệt hằng ngày, đồng bộ dữ liệu, nhắc nhở và nhiều nghiệp vụ khác. Trong Workflow, bạn chỉ cần thông qua giao diện trực quan để cấu hình Trigger và các Node liên quan là có thể triển khai logic nghiệp vụ phức tạp mà không cần viết code.

### Ví dụ

Mỗi Workflow được tạo nên từ một Trigger và một số Node, trong đó Trigger đại diện cho sự kiện trong hệ thống, mỗi Node đại diện cho một bước thực thi, và toàn bộ mô tả logic nghiệp vụ cần xử lý sau khi sự kiện xảy ra. Hình dưới đây minh họa một quy trình điển hình về việc trừ tồn kho sau khi đặt hàng sản phẩm:

![Ví dụ Workflow](https://static-docs.nocobase.com/20251029222146.png)

Khi người dùng gửi đơn hàng, Workflow sẽ tự động kiểm tra tồn kho. Nếu tồn kho đủ thì trừ tồn kho và tiếp tục tạo đơn hàng; nếu không thì kết thúc quy trình.

### Tình huống sử dụng

Từ góc nhìn tổng quát hơn, Workflow trong ứng dụng NocoBase có thể giải quyết các vấn đề ở nhiều tình huống khác nhau:

- Tự động xử lý các tác vụ lặp đi lặp lại: kiểm duyệt đơn hàng, đồng bộ tồn kho, làm sạch dữ liệu, tính điểm... không còn phải thao tác thủ công.
- Hỗ trợ hợp tác người - máy: bố trí phê duyệt hoặc rà soát tại các Node quan trọng và tiếp tục các bước sau dựa trên kết quả xử lý.
- Kết nối hệ thống bên ngoài: gửi HTTP Request, nhận đẩy dữ liệu từ dịch vụ bên ngoài để triển khai tự động hóa liên hệ thống.
- Nhanh chóng thích nghi với thay đổi nghiệp vụ: điều chỉnh cấu trúc quy trình, điều kiện hay cấu hình Node khác mà không cần phát hành phiên bản mới.

## Cài đặt

Workflow là plugin tích hợp sẵn của NocoBase, không cần cài đặt hay cấu hình thêm.

## Tìm hiểu thêm

- [Bắt đầu nhanh](./getting-started)
- [Trigger](./triggers/index)
- [Node](./nodes/index)
- [Sử dụng biến](./advanced/variables)
- [Kế hoạch thực thi](./advanced/executions)
- [Quản lý phiên bản](./advanced/revisions)
- [Cấu hình nâng cao](./advanced/options)
- [Phát triển mở rộng](./development/index)
