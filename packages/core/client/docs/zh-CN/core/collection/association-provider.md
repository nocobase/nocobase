# AssociationProvider
<!--
根据 schema 中的 `association` 字段，查询并提供当前数据区块的关联字段信息，其内置在 [DataBlockProvider](xx) 中。

```js {4} | pure
{
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    association: 'users.role',
    action: 'get',
  }
}
```

关于 association 的更多说明，请参考: [association-fields](https://docs.nocobase.com/development/server/collections/association-fieldshttps://docs-cn.nocobase.com/development/server/collections/association-fields)

需要说明的是，当存在 `association` 时，会自动查找对应的 `collection` 表名并渲染 `CollectionProviderV2` 组件，相当于：

```tsx | pure
<AssociationProvider>
  <CollectionProviderV2>
  </CollectionProviderV2>
</AssociationProvider>
``` -->

TODO: 未完成

## Hooks

### useAssociationV2()

用于获取 `AssociationProvider` 传递的关联数据字段信息。

```tsx | pure
const association = useAssociationV2()

console.log(association)
```
