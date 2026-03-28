:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/flow-engine/runjs-extension-points)をご参照ください。
:::

# RunJS プラグイン拡張ポイント（ctx ドキュメント / スニペット / シーンマッピング）

プラグインが RunJS の機能を新規追加または拡張する場合、**公式の拡張ポイント**を通じて「コンテキストマッピング / `ctx` ドキュメント / サンプルコード」を一括で登録することをお勧めします。これにより、以下のことが可能になります：

- CodeEditor で `ctx.xxx.yyy` の自動補完が有効になります。
- AI コーディングにおいて、構造化された `ctx` API リファレンスとサンプルを取得できるようになります。

本章では、2 つの拡張ポイントを紹介します：

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

RunJS の「コントリビューション（貢献）」を登録するために使用されます。主な用途は以下の通りです：

- `RunJSContextRegistry` マッピング（modelClass -> RunJSContext、`scenes` を含む）の追加または上書き。
- `FlowRunJSContext` またはカスタム RunJSContext に対して `RunJSDocMeta`（`ctx` API の説明/サンプル/補完テンプレート）を拡張。

### 動作説明

- コントリビューションは `setupRunJSContexts()` フェーズで一括して実行されます。
- `setupRunJSContexts()` がすでに完了している場合、**後から登録されたものは即座に一度実行されます**（セットアップを再実行する必要はありません）。
- 各コントリビューションは、各 `RunJSVersion` に対して**最大 1 回のみ実行されます**。

### 実行例：JS 記述可能なモデルコンテキストの新規追加

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx ドキュメント/補完 (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) model -> context マッピング (scene はエディタの補完やスニペットのフィルタリングに影響します)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

RunJS のサンプルコードスニペットを登録するために使用されます。用途は以下の通りです：

- CodeEditor のスニペット補完。
- AI コーディングのサンプル/リファレンス素材（シーン/バージョン/ロケールに応じて調整可能）。

### 推奨される ref の命名

以下の形式を使用することをお勧めします：`plugin/<pluginName>/<topic>`。例：

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

コアの `global/*` や `scene/*` との衝突を避けてください。

### 衝突時の戦略

- デフォルトでは既存の `ref` は上書きされません（エラーはスローせず `false` を返します）。
- 上書きが必要な場合は、明示的に `{ override: true }` を渡します。

### 実行例：スニペットの登録

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. ベストプラクティス

- **ドキュメント + スニペットの階層的な管理**：
  - `RunJSDocMeta`：説明/補完テンプレート（短く、構造化されたもの）。
  - スニペット：長いサンプル（再利用可能、シーン/バージョンでフィルタリング可能）。
- **プロンプトが長くなりすぎるのを避ける**：サンプルは多すぎないようにし、「最小限の実行可能なテンプレート」に絞り込むことを優先してください。
- **シーンの優先順位**：JS コードが主にフォームやテーブルなどの特定のシーンで実行される場合は、補完やサンプルの関連性を高めるために `scenes` を正しく入力してください。

## 4. 実際の ctx に基づく補完の非表示：`hidden(ctx)`

一部の `ctx` API は特定のシーンに強く依存します（例：`ctx.popup` はポップアップやドロワーが開いているときのみ使用可能です）。補完時にこれらの使用不可能な API を非表示にしたい場合は、`RunJSDocMeta` の対応する項目に `hidden(ctx)` を定義できます：

- `true` を返す：現在のノードとそのサブツリーを非表示にします。
- `string[]` を返す：現在のノード配下の特定のサブパスを非表示にします（複数のパスを一度に返すことが可能。パスは相対パスで、前方一致でサブツリーを非表示にします）。

`hidden(ctx)` は `async` をサポートしています：`await ctx.getVar('ctx.xxx')` を使用して判断できます（利用者が判断）。可能な限り高速で、副作用のない（ネットワークリクエストを行わないなど）処理にすることをお勧めします。

例：`popup.uid` が存在する場合のみ `ctx.popup.*` の補完を表示する

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

例：popup は利用可能だが、一部のサブパスを非表示にする（相対パスのみ。例：`record` と `parent.record` を非表示にする）

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

補足：CodeEditor は常に実際の `ctx` に基づく補完フィルタリングを有効にします（fail-open、エラーはスローしません）。

## 5. 実行時の `info/meta` とコンテキスト情報 API（補完および LLM 向け）

`FlowRunJSContext.define()` による静的な `ctx` ドキュメントの管理に加え、実行時に `FlowContext.defineProperty/defineMethod` を通じて **info/meta** を注入することもできます。また、以下の API を使用して、CodeEditor や大規模言語モデル（LLM）向けに**シリアライズ可能**なコンテキスト情報を出力できます。

- `await ctx.getApiInfos(options?)`：静的な API 情報。
- `await ctx.getVarInfos(options?)`：変数構造の情報（`meta` 由来。path/maxDepth による展開をサポート）。
- `await ctx.getEnvInfos()`：実行環境のスナップショット。

### 5.1 `defineMethod(name, fn, info?)`

`info` は以下をサポートします（すべて任意）：

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns`（JSDoc 風）

> 注意：`getApiInfos()` は静的な API ドキュメントを出力するため、`deprecated` / `disabled` / `disabledReason` などのフィールドは含まれません。

例：`ctx.refreshTargets()` にドキュメントリンクを提供する

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'ターゲットブロックのデータをリフレッシュします',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`：変数セレクター UI（`getPropertyMetaTree` / `FlowContextSelector`）で使用され、表示の有無、ツリー構造、無効化などを決定します（関数/async をサポート）。
  - よく使われるフィールド：`title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`：静的な API ドキュメント（`getApiInfos`）および LLM 向けの説明に使用され、変数セレクター UI には影響しません（関数/async をサポート）。
  - よく使われるフィールド：`title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

`meta` のみが提供され、`info` が提供されない場合：

- `getApiInfos()` はそのキーを返しません（静的 API ドキュメントは `meta` から推論されないため）。
- `getVarInfos()` は `meta` に基づいて変数構造を構築します（変数セレクター/動的変数ツリー用）。

### 5.3 コンテキスト情報 API

「利用可能なコンテキスト機能情報」を出力するために使用されます。

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // await ctx.getVar(getVar) で直接使用可能。"ctx." で始まることを推奨
  value?: any; // 解析済みの静的な値（シリアライズ可能。推論可能な場合のみ返される）
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // 静的ドキュメント（トップレベル）
type FlowContextVarInfos = Record<string, any>; // 変数構造（path/maxDepth で展開可能）
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

よく使われるパラメータ：

- `getApiInfos({ version })`：RunJS ドキュメントのバージョン（デフォルトは `v1`）。
- `getVarInfos({ path, maxDepth })`：トリミングと最大展開深度（デフォルトは 3）。

注意：上記の API の戻り値には関数が含まれないため、そのままシリアライズして LLM に渡すのに適しています。

### 5.4 `await ctx.getVar(path)`

設定やユーザー入力などから得られた「変数パス文字列」があり、その変数の実行時の値を直接取得したい場合は、`getVar` を使用します：

- 例：`const v = await ctx.getVar('ctx.record.roles.id')`
- `path` は `ctx.` で始まる式パスです（例：`ctx.record.id` / `ctx.record.roles[0].id`）。

補足：アンダースコア `_` で始まるメソッドやプロパティはプライベートメンバーと見なされ、`getApiInfos()` や `getVarInfos()` の出力には含まれません。