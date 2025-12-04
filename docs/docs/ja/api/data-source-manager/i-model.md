:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# IModel

`IModel` インターフェースは、モデルオブジェクトの基本的なプロパティとメソッドを定義します。

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

モデルオブジェクトをJSON形式に変換します。