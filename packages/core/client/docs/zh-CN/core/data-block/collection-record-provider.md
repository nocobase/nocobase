# CollectionRecordProvider

用于提供 [CollectionRecord](./collection-record) 实例。

## 组件

- 类型

```tsx | pure
interface CollectionRecordProviderProps<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  record?: CollectionRecord<DataType, ParentDataType> | DataType;
  parentRecord?: CollectionRecord<ParentDataType> | DataType;
  /**
   * 当前记录所属的 collection name
   */
  collectionName?: string;
}
```

- 详解

参数的具体说明参见 [CollectionRecord](./collection-record)。

需要说明的是 `record` 和 `parentRecord` 即可以是普通的对象，也可以是 [CollectionRecord](./collection-record) 实例，但最终会转为 `CollectionRecord` 实例，并通过 context 传递给子组件。

## 示例

- record 参数为 CollectionRecord 实例

```tsx | pure
import { CollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

<CollectionRecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx
import { CollectionRecord, useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

const Demo = () => {
  const record = useCollectionRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <CollectionRecordProvider record={record}><Demo /></CollectionRecordProvider>
```

- record 参数为普通对象

```tsx | pure
<CollectionRecordProvider record={{ id: 1, name: 'foo' }} />
// 最终向子组件传递的数据为： const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });
```

```tsx
import { useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useCollectionRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }}><Demo /></CollectionRecordProvider>
```

- record 参数为 CollectionRecord 实例且带有父记录

```tsx | pure
const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

<CollectionRecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx
import { CollectionRecord, useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

const Demo = () => {
  const record = useCollectionRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <CollectionRecordProvider record={record}><Demo /></CollectionRecordProvider>
```

- record 参数为 CollectionRecord 实例，父记录通过 `parentRecord` 参数传递

```tsx | pure
const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

<CollectionRecordProvider record={record} parentRecord={parentRecord} />

// 首先设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```

```tsx
import { CollectionRecord, useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

const Demo = () => {
  const record = useCollectionRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <CollectionRecordProvider record={record} parentRecord={parentRecord}><Demo /></CollectionRecordProvider>
```

- record 参数为普通对象，父记录也是普通对象

```tsx | pure
<CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} />

// 首先实例化父记录：const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
// 然后实例化记录：const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });
// 最后设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```


```tsx
import { useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useCollectionRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></CollectionRecordProvider>
```

## Hooks

### useCollectionRecord()

用于获取 `CollectionRecordProvider` 组件传递的数据记录。

- 示例

```tsx | pure
const record = useCollectionRecord();

console.log(record, record.data, record.parentRecord, record.parentRecord.data);
```

```tsx
import { useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useCollectionRecord();
  return <div>
    <div>record: <pre>{JSON.stringify(record, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.data: <pre>{JSON.stringify(record.data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord: <pre>{JSON.stringify(record.parentRecord, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord.data: <pre>{JSON.stringify(record.parentRecord.data, null, 2)}</pre></div>
  </div>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></CollectionRecordProvider>
```

### useCollectionRecordData()

直接获取 CollectionRecord 的 `data` 属性，等同于 `useCollectionRecord().data`。

- 示例

```tsx | pure
const data = useCollectionRecordData();
const record = useCollectionRecord();
console.log(data === record.data);
```

```tsx
import { useCollectionRecord, useCollectionRecordData, CollectionRecordProvider } from '@nocobase/client';

const Demo = () => {
  const data = useCollectionRecordData();
  const record = useCollectionRecord();
  return <div>
    <div>data === record.data: { JSON.stringify(data === record.data) }</div>
    <div style={{ marginTop: 10 }}>data: <pre>{JSON.stringify(data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.data: <pre>{JSON.stringify(record.data, null, 2)}</pre></div>
  </div>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }} ><Demo /></CollectionRecordProvider>
```

### useCollectionParentRecord()

直接获取 CollectionRecord 的数据 `parentRecord`，等同于 `useCollectionRecord().parentRecord`。

- 示例

```tsx | pure
const parentRecord = useCollectionParentRecord();
const record = useCollectionRecord();
console.log(parentRecord === record.parentRecord);
```

```tsx
import { useCollectionRecord, useCollectionParentRecord, CollectionRecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useCollectionRecord();
  const parentRecord = useCollectionParentRecord();
  return <div>
    <div>parentRecord === record.parentRecord: { JSON.stringify(parentRecord === record.parentRecord) }</div>
    <div style={{ marginTop: 10 }}>parentRecord: <pre>{JSON.stringify(parentRecord, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord: <pre>{JSON.stringify(record.parentRecord, null, 2)}</pre></div>
  </div>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></CollectionRecordProvider>
```


### useCollectionParentRecordData()

直接获取 CollectionRecord 的数据 `parentRecord.data`，等同于 `useCollectionRecord().parentRecord.data`。

- 示例

```tsx | pure
const record = useCollectionRecord();
const parentData = useCollectionParentRecordData();
const parentRecord = useCollectionParentRecord();
console.log(parentData === parentRecord.data === record.parentRecord.data);
```

```tsx
import { useCollectionRecord, CollectionRecordProvider, useCollectionParentRecordData, useCollectionParentRecord } from '@nocobase/client';

const Demo = () => {
  const record = useCollectionRecord();
  const parentData = useCollectionParentRecordData();
  const parentRecord = useCollectionParentRecord();
  return <div>
    <div style={{ marginTop: 10 }}>parentData: <pre>{JSON.stringify(parentData, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>parentRecord.data: <pre>{JSON.stringify(parentRecord.data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord.data: <pre>{JSON.stringify(record.parentRecord.data, null, 2)}</pre></div>
  </div>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></CollectionRecordProvider>
```
