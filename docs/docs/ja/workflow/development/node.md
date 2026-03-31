:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ノードタイプの拡張
ノードのタイプは、本質的に操作の指示そのものです。異なる指示は、**ワークフロー**内で実行される異なる操作を表します。

トリガーと同様に、ノードタイプの拡張もサーバーサイドとクライアントサイドの2つの部分に分かれます。サーバーサイドでは登録された指示のロジックを実装する必要があり、クライアントサイドではその指示が配置されるノードの関連パラメーターのインターフェース設定を提供する必要があります。

## サーバーサイド

### 最もシンプルなノード指示

指示の核となる内容は関数です。つまり、指示クラス内の `run` メソッドは、指示のロジックを実行するために必ず実装する必要があります。関数内では、データベース操作、ファイル操作、サードパーティAPIの呼び出しなど、必要なあらゆる操作を実行できます。

すべての指示は `Instruction` 基底クラスから派生させる必要があります。最もシンプルな指示は、`run` 関数を1つ実装するだけで済みます。

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

そして、この指示を**ワークフロー** **プラグイン**に登録します。

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

指示の戻りオブジェクトにあるステータス値（`status`）は必須項目であり、`JOB_STATUS` 定数内の値である必要があります。この値は、**ワークフロー**におけるこのノードのその後の処理の流れを決定します。通常は `JOB_STATUS.RESOVLED` を使用します。これは、ノードが正常に実行を完了し、後続のノードの実行が継続されることを意味します。もし事前に保存する必要がある結果値がある場合は、`processor.saveJob` メソッドを呼び出し、その戻りオブジェクトを返すこともできます。実行者はこのオブジェクトに基づいて実行結果のレコードを生成します。

### ノードの結果値

特定の実行結果がある場合、特に後続のノードで使用するためのデータを準備する場合は、`result` プロパティを介して返し、ノードのジョブオブジェクトに保存できます。

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

`node.config` はノードの設定項目で、必要な任意の値を設定できます。これは、データベース内の対応するノードレコードに `JSON` 型フィールドとして保存されます。

### 指示のエラー処理

実行中に例外が発生する可能性がある場合は、事前にキャッチして失敗ステータスを返すことができます。

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

予測可能な例外をキャッチしない場合、**ワークフロー**エンジンが自動的にキャッチし、エラー状態を返します。これにより、捕捉されない例外によるプログラムのクラッシュを防ぎます。

### 非同期ノード

**ワークフロー**制御や非同期（時間のかかる）I/O操作が必要な場合、`run` メソッドは `status` が `JOB_STATUS.PENDING` のオブジェクトを返すことができます。これにより、実行者に待機（一時停止）を促し、外部の非同期操作が完了した後、**ワークフロー**エンジンに実行の継続を通知します。もし `run` 関数で一時停止のステータス値が返された場合、その指示は `resume` メソッドを実装する必要があります。そうしないと、**ワークフロー**の実行を再開できません。

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

`paymentService` は、ある支払いサービスを指します。サービスからのコールバックで、対応するタスクの実行**ワークフロー**の再開をトリガーし、現在の**ワークフロー**は一旦終了します。その後、**ワークフロー**エンジンが新しいプロセッサーを作成し、ノードの `resume` メソッドに渡すことで、以前に一時停止されたノードの実行を再開します。

:::info{title=ヒント}
ここで言う「非同期操作」とは、JavaScriptの `async` 関数を指すものではありません。外部システムと連携する際に、即座に結果が返されない操作のことです。例えば、支払いサービスは結果を知るために別の通知を待つ必要があります。
:::

### ノードの結果ステータス

ノードの実行ステータスは、**ワークフロー**全体の成功または失敗に影響します。通常、分岐がない場合、あるノードの失敗は**ワークフロー**全体の失敗に直結します。最も一般的なシナリオは、ノードが正常に実行された場合、ノードテーブルの次のノードに進み、後続のノードがなくなるまで、**ワークフロー**全体の実行が成功ステータスで完了することです。

実行中にいずれかのノードが実行失敗ステータスを返した場合、エンジンは以下の2つの状況に応じて異なる処理を行います。

1.  失敗ステータスを返したノードがメイン**ワークフロー**内にあり、かつ上流ノードによって開始されたどの分岐**ワークフロー**内にもない場合、メイン**ワークフロー**全体が失敗と判断され、**ワークフロー**は終了します。

2.  失敗ステータスを返したノードが特定の分岐**ワークフロー**内にある場合、**ワークフロー**の次のステータスを判断する責任は、その分岐を開始したノードに委ねられます。そのノードの内部ロジックが後続の**ワークフロー**のステータスを決定し、この決定はメイン**ワークフロー**まで再帰的に伝播します。

最終的に、**ワークフロー**全体の次のステータスはメイン**ワークフロー**のノードで決定されます。もしメイン**ワークフロー**のノードで失敗が返された場合、**ワークフロー**全体は失敗ステータスで終了します。

いずれかのノードが実行後に「一時停止」ステータスを返した場合、実行**ワークフロー**全体は一時的に中断され、保留状態になります。これは、対応するノードによって定義されたイベントがトリガーされ、**ワークフロー**の実行が再開されるのを待ちます。例えば、手動ノードは、このノードに到達すると「一時停止」ステータスで停止し、手動での介入を待ち、承認するかどうかを決定します。手動で入力されたステータスが承認であれば、後続の**ワークフロー**ノードが続行されます。そうでなければ、前述の失敗ロジックに従って処理されます。

その他の指示の戻りステータスについては、**ワークフロー**APIリファレンスセクションを参照してください。

### 早期終了

特定の**ワークフロー**では、あるノード内で**ワークフロー**を直接終了させる必要がある場合があります。その場合、`null` を返すことで現在の**ワークフロー**を終了し、後続のノードは実行されません。

この状況は、**ワークフロー**制御タイプのノードでよく見られます。例えば、並列分岐ノード（[コード参照](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)）では、現在のノードの**ワークフロー**は終了しますが、子分岐ごとに新しい**ワークフロー**が開始され、実行が継続されます。

:::warn{title=注意}
拡張ノードで分岐**ワークフロー**をスケジューリングすることは、ある程度の複雑さを伴います。そのため、慎重な処理と十分なテストが必要です。
:::

### 詳細

ノードタイプを定義するための各パラメーターの定義については、**ワークフロー**APIリファレンスセクションを参照してください。

## クライアントサイド

トリガーと同様に、指示（ノードタイプ）の設定フォームはフロントエンドで実装する必要があります。

### 最もシンプルなノード指示

すべての指示は `Instruction` 基底クラスから派生させる必要があります。関連するプロパティとメソッドは、ノードの設定と使用のために用いられます。

例えば、上記でサーバーサイドに定義したランダムな数字文字列タイプ（`randomString`）のノードに対して設定インターフェースを提供する必要がある場合、その設定項目の一つである `digit` は、ランダムな数字の桁数を表します。設定フォームでは、ユーザー入力を受け取るために数値入力ボックスを使用します。

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=ヒント}
クライアントサイドで登録するノードタイプの識別子は、サーバーサイドのものと一致している必要があります。そうしないとエラーが発生します。
:::

### ノードの結果を変数として提供する

上記の例にある `useVariables` メソッドに注目してください。ノードの結果（`result` 部分）を後続のノードで変数として使用する必要がある場合、継承する指示クラスでこのメソッドを実装し、`VariableOption` タイプに準拠したオブジェクトを返す必要があります。このオブジェクトは、ノードの実行結果の構造を記述するものとして機能し、後続のノードで選択して使用できるように、変数名のマッピングを提供します。

`VariableOption` の型定義は以下の通りです。

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

核となるのは `value` プロパティです。これは変数名のセグメント化されたパス値を表します。`label` はインターフェース上に表示するために使用され、`children` は多階層の変数構造を表すために使用されます。ノードの結果が深い階層のオブジェクトである場合に使用されます。

使用可能な変数は、システム内部では `.` で区切られたパスのテンプレート文字列として表現されます。例えば `{{jobsMapByNodeKey.2dw92cdf.abc}}` のようになります。ここで `$jobsMapByNodeKey` はすべてのノードの結果セットを表し（内部で定義済みのため、処理は不要です）、`2dw92cdf` はノードの `key` です。`abc` はノードの結果オブジェクト内のカスタムプロパティです。

また、ノードの結果は単純な値である可能性もあるため、ノード変数を提供する際には、最初の階層はノード自体の記述である**必要があります**。

```ts
{
  value: node.key,
  label: node.title,
}
```

つまり、最初の階層はノードの `key` とタイトルです。例えば、計算ノードの[コード参照](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77)では、計算ノードの結果を使用する際のインターフェースオプションは以下のようになります。

![計算ノードの結果](https://static-docs.nocobase.com/20240514230014.png)

ノードの結果が複雑なオブジェクトである場合、`children` を使用してさらに深い階層のプロパティを記述できます。例えば、カスタム指示が以下のJSONデータを返す場合です。

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

その場合、以下の `useVariables` メソッドを介して返すことができます。

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

これにより、後続のノードで以下のインターフェースを使用してその中の変数を選択できるようになります。

![マッピングされた結果変数](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="ヒント"}
結果内の構造が深い階層のオブジェクト配列である場合も、同様に `children` を使用してパスを記述できますが、配列のインデックスを含めることはできません。これは、NocoBaseの**ワークフロー**における変数処理では、オブジェクト配列の変数パス記述は使用時に自動的に深い階層の値の配列にフラット化され、インデックスを介して特定の値にアクセスできないためです。
:::

### ノードの可用性

デフォルトでは、**ワークフロー**には任意のノードを追加できます。しかし、特定の状況では、ノードが特定のタイプの**ワークフロー**や分岐内で適用できない場合があります。この場合、`isAvailable` を使用してノードの可用性を設定できます。

```ts
// 型定義
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // ワークフロープラグインインスタンス
  engine: WorkflowPlugin;
  // ワークフローインスタンス
  workflow: object;
  // 上流ノード
  upstream: object;
  // 分岐ノードであるかどうか（分岐番号）
  branchIndex: number;
};
```

`isAvailable` メソッドが `true` を返す場合、ノードは利用可能であることを示し、`false` の場合は利用不可であることを示します。`ctx` パラメーターには、現在のノードのコンテキスト情報が含まれており、これらの情報に基づいてノードが利用可能かどうかを判断できます。

特別な要件がない場合、`isAvailable` メソッドを実装する必要はありません。ノードはデフォルトで利用可能です。最も一般的な設定が必要なシナリオは、ノードが時間のかかる操作である可能性があり、同期**ワークフロー**での実行には適さない場合です。`isAvailable` メソッドを使用してノードの使用を制限できます。例えば、

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### 詳細

ノードタイプを定義するための各パラメーターの定義については、**ワークフロー**APIリファレンスセクションを参照してください。