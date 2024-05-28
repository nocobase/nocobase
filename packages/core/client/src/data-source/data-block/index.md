# DataBlockProvider

DataBlockProvider 是数据区块的装饰器，通过DataBlockProvider 对数据进行管理。

```ts
interface AllDataBlockProps {
  collection: string | CollectionOptions;
  association: string;
  dataSource?: string;
  sourceId?: string | number;
  filterByTk: string | number;
  record: CollectionRecord;
  action?: 'list' | 'get';
  params?: {
    filterByTk?: string | number;
    [index: string]: any;
  };
  parentRecord?: CollectionRecord;
  requestService?: UseRequestService<any>;
  requestOptions?: UseRequestOptions;
  dataLoadingMode?: 'auto' | 'manual';
  [index: string]: any;
}

```

