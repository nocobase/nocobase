---
title: "Các vấn đề thường gặp khi phát triển plugin Nhân viên AI"
description: "Khắc phục sự cố trong đó thẻ Công cụ, Kỹ năng của nhân viên NocoBase AI, nhân viên tích hợp và Công cụ giao diện người dùng không được đăng ký hoặc thực thi."
keywords: "NocoBase, Câu hỏi thường gặp về nhân viên AI, Công cụ chưa được đăng ký, Kỹ năng chưa được nạp, thẻ giao diện người dùng"
---

# Các vấn đề thường gặp khi phát triển plugin Nhân viên AI

## Công cụ chưa được đăng ký

Kiểm tra theo thứ tự sau:

- Liệu tệp có nằm ở `src/ai/**/tools/` trong phạm vi xây dựng plugin hay không
- Nên sử dụng tệp `.ts` hay `.js`
- Liệu `export default defineTools(...)`
- Có phải tệp Công cụ được đặt tên không chính xác `.d.ts`
- Liệu Tool có cùng tên có xuất hiện khiến các mục đăng ký sau này bị bỏ qua hay không
- Liệu plugin đã được xây dựng lại và tải chưa

## Kỹ năng không xuất hiện

Tên tập tin được kiểm tra đầu tiên. Hiện tại phải là:

```text
SKILLS.md
```

Đồng thời xác nhận rằng frontmatter chứa `name` và `description` ổn định, đồng thời các tệp này nằm ở `src/ai/**/skills/<skill-name>/SKILLS.md`.

## Kỹ năng có thể được tải, nhưng Công cụ không thể được gọi

Kiểm tra các mục sau:

- Danh sách `tools` của Kỹ năng có chứa tên Công cụ hay không
- Công cụ có được đặt trong thư mục `tools/` của Kỹ năng hiện tại hay không
- Tên tệp Công cụ, `definition.name` và tham chiếu Kỹ năng có nhất quán không?
- `scope` phù hợp với phương thức liên kết hiện tại
- Công cụ chưa được đăng ký do tên trùng lặp?

Việc ràng buộc một Công cụ chỉ có nghĩa là mô hình có thể sử dụng nó. Nếu Tool đã xuất hiện trong Skill nhưng model vẫn chưa được gọi thì bạn cần ghi rõ thời gian gọi, yêu cầu tham số và các bước chờ kết quả trong quy trình làm việc của `SKILLS.md`.

## Thẻ mặt trước không được hiển thị

Tên đăng ký giao diện người dùng cần phải giống hệt với tên Công cụ cuối cùng trên máy chủ:

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Đồng thời kiểm tra:

- Liệu plugin tùy chỉnh có sử dụng thời gian chạy `src/client-v2/` hay không
- Thẻ có được đăng ký trong `load()` của plug-in máy khách hay không
- ToolCall đã vào trạng thái được thẻ hỗ trợ chưa
- Thẻ có bị vô hiệu hóa do phán quyết của `invokeStatus` hay không
- Plug-in máy khách đã được xây dựng lại và tải chưa

## Công cụ không tiếp tục thực hiện sau khi nhấp vào thẻ

Xác minh rằng một trong `approve()`, `edit()` hoặc `reject()` đã được gọi. Khi bạn cần ghi lại các lựa chọn của người dùng vào tham số, hãy sử dụng:

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Đồng thời xác nhận rằng lược đồ máy chủ cho phép trường này và `invoke()` sẽ đọc nó.

## Sửa đổi `definition.name` không có hiệu lực

Tên của Công cụ được tải tự động được xác định bằng tên tệp hoặc tên thư mục. Ví dụ:

```text
src/ai/tools/developerChoice.ts
```

Tên cuối cùng là `developerChoice`. Nếu muốn đổi tên, bạn cần đồng bộ hóa các file đã đổi tên, tài liệu tham khảo Kỹ năng, cấu hình nhân viên AI và tên đăng ký giao diện người dùng.

## Liên kết liên quan

- [Phát triển phần bổ trợ nhân viên AI](./index.md) — Quay lại Tổng quan về hướng dẫn phát triển
- [Định nghĩa Tool phía máy chủ](./define-tool.md) — Kiểm tra cách đặt tên và đăng ký công cụ
- [Xác định Skill](./define-skill.md) - Kiểm tra các ràng buộc Kỹ năng và Công cụ
- [Thêm thẻ giao diện người dùng ](./frontend-tool-ui.md) cho Công cụ — Kiểm tra ToolCall và đăng ký giao diện người dùng
