---
title: "Thêm tương tác frontend cho Tool"
description: "Giới thiệu thẻ, phương thức, quyết định.edit và thực thi giao diện người dùng của Công cụ nhân viên NocoBase AI, đồng thời thêm thẻ lựa chọn vào Trình trợ giúp nhà phát triển."
keywords: "NocoBase,Thẻ giao diện công cụ,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,Công cụ giao diện người dùng"
---

# Thêm tương tác frontend cho Tool

Một số Tool chỉ cần chạy ở phía máy chủ và không cần giao diện tùy chỉnh. Những Tool khác cần người dùng xác nhận, lựa chọn hoặc chỉnh sửa tham số. Khi đó, bạn có thể đăng ký thẻ, modal hoặc logic thực thi trong trình duyệt cho Tool cùng tên.

:::tip Phân biệt hai khái niệm

**Thẻ frontend** chỉ phụ trách hiển thị ToolCall và tương tác với người dùng; điều này không có nghĩa logic nghiệp vụ của Tool phải chạy trong trình duyệt.

Nếu bạn chỉ hiển thị các lựa chọn như `suggestions` rồi tiếp tục `invoke()` phía máy chủ sau khi người dùng chọn, hãy giữ giá trị mặc định `execution: 'backend'`. Chỉ đặt `execution: 'frontend'` và triển khai `invoke` ở frontend khi logic Tool thực sự phải truy cập trang trình duyệt hiện tại, FlowModel hoặc trạng thái trình chỉnh sửa.

:::

Một số công cụ chỉ cần được thực thi ở phía máy chủ và không yêu cầu giao diện tùy chỉnh. Các Công cụ khác cần cho phép người dùng xác nhận, lựa chọn hoặc chỉnh sửa các thông số. Trong trường hợp này, bạn có thể đăng ký thẻ giao diện cho Tool có cùng tên.

:::tip Phân biệt hai khái niệm

**Thẻ giao diện người dùng** chỉ chịu trách nhiệm hiển thị và tương tác giữa người với máy tính của ToolCall. Điều đó không có nghĩa là logic kinh doanh của Công cụ phải được thực thi trong trình duyệt.

Nếu bạn chỉ hiển thị các tùy chọn như `suggestions` và tiếp tục phía máy chủ `invoke()` sau khi người dùng chọn nó, chỉ cần để mặc định `execution: 'backend'`. Đặt `execution: 'frontend'` và chỉ triển khai giao diện người dùng `invoke` nếu logic thực tế của Công cụ phải truy cập vào trang trình duyệt, FlowModel hoặc trạng thái trình chỉnh sửa hiện tại.

:::

## Định nghĩa tham số và logic thực thi phía máy chủ

Công cụ `suggestions` tích hợp sẵn có tại:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Lược đồ của nó chứa cả ứng viên và lựa chọn cuối cùng của người dùng:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Theo mô tả Công cụ, chỉ nên tạo `options` trong lần gọi mô hình đầu tiên. Vì Công cụ này chưa được đặt `defaultPermission: 'ALLOW'` và quyền mặc định là `ASK` nên ToolCall sẽ tạm dừng chờ thao tác của người dùng.

Sau khi người dùng chọn nó, giao diện người dùng sẽ hợp nhất `option` vào các tham số ban đầu thông qua `decisions.edit()` và sau đó khôi phục ToolCall. Máy chủ `invoke()` cuối cùng trả về nội dung đã chọn:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

Việc triển khai tích hợp sẵn cũng sẽ ghi lại kết quả lựa chọn vào `aiMessages.toolCalls`, để khi thông báo lịch sử được hiển thị lại, nó vẫn có thể hiển thị mục nào người dùng đã chọn.

## Viết thẻ Tool

Tiếp nhận thẻ mặt trước `ToolsUIProperties`:

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Để ý

Thành phần này thể hiện cách sử dụng phổ biến `decisions.edit()` và xử lý các lần nhấp chuột lặp lại cũng như các tham số chuỗi JSON. Khi sử dụng chính thức, cũng cần xử lý các cuộc hội thoại chỉ đọc, tin nhắn đang hoạt động hiện tại và trạng thái lựa chọn lịch sử theo giao diện trò chuyện. Để triển khai đầy đủ, vui lòng tham khảo `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` cung cấp ba thao tác:

|phương pháp|tác dụng|
| --- | --- |
| `approve()` |Tiếp tục thực hiện bằng các tham số ban đầu|
| `edit(args)` |Tiếp tục thực hiện sau khi sửa đổi tham số|
| `reject(message?)` |Từ chối thực thi và trả lại lý do cho luồng hộp thoại|

`SuggestionsOptionsCard.tsx` tích hợp sẵn cũng xử lý các chi tiết sau:

- Tương thích với cả mảng và chuỗi JSON hình dạng `options`
- ToolCall vẫn hiển thị đang tải trong khi tạo
- Chỉ cho phép các lựa chọn cho ToolCalls ở trạng thái `interrupted`
- Vô hiệu hóa nút ngay sau khi nhấp vào nút đó để tránh gửi đi lặp lại
- Giữ các tùy chọn đã chọn trong tin nhắn lịch sử và đánh dấu chúng
- Chỉ cho phép cuộc trò chuyện có thể chỉnh sửa hiện tại kích hoạt hành động

## Đăng ký trong plugin phía máy khách

Tên đăng ký giao diện người dùng phải giống hệt với tên Công cụ phía máy chủ:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Nếu tệp máy chủ là `src/ai/tools/developerChoice.ts`, `developerChoice` được đăng ký tại đây.

Quá trình đăng ký `suggestions` tích hợp cũng được hoàn thành như sau:

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Sau đó `PluginAIClientV2.load()` gọi `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` để hợp nhất thẻ vào định nghĩa Công cụ cùng tên được máy chủ trả về.

## Chọn thẻ, modal hoặc thực thi ở frontend

Chỉ các cấu hình phổ biến của ứng dụng khách `ToolsOptions` mới được liệt kê bên dưới. Xem `packages/core/client-v2/src/ai/tools-manager/types.ts` để biết loại hoàn chỉnh.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Sử dụng thẻ

Mặc định, hãy dùng `card` trước. Thẻ phù hợp để hiển thị trạng thái thực thi, nút xác nhận và một số lựa chọn ngay tại vị trí ToolCall.

### Sử dụng modal

Chỉ thêm `modal` khi có nhiều nội dung, cần vùng xem trước lớn hoặc phải chỉnh sửa tham số phức tạp.

### Thực thi Tool trong trình duyệt

Nếu Tool phía máy chủ đặt `execution: 'frontend'`, phía máy khách cũng cần cung cấp `invoke`. Loại Tool này phù hợp để đọc ngữ cảnh trang hiện tại, nội dung trình chỉnh sửa hoặc trạng thái FlowEngine, nhưng không phù hợp với thao tác ghi dữ liệu cần được bảo vệ bằng quyền phía máy chủ.

## Ví dụ hoàn chỉnh: Thêm thẻ lựa chọn cho Nhân viên AI tích hợp sẵn

Sau khi hoàn thành [Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn](./complete-example.md), bạn có thể biến câu hỏi tiếp theo của `Dev Helper` thành các lựa chọn có thể nhấp. Hãy xác định thêm Tool `developerChoice` và đăng ký thẻ frontend. Tệp phía máy chủ được đặt tại:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Công cụ này có nhiệm vụ khai báo các lựa chọn và nhận lựa chọn của người dùng:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```
Vì `developerChoice.ts` nằm trong thư mục `tools/` của Kỹ năng `welcome-developer` nên nó tự động được liên kết với Kỹ năng hiện tại. Tuy nhiên, ràng buộc chỉ có nghĩa là mô hình có thể sử dụng Tool này chứ không có nghĩa là mô hình chắc chắn sẽ gọi được.

Quy trình làm việc của `SKILLS.md` cũng cần được sửa đổi đồng thời, thay thế các bước 5–6 ban đầu bằng:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Thẻ giao diện người dùng sử dụng lại `DeveloperChoiceCard` đã xác định trước đó và lưu nó vào:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Cuối cùng đã đăng ký tại `src/client-v2/plugin.tsx`:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Sau khi đăng ký thẻ xong tiến hành xây dựng lại client. Khi đạt đến `developerChoice` trong cuộc trò chuyện, ToolCall sẽ tạm dừng và hiển thị các tùy chọn có thể nhấp.

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->

## Liên kết liên quan

- [Xác định Công cụ máy chủ](./define-tool.md) — Xác định Công cụ máy chủ tương ứng với thẻ giao diện người dùng
- [Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn](./complete-example.md) — Trước tiên hãy hoàn thành ví dụ cơ bản về Dev Helper
- [Quốc tế hóa](./internationalization.md) — Dịch bản sao giao diện quản lý của Tool và Skill
- [Plugin ứng dụng khách](../../../plugin-development/client/plugin.md) — Hiểu mục nhập plug-in ứng dụng khách và `load()`
