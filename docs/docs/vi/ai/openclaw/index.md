---
title: "OpenClaw + NocoBase: AI Agent hot nhất hiện nay làm việc giúp bạn"
description: "Tích hợp OpenClaw - AI Agent mã nguồn mở phổ biến nhất thế giới vào NocoBase, sử dụng ngôn ngữ tự nhiên để vận hành hệ thống nghiệp vụ qua Skills và CLI."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,Ngôn ngữ tự nhiên"
sidebar: false
---

:::warning Đang biên soạn

Nội dung trang này đang được biên soạn, một số phần có thể chưa hoàn chỉnh hoặc có thay đổi.

:::

# OpenClaw + NocoBase: AI Agent hot nhất hiện nay làm việc giúp bạn

[OpenClaw](https://github.com/openclaw/openclaw) là framework AI Agent mã nguồn mở phổ biến nhất thế giới — không chỉ trò chuyện, mà còn thực sự thực thi tác vụ. Sau khi tích hợp với NocoBase, bạn có thể dùng ngôn ngữ tự nhiên để tạo bảng, xây trang, cấu hình Workflow, thậm chí để nó tự chạy 24/7, liên tục bảo trì hệ thống nghiệp vụ của bạn.

<!-- Cần một ảnh chụp màn hình hội thoại OpenClaw thao tác với NocoBase trong Lark -->

## OpenClaw là gì

OpenClaw là framework AI Agent mã nguồn mở do lập trình viên Peter Steinberger tạo ra, là một trong những dự án AI Agent hot nhất thế giới hiện nay (hơn 300k Star trên GitHub). Định vị của nó là "trợ lý AI có thể bắt tay vào làm việc". Khác với các công cụ hội thoại như ChatGPT, Claude, OpenClaw có bốn đặc điểm chính:

- **Khả năng thực thi** — Sau khi nhận lệnh ngôn ngữ tự nhiên sẽ tự động hoàn thành tác vụ, không chỉ đưa ra gợi ý
- **Bộ nhớ liên phiên** — Có thể nhớ sở thích và thói quen sử dụng của bạn, càng dùng càng quen tay
- **Hệ sinh thái Skills** — Mở rộng năng lực bằng cách cài Skills, giống như "dạy kỹ năng mới" cho trợ lý
- **Chạy 24/7** — Hỗ trợ tác vụ định kỳ, báo cáo chủ động, không cần bạn phải theo dõi liên tục

OpenClaw hỗ trợ Lark, Telegram, Discord và hơn 26 nền tảng khác, bạn có thể trò chuyện trực tiếp với nó ngay trong các công cụ làm việc hằng ngày. Người dùng Lark còn có thể triển khai chỉ bằng một thao tác, không cần bất kỳ kiến thức kỹ thuật nào.

## Vì sao chọn OpenClaw

Nếu bạn đang phân vân chọn AI Agent nào để vận hành NocoBase, dưới đây là các tình huống OpenClaw phù hợp nhất:

- **Cần bắt đầu không rào cản** — Người dùng Lark có thể triển khai chỉ bằng một thao tác, không cần tự dựng server
- **Đội nhóm dùng Lark để làm việc** — OpenClaw tích hợp sâu với Lark, các trải nghiệm như sinh streaming tin nhắn, @bot trong group đều rất mượt
- **Cần online 24/7** — OpenClaw triển khai trên cloud, không bị ảnh hưởng bởi trạng thái máy tính cá nhân
- **Coi trọng hệ sinh thái cộng đồng** — OpenClaw có cộng đồng Skills lớn nhất, ngoài NocoBase còn có rất nhiều skill khác có thể sử dụng

## Nguyên lý kết nối

OpenClaw phối hợp với NocoBase theo cách sau:

```
Bạn (Lark / Telegram / ...)
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills (giúp Agent hiểu hệ thống cấu hình của NocoBase)
        │
        └── NocoBase CLI (thực thi các thao tác như tạo, sửa, deploy)
              │
              └─→ Dịch vụ NocoBase (hệ thống nghiệp vụ của bạn)
```

- **NocoBase Skills** — Gói kiến thức chuyên ngành, giúp OpenClaw biết cách thao tác trên NocoBase
- **NocoBase CLI** — Công cụ dòng lệnh, thực thi các thao tác như mô hình hóa dữ liệu, xây dựng trang
- **Dịch vụ NocoBase** — Bản NocoBase đang chạy của bạn

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị các môi trường sau:

- Đã triển khai OpenClaw Agent ([Triển khai một thao tác trên Lark](https://openclaw.feishu.cn) hoặc triển khai cục bộ)
- Node.js >= 22 (để chạy NocoBase CLI và Skills)
- Nếu đã có NocoBase, **do năng lực AI được lặp nhanh chóng, hiện tại chỉ phiên bản beta mới nhất hỗ trợ trải nghiệm đầy đủ, yêu cầu phiên bản tối thiểu >= 2.1.0-beta.20, khuyến nghị mạnh mẽ cập nhật lên phiên bản mới nhất.**

:::warning Lưu ý

Khi cài Skills bên thứ ba vui lòng chú ý an toàn — ưu tiên sử dụng Skills từ nguồn chính thức hoặc đáng tin cậy, tránh cài skill cộng đồng chưa được kiểm duyệt.

:::

## Bắt đầu nhanh

### Cài đặt một phát qua AI

Sao chép câu lệnh sau cho OpenClaw, nó sẽ tự động hoàn tất việc cài NocoBase CLI, khởi tạo và cấu hình môi trường:

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

<!-- TODO: Tổng hợp 5-8 câu hỏi thường gặp. Ví dụ: Skills cài thất bại thì sao, cách cập nhật phiên bản Skills, OpenClaw hỗ trợ các mô hình nào, thao tác lỗi cách rollback... -->

## Liên kết liên quan

- [NocoBase CLI](../quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Gói kiến thức chuyên ngành có thể cài vào AI Agent
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — Sử dụng AI để xây dựng ứng dụng NocoBase từ đầu
- [Hướng dẫn triển khai OpenClaw trên Lark](https://openclaw.feishu.cn) — Triển khai OpenClaw lên Lark chỉ bằng một thao tác
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Tự động đúc kết Skill, càng dùng càng hiểu hệ thống nghiệp vụ của bạn
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Điều khiển NocoBase từ xa qua nhiều nền tảng như WeChat Work, Lark, DingTalk
