# RecordProvider

用于提供 [Record](/core/collection/record) 实例。

## 组件

- 类型

```tsx | pure
interface RecordProviderProps<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  record?: RecordV2<DataType, ParentDataType> | DataType;
  parentRecord?: RecordV2<ParentDataType> | DataType;
}
```

- 详解

参数的具体说明参见 [Record](/core/collection/record)。

需要说明的是 `record` 和 `parentRecord` 即可以是普通的对象，也可以是 [Record](/core/collection/record) 实例，但最终会转为 `RecordV2` 实例，并通过 context 传递给子组件。

## 示例

- record 参数为 Record 实例

```tsx | pure
import { RecordV2, RecordProviderV2 } from '@nocobase/client';

const record = new RecordV2({ data: { id: 1, name: 'foo' } });

<RecordProviderV2 record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx
import { RecordV2, useRecordV2, RecordProviderV2 } from '@nocobase/client';

const record = new RecordV2({ data: { id: 1, name: 'foo' } });

const Demo = () => {
  const record = useRecordV2();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProviderV2 record={record}><Demo /></RecordProviderV2>
```

- record 参数为普通对象

```tsx | pure
<RecordProvider record={{ id: 1, name: 'foo' }} />
// 最终向子组件传递的数据为： const record = new RecordV2({ data: { id: 1, name: 'foo' } });
```

```tsx
import { useRecordV2, RecordProviderV2 } from '@nocobase/client';

const Demo = () => {
  const record = useRecordV2();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProviderV2 record={{ id: 1, name: 'foo' }}><Demo /></RecordProviderV2>
```

- record 参数为 Record 实例且带有父记录

```tsx | pure
const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
const record = new RecordV2({ data: { id: 1, name: 'foo' }, parentRecord });

<RecordProvider record={record} />
// 最终向子组件传递的数据为： props.record
```

```tsx
import { RecordV2, useRecordV2, RecordProviderV2 } from '@nocobase/client';

const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
const record = new RecordV2({ data: { id: 1, name: 'foo' }, parentRecord });

const Demo = () => {
  const record = useRecordV2();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProviderV2 record={record}><Demo /></RecordProviderV2>
```

- record 参数为 Record 实例，父记录通过 `parentRecord` 参数传递

```tsx | pure
const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
const record = new RecordV2({ data: { id: 1, name: 'foo' } });

<RecordProvider record={record} parentRecord={parentRecord} />

// 首先设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```

```tsx
import { RecordV2, useRecordV2, RecordProviderV2 } from '@nocobase/client';

const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
const record = new RecordV2({ data: { id: 1, name: 'foo' } });

const Demo = () => {
  const record = useRecordV2();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProviderV2 record={record} parentRecord={parentRecord}><Demo /></RecordProviderV2>
```

- record 参数为普通对象，父记录也是普通对象

```tsx | pure
<RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} />

// 首先实例化父记录：const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
// 然后实例化记录：const record = new RecordV2({ data: { id: 1, name: 'foo' } });
// 最后设置父记录：record.setParentRecord(parentRecord);
// 最终向子组件传递的数据为：record（带有父记录）
```


```tsx
import { useRecordV2, RecordProviderV2 } from '@nocobase/client';

const Demo = () => {
  const record = useRecordV2();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <RecordProviderV2 record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProviderV2>
```

## Hooks

### useRecordV2()

用于获取 `RecordProvider` 组件传递的数据记录。

- 示例

```tsx | pure
const record = useRecordV2();

console.log(record, record.data, record.parentRecord, record.parentRecord.data);
```

```tsx
import { useRecordV2, RecordProviderV2 } from '@nocobase/client';

const Demo = () => {
  const record = useRecordV2();
  return <div>
    <div>record: <pre>{JSON.stringify(record, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.data: <pre>{JSON.stringify(record.data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord: <pre>{JSON.stringify(record.parentRecord, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord.data: <pre>{JSON.stringify(record.parentRecord.data, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProviderV2 record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProviderV2>
```

### useRecordDataV2()

直接获取 Record 的 `data` 属性，等同于 `useRecordV2().data`。

- 示例

```tsx | pure
const data = useRecordDataV2();
const record = useRecordV2();
console.log(data === record.data);
```

```tsx
import { useRecordV2, useRecordDataV2, RecordProviderV2 } from '@nocobase/client';

const Demo = () => {
  const data = useRecordDataV2();
  const record = useRecordV2();
  return <div>
    <div>data === record.data: { JSON.stringify(data === record.data) }</div>
    <div style={{ marginTop: 10 }}>data: <pre>{JSON.stringify(data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.data: <pre>{JSON.stringify(record.data, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProviderV2 record={{ id: 1, name: 'foo' }} ><Demo /></RecordProviderV2>
```

### useParentRecordV2()

直接获取 Record 的数据 `parentRecord`，等同于 `useRecordV2().parentRecord`。

- 示例

```tsx | pure
const parentRecord = useParentRecordV2();
const record = useRecordV2();
console.log(parentRecord === record.parentRecord);
```

```tsx
import { useRecordV2, useParentRecordV2, RecordProviderV2 } from '@nocobase/client';

const Demo = () => {
  const record = useRecordV2();
  const parentRecord = useParentRecordV2();
  return <div>
    <div>parentRecord === record.parentRecord: { JSON.stringify(parentRecord === record.parentRecord) }</div>
    <div style={{ marginTop: 10 }}>parentRecord: <pre>{JSON.stringify(parentRecord, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord: <pre>{JSON.stringify(record.parentRecord, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProviderV2 record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProviderV2>
```


### useParentRecordDataV2()

直接获取 Record 的数据 `parentRecord.data`，等同于 `useRecordV2().parentRecord.data`。

- 示例

```tsx | pure
const record = useRecordV2();
const parentData = useParentRecordDataV2();
const parentRecord = useParentRecordV2();
console.log(parentData === parentRecord.data === record.parentRecord.data);
```

```tsx
import { useRecordV2, RecordProviderV2, useParentRecordDataV2, useParentRecordV2 } from '@nocobase/client';

const Demo = () => {
  const record = useRecordV2();
  const parentData = useParentRecordDataV2();
  const parentRecord = useParentRecordV2();
  return <div>
    <div style={{ marginTop: 10 }}>parentData: <pre>{JSON.stringify(parentData, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>parentRecord.data: <pre>{JSON.stringify(parentRecord.data, null, 2)}</pre></div>
    <div style={{ marginTop: 10 }}>record.parentRecord.data: <pre>{JSON.stringify(record.parentRecord.data, null, 2)}</pre></div>
  </div>;
}

export default () => <RecordProviderV2 record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} ><Demo /></RecordProviderV2>
```
