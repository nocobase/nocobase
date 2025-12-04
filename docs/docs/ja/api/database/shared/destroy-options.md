:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

## 型

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

## 詳細

- `filter`: 削除するレコードのフィルタリング条件を指定します。`Filter`の詳しい使い方は、[`find()`](#find) メソッドをご参照ください。
- `filterByTk`: `TargetKey`に基づいて削除するレコードのフィルタリング条件を指定します。
- `truncate`: コレクションのデータを空にするかどうかを指定します。このパラメーターは、`filter`または`filterByTk`パラメーターが渡されない場合にのみ有効です。
- `transaction`: トランザクションオブジェクトです。トランザクションパラメーターが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。