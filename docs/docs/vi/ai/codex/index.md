---
title: "Dùng Codex để vận hành NocoBase, vừa xây dựng vừa phát triển"
description: "Tích hợp trợ lý lập trình AI chính thức của OpenAI - Codex vào NocoBase, sử dụng ngôn ngữ tự nhiên để vận hành hệ thống nghiệp vụ qua Skills và CLI."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,Ngôn ngữ tự nhiên"
sidebar: false
---

:::warning Đang biên soạn

Nội dung trang này đang được biên soạn, một số phần có thể chưa hoàn chỉnh hoặc có thay đổi.

:::

# Dùng Codex để vận hành NocoBase, vừa xây dựng vừa phát triển

[Codex](https://github.com/openai/codex) là trợ lý lập trình AI chính thức của OpenAI — chạy trên terminal, có thể đọc/ghi code, thực thi lệnh, giúp bạn hoàn thành nhiều tác vụ từ viết code đến xây dựng hệ thống. Sau khi tích hợp với NocoBase, bạn có thể dùng ngôn ngữ tự nhiên để tạo bảng, xây trang, cấu hình Workflow, tận dụng năng lực của dòng mô hình GPT để xây dựng nhanh chóng hệ thống nghiệp vụ.

<!-- Cần một ảnh chụp màn hình Codex thao tác với NocoBase trên terminal -->

## Codex là gì

Codex là AI Agent dạng CLI do OpenAI phát triển, phía sau là dòng mô hình GPT (bao gồm o3, o4-mini...). Nó chạy trong môi trường sandbox cục bộ, có thể thực thi code và lệnh một cách an toàn. Đặc điểm chính:

- **Được hỗ trợ bởi dòng GPT** — Dựa trên các mô hình mới nhất của OpenAI, giỏi sinh code và lập kế hoạch tác vụ
- **Thực thi sandbox** — Chạy trong sandbox cách ly, an toàn và có thể kiểm soát
- **Hiểu đa phương thức** — Hỗ trợ đầu vào dưới dạng văn bản, hình ảnh, có thể hiểu bố cục UI trong ảnh chụp màn hình
- **Mức độ tự chủ linh hoạt** — Từ chế độ đề xuất đến chế độ tự động hoàn toàn, bạn quyết định mức độ tự chủ của AI

## Vì sao chọn Codex

Nếu bạn đang phân vân chọn AI Agent nào để vận hành NocoBase, dưới đây là các tình huống Codex phù hợp nhất:

- **Đang sử dụng hệ sinh thái OpenAI** — Nếu bạn có gói ChatGPT Plus/Pro hoặc OpenAI API Key, Codex là lựa chọn tự nhiên nhất
- **Coi trọng tính an toàn** — Cơ chế thực thi sandbox đảm bảo các thao tác AI không vô tình ảnh hưởng đến hệ thống của bạn
- **Cần kiểm soát linh hoạt** — Có thể chuyển mức độ tự chủ tùy theo độ phức tạp của tác vụ, tự động hoàn toàn với tác vụ đơn giản, cần xác nhận với thao tác nhạy cảm
- **Thích phong cách mô hình OpenAI** — Dòng GPT có ưu thế riêng trong lập kế hoạch tác vụ và thực thi từng bước

## Nguyên lý kết nối

Codex phối hợp với NocoBase theo cách sau:

```
Bạn (terminal / ...)
  │
  └─→ Codex
        │
        ├── NocoBase Skills (giúp Agent hiểu hệ thống cấu hình của NocoBase)
        │
        └── NocoBase CLI (thực thi các thao tác như tạo, sửa, deploy)
              │
              └─→ Dịch vụ NocoBase (hệ thống nghiệp vụ của bạn)
```

- **NocoBase Skills** — Gói kiến thức chuyên ngành, giúp Codex biết cách thao tác trên NocoBase
- **NocoBase CLI** — Công cụ dòng lệnh, thực thi các thao tác như mô hình hóa dữ liệu, xây dựng trang
- **Dịch vụ NocoBase** — Bản NocoBase đang chạy của bạn

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị các môi trường sau:

- Đã cài Codex (`npm install -g @openai/codex`)
- Node.js >= 22 (để chạy NocoBase CLI và Skills)
- Nếu đã có NocoBase, **do năng lực AI được lặp nhanh chóng, hiện tại chỉ phiên bản beta mới nhất hỗ trợ trải nghiệm đầy đủ, yêu cầu phiên bản tối thiểu >= 2.1.0-beta.20, khuyến nghị mạnh mẽ cập nhật lên phiên bản mới nhất.**

## Bắt đầu nhanh

### Cài đặt một phát qua AI

Sao chép câu lệnh sau cho Codex, nó sẽ tự động hoàn tất việc cài NocoBase CLI, khởi tạo và cấu hình môi trường:

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

<!-- TODO: Tổng hợp 5-8 câu hỏi thường gặp. Ví dụ: cách cấu hình OpenAI API Key, Codex hỗ trợ các mô hình nào, chọn mức độ tự chủ thế nào, Skills cài thất bại thì sao... -->

## Liên kết liên quan

- [NocoBase CLI](../quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Gói kiến thức chuyên ngành có thể cài vào AI Agent
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — Sử dụng AI để xây dựng ứng dụng NocoBase từ đầu
- [Codex GitHub](https://github.com/openai/codex) — Mã nguồn và tài liệu của Codex
- [Claude Code + NocoBase](../claude-code/index.md) — Trợ lý lập trình AI chính thức của Anthropic
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent terminal mã nguồn mở, hỗ trợ hơn 75 mô hình
