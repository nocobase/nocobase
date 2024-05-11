# AssociationProvider

Used for passing associated data fields and their corresponding table information, equivalent to `CollectionFieldProvider` + `CollectionProvider`.

```tsx | pure
const AssociationProvider = <CollectionFieldProvider name={fieldName}>
  <CollectionProvider name={collectionManager.getCollectionName(fieldName)}>
    {children}
  </CollectionProvider>
</CollectionFieldProvider>
```

For more information on relational fields, please refer to [Association Fields](https://docs.nocobase.com/development/server/collections/association-fields) and [CollectionField](/core/data-source/collection-field).
