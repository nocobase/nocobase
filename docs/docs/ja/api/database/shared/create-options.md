:::tip AI翻訳のお知らせ
本ドキュメントはAIにより自動翻訳されています。
:::

**型**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**詳細**

- `values`: 作成するレコードのデータオブジェクトです。
- `whitelist`: 作成するレコードのデータオブジェクト内で、どのフィールドが**書き込み可能か**を指定します。このパラメーターを渡さない場合、デフォルトですべてのフィールドが書き込み可能となります。
- `blacklist`: 作成するレコードのデータオブジェクト内で、どのフィールドが**書き込み不可か**を指定します。このパラメーターを渡さない場合、デフォルトですべてのフィールドが書き込み可能となります。
- `transaction`: トランザクションオブジェクトです。トランザクションパラメーターを渡さない場合、このメソッドは自動的に内部トランザクションを作成します。