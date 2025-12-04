:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

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
  // ワークフローをトリガー
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // イベントをリッスンしてワークフローをトリガー
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // リスナーを削除
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // ワークフロープラグインのインスタンスを取得
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // トリガーを登録
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
    // ワークフロープラグインのインスタンスを取得
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // Instructionを登録
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

特定のワークフローをトリガーします。これは主に、カスタムトリガーで特定のカスタムイベントをリッスンしたときに、対応するワークフローをトリガーするために使用されます。

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
    // イベントを登録
    this.timer = setInterval(() => {
      // ワークフローをトリガー
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

特定のノードタスクで一時停止中のワークフローの実行を再開します。

- 一時停止状態（`EXECUTION_STATUS.STARTED`）にあるワークフローのみが実行を再開できます。
- 保留状態（`JOB_STATUS.PENDING`）にあるノードタスクのみが実行を再開できます。

**シグネチャ**

`resume(job: JobModel)`

**パラメーター**

| パラメーター | 型       | 説明             |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | 更新されたジョブオブジェクト |

:::info{title=ヒント}
渡されるジョブオブジェクトは通常、更新されたオブジェクトであり、`status` は通常 `JOB_STATUS.PENDING` 以外の値に更新されます。そうしないと、引き続き一時停止状態になります。
:::

**例**

詳細は[ソースコード](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99)を参照してください。

### `Trigger`

カスタムトリガータイプを拡張するためのトリガー基底クラスです。

| パラメーター  | 型                                                        | 説明                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | コンストラクター               |
| `on?`         | `(workflow: WorkflowModel): void`                           | ワークフロー有効化後のイベントハンドラー |
| `off?`        | `(workflow: WorkflowModel): void`                           | ワークフロー無効化後のイベントハンドラー |

`on` / `off` は、ワークフローの有効化/無効化時にイベントリスナーを登録/登録解除するために使用されます。渡されるパラメーターは、対応するトリガーのワークフローインスタンスであり、関連する設定に基づいて処理できます。一部のトリガータイプでは、すでにグローバルにイベントをリッスンしている場合、これらの2つのメソッドを実装する必要はありません。例えば、タイマートリガーでは、`on` でタイマーを登録し、`off` でタイマーを登録解除できます。

### `Instruction`

カスタムInstructionタイプを拡張するためのInstruction基底クラスです。

| パラメーター  | 型                                                            | 説明                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | コンストラクター                           |
| `run`         | `Runner`                                                        | ノードへの初回エントリー時の実行ロジック             |
| `resume?`     | `Runner`                                                        | 中断からの実行再開後にノードに入る実行ロジック |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | 対応するノードが生成するブランチのローカル変数コンテンツを提供します |

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

| 定数名                          | 意味                 |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | キューイング中               |
| `EXECUTION_STATUS.STARTED`      | 実行中               |
| `EXECUTION_STATUS.RESOLVED`     | 正常完了             |
| `EXECUTION_STATUS.FAILED`       | 失敗                 |
| `EXECUTION_STATUS.ERROR`        | 実行エラー             |
| `EXECUTION_STATUS.ABORTED`      | 中断済み               |
| `EXECUTION_STATUS.CANCELED`     | キャンセル済み               |
| `EXECUTION_STATUS.REJECTED`     | 拒否済み               |
| `EXECUTION_STATUS.RETRY_NEEDED` | 未成功実行、リトライが必要 |

最初の3つを除き、その他はすべて失敗状態を表しますが、異なる失敗理由を表現するために使用できます。

### `JOB_STATUS`

ワークフローノードジョブのステータス定数テーブルで、対応するノードジョブの現在のステータスを識別するために使用されます。ノードによって生成されたステータスは、実行プラン全体のステータスにも影響を与えます。

| 定数名                    | 意味                                     |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | 保留中：このノードまで実行されましたが、Instructionにより一時停止が要求されています |
| `JOB_STATUS.RESOLVED`     | 正常完了                                 |
| `JOB_STATUS.FAILED`       | 失敗：このノードの実行が設定条件を満たしませんでした         |
| `JOB_STATUS.ERROR`        | エラー：このノードの実行中に捕捉されないエラーが発生しました   |
| `JOB_STATUS.ABORTED`      | 中止：このノードは一時停止状態の後、他のロジックによって実行が終了されました   |
| `JOB_STATUS.CANCELED`     | キャンセル：このノードは一時停止状態の後、手動で実行がキャンセルされました       |
| `JOB_STATUS.REJECTED`     | 拒否：このノードは一時停止状態の後、手動で続行が拒否されました       |
| `JOB_STATUS.RETRY_NEEDED` | 未成功実行、リトライが必要                     |

## クライアントサイド

クライアントサイドのパッケージ構造で利用できるAPIは、以下のコードで示されています。

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

トリガータイプに対応する設定パネルを登録します。

**シグネチャ**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**パラメーター**

| パラメーター | 型                        | 説明                                 |
| --------- | --------------------------- | ------------------------------------ |
| `type`    | `string`                    | トリガータイプの識別子。登録時に使用する識別子と一致させます。 |
| `trigger` | `typeof Trigger \| Trigger` | トリガーの型またはインスタンス                     |

#### `registerInstruction()`

ノードタイプに対応する設定パネルを登録します。

**シグネチャ**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**パラメーター**

| パラメーター  | 型                                | 説明                               |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type`        | `string`                            | ノードタイプの識別子。登録時に使用する識別子と一致させます。 |
| `instruction` | `typeof Instruction \| Instruction` | Instructionの型またはインスタンス                     |

#### `registerInstructionGroup()`

ノードタイプのグループを登録します。NocoBaseはデフォルトで以下の4つのノードタイプグループを提供しています。

*   `'control'`：制御系
*   `'collection'`：コレクション操作系
*   `'manual'`：手動処理系
*   `'extended'`：その他の拡張系

他のグループを拡張する必要がある場合は、このメソッドを使用して登録できます。

**シグネチャ**

`registerInstructionGroup(type: string, group: { label: string }): void`

**パラメーター**

| パラメーター | 型               | 説明                           |
| --------- | ----------------- | ----------------------------- |
| `type`    | `string`          | ノードグループの識別子。登録時に使用する識別子と一致させます。 |
| `group` | `{ label: string }` | グループ情報。現在はタイトルのみが含まれます。         |

**例**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

カスタムトリガータイプを拡張するためのトリガー基底クラスです。

| パラメーター    | 型                                                             | 説明                               |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title`         | `string`                                                         | トリガータイプ名                     |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | トリガー設定項目のコレクション                   |
| `scope?`        | `{ [key: string]: any }`                                         | 設定項目Schema内で使用される可能性のあるオブジェクトのコレクション |
| `components?`   | `{ [key: string]: React.FC }`                                    | 設定項目Schema内で使用される可能性のあるコンポーネントのコレクション |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | トリガーコンテキストデータの値取得機能           |

-   `useVariables` が設定されていない場合、このタイプのトリガーは値取得機能を提供せず、ワークフローのノードでトリガーのコンテキストデータを選択することはできません。

### `Instruction`

カスタムノードタイプを拡張するためのInstruction基底クラスです。

| パラメーター         | 型                                                    | 説明                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | ノードタイプグループの識別子。現在選択可能なオプションは、`'control'`/`'collection'`/`'manual'`/`'extended'` です。 |
| `fieldset`           | `Record<string, ISchema>`                               | ノード設定項目のコレクション                                                                 |
| `scope?`             | `Record<string, Function>`                              | 設定項目Schema内で使用される可能性のあるオブジェクトのコレクション                                             |
| `components?`        | `Record<string, React.FC>`                              | 設定項目Schema内で使用される可能性のあるコンポーネントのコレクション                                             |
| `Component?`         | `React.FC`                                              | ノードのカスタムレンダリングコンポーネント                                                             |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | ノードがノード変数オプションを提供するためのメソッド                                                     |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | ノードがブランチのローカル変数オプションを提供するためのメソッド                                                 |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | ノードが初期化オプションを提供するためのメソッド                                                     |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | ノードが利用可能かどうかを判断するメソッド                                                         |

**関連タイプ**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

-   `useVariables` が設定されていない場合、このノードタイプは値取得機能を提供せず、ワークフローのノードでこのタイプのノードの結果データを選択することはできません。結果値が単一（選択不可）の場合、対応する情報を表現する静的なコンテンツを返せば十分です（参照：[計算ノードのソースコード](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)）。選択可能にする必要がある場合（例：オブジェクト内の特定のプロパティ）、対応する選択コンポーネントの出力をカスタマイズできます（参照：[データ追加ノードのソースコード](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)）。
-   `Component` はノードのカスタムレンダリングコンポーネントです。デフォルトのノードレンダリングでは不十分な場合、完全に上書きしてカスタムノードビューのレンダリングに使用できます。例えば、ブランチタイプの開始ノードに対して、より多くの操作ボタンやその他のインタラクションを提供したい場合は、このメソッドを使用する必要があります（参照：[並列ブランチのソースコード](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)）。
-   `useInitializers` は、初期化ブロックを提供するためのメソッドです。例えば、手動ノードでは、上流ノードに基づいて関連するユーザーブロックを初期化できます。このメソッドが提供されている場合、手動ノードのインターフェース設定でブロックを初期化する際に利用可能になります（参照：[データ追加ノードのソースコード](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)）。
-   `isAvailable` は、ノードが現在の環境で使用（追加）できるかどうかを判断するために主に使用されます。現在の環境には、現在のワークフロー、上流ノード、現在のブランチインデックスなどが含まれます。