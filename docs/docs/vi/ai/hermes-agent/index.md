---
title: "Hermes Agent: Trợ lý NocoBase càng dùng càng hiểu bạn"
description: "Tích hợp Hermes Agent vào NocoBase, qua bộ nhớ liên phiên và đúc kết Skill tự động, để AI ngày càng hiểu rõ hệ thống nghiệp vụ của bạn."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,Tự học,Tự host"
sidebar: false
---

:::warning Đang biên soạn

Nội dung trang này đang được biên soạn, một số phần có thể chưa hoàn chỉnh hoặc có thay đổi.

:::

# Hermes Agent: Trợ lý NocoBase càng dùng càng hiểu bạn

[Hermes Agent](https://github.com/nousresearch/hermes-agent) là AI Agent mã nguồn mở dạng tự host — nó sẽ tự động đúc kết mỗi thao tác thành công thành tài liệu Skill có thể tái sử dụng, càng dùng càng hiểu hệ thống của bạn. Sau khi tích hợp với NocoBase, bạn không chỉ có thể dùng ngôn ngữ tự nhiên để xây và quản lý hệ thống, mà còn có thể để nó dần dần học được quy ước nghiệp vụ và sở thích của bạn.

<!-- Cần một ảnh chụp màn hình terminal hoặc hội thoại Lark của Hermes Agent thao tác với NocoBase -->

## Hermes Agent là gì

Hermes Agent được phát triển bởi Nous Research (35.7k Star trên GitHub), với triết lý cốt lõi là "càng dùng lâu càng thông minh". Khác với các AI Agent khác, Hermes có một cơ chế học vòng kín hoàn chỉnh:

- **Bộ nhớ liên phiên** — Dựa trên tìm kiếm full-text và tóm tắt LLM, có thể truy nguyên ngữ cảnh hội thoại từ vài tuần trước
- **Đúc kết Skill tự động** — Sau khi hoàn thành mỗi tác vụ phức tạp, tự động tạo tài liệu Skill có thể tái sử dụng
- **Liên tục tự cải thiện** — Skill liên tục được tối ưu qua việc sử dụng lặp đi lặp lại, càng dùng càng chính xác
- **Hỗ trợ hơn 400 mô hình** — Tương thích với các nhà cung cấp LLM phổ biến, không bị ràng buộc với mô hình cụ thể

Hermes hỗ trợ Lark, Telegram, Discord, Slack và 8 nền tảng khác, cũng có thể dùng trực tiếp trên terminal.

:::tip Mẹo

Hermes Agent chạy trên server của riêng bạn, mọi dữ liệu và bộ nhớ đều lưu trữ cục bộ, phù hợp với các tình huống yêu cầu cao về bảo mật dữ liệu.

:::

## Vì sao chọn Hermes Agent

Nếu bạn đang phân vân chọn AI Agent nào để vận hành NocoBase, dưới đây là các tình huống Hermes phù hợp nhất:

- **Bảo trì lâu dài cùng một hệ thống** — Cơ chế bộ nhớ của Hermes giúp nó càng dùng càng hiểu nghiệp vụ của bạn, không cần giải thích lại ngữ cảnh mỗi lần
- **Đội nhóm có nhu cầu tự host** — Dữ liệu được lưu hoàn toàn cục bộ, không qua dịch vụ cloud bên thứ ba
- **Cần quy chuẩn hóa quy trình thao tác** — Tài liệu Skill được đúc kết tự động bởi Hermes có thể làm sổ tay vận hành cho đội nhóm
- **Thích thao tác trên terminal** — Hermes hỗ trợ tương tác CLI native, phù hợp cho đội ngũ kỹ thuật sử dụng hằng ngày

## Nguyên lý kết nối

Hermes Agent phối hợp với NocoBase theo cách sau:

```
Bạn (Lark / Telegram / terminal / ...)
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills (giúp Agent hiểu hệ thống cấu hình của NocoBase)
        │
        ├── NocoBase CLI (thực thi các thao tác như tạo, sửa, deploy)
        │
        └── Bộ nhớ & tài liệu Skill (đúc kết tự động, tái sử dụng liên tục)
              │
              └─→ Dịch vụ NocoBase (hệ thống nghiệp vụ của bạn)
```

Khác với các Agent khác, Hermes sẽ cập nhật bộ nhớ và tài liệu Skill của mình sau mỗi thao tác. Các thông tin này được lưu trữ cục bộ và tự động tái sử dụng trong các thao tác sau.

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị các môi trường sau:

- Một server chạy Hermes Agent (Linux / macOS, Python 3.10+)
- Node.js >= 22 (để chạy NocoBase CLI và Skills)
- Nếu đã có NocoBase, **do năng lực AI được lặp nhanh chóng, hiện tại chỉ phiên bản beta mới nhất hỗ trợ trải nghiệm đầy đủ, yêu cầu phiên bản tối thiểu >= 2.1.0-beta.20, khuyến nghị mạnh mẽ cập nhật lên phiên bản mới nhất.**

Cài đặt Hermes chỉ cần một dòng lệnh:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Lưu ý

Hermes Agent cần tự triển khai và bảo trì. Nếu bạn muốn không cấu hình và sẵn sàng dùng ngay, có thể cân nhắc [OpenClaw](../openclaw/index.md) (triển khai một thao tác trên Lark) hoặc [WorkBuddy](../workbuddy/index.md) (Tencent host).

:::

## Bắt đầu nhanh

### Cài đặt một phát qua AI

Sao chép câu lệnh sau cho Hermes Agent, nó sẽ tự động hoàn tất việc cài NocoBase CLI, khởi tạo và cấu hình môi trường:

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

<!-- TODO: Tổng hợp 5-8 câu hỏi thường gặp. Ví dụ: file bộ nhớ ở đâu, cách chuyển sang server mới, hỗ trợ những mô hình nào, cách xóa bộ nhớ sai, Hermes và OpenClaw khác nhau thế nào... -->

## Liên kết liên quan

- [NocoBase CLI](../quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Gói kiến thức chuyên ngành có thể cài vào AI Agent
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — Sử dụng AI để xây dựng ứng dụng NocoBase từ đầu
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — Mã nguồn và tài liệu của Hermes Agent
- [OpenClaw + NocoBase](../openclaw/index.md) — AI Agent mã nguồn mở phổ biến nhất thế giới, triển khai một thao tác trên Lark
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Điều khiển NocoBase từ xa qua nhiều nền tảng như WeChat Work, Lark, DingTalk
