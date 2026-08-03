---
title: "組み込み AI 従業員の定義"
description: "NocoBase プラグインで defineAIEmployee、prompt.md、skills および tools ディレクトリを使用して組み込み AI 従業員を作成する方法について説明します。"
keywords: "NocoBase,組み込み AI 従業員,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# 組み込み AI 従業員の定義

組み込み AI 従業員はプラグインと共に登録されます。プラグインが最初にロードされた際、NocoBase は対応する従業員レコードを作成し、組み込み従業員としてマークします。それ以降のプラグインロード時には、コードに基づいて従業員のデフォルトプロフィール、プロンプト、スキル、およびツールが更新されます。

## 単一ファイルとディレクトリの2つの形式

プロフィールがシンプルで、独立したプロンプトや専用リソースが不要な場合は、単一ファイルを使用できます：

```text
src/ai/ai-employees/lina.ts
```

`prompt.md`、専用の Skill または専用の Tool が必要な場合は、ディレクトリを使用します：

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

ディレクトリ形式の方が長期的なメンテナンスに適しています。

## `defineAIEmployee()` の使用

`index.ts` では、`@nocobase/ai` が提供する `defineAIEmployee()` を使用します：

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

主なフィールドは以下の通りです：

| フィールド | 役割 |
| --- | --- |
| `username` | AI 従業員のユニーク識別子。必須であり、長期的な安定性が必要です |
| `category` | 従業員のカテゴリ。例：`developer` または `business` |
| `description` | 内部的な説明および検索情報 |
| `avatar` | アバター識別子 |
| `nickname` | ユーザーに表示される名前 |
| `position` | 役職 |
| `bio` | プロフィール/略歴 |
| `greeting` | 新規チャット時の挨拶 |
| `systemPrompt` | デフォルトのシステムプロンプト |
| `skills` | 明示的にバインドされた Skill 名 |
| `tools` | 明示的にバインドされた Tool 設定 |
| `chatSettings` | Skill や Tool の有効化、およびシステムプロンプトモードなどのチャット設定 |
| `sort` | 組み込み従業員のソート順 |

現在の `tools` の型はオブジェクトの配列です：

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter の scope は CUSTOM である必要があります
]
```

`autoCall` は、現在の AI 従業員による `CUSTOM` Tool の呼び出し権限をオーバーライドするためにのみ使用されます。`GENERAL` および `SPECIFIED` Tool の場合、実行時は引き続き Tool 自身の `defaultPermission` が優先されます。`CUSTOM` Tool に従業員レベルの設定がない場合も、Tool 自身の `defaultPermission` にフォールバックします。

ディレクトリ内で自動的に検出された Tool は、`{ name: 'toolName' }` に正規化されます。

## 長いプロンプトを `prompt.md` に配置する

AI 従業員をディレクトリ形式で作成する場合、システムプロンプトを同階層の `prompt.md` に配置できます：

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

`prompt.md` が存在する場合、`index.ts` 内の `systemPrompt` を上書きします。長いプロンプトを Markdown ファイルに記述することで、レビューが容易になり、TypeScript のテンプレート文字列におけるエスケープの問題を回避できます。

## 組み込み AI 従業員の例：Nathan

`packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` の従業員プロフィールは非常に簡潔です：

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

Nathan の完全な能力は、同一ディレクトリ内の他のリソースから得られています：

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

ロードプロセスによって、以下の3層のバインディングが自動的に完了します：

1. `tools/` 内のファイルが Tool として登録される
2. Tool が `frontend-developer` Skill に自動的にバインドされる
3. Skill が Nathan に自動的にバインドされる

そのため、`index.ts` で一連の `skills` や `tools` を重複して列挙する必要はありません。

## 関連リンク

- [AI 従業員プラグイン開発](./index.md) — 組み込み AI 従業員と Tool、Skill の関係について
- [Skill の定義](./define-skill.md) — 従業員専用の Skill を作成する
- [完全な例：組み込み AI 従業員の作成](./complete-example.md) — 完全な従業員ディレクトリと登録プロセスを確認する
- [AI 従業員プラグインの国際化](./internationalization.md) — 従業員プロフィールと Tool、Skill の文言におけるローカライズの違いについて
