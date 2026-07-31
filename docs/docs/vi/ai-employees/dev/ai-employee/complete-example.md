---
title: "Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn"
description: "Xác định Công cụ, Kỹ năng, từ nhắc hệ thống và nhân viên AI tích hợp trong plug-in NocoBase bằng một ví dụ hoàn chỉnh."
keywords: "NocoBase,Người trợ giúp nhà phát triển,Ví dụ về nhân viên AI,defineTools,defineAIEmployee,SKILLS.md"
---

# Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn

Ví dụ hoàn chỉnh sau tạo một Nhân viên AI tích hợp sẵn để hướng dẫn phát triển plugin. Trong ví dụ, nhân viên có tên `Dev Helper` và được cấu hình Tool, Skill cùng system prompt. Khi người dùng nói “Hãy chào Alice,” nhân viên sẽ tải Skill `welcome-developer`, gọi Tool `greetDeveloper` để xác nhận tên, rồi tạo lời chào bằng ngôn ngữ hiện tại của người dùng.

:::tip Kiến thức cần có

- [Định nghĩa Tool phía máy chủ](./define-tool.md) — Tìm hiểu cấu trúc cơ bản của `defineTools()` và Tool
- [Định nghĩa Skill](./define-skill.md) — Tìm hiểu `SKILLS.md` và cách liên kết Tool
- [Định nghĩa Nhân viên AI tích hợp sẵn](./define-ai-employee.md) — Tìm hiểu `defineAIEmployee()` và thư mục nhân viên

:::

Bên dưới tạo một nhân viên AI tích hợp có tên `Dev Helper`. Khi người dùng nói "Xin chào Alice", nhân viên sẽ tải Kỹ năng `welcome-developer`, gọi Công cụ `greetDeveloper` để xác nhận tên và sau đó tạo lời chào bằng ngôn ngữ hiện tại của người dùng.

## Kết quả cuối cùng

Sau khi hoàn thành, plug-in này sẽ cung cấp các khả năng sau:

- Tạo nhân viên AI tích hợp có tên `Dev Helper`
- Tự động ràng buộc `welcome-developer` Skill cho nhân viên
- Xác nhận tên nhà phát triển bằng cách gọi `greetDeveloper` Công cụ thông qua Skill
- Tạo lời chào và câu hỏi tiếp theo dựa trên ngôn ngữ hiện tại của người dùng

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## Cấu trúc thư mục cuối cùng

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Ví dụ này không yêu cầu mã giao diện người dùng hoặc đăng ký thủ công trong `src/server/plugin.ts`.

## Bước 1: Định nghĩa Tool

Tạo `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Bước 2: Định nghĩa Skill

Tạo `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Vì `greetDeveloper.ts` nằm trong thư mục `tools/` của Skill hiện tại nên không cần ghi `tools: [greetDeveloper]`.

## Bước 3: Định nghĩa hồ sơ Nhân viên AI

Tạo `src/ai/ai-employees/dev-helper/index.ts`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` là mã định danh duy nhất trong cơ sở dữ liệu. Đừng sửa đổi nó sau khi xuất bản, nếu không NocoBase sẽ coi giá trị mới như một nhân viên AI tích hợp khác.

:::warning Để ý

`username` Không chỉ phải ổn định mà còn phải tránh trùng tên với các plug-in khác hoặc các nhân viên AI hiện có. Nếu `username` tương tự đã tồn tại trong cơ sở dữ liệu, bản ghi tương ứng sẽ được cập nhật khi tải plugin thay vì tạo một nhân viên mới tách biệt với nhau.

Khi tải lại plug-in, `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, các từ nhắc hệ thống mặc định, liên kết Kỹ năng và Công cụ, `chatSettings` và `sort` trong mã có thể được ghi lại vào cơ sở dữ liệu. Các plugin chính thức được khuyến nghị sử dụng tên có tiền tố plug-in, chẳng hạn như `developer-helper-dev-assistant`.

:::

## Bước 4: Định nghĩa prompt hệ thống

Tạo `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

Tại thời điểm này, mối quan hệ thư mục đã được tự động ràng buộc:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Bước 5: Kích hoạt và xác minh

Xây dựng lại hoặc khởi động lại dịch vụ phát triển và xác nhận rằng plugin chứa các tệp này đã được bật. Sau đó vào trang quản lý nhân viên AI để kiểm tra:

- Có thể thấy `Dev Helper`
- Nhân viên được đánh dấu là nhân viên tích hợp
- Kỹ năng độc quyền của nhân viên chứa `welcome-developer`
- Kỹ năng có thể được sử dụng sau khi tải `greetDeveloper`

Trong cuộc trò chuyện, hãy nhập:

```text
请向 Alice 打个招呼。
```

Quá trình dự kiến ​​như sau:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Nếu bạn không muốn Công cụ yêu cầu xác nhận của người dùng trước mỗi cuộc gọi, hãy đặt `defaultPermission: 'ALLOW'`. Đối với các Công cụ liên quan đến việc xóa, sửa đổi hàng loạt hoặc các tác dụng phụ bên ngoài, sẽ thích hợp hơn nếu để `ASK` theo mặc định.


## Tóm tắt

| Tệp | Trách nhiệm |
| --- | --- |
| `greetDeveloper.ts` | Xác thực đầu vào và trả về kết quả Tool có cấu trúc |
| `SKILLS.md` | Quy định quy trình gọi Tool và xử lý phản hồi |
| `prompt.md` | Quy định vai trò nhân viên và các ràng buộc chung |
| `index.ts` | Định nghĩa hồ sơ Nhân viên AI tích hợp sẵn |

## Liên kết liên quan

- [Phát triển plugin Nhân viên AI](./index.md) - Hiểu mối quan hệ giữa Công cụ, Kỹ năng và Nhân viên AI tích hợp
- [Định nghĩa Tool phía máy chủ](./define-tool.md) — Xem cấu hình đầy đủ của `defineTools()`
- [Định nghĩa Skill](./define-skill.md) — Xem các trường và phương pháp viết của `SKILLS.md`
- [Định nghĩa Nhân viên AI tích hợp sẵn ](./define-ai-employee.md) — xem `defineAIEmployee()` và các liên kết thư mục
- [Quốc tế hóa](./internationalization.md) — Thêm bản dịch vào bản sao giao diện quản trị trong ví dụ
