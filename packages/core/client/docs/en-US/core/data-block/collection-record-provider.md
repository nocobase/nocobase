# CollectionRecordProvider

Used to provide instances of [CollectionRecord](./collection-record).

## Component

- Type

```tsx | pure
interface CollectionRecordProviderProps<DataType = {}, ParentDataType = {}> {
  isNew?: boolean;
  record?: CollectionRecord<DataType, ParentDataType> | DataType;
  parentRecord?: CollectionRecord<ParentDataType> | DataType;
  /**
  * The collection name to which the current record belongs
   */
  collectionName?: string;
}
```

- Details

The specific description of the parameters can be found in [CollectionRecord](./collection-record).

It should be noted that both `record` and `parentRecord` can be either plain objects or instances of [CollectionRecord](./collection-record). However, they will ultimately be converted to `CollectionRecord` instances and passed to child components through context.

## Example

- The `record` parameter is an instance of `CollectionRecord`.

```tsx | pure
import { CollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

<CollectionRecordProvider record={record} />
// The data passed to child components is: props.record
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

- The `record` parameter is a plain object.

```tsx | pure
<CollectionRecordProvider record={{ id: 1, name: 'foo' }} />
// The data passed to child components is: const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });
```

```tsx
import { useCollectionRecord, CollectionRecordProvider } from '@nocobase/client';

const Demo = () => {
  const record = useCollectionRecord();
  return <pre>{JSON.stringify(record, null, 2)}</pre>;
}

export default () => <CollectionRecordProvider record={{ id: 1, name: 'foo' }}><Demo /></CollectionRecordProvider>
```

- The `record` parameter is an instance of `CollectionRecord` with a parent record.

```tsx | pure
const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

<CollectionRecordProvider record={record} />
// The data passed to child components is: props.record
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

- The `record` parameter is an instance of `CollectionRecord`, and the parent record is passed through the `parentRecord` parameter.

```tsx | pure
const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

<CollectionRecordProvider record={record} parentRecord={parentRecord} />

// First, set the parent record: record.setParentRecord(parentRecord);
// The data passed to child components is: record (with parent record)
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

- The `record` parameter is a plain object, and the parent record is also a plain object.

```tsx | pure
<CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }} />

// First, instantiate the parent record: const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
// Then, instantiate the record: const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });
// Finally, set the parent record: record.setParentRecord(parentRecord);
// The data passed to child components is: record (with parent record)
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

Used to retrieve the data record passed by the `CollectionRecordProvider` component.

- Example

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

Directly accessing the `data` property of CollectionRecord is equivalent to `useCollectionRecord().data`.

- Example

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

Directly accessing the `parentRecord` data of CollectionRecord is equivalent to `useCollectionRecord().parentRecord`.

- Example

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

Directly accessing the `parentRecord.data` of CollectionRecord is equivalent to `useCollectionRecord().parentRecord.data`.

- Example

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
