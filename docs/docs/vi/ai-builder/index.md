---
title: "Bắt đầu nhanh với AI Builder"
description: "AI Builder là khả năng xây dựng có hỗ trợ AI của NocoBase, dùng ngôn ngữ tự nhiên để hoàn thành các thao tác như mô hình hóa dữ liệu, cấu hình giao diện, sắp xếp Workflow, mang lại trải nghiệm xây dựng hiện đại và hiệu quả hơn."
keywords: "AI Builder,NocoBase AI,Agent Skills,Xây dựng bằng ngôn ngữ tự nhiên,Low-code AI,Bắt đầu nhanh"
---

# Bắt đầu nhanh với AI Builder

AI Builder là khả năng xây dựng có hỗ trợ AI mà NocoBase cung cấp — bạn có thể mô tả nhu cầu bằng ngôn ngữ tự nhiên, AI sẽ tự động hoàn thành các thao tác như mô hình hóa dữ liệu, cấu hình trang, thiết lập quyền. Mang lại trải nghiệm xây dựng hiện đại và hiệu quả hơn.

## Bắt đầu nhanh

Nếu bạn đã cài [NocoBase CLI](../ai/quick-start.md), có thể bỏ qua bước này.

### Cài đặt một phát qua AI

Sao chép câu lệnh dưới đây cho trợ lý AI của bạn (Claude Code, Codex, Cursor, Trae...), nó sẽ tự động hoàn tất việc cài đặt và cấu hình:

```
Giúp tôi cài đặt NocoBase CLI và hoàn thành khởi tạo: https://docs.nocobase.com/cn/ai/ai-quick-start.md (vui lòng truy cập trực tiếp nội dung của link)
```

### Cài đặt thủ công

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Trình duyệt sẽ tự động mở trang cấu hình trực quan, hướng dẫn bạn cài NocoBase Skills, cấu hình CSDL và khởi động ứng dụng. Các bước chi tiết vui lòng xem [Bắt đầu nhanh](../ai/quick-start.md).

## Thay cấu hình thủ công bằng hội thoại

Sau khi cài NocoBase CLI xong, bạn có thể thao tác trực tiếp trên NocoBase bằng ngôn ngữ tự nhiên trong trợ lý AI. Dưới đây là một vài tình huống thực tế, từ tạo một bảng đến xây dựng cả một hệ thống, hãy cảm nhận sức mạnh của AI Builder.

### Mô tả nhu cầu nghiệp vụ, AI giúp bạn thiết kế bảng và quan hệ liên kết

Hãy cho AI biết bạn muốn làm hệ thống gì, nó sẽ tự động giúp bạn thiết kế các bảng, kiểu Field và quan hệ liên kết — không cần tự vẽ ER diagram.

```
Tôi đang xây dựng một CRM, hãy thiết kế và xây dựng mô hình dữ liệu cho tôi
```

![AI thiết kế mô hình dữ liệu CRM](https://static-docs.nocobase.com/202604162126729.png)

AI tự động tạo ra các bảng như Customer, Contact, Opportunity, Order, cùng với quan hệ liên kết giữa chúng:

![Kết quả mô hình dữ liệu CRM](https://static-docs.nocobase.com/202604162201867.png)

Để tìm hiểu thêm về cách dùng mô hình hóa dữ liệu, vui lòng xem [Mô hình hóa dữ liệu](./data-modeling).

### Mô tả trang bằng ngôn ngữ nghiệp vụ, AI xây dựng giúp bạn

Không cần học quy tắc cấu hình, hãy nói trực tiếp bạn muốn trang như thế nào — ô tìm kiếm, bảng, điều kiện lọc, cứ nói ra là có.

```
Tạo cho tôi trang quản lý Customer, gồm ô tìm kiếm theo tên và bảng customer, bảng hiển thị tên, số điện thoại, email, thời gian tạo
```

![Trang quản lý Customer](https://static-docs.nocobase.com/20260420100608.png)

Để tìm hiểu thêm về cách dùng cấu hình giao diện, vui lòng xem [Cấu hình giao diện](./ui-builder).

### Sắp xếp Workflow tự động chỉ bằng một câu nói

Mô tả điều kiện kích hoạt và logic xử lý của quy trình nghiệp vụ, AI sẽ tự động tạo trigger và chuỗi Node.

```
Sắp xếp giúp tôi một Workflow tự động trừ tồn kho hàng hóa sau khi tạo Order
```

![Workflow trừ tồn kho khi tạo Order](https://static-docs.nocobase.com/20260419234303.png)

Để tìm hiểu thêm về cách dùng Workflow, vui lòng xem [Quản lý Workflow](./workflow).

### Bảng dữ liệu, trang, dashboard, một bước là xong

:::warning Lưu ý

Tính năng giải pháp hiện vẫn đang trong giai đoạn test, độ ổn định có hạn, chỉ phù hợp để trải nghiệm.

:::

Mô tả tình huống nghiệp vụ của bạn chỉ với một câu nói, AI sẽ giúp bạn xây dựng đầy đủ các bảng, trang quản lý, dashboard và biểu đồ.

```
Hãy dùng skill nocobase-dsl-reconciler xây dựng cho tôi một hệ thống quản lý ticket, gồm dashboard, danh sách ticket, quản lý người dùng, cấu hình SLA
```

AI sẽ output phương án thiết kế trước, sau khi xác nhận sẽ xây dựng toàn bộ trong một lần:

![Phương án thiết kế hệ thống ticket](https://static-docs.nocobase.com/20260420100420.png)

![Hiệu quả xây dựng hệ thống ticket](https://static-docs.nocobase.com/20260420100450.png)

Để tìm hiểu thêm về cách xây dựng cả hệ thống, vui lòng xem [Giải pháp](./dsl-reconciler).

## Bảo mật và kiểm toán

Trước khi để AI Agent thao tác trên NocoBase, khuyến nghị tìm hiểu về phương thức xác thực, kiểm soát quyền và kiểm toán thao tác — đảm bảo AI chỉ làm những việc nên làm và mỗi bước đều có ghi chép. Vui lòng xem [Bảo mật và kiểm toán](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) là gói kiến thức chuyên ngành có thể cài vào AI Agent, giúp AI hiểu được hệ thống cấu hình của NocoBase. NocoBase cung cấp 8 Skills, bao quát toàn bộ quy trình xây dựng:

- [Quản lý môi trường](./env-bootstrap) — Kiểm tra môi trường, cài đặt triển khai, nâng cấp và chẩn đoán sự cố
- [Mô hình hóa dữ liệu](./data-modeling) — Tạo và quản lý bảng, Field, quan hệ liên kết
- [Cấu hình giao diện](./ui-builder) — Tạo và chỉnh sửa trang, Block, popup, tương tác liên động
- [Quản lý Workflow](./workflow) — Tạo, chỉnh sửa, kích hoạt và chẩn đoán Workflow
- [Cấu hình quyền](./acl) — Quản lý vai trò, chính sách quyền, gán người dùng và đánh giá rủi ro
- [Giải pháp](./dsl-reconciler) — Xây dựng nguyên cả hệ thống nghiệp vụ hàng loạt từ YAML
- [Quản lý Plugin](./plugin-manage) — Xem, kích hoạt và tắt Plugin
- [Quản lý phát hành](./publish) — Phát hành đa môi trường, sao lưu khôi phục và di chuyển

:::tip Mẹo

NocoBase CLI sẽ tự động cài Skills trong quá trình khởi tạo (`nb init`), bạn không cần cài thủ công.

:::

## Liên kết liên quan

- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [Tài liệu tham khảo NocoBase CLI](../api/cli/index.md) — Hướng dẫn đầy đủ các tham số của tất cả lệnh
- [Phát triển Plugin bằng AI](../ai-dev/index.md) — Sử dụng AI để hỗ trợ phát triển Plugin NocoBase
- [Bảo mật và kiểm toán](./security) — Phương thức xác thực, kiểm soát quyền và kiểm toán thao tác
- [Nhân viên AI](../ai-employees/index.md) — Năng lực Agent của NocoBase, hỗ trợ cộng tác và thực thi thao tác ngay trong giao diện nghiệp vụ
