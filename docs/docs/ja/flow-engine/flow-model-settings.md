:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel イベントフローと設定

FlowModel は、「イベントフロー（Flow）」に基づいた方法でコンポーネントの設定ロジックを実装し、コンポーネントの動作と設定をより拡張しやすく、視覚的に分かりやすくします。

## カスタムモデル

`FlowModel` を継承することで、カスタムコンポーネントモデルを作成できます。モデルは、コンポーネントのレンダリングロジックを定義するために `render()` メソッドを実装する必要があります。

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Flow（イベントフロー）の登録

各モデルは、コンポーネントの設定ロジックとインタラクションの手順を記述するために、1つまたは複数の **Flow** を登録できます。

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'ボタン設定',
  steps: {
    general: {
      title: '一般設定',
      uiSchema: {
        title: {
          type: 'string',
          title: 'ボタンタイトル',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

説明

-   `key`：Flow の一意な識別子です。
-   `title`：UI 表示に使用される Flow の名前です。
-   `steps`：設定ステップ（Step）を定義します。各ステップには以下が含まれます。
    -   `title`：ステップのタイトル。
    -   `uiSchema`：設定フォームの構造（Formily Schema と互換性があります）。
    -   `defaultParams`：デフォルトパラメータ。
    -   `handler(ctx, params)`：保存時にトリガーされ、モデルの状態を更新するために使用されます。

## モデルのレンダリング

コンポーネントモデルをレンダリングする際、`showFlowSettings` パラメータを使用して、設定機能を有効にするかどうかを制御できます。`showFlowSettings` を有効にすると、コンポーネントの右上隅に設定エントリ（設定アイコンやボタンなど）が自動的に表示されます。

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## `openFlowSettings` を使って設定フォームを手動で開く

組み込みのインタラクションエントリから設定フォームを開く以外に、コード内で `openFlowSettings()` を手動で呼び出すこともできます。

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### パラメータ定義

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // 必須、所属するモデルインスタンス
  preset?: boolean;               // preset=true とマークされたステップのみをレンダリングします（デフォルトは false）
  flowKey?: string;               // 単一の Flow を指定します
  flowKeys?: string[];            // 複数の Flow を指定します（flowKey も同時に指定された場合は無視されます）
  stepKey?: string;               // 単一のステップを指定します（通常は flowKey と組み合わせて使用）
  uiMode?: 'dialog' | 'drawer';   // フォーム表示コンテナ、デフォルトは 'dialog'
  onCancel?: () => void;          // キャンセルクリック時のコールバック
  onSaved?: () => void;           // 設定が正常に保存された後のコールバック
}
```

### 例：Drawer モードで特定の Flow の設定フォームを開く

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('ボタン設定が保存されました');
  },
});
```