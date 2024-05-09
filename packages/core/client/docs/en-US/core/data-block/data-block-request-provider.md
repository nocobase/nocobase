# DataBlockRequestProvider

It internally retrieves the `resource` provided by [BlockResourceProvider](/core/data-block/data-block-resource-provider), and based on the parameters provided by [BlockProvider](/core/data-block/data-block-provider), automatically calls `resource.get()` or `resource.list()` to obtain the block data, which is then passed down through the context.

## Request Parameters

The request parameters are obtained from the `params` and `filterByTk` within the `DataBlockProvider`.

```ts | pure
const schema = {
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    'collection': 'users',
    'action': 'list',
    // Static props
    params: {
      pageSize: 10,
    }
  },
  // Dynamic props
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

It will automatically call `resource.list()` to fetch the data, making a `GET` request to `/api/users:list?pageSize=10&size=15`.

## Hooks

### useDataBlockRequest()

Used to obtain the request object, typically within block components.

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

### Get Request

For `GET` requests, once the `data` is retrieved, a `record` object is provided through `CollectionRecordProvider`, which is used to obtain the data for the current block.

```ts | pure
const schema = {
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    'collection': 'users',
    'action': 'get', // get request
  },
  // Dynamic props
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

It will automatically invoke `resource.get()` to retrieve data, making a `GET` request to `/api/users:get/1`, and provide the context through `CollectionRecordProvider`.

```tsx | pure
const { data } = useDataBlockRequest();
const record = useCollectionRecord(); // record context data

record.data === data;
```

### List Request

For `list` requests, a `record` object will not be provided, and you will need to set the context yourself using `<CollectionRecordProvider />`.

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
