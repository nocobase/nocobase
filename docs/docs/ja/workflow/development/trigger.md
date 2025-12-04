:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# トリガータイプを拡張する

すべての**ワークフロー**には、プロセスの実行を開始するためのエントリーポイントとして、特定のトリガーを設定する必要があります。

トリガータイプは通常、特定のシステム環境イベントを表します。アプリケーションの実行ライフサイクルにおいて、購読可能なイベントを提供するあらゆる部分をトリガータイプの定義に利用できます。例えば、リクエストの受信、**コレクション**操作、定期的なタスクなどが挙げられます。

トリガータイプは、文字列の識別子に基づいて**プラグイン**のトリガーテーブルに登録されます。**ワークフロー****プラグイン**には、いくつかの組み込みトリガーがあります。

- `'collection'`：**コレクション**操作によってトリガーされます。
- `'schedule'`：定期的なタスクによってトリガーされます。
- `'action'`：アクション後のイベントによってトリガーされます。

拡張するトリガータイプは、識別子が一意であることを保証する必要があります。トリガーの購読/購読解除の実装はサーバーサイドで登録し、設定インターフェースの実装はクライアントサイドで登録します。

## サーバーサイド

任意のトリガーは `Trigger` 基底クラスを継承し、`on` メソッドと `off` メソッドを実装する必要があります。これらはそれぞれ、特定の環境イベントを購読するためと、購読を解除するために使用されます。`on` メソッドでは、最終的にイベントをトリガーするために、特定のイベントコールバック関数内で `this.workflow.trigger()` を呼び出す必要があります。また、`off` メソッドでは、購読解除に関連するクリーンアップ作業を行う必要があります。

`this.workflow` は、`Trigger` 基底クラスのコンストラクターに渡される**ワークフロー****プラグイン**のインスタンスです。

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

次に、**ワークフロー**を拡張する**プラグイン**内で、トリガーインスタンスを**ワークフロー**エンジンに登録します。

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

サーバーが起動してロードされた後、`'interval'` タイプのトリガーを追加して実行できるようになります。

## クライアントサイド

クライアントサイドでは、主にトリガータイプに必要な設定項目に基づいて設定インターフェースを提供します。各トリガータイプは、対応するタイプ設定を**ワークフロー****プラグイン**に登録する必要があります。

例えば、上記の定期実行トリガーの場合、設定インターフェースのフォームで必要な間隔時間の設定項目（`interval`）を定義します。

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

その後、拡張する**プラグイン**内で、このトリガータイプを**ワークフロー****プラグイン**インスタンスに登録します。

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

これにより、**ワークフロー**の設定インターフェースで新しいトリガータイプが表示されるようになります。

:::info{title=ヒント}
クライアントサイドで登録するトリガータイプの識別子は、サーバーサイドのものと一致している必要があります。一致しない場合、エラーが発生します。
:::

トリガータイプの定義に関するその他の詳細については、[**ワークフロー** API リファレンス](./api#pluginregisterTrigger)セクションを参照してください。