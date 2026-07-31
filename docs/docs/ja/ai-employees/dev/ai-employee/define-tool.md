---
title: "サーバーサイド Tool の定義"
description: "NocoBase AI 従業員のサーバーサイド Tool における defineTools、scope、schema、invoke、権限、およびディレクトリによる登録方法について解説します。"
keywords: "NocoBase,AI 従業員 Tool,defineTools,ToolsOptions,Zod,invoke"
---

# サーバーサイド Tool の定義

## Tool の最小構成

サーバーサイド Tool は、`@nocobase/ai` が提供する `defineTools()` を使用して定義します。以下の Tool は、名前を受け取り、挨拶文を返します。

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

ファイルパスが `src/ai/tools/greetDeveloper.ts` である場合、ローダーはファイル名 `greetDeveloper` を最終的な Tool 名として使用します。`definition.name` に別の値が指定されていても、登録時にファイル名で上書きされます。

そのため、デフォルトではファイル名、`definition.name`、Skill で参照される名前、およびフロントエンドで登録される名前を一致させることを推奨します。

## Tool 設定項目

`defineTools()` の主な設定は以下の通りです。

| 設定 | 役割 | デフォルト値 |
| --- | --- | --- |
| `scope` | Tool の利用範囲を決定 | 必須 |
| `execution` | ロジックを `backend` または `frontend` のどちらで実行するかを指定 | `backend` |
| `defaultPermission` | Tool 呼び出し前に直接許可するか、確認を求めるか | `ASK` |
| `silence` | 会話中の Tool 呼び出しヒントを非表示にするか | `false` |
| `introduction` | 管理画面に表示されるタイトルと説明 | Tool 名を使用 |
| `definition` | モデルに提供する名前、説明、およびパラメータの schema | 必須 |
| `invoke` | Tool の実際の実行ロジック | 必須 |

`scope` の選択は、Tool がどのように AI 従業員のコンテキストに組み込まれるかに直接影響します。

| `scope` | 利用方法 |
| --- | --- |
| `GENERAL` | すべての AI 従業員で共有。通常、汎用的な基本機能に使用されます |
| `SPECIFIED` | その Tool がバインドされている Skill または AI 従業員のみが利用可能 |
| `CUSTOM` | 管理者が AI 従業員の設定で手動で追加し、「確認」または「許可」を設定可能 |

デフォルトでは `SPECIFIED` を推奨します。すべての AI 従業員にこの機能が必要であると確信がある場合は `GENERAL` を使用し、管理者がエージェントごとに選択できるようにしたい場合は `CUSTOM` を使用してください。

## `definition` はモデル向けに記述する

`definition.description` と `definition.schema` は、モデルがその Tool を選択するかどうか、およびどのようにパラメータを構築するかに影響します。説明には以下の3点を明確にする必要があります。

- どのような状況で呼び出すか
- 各パラメータが何を表すか
- どのような処理をこの Tool で行うべきではないか

パラメータの schema には Zod の使用を推奨します。

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Tool 名も安定させる必要があります。Skill、AI 従業員の設定、フロントエンドのカード、および保存済みのチャットメッセージは、すべてこの名前を通じて Tool を特定します。

## `invoke()` で取得できるもの

サーバーサイドの `invoke()` は3つの引数を受け取ります。

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：現在の NocoBase action Context
  // args：モデルが schema に基づいて生成したパラメータ
  // runtime.toolCallId：現在の ToolCall ID
  // runtime.writer(chunk)：中間結果をストリーミングで書き出す
}
```

`ctx` を通じて、現在のアプリケーション、データベース、認証情報、および action パラメータにアクセスできます。例：

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

Tool は、成功または失敗を判断できる構造を返すべきです。組み込み Tool では通常、以下の形式が使用されます。

```ts
return {
  status: 'success',
  content: result,
};
```

想定されるビジネスロジック上の失敗が発生した際も、明確なステータスと理由を返すべきであり、モデルに操作の成否を推測させてはいけません。

## 長い説明をディレクトリに保存する

Tool は単一ファイル形式のほか、ディレクトリ形式で定義することも可能です。

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` は `defineTools()` の結果をデフォルトエクスポートします。`description.md` が存在する場合、その内容全体が `definition.description` を上書きします。これは、詳細な Tool 使用説明を保存する場合に適しています。

ディレクトリ名 `documentSearch` が最終的な登録名になります。

## 組み込み Tool の例：`subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` に完全なサーバーサイド Tool の実装例があります。

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
    // AI プラグインと現在のセッションで使用されるモデル設定を取得。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立したクエリを並列に実行し、最後にまとめて返す。
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

この実装には、再利用可能ないくつかの手法が含まれています。

- `SPECIFIED` を使用して、Tool を特定のエージェントまたは Skill にのみ限定する
- Zod を使用して、モデルが生成するパラメータを制約する
- `ctx.action.params.values` から現在の AI セッション設定を読み取る
- 依存関係のない複数のクエリを1つの ToolCall に含め、`Promise.all()` で並列実行する
- ソースが明確な構造化された結果を返し、上位のモデルに整理させる

## 関連リンク

- [AI 従業員プラグイン開発](./index.md) — 拡張が必要な能力レベルを選択
- [Skill の定義](./define-skill.md) — Skill を使用して複数の Tool の呼び出しフローを構築
- [完全な例：組み込み AI 従業員の作成](./complete-example.md) — 動作可能な Tool の例を確認
- [Tool にフロントエンドインタラクションを追加する](./frontend-tool-ui.md) — ToolCall に確認および選択インターフェースを追加
