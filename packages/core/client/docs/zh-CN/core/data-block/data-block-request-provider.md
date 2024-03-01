# DataBlockRequestProvider

其内部获取到 [BlockResourceProvider](/core/data-block/data-block-resource-provider) 提供的 `resource`，根据 [BlockProvider](/core/data-block/data-block-provider) 提供的参数，自动调用 `resource.get()` 或者 `resource.list()` 获取的区块的数据，并通过 context 传递下去。

## 请求参数

请求参数是获取 `DataBlockProvider` 提供中的 `params` 和 `filterByTk`。

```ts | pure
const schema = {
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    'collection': 'users',
    'action': 'list',
    // 静态参数
    params: {
      pageSize: 10,
    }
  },
  // 动态参数
  'x-use-decorator-props': 'useDynamicDataBlockProps',
}

const useDynamicDataBlockProps: UseDataBlockProps<'CollectionList'>  = () => {
  return {
    params: {
      size: 15,
    }
  }
}
```

会自动调用 `resource.list()` 获取数据，发起 `GET /api/users:list?pageSize=10&size=15` 的请求。

## Hooks

### useDataBlockRequest()

用于获取请求对象，一般用区块组件中。

```tsx | pure
const MyTable = () => {
  const { data, loading } = useDataBlockRequest();

  return (
    <Table
      dataSource={data?.data || []}
      loading={loading}
      pagination={{
        total: data?.meta.total,
        pageSize: data?.meta.pageSize,
        page: data?.meta.page,
      }}
    />
  )
}
```

## Record

### Get 请求

对于 `get` 请求，当获取到 `data` 数据后，会通过 `CollectionRecordProvider` 提供 `record` 对象，用于获取当前区块的数据。

```ts | pure
const schema = {
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    'collection': 'users',
    'action': 'get', // get 请求
  },
  // 动态参数
  'x-use-decorator-props': 'useDynamicFormProps',
}

const useDynamicDataBlockProps: UseDataBlockProps<'CollectionGet'>  = () => {
  return {
    params: {
      filterByTk: 1,
    }
  }
}
```

会自动调用 `resource.get()` 获取数据，发起 `GET /api/users:get/1` 的请求，并通过 `CollectionRecordProvider` 提供上下文。

```tsx | pure
const { data } = useDataBlockRequest();
const record = useCollectionRecord(); // record 上下文数据

// 相等
record.data === data;
```

### List 请求

对于 `list` 请求则不会提供 `record` 对象，需要自己通过 `<CollectionRecordProvider />` 设置上下文。

```tsx | pure
const MyTable = () => {
  const { data } = useDataBlockRequest();

  return (
    <Table
      dataSource={data?.data || []}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
        },
        {
          title: 'Action',
          render: (v, record) => {
            return (
              <CollectionRecordProvider record={record}>
                <MyAction />
              </CollectionRecordProvider>
            )
          },
        },
      ]}
      pagination={{
        total: data?.meta.total,
        pageSize: data?.meta.pageSize,
        page: data?.meta.page,
      }}
    />
  )
}

const MyAction = () => {
  const record = useCollectionRecord();
  return (
    <Button onClick={() => {
      console.log(record.data);
    }}>Dialog</Button>
  )
}
```
