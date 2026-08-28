---
title: "トリガータイプの拡張"
description: "トリガータイプの拡張：カスタムトリガーの開発、設定インターフェース、トリガーロジック、APIリファレンス。"
keywords: "ワークフロー,トリガーの拡張,カスタムトリガー,トリガー開発,NocoBase"
---

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

トリガーの設定インターフェースは、Loader（遅延読み込み関数）を通じて定義されます。Loaderは、antd の `Form.Item` を使用してフォームを構築するプレーンな React コンポーネントを指します。

### 最もシンプルなトリガー

例えば、上記のインターバルタイマートリガーの場合、設定インターフェースのフォームで必要な間隔時間の設定項目（`interval`）を定義します。

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';

  // Trigger config form (lazy-loaded component)
  FieldsetLoader = () => import('./IntervalConfig');

  // Config validation
  validate(config) {
    return Boolean(config?.interval);
  }
}
```

ここで、`FieldsetLoader` は `Promise<{ default: ComponentType }>` を返す関数であり、動的 `import()` によって遅延読み込みを実現します。指し示すコンポーネントは、標準的な React 関数コンポーネントです。

```tsx
// IntervalConfig.tsx
import { Form, InputNumber } from 'antd';

export default function IntervalConfig() {
  return (
    <Form.Item
      name={['config', 'interval']}
      label="Interval"
      initialValue={60000}
      rules={[{ required: true }]}
    >
      <InputNumber min={1000} />
    </Form.Item>
  );
}
```

フォームフィールドの `name` にはネストされた配列形式 `['config', 'fieldName']` を使用していることに注意してください。これは antd Form の標準的な規約です。

### 複数の設定インターフェース

トリガーは、さまざまなシナリオに対応するために複数の設定インターフェースを提供できます。

- `PresetFieldsetLoader` — **ワークフロー**作成時のプリセットフォーム（通常は必須フィールドのみ含む）
![PresetFieldsetLoader](https://static-docs.nocobase.com/20260701152711.png)

- `FieldsetLoader` — 完全なトリガー設定フォーム（設定ドロワーに表示される）
![FieldsetLoader](https://static-docs.nocobase.com/20260701152822.png)

- `TriggerFieldsetLoader` — 手動実行時の入力フォーム
![FieldsetLoader](https://static-docs.nocobase.com/20260701152846.png)

Loader がファイルの名前付きエクスポート（デフォルトエクスポートではなく）を指す必要がある場合は、`.then()` を使用してリマップします。

```ts
class MyTrigger extends Trigger {
  title = 'My trigger';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }

  createDefaultConfig() {
    return { mode: 1 };
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

// Preset form for creation (named export)
export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

// Full config form (default export)
export default function MyTriggerConfig() {
  return (
    <>
      <Form.Item name={['config', 'collection']} label="Collection">
        <CollectionCascader disabled />
      </Form.Item>
      <Form.Item name={['config', 'mode']} label="Mode">
        <Select
          options={[
            { label: 'Created', value: 1 },
            { label: 'Updated', value: 2 },
          ]}
        />
      </Form.Item>
    </>
  );
}
```

### トリガーの登録

拡張する**プラグイン**内で、トリガータイプを**ワークフロー****プラグイン**インスタンスに登録します。

```ts
import { Plugin } from '@nocobase/client-v2';
import MyTrigger from './MyTrigger';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

これにより、**ワークフロー**の設定インターフェースで新しいトリガータイプが表示されるようになります。

:::info{title=ヒント}
クライアントサイドで登録するトリガータイプの識別子は、サーバーサイドのものと一致している必要があります。一致しない場合、エラーが発生します。
:::

完全な実例については、[CollectionTrigger ソースコード](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/triggers/collection/index.tsx)を参照してください。

トリガータイプの定義に関するその他の詳細については、[**ワークフロー** API リファレンス](./api)セクションを参照してください。

:::info{title=ヒント}
以前のレガシー（v1）クライアントサイドコードを使用していて、新しい v2 バージョンに移行したい場合は、[v1 から v2 への移行ガイド](./migration)を参照してください。
:::
