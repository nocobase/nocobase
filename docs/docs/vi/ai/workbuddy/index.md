---
title: "Giải phóng đôi tay, dùng WorkBuddy để điều khiển NocoBase"
description: "Điều khiển NocoBase từ xa qua WorkBuddy của Tencent, hỗ trợ tích hợp với nhiều nền tảng như WeChat Work, Lark, DingTalk."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeChat Work,Lark,DingTalk,Điều khiển từ xa"
sidebar: false
---

:::warning Đang biên soạn

Nội dung trang này đang được biên soạn, một số phần có thể chưa hoàn chỉnh hoặc có thay đổi.

:::

# Giải phóng đôi tay, dùng WorkBuddy để điều khiển NocoBase

[WorkBuddy](https://www.codebuddy.cn) là AI Agent thông minh đa kịch bản dành cho công việc do Tencent phát hành — chỉ cần mô tả nhu cầu một câu, nó có thể tự lập kế hoạch các bước và thực thi. Sau khi tích hợp với NocoBase, bạn có thể điều khiển hệ thống nghiệp vụ từ xa trên các nền tảng như WeChat Work, Lark, DingTalk, không cần mở trình duyệt cũng có thể hoàn thành các thao tác quản lý hằng ngày.

<!-- Cần một ảnh chụp màn hình hội thoại WorkBuddy thao tác với NocoBase trong WeChat Work -->

## WorkBuddy là gì

WorkBuddy là "bàn làm việc desktop AI Agent thông minh đa kịch bản dành cho công việc" do Tencent phát hành. Khác với các công cụ hội thoại AI thông thường, WorkBuddy sau khi nhận tác vụ sẽ tự động phân rã, lập kế hoạch, thực thi và bàn giao kết quả có thể nghiệm thu — không cần bạn phải hướng dẫn từng bước.

Đặc điểm chính:

- **Tự lập kế hoạch và thực thi** — Sau khi nhận tác vụ tự động phân rã các bước, thực thi từng bước, bàn giao kết quả hoàn chỉnh
- **Tích hợp đa nền tảng** — Hỗ trợ các nền tảng văn phòng phổ biến trong nước như WeChat Work, Lark, DingTalk, QQ
- **Hơn 20 Skill tích hợp sẵn** — Tạo tài liệu, phân tích dữ liệu, làm PPT, soạn email và nhiều tính năng khác sẵn sàng sử dụng
- **Thao tác file cục bộ** — Có thể đọc và xử lý các file cục bộ mà bạn cấp quyền

Nói đơn giản, các công cụ AI truyền thống chỉ đưa gợi ý cho bạn tự thao tác, WorkBuddy trực tiếp làm xong cho bạn.

| AI hội thoại truyền thống | WorkBuddy |
| ---------------- | ---------------------- |
| Chỉ trò chuyện, đưa gợi ý | Có thể thực sự thực thi tác vụ |
| Cần thao tác file thủ công | Tự động thao tác file cục bộ |
| Tác vụ đơn giản một bước | Tự động phân rã các tác vụ phức tạp đa bước |
| Đầu ra là phản hồi văn bản | Bàn giao kết quả có thể nghiệm thu |

## Vì sao chọn WorkBuddy

Nếu bạn đang phân vân chọn AI Agent nào để vận hành NocoBase, dưới đây là các tình huống WorkBuddy phù hợp nhất:

- **Đội nhóm dùng WeChat Work / Lark / DingTalk** — WorkBuddy hỗ trợ các nền tảng văn phòng trong nước rộng nhất, độ phủ lớn nhất
- **Cần điều khiển NocoBase từ thiết bị di động** — Khi đi ra ngoài có thể quản lý hệ thống bất cứ lúc nào, không bị giới hạn bởi thiết bị
- **Mong muốn dùng được ngay** — Sản phẩm của Tencent, hơn 20 Skill tích hợp sẵn, ngưỡng cấu hình thấp
- **Tập trung vào tự động hóa tác vụ** — WorkBuddy giỏi tự động phân rã và thực thi tác vụ đa bước, phù hợp cho vận hành và quản lý hằng ngày

## Nguyên lý kết nối

WorkBuddy phối hợp với NocoBase theo cách sau:

```
Bạn (WeChat Work / Lark / DingTalk / ...)
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills (giúp Agent hiểu hệ thống cấu hình của NocoBase)
        │
        └── NocoBase CLI (thực thi các thao tác như tạo, sửa, deploy)
              │
              └─→ Dịch vụ NocoBase (hệ thống nghiệp vụ của bạn)
```

Bạn gửi lệnh trên bất kỳ nền tảng được hỗ trợ nào, WorkBuddy sẽ thực hiện thao tác trên NocoBase ở backend qua Skills và CLI, kết quả được đẩy realtime về cửa sổ hội thoại của bạn.

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị các môi trường sau:

- Tài khoản WorkBuddy ([Đăng ký](https://www.codebuddy.cn))
- Node.js >= 22 (để chạy NocoBase CLI và Skills)
- Nếu đã có NocoBase, **do năng lực AI được lặp nhanh chóng, hiện tại chỉ phiên bản beta mới nhất hỗ trợ trải nghiệm đầy đủ, yêu cầu phiên bản tối thiểu >= 2.1.0-beta.20, khuyến nghị mạnh mẽ cập nhật lên phiên bản mới nhất.**

:::warning Lưu ý

WorkBuddy hiện đang trong quá trình lặp nhanh, một số tính năng có thể thay đổi. Khuyến nghị theo dõi [Tài liệu chính thức của WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) để cập nhật thông tin mới nhất.

:::

## Bắt đầu nhanh

### Cài đặt một phát qua AI

Sao chép câu lệnh sau cho WorkBuddy, nó sẽ tự động hoàn tất việc cài NocoBase CLI, khởi tạo và cấu hình môi trường:

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

<!-- TODO: Tổng hợp 5-8 câu hỏi thường gặp. Ví dụ: WorkBuddy hỗ trợ những nền tảng nào, hạn mức miễn phí bao nhiêu, cách xử lý khi thao tác thất bại, nhiều người có thể cùng dùng một WorkBuddy để điều khiển cùng một NocoBase không... -->

## Liên kết liên quan

- [NocoBase CLI](../quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Gói kiến thức chuyên ngành có thể cài vào AI Agent
- [Bắt đầu nhanh với AI Builder](../../ai-builder/index.md) — Sử dụng AI để xây dựng ứng dụng NocoBase từ đầu
- [Tài liệu chính thức của WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) — Hướng dẫn sử dụng đầy đủ WorkBuddy
- [OpenClaw + NocoBase](../openclaw/index.md) — AI Agent mã nguồn mở phổ biến nhất thế giới, triển khai một thao tác trên Lark
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Tự động đúc kết Skill, càng dùng càng hiểu hệ thống nghiệp vụ của bạn
