# Examples

## Read Data Source Key

```ts
const key = ctx.dataSource?.key || "main";
```

## Access Collection Manager

```ts
const collection = ctx.dataSource.collectionManager.getCollection(ctx.collection?.name);
```
