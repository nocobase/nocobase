:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

## タイプ

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

## パラメーター

ほとんどのパラメーターは `find()` と同じです。ただし、`findOne()` は単一のデータのみを返すため、`limit` パラメーターは不要で、クエリ時には常に `1` となります。