---
title: "为 Tool 添加前端交互"
description: "介绍 NocoBase AI 员工 Tool 的 card、modal、decisions.edit 和 frontend execution，并为内置 AI 员工添加选择卡片。"
keywords: "NocoBase,Tool 前端交互,Tool 卡片,Tool 弹窗,ToolsUIProperties,decisions.edit,frontend Tool"
---

# 为 Tool 添加前端交互

有些 Tool 只需要在服务端执行，不需要自定义界面。另一些 Tool 需要让用户确认、选择或编辑参数，这时可以为同名 Tool 注册卡片、弹窗或浏览器端执行逻辑。

:::tip 区分两个概念

**前端卡片**只负责 ToolCall 的展示和人机交互，不代表 Tool 的业务逻辑一定在浏览器执行。

如果只是像 `suggestions` 一样展示选项，并在用户选择后继续服务端 `invoke()`，保留默认的 `execution: 'backend'` 就行。只有 Tool 的实际逻辑必须访问当前浏览器页面、FlowModel 或编辑器状态时，才设置 `execution: 'frontend'` 并实现前端 `invoke`。

:::

## 先定义服务端参数和执行逻辑

内置 `suggestions` Tool 位于：

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

它的 schema 同时包含候选项和用户最终选择：

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

按照 Tool 描述，模型首次调用时应只生成 `options`。由于这个 Tool 没有设置 `defaultPermission: 'ALLOW'`，默认权限是 `ASK`，ToolCall 会暂停等待用户操作。

用户选择后，前端通过 `decisions.edit()` 把 `option` 合并进原参数，再恢复 ToolCall。服务端 `invoke()` 最终返回选中的内容：

```ts
return {
  status: 'success',
  content: args?.option,
};
```

内置实现还会把选择结果写回 `aiMessages.toolCalls`，这样历史消息重新渲染时仍能显示用户选中了哪一项。

## 编写 Tool 卡片

前端卡片接收 `ToolsUIProperties`：

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

:::warning 注意

这个组件展示了 `decisions.edit()` 的通用用法，并处理了重复点击和 JSON 字符串参数。正式使用时，还需要根据所在聊天界面处理只读对话、当前活动消息和历史选择状态。完整实现可以参考 `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`。

:::

`decisions` 提供三个操作：

| 方法 | 作用 |
| --- | --- |
| `approve()` | 使用原参数继续执行 |
| `edit(args)` | 修改参数后继续执行 |
| `reject(message?)` | 拒绝执行，并把原因返回给对话流程 |

内置 `SuggestionsOptionsCard.tsx` 另外处理了这些细节：

- 兼容数组和 JSON 字符串两种 `options` 形状
- ToolCall 仍在生成时展示 loading
- 只允许对 `interrupted` 状态的 ToolCall 做选择
- 点击后立即禁用按钮，避免重复提交
- 历史消息中保留并突出显示已经选择的选项
- 只允许当前可编辑对话触发操作

## 在客户端插件中注册

前端注册名称必须和服务端 Tool 名称完全一致：

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

如果服务端文件是 `src/ai/tools/developerChoice.ts`，这里就注册 `developerChoice`。

内置 `suggestions` 的注册过程也是这样完成的：

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

随后 `PluginAIClientV2.load()` 调用 `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)`，把卡片合并到服务端返回的同名 Tool 定义中。

## 选择卡片、弹窗或前端执行

下面只列出客户端 `ToolsOptions` 的常用配置。完整类型见 `packages/core/client-v2/src/ai/tools-manager/types.ts`。

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

### 使用卡片

默认先用 `card`。卡片适合在 ToolCall 位置展示执行状态、确认按钮和少量选项。

### 使用弹窗

内容较多、需要大尺寸预览或复杂参数编辑时，再增加 `modal`。

### 在浏览器中执行 Tool

如果服务端 Tool 设置了 `execution: 'frontend'`，那么客户端还需要提供 `invoke`。这类 Tool 适合读取当前页面上下文、编辑器内容或 FlowEngine 状态，不适合执行需要服务端权限保护的数据写入。

## 完整示例：给内置 AI 员工添加选择卡片

完成[完整示例：创建内置 AI 员工](./complete-example.md)后，如果希望把 `Dev Helper` 的追问变成可点击选项，可以再定义一个 `developerChoice` Tool，并注册前端卡片。服务端文件放在：

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

这个 Tool 负责声明选项并接收用户选择：

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
因为 `developerChoice.ts` 位于 `welcome-developer` Skill 的 `tools/` 目录，它会自动绑定到当前 Skill。不过，绑定只代表模型可以使用这个 Tool，不代表模型一定会调用它。

还需要同步修改 `SKILLS.md` 的工作流，把原来的第 5–6 步替换为：

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

前端卡片复用前面定义的 `DeveloperChoiceCard`，并保存到：

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

最后在 `src/client-v2/plugin.tsx` 中注册：

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

卡片注册完成后，重新构建客户端。在对话中执行到 `developerChoice` 时，ToolCall 会暂停并显示可点击选项。

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->

## 相关链接

- [定义服务端 Tool](./define-tool.md) — 定义前端卡片对应的服务端 Tool
- [完整示例：创建内置 AI 员工](./complete-example.md) — 先完成不含前端代码的基础示例
- [AI 员工插件国际化](./internationalization.md) — 翻译 Tool 和 Skill 的管理界面文案
- [客户端 Plugin](../../../plugin-development/client/plugin.md) — 了解客户端插件入口和 `load()`
