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