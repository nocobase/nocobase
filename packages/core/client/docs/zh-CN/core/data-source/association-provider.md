# AssociationProvider

用于传递关联数据字段以及对应的数据表信息，等同于 `CollectionFieldProviderV2` + `CollectionProvider`。

```tsx | pure
const AssociationProvider = <CollectionFieldProviderV2 name={fieldName}>
  <CollectionProvider name={collectionManager.getCollectionName(fieldName)}>
    {children}
  </CollectionProvider>
</CollectionFieldProviderV2>
```

关于关系字段的更多信息，请参考 [关系字段](https://docs.nocobase.com/development/server/collections/association-fields) 以及 [CollectionField](/core/data-source/collection-field)。
