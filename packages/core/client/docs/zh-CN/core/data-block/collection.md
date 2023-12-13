# CollectionProvider

根据 schema 中的 `collection` 字段，查询并提供当前数据区块的数据表信息，其内置在 [DataBlockProvider](xx) 中。

```js {4} | pure
{
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
  }
}
```

关于 collection 的更多说明，请参考: [collections concept](https://docs.nocobase.com/manual/core-concepts/collections) 和 [development collection](https://docs.nocobase.com/manual/core-concepts/collections#collection)

## Hooks

### useCollectionV2()

用于获取 `CollectionProvider` 传递的数据表信息。

```tsx | pure
const collection = useCollectionV2()

console.log(collection)
```

## 使用场景

用于数据字段的渲染。

```tsx | pure

```
