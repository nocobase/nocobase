:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

**型**

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**詳細**

- `values`: 更新するレコードのデータオブジェクトです。
- `filter`: 更新するレコードの絞り込み条件を指定します。`Filter` の詳しい使い方は、[`find()`](#find) メソッドをご参照ください。
- `filterByTk`: `TargetKey` を使って、更新するレコードの絞り込み条件を指定します。
- `whitelist`: `values` フィールドのホワイトリストです。リスト内のフィールドのみが書き込まれます。
- `blacklist`: `values` フィールドのブラックリストです。リスト内のフィールドは書き込まれません。
- `transaction`: トランザクションオブジェクトです。トランザクションパラメータが渡されない場合、このメソッドは自動的に内部トランザクションを作成します。

`filterByTk` と `filter` のどちらか一方は必ず指定してください。