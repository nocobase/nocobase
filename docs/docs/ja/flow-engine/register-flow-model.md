:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# FlowModel を登録する

## カスタム FlowModel から始めましょう

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

## 利用可能な FlowModel の基底クラス

| 基底クラス名            | 説明                                   |
| ----------------------- | -------------------------------------- |
| `BlockModel`            | すべてのブロックの基底クラス           |
| `CollectionBlockModel`  | コレクションブロックで、BlockModel を継承しています |
| `ActionModel`           | すべてのアクションの基底クラス         |

## FlowModel を登録する

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```