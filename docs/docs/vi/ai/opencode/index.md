---
title: "OpenCode + NocoBase: Cách xây dựng NocoBase mã nguồn mở, tự do và không bị ràng buộc"
description: "Tích hợp OpenCode - trợ lý lập trình AI mã nguồn mở vào NocoBase, tự do chọn mô hình, sử dụng ngôn ngữ tự nhiên để vận hành hệ thống nghiệp vụ của bạn."
keywords: "OpenCode,NocoBase,AI Agent,Mã nguồn mở,Đa mô hình,Skills,CLI,Ngôn ngữ tự nhiên"
sidebar: false
---

:::warning Đang biên soạn

Nội dung trang này đang được biên soạn, một số phần có thể chưa hoàn chỉnh hoặc có thay đổi.

:::

# OpenCode + NocoBase: Cách xây dựng NocoBase mã nguồn mở, tự do và không bị ràng buộc

[OpenCode](https://github.com/opencode-ai/opencode) là một AI Agent terminal mã nguồn mở — hỗ trợ hơn 75 mô hình (Claude, GPT, Gemini, DeepSeek...), không bị ràng buộc bởi bất kỳ nhà cung cấp nào, bạn có thể tự do chọn mô hình phù hợp nhất. Sau khi tích hợp với NocoBase, bạn có thể dùng ngôn ngữ tự nhiên để tạo bảng, xây trang, cấu hình Workflow, đồng thời giữ quyền kiểm soát hoàn toàn việc chọn mô hình và chi phí.

<!-- Cần một ảnh chụp màn hình OpenCode thao tác với NocoBase trên terminal -->

## OpenCode là gì

OpenCode được phát triển bởi Anomaly Innovations (hơn 140k Star trên GitHub), định vị là "AI Agent terminal không bị ràng buộc nhà cung cấp". Nó được viết bằng Go, cung cấp giao diện TUI tinh tế. Đặc điểm chính:

- **Hỗ trợ hơn 75 mô hình** — Claude, GPT, Gemini, DeepSeek, mô hình cục bộ..., chuyển đổi tự do
- **Không khóa nhà cung cấp** — Tự mang API Key, trả phí theo lượng dùng thực tế, không cần đăng ký bổ sung
- **Kiến trúc đa Agent** — Tích hợp sẵn 5 vai trò Agent: Build, Plan, Review, Debug, Docs
- **Ưu tiên quyền riêng tư** — Không lưu trữ code hay ngữ cảnh, mọi dữ liệu đều ở cục bộ

OpenCode còn hỗ trợ tích hợp với VS Code, JetBrains, Zed, Neovim và các editor khác, cũng có ứng dụng desktop độc lập.

## Vì sao chọn OpenCode

Nếu bạn đang phân vân chọn AI Agent nào để vận hành NocoBase, dưới đây là các tình huống OpenCode phù hợp nhất:

- **Không muốn bị ràng buộc với một mô hình duy nhất** — Hôm nay dùng Claude, mai chuyển sang GPT, ngày kia thử DeepSeek, một công cụ giải quyết tất cả
- **Coi trọng kiểm soát chi phí** — Tự mang API Key trả phí theo lượng dùng, hỗ trợ sử dụng gói ChatGPT Plus đã có
- **Có yêu cầu về quyền riêng tư** — Code và ngữ cảnh không qua bên thứ ba, hỗ trợ mô hình cục bộ
- **Thích tùy biến cao** — Cấu hình YAML để tùy chỉnh hành vi Agent, đáp ứng nhu cầu đặc biệt của đội nhóm

## Nguyên lý kết nối

OpenCode phối hợp với NocoBase theo cách sau:

```
Bạn (terminal / VS Code / JetBrains / ...)
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills (giúp Agent hiểu hệ thống cấu hình của NocoBase)
        │
        └── NocoBase CLI (thực thi các thao tác như tạo, sửa, deploy)
              │
              └─→ Dịch vụ NocoBase (hệ thống nghiệp vụ của bạn)
```

- **NocoBase Skills** — Gói kiến thức chuyên ngành, giúp OpenCode biết cách thao tác trên NocoBase
- **NocoBase CLI** — Công cụ dòng lệnh, thực thi các thao tác như mô hình hóa dữ liệu, xây dựng trang
- **Dịch vụ NocoBase** — Bản NocoBase đang chạy của bạn

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị các môi trường sau:

- Đã cài OpenCode ([Hướng dẫn cài đặt](https://opencode.ai/docs/))
- Node.js >= 22 (để chạy NocoBase CLI và Skills)
- Nếu đã có NocoBase, **do năng lực AI được lặp nhanh chóng, hiện tại chỉ phiên bản beta mới nhất hỗ trợ trải nghiệm đầy đủ, yêu cầu phiên bản tối thiểu >= 2.1.0-beta.20, khuyến nghị mạnh mẽ cập nhật lên phiên bản mới nhất.**

## Bắt đầu nhanh

### Cài đặt một phát qua AI

Sao chép câu lệnh sau cho OpenCode, nó sẽ tự động hoàn tất việc cài NocoBase CLI, khởi tạo và cấu hình môi trường:

```
Giúp tôi cài đặt NocoBase CLI và hoàn thành khởi tạo: https://docs.nocobase.com/cn/ai/ai-quick-start.md (vui lòng truy cập trực tiếp nội dung của link)
```

### Cài đặt thủ công

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Trình duyệt sẽ tự động mở trang cấu hình trực quan, hướng dẫn bạn cài NocoBase Skills, cấu hình CSDL và khởi động ứng dụng. Các bước chi tiết vui lòng xem [Bắt đầu nhanh](../quick-start.md).

Sau khi cài xong, chạy `nb env list` để xác nhận trạng thái chạy của môi trường:

```bash
nb env list
```

Xác nhận trong output có môi trường đã cấu hình và trạng thái chạy.

## Câu hỏi thường gặp

<!-- TODO: Tổng hợp 5-8 câu hỏi thường gặp. Ví dụ: cách cấu hình API Key cho từng mô hình khác nhau, cách chuyển đổi mô hình, cách dùng mô hình cục bộ, Skills cài thất bại thì sao... -->

## Liên kết liên quan

- [NocoBase CLI](../quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Gói kiến thức chuyên ngành có thể cài vào AI Agent
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — Sử dụng AI để xây dựng ứng dụng NocoBase từ đầu
- [Tài liệu chính thức của OpenCode](https://opencode.ai/docs/) — Hướng dẫn sử dụng đầy đủ OpenCode
- [Claude Code + NocoBase](../claude-code/index.md) — Trợ lý lập trình AI chính thức của Anthropic
- [Codex + NocoBase](../codex/index.md) — Trợ lý lập trình AI chính thức của OpenAI
