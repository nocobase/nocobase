---
title: "Claude Code + NocoBase: Bộ não AI mạnh nhất, kiến trúc sư trưởng NocoBase của bạn"
description: "Tích hợp trợ lý lập trình AI chính thức của Anthropic - Claude Code vào NocoBase, sử dụng ngôn ngữ tự nhiên để vận hành hệ thống nghiệp vụ qua Skills và CLI."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,Ngôn ngữ tự nhiên"
sidebar: false
---

:::warning Đang biên soạn

Nội dung trang này đang được biên soạn, một số phần có thể chưa hoàn chỉnh hoặc có thay đổi.

:::

# Claude Code + NocoBase: Bộ não AI mạnh nhất, kiến trúc sư trưởng NocoBase của bạn

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) là trợ lý lập trình AI chính thức của Anthropic — chạy trực tiếp trên terminal, có thể hiểu toàn bộ codebase của bạn và giúp bạn hoàn thành nhiều tác vụ từ viết code đến xây dựng hệ thống. Sau khi tích hợp với NocoBase, bạn có thể sử dụng ngôn ngữ tự nhiên để tạo bảng, xây dựng trang, cấu hình Workflow, tận hưởng trải nghiệm xây dựng được mang lại bởi mô hình AI mạnh mẽ nhất.

<!-- Cần một ảnh chụp màn hình Claude Code thao tác với NocoBase trên terminal -->

## Claude Code là gì

Claude Code là AI Agent dạng CLI do Anthropic phát triển, phía sau là dòng mô hình Claude. Nó chạy trực tiếp trên terminal, có thể hiểu ngữ cảnh dự án và thực thi các thao tác. Đặc điểm chính:

- **Năng lực mô hình hàng đầu** — Dựa trên Claude Opus / Sonnet, dẫn đầu về khả năng hiểu và sinh code
- **Native trên terminal** — Chạy trực tiếp trên terminal, kết hợp liền mạch với quy trình làm việc của lập trình viên
- **Nhận biết dự án** — Tự động hiểu cấu trúc dự án, các phụ thuộc và quy chuẩn code
- **Cộng tác đa công cụ** — Hỗ trợ đọc/ghi file, thực thi lệnh, tìm kiếm code và nhiều thao tác khác

Claude Code còn hỗ trợ tích hợp với VS Code, JetBrains và các IDE khác, cũng có thể dùng dưới dạng ứng dụng desktop và web độc lập.

## Vì sao chọn Claude Code

Nếu bạn đang phân vân chọn AI Agent nào để vận hành NocoBase, dưới đây là các tình huống Claude Code phù hợp nhất:

- **Theo đuổi năng lực mô hình mạnh mẽ nhất** — Dòng mô hình Claude xuất sắc trong suy luận phức tạp và sinh code
- **Quy trình làm việc hằng ngày của lập trình viên** — Native trên terminal, kết hợp liền mạch với IDE, Git, npm và các công cụ của bạn
- **Cần hiểu sâu về dự án** — Claude Code tự động phân tích cấu trúc dự án và đưa ra gợi ý phù hợp với ngữ cảnh
- **Vừa xây dựng vừa phát triển** — Vừa giúp bạn xây ứng dụng NocoBase, vừa hỗ trợ phát triển Plugin tùy chỉnh

## Nguyên lý kết nối

Claude Code phối hợp với NocoBase theo cách sau:

```
Bạn (terminal / VS Code / JetBrains / ...)
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills (giúp Agent hiểu hệ thống cấu hình của NocoBase)
        │
        └── NocoBase CLI (thực thi các thao tác như tạo, sửa, deploy)
              │
              └─→ Dịch vụ NocoBase (hệ thống nghiệp vụ của bạn)
```

- **NocoBase Skills** — Gói kiến thức chuyên ngành, giúp Claude Code biết cách thao tác trên NocoBase
- **NocoBase CLI** — Công cụ dòng lệnh, thực thi các thao tác như mô hình hóa dữ liệu, xây dựng trang
- **Dịch vụ NocoBase** — Bản NocoBase đang chạy của bạn

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị các môi trường sau:

- Đã cài Claude Code (`npm install -g @anthropic-ai/claude-code`)
- Node.js >= 22 (để chạy NocoBase CLI và Skills)
- Nếu đã có NocoBase, **do năng lực AI được lặp nhanh chóng, hiện tại chỉ phiên bản beta mới nhất hỗ trợ trải nghiệm đầy đủ, yêu cầu phiên bản tối thiểu >= 2.1.0-beta.20, khuyến nghị mạnh mẽ cập nhật lên phiên bản mới nhất.**

## Bắt đầu nhanh

### Cài đặt một phát qua AI

Sao chép câu lệnh sau cho Claude Code, nó sẽ tự động hoàn tất việc cài NocoBase CLI, khởi tạo và cấu hình môi trường:

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

<!-- TODO: Tổng hợp 5-8 câu hỏi thường gặp. Ví dụ: cách cấu hình API Key, Claude Code hỗ trợ các mô hình nào, cách dùng trong VS Code, Skills cài thất bại thì sao... -->

## Liên kết liên quan

- [NocoBase CLI](../quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Gói kiến thức chuyên ngành có thể cài vào AI Agent
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — Sử dụng AI để xây dựng ứng dụng NocoBase từ đầu
- [Tài liệu chính thức của Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Hướng dẫn sử dụng đầy đủ Claude Code
- [OpenClaw + NocoBase](../openclaw/index.md) — AI Agent mã nguồn mở phổ biến nhất thế giới, triển khai một thao tác trên Lark
- [Codex + NocoBase](../codex/index.md) — Trợ lý lập trình AI chính thức của OpenAI
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent terminal mã nguồn mở, hỗ trợ hơn 75 mô hình
