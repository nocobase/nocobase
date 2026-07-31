---
title: "Tool にフロントエンドインタラクションを追加する"
description: "NocoBase AI 従業員 Tool の card、modal、decisions.edit、frontend execution を説明し、組み込み AI 従業員に選択カードを追加します。"
keywords: "NocoBase,Tool フロントエンドインタラクション,Tool カード,Tool モーダル,ToolsUIProperties,decisions.edit,frontend Tool"
---

# Tool にフロントエンドインタラクションを追加する

サーバー側で実行するだけで、カスタム UI を必要としない Tool もあります。一方、ユーザーによる確認、選択、パラメータ編集が必要な Tool には、同名の Tool にカード、モーダル、またはブラウザ側の実行ロジックを登録できます。

:::tip 2つの概念を区別する

**フロントエンドカード**はToolCallの表示とユーザーインタラクションのみを担当します。Toolのビジネスロジックが必ずブラウザで実行されることを意味するわけではありません。

`suggestions`のようにオプションを表示し、ユーザーの選択後にサーバー側の`invoke()`を続行させるだけの場合は、デフォルトの`execution: 'backend'`のままで問題ありません。Toolの実際のロジックが現在のブラウザページ、FlowModel、またはエディタの状態にアクセスする必要がある場合にのみ、`execution: 'frontend'`を設定してフロントエンドの`invoke`を実装してください。

:::

## まずサーバー側でパラメータと実行ロジックを定義する

内蔵の`suggestions` Toolは以下にあります：

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

そのスキーマには、候補オプションとユーザーの最終的な選択の両方が含まれています：

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Toolの説明に従い、モデルが最初に呼び出す際は`options`のみを生成します。このToolには`defaultPermission: 'ALLOW'`が設定されていないため、デフォルトの権限は`ASK`となり、ToolCallはユーザーの操作を待機するために一時停止します。

ユーザーが選択すると、フロントエンドが`decisions.edit()`を通じて`option`を元のパラメータにマージし、ToolCallを再開します。サーバー側の`invoke()`は最終的に選択された内容を返します：

```ts
return {
  status: 'success',
  content: args?.option,
};
```

内蔵の実装では、選択結果を`aiMessages.toolCalls`に書き戻すため、履歴メッセージが再レンダリングされた際にもユーザーがどの項目を選択したかが表示されます。

## Tool カードを作成する

フロントエンドカードは`ToolsUIProperties`を受け取ります：

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

このコンポーネントは`decisions.edit()`の一般的な用法を示しており、重複クリックやJSON文字列パラメータを処理しています。実際に使用する場合は、チャットインターフェースに応じて、読み取り専用の会話、現在のアクティブなメッセージ、および履歴の選択状態を処理する必要があります。完全な実装については、`packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`を参照してください。

:::

`decisions`は3つの操作を提供します：

| メソッド | 役割 |
| --- | --- |
| `approve()` | 元のパラメータを使用して実行を続行する |
| `edit(args)` | パラメータを変更して実行を続行する |
| `reject(message?)` | 実行を拒否し、理由を会話フローに返す |

内蔵の`SuggestionsOptionsCard.tsx`では、さらに以下の詳細を処理しています：

- 配列とJSON文字列の両方の`options`形式に対応
- ToolCallの生成中にローディングを表示
- `interrupted`状態のToolCallのみ選択を許可
- クリック後すぐにボタンを無効化し、重複送信を防止
- 履歴メッセージ内で選択済みのオプションを保持し、強調表示
- 現在編集可能な会話でのみ操作をトリガーすることを許可

## クライアントプラグインで登録する

フロントエンドの登録名は、サーバー側のTool名と完全に一致している必要があります：

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

サーバー側のファイルが`src/ai/tools/developerChoice.ts`である場合、ここでは`developerChoice`を登録します。

内蔵の`suggestions`の登録プロセスも同様に行われます：

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

その後、`PluginAIClientV2.load()`が`registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)`を呼び出し、カードをサーバーから返された同名のTool定義にマージします。

## カード、モーダル、フロントエンド実行を選択する

以下にクライアント`ToolsOptions`の常用設定を列挙します。完全な型定義については`packages/core/client-v2/src/ai/tools-manager/types.ts`を参照してください。

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
      // modal.props、useOnOk 等の設定については完全な型定義を確認してください。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等のその他の設定については完全な型定義を確認してください。
};
```

### カードを使用する

デフォルトでは、まず `card` を使用します。カードは ToolCall の位置に実行状態、確認ボタン、少数の選択肢を表示する場合に適しています。

### モーダルを使用する

コンテンツが多い場合、大きなプレビューや複雑なパラメータ編集が必要な場合に `modal` を追加します。

### ブラウザで Tool を実行する

サーバー側の Tool で `execution: 'frontend'` が設定されている場合、クライアント側で `invoke` を提供する必要があります。この種類の Tool は、現在のページコンテキスト、エディタの内容、FlowEngine の状態を読み取る用途に適しています。サーバー側の権限保護が必要なデータ書き込みには適していません。

## 完全な例：組み込み AI 従業員に選択カードを追加する

[完全な例：組み込み AI 従業員の作成](./complete-example.md)を完了した後、`Dev Helper` の追加質問をクリック可能な選択肢にするには、`developerChoice` Tool を定義してフロントエンドカードを登録します。サーバー側のファイルは以下に配置します：

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

このToolは、オプションを宣言し、ユーザーの選択を受け取る役割を担います：

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
`developerChoice.ts`は`welcome-developer` Skillの`tools/`ディレクトリにあるため、自動的に現在のSkillにバインドされます。ただし、バインドされていることはモデルがこのToolを使用できることを意味しており、必ず呼び出されることを保証するものではありません。

また、`SKILLS.md`のワークフローを同期的に修正し、元のステップ5〜6を以下に置き換える必要があります：

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

フロントエンドカードは、先に定義した`DeveloperChoiceCard`を再利用し、以下に保存します：

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

最後に`src/client-v2/plugin.tsx`で登録します：

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

カードの登録が完了したら、クライアントを再ビルドしてください。会話の中で`developerChoice`が実行されると、ToolCallが一時停止し、クリック可能なオプションが表示されます。

<!-- 会話の中でdeveloperChoiceのクリック可能なオプションが表示されているスクリーンショットが必要 -->

## 関連リンク

- [サーバー側Toolの定義](./define-tool.md) — フロントエンドカードに対応するサーバー側Toolの定義
- [完全な例：組み込み AI 従業員の作成](./complete-example.md) — まずDev Helperの基本例を完成させる
- [AI 従業員プラグインの国際化](./internationalization.md) — ToolとSkillの管理インターフェース文言の翻訳
- [クライアントプラグイン](../../../plugin-development/client/plugin.md) — クライアントプラグインのエントリポイントと`load()`について
