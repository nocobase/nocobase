:::tip AI翻訳のお知らせ
本ドキュメントはAIにより自動翻訳されています。
:::

## タイプ

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## パラメーター

ほとんどのパラメーターは `find()` と同じです。ただし、`findOne()` は単一のデータのみを返すため、`limit` パラメーターは不要で、クエリ時には常に `1` となります。