---
title: "ctx.ai"
description: "Dùng ctx.ai trong RunJS để kích hoạt tác vụ nhân viên AI trong hội thoại toàn cục hoặc một AI Chat Box được chỉ định, bằng nội dung trực tiếp hoặc tác vụ đã cấu hình trên hành động nhân viên AI."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

Trong RunJS, `ctx.ai` dùng để kích hoạt **tác vụ nhân viên AI**. API này phù hợp với JSBlock, JSAction và các tương tác nơi nút bấm, biểu mẫu hoặc quy trình nghiệp vụ cần giao việc cho một nhân viên AI cụ thể.

`ctx.ai` chỉ kích hoạt tác vụ. Nó không trả về kết quả thực thi của tác vụ. Sau khi gọi, tác vụ sẽ đi vào luồng hội thoại của nhân viên AI.

:::warning Lưu ý

`ctx.ai` được cung cấp bởi plugin AI. Nếu plugin AI chưa được bật, hoặc môi trường RunJS hiện tại chưa tải năng lực client tương ứng, `ctx.ai` có thể không tồn tại. Bạn có thể kiểm tra `ctx.ai?.triggerTask` hoặc `ctx.ai?.triggerModelTask` trước khi gọi.

:::

## Phương thức

### ctx.ai.triggerTask()

Kích hoạt trực tiếp một tác vụ nhân viên AI.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Nhân viên AI. Khi truyền chuỗi, NocoBase khớp chính xác với `AIEmployee.username`, và nhân viên AI đó phải khả dụng với người dùng hiện tại. |
| `tasks` | `Task[]` | Danh sách tác vụ cần kích hoạt. |
| `chatBoxUid` | `string` | uid FlowModel của khối AI Chat Box sẽ nhận tác vụ. |
| `open` | `boolean` | Có mở bảng hội thoại nhân viên AI hay không. |
| `auto` | `boolean` | Có dùng ngữ nghĩa tự động kích hoạt của hành động nhân viên AI hay không. |

Các trường thường dùng của `Task`:

| Trường | Kiểu | Mô tả |
|------|------|------|
| `title` | `string` | Tiêu đề tác vụ. |
| `message.system` | `string` | Tin nhắn hệ thống dùng để ràng buộc vai trò và yêu cầu đầu ra của nhân viên AI. |
| `message.user` | `string` | Tin nhắn người dùng, tức chỉ dẫn chính của tác vụ. |
| `message.workContext` | `ContextItem[]` | Ngữ cảnh khối trang được tác vụ sử dụng. |
| `autoSend` | `boolean` | Có tự động gửi tin nhắn tác vụ hay không. |
| `webSearch` | `boolean` | Có cho phép tác vụ dùng Web search hay không. |
| `model` | `{ llmService: string; model: string } \| null` | Mô hình dùng cho tác vụ này. |
| `skillSettings` | `SkillSettings` | Cấu hình skills / tools của tác vụ này. |

### Chỉ định AI Chat Box

Đặt `chatBoxUid` trong tùy chọn cấp cao nhất của `triggerTask()` để kích hoạt tác vụ trong một khối AI Chat Box đã được gắn trên trang, thay vì mở hộp thoại nhân viên AI toàn cục.

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

uid phải thuộc về khối AI Chat Box bên ngoài hiện đang được gắn trên trang. Không đặt giá trị định tuyến này bên trong `tasks`. Nếu không tìm thấy khối đích, NocoBase sẽ báo lỗi và không quay về hộp thoại toàn cục. Khi bỏ qua `chatBoxUid`, tác vụ sẽ dùng hộp thoại nhân viên AI toàn cục.

### Thêm ngữ cảnh khối trang

`message.workContext` hiện dùng để truyền khối trang. Hãy đặt uid FlowModel của khối đích vào đây:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Trường | Mô tả |
|------|------|
| `type` | Cố định là `flow-model`, biểu thị ngữ cảnh khối trang. |
| `uid` | uid FlowModel của khối trang, chẳng hạn khối bảng, khối chi tiết hoặc khối biểu đồ. |

Nếu muốn dùng chính JSBlock hiện tại làm ngữ cảnh, dùng uid của model hiện tại:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Chỉ định model

`model` chỉ định model cho một tác vụ. Nếu bỏ qua, cấu hình model mặc định của nhân viên AI sẽ được dùng. Truyền `null` nghĩa là không chỉ định model ở cấp tác vụ.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Cấu hình skills / tools

`skillSettings` chỉ định skills và tools khả dụng cho một tác vụ. Nếu bỏ qua, cấu hình năng lực của nhân viên AI sẽ được dùng.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Để tắt rõ ràng toàn bộ skills hoặc tools của tác vụ này, truyền mảng rỗng và giữ lại các trường version:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Ví dụ:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Nếu `aiEmployee` là chuỗi, NocoBase sẽ khớp chính xác theo `username` trong các nhân viên AI mà người dùng hiện tại có thể truy cập.

### ctx.ai.triggerModelTask()

Đọc một tác vụ từ model hành động nhân viên AI trên trang và kích hoạt nó.

Tùy chọn công khai của `triggerModelTask()` không nhận `chatBoxUid`. Để chỉ định AI Chat Box, hãy cấu hình `chatBoxUid` trên tác vụ đặt trước của hành động nhân viên AI. `triggerModelTask()` tiếp tục sử dụng giá trị đặt trước này.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | uid FlowModel của hành động nhân viên AI. |
| `taskIndex` | `number` | Chỉ số tác vụ, bắt đầu từ `0`. |
| `options.open` | `boolean` | Có mở bảng hội thoại nhân viên AI hay không. |
| `options.auto` | `boolean` | Có dùng ngữ nghĩa tự động kích hoạt của hành động nhân viên AI hay không. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Nếu model đích không tồn tại, chưa cấu hình nhân viên AI, hoặc chỉ số chỉ tới tác vụ không tồn tại, tác vụ sẽ không được kích hoạt và console sẽ có cảnh báo.

## Lưu ý

- `triggerTask()` và `triggerModelTask()` là fire-and-forget. Chúng không trả về kết quả thực thi tác vụ.
- Chuỗi `aiEmployee` chỉ khớp chính xác với `AIEmployee.username`.
- `triggerModelTask()` dùng `taskIndex` bắt đầu từ `0`.
- `message.workContext` hiện chỉ mô tả ngữ cảnh khối trang.
- `triggerTask().chatBoxUid` ở cấp cao nhất phải tham chiếu đến một khối AI Chat Box đang được gắn trên trang.
- `triggerModelTask()` tiếp tục dùng `chatBoxUid` được cấu hình trên tác vụ đặt trước.

## Liên quan

- [ctx.message](./message.md): Hiển thị thông báo nhẹ trước và sau khi kích hoạt tác vụ.
- [ctx.render](./render.md): Render nút hoặc biểu mẫu trong JSBlock.
- [ctx.model](./model.md): Lấy thông tin FlowModel hiện tại.
