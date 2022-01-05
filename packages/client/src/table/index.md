---
nav:
  path: /client
group:
  path: /schema-components
---

# Table

- Table
- Table.Column
  - Table.SortHandle
  - Table.Index
- Table.Pagination
- Table.ActionBar
- Table.Filter

## Table

```tsx | pure
<CollectionProvider>
  <AsyncRecordProvider action={'list'}>
    <Table>
      <RecordProvider>
        <CollectionFieldProvider>
          <AsyncRecordProvider action={'get'}>
            <div>tag1</div>
            <Form>
              <Drawer></Drawer>
            </Form>
          </AsyncRecordProvider>
        <CollectionFieldProvider>
      </RecordProvider>
    </Table>
  </AsyncRecordProvider>
</CollectionProvider>
```

```ts
{
  'x-decorator': 'CardItem',
  'x-decorator-props': {
    collectionName: 'tests',
    resourceName: 'tests',
    actionName: 'list',
    actionParams: {
      filter,
      sort,
    },
  },
  'x-component': 'Table',
  'x-component-props': {
    dragSort,
    showIndex,
    rowKey,
    pagination,
  },
  properties: {},
}
```

```ts
const { data, loading } = useAsyncRecord();
```
