:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/flow-engine/flow-context)をご参照ください。
:::

# コンテキスト体系の概要

NocoBase ワークフローエンジンのコンテキスト体系は3つのレイヤーに分かれており、それぞれ異なるスコープに対応しています。これらを適切に使用することで、サービス、設定、データの柔軟な共有と分離を実現し、ビジネスの保守性と拡張性を向上させることができます。

- **FlowEngineContext（グローバルコンテキスト）**：グローバルで一意であり、すべてのモデルやワークフローからアクセス可能です。グローバルなサービスや設定の登録などに適しています。
- **FlowModelContext（モデルコンテキスト）**：モデルツリー内部でコンテキストを共有するために使用されます。子モデルは親モデルのコンテキストを自動的にプロキシ（delegate）し、同名の上書きをサポートします。モデルレベルのロジックとデータの分離に適しています。
- **FlowRuntimeContext（ワークフロー実行時コンテキスト）**：ワークフローが実行されるたびに作成され、ワークフローの実行サイクル全体を通して存続します。ワークフロー内でのデータ受け渡し、変数保存、実行状態の記録などに適しています。`mode: 'runtime' | 'settings'` の2つのモードをサポートしており、それぞれ実行状態と設定状態に対応しています。

すべての `FlowEngineContext`（グローバルコンテキスト）、`FlowModelContext`（モデルコンテキスト）、`FlowRuntimeContext`（ワークフロー実行時コンテキスト）などは、`FlowContext` のサブクラスまたはインスタンスです。

---

## 🗂️ 階層構造図

```text
FlowEngineContext（グローバルコンテキスト）
│
├── FlowModelContext（モデルコンテキスト）
│     ├── 子 FlowModelContext（子モデル）
│     │     ├── FlowRuntimeContext（ワークフロー実行時コンテキスト）
│     │     └── FlowRuntimeContext（ワークフロー実行時コンテキスト）
│     └── FlowRuntimeContext（ワークフロー実行時コンテキスト）
│
├── FlowModelContext（モデルコンテキスト）
│     └── FlowRuntimeContext（ワークフロー実行時コンテキスト）
│
└── FlowModelContext（モデルコンテキスト）
      ├── 子 FlowModelContext（子モデル）
      │     └── FlowRuntimeContext（ワークフロー実行時コンテキスト）
      └── FlowRuntimeContext（ワークフロー実行時コンテキスト）
```

- `FlowModelContext` はプロキシ（delegate）メカニズムを通じて `FlowEngineContext` のプロパティやメソッドにアクセスでき、グローバルな機能の共有を実現します。
- 子モデルの `FlowModelContext` はプロキシ（delegate）メカニズムを通じて親モデルのコンテキスト（同期関係）にアクセスでき、同名の上書きをサポートします。
- 非同期の親子モデルは、状態の汚染を避けるため、プロキシ（delegate）関係を構築しません。
- `FlowRuntimeContext` は常にプロキシ（delegate）メカニズムを通じて対応する `FlowModelContext` にアクセスしますが、上位に書き戻されることはありません。

---

## 🧭 実行状態と設定状態（mode）

`FlowRuntimeContext` は2つのモードをサポートしており、`mode` パラメータで区別されます：

- `mode: 'runtime'`（実行状態）：ワークフローの実際の実行フェーズで使用され、プロパティやメソッドは実際のデータを返します。例：
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'`（設定状態）：ワークフローの設計および設定フェーズで使用され、プロパティへのアクセスは変数のテンプレート文字列を返します。これにより、式や変数の選択が容易になります。例：
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

このデュアルモード設計は、実行時のデータ可用性を保証するだけでなく、設定時の変数参照や式生成を容易にし、ワークフローエンジンの柔軟性と使いやすさを向上させます。

---

## 🤖 ツール/大規模言語モデル向けのコンテキスト情報

特定のシナリオ（例：JS*Model の RunJS コード編集、AI コーディング）では、「呼び出し側」がコードを実行せずに以下の情報を把握する必要があります：

- 現在の `ctx` 下にどのような**静的能力**があるか（API ドキュメント、パラメータ、例、ドキュメントリンクなど）
- 現在のインターフェース/実行状態にどのような**選択可能な変数**があるか（例：「現在のレコード」、「現在のポップアップレコード」などの動的構造）
- 現在の実行環境の**軽量なスナップショット**（プロンプト用）

### 1) `await ctx.getApiInfos(options?)`（静的 API 情報）

### 2) `await ctx.getVarInfos(options?)`（変数構造情報）

- `defineProperty(...).meta`（meta factory を含む）に基づいて変数構造を構築します。
- `path` によるトリミングと `maxDepth` による深度制御をサポートしています。
- 必要な場合にのみ下位に展開します。

常用パラメータ：

- `maxDepth`：最大展開レベル（デフォルトは 3）
- `path: string | string[]`：トリミング。指定されたパスのサブツリーのみを出力します。

### 3) `await ctx.getEnvInfos()`（実行環境スナップショット）

ノード構造（簡略化）：

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // await ctx.getVar(getVar) で直接使用可能。"ctx." で始まります
  value?: any; // 解析済み/シリアル化可能な静的な値
  properties?: Record<string, EnvNode>;
};
```