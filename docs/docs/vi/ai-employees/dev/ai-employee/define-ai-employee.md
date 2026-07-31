---
title: "Định nghĩa Nhân viên AI tích hợp sẵn"
description: "Mô tả cách plugin NocoBase tạo nhân viên AI tích hợp bằng cách sử dụng các thư mục defineAIEmployee, prompt.md, kỹ năng và công cụ."
keywords: "NocoBase,nhân viên AI tích hợp,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Định nghĩa Nhân viên AI tích hợp sẵn

Nhân viên AI tích hợp được đăng ký với plugin. Khi plug-in được tải lần đầu tiên, NocoBase sẽ tạo bản ghi nhân viên tương ứng và đánh dấu đó là nhân viên tích hợp; các lần tải plug-in tiếp theo sẽ cập nhật thông tin mặc định của nhân viên, các từ nhắc nhở, kỹ năng và công cụ dựa trên mã.

## Hai hình thức: tệp đơn và thư mục

Khi dữ liệu là các từ nhắc nhở đơn giản và độc lập cũng như không cần các tài nguyên độc quyền, có thể sử dụng một tệp duy nhất:

```text
src/ai/ai-employees/lina.ts
```

Khi bạn cần `prompt.md`, Kỹ năng độc quyền hoặc Công cụ độc quyền, hãy sử dụng thư mục:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

Định dạng thư mục phù hợp hơn để bảo trì lâu dài.

## Sử dụng `defineAIEmployee()`

`index.ts` sử dụng `defineAIEmployee()` do `@nocobase/ai` cung cấp:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Các lĩnh vực chính như sau:

|Cánh đồng|tác dụng|
| --- | --- |
| `username` |ID duy nhất của nhân viên AI, bắt buộc và cần sự ổn định lâu dài|
| `category` |Phân loại nhân viên, chẳng hạn như `developer` hoặc `business`|
| `description` |Thông tin mô tả và truy xuất nội bộ|
| `avatar` |Biểu tượng hình đại diện|
| `nickname` |Tên hiển thị cho người dùng|
| `position` |Chức vụ|
| `bio` |Giới thiệu|
| `greeting` |Lời chào cuộc trò chuyện mới|
| `systemPrompt` |Lời nhắc hệ thống mặc định|
| `skills` |Tên kỹ năng bị ràng buộc rõ ràng|
| `tools` |Cấu hình công cụ được ràng buộc rõ ràng|
| `chatSettings` |Có bật cài đặt trò chuyện như Kỹ năng, Công cụ và chế độ từ nhắc hệ thống hay không|
| `sort` |Phân loại nhân viên tích hợp|

Hiện tại loại `tools` là một mảng các đối tượng:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` chỉ được sử dụng để ghi đè quyền gọi điện của nhân viên AI hiện tại đối với Công cụ `CUSTOM`. Đối với Công cụ `GENERAL` và `SPECIFIED`, thời gian chạy vẫn dựa trên `defaultPermission` của chính Công cụ; nếu Công cụ `CUSTOM` không có cấu hình cấp độ nhân viên thì nó cũng sẽ quay về `defaultPermission` của chính Công cụ đó.

Các công cụ được phát hiện tự động trong thư mục sẽ được chuẩn hóa thành `{ name: 'toolName' }`.

## Đặt prompt dài trong `prompt.md`

Nếu nhân viên AI sử dụng định dạng thư mục, các từ nhắc nhở của hệ thống có thể được đưa vào `prompt.md` ở cùng cấp độ:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

`prompt.md`, khi có mặt, sẽ ghi đè `systemPrompt` trong `index.ts`. Việc đặt các lời nhắc dài trong tệp Markdown sẽ dễ dàng xem lại hơn và tránh các sự cố thoát khỏi chuỗi mẫu TypeScript.

## Ví dụ Nhân viên AI tích hợp sẵn: Nathan

Hồ sơ nhân viên của `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` rất ngắn:

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Khả năng hoàn chỉnh của Nathan đến từ các tài nguyên khác trong cùng thư mục:

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

Quá trình tải sẽ tự động hoàn thành việc đóng bìa ba lớp:

1. Các tệp trong `tools/` được đăng ký làm Công cụ
2. Công cụ được tự động liên kết với `frontend-developer` Skill
3. Kỹ năng tự động liên kết với Nathan

Do đó, `index.ts` không cần phải được liệt kê nhiều lần cho toàn bộ tập hợp `skills` và `tools`.

## Liên kết liên quan

- [Phát triển plugin Nhân viên AI](./index.md) — Hiểu mối quan hệ giữa nhân viên AI tích hợp với Công cụ và Kỹ năng
- [Định nghĩa Skill](./define-skill.md) — Tạo kỹ năng dành riêng cho nhân viên
- [Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn](./complete-example.md) — Xem toàn bộ thư mục nhân viên và quy trình đăng ký
- [Quốc tế hóa](./internationalization.md) — Hiểu sự khác biệt về bản địa hóa giữa thông tin nhân viên và sao chép Công cụ và Kỹ năng
