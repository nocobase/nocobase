---
title: "v1 から v2 への移行ガイド"
description: "ワークフロー拡張開発：クライアントサイドコードを v1 から v2 へ移行するためのガイド。"
keywords: "ワークフロー,移行,v1,v2,NocoBase"
---

# v1 から v2 へのクライアントサイド移行ガイド

このガイドでは、ワークフロー拡張プラグインのクライアントサイドコードを v1 から v2 へ移行する方法を説明します。v2 クライアントの主な変更点は、Formily Schema による宣言的な設定 UI を、Loader + 純粋な React/antd コンポーネントのアプローチに置き換えたことです。

## 概要

### 主な変更点

1. **インポートパスの変更**: `@nocobase/plugin-workflow/client` → `@nocobase/plugin-workflow/client-v2`、プラグイン基底クラス `@nocobase/client` → `@nocobase/client-v2`
2. **設定 UI パターンの変更**: Formily Schema オブジェクト（`fieldset`）から Loader 遅延読み込み React コンポーネント（`FieldsetLoader`）へ
3. **`scope`/`components` プロパティの廃止**: Schema にスコープオブジェクトやコンポーネントを注入する必要がなくなり、React コンポーネント内で直接インポートして使用します

### インポートパスの対応表

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client';

// v2
import { Plugin } from '@nocobase/client-v2';
import WorkflowPlugin, { Trigger, Instruction } from '@nocobase/plugin-workflow/client-v2';
```

## 一般的なルール

### Loader パターン

v2 では、v1 の `fieldset` やその他の Formily Schema オブジェクトを `LoaderOf` 型のプロパティに置き換えています。Loader は本質的に `Promise<{ default: ComponentType }>` を返す関数であり、動的 `import()` によるコード分割と遅延読み込みを実現します。

```ts
// v1: Formily Schema オブジェクト
fieldset = {
  interval: {
    type: 'number',
    title: 'Interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React コンポーネントを指す Loader
FieldsetLoader = () => import('./MyConfig');
```

名前付きエクスポート（デフォルトエクスポートではなく）を指す必要がある場合は、`.then()` を使用してリマップします。

```ts
FieldsetLoader = () => import('./MyConfig').then((m) => ({ default: m.MyPresetConfig }));
```

### 設定コンポーネントの構文

Loader によって読み込まれるコンポーネントは、antd の `Form.Item` を使用してフォームを構築する標準的な React 関数コンポーネントです。フィールドパスには一貫してネストされた配列形式 `['config', 'fieldName']` を使用します。

```tsx
// v1: Formily Schema
fieldset = {
  interval: {
    type: 'number',
    title: '{{t("Interval")}}',
    name: 'config.interval',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    default: 60000,
  },
};

// v2: React コンポーネント
import { Form, InputNumber } from 'antd';

export default function MyConfig() {
  const { t } = useWorkflowTranslation();

  return (
    <Form.Item
      name={['config', 'interval']}
      label={t('Interval')}
      initialValue={60000}
    >
      <InputNumber />
    </Form.Item>
  );
}
```

## トリガーの移行

### プロパティ対応表

| v1 プロパティ | v2 プロパティ | 説明 |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | トリガー設定フォーム |
| `presetFieldset` | `PresetFieldsetLoader` | 作成時のプリセットフォーム |
| `triggerFieldset` | `TriggerFieldsetLoader` | 手動実行時の入力フォーム |
| `scope` | 廃止 | 不要になりました。コンポーネント内で直接インポートしてください |
| `components` | 廃止 | 不要になりました。コンポーネント内で直接インポートしてください |
| `view` | 廃止 | |
| — | `validate(config)` | 新規：設定のバリデーション |
| — | `createDefaultConfig()` | 新規：デフォルト設定値の提供 |

### 移行の例

**v1 構文:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
      required: true,
    },
    mode: {
      type: 'number',
      title: '{{t("Mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '{{t("Created")}}', value: 1 },
          { label: '{{t("Updated")}}', value: 2 },
        ],
      },
    },
  };
  scope = { /* ... */ };
  components = { CollectionSelect };
}
```

**v2 構文:**

```ts
import { Trigger } from '@nocobase/plugin-workflow/client-v2';

class MyTrigger extends Trigger {
  title = '{{t("My Trigger")}}';

  PresetFieldsetLoader = () =>
    import('./MyTriggerConfig').then((m) => ({ default: m.MyPresetConfig }));
  FieldsetLoader = () => import('./MyTriggerConfig');
  TriggerFieldsetLoader = () => import('./TriggerMyConfig');

  validate(config) {
    return Boolean(config?.collection && config?.mode);
  }
}
```

```tsx
// MyTriggerConfig.tsx
import { Form, Select } from 'antd';
import { CollectionCascader } from '@nocobase/plugin-workflow/client-v2';

export function MyPresetConfig() {
  return (
    <Form.Item name={['config', 'collection']} label="Collection" rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}

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

### プラグインの登録

```ts
// v1
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin);
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}

// v2
import { Plugin } from '@nocobase/client-v2';

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow');
    workflow.registerTrigger('myTrigger', MyTrigger);
  }
}
```

## ノードの移行

### プロパティ対応表

| v1 プロパティ | v2 プロパティ | 説明 |
|---------|---------|------|
| `fieldset` | `FieldsetLoader` | ノード設定ドロワーのフォーム |
| `presetFieldset` | `PresetFieldsetLoader` | 作成時のプリセットフォーム |
| `Component` | `ComponentLoader` | キャンバス上のカスタムノードレンダリング |
| `scope` | 廃止 | 不要になりました。コンポーネント内で直接インポートしてください |
| `components` | 廃止 | 不要になりました。コンポーネント内で直接インポートしてください |
| `view` | 廃止 | |
| — | `createDefaultConfig()` | 新規：デフォルト設定値の提供 |

### 移行の例

**v1 構文:**

```ts
import WorkflowPlugin, { Instruction } from '@nocobase/plugin-workflow/client';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    digit: {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': { min: 1, max: 10 },
      default: 6,
    },
  };
  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

**v2 構文:**

```ts
import { Instruction } from '@nocobase/plugin-workflow/client-v2';

class MyInstruction extends Instruction {
  title = 'Random string';
  type = 'randomString';
  group = 'extended';

  FieldsetLoader = () => import('./components/RandomStringConfig');

  useVariables(node, options) {
    return { value: node.key, label: node.title };
  }
}
```

```tsx
// components/RandomStringConfig.tsx
import { Form, InputNumber } from 'antd';

export default function RandomStringConfig() {
  return (
    <Form.Item
      name={['config', 'digit']}
      label="Digit"
      initialValue={6}
      rules={[{ required: true }]}
    >
      <InputNumber min={1} max={10} />
    </Form.Item>
  );
}
```

## その他の注意事項

### 変更のない部分

以下のプロパティとメソッドは v1 と v2 でほぼ同じシグネチャを持っており、移行時にそのまま保持できます。

- `useVariables(node/config, options)` — 変数オプションの提供
- `useScopeVariables(node, options)` — ブランチスコープの変数の提供
- `isAvailable(ctx)` — ノードの利用可否チェック（v2 の `NodeAvailableContext` には新しい `engine` プロパティが追加されています）

### v2 で追加された新しいプロパティ

- `getCreateModelMenuItem` — v2 キャンバス上のノード/トリガーに対するサブモデルメニュー項目の作成設定を定義
- `useTempAssociationSource` — 一時的なリレーションデータソース情報の提供
- `validate(config)` — トリガー設定のバリデーション（トリガーのみ）
- `branching` — ノードがブランチノードであることを宣言（ノードのみ）
- `end` — ノードが終端ノードであることを宣言（ノードのみ）
- `testable` — ノードがテスト実行をサポートすることを宣言（ノードのみ）

### 値のセマンティクスの一貫性

移行時には、v2 コンポーネントが生成するフォーム値が v1 と一貫していることを確認してください。特に手動実行時のペイロード構造に注意が必要です。例えば、v1 の手動実行フォームが完全なレコードオブジェクトを保存している場合、v2 バージョンでもプライマリキーのみではなく、同じ値構造を維持する必要があります。
