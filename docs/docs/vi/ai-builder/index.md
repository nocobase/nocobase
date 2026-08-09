---
title: "Bắt đầu nhanh với AI Builder"
description: "AI Builder là khả năng xây dựng có hỗ trợ AI mà NocoBase cung cấp, dùng ngôn ngữ tự nhiên để hoàn thành mô hình hóa dữ liệu, xây dựng giao diện, sắp xếp Workflow và cấu hình quyền, hỗ trợ cả cách cấu hình không cần code lẫn cách để AI viết code."
keywords: "AI Builder,NocoBase AI,Agent Skills,Xây dựng bằng ngôn ngữ tự nhiên,Low-code AI,AI Portal,Bắt đầu nhanh"
---

# Bắt đầu nhanh với AI Builder

AI Builder là khả năng xây dựng có hỗ trợ AI mà NocoBase cung cấp — bạn mô tả nhu cầu nghiệp vụ bằng ngôn ngữ tự nhiên, AI Agent sẽ dựng hệ thống giúp bạn. Từ mô hình hóa dữ liệu, xây dựng giao diện, sắp xếp Workflow, cấu hình quyền cho đến lúc phát hành lên production, toàn bộ chuỗi đều được bao quát.

Riêng chuyện **giao diện được dựng như thế nào**, có hai cách:

- **AI + xây dựng Portal không cần code** — AI dựa trên khả năng cấu hình không cần code của NocoBase để dựng giao diện hệ thống cho bạn, sản phẩm đầu ra là cấu hình được lưu trong cơ sở dữ liệu. Phù hợp với các nghiệp vụ CRUD tiêu chuẩn và hệ thống quản trị nội bộ, và người dùng nghiệp vụ sau đó cũng có thể tự chỉnh tiếp ngay trên giao diện
- **Xây dựng AI Portal** — NocoBase cung cấp phần nền tảng (dữ liệu, xác thực, quyền...), còn AI Agent viết code trực tiếp ở máy cục bộ, sản phẩm đầu ra có thể commit thẳng vào Git. Sau khi build và triển khai, bạn truy cập được qua [AI Portal](./ai-portal/index.md). Phù hợp với tương tác tùy chỉnh, hệ thống nghiệp vụ phức tạp và các trường hợp có yêu cầu riêng về mặt hình ảnh

Dù chọn cách nào, bảng dữ liệu, quyền và Workflow đều dùng chung một bộ Skill — trong lúc AI Agent viết trang, nó cũng có thể tiện tay tạo bảng dữ liệu và cấu hình quyền cho bạn, dựng dần thành một hệ thống nghiệp vụ hoàn chỉnh qua hội thoại.

## Chọn giữa hai cách xây dựng

Hai cách nói trên tương ứng với hai loại entry truy cập. Một ứng dụng NocoBase có thể có nhiều entry dùng chung một bộ dữ liệu, và nhìn đường dẫn truy cập là nhận ra ngay đó là loại nào:

```text
/v/<name>    Portal không cần code
/x/<name>    AI Portal
```

![two types of portal](https://static-docs.nocobase.com/20260804091849.png)

Khác biệt cụ thể:

| | Portal không cần code | AI Portal |
| --- | --- | --- |
| Đường dẫn truy cập | `/v/<name>` | `/x/<name>` |
| Trang đến từ đâu | Cấu hình ngay trên giao diện, AI có thể hỗ trợ sửa cấu hình | Mã nguồn React, do AI Agent viết |
| Sản phẩm đầu ra | Cấu hình lưu trong cơ sở dữ liệu | Mã nguồn có thể commit vào Git |
| Cách lặp | Click trên giao diện, hoặc để AI sửa cấu hình | Sửa code, `dev` → `deploy` |
| Quản lý phiên bản | Lưu snapshot qua [Quản lý phiên bản](./version-control.md) | Git, hoặc NocoBase source storage |
| Mức độ tự do của giao diện | Bị ràng buộc bởi năng lực của Block, bố cục và tương tác theo khuôn có sẵn | Muốn làm thành gì cũng được |
| Năng lực có sẵn | Các Block như dashboard, calendar, kanban dùng được ngay | Tham khảo mã nguồn template chuẩn chúng tôi cung cấp, hoặc để AI Agent tự triển khai |
| Ngưỡng để bắt đầu | Cần hiểu về Block, Field... của NocoBase | Cần có chút hiểu biết về việc dùng AI Agent |
| Phù hợp với | CRUD tiêu chuẩn, hệ thống quản trị nội bộ | Tương tác tùy chỉnh, hệ thống nghiệp vụ phức tạp, yêu cầu riêng về hình ảnh |

Với những trường hợp sau, Portal không cần code là đủ:

- Cấu trúc trang rất tiêu chuẩn, chỉ là bảng cộng biểu mẫu thông thường, cấu hình một chút còn nhanh hơn viết code
- Cần để người dùng nghiệp vụ không viết code tự điều chỉnh trang
- Bạn chỉ muốn dùng các năng lực Block tích hợp sẵn của NocoBase, ví dụ dashboard, calendar view, kanban view
- Bạn dựng một mình, hoặc không cần nhiều người cùng xây dựng

Các tình huống còn lại chúng tôi khuyến nghị dùng [AI Portal](./ai-portal/index.md) để xây dựng. Với cách xây dựng Portal không cần code, AI phải học quá nhiều ngữ cảnh — kiểu Block, cấu trúc cấu hình, quy tắc liên động... và với những hệ thống nghiệp vụ cần xây dựng phức tạp thì hiệu suất xây dựng, khả năng bảo trì lẫn việc phối hợp nhiều người đều chưa lý tưởng.

Vì vậy chúng tôi đổi hướng tiếp cận: **viết code frontend là việc AI giỏi nhất**, cứ để nó làm đúng việc nó giỏi. NocoBase đóng vai trò nền tảng của phần lõi hệ thống, còn frontend thì giao cho AI tự do phát huy. Cùng một nhu cầu, tốc độ nhanh hơn mà kết quả cũng tốt hơn. **AI tự do phát huy, NocoBase lo phần tin cậy.**

Hai cách này cũng có thể dùng lẫn: hệ thống quản trị nội bộ thì cấu hình nhanh bằng Portal không cần code, còn cổng khách hàng đối ngoại thì tùy chỉnh kỹ bằng AI Portal — chúng nằm trong cùng một ứng dụng, dùng chung một bộ dữ liệu và người dùng.

## Bắt đầu nhanh

::: warning Lưu ý
Nếu muốn thử xây dựng AI Portal, hãy cài phiên bản alpha của NocoBase CLI (`npm install -g @nocobase/cli@alpha`).
:::

Nếu bạn đã cài [NocoBase CLI](../ai/quick-start.md), có thể bỏ qua bước này.

### Cài đặt một phát qua AI

Sao chép câu lệnh dưới đây cho trợ lý AI của bạn (Claude Code, Codex, Cursor, Trae...), nó sẽ tự động hoàn tất việc cài đặt và cấu hình:

```
Giúp tôi cài đặt NocoBase CLI và hoàn thành khởi tạo: https://docs.nocobase.com/vi/ai/ai-quick-start.md (vui lòng truy cập trực tiếp nội dung của link)
```

### Cài đặt thủ công

```bash
npm install -g @nocobase/cli@alpha
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

### Dựng xong một cột mốc, AI lưu giúp bạn một phiên bản có thể khôi phục

Sau khi hoàn thành một trang, một nhóm bảng dữ liệu hoặc một workflow, hãy để AI lưu trạng thái hiện tại thành phiên bản — nếu cấu hình bị hỏng, bạn luôn có thể quay lại cột mốc rõ ràng gần nhất.

```
Lưu kết quả xây dựng hiện tại thành phiên bản: đã hoàn thành trang quản lý khách hàng, vùng lọc và form chỉnh sửa
```

![AI tạo phiên bản sau khi dựng ứng dụng](https://static-docs.nocobase.com/20260611115804.png)

AI không lưu phiên bản mỗi khi thay đổi một trường; nó chỉ lưu sau khi hoàn thành và kiểm chứng một cột mốc rõ ràng, giúp danh sách phiên bản dễ đọc hơn và dễ quyết định nên quay lại đâu.

Để tìm hiểu thêm về quản lý phiên bản, vui lòng xem [Quản lý phiên bản](./version-control).

### Sắp xếp Workflow tự động chỉ bằng một câu nói

Mô tả điều kiện kích hoạt và logic xử lý của quy trình nghiệp vụ, AI sẽ tự động tạo trigger và chuỗi Node.

```
Sắp xếp giúp tôi một Workflow tự động trừ tồn kho hàng hóa sau khi tạo Order
```

![Workflow trừ tồn kho khi tạo Order](https://static-docs.nocobase.com/20260419234303.png)

Để tìm hiểu thêm về cách dùng Workflow, vui lòng xem [Quản lý Workflow](./workflow).

### Mô tả trang bằng ngôn ngữ nghiệp vụ, AI xây dựng giúp bạn

NocoBase mặc định cung cấp sẵn một **AI Portal** và một **Portal không cần code**. Không cần học quy tắc cấu hình, hãy nói trực tiếp bạn muốn trang như thế nào — ô tìm kiếm, bảng, điều kiện lọc, cứ nói ra là có.

![portal manage](https://static-docs.nocobase.com/20260804104517.png)

Nếu xây dựng qua Portal không cần code (Portal mặc định tên là admin), tham khảo như sau:

```
Tạo cho tôi trang quản lý Customer trong admin, gồm ô tìm kiếm theo tên và bảng customer, bảng hiển thị tên, số điện thoại, email, thời gian tạo
```

![Trang quản lý Customer](https://static-docs.nocobase.com/20260420100608.png)

Nếu xây dựng theo cách AI Portal (Portal mặc định tên là main), tham khảo như sau:

```
Tạo cho tôi trang quản lý Customer trong main portal, gồm ô tìm kiếm và bảng customer, bảng hiển thị tên, số điện thoại, ngành nghề
```

![trang portal](https://static-docs.nocobase.com/20260803204422.png)

Để tìm hiểu thêm về cách dùng cấu hình giao diện, vui lòng xem [Cấu hình giao diện](./ui-builder) hoặc [Xây dựng AI Portal](./ai-portal/index.md).

## Bảo mật và kiểm toán

Trước khi để AI Agent thao tác trên NocoBase, khuyến nghị tìm hiểu về phương thức xác thực, kiểm soát quyền và kiểm toán thao tác — đảm bảo AI chỉ làm những việc nên làm và mỗi bước đều có ghi chép. Vui lòng xem [Bảo mật và kiểm toán](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) là gói kiến thức chuyên ngành có thể cài vào AI Agent, giúp AI hiểu được hệ thống cấu hình của NocoBase. NocoBase cung cấp nhiều Skills, bao quát toàn bộ quy trình xây dựng:

- [Quản lý môi trường](./env-bootstrap) — Kiểm tra môi trường, cài đặt triển khai, nâng cấp và chẩn đoán sự cố
- [Mô hình hóa dữ liệu](./data-modeling) — Tạo và quản lý bảng, Field, quan hệ liên kết
- [Cấu hình giao diện](./ui-builder) — Tạo và chỉnh sửa trang, Block, popup, tương tác liên động
- [Quản lý Workflow](./workflow) — Tạo, chỉnh sửa, kích hoạt và chẩn đoán Workflow
- [Cấu hình quyền](./acl) — Quản lý vai trò, chính sách quyền, gán người dùng và đánh giá rủi ro
- [Giải pháp](./dsl-reconciler) — Xây dựng nguyên cả hệ thống nghiệp vụ hàng loạt từ YAML
- [Quản lý Plugin](./plugin-manage) — Xem, kích hoạt và tắt Plugin
- [Quản lý phát hành](./publish) — Phát hành đa môi trường, sao lưu khôi phục và di chuyển
- [Quản lý phiên bản](./version-control) — Lưu phiên bản có thể khôi phục sau các mốc đã hoàn thành
- [Xây dựng AI Portal](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - Để AI Agent viết code trong AI Portal nhằm xây dựng giao diện hệ thống

:::tip Mẹo

NocoBase CLI sẽ tự động cài Skills trong quá trình khởi tạo (`nb init`), bạn không cần cài thủ công.

:::

## Liên kết liên quan

- [AI Portal](./ai-portal/index.md) — Cách xây dựng khác, để AI Agent viết thẳng code frontend
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [Tài liệu tham khảo NocoBase CLI](../api/cli/index.md) — Hướng dẫn đầy đủ các tham số của tất cả lệnh
- [Phát triển Plugin bằng AI](../ai-dev/index.md) — Sử dụng AI để hỗ trợ phát triển Plugin NocoBase
- [Bảo mật và kiểm toán](./security) — Phương thức xác thực, kiểm soát quyền và kiểm toán thao tác
- [Nhân viên AI](../ai-employees/index.md) — Năng lực Agent của NocoBase, hỗ trợ cộng tác và thực thi thao tác ngay trong giao diện nghiệp vụ
