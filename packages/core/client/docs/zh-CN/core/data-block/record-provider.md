# RecordProvider

用于提供 [Record](./record) 实例。

## 组件

- 类型

```tsx | pure
interface RecordProviderProps<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  record?: Record<DataType, ParentDataType> | DataType;
  parentRecord?: Record<ParentDataType> | DataType;
  /**
   * 当前记录所属的 collection name
   */
  collectionName?: string;
}
```

- 详解

参数的具体说明参见 [Record](./record)。

需要说明的是 `record` 和 `parentRecord` 即可以是普通的对象，也可以是 [Record](./record) 实例，但最终会转为 `Record` 实例，并通过 context 传递给子组件。

## 示例

- record 参数为 Record 实例

```tsx | pure
import { Record, RecordProvider } from '@nocobase/client';

const record = new Record({ data: { id: 1, name: 'foo' } });

<RecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx
import { Record, useRecord, RecordProvider } from '@nocobase/client';

const record = new Record({ data: { id: 1, name: 'foo' } });

const Demo = () => {
  const record = useRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProvider record={record}><Demo /></RecordProvider>
```

- record 参数为普通对象

```tsx | pure
<RecordProvider record={{ id: 1, name: 'foo' }} />
// 最终向子组件传递的数据为： const record = new Record({ data: { id: 1, name: 'foo' } });
```

```tsx
import { useRecord, RecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProvider record={{ id: 1, name: 'foo' }}><Demo /></RecordProvider>
```

- record 参数为 Record 实例且带有父记录

```tsx | pure
const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
const record = new Record({ data: { id: 1, name: 'foo' }, parentRecord });

<RecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx
import { Record, useRecord, RecordProvider } from '@nocobase/client';

const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
const record = new Record({ data: { id: 1, name: 'foo' }, parentRecord });

const Demo = () => {
  const record = useRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProvider record={record}><Demo /></RecordProvider>
```

- record 参数为 Record 实例，父记录通过 `parentRecord` 参数传递

```tsx | pure
const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
const record = new Record({ data: { id: 1, name: 'foo' } });

<RecordProvider record={record} parentRecord={parentRecord} />

// 首先设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```

```tsx
import { Record, useRecord, RecordProvider } from '@nocobase/client';

const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
const record = new Record({ data: { id: 1, name: 'foo' } });

const Demo = () => {
  const record = useRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProvider record={record} parentRecord={parentRecord}><Demo /></RecordProvider>
```

- record 参数为普通对象，父记录也是普通对象

```tsx | pure
<RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} />

// 首先实例化父记录：const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
// 然后实例化记录：const record = new Record({ data: { id: 1, name: 'foo' } });
// 最后设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```


```tsx
import { useRecord, RecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProvider>
```

## Hooks

### useRecord()

用于获取 `RecordProvider` 组件传递的数据记录。

- 示例

```tsx | pure
const record = useRecord();

console.log(record, record.data, record.parentRecord, record.parentRecord.data);
```

```tsx
import { useRecord, RecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useRecord();
  return <div>
    <div>record: <pre>{JSON.stringify(record, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.data: <pre>{JSON.stringify(record.data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord: <pre>{JSON.stringify(record.parentRecord, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord.data: <pre>{JSON.stringify(record.parentRecord.data, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProvider>
```

### useRecordData()

直接获取 Record 的 `data` 属性，等同于 `useRecord().data`。

- 示例

```tsx | pure
const data = useRecordData();
const record = useRecord();
console.log(data === record.data);
```

```tsx
import { useRecord, useRecordData, RecordProvider } from '@nocobase/client';

const Demo = () => {
  const data = useRecordData();
  const record = useRecord();
  return <div>
    <div>data === record.data: { JSON.stringify(data === record.data) }</div>
    <div style={{ marginTop: 10 }}>data: <pre>{JSON.stringify(data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.data: <pre>{JSON.stringify(record.data, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProvider record={{ id: 1, name: 'foo' }} ><Demo /></RecordProvider>
```

### useParentRecord()

直接获取 Record 的数据 `parentRecord`，等同于 `useRecord().parentRecord`。

- 示例

```tsx | pure
const parentRecord = useParentRecord();
const record = useRecord();
console.log(parentRecord === record.parentRecord);
```

```tsx
import { useRecord, useParentRecord, RecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useRecord();
  const parentRecord = useParentRecord();
  return <div>
    <div>parentRecord === record.parentRecord: { JSON.stringify(parentRecord === record.parentRecord) }</div>
    <div style={{ marginTop: 10 }}>parentRecord: <pre>{JSON.stringify(parentRecord, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord: <pre>{JSON.stringify(record.parentRecord, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProvider>
```


### useParentRecordData()

直接获取 Record 的数据 `parentRecord.data`，等同于 `useRecord().parentRecord.data`。

- 示例

```tsx | pure
const record = useRecord();
const parentData = useParentRecordData();
const parentRecord = useParentRecord();
console.log(parentData === parentRecord.data === record.parentRecord.data);
```

```tsx
import { useRecord, RecordProvider, useParentRecordData, useParentRecord } from '@nocobase/client';

const Demo = () => {
  const record = useRecord();
  const parentData = useParentRecordData();
  const parentRecord = useParentRecord();
  return <div>
    <div style={{ marginTop: 10 }}>parentData: <pre>{JSON.stringify(parentData, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>parentRecord.data: <pre>{JSON.stringify(parentRecord.data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord.data: <pre>{JSON.stringify(record.parentRecord.data, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProvider>
```
