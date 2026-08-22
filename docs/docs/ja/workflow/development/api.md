---
title: "APIリファレンス"
description: "ワークフロー拡張APIリファレンス：Workflow Model、ノード実行コンテキスト、トリガーAPI、変数の受け渡し。"
keywords: "ワークフロー,APIリファレンス,Workflow Model,ノードコンテキスト,トリガーAPI,NocoBase"
---

# APIリファレンス

## サーバーサイド

サーバーサイドのパッケージ構造で利用できるAPIは、以下のコードで示されています。

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

ワークフロープラグインのクラスです。

通常、アプリケーションの実行時に、アプリケーションインスタンスの `app` を取得できる場所であればどこでも、`app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` を呼び出してワークフロープラグインのインスタンスを取得できます（以降、このインスタンスを `plugin` と表記します）。

#### `registerTrigger()`

新しいトリガータイプを拡張して登録します。

**シグネチャ**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**パラメーター**

| パラメーター | 型                        | 説明             |
| --------- | --------------------------- | ---------------- |
| `type`    | `string`                    | トリガータイプの識別子 |
| `trigger` | `typeof Trigger \| Trigger` | トリガーの型またはインスタンス |

**例**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

新しいノードタイプを拡張して登録します。

**シグネチャ**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**パラメーター**

| パラメーター | 型                                | 説明           |
| ------------- | ----------------------------------- | -------------- |
| `type`        | `string`                            | Instructionタイプの識別子 |
| `instruction` | `typeof Instruction \| Instruction` | Instructionの型またはインスタンス |

**例**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

特定のワークフローをトリガーします。主に、カスタムトリガーで特定のカスタムイベントをリッスンしたときに、対応するワークフローをトリガーするために使用されます。

**シグネチャ**

`trigger(workflow: Workflow, context: any)`

**パラメーター**
| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | トリガーするワークフローオブジェクト |
| `context` | `object` | トリガー時に提供されるコンテキストデータ |

:::info{title=ヒント}
現在、`context` は必須項目です。提供されない場合、ワークフローはトリガーされません。
:::

**例**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

特定のノードジョブで待機中のワークフローの実行を再開します。

- 待機状態（`EXECUTION_STATUS.STARTED`）にあるワークフローのみが再開できます。
- 保留状態（`JOB_STATUS.PENDING`）にあるノードジョブのみが再開できます。

**シグネチャ**

`resume(job: JobModel)`

**パラメーター**

| パラメーター | 型       | 説明             |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | 更新されたジョブオブジェクト |

:::info{title=ヒント}
渡されるジョブオブジェクトは通常、更新されたオブジェクトであり、その `status` は通常 `JOB_STATUS.PENDING` 以外の値に更新されます。そうしないと、引き続き待機状態のままになります。
:::

**例**

詳細は[ソースコード](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99)を参照してください。

### `Trigger`

カスタムトリガータイプを拡張するためのトリガー基底クラスです。

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| パラメーター  | 型                                                        | 説明                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | コンストラクター               |
| `on?`         | `(workflow: WorkflowModel): void`                           | ワークフロー有効化後のイベントハンドラー |
| `off?`        | `(workflow: WorkflowModel): void`                           | ワークフロー無効化後のイベントハンドラー |

`on` / `off` は、ワークフローの有効化/無効化時にイベントリスナーを登録/登録解除するために使用されます。渡されるパラメーターは、トリガーに対応するワークフローインスタンスであり、設定に基づいて処理できます。すでにグローバルにイベントをリッスンしている一部のトリガータイプでは、これらの2つのメソッドを実装する必要がない場合があります。例えば、タイマートリガーでは、`on` でタイマーを登録し、`off` でタイマーを登録解除できます。

### `Instruction`

カスタムInstructionタイプを拡張するためのInstruction基底クラスです。

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| パラメーター  | 型                                                            | 説明                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | コンストラクター                           |
| `run`         | `Runner`                                                        | ノードへの初回エントリー時の実行ロジック             |
| `resume?`     | `Runner`                                                        | 中断からの再開後にノードに入る実行ロジック |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | 対応するノードが生成するブランチのローカル変数コンテンツを提供します |

**関連タイプ**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

`getScope` については、[ループノードの実装](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83)を参照してください。これは、ブランチのローカル変数コンテンツを提供するために使用されます。

### `EXECUTION_STATUS`

ワークフロー実行プランのステータス定数テーブルで、対応する実行プランの現在のステータスを識別するために使用されます。

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

| 定数名                          | 意味                 |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | キューイング中               |
| `EXECUTION_STATUS.STARTED`      | 実行中               |
| `EXECUTION_STATUS.RESOLVED`     | 正常完了             |
| `EXECUTION_STATUS.FAILED`       | 失敗                 |
| `EXECUTION_STATUS.ERROR`        | エラー             |
| `EXECUTION_STATUS.ABORTED`      | 中断済み               |
| `EXECUTION_STATUS.CANCELED`     | キャンセル済み               |
| `EXECUTION_STATUS.REJECTED`     | 拒否済み               |
| `EXECUTION_STATUS.RETRY_NEEDED` | 未成功実行、リトライが必要 |

最初の3つを除き、その他はすべて失敗状態を表しますが、異なる失敗理由を記述するために使用できます。

### `JOB_STATUS`

ワークフローノードジョブのステータス定数テーブルで、対応するノードジョブの現在のステータスを識別するために使用されます。ノードによって生成されたステータスは、実行プラン全体のステータスにも影響を与えます。

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| 定数名                    | 意味                                     |
| -------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | 保留中：このノードまで実行が到達しましたが、Instructionにより一時停止して待機することが要求されています |
| `JOB_STATUS.RESOLVED`     | 正常完了                                 |
| `JOB_STATUS.FAILED`       | 失敗：このノードの実行が設定条件を満たしませんでした         |
| `JOB_STATUS.ERROR`        | エラー：このノードの実行中に未処理のエラーが発生しました   |
| `JOB_STATUS.ABORTED`      | 中止：このノードは保留状態の後、他のロジックによって実行が終了されました   |
| `JOB_STATUS.CANCELED`     | キャンセル：このノードは保留状態の後、手動で実行がキャンセルされました       |
| `JOB_STATUS.REJECTED`     | 拒否：このノードは保留状態の後、手動で続行が拒否されました       |
| `JOB_STATUS.RETRY_NEEDED` | 未成功実行、リトライが必要                     |

## クライアントサイド

クライアントサイドのパッケージ構造で利用できるAPIは、以下のコードで示されています。

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

ワークフロークライアントプラグインのクラスです。通常、`this.app.pm.get('workflow')` で取得できます。

#### `registerTrigger()`

トリガータイプの設定パネルを登録します。

**シグネチャ**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**パラメーター**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `type` | `string` | トリガータイプの識別子。サーバーサイドで登録した識別子と一致させます |
| `trigger` | `typeof Trigger \| Trigger` | トリガーの型またはインスタンス |

#### `registerInstruction()`

ノードタイプの設定パネルを登録します。

**シグネチャ**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**パラメーター**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `type` | `string` | ノードタイプの識別子。サーバーサイドで登録した識別子と一致させます |
| `instruction` | `typeof Instruction \| Instruction` | ノードの型またはインスタンス |

#### `registerInstructionGroup()`

ノードタイプのグループを登録します。NocoBaseはデフォルトで以下の4つのノードタイプグループを提供しています。

* `'control'`：制御系
* `'collection'`：コレクション操作系
* `'manual'`：手動処理系
* `'extended'`：その他の拡張系

他のグループを拡張する必要がある場合は、このメソッドを使用して登録できます。

**シグネチャ**

`registerInstructionGroup(type: string, group: { label: string }): void`

**パラメーター**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `type` | `string` | ノードグループの識別子 |
| `group` | `{ label: string }` | グループ情報。現在はタイトルのみが含まれます |

**例**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

ワークフローが同期モードかどうかを判定します。

**シグネチャ**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

カスタムトリガータイプを拡張するためのトリガー基底クラスです。

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `title` | `string` | トリガータイプ名 |
| `description?` | `string` | トリガータイプの説明 |
| `PresetFieldsetLoader?` | `LoaderOf` | 作成時のプリセット設定フォーム（遅延読み込み） |
| `FieldsetLoader?` | `LoaderOf` | トリガーの完全な設定フォーム（遅延読み込み） |
| `TriggerFieldsetLoader?` | `LoaderOf` | 手動実行時の入力フォーム（遅延読み込み） |
| `validate` | `(config: Record<string, unknown>) => boolean` | 設定のバリデーション。設定が有効な場合 `true` を返します |
| `createDefaultConfig?` | `() => Record<string, unknown>` | デフォルトの設定値を提供します |
| `useVariables?` | `(config, options?: UseVariableOptions) => VariableOption[] \| null` | トリガーコンテキストデータの変数オプション |
| `getCreateModelMenuItem?` | `(args) => SubModelItem \| SubModelItem[] \| null` | キャンバス上でサブモデルを作成するためのメニュー項目 |
| `useTempAssociationSource?` | `(config, workflow?) => TriggerTempAssociationSource \| null` | 一時的な関連データソースを提供します |

**関連タイプ**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- `useVariables` が設定されていない場合、このトリガータイプは値取得機能を提供しないことを意味し、ワークフローのノードでトリガーのコンテキストデータを選択することはできません。

### `Instruction`

カスタムノードタイプを拡張するためのInstruction基底クラスです。

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `title` | `string` | ノードタイプ名 |
| `type` | `string` | ノードタイプの識別子 |
| `group` | `string` | ノードタイプグループの識別子。オプション：`'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?` | `string` | ノードタイプの説明 |
| `icon?` | `JSX.Element` | ノードアイコン |
| `FieldsetLoader?` | `LoaderOf` | ノード設定ドロワーのフォーム（遅延読み込み） |
| `PresetFieldsetLoader?` | `LoaderOf` | 作成時のプリセット設定フォーム（遅延読み込み） |
| `ComponentLoader?` | `LoaderOf<{ data: any }>` | キャンバス上でのカスタムノードレンダリング（遅延読み込み）。ブランチノードなど特殊なレンダリングが必要な場合に使用します |
| `branching?` | `boolean \| object \| ((config) => boolean \| object)` | ノードがブランチノードかどうかを宣言します |
| `end?` | `boolean \| ((node) => boolean)` | ノードが終端ノードかどうかを宣言します |
| `testable?` | `boolean` | ノードがテスト実行をサポートするかどうかを宣言します |
| `createDefaultConfig?` | `() => object` | デフォルトの設定値を提供します |
| `useVariables?` | `(node, options?: UseVariableOptions) => VariableOption` | ノードが変数オプションを提供するためのメソッド |
| `useScopeVariables?` | `(node, options?) => VariableOption[] \| MetaTreeNode[]` | ノードがブランチスコープの変数オプションを提供するためのメソッド |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | ノードが利用可能かどうかを判断するメソッド |
| `getCreateModelMenuItem?` | `({ node, workflow }) => SubModelItem \| null` | キャンバス上でサブモデルを作成するためのメニュー項目 |
| `useTempAssociationSource?` | `(node) => TempAssociationSource \| null` | 一時的な関連データソースを提供します |

**関連タイプ**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- `useVariables` が設定されていない場合、このノードタイプは値取得機能を提供しないことを意味し、ワークフローのノードでこのタイプのノードの結果データを選択することはできません。結果値が単一（選択不可）の場合、対応する情報を表現する静的なコンテンツを返すことができます（参照：[計算ノードのソースコード](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)）。選択可能にする必要がある場合（例：オブジェクトのプロパティ）、対応する選択コンポーネントの出力をカスタマイズできます（参照：[データ取得ノードのソースコード](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)）。
- `ComponentLoader` はノードのカスタムレンダリングコンポーネントです。デフォルトのノードレンダリングでは不十分な場合、完全にオーバーライドしてカスタムノードビューのレンダリングに使用できます。例えば、ブランチタイプのノードに追加のブランチレンダリングを提供する場合などです（参照：[条件ノードのソースコード](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)）。
- `isAvailable` は、ノードが現在の環境で使用（追加）できるかどうかを判断するために主に使用されます。現在の環境には、ワークフロープラグインのインスタンス、現在のワークフロー、上流ノード、現在のブランチインデックスが含まれます。

### 変数入力コンポーネント

ワークフローは、ノード/トリガー設定フォームでユーザーがワークフロー変数を選択できるようにするための変数入力コンポーネントセットを提供しています。

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

変数を選択してから続けてコンテンツを入力できる変数入力コンポーネントです。変数参照と自由テキストを混在させる必要がある単一行入力シナリオに適しています。

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `value?` | `string` | 変数パスの値。例：`{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?` | `(value: string) => void` | 値変更時のコールバック |
| `variableOptions?` | `UseWorkflowVariableOptions` | 変数フィルターオプション（型フィルタリング、深度など） |
| `disabled?` | `boolean` | 無効化するかどうか |
| `placeholder?` | `string` | プレースホルダーテキスト |

#### `WorkflowVariableTextArea`

カーソル位置に変数参照を挿入できる複数行テキストエリアです。HTTPボディやテンプレートテキストなどの自由テキストシナリオに適しています。

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `value?` | `string` | テキスト値（変数参照を含む場合があります） |
| `onChange?` | `(value: string) => void` | 値変更時のコールバック |
| `variableOptions?` | `UseWorkflowVariableOptions` | 変数フィルターオプション |
| `delimiters?` | `readonly [string, string]` | 変数デリミター。デフォルトは `['{{', '}}']` |

antd `TextArea` の他のProps（`autoSize`、`placeholder` など）を継承します。

#### `WorkflowTypedVariableInput`

「定数」モードと「変数参照」モードを切り替えられる型付き入力コンポーネントです。変数モードでは変数の選択のみが可能で、選択後に続けて入力することはできません。定数モードでは `string`、`number`、`boolean`、`date`、`object` の5つの型がサポートされています。

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `variableOptions?` | `UseWorkflowVariableOptions` | 変数フィルターオプション |

`TypedVariableInput` の他のProps（内部使用の `extraNodes`、`metaTree`、`namespaces` を除く）を継承します。

#### `WorkflowVariableWrapper`

異なるコンテキストで異なる入力コンポーネントを置き換えるための汎用ラッパーです。例えば、同じフィールドがトリガーノード設定とノード設定ドロワーで異なる入力方法を必要とする場合、このコンポーネントを使用してネイティブ入力を変数モード切替可能な入力にラップできます。

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `value?` | `TValue \| string \| null` | 現在の値（定数値または変数パス文字列） |
| `onChange?` | `(value: TValue \| string \| null) => void` | 値変更時のコールバック |
| `variableOptions?` | `UseWorkflowVariableOptions` | 変数フィルターオプション |
| `render` | `(props: { value?, onChange? }) => ReactNode` | ネイティブ入力コンポーネントをレンダリングします |
| `clearValue?` | `TValue \| null` | 変数モードから定数モードに切り替える際の初期値。デフォルトは `null` |

### コレクション関連コンポーネント

ワークフローは、コレクション関連のヘルパーコンポーネントセットも提供しています。

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` — データソース対応のコレクションセレクター（カスケーダー）
- `AppendsSelect` — 関連フィールドプリロードセレクター（ツリーセレクト）
- `FieldsSelect` — コレクションフィールドの複数選択セレクター
- `SortFieldsInput` — ソートフィールド入力
- `PaginationFields` — ページネーションパラメーターのフォーム項目
