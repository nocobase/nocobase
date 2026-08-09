---
title: "Add Frontend Interaction to a Tool"
description: "Explains frontend interaction for NocoBase AI employee Tools, including cards, modals, decisions.edit, and frontend execution."
keywords: "NocoBase,Tool frontend card,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,frontend Tool"
---

# Add Frontend Interaction to a Tool

Some Tools only need to run on the server and require no custom interface. Other Tools need the user to confirm, select, or edit arguments. In those cases, register a frontend card for the Tool with the same name.

:::tip Distinguish the two concepts

A **frontend card** only handles ToolCall display and human interaction. It does not mean that the Tool's business logic must run in the browser.

If the card only displays options like `suggestions` and continues to the server-side `invoke()` after the user selects one, keep the default `execution: 'backend'`. Set `execution: 'frontend'` and implement a frontend `invoke` only when the Tool's actual logic must access the current browser page, FlowModel, or editor state.

:::

## Define arguments and execution logic on the server first

The built-in `suggestions` Tool is located at:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Its schema includes both the candidate options and the user's final selection:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

According to the Tool description, the model should generate only `options` on the first call. Because this Tool does not set `defaultPermission: 'ALLOW'`, its default permission is `ASK`, and the ToolCall pauses for user input.

After the user makes a selection, the frontend uses `decisions.edit()` to merge `option` into the original arguments and resume the ToolCall. The server-side `invoke()` then returns the selected content:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

The built-in implementation also writes the selection back to `aiMessages.toolCalls`, so rerendered historical messages can still show which option the user selected.

## Write the card component

A frontend card receives `ToolsUIProperties`:

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

:::warning Note

This component demonstrates the general use of `decisions.edit()` and handles repeated clicks and JSON-string arguments. In production, you must also account for read-only conversations, the current active message, and historical selection state in the surrounding chat interface. See the complete implementation in `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` provides three operations:

| Method | Purpose |
| --- | --- |
| `approve()` | Continue with the original arguments |
| `edit(args)` | Modify the arguments and continue |
| `reject(message?)` | Reject execution and return the reason to the conversation flow |

The built-in `SuggestionsOptionsCard.tsx` also handles these details:

- Supports both array and JSON-string forms of `options`
- Displays a loading state while the ToolCall is still being generated
- Allows selection only for a ToolCall with the `interrupted` status
- Disables buttons immediately after a click to prevent duplicate submission
- Preserves and highlights the selected option in historical messages
- Allows actions only in the current editable conversation

## Register it in the client plugin

The frontend registration name must exactly match the server-side Tool name:

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

If the server-side file is `src/ai/tools/developerChoice.ts`, register `developerChoice` here.

The built-in `suggestions` registration works the same way:

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

`PluginAIClientV2.load()` then calls `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` to merge the card into the same-named Tool definition returned by the server.

## Choose a card, modal, or frontend execution

### Use a card

The following lists only the commonly used client-side `ToolsOptions` settings. See the complete type in `packages/core/client-v2/src/ai/tools-manager/types.ts`.

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

Use `card` first by default.

### Use a modal

Add a `modal` only when the content is extensive or requires a large preview or complex argument editing.

### Execute a Tool in the browser

If the server-side Tool sets `execution: 'frontend'`, the client must also provide `invoke`. Such Tools are suitable for reading the current page context, editor content, or FlowEngine state. They are not suitable for data writes that require server-side permission enforcement.

## Complete example: Add a selection card to a built-in AI employee

After completing [Complete Example: Create a Built-in AI Employee](./complete-example.md), turn `Dev Helper`'s follow-up question into clickable options by defining another Tool named `developerChoice` and registering a frontend card. Put the server-side file at:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

This Tool declares the options and accepts the user's selection:

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

Because `developerChoice.ts` is in the `welcome-developer` Skill's `tools/` directory, it is automatically bound to the current Skill. However, binding only means the model can use the Tool; it does not guarantee that the model will call it.

Also update the workflow in `SKILLS.md`, replacing the original steps 5–6 with:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Reuse the `DeveloperChoiceCard` defined above and save it to:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Finally, register it in `src/client-v2/plugin.tsx`:

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

After registering the card, rebuild the client. When a conversation reaches `developerChoice`, the ToolCall pauses and displays clickable options.

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->

## Related links

- [Define a server-side Tool](./define-tool.md) — Define the server-side Tool corresponding to a frontend card
- [Complete example: Create a built-in AI employee](./complete-example.md) — Complete the basic example without frontend code first
- [Internationalization for AI employee plugins](./internationalization.md) — Translate Tool and Skill management-interface text
- [Client Plugin](../../../plugin-development/client/plugin.md) — Learn about the client plugin entry point and `load()`
