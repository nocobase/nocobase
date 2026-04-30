---
title: "Bắt đầu nhanh với AI Development Plugin"
description: "Phát triển plugin NocoBase với sự hỗ trợ của AI: chỉ cần mô tả nhu cầu bằng một câu, hệ thống sẽ tự động sinh mã frontend/backend, bảng dữ liệu, cấu hình quyền và quốc tế hóa."
keywords: "AI Development,AI Development,NocoBase AI,phát triển plugin,lập trình AI,Skills,bắt đầu nhanh"
---

# Bắt đầu nhanh với AI Development Plugin

AI Development Plugin là khả năng phát triển plugin có sự hỗ trợ của AI do NocoBase cung cấp — bạn có thể mô tả nhu cầu bằng ngôn ngữ tự nhiên, AI sẽ tự động sinh mã frontend và backend hoàn chỉnh, bao gồm bảng dữ liệu, API, Block frontend, quyền và quốc tế hóa. Mang đến trải nghiệm phát triển plugin hiện đại và hiệu quả hơn.

Khả năng AI Development Plugin được xây dựng dựa trên Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Nếu bạn đã khởi tạo qua NocoBase CLI (`nb init`), Skill này sẽ được cài đặt tự động.

## Bắt đầu nhanh

Nếu bạn đã cài đặt [NocoBase CLI](../ai/quick-start.md), có thể bỏ qua bước này.

### Cài đặt AI một bước

Sao chép đoạn prompt bên dưới gửi cho trợ lý AI của bạn (Claude Code, Codex, Cursor, Trae, v.v.) để hoàn tất cài đặt và cấu hình tự động:

```
Hãy giúp tôi cài đặt NocoBase CLI và hoàn tất khởi tạo: https://docs.nocobase.com/cn/ai/ai-quick-start.md (vui lòng truy cập trực tiếp nội dung liên kết)
```

### Cài đặt thủ công

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Trình duyệt sẽ tự động mở trang cấu hình trực quan, hướng dẫn bạn cài đặt NocoBase Skills, cấu hình cơ sở dữ liệu và khởi động ứng dụng. Xem các bước chi tiết tại [Bắt đầu nhanh](../ai/quick-start.md).

:::warning Lưu ý

- NocoBase đang chuyển từ `client` (v1) sang `client-v2`, hiện `client-v2` vẫn đang trong quá trình phát triển. Mã client do AI Development sinh ra dựa trên `client-v2`, chỉ có thể dùng dưới đường dẫn `/v2/`, dùng để trải nghiệm trước, không khuyến nghị dùng trực tiếp trong môi trường production.
- Mã do AI sinh ra không phải lúc nào cũng đúng 100%, khuyến nghị review trước khi enable. Nếu gặp vấn đề khi runtime, có thể gửi thông báo lỗi cho AI để nó tiếp tục kiểm tra và sửa — thường vài lượt trao đổi là giải quyết được.
- Khuyến nghị dùng các mô hình lớn họ GPT hoặc Claude để phát triển, hiệu quả tốt nhất. Các mô hình khác cũng có thể dùng, tuy nhiên chất lượng sinh có thể có sự khác biệt.

:::

## Từ một câu mô tả đến một plugin hoàn chỉnh

Sau khi cài đặt, bạn có thể trực tiếp dùng ngôn ngữ tự nhiên để nói với AI bạn muốn phát triển plugin gì. Dưới đây là một vài tình huống thực tế, để bạn cảm nhận khả năng của AI Development Plugin.

### Phát triển plugin watermark bằng một câu

Chỉ với một câu prompt, AI có thể giúp bạn sinh một plugin watermark hoàn chỉnh — bao gồm logic render frontend, kiểm tra chống can thiệp, API lưu cài đặt backend và trang cài đặt plugin.

```
Hãy dùng nocobase-plugin-development skill để phát triển một plugin watermark cho NocoBase,
yêu cầu: phủ watermark bán trong suốt lên trang, hiển thị tên Người dùng đang đăng nhập, ngăn chặn rò rỉ qua chụp màn hình.
Định kỳ kiểm tra DOM của watermark có bị xóa hay không, nếu bị xóa thì sinh lại.
Trong trang cài đặt plugin hỗ trợ cấu hình nội dung watermark, độ trong suốt và cỡ chữ.
Tên plugin là @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

Toàn bộ quá trình bạn chỉ cần mô tả nhu cầu và đưa ra quyết định, phần còn lại AI sẽ tự xử lý. Muốn xem toàn bộ quá trình? → [Thực hành: Phát triển plugin watermark](./watermark-plugin)

### Tạo một component Field tùy chỉnh bằng một câu

Bạn muốn Field kiểu integer hiển thị thành dạng đánh giá sao? Nói cho AI hiệu ứng hiển thị bạn muốn, AI sẽ giúp bạn sinh một FieldModel tùy chỉnh, thay thế component render Field mặc định.

```
Hãy dùng nocobase-plugin-development skill để giúp tôi phát triển một plugin NocoBase, tên là @my-scope/plugin-rating,
tạo một component hiển thị Field tùy chỉnh (FieldModel), render Field kiểu integer thành biểu tượng ngôi sao,
hỗ trợ 1-5 điểm, click vào sao có thể trực tiếp sửa giá trị đánh giá và lưu vào cơ sở dữ liệu.
```

![Hiệu ứng hiển thị component Rating](https://static-docs.nocobase.com/20260422170712.png)

Muốn tìm hiểu thêm cách dùng các khả năng, xem [Các khả năng được hỗ trợ](./capabilities).

## AI có thể giúp bạn làm gì

| Tôi muốn…                       | AI có thể giúp bạn                                              |
| ------------------------------- | --------------------------------------------------------------- |
| Tạo một plugin mới              | Sinh scaffold hoàn chỉnh, bao gồm cấu trúc thư mục frontend/backend |
| Định nghĩa bảng dữ liệu          | Sinh định nghĩa Collection, hỗ trợ tất cả kiểu Field và quan hệ liên kết |
| Tạo một Block tùy chỉnh         | Sinh BlockModel + bảng cấu hình + đăng ký vào menu "Thêm Block" |
| Tạo một Field tùy chỉnh         | Sinh FieldModel + ràng buộc với interface Field                 |
| Thêm nút Action tùy chỉnh       | Sinh ActionModel + popup/drawer/hộp xác nhận                    |
| Tạo trang cài đặt plugin        | Sinh form frontend + API backend + lưu trữ                      |
| Viết API tùy chỉnh              | Sinh Resource Action + đăng ký route + cấu hình ACL             |
| Cấu hình quyền                  | Sinh quy tắc ACL, kiểm soát truy cập theo vai trò               |
| Hỗ trợ đa ngôn ngữ              | Tự động sinh language pack tiếng Trung và tiếng Anh             |
| Viết script nâng cấp            | Sinh Migration, hỗ trợ DDL và migration dữ liệu                 |

Mô tả chi tiết và prompt mẫu của từng khả năng → [Các khả năng được hỗ trợ](./capabilities)

## Liên kết liên quan

- [Thực hành: Phát triển plugin watermark](./watermark-plugin) — Case thực hành đầy đủ về AI Development Plugin, từ một câu đến plugin có thể dùng được
- [Các khả năng được hỗ trợ](./capabilities) — Tất cả những việc AI có thể giúp bạn, kèm prompt mẫu
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
- [Tham chiếu NocoBase CLI](../api/cli/index.md) — Mô tả tham số đầy đủ của tất cả lệnh
- [Phát triển Plugin](../plugin-development/index.md) — Hướng dẫn đầy đủ về phát triển plugin NocoBase
- [Bắt đầu nhanh AI Builder](../ai-builder/index.md) — Dùng AI để xây dựng ứng dụng NocoBase (không cần viết code)
