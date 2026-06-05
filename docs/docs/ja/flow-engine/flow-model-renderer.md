:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel のレンダリング

`FlowModelRenderer` は、`FlowModel` をレンダリングするための主要なReactコンポーネントです。`FlowModel` インスタンスを視覚的なReactコンポーネントに変換する役割を担っています。

## 基本的な使い方

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// 基本的な使い方
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

制御されたフィールドモデルをレンダリングするには、`FieldModelRenderer` を使用します。

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// 制御されたフィールドのレンダリング
<FieldModelRenderer model={fieldModel} />
```

## Props

### FlowModelRendererProps

| パラメーター | 型 | デフォルト値 | 説明 |
|------|------|--------|------|
| `model` | `FlowModel` | - | レンダリングする `FlowModel` インスタンスです。 |
| `uid` | `string` | - | フローモデルの一意な識別子です。 |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | レンダリング失敗時に表示するフォールバックコンテンツです。 |
| `showFlowSettings` | `boolean \| object` | `false` | フロー設定への入り口を表示するかどうかです。 |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | フロー設定のインタラクションスタイルです。 |
| `hideRemoveInSettings` | `boolean` | `false` | 設定で削除ボタンを非表示にするかどうかです。 |
| `showTitle` | `boolean` | `false` | 境界線の左上隅にモデルのタイトルを表示するかどうかです。 |
| `skipApplyAutoFlows` | `boolean` | `false` | 自動フローの適用をスキップするかどうかです。 |
| `inputArgs` | `Record<string, any>` | - | `useApplyAutoFlows` に渡される追加のコンテキストです。 |
| `showErrorFallback` | `boolean` | `true` | 最も外側のレイヤーを `FlowErrorFallback` コンポーネントでラップするかどうかです。 |
| `settingsMenuLevel` | `number` | - | 設定メニューのレベルです。1=現在のモデルのみ、2=子モデルを含む。 |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | 追加のツールバーアイテムです。 |

### `showFlowSettings` の詳細設定

`showFlowSettings` がオブジェクトの場合、以下の設定がサポートされます。

```tsx pure
showFlowSettings={{
  showBackground: true,    // 背景を表示
  showBorder: true,        // 境界線を表示
  showDragHandle: true,    // ドラッグハンドルを表示
  style: {},              // カスタムツールバースタイル
  toolbarPosition: 'inside' // ツールバーの位置: 'inside' | 'above' | 'below'
}}
```

## レンダリングライフサイクル

レンダリングサイクル全体では、以下のメソッドが順番に呼び出されます。

1.  **model.dispatchEvent('beforeRender')** - レンダリング前イベント
2.  **model.render()** - モデルのレンダリングメソッドを実行
3.  **model.onMount()** - コンポーネントのマウントフック
4.  **model.onUnmount()** - コンポーネントのアンマウントフック

## 使用例

### 基本的なレンダリング

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>読み込み中...</div>}
    />
  );
}
```

### フロー設定を含むレンダリング

```tsx pure
// 設定を表示し、削除ボタンを非表示にする
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// 設定とタイトルを表示する
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// コンテキストメニューモードを使用する
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### カスタムツールバー

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'カスタム操作',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('カスタム操作');
      }
    }
  ]}
/>
```

### 自動フローのスキップ

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### フィールドモデルのレンダリング

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## エラーハンドリング

`FlowModelRenderer` には、包括的なエラーハンドリングメカニズムが組み込まれています。

-   **自動エラー境界**: `showErrorFallback={true}` がデフォルトで有効になっています。
-   **自動フローエラー**: 自動フローの実行中に発生するエラーを捕捉し、処理します。
-   **レンダリングエラー**: モデルのレンダリングが失敗した場合にフォールバックコンテンツを表示します。

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>レンダリングに失敗しました。もう一度お試しください。</div>}
/>
```

## パフォーマンス最適化

### 自動フローのスキップ

自動フローが不要なシナリオでは、パフォーマンス向上のためにスキップすることができます。

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### リアクティブな更新

`FlowModelRenderer` は、`@formily/reactive-react` の `observer` を使用してリアクティブな更新を行います。これにより、モデルの状態が変化したときにコンポーネントが自動的に再レンダリングされるようになります。

## 注意事項

1.  **モデルの検証**: 渡される `model` に有効な `render` メソッドがあることを確認してください。
2.  **ライフサイクル管理**: モデルのライフサイクルフックは、適切なタイミングで呼び出されます。
3.  **エラー境界**: より良いユーザーエクスペリエンスを提供するために、本番環境でエラー境界を有効にすることをお勧めします。
4.  **パフォーマンスの考慮**: 大量のモデルをレンダリングするシナリオでは、`skipApplyAutoFlows` オプションの使用を検討してください。