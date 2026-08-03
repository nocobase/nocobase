---
title: "Định nghĩa Tool phía máy chủ"
description: "Giới thiệu các phương thức xác định, phạm vi, lược đồ, lệnh gọi, quyền và đăng ký thư mục của Công cụ máy chủ nhân viên NocoBase AI."
keywords: "NocoBase,Công cụ nhân viên AI,defineTools,ToolsOptions,Zod,gọi"
---

# Định nghĩa Tool phía máy chủ

Trong NocoBase, **Tool** chịu trách nhiệm thực hiện các thao tác cụ thể như truy vấn, ghi dữ liệu hoặc gửi yêu cầu bên ngoài. Tool phía máy chủ thường được định nghĩa bằng `defineTools()` từ `@nocobase/ai` và đặt trong thư mục `src/ai/**/tools/` của plugin.

## Cấu trúc tối thiểu của Tool

Công cụ phía máy chủ sử dụng định nghĩa `defineTools()` do `@nocobase/ai` cung cấp. Công cụ sau lấy tên và trả về lời chào:

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
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Nếu đường dẫn tệp là `src/ai/tools/greetDeveloper.ts`, trình tải sẽ sử dụng tên tệp `greetDeveloper` làm tên Công cụ cuối cùng. Ngay cả khi `definition.name` được ghi bằng các giá trị khác, nó sẽ bị ghi đè bằng tên tệp trong quá trình đăng ký.

Do đó, theo mặc định, tên được tham chiếu trong tên tệp `definition.name` và Skill nhất quán với tên đã đăng ký ở giao diện người dùng.

## Các tùy chọn cấu hình Tool

Cấu hình chính của `defineTools()` như sau:

|Cấu hình|tác dụng|giá trị mặc định|
| --- | --- | --- |
| `scope` |Xác định phạm vi có sẵn của Công cụ|Yêu cầu|
| `execution` |Chỉ định xem logic được thực thi trong `backend` hay `frontend`| `backend` |
| `defaultPermission` |Cho phép trực tiếp hay yêu cầu xác nhận trước khi gọi Công cụ| `ASK` |
| `silence` |Có ẩn lời nhắc cuộc gọi Công cụ trong cuộc trò chuyện hay không| `false` |
| `introduction` |Tiêu đề và mô tả hiển thị trên giao diện quản lý|Sử dụng tên công cụ|
| `definition` |Tên, mô tả và lược đồ tham số được cung cấp cho mô hình|Yêu cầu|
| `invoke` |Logic thực thi thực tế của công cụ|Yêu cầu|

Việc lựa chọn `scope` sẽ ảnh hưởng trực tiếp đến cách Công cụ đi vào bối cảnh nhân viên AI:

| `scope` |Cách sử dụng|
| --- | --- |
| `GENERAL` |Được chia sẻ bởi tất cả nhân viên AI, thường được sử dụng cho các khả năng cơ bản chung|
| `SPECIFIED` |Chỉ những nhân viên Skill hoặc AI bị ràng buộc với Công cụ mới có thể sử dụng nó|
| `CUSTOM` |Quản trị viên có thể thêm thủ công vào cấu hình nhân viên AI và đặt "Hỏi" hoặc "Cho phép"|

Đề xuất mặc định là `SPECIFIED`. Chỉ sử dụng `GENERAL` nếu bạn chắc chắn rằng mọi nhân viên AI đều cần khả năng này; sử dụng `CUSTOM` nếu bạn muốn quản trị viên chọn theo nhân viên.

## `definition` dành cho mô hình

`definition.description` và `definition.schema` sẽ ảnh hưởng đến việc mô hình có chọn Công cụ này hay không và cách xây dựng tham số. Phần mô tả cần làm rõ ba điều:

- Trong hoàn cảnh nào nó được gọi là?
- Mỗi tham số thể hiện điều gì?
- Những điều mà Công cụ này không nên xử lý

Nên sử dụng Zod cho lược đồ tham số:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Tên công cụ cũng cần phải ổn định. Các kỹ năng, nhân sự AI, thẻ giao diện người dùng và tin nhắn trò chuyện đã lưu đều sẽ được tìm thấy theo tên.

## `invoke()` nhận được gì

Máy chủ `invoke()` nhận được ba tham số:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

Ứng dụng, cơ sở dữ liệu, thông tin xác thực và tham số hành động hiện tại có thể được truy cập thông qua `ctx`. Ví dụ:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

Công cụ sẽ trả về một cấu trúc xác định thành công hay thất bại. Công cụ tích hợp thường sử dụng các hình dạng sau:

```ts
return {
  status: 'success',
  content: result,
};
```

Khi gặp phải một thất bại kinh doanh có thể dự đoán được, cũng cần trả về trạng thái và lý do rõ ràng, đồng thời không để mô hình đoán xem hoạt động đó có thành công hay không.

## Dùng thư mục để lưu mô tả dài

Ngoài dạng file đơn, Tool còn có thể sử dụng các thư mục:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` xuất kết quả của `defineTools()` theo mặc định. Khi `description.md` tồn tại, nội dung đầy đủ của nó sẽ ghi đè `definition.description`, phù hợp để lưu các hướng dẫn sử dụng Công cụ dài.

Tên thư mục `documentSearch` sẽ trở thành tên đăng ký cuối cùng.


## Ví dụ Tool tích hợp sẵn: `subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` hiển thị Công cụ máy chủ hoàn chỉnh:

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

Việc triển khai này có một số phương pháp có thể tái sử dụng:

- Sử dụng `SPECIFIED` để giới hạn quyền truy cập công cụ vào những nhân viên hoặc kỹ năng cụ thể
- Ràng buộc các tham số do mô hình tạo bằng Zod
- Đọc cấu hình phiên AI hiện tại từ `ctx.action.params.values`
- Đặt nhiều truy vấn độc lập vào ToolCall và thực hiện chúng song song thông qua `Promise.all()`
- Trả về kết quả có cấu trúc với nguồn rõ ràng và để mô hình cấp cao hơn tiếp tục sắp xếp chúng

## Liên kết liên quan

- [Phát triển plugin Nhân viên AI](./index.md) — Chọn mức độ khả năng cần được mở rộng
- [Định nghĩa Skill](./define-skill.md) — Sử dụng Kỹ năng để tổ chức quá trình gọi của nhiều Công cụ
- [Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn](./complete-example.md) — Xem ví dụ về Công cụ hoạt động
- [Thêm thẻ giao diện ](./frontend-tool-ui.md) cho Tool — Thêm giao diện xác nhận và lựa chọn cho ToolCall
