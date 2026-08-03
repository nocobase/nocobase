---
title: "完全な例：組み込み AI 従業員の作成"
description: "完全な例を通じて、NocoBase プラグインでの Tool、Skill、システムプロンプト、および組み込み AI 従業員の定義方法を説明します。"
keywords: "NocoBase,Dev Helper,AI 従業員の例,defineTools,defineAIEmployee,SKILLS.md"
---

# 完全な例：組み込み AI 従業員の作成

ここでは、プラグイン開発を案内する組み込み AI 従業員を完全な例として作成します。この例では従業員を `Dev Helper` と名付け、Tool、Skill、システムプロンプトを設定します。ユーザーが「Alice に挨拶して」と言うと、従業員は `welcome-developer` Skill を読み込み、`greetDeveloper` Tool で名前を確認してから、ユーザーが使用している言語で挨拶を生成します。

:::tip 事前に読むドキュメント

- [サーバーサイド Tool の定義](./define-tool.md) — `defineTools()` と Tool の基本構造を確認する
- [Skill の定義](./define-skill.md) — `SKILLS.md` と Tool のバインドを確認する
- [組み込み AI 従業員の定義](./define-ai-employee.md) — `defineAIEmployee()` と従業員ディレクトリを確認する

:::

## 完成後の動作

完了後、このプラグインは以下の機能を提供します：

- `Dev Helper` という名前の組み込み AI 従業員の作成
- 従業員に `welcome-developer` Skill を自動的にバインド
- Skill を介して `greetDeveloper` Tool を呼び出し、開発者の名前を確認
- ユーザーが現在使用している言語に基づいた挨拶と、その後の質問を生成

<!-- AI 従業員管理ページで Dev Helper が組み込み従業員としてマークされているスクリーンショットが必要 -->

## 完成時のディレクトリ構造

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

この例ではフロントエンドのコードは不要であり、`src/server/plugin.ts` で手動で登録する必要もありません。

## ステップ 1：Tool を定義する

`src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts` を作成します：

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

## ステップ 2：Skill を定義する

`src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md` を作成します：

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

`greetDeveloper.ts` は現在の Skill の `tools/` ディレクトリにあるため、改めて `tools: [greetDeveloper]` と記述する必要はありません。

## ステップ 3：AI 従業員のプロフィールを定義する

`src/ai/ai-employees/dev-helper/index.ts` を作成します：

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

`username` はデータベース内の一意の識別子です。リリース後に不用意に変更しないでください。変更すると、NocoBase は新しい値を別の組み込み AI 従業員として認識します。

:::warning 注意

`username` は安定させるだけでなく、他のプラグインや既存の AI 従業員との重複を避ける必要があります。データベースに同じ `username` が既に存在する場合、プラグインのロード時に対応するレコードが更新され、隔離された新しい従業員は作成されません。

プラグインをリロードすると、コード内の `category`、`nickname`、`position`、`avatar`、`bio`、`greeting`、デフォルトのシステムプロンプト、Skill および Tool のバインド、`chatSettings`、および `sort` がデータベースに再書き込みされる可能性があります。正式なプラグインでは、`developer-helper-dev-assistant` のようにプラグインのプレフィックスを付けた名称を使用することを推奨します。

:::

## ステップ 4：システムプロンプトを定義する

`src/ai/ai-employees/dev-helper/prompt.md` を作成します：

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

これで、ディレクトリ関係による自動バインドが完了しました：

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## ステップ 5：有効化して確認する

再ビルドまたは開発サーバーを再起動し、これらのファイルを含むプラグインが有効になっていることを確認してください。その後、AI 従業員管理ページで以下を確認します：

- `Dev Helper` が表示されていること
- 従業員が組み込み従業員としてマークされていること
- 従業員専用の Skill に `welcome-developer` が含まれていること
- Skill 読み込み後に `greetDeveloper` が使用可能であること

対話の中で以下を入力してください：

```text
请向 Alice 打个招呼。
```

期待されるフローは以下の通りです：

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Tool を呼び出すたびにユーザーの確認を求められたくない場合は、`defaultPermission: 'ALLOW'` に設定してください。削除、一括変更、または外部への副作用を伴う Tool の場合は、デフォルトの `ASK` を保持するのが適切です。

## まとめ

| ファイル | 役割 |
| --- | --- |
| `greetDeveloper.ts` | 入力を検証し、構造化された Tool の結果を返す |
| `SKILLS.md` | Tool の呼び出しと応答の流れを定める |
| `prompt.md` | 従業員の役割と全体的な制約を定義する |
| `index.ts` | 組み込み AI 従業員のプロフィールを定義する |

## 関連リンク

- [AI 従業員プラグイン開発](./index.md) — Tool、Skill と組み込み AI 従業員のリレーションについて
- [サーバーサイド Tool の定義](./define-tool.md) — `defineTools()` の完全な設定について
- [Skill の定義](./define-skill.md) — `SKILLS.md` のフィールドと書き方について
- [組み込み AI 従業員の定義](./define-ai-employee.md) — `defineAIEmployee()` とディレクトリバインドについて
- [AI 従業員プラグインの国際化](./internationalization.md) — 例にある管理インターフェースの文言に翻訳を追加する方法
