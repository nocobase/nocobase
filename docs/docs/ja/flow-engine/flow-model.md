:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel から始める

## カスタム FlowModel

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

## 利用可能な FlowModel 基底クラス

| 基底クラス名                  | 説明                                     |
| ------------------------- | ---------------------------------------- |
| `BlockModel`              | すべてのブロックの基底クラスです。               |
| `CollectionBlockModel`    | コレクションブロックで、BlockModel を継承します。 |
| `ActionModel`             | すべてのアクションの基底クラスです。             |

## FlowModel の登録

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## FlowModel のレンダリング

```tsx pure
<FlowModelRenderer model={model} />
```