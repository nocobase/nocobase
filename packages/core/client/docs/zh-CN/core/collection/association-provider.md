# AssociationProvider

用于传递关联数据字段以及对应的数据表信息，等同于 `CollectionField` + `CollectionProvider`。

```tsx | pure
const AssociationProvider = <CollectionField name={fieldName}>
  <CollectionProvider name={collectionManager.getCollectionName(fieldName)}>
    {children}
  </CollectionProvider>
</CollectionField>
```

关于关联字段的更多信息，请参考 [关联字段](https://docs.nocobase.com/development/server/collections/association-fields) 以及 [CollectionField](/core/collection/collection-field)。
